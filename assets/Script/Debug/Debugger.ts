

// import Pinus = require("../Lib/build");
let pinus = (<any>window).pinus
export class Debugger {
    _userid: string = "";
    _logLevel: number = 0;
    _inited: boolean = false;

    _maxReconnectCount: number = 20;
    _reconnectCount: number = 0;
    // 功能废弃 请使用cocos远程调试方式 chrome-devtools://devtools/bundled/inspector.html?v8only=true&ws=192.168.2.9:6086/00010002-0003-4004-8005-000600070008

    init(userid: string, logLevel?: number, serverUrl?: string) {
        if (this._inited) {
            return;
        }
        this._userid = userid;
        this._logLevel = logLevel;

        this.initLOG(userid);
    }

    initLOG(userid: string) {
        pinus.init(
            {
                host: "192.168.31.160",
                port: 3010,
                log: true,
                reconnect: true,

            }, (ws: WebSocket) => {
                this._inited = false;

                this._reconnectCount = 0;
                pinus.request("connector.entryHandler.entry", { uid: userid }, (msg) => {
                    if (msg.code == 200) {
                        this._inited = true;
                        console.log("日志采集初始化完毕", msg);
                        if ((CC_DEBUG && cc.sys.isBrowser) || CC_DEV) {     // 浏览器或者模拟器下调试模式不接管日志
                            // cc.log = cc.warn = cc.error = this.log.bind(this);
                            // console.log = console.warn = console.error = this.log.bind(this);
                        }
                        else {
                            cc.log = cc.warn = cc.error = this.log.bind(this);
                            console.log = console.warn = console.error = this.log.bind(this);
                        }
                    }
                });
            }
        )
        pinus.once("close", () => {
            if (this._reconnectCount <= this._maxReconnectCount) {
                this._reconnectCount++;
                console.log("日志采集器正在重连" + this._reconnectCount + "/" + this._maxReconnectCount);
                setTimeout(() => {
                    this.initLOG(this._userid);
                }, 3000);   // 重连
            }
        })

    }

    log(level: "log" | "warn" | "error") {
        if (!this._inited) {
            return;
        }
        let args = arguments;
        let argsList = [];
        for (let i = 0; i < args.length; i++) {
            let msg = args[i]
            if (typeof msg != "string" || typeof msg != "number") {
                msg = JSON.stringify(msg);
            }
            argsList.push(msg);
        }

        this.sendLog(argsList.join("\n"));
    }



    sendLog(msg: string) {

        pinus.notify("connector.entryHandler.log", msg);
    }





    // 条件断点 或打印
    assert(cond: any, msg?: string, ...args: (number | string)[]) {
        if (cond) {
            if (CC_DEV || (CC_DEBUG && cc.sys.isBrowser)) {
                debugger;   // 浏览器断点
            }
            else {
                if (CC_DEBUG && msg) {  // 原生环境输出 error
                    msg = cc.js.formatStr.apply(null, (<any>cc.js).shiftArguments.apply(null, arguments));
                    console.error(msg);
                }
            }
            return true;
        }
        return false;
    }
}