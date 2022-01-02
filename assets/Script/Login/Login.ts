import BaseComponent from "../BaseClass/BaseComponent";
import { LoadTask } from "../Models/LoadTask";
import SubpackManager from "../HotUpdate/SubpackManager";
import { Actions } from "../Actions";


const { ccclass, property } = cc._decorator;

@ccclass
export default class Login extends BaseComponent {
    @property({ tooltip: "loadingGroup/bar", type: cc.Sprite })
    progressBar: cc.Sprite = undefined
    @property({ tooltip: "loadingGroup/loadingText", type: cc.Label })
    loadingText: cc.Label = undefined
    @property({ tooltip: "loadingGroup/progressText", type: cc.Label })
    progressText: cc.Label = undefined
    @property(cc.Node)
    btnGroup: cc.Node = undefined;

    // @property(cc.Node)
    // servAssistNode: cc.Node = undefined;

    @property(cc.Label)
    version: cc.Label = undefined;

    loadingGroup: cc.Node = undefined;

    _isSavePassword: boolean = false;     // 是否保存密码

    onLoad() {
        // 取消所有游戏的消息监听
        Global.MessageCallback.removeListener("RoomMessagePush");
        Global.MessageCallback.removeListener("GameMessagePush");

        this.showVersion();
        // 显示龙骨动画
        ViewMgr.open({ viewUrl: "BG/MeiNv", prefabUrl: "Login/MeiNv", isShowAction: false });
        Waiting.hide();
        // this.servAssistNode.active = false;
        this.btnGroup.active = false;
        this.loadingGroup = this.progressBar.node.parent;
        this.loadingGroup.active = true;
        // 加载资源
        setTimeout(() => {
            this.loading();
        }, 100);
    }
    _onMessage(msg: { key: string, data: any }) {
        if (typeof this[msg.key] === "function") {
            this[msg.key](msg.data);
            return;
        }
        CC_DEBUG && Debug.assert(true, "%s 节点无法处理消息: %s", this.node.name, msg.key)
    }
    setSavePwd(isSave: boolean) {
        this._isSavePassword = !!isSave;
    }
    // 拉取服务端配置信息
    getGameConfig(cb: (code: number, count?: number) => void) {
        let route = "/getGameConfig";
        let count = 0;
        Waiting.show("加载配置...");
        let request = () => {
            NetworkMgr.httpRequestSync(route, "GET", {}, (data: any) => {
                console.log(data);
                //游戏数据初始化
                Global.Data.init(data.msg.publicParameter);
                //游戏类型数据初始化
                // GameConfig.init(data.msg.gameTypes, data.msg.gameLists, data.msg.gameConfig);
                GameConfig.init(data.msg.gameLists, data.msg.gameConfig);
                //游戏VIP等级配置
                Global.VipConfig.init(data.msg.vipConfig);
                //代理数据初始化
                Global.AgentProfit.init(data.msg.agentProfit);
                //银行数据初始化
                (<any>Global).drawaBankList = data.msg.drawaBankList;
                cb(0);
                Waiting.hide();
            }, () => {
                count++;
                if (count >= 3) {
                    this.loadingText.string = "加载配置失败,请重启App或者联系客服"
                    cb(1, count);
                    Waiting.hide();
                }
                else {
                    request();
                }
            })
        }

        request();
    }

    loading() {
        this.loadingGroup.active = true;
        let loadDirArr = [
            ///////////////// 必须提前加载项 并且不能被释放
            "Waiting",
            /////////////////
            "Common",
            "Hall",
            "Mail",
            "SysNotice"
        ];

        this.progressText.string = 0 + '%';
        let progressBar = this.progressBar
        progressBar.fillRange = 0;

        cc.macro.DOWNLOAD_MAX_CONCURRENT = 1;
        cc.director.preloadScene("Hall");
        AssetMgr.loadResDirs(loadDirArr, (c, t, i) => {
            if (!t) return;

            let p = c / t;
            this.progressText.string = (p * 100).toFixed(2) + '%';
            progressBar.fillRange = p;
        }, (errors, assetRes, urlRes) => {
            // console.log(assetRes, urlRes);
            if (CC_DEBUG && errors) {
                console.error("加载完成! 失败数量 ", errors)
            }

            for (let i = 0; i < urlRes.length; i++) {
                AssetMgr.addCache(urlRes[i], assetRes[i]);      // 添加到缓存
            }

            progressBar.fillRange = 1;
            this.progressText.string = "100%"
            this.loadingText.string = "加载完成,请稍后...";
            cc.director.preloadScene("Hall", () => {
                cc.macro.DOWNLOAD_MAX_CONCURRENT = 64;
                this.loadingFinished();
            });
        }, 2);

    }
    loadingFinished() {
        let data: any = Global.CCHelper.getAccount()
        let isAutoLogin = cc.sys.localStorage.getItem('isAutoLogin');
        if (isAutoLogin == 'true' && cc.sys.isMobile && data) {
            // 先获取配置
            this.getGameConfig((code) => {
                if (code == OK) {
                    this.login({
                        account: data.account,
                        password: data.password,
                        isGuest: data.isGuest
                    })
                }
            });
        }
        // if (true || cc.sys.isBrowser || CC_DEV) {
        if (CC_DEV) {
            ViewMgr.open({ viewUrl: "ServerList", prefabUrl: "Login/ServerList", isShowAction: false });
            // this.servAssistNode.active = true;
        }
        AudioMgr.playSound("Common/Sound/login");
        this.btnGroup.active = true;
        this.loadingGroup.active = false

    }
    onBtnClk(event?: cc.Event, param?: any) {
        Global.CCHelper.playPreSound();
        // Waiting.show()
        this.getGameConfig(async (code, count) => {  // 拉取服务端配置信息
            if (code == OK) {
                switch (param) {
                    case "accountLogin":        // 账号登入
                        await ViewMgr.open({ viewUrl: "AccountLogin", prefabUrl: "Login/AccountLogin", }, { key: 'init' });
                        break;
                    case "phoneLogin":        // 手机号登入
                        await ViewMgr.open({ viewUrl: "AccountLogin", prefabUrl: "Login/AccountLogin", }, { key: 'init' });
                        break;
                    case "guestLogin":        // 游客登入
                        this.visitorLogin();
                        break;
                    // case 'register':            // 注册
                    //     await ViewMgr.open({ viewUrl: "Register", prefabUrl: "Login/Register", }, { key: 'init' });
                    //     break;
                }
            }
            else {
                if (count >= 3) {
                    Confirm.show("加载配置失败,请重启App或者联系客服");
                }
            }
            // Waiting.hide();
        })
    }

    openCustomerservice() {
        ViewMgr.open({ viewUrl: 'CustomerServiceDialog', prefabUrl: 'CustomerService/CustomerServiceDialog', }, { key: "init" });
    }

    enterGame() {
        Waiting.show();
        cc.director.loadScene("Hall");
    }

    //游客登录
    visitorLogin() {
        let account = cc.sys.localStorage.getItem('guestAccount');
        let password = cc.sys.localStorage.getItem('guestPassword');
        if (account && password) {
            this.login({
                account: account,
                password: password,
                isGuest: true,
            });
        } else {
            // account = Date.now().toString();
            // password = Date.now().toString();
            this.registerAP({
                account: null,
                password: null,
                code: "",
                uniqueID: ''
            });
        }
    }

    //注册账号
    async registerAP(data: { account: string, password: string, code: string, uniqueID: string }) {
        if (data.account != null && data.password != null) {
            if (!data.account || !data.password) {
                Tip.makeText("请输入有效帐号密码")
                return;
            }
        }
        let safe = data;

        Waiting.show();
        let retData = await API.http.register(data);
        Waiting.hide();
        if (retData.code == OK) {
            if (retData.msg.isGuest) {
                this.saveAccount(retData.msg.account, retData.msg.password, true);
            } else {
                this.saveAccount(safe.account, safe.password, false);
            }
            this.enterGame();
        }
        return;
        // Global.NetworkLogic.register(data, (data: any) => {  // 登入大厅成功
        //     this.enterGame();
        // }, undefined,       // 登入大厅失败
        //     (data: any) => {       // 注册成功回调
        //         Waiting.hide();
        //         // 注册成功
        //         if (data.msg.isGuest) {
        //             this.saveAccount(data.msg.account, data.msg.password, data.msg.isGuest);
        //         } else {
        //             this.saveAccount(safe.account, safe.password, data.msg.isGuest);
        //         }


        //     });
    }

    //登录
    async login(data: { account: string, password: string, isGuest: boolean }) {
        if (!data.account || !data.password) {
            Tip.makeText("请输入有效帐号密码");
            return;
        }
        Waiting.show()
        let loginData = await API.http.login(data.account, data.password);
        Waiting.hide();
        console.log(loginData);
        if (loginData.code == OK) {
            this.saveAccount(data.account, data.password, data.isGuest);
            this.enterGame();
        }
        else {
            let msg = Global.Code[loginData.code];
            if (data.isGuest && loginData.code == 103/* 账号或者密码错误 */) {
                Confirm.show(msg + "\n是否清除游客账号 " + data.account + " 相关信息?", () => {
                    localStorage.removeItem("guestAccount");
                    localStorage.removeItem("guestPassword");
                }, () => { });
            } else
                Tip.makeText("登录失败，请重试");
        }

        return;
        // Global.NetworkLogic.login(data, function () {
        //     Waiting.hide()
        //     this.saveAccount(data.account, data.password, data.isGuest);
        //     this.enterGame();
        // }.bind(this),
        //     function () {
        //         Waiting.hide()
        //         Tip.makeText("登录失败，请重试");
        //     }.bind(this));
    }


    //本地帐号存储
    saveAccount(account: string, password: string, isGuest: boolean | string) {
        if (isGuest || isGuest == 'true') {
            cc.sys.localStorage.setItem('guestAccount', account);
            cc.sys.localStorage.setItem('guestPassword', password);
        } else {
            cc.sys.localStorage.setItem('account', account);
            cc.sys.localStorage.setItem('password', password);
        }
        cc.sys.localStorage.setItem('isAutoLogin', true)
        cc.sys.localStorage.setItem('isGuest', isGuest)

    }

    showVersion() {
        if (cc.isValid(this.version)) {
            let mainPack = SubpackManager._packages.Main;   // 获取主包
            if (mainPack && mainPack.currVersion) { // 显示当前版本号
                this.version.string = "src v" + mainPack.currVersion;
            }
            else {
                this.version.node.active = false;
            }
            let gameCommonPack = subpackMgr.packages["GameCommon"];
            if (gameCommonPack && gameCommonPack.currVersion) {
                this.version.string += "   res v" + gameCommonPack.currVersion;
            }
        }
    }
}
