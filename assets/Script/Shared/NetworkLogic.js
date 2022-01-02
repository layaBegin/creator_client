// var networkManager = require('./NetworkManager_old');
var networkManager = undefined
var messageCallback = require('./MessageCallback');
var dialogManager = require('./DialogManager');
var constant = require('./Constant');
var utils = require('./utils');
var code = require('./code');

var NetworkLogic = module.exports;
NetworkLogic.status = 0;    // 0 1 2 未连接(断开连接) 正在连接 连接完成

NetworkLogic.isManualCloseServerConnection = false;

NetworkLogic.init = function () {
    networkManager = NetworkMgr;

    NetworkLogic.status = 0;
    NetworkLogic.isManualCloseServerConnection = false;
    /// 添加事件监听
    messageCallback.addListener('ServerDisconnection', this);
    messageCallback.addListener('ServerMessagePush', this);
    messageCallback.addListener('PopDialogContentPush', this);

    networkManager.removeAllListeners();
    /// 服务器推送消息监听
    // 监听断开信息
    networkManager.addReceiveListen('close', 'ServerDisconnection');
    // 推送消息
    networkManager.addReceiveListen('ServerMessagePush', 'ServerMessagePush');

    cc.game.on(cc.game.EVENT_HIDE, NetworkLogic.onGameHide);
    cc.game.on(cc.game.EVENT_SHOW, NetworkLogic.onGameShow);
};
NetworkLogic.onGameHide = function () {
    let scene = cc.director.getScene();
    if ((/* scene.name == "Hall" || */ scene.name == "GameTemp")) {
        if (NetworkLogic.status == 2) {     // 根据实际需求追加判断 此处的场景表示需要联网的场景 比如在 Login 场景就不需要联网
            NetworkLogic.disconnect(false);                         // 断开并且不自动重连
        }
    }
}
NetworkLogic.onGameShow = function () {
    let scene = cc.director.getScene();
    if ((/* scene.name == "Hall" || */ scene.name == "GameTemp")) {
        if (NetworkLogic.status == 2) {
            NetworkLogic.disconnect(true);  // 断开并自动重连
        }
        else {
            if (NetworkLogic.status == 0) {     // 根据实际需求追加判断 此处的场景表示需要联网的场景 比如在 Login 场景就不需要联网
                NetworkLogic.isManualCloseServerConnection = false;
                messageCallback.emitMessage("ServerDisconnection");     //自动重连
            }
        }
    }
}

NetworkLogic.deInit = function () {
    NetworkLogic.status = 0;
    /// 移除事件监听
    messageCallback.removeListener('ServerDisconnection', this);
    messageCallback.removeListener('ServerMessagePush', this);
    messageCallback.removeListener('PopDialogContentPush', this);

    cc.game.off(cc.game.EVENT_HIDE, NetworkLogic.onGameHide);
    cc.game.off(cc.game.EVENT_SHOW, NetworkLogic.onGameShow);
};

NetworkLogic.connectToServer = function (host, port, token, cbSuccess, cbFail) {
    networkManager.init({
        host: host,
        port: port
    }, (ws) => { // 此回调为 pomelo 握手成功后的回调 会始终保持在 pomelo 上下文中 pomelo 自动重连会触发此回调
        NetworkLogic.status = 2;
        if (typeof token === "string" && token.length >= 64 /* 实际上 token.length==96 */) {
            NetworkLogic.loginHall(token, null, cbSuccess, cbFail);
        } else { // pomelo 自动重连 才会进 
            let account = cc.sys.localStorage.getItem('account');
            let password = cc.sys.localStorage.getItem('password');
            let loginPlatform = parseInt(cc.sys.localStorage.getItem('platform'));
            if (!account || !password || !loginPlatform) {
                Confirm.show("账号不存在,请重新登入", () => {
                    cc.director.loadScene("Login");
                })
                return;
            }
            Global.API.account.login(account, password, loginPlatform, (data) => {
                NetworkLogic.loginHall(data.msg.token, null, () => {
                    Waiting.hide(9);
                });
            })
        }

        token = undefined;
    });
};

NetworkLogic.disconnect = function (autoReconnect) {
    NetworkLogic.isManualCloseServerConnection = !autoReconnect;
    networkManager.disconnect();
};

NetworkLogic.login = function (reqData, cbSuccess, cbFail) {
    Global.API.account.login(reqData.account, reqData.password,
        function (data) {
            // 登录成功
            console.log("账号登入成功 token::" + data.msg.token);
            NetworkLogic.connectToServer(data.msg.serverInfo.host, data.msg.serverInfo.port, data.msg.token, cbSuccess, cbFail);
        },
        cbFail
    );
};

NetworkLogic.register = function (data, cbSuccess, cbFail, registerCallback) {
    Global.API.account.register(data.account, data.password, data.code, data.uniqueID,
        function (data) {
            Global.SDK.openinstall.reportRegister();
            // 登录成功
            console.log("账号注册成功 token:: " + data.msg.server.token)
            utils.invokeCallback(registerCallback, data);
            NetworkLogic.connectToServer(data.msg.server.serverInfo.host, data.msg.server.serverInfo.port, data.msg.server.token, cbSuccess, cbFail);
        },
        cbFail
    );
};

NetworkLogic.loginHall = function (token, userInfo, cbSuccess, cbFail) {
    NetworkLogic.isManualCloseServerConnection = false;
    // API.hall.entry(token, userInfo, cbRouter, cbFail)
    API.hall.entry(token, userInfo, function (data) {
        // //游戏数据初始化
        // Global.Data.init(data.msg.publicParameter);
        //玩家数据初始化
        Global.Player.init(data.msg.userInfo);
        // //游戏类型数据初始化
        // GameConfig.init(data.msg.gameTypes, data.msg.gameLists, data.msg.gameConfig);
        // //游戏VIP等级配置
        // Global.VipConfig.init(data.msg.vipConfig);
        // //代理数据初始化
        // Global.AgentProfit.init(data.msg.agentProfit);
        // //银行数据初始化
        // Global.drawaBankList = data.msg.drawaBankList;

        if (Global.Data.getData('isOpenSystemNotice') == "true") {
            Global.isOpenSystemNotice = true
        } else {
            Global.isOpenSystemNotice = false
        }


        Waiting.hide();

        utils.invokeCallback(cbSuccess, data);

        Global.MessageCallback.emitMessage('ReConnectSuccess');
    }, function (data) {
        // 进入大厅失败，断开服务器
        Waiting.hide(9);
        NetworkLogic.disconnect(false);
        Confirm.show("进入大厅失败");
        utils.invokeCallback(cbFail, data);
        // Confirm.show("进入大厅失败");
    })
};

NetworkLogic.reconnection = function (cb) {
    let data = Global.CCHelper.getAccount()
    if (data) {
        console.log("正在登入账号...")
        NetworkLogic.login({
            account: data.account,
            password: data.password,
            loginPlatform: data.loginPlatform,
            regType: data.regType
        }, function (data) {
            utils.invokeCallback(cb, data);
        }, function () {
            utils.invokeCallback(cb, {
                code: 1
            });
        }, true);
    } else {
        console.log("保存的账号为空需求手动登入...")
        utils.invokeCallback(cb, {
            code: 2
        });
    }

    // let account = cc.sys.localStorage.getItem('account');
    // let password = cc.sys.localStorage.getItem('password');
    // let loginPlatform = parseInt(cc.sys.localStorage.getItem('platform'));
    // if (!account || !password || !loginPlatform) {
    //     console.log("保存的账号为空需求手动登入...")
    //     // dialogManager.addPopDialog("与服务器断开连接，请重新登录", function () {
    //     //     cc.game.restart();
    //     // });
    //     utils.invokeCallback(cb, {
    //         code: 2
    //     });
    // } else {
    //     console.log("正在登入账号...")
    //     NetworkLogic.login({
    //         account: account,
    //         password: password,
    //         loginPlatform: loginPlatform
    //     }, function (data) {
    //         utils.invokeCallback(cb, data);
    //     }, function () {
    //         utils.invokeCallback(cb, {
    //             code: 1
    //         });
    //     }, true);
    // }
};



NetworkLogic.messageCallbackHandler = function (router, data) {
    if (router === 'PopDialogContentPush') {
        if (!!Global.Code[data.code]) {
            Confirm.show(Global.Code[data.code]);
        } else {
            Confirm.show('游戏错误，错误码：' + data.code);
        }
    } else if (router === 'PopDialogTextPush') {
        Confirm.show(data.text);
    } else if (router === 'ServerMessagePush') {
        if (!data.pushRouter) {
            console.error('ServerMessagePush push router is invalid:' + data);
            return;
        }
        messageCallback.emitMessage(data.pushRouter, data);
    } else if (router === 'ServerDisconnection') {
        NetworkLogic.status = 0;
        console.warn("网络断开连接... ", NetworkLogic.isManualCloseServerConnection)
        // 如果不是手动断开则执行断线重连
        if (!NetworkLogic.isManualCloseServerConnection) {
            if (NetworkLogic.status != 0) {     // 如果当前网络状态不是断开的 就不重连 (如果此处不是 0 那一定是1)
                return;
            }
            Waiting.show("正在尝试重新连接...")
            console.log("2秒后 重新连接...")
            let reconnectCount = 1;
            NetworkLogic.status = 1;
            let reconnect = () => {
                setTimeout(function () {
                    console.log("正在重新连接...")
                    Waiting.show("正在尝试重新连接..." + reconnectCount + "/10", true);
                    NetworkLogic.reconnection(function (data) {
                        reconnectCount++;
                        console.log("重新连接返回...", data)
                        if (!data || data.code != 0) {
                            if (data.code == 2 || reconnectCount == 11) { // 没有账号缓存 或者重连超过10次
                                reconnectCount = 0;
                                console.log("需要重新登入")
                                Confirm.show("与服务器断开连接，请重新登录", () => {
                                    cc.director.loadScene("Login");
                                })
                            } else {
                                console.log("===============2秒后再次 重连ing")
                                reconnect();
                            }
                        } else {
                            console.log("连接成功")
                            reconnectCount = 0;
                            Waiting.hide(99); // 重连成功强制关闭 等待
                            NetworkLogic.isManualCloseServerConnection = false;
                        }
                    });
                }, 1000);
            }
            reconnect();
        } else {
            NetworkLogic.isManualCloseServerConnection = false;
        }

    }
};

NetworkLogic.gameServerHttpRequest = function (route, method, data, cbSuccess, cbFail) {
    let url = constant.gameServerAddress + route;
    let params = {
        url: url,
        method: method,
        data: data,
        cb: function (err, response) {
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
                        Confirm.show(code[response.code] + "");
                    }
                } else {
                    utils.invokeCallback(cbSuccess, response);
                }
            }
        }
    };
    Global.CCHelper.httpRequest(params);
};