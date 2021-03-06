import BaseComponent from "../BaseClass/BaseComponent";
import { Debugger } from "../Debug/Debugger";
import { ViewManager } from "../Manager/ViewManager";

import Constant = require('../Shared/Constant')
import MessageCallback = require('../Shared/MessageCallback')
import DialogManager = require('../Shared/DialogManager')
import CCHelper = require('../Shared/CCHelper')
import Utils = require('../Shared/utils')
import Enum = require('../Shared/enumeration')
import Code = require('../Shared/code')
import SDK = require('../Shared/SDK')
import Animation = require('../Shared/Animation')
import Player = require('../Models/Player')
import PlayerWechat = require('../Models/PlayerWechat')
import VipConfig = require('../Models/VipConfig')
import Data = require('../Models/Data');
import AgentProfit = require('../Models/AgentProfit')
//import { AssetReleaseManager } from "../Models/AssetReleaseManager";
import { AssetManager } from "../Models/AssetManager";
import { UIManager } from "../Models/UIManager";
import { MessageManager } from "../Manager/MessageManager";
// import { NetWork } from "../NetWork/NetWork";
import { GameConfig } from "../Models/GameConfig";
import { Config } from "../Models/Config";

import openinstall = require("../Lib/OpenInstall");
import HotUpdate from "../HotUpdate/HotUpdate";
import SubpackManager from "../HotUpdate/SubpackManager";
import BroadcastModel from "../Models/BroadcastModel";
import { LockManager } from "../Manager/LockManager";
import JsbAssetsManager from "../HotUpdate/JsbAssetsManager";
import { AudioManager } from "../Shared/AudioManager";
import { SoundConfig } from "../Models/SoundConfig";
import { API } from "../NetWork/API";
import { NetworkManager } from "../Manager/NetworkManager";
// import NetworkManager_old = require('../Shared/NetworkManager_old')
// import NetworkLogic = require('../Shared/NetworkLogic')


const { ccclass, property } = cc._decorator;
let win: any = window;

@ccclass
export default class Init extends BaseComponent {

    @property(HotUpdate)
    hotUpdate: HotUpdate = undefined;

    onLoad() {
        cc.game.setFrameRate(45);           // ???????????? 45

        //cc.debug.setDisplayStats(false);    // ??????????????? fps
        // let win: any = window;
        // ??????????????????
        let scene = cc.director.getScene();
        let node = scene.getChildByName("WaitingLayer");
        let waiting = node.getComponent("WaitingLayer");
        node = scene.getChildByName("Toast");
        let toast = node.getComponent("Toast");
        node = scene.getChildByName("ConfirmBox");
        let confirm = node.getComponent("ConfirmBox");
        node = scene.getChildByName("Matching");
        let matching = node.getComponent("Matching");

        //????????????????????????????????????????????????????????????????????????
        //???????????????????????????????????????????????????????????????
        cc.game.addPersistRootNode(waiting.node);
        win.Waiting = waiting;

        toast.init();
        cc.game.addPersistRootNode(toast.node);
        win.Tip = toast;

        confirm.init();
        cc.game.addPersistRootNode(confirm.node);
        win.Confirm = confirm;

        cc.game.addPersistRootNode(matching.node);
        win.Matching = matching;

        win.BroadcastModel = new BroadcastModel

        // ?????????????????????
        this.initGlobal();
        win.Matching.init();
        win.BroadcastModel.init();
        // Global.SDK.setKeepScreenOn(true);
        if (cc.sys.isNative) {
            jsb.device.setKeepScreenOn(true)
        }
        // ????????????
        Global.CCHelper.screenAdaptation(new cc.Size(1280, 720), this.node.getComponent(cc.Canvas));

        // ????????????????????????
        Global.UIManager = UIMgr        // ???????????? ????????????

        Global.DialogManager.init(this.node);

        Global.DialogManager.createDialog = Global.UIManager.create.bind(Global.UIManager);
        Global.DialogManager.destroyDialog = Global.UIManager.destroyUI.bind(Global.UIManager);
        Global.DialogManager.destroyAllDialog = Global.UIManager.destroyAllUI.bind(Global.UIManager);

        // ???????????????

        Global.AssetManager = AssetMgr;
        //Global.AssetReleaseManager = AssetReleaseMgr;
        //Global.AssetReleaseManager.addAssetCache("_cache", AssetMgr);
        //Global.AssetReleaseManager.addAssetCache("_loadedUI", Global.UIManager);

        cc.game.on(cc.game.EVENT_HIDE, this.onEventHide.bind(this));        //???????????? ??????????????????????????????
        cc.game.on(cc.game.EVENT_SHOW, this.onEventShow.bind(this));


        this.hotUpdate.startUpdate((code: 0 | 1 | 2) => {
            if (!code || code == 2) {   // 0??????????????? 2??????????????? 1???????????????
                this.hotUpdate.progressBar.init("??????????????????,?????????");
                cc.director.preloadScene("Login", () => {
                    this.hotUpdate.node.active = false;
                    // ????????????????????????
                    if (CC_JSB) {
                        JsbAssetsManager.addSearchPath("Main");
                        console.log("??????????????????::", jsb.fileUtils.getSearchPaths());
                    }
                    this.enterGame();
                })
            }
            else {
                this.hotUpdate.node.active = false;
            }
        });
    }
    initGlobal() {
        win.LockMgr = new LockManager();
        win.Debug = new Debugger();
        win.ViewMgr = new ViewManager();
        //win.AssetReleaseMgr = new AssetReleaseManager();
        win.AssetMgr = new AssetManager();
        win.GameConfig = new GameConfig();
        win.AudioMgr = new AudioManager();
        win.AudioConfig = new SoundConfig();
        win.Config = Config;
        win.NetworkMgr = new NetworkManager();

        win.API = new API();
        Global.API = win.API;
        // Global.API = Api;
        // Global.NetworkManager = NetworkManager_old
        Global.NetworkManager = win.NetworkMgr

        // NetworkLogic.gameServerHttpRequest = NetworkMgr.httpRequestSync.bind(this);


        Global.Waiting = Waiting;       // ????????????

        Global.Constant = Constant;
        Global.MessageCallback = MessageCallback
        Global.DialogManager = DialogManager
        // Global.AudioManager = AudioManager
        Global.CCHelper = CCHelper
        Global.Utils = Utils
        // Global.NetworkLogic = NetworkLogic
        Global.Enum = Enum
        Global.Code = Code
        Global.SDK = SDK
        Global.Animation = Animation
        Global.Player = Player
        Global.PlayerWechat = PlayerWechat
        Global.VipConfig = VipConfig
        Global.Data = Data
        Global.AgentProfit = AgentProfit


        win.MessageMgr = new MessageManager();
        // win.Network = new NetWork();        // ????????????????????????
        win.UIMgr = new UIManager(this.node);       // ????????????

        win.subpackMgr = new SubpackManager();  // ????????????

    }
    enterGame() {
        // (<any>Global).spreaderID = "100061"  // ????????????
        // ??????????????????
        openinstall.getInstall(10, (data) => {
            console.log("????????????", JSON.stringify(data));
            if (data) {
                try {   // ??????????????????
                    if (data.bindData && data.bindData != "null" && data.bindData != "undefined") {
                        let bindData = JSON.parse(data.bindData);
                        console.log("????????????::" + bindData.spreaderID);
                        let spreaderID = bindData.spreaderID;
                        if (spreaderID && typeof spreaderID == "string") {
                            (<any>Global).spreaderID = spreaderID;
                        }
                        // ????????????
                        // setTimeout(() => {
                        //     Confirm.show("??????????????????::" + bindData.testKey);
                        // }, 5000);
                    }
                } catch (error) {
                    console.error("????????????????????????", error);
                }
            }
        });

        subpackMgr.addSearchPath("GameCommon");
        subpackMgr.addSearchPath("Main");   // ???????????????????????? ??????????????????????????????????????????????????????
        cc.director.loadScene("Login");

    }
    onEventHide() {
        Global.MessageCallback.emitMessage("GAME_EVENT", cc.game.EVENT_HIDE);
    }

    onEventShow() {
        Global.MessageCallback.emitMessage("GAME_EVENT", cc.game.EVENT_SHOW);
    }
}
