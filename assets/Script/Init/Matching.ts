import ZJHModel = require('../Game/ZhaJinHua/ZJHModel');
import NNModel = require('../Game/Niuniu/NNModel');
import MPNNModel = require('../Game/MingPaiNiuniu/MPNNModel');
import ERNNModel = require('../Game/ErRenNiuniu/ERNNModel');
import TTZModel = require('../Game/TuiTongZi/TTZModel');
import LHDModel = require('../Game/LongHuDou/LHDModel');
import HHDZModel = require('../Game/HongHeiDaZhan/HHDZModel');
import BJLModel = require('../Game/BaiJiaLe/BJLModel');
import DDZModel = require('../Game/DDZ/DDZModel');
import BRNNModel = require('../Game/BaiRenNiuNiu/BRNNModel');
import { BCBMModel } from '../Game/BenChiBaoMa/BCBMModel';

import { LoadTask } from '../Models/LoadTask';
import { gameType } from '../Shared/enumeration';
import { Utiles } from '../Models/Utiles';
import { SHZModel } from "../Game/SHZ/SHZModel";
import { WLZBModel } from "../Game/WLZB/WLZBModel";
const { ccclass, property } = cc._decorator;

@ccclass
export class Matching extends cc.Component {

    @property(cc.Button)
    cancel: cc.Button = null;
    isMatching = false;
    // 当前游戏 ID
    /**
     * 当前游戏 ID
     * 在返回大厅后置空
     */
    kindId: number = 0;

    init() {
        Global.MessageCallback.addListener('SelfEntryRoomPush', this);
    }
    onDestroy() {
        Global.MessageCallback.removeListener('SelfEntryRoomPush', this);
    }
    joinRoom(roomID) {
        Global.API.hall.joinRoomRequest(roomID, function () {
            Global.Player.setPy("roomID", roomID)

        }, function () {
            Waiting.hide()
        });
    }
    show(gameTypeID) {
        if (LockMgr.isLock("isMatching")) {
            Tip.makeText("正在匹配房间,请稍后...");
            return;
        }
        LockMgr.lock("isMatching");
        this.isMatching = true;
        let gameTypeInfo = GameConfig.getRoomConfig(gameTypeID);
        if (Global.Player.getPy('gold') < gameTypeInfo.goldLowerLimit) {
            this.hide()
            Tip.makeText("金币不足，无法匹配");
            return;
        } else if (gameTypeInfo.goldUpper > 0 && Global.Player.getPy('gold') > gameTypeInfo.goldUpper) {
            this.hide()
            Tip.makeText("金币超过房间上限，无法匹配");
            return;
        }

        let gameTyps: any = GameConfig.getRoomConfig(gameTypeID)
        if (gameTyps.matchRoom) {
            this.node.active = true;
            API.hall.matchRoomRequest(gameTypeID, null, (msg) => {
                Confirm.show(Global.Code[msg.code])
                this.hide();
            });
        } else {
            Waiting.show("正在请求数据");
            API.hall.matchRoomRequest(gameTypeID, null, (msg) => {
                Waiting.hide();
                Confirm.show(Global.Code[msg.code])
                this.hide();
            });
        }


    }

    hide() {
        LockMgr.unLock("isMatching");
        this.node.active = false;
        this.isMatching = false;
    }

    onBtnClk() {
        Global.CCHelper.playPreSound();
        API.hall.stopMatchRoomRequest(() => {
            this.hide();
        })
    }

    messageCallbackHandler(router: string, msg) {
        switch (router) {
            case 'SelfEntryRoomPush':
                console.log(" 进入房间消息 ");
                this.hide();
                this.enterGame(msg);
                break;
        }
    }

    async enterGameScene(kindId: number, gameTypeID: string) {
        let gameConfig = Config.GameConfig[kindId];
        let resDir = gameConfig.resDir;
        let prefabUrl = gameConfig.prefabUrl;
        await this.loadGameRes(resDir);
        return new Promise((resolve) => {
            cc.director.loadScene("GameTemp", () => {
                this.show(gameTypeID);
                resolve();
            });
        });

    }

    enterGame(entryRoomData: any) {
        if (LockMgr.isLock("enterRoom")) {
            Tip.makeText("正在进入房间,请稍后...")
            return;
        }
        LockMgr.lock("enterRoom");

        Waiting.show("正在加载资源...");
        let kindId = entryRoomData.kindId;
        // let needLoad = [];
        let gameConfig = Config.GameConfig[kindId];
        let resDir = gameConfig.resDir;
        let prefabUrl = gameConfig.prefabUrl;
        // 初始化游戏数据
        switch (kindId) {
            case Config.GameType.ZJH:
                ZJHModel.init(entryRoomData);
                break;
            case Config.GameType.NN:
                NNModel.setEntryRoomData(entryRoomData);
                break;
            //明牌牛牛
            case Config.GameType.MPNN:
                MPNNModel.setEntryRoomData(entryRoomData);
                break;
            //二人牛牛
            case Config.GameType.ERNN:
                ERNNModel.setEntryRoomData(entryRoomData);
                break;
            case Config.GameType.TTZ:
                TTZModel.setEntryRoomData(entryRoomData);
                break;
            case Config.GameType.LHD:
                LHDModel.setEntryRoomData(entryRoomData);
                break;
            case Config.GameType.HHDZ:
                HHDZModel.init(entryRoomData);
                break;
            case Config.GameType.BJL:
                BJLModel.setEntryRoomData(entryRoomData);
                break;
            case Config.GameType.FISH:
                break;
            case Config.GameType.SSS:
                break;
            case Config.GameType.DDZ:
                DDZModel.setEntryRoomData(entryRoomData);
                break;
            case Config.GameType.BJ:
                break;
            case Config.GameType.BRNN:
                BRNNModel.onLoad(entryRoomData);
                break;
            case Config.GameType.BCBM:
                BCBMModel.getInstance().initData(entryRoomData);
                break;
            case Config.GameType.SHZ:
                SHZModel.getInstance().setEntryRoomData(entryRoomData);
                break;
            case Config.GameType.WLZB:
                cc.log("=====点击WLZB房卡");
                WLZBModel.getInstance().setEntryRoomData(entryRoomData);
                break;
        }
        this.kindId = kindId;
        /**
         * 注意断线重连也会走当前函数
         */
        if (cc.director.getScene().name != "GameTemp") {
            // 加载资源进入游戏
            this.loadGameRes(resDir, () => {
                cc.director.loadScene("GameTemp", () => {
                    LockMgr.unLock("enterRoom");
                    Waiting.hide(99); // 提前关闭 防止可能的 加载预制报错导致无法关闭等待框
                    Global.DialogManager.createDialog(prefabUrl, null, function () {
                        // Broadcast.updatePosition(kindId)
                        // Waiting.hide();
                    })
                });
            })
        } else {
            /**
             * 游戏内断线重连逻辑
             * 重新加载场景(销毁场景缓存)再创建新场景 几十毫秒级消耗
             * 重新创建游戏主预制 (相当于进入游戏 然后418 恢复场景)
             */
            UIMgr.destroyAllUI();   // 销毁当前所有预制
            cc.director.loadScene("GameTemp", () => {
                LockMgr.unLock("enterRoom");
                Waiting.hide(99); // 提前关闭 防止可能的 加载预制报错导致无法关闭等待框
                Global.DialogManager.createDialog(prefabUrl, null, function () {
                    // Broadcast.updatePosition(kindId)
                    // Waiting.hide();
                    console.log("重新创建游戏成功::" + prefabUrl);
                })
            });
        }

    }

    async loadGameRes(dirs: string[], complete?: () => void) {
        try {
            let loadTask = new LoadTask();
            loadTask.init();
            loadTask.addLoadDir(dirs);

            return new Promise((resolve) => {
                Waiting.show("加载资源,请稍后...");
                console.time("加载资源");
                loadTask.loadStart((c, t, res, p) => {
                    Waiting.setProgress((p * 100).toFixed(2) + "%")
                }, () => {
                    Waiting.hide();
                    console.timeEnd("加载资源");
                    complete && complete();
                    resolve();
                });
            });
        } catch (error) {
            console.error("loadGameRes", error);
            return
        }
    }

}
