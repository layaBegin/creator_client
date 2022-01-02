import messageCallback = require('../Shared/MessageCallback');
import roomAPI = require('../API/RoomAPI');
import utils = require("../Shared/utils");
import constant = require('../Shared/Constant');

enum PomeloEvent {
    /**
     * 重连事件，此事件的触发必须在 init 时指定重连属性
     */
    RECONNECT = "reconnect",
    /**
     * 连接时发生错误
     */
    IO_ERROR = "io-error",
    /**
     * 握手发生错误
     */
    ERROR = "error",
    /**
     * 连接断开 同时触发 “disconnect”
     */
    CLOSE = "close",
    /**
     * 连接断开 先触发 "close"
     */
    DISCONNECT = "disconnect",

    /**
     * 心跳超时
     */
    HEARTBEAT_TIMEOUT = "heartbeat timeout",
    /**
     * 被踢除 这个貌似是服务端主动发起的事件
     */
    ONKICK = "onKick",
}

//let pomelo = (<any>window).pomelo;

enum NetworkStatus {
    /**
     * 没有连接
     */
    NONE = 0,
    /**
     * 正在连接
     */
    CONNECTING = 1,
    /**
     * 已经连接
     */
    CONNECTED = 2
}

export class NetworkManager {
    isAutoReconnect: boolean = true;    // 默认断线后自动重连
    status: NetworkStatus = NetworkStatus.NONE;

    connectCB: any = undefined;

    constructor() {
        this.sendSync = this.requestSync;
    }
    reset() {
        messageCallback.removeListener('PopDialogContentPush', this);
        messageCallback.removeListener('PopDialogTextPush', this);
        cc.game.off(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);
    }
    init(host: string, port: string, token: string, callback: any) {
        this.connectCB = callback;
        pomelo.removeAllListeners();    // 移除所有网络监听事件
        cc.game.off(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.off(cc.game.EVENT_SHOW, this.onGameShow, this);
        pomelo.init({
            host: host,
            port: port,
            // log: true,
            // reconnect: true,
            // maxReconnectAttempts: 30,
        }, (ws: WebSocket) => {
            this.onOpen(ws, token);
            token = undefined;
        });
        this.status = NetworkStatus.CONNECTING;
        cc.game.on(cc.game.EVENT_HIDE, this.onGameHide, this);
        cc.game.on(cc.game.EVENT_SHOW, this.onGameShow, this);

        pomelo.on(PomeloEvent.IO_ERROR, this.onError.bind(this));
        pomelo.on(PomeloEvent.ERROR, this.onError.bind(this));
        pomelo.on(PomeloEvent.CLOSE, this.onClose.bind(this));

        messageCallback.addListener('PopDialogContentPush', this);
        messageCallback.addListener('PopDialogTextPush', this);

        // 监听服务器下发的 pomele 消息
        pomelo.on("ServerMessagePush", this.onMessage.bind(this));
    };
    async connect(host: string, port: string, token: string) {
        return new Promise<BaseReturn>((resolve) => {
            this.init(host, port, token, function (retData) {

                resolve(retData);
            });
        });
    }
    async reconnect() {

        let data = Global.CCHelper.getAccount();
        if (data) {
            let retData = await API.http.login(data.account, data.password);
            if (retData.code != OK) {
                return retData.code;
            }
            else {
                return OK;
            }
        }
        else {
            return 999;
        }

    }
    autoReconnect() {
        let MaxCount = 10;
        let interval = 1000;
        let count = 0;
        Waiting.show("正在尝试重新连接...");
        let doConnect = () => {
            setTimeout(async () => {
                count++;
                Waiting.show("正在尝试重新连接..." + count + "/10", true);

                let code = await this.reconnect();
                if (code != OK) {
                    if (code == 999 || count >= MaxCount) {
                        console.log("Net::", "需要重新登入")
                        Confirm.show("与服务器断开连接，请重新登录", () => {
                            cc.director.loadScene("Login");
                        })
                    }
                    else {
                        console.log("Net::", interval + " 毫秒后再次重连", count);
                        doConnect();
                    }
                }
                else {
                    console.log("Net::", "重连成功");
                    Waiting.hide(99);
                }
            }, interval);
        }

        if (this.isAutoReconnect) {
            doConnect();
        }
    }

    onMessage(data: BaseReturn) {
        if (!data.pushRouter) {
            console.error("Net::", 'ServerMessagePush push router is invalid:' + data);
            return;
        }
        if (CC_DEBUG) {
            if (this.isDisplayLog(data)) {
                console.log("Net::", 'onMessage:' + data.pushRouter);
                console.log(data);
            }
        }
        if (data.pushRouter == "RoomMessagePush" && data.type == 418) {
            let timeout = API.room.roomMessageNotify.prototype.timeout;
            if (timeout) {
                clearTimeout(timeout);
                timeout = undefined;
            }
        }
        // 广播服务器下发消息
        messageCallback.emitMessage(data.pushRouter, data);
    }
    messageCallbackHandler(router: string, data: BaseReturn) {
        if (router === 'PopDialogContentPush') {
            if (!!Global.Code[data.code]) {
                Confirm.show(Global.Code[data.code]);
            } else {
                Confirm.show('游戏错误，错误码：' + data.code);
            }
        } else if (router === 'PopDialogTextPush') {
            Confirm.show(data.text);
        }
    };

    async onOpen(ws: WebSocket, token: string) {
        this.status = NetworkStatus.CONNECTED;
        if (typeof token === "string" && token.length >= 64 /* 实际上 token.length==96 */) {
            let retData = await API.hall.entry(token, undefined);
            if (retData.code == Global.Code.OK) {
                Global.Player.init(retData.msg.userInfo);
                Global.Player.setPy("newMail", retData.msg.newMail);

                if (Global.Data.getData('isOpenSystemNotice') == "true") {
                    Global.isOpenSystemNotice = true
                } else {
                    Global.isOpenSystemNotice = false
                }
                if (typeof this.connectCB == "function") {
                    this.connectCB(retData);
                    this.connectCB = undefined;
                }

                Global.MessageCallback.emitMessage('ReConnectSuccess');
            }
            else {
                NetworkMgr.disconnect(false);

                // Confirm.show("进入大厅失败");    // 在请求内部已经自动处理了错误
                if (typeof this.connectCB == "function") {
                    this.connectCB(retData);
                    this.connectCB = undefined;
                }
            }
        }
    }

    onError(event: any) {
        this.status = NetworkStatus.NONE;
        if (typeof this.connectCB == "function") {
            this.connectCB(undefined);
            this.connectCB = undefined;
        }

    }
    onClose(event: any) {
        this.status = NetworkStatus.NONE;
        console.warn("Net::", "网络断开连接... " + this.isAutoReconnect);
        if (!this.isAutoReconnect) {
            console.log("Net::");
            return;
        }
        if (this.status != NetworkStatus.NONE) {
            console.warn("Net::", "当前 socket 不是断开状态 不需要重连");
            return;
        }
        this.autoReconnect();
    }
    onHeartBeatTimeOut() {

    }
    onGameHide() {
        let scene = cc.director.getScene();
        if ((/* scene.name == "Hall" || */ scene.name == "GameTemp")) {
            if (this.status == 2) {
                this.disconnect(false);                         // 断开并且不自动重连
            }
        }
    }
    onGameShow() {
        let scene = cc.director.getScene();
        if ((/* scene.name == "Hall" || */ scene.name == "GameTemp")) {
            if (this.status == NetworkStatus.CONNECTED) {
                this.disconnect(true);  // 断开并自动重连
            }
            else {
                if (this.status == NetworkStatus.NONE) {
                    this.isAutoReconnect = true;
                    this.onClose(undefined);     //自动重连
                }
            }
        }
    }

    disconnect(isAutoReconnect: boolean = false) {
        console.warn("Net::", "主动断开网络连接. 是否自动重连::" + isAutoReconnect);
        this.isAutoReconnect = isAutoReconnect;
        pomelo.disconnect();
    };

    request(route: string, msg: any, cbSuccess?: Function, cbFail?: Function) {
        console.log("Net::", 'Send:' + route);
        console.log("Net::", msg);
        pomelo.request(route, msg, function (data) {
            console.log("Net::", 'Receive:' + (((typeof cbSuccess) === 'string') ? cbSuccess : route));
            console.log("Net::", data);

            if (data.code !== Global.Code.OK) {
                Waiting.hide();

                if (typeof (cbFail) === 'function') {
                    cbFail(data);
                    return;
                }
                if (!!Global.Code[data.code]) {
                    Confirm.show(Global.Code[data.code]);
                } else {
                    Confirm.show('游戏错误，错误码：' + data.code);
                }
            } else {
                if (!!cbSuccess) {
                    if (typeof (cbSuccess) === 'function') {
                        cbSuccess(data);
                    } else {
                        messageCallback.emitMessage(cbSuccess, data);
                    }
                }
            }
        });
    };
    send(route: string, msg: any, cbSuccess: Function, cbFail: Function) {
        this.request(route, msg, cbSuccess, cbFail);
    };

    async requestSync(route: string, msg: any, filterError: boolean = true) {
        try {
            console.log("Net::", 'Send:' + route);
            console.log("Net::", msg);
            return new Promise<BaseReturn>((resolve) => {
                pomelo.request(route, msg, (data: BaseReturn) => {
                    console.log("Net::", 'Receive:' + route);
                    console.log("Net::", data);
                    // 自动处理错误
                    if (data.code != Global.Code.OK && filterError) {
                        this.onCodeError(data.code);
                    }
                    resolve(data);
                })
            })
        } catch (error) {
            console.error("Net::", error);
            return <BaseReturn>{ code: 999 };
        }
    }
    sendSync = this.requestSync;


    notify(route: string, msg: any) {
        console.log("Net::", 'Notify:' + route);
        console.log("Net::", msg);
        pomelo.notify(route, msg);
    };

    onCodeError(code: number) {
        if (!!Global.Code[code]) {
            Confirm.show(Global.Code[code]);
        } else {
            Confirm.show('游戏错误，错误码：' + code);
        }
    }

    addReceiveListen(route: string, cbRoute: Function | string) {
        cbRoute = cbRoute || route;
        let pushCallback = function (msg) {
            if (!!cbRoute) {
                if (CC_DEBUG && msg.pushRouter != "BroadcastPush") { // 不打印轮播公告 有需要可开启
                    console.log("Net::", 'push:' + cbRoute);
                    console.log("Net::", msg);
                }
                if (msg.pushRouter == "RoomMessagePush" && msg.type == 418) {
                    let timeout = roomAPI.roomMessageNotify.prototype.timeout;
                    if (timeout) {
                        clearTimeout(timeout);
                        timeout = undefined;
                    }
                }

                messageCallback.emitMessage(cbRoute, msg);
            }
        };
        pomelo.on(route, pushCallback);
        return pushCallback;
    };

    removeListener(route: string, callback: Function) {
        pomelo.removeListener(route, callback);
    };

    removeAllListeners() {
        pomelo.removeAllListeners();
    };

    isDisplayLog(data: BaseReturn) {
        if (data.pushRouter == "BroadcastPush") {
            return false;
        }
        if ((Matching.kindId == 410 || Matching.kindId == 412) && data.type == 405 && data.pushRouter == "GameMessagePush") {
            return false;
        }

        return true;
    }



    async httpRequestSync(route: string, method: "GET" | "POST", data: any, cbSuccess?: any, cbFail?: any, filterError: boolean = true) {
        let url = constant.gameServerAddress + route;
        let params = {
            url: url,
            method: method,
            data: data,
            cb: function (err: any, response: BaseReturn) {
                if (!!err) {
                    if (!!cbFail) {
                        utils.invokeCallback(cbFail);
                    } else {
                        Waiting.hide();
                        Confirm.show("网络异常，请检查网络连接");
                    }
                } else {
                    if (response.code !== 0) {
                        if (!!cbFail) {
                            utils.invokeCallback(cbFail, response);
                        } else {
                            Waiting.hide();
                            Confirm.show(Global.Code[response.code] + "");
                        }
                    } else {
                        utils.invokeCallback(cbSuccess, response);
                    }
                }
            }
        }
        if (typeof cbSuccess !== "function" && typeof cbFail !== "function") {
            delete params.cb;
        }

        let retData = await httpRequestSync(params);
        if (retData && filterError && !params.cb && retData.code != Global.Code.OK) {
            this.onCodeError(retData.code);
        }

        return retData || {};
    }
}
interface HttpRequestParams {
    url?: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    async?: boolean;
    data?: any;
    responseType?: "text" | "json" | "arraybuffer" | "blob" | "document" /* | "ms-stream" */;
    withCredentials?: boolean;
    timeout?: number;
    cb?: (err?: any, data?: any) => void;
}
export async function httpRequestSync(params: HttpRequestParams) {
    console.log("Net::", '请求url:', params.url);
    console.log("Net::", '请求数据:', JSON.stringify(params.data));
    try {
        let xhr = new XMLHttpRequest();
        let url = params.url;
        let data = params.data;
        let method = params.method || "GET";
        let async = params.async || true;
        xhr.responseType = params.responseType || 'json';
        xhr.timeout = params.timeout || 20000;
        xhr.withCredentials = params.withCredentials || false;

        return new Promise<any>((resolve) => {
            xhr.onload = function (ev: ProgressEvent) {
                console.log("Net::", '收到数据:', JSON.stringify(xhr.response));
                if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                    utils.invokeCallback(params.cb, null, xhr.response);

                    resolve(xhr.response || xhr.responseText || "OK");
                } else {
                    cc.error("请求失败：status=" + xhr.status);
                    utils.invokeCallback(params.cb, "请求失败");
                    resolve(undefined);
                }
            };
            xhr.ontimeout = function (ev: ProgressEvent) {
                // XMLHttpRequest 超时。在此做某事。
                cc.error("请求超时: ", ev.loaded + " bytes 已传输 ");
                utils.invokeCallback(params.cb, "请求超时");
                resolve(undefined);

            };
            xhr.onerror = function (ev: ProgressEvent) {
                cc.error("请求错误: ", ev.loaded + " bytes 已传输 ");
                utils.invokeCallback(params.cb, "请求错误");
                resolve(undefined);

            };
            xhr.onabort = function (ev: ProgressEvent) {
                cc.error("请求被终止::" + url);
                utils.invokeCallback(params.cb, "请求终止");
                resolve(undefined);

            }


            xhr.open(method, url, async);
            xhr.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
            let sData = "";
            if (data && typeof data == "object") {
                for (let key in data) {
                    if (data.hasOwnProperty(key)) {
                        if (sData.length > 0) {
                            sData += "&";
                        }
                        sData += (key + "=" + data[key]);
                    }
                }
            } else if (typeof data === "string") {
                console.error("Net::", "http请求 不支持 string 参数");
            }

            if (sData.length > 0) {
                xhr.send(sData);
            } else {
                xhr.send();
            }
        });
    } catch (error) {
        console.error("Net::", error);
        return undefined;
    }
}
