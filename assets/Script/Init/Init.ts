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
import { AssetReleaseManager } from "../Models/AssetReleaseManager";
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
        cc.game.setFrameRate(45);           // 强制帧率 45

        cc.debug.setDisplayStats(false);    // 强制不显示 fps
        // let win: any = window;
        // 设置常驻节点
        let scene = cc.director.getScene();
        let node = scene.getChildByName("WaitingLayer");
        let waiting = node.getComponent("WaitingLayer");
        node = scene.getChildByName("Toast");
        let toast = node.getComponent("Toast");
        node = scene.getChildByName("ConfirmBox");
        let confirm = node.getComponent("ConfirmBox");
        node = scene.getChildByName("Matching");
        let matching = node.getComponent("Matching");

        //声明常驻根节点，该节点不会被在场景切换中被销毁。
        //目标节点必须位于为层级的根节点，否则无效。
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

        // 初始化全局变量
        this.initGlobal();
        win.Matching.init();
        win.BroadcastModel.init();
        // Global.SDK.setKeepScreenOn(true);
        if (cc.sys.isNative) {
            jsb.device.setKeepScreenOn(true)
        }
        // 适配处理
        Global.CCHelper.screenAdaptation(new cc.Size(1280, 720), this.node.getComponent(cc.Canvas));

        // 初始化界面管理器
        Global.UIManager = UIMgr        // 兼容代码 后期删除

        Global.DialogManager.init(this.node);

        Global.DialogManager.createDialog = Global.UIManager.create.bind(Global.UIManager);
        Global.DialogManager.destroyDialog = Global.UIManager.destroyUI.bind(Global.UIManager);
        Global.DialogManager.destroyAllDialog = Global.UIManager.destroyAllUI.bind(Global.UIManager);

        // 初始化网络
        // Global.NetworkLogic.init();

        Global.AssetManager = AssetMgr;
        Global.AssetReleaseManager = AssetReleaseMgr;
        Global.AssetReleaseManager.addAssetCache("_cache", AssetMgr);
        // Global.AssetReleaseManager.addAssetCache("loadedDialogPrefabs", Global.DialogManager);
        Global.AssetReleaseManager.addAssetCache("_loadedUI", Global.UIManager);

        cc.game.on(cc.game.EVENT_HIDE, this.onEventHide.bind(this));        //危险代码 可能造成多次注册事件
        cc.game.on(cc.game.EVENT_SHOW, this.onEventShow.bind(this));


        this.hotUpdate.startUpdate((code: 0 | 1 | 2) => {
            if (!code || code == 2) {   // 0热更新成功 2热更新关闭 1热更新失败
                this.hotUpdate.progressBar.init("正在进入游戏,请稍后");
                cc.director.preloadScene("Login", () => {
                    this.hotUpdate.node.active = false;
                    // 设定主包优先搜索
                    if (CC_JSB) {
                        JsbAssetsManager.addSearchPath("Main");
                        console.log("当前搜索路径::", jsb.fileUtils.getSearchPaths());
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
        win.AssetReleaseMgr = new AssetReleaseManager();
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


        Global.Waiting = Waiting;       // 后期废弃

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
        // win.Network = new NetWork();        // 接管所有网络事件
        win.UIMgr = new UIManager(this.node);       // 后期废弃

        win.subpackMgr = new SubpackManager();  // 子包管理

    }
    enterGame() {
        // (<any>Global).spreaderID = "100061"  // 调试代码
        // 获取代码参数
        openinstall.getInstall(10, (data) => {
            console.log("安装参数", JSON.stringify(data));
            if (data) {
                try {   // 防止解析失败
                    if (data.bindData && data.bindData != "null" && data.bindData != "undefined") {
                        let bindData = JSON.parse(data.bindData);
                        console.log("安装参数::" + bindData.spreaderID);
                        let spreaderID = bindData.spreaderID;
                        if (spreaderID && typeof spreaderID == "string") {
                            (<any>Global).spreaderID = spreaderID;
                        }
                        // 调试代码
                        // setTimeout(() => {
                        //     Confirm.show("当前代理参数::" + bindData.testKey);
                        // }, 5000);
                    }
                } catch (error) {
                    console.error("获取代理数据失败", error);
                }
            }
        });

        subpackMgr.addSearchPath("GameCommon");
        subpackMgr.addSearchPath("Main");   // 设置优先搜索主包 否则引擎将无脑搜索增加资源的加载时间
        cc.director.loadScene("Login");

    }
    onEventHide() {
        Global.MessageCallback.emitMessage("GAME_EVENT", cc.game.EVENT_HIDE);
    }

    onEventShow() {
        Global.MessageCallback.emitMessage("GAME_EVENT", cc.game.EVENT_SHOW);
    }
}
