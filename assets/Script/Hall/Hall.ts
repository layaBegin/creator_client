import UserInfo from "./UserInfo";
import { PUSH_DATA } from "../BaseClass/BaseView";
import HallApi = require('../API/HallAPI');
import ProgressBar from "../Component/ProgressBar";
import { EventCode } from "../HotUpdate/JsbAssetsManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Hall extends cc.Component {

    @property(UserInfo)
    userInfo: UserInfo = undefined;
    // @property(cc.Node)
    // pageGroup: cc.Node = undefined;
    @property(cc.Node)
    gameGroup: cc.Node = undefined;
    @property(cc.Node)
    roomGroup: cc.Node = undefined;
    @property(cc.Node)
    topGroup: cc.Node = undefined;
    @property(cc.Node)
    bottomBg: cc.Node = undefined;
    @property(cc.RichText)
    noticeText: cc.RichText = undefined

    isOpenSystemNotice = undefined
    onLoad() {
        // 取消所有游戏的消息监听
        Global.MessageCallback.removeListener("RoomMessagePush");
        Global.MessageCallback.removeListener("GameMessagePush");

        cc.game.setFrameRate(45);
        if (Global.CCHelper.isIphoneX() == true) {
            this.userInfo.getComponent(cc.Widget).left = 50
            // this.pageGroup.getComponent(cc.Widget).left = 90
            this.gameGroup.getComponent(cc.Widget).left = 70
            this.bottomBg.getChildByName('btnGroup').getComponent(cc.Widget).left = 50
        }
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        AudioMgr.startPlayBgMusic("Hall/Sound/hall_bg_music", null);

        this.sortGameIcon();
        // this.setNotice();
        this.updateUserInfo();
        this.release();
        if (!this.checkJoinRoom()) {        // 如果短线重连 则不隐藏等待
            Waiting.hide(999);
        }
        setTimeout(() => {  // 防止 场景刚加载完帧数较低时执行打开子界面并播放龙骨动画可能造成的卡顿
            if (cc.isValid(this.node)) {    // 断线重连等逻辑让大厅跳转到其他场景引起的相关问题
                if (CC_DEV) {   // 开发环境显示
                    return;
                }
                if (Global.isOpenSystemNotice) {
                    if (!CC_DEV) {
                        let isShow = this.showRegisterTip()
                        ViewMgr.open("SysNotice", { key: "init", data: !isShow });
                    }

                    Global.isOpenSystemNotice = false
                } else {
                    if (!CC_DEV) {
                        this.showRegisterTip();
                    }
                }
            }
        }, 500);

        Matching.kindId = 0;

    }

    release() {
        UIMgr.destroyAllUI();
        AssetReleaseMgr.releaseUnused();
    }

    sortGameIcon() {
        let gameList = GameConfig.gameList;
        let gameGroupContent = this.gameGroup.getComponent(cc.ScrollView).content;
        for (let i = 0; i < gameGroupContent.children.length; i++) {
            gameGroupContent.children[i].active = false;
        }
        for (let i = 0; i < gameList.length; i++) {
            let game = gameList[i]
            let node = gameGroupContent.getChildByName(game.kindID + "")
            if (node) {
                //抢庄牛牛排在最前面
                if (game.kindID == 10) {
                    node.setSiblingIndex(0);
                } else {
                    node.setSiblingIndex(i);
                }
                node.active = true;
            }
            else {
                console.error("找不到子游戏(gameID = %s,gameName = %s gameStatus = %s)节点 ", game.kindID, game.kindName, game.status);
            }
        }
    }


    updateUserInfo() {
        this.userInfo.id = "ID:" + Global.Player.getPy('uid');
        this.userInfo.nickName = Global.Player.getPy('nickname');
        this.userInfo.gold = Global.Player.getPy('gold')
        this.userInfo.bank = Global.Player.getPy('safeGold')
        this.userInfo.vip = (Global.Player.getPy('vipLevel') - 1) + ''
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.userInfo.headImg_);
    }
    checkJoinRoom() {
        let roomID = Global.Player.getPy('roomID');     // 玩家是否在一个房间中
        if (!!roomID) {
            Matching.joinRoom(roomID)
        }
        return false;
    }
    _onMessage(msg: PUSH_DATA) {
        if (typeof this[msg.key] === "function") {
            if (Array.isArray(msg.arguments)) {
                this[msg.key].apply(this, msg.arguments);
            }
            else {
                this[msg.key](msg.data);
            }
            return;
        }
        CC_DEBUG && Debug.assert(true, "%s 节点无法处理消息: %s", this.node.name, msg.key)
    }

    onClicked(event: cc.Event, param: string) {
        Global.CCHelper.playPreSound();
        let viewName = param;
        let viewUrl: ViewUrl = {
            viewUrl: viewName,
            prefabUrl: "HallDynamic/" + viewName
        }
        switch (viewName) {
            case 'UserCenter':
                ViewMgr.open(viewUrl, { key: "init" });
                break;
            case 'Wash':
                ViewMgr.open(viewUrl, { key: "init" });
                break;
            case 'SysNotice':
                ViewMgr.open(viewUrl, { key: "init", data: true });
                break;
            case 'Sign':
                ViewMgr.open(viewUrl, { key: "refreshUI" });
                break;
            case 'Bank':
                ViewMgr.open(viewUrl, { key: "init" });
                break;
            case 'Mail':
                ViewMgr.open(viewUrl, { key: "init" });
                break;
            case 'Exchange':
                if (!this.showRegisterTip()) {
                    ViewMgr.open(viewUrl, { key: "init" });
                }
                break;
            case 'Vip':
                ViewMgr.open(viewUrl, { key: "init" });
                break;
            case 'Recharge':
                API.hall.getRechargeDis((msg) => {
                    ViewMgr.open(viewUrl, { key: "init", data: msg.msg });
                }, (msg) => {
                    Confirm.show('充值系统维护中')
                })
                break;
            case 'LuckyWheel': /* 幸运转盘 */
                HallApi.getTurntableGrandConfigRequest((data) => {
                    if (data.code == Global.Code.OK) {
                        ViewMgr.open("LuckyWheel", { key: "init", data: data.msg });
                    }
                })
                break;
            case 'Agency':
                ViewMgr.open(viewUrl, { key: 'init' });
                break;
            case 'Rank':
                viewUrl.isWait = true;
                ViewMgr.open(viewUrl, { key: "init" });
                break;
            case 'CustomerServiceDialog':
                ViewMgr.open("CustomerServiceDialog", { key: "init" });
                break;
            case 'Register':
                ViewMgr.close("RegisterTip")
                ViewMgr.open("Register", { key: 'init' });
                break;
        }
    }

    updateGame(kindId: number, progressBar?: ProgressBar) {
        let packName = Config.GameConfig[kindId].enName;
        let pack = subpackMgr.packages[packName];
        if (pack) {
            pack.setMaxConcurrentTask(5);      // 动态设置子游戏下载并发数
            pack.update((df, tf, db, tb) => {
                if (tb != 0) {
                    cc.isValid(progressBar.node) && (progressBar.progress = (db / tb));
                }
            }, (err: { code: number, msg: string }) => {
                cc.isValid(progressBar.node) && progressBar.hide();
                if (!err || err.code == EventCode.ALREADY_UP_TO_DATE) {
                    Tip.makeText(Config.getGameName(kindId) + " 下载成功");
                }
                else {
                    Confirm.show(Config.getGameName(kindId) + " 下载失败");
                }
            });
        }
        else {
            return;
        }
        return;
    }
    async checkVersion(kindId: number, target: cc.Node) {
        let packName = Config.GameConfig[kindId].enName;
        let pack = subpackMgr.packages[packName];
        let parentNode = target.getChildByName("name");
        if (pack) {
            console.log(pack)
            if (pack.isDownloading()) {
                console.log("游戏正在下载中...");
                //从游戏中返回大厅 恢复当前游戏下载进度条
                let viewUrl = ViewMgr.getNodeUrl(parentNode) + "/ProgressBar";
                if (!ViewMgr.isOpen(viewUrl)) {
                    console.log("恢复进度条...");
                    let progressBar: any = await ViewMgr.open({ viewUrl: viewUrl, prefabUrl: "ProgressBar", isShowAction: false });
                    let node: cc.Node = progressBar.node;
                    // node.scale = 0.1;
                    node.setContentSize(parentNode.getContentSize());
                    node.setPosition(0, 0);
                    progressBar.init("", false);
                    pack.onProgress = (df, tf, db, tb) => {
                        if (tb != 0) {
                            cc.isValid(progressBar.node) && (progressBar.progress = (1 - db / tb)); // 反向进度
                        }
                    }
                    pack.completeCallback = (err: { code: number, msg: string }) => {
                        cc.isValid(progressBar.node) && progressBar.hide();
                        if (!err || err.code == EventCode.ALREADY_UP_TO_DATE) {
                            Tip.makeText("子游戏下载成功");
                        }
                        else {
                            Confirm.show("下载子游戏失败");
                        }
                    }
                }
                return true;
            }
            else if (!pack.isAllReady()) {
                // 显示进度条
                let viewUrl = ViewMgr.getNodeUrl(parentNode) + "/ProgressBar";
                let progressBar: any = await ViewMgr.open({ viewUrl: viewUrl, prefabUrl: "ProgressBar", isShowAction: false });
                let node: cc.Node = progressBar.node;
                // node.scale = 0.1;
                node.setContentSize(parentNode.getContentSize());
                node.setPosition(0, 0);
                progressBar.init("", false);
                this.updateGame(kindId, progressBar);
                return true;
            }
        }
        else {
            console.error("没有当前子包对象信息");
            return false;
        }
        return false;
    }
    // private _clickedList: boolean[] = [];     // 防止过快的点击
    async onGameClicked(event: cc.Event, param: string) {
        Global.CCHelper.playPreSound();
        let kindId = parseInt(param)
        // 调试代码
        if (CC_DEV && [].indexOf(kindId) >= 0) {
            Matching.enterGame({ kindId: kindId });
            return;
        }
        //更多游戏
        if (isNaN(kindId)) {    // 非数字类型全部提示 敬请期待
            Tip.makeText('敬请期待！');
            return;
        }
        if (LockMgr.isLock(kindId)) {
            Tip.makeText("您操作太快了");
            return;
        }

        subpackMgr.addSearchPath(Config.GameConfig[kindId].enName);

        LockMgr.lock(kindId);   // 加锁
        setTimeout(() => {
            LockMgr.isLock(kindId) && LockMgr.unLock(kindId);    // 强制修复任意情况下可能造成的因 _clickedList 造成的子游戏点击卡死状态
        }, 3000);
        // 原生环境需要动态更新子游戏
        if (cc.sys.isNative) {
            let updating = await this.checkVersion(kindId, event.target).catch(() => {
                LockMgr.unLock(kindId);
            });
            if (updating) {
                LockMgr.unLock(kindId);
                return;
            }
            console.log("无须更新");
        }

        Waiting.show()
        let roomData = await API.hall.getRoomListByKind(kindId).catch(() => {
            LockMgr.unLock(kindId);
        });
        GameConfig.initGameRooms(roomData.msg)

        let levels = GameConfig.getGameLevels(kindId);
        if (levels.length == 0) {
            Tip.makeText("没有可用的房间");
            LockMgr.unLock(kindId);
            Waiting.hide();
            return;
        }
        if (levels.length == 1) {
            Matching.show(levels[0].gameTypeID)
            Waiting.hide();
            LockMgr.unLock(kindId, 3000);// 延迟解锁
            return;
        }
        let msg = undefined
        if (kindId == 120) {        //德州选场单独处理
            msg = {
                key: "setDzRooms",
                data: levels
            }
        } else if (kindId == 50) {   //百家乐选场单独处理
            let data = await HallApi.getAllRoomGameDataByKind(kindId);
            msg = {
                key: "setBJLRooms",
                data: data.msg.gameDataArr
            }
            this.showRoomGroup(true);
            ViewMgr.pushMessage("RoomGroup", { key: "setTopInfo", arguments: [Global.Player.getPy("gold"), Global.Player.getPy("safeGold"), kindId] });
            let js: any = await ViewMgr.open("RoomGroup")
            setTimeout(() => {
                if (!cc.isValid(js) || !cc.isValid(this)) {
                    Waiting.hide();
                    return;
                }
                js.setBJLRooms(data.msg.gameDataArr)
            }, 500);
            LockMgr.unLock(kindId);
            Waiting.hide();

            return
        } else {
            msg = {
                key: "setRooms",
                data: levels
            }
        }

        this.showRoomGroup(true);
        ViewMgr.pushMessage("RoomGroup", { key: "setTopInfo", arguments: [Global.Player.getPy("gold"), Global.Player.getPy("safeGold"), kindId] });
        ViewMgr.open("RoomGroup", msg);
        LockMgr.unLock(kindId, 1000);
        Waiting.hide();
    }

    showRoomGroup(isShow: boolean) {
        this.gameGroup.active = this.topGroup.active = this.bottomBg.active = !isShow;
        // this.pageGroup.active = this.gameGroup.active = this.topGroup.active = this.bottomBg.active = !isShow;
    }

    messageCallbackHandler(router: string, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updateUserInfo();
            //断线重连都会重新走一遍这里
            case 'ReConnectSuccess':
                cc.log("断线重连 刷新用户信息")
                this.updateUserInfo();
                break;
        }
    }
    onDestroy() {
        AudioMgr.stopBgMusic();
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    }

    //注册提示框
    showRegisterTip() {
        if (Global.Player.getPy('isGuest') == 'true') {
            let viewUrl = {
                viewUrl: "RegisterTip",
                prefabUrl: "HallDynamic/RegisterTip"
            }
            ViewMgr.open(viewUrl, { key: "init" });
            return true;
        } else {
            return false;
        }
    }


    openBindView(type: "zfb" | "bankCard") {
        let typeValue = { "zfb": 1, "bankCard": 2 };
        let realName = Global.Player.getPy('realName') || '';
        if (!realName) {
            Confirm.show('您还未绑定真实姓名，请先绑定真实姓名', () => {
                ViewMgr.open('RealName', { key: "init", data: typeValue[type] })
            });
            return;
        }
        ViewMgr.open("Bind", { key: 'init', data: type });
    }
}
