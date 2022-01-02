import RoomProto = require('../../API/RoomProto');
import { LHDBProto } from './LHDBProto';
import { Config } from '../../Models/Config';
import { LHDBUtils } from './LHDBUtils';
import { LHDBGameCore, LHDBView } from './LHDBGameCore';
import { LHDBConfig } from './LHDBConfig';
import { Actions } from '../../Actions';
import { Utiles } from '../../Models/Utiles';
import SpriteIndex from '../../Component/SpriteIndex';
import LHDBOperation from './LHDBOperation';
import LHDBResult from './LHDBResult';
import BaseView, { PUSH_DATA } from '../../BaseClass/BaseView';

const { ccclass, property } = cc._decorator;

@ccclass
export default class LHDBMain extends cc.Component {

    @property(cc.Button)
    btnStart: cc.Button = undefined;
    @property(cc.Label)
    gold: cc.Label = undefined;
    @property(cc.Label)
    currScore: cc.Label = undefined;
    @property(cc.Label)
    prizePool: cc.Label = undefined;
    @property(cc.Node)
    gemListNode: cc.Node = undefined;
    @property(cc.Node)
    boomPool: cc.Node = undefined;
    @property(cc.Node)
    brick: cc.Node = undefined;
    // @property(cc.Prefab)
    // gemPrefab: cc.Prefab = undefined;
    @property(SpriteIndex)
    levelTitle: SpriteIndex = undefined;
    @property(SpriteIndex)
    levelTip: SpriteIndex = undefined;

    @property(LHDBOperation)
    operation: LHDBOperation = undefined;
    @property(LHDBResult)
    result: LHDBResult = undefined;


    brickBoomDB: cc.Node = undefined;
    gemBoomPool: cc.NodePool = undefined;

    gemNodeMatrix: cc.Node[][] = [[], [], [], [], [], []];

    topGemNodes: cc.Node[] = [];
    brickNodes: cc.Node[] = []

    gameCore: LHDBGameCore = undefined;

    gemDragonBones: { [gemKind: number]: any[] } = Object.create(null);

    gold406Value: number = 0;

    root: cc.Node = undefined;
    currBetValue: number;
    isAutoStart: boolean = false;
    autoStartTimeOut: any;
    onLoad() {
        // 调试代码 
        if (CC_DEV) {
            (<any>window).gameMain = this;
        }

        this.root = this.node.getChildByName("root");

        this.brickNodes = [];
        for (let i = 0; i < this.brick.children.length; i++) {
            let node = this.brick.children[i];
            for (let j = 0; j < node.children.length; j++) {
                this.brickNodes.push(node.children[j]);
            }
        }
    }
    setAutoStart(value: boolean) {
        this.isAutoStart = value;
        // 显示取消按钮
        this.btnStart.node.children[0].active = value;
        this.btnStart.node.children[1].active = !value; // 隐藏托管文字提示
    }
    autoStartCancelClicked() {
        this.setAutoStart(false);
    }

    start() {
        Waiting.show("请稍后...");
        this.fitScene();
        ; (<any>window).LHDBUtils = LHDBUtils;

        this.gameCore = new LHDBGameCore();
        // 长按开始
        this.btnStart.node.on(cc.Node.EventType.TOUCH_START, (touch: cc.Event.EventTouch) => {
            if (this.btnStart.interactable) {
                this.autoStartTimeOut = setTimeout(() => {
                    if (cc.isValid(touch) && cc.isValid(this)) {
                        touch.stopPropagationImmediate();   // 终止按钮的点击事件
                        this.onStartClicked();  // 手动调用开始按钮的点击事件
                        this.setAutoStart(true);
                    }
                }, 2000);
            }
        })
        AudioMgr.startPlayBgMusic("Game/LHDB/sound/lhdb_bj");


        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        API.room.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
    }
    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    }

    messageCallbackHandler(router: string, data: BaseReturn) {
        if (router === 'RoomMessagePush') {
            switch (data.type) {
                case RoomProto.GET_ROOM_SCENE_INFO_PUSH:    // 418
                    this.initScene(data.data);
                    break;
                case RoomProto.USER_LEAVE_ROOM_PUSH:        // 所有玩家离开
                    ViewMgr.goBackHall(Config.GameType.LHDB);
                    break;
                case RoomProto.ROOM_USER_INFO_CHANGE_PUSH:  // 406 玩家金币更新推送
                    /**
                     * 由于各种原因，服务端和客户端金币在抽水计算后存在几率相差0.01的数值,所有放弃客户端计算，一律以 406 的数值为准
                     * 此处缓存数值，在所有宝石消除完成后更新数值
                     */
                    this.gold406Value = Global.Utils.numberRound(data.data.changeInfo.gold);
                    break;
                default:
                    break;
            }
        } else if (router === 'GameMessagePush') {
            switch (data.type) {
                case LHDBProto.Type.START_PUSH:             // 游戏开始
                    this.onGameStart(data.data.enddata);
                    break;
                case LHDBProto.Type.ROB_USER_SCORE_PUSH:    // 开始失败
                    this.setOperation(true);
                    break;
                case LHDBProto.Type.END_PUSH:               // 游戏结束
                    if (this.isAutoStart == false) {
                        this.setOperation(true);
                    }
                    if (data.data.enddata.isDrangon) {
                        Waiting.show("请求龙珠夺宝...");
                        LHDBProto.dragonNotify();

                        this.setAutoStart(false);
                    }
                    else {
                        // 是否自动开始游戏
                        if (this.isAutoStart) {
                            this.onStartClicked();
                        }
                    }
                    break;
                case LHDBProto.Type.DRAGON_PUSH:            // 龙珠夺宝
                    // let viewUrl = ViewMgr.getNodeUrl(this.root) + "/" + "LHDBDragonBall";
                    let viewUrl = "LHDBDragonBall";
                    let prefabUrl = "Game/LHDB/ui/LHDBDragonBall";
                    this.viewMgrOpen({ viewUrl: viewUrl, prefabUrl: prefabUrl, isShowAction: false }, { key: "init", data: data.data.enddata }).finally(() => {
                        // 打开界面后设置可操作
                        this.setOperation(true);
                        // 清除当前评分
                        this.updateInfo(undefined, 0, undefined, "set");
                        console.log("龙珠夺宝获得分数::" + data.data.enddata.score);
                        // 偷偷先加上龙珠夺宝的分数
                        this.currBetValue = 0;  // 清空下注值 用于龙珠夺宝抽水
                        this.updateInfo(data.data.enddata.score);
                        Waiting.hide();
                    });

                    break;
                case LHDBProto.Type.UPDATE_PRIZE_POOL_PUSH:    // 奖池更新
                    this.updateInfo(null, null, data.data.prizePool);
                    break;
                default:
                    break;
            }
        }
        else if (router == "ReConnectSuccess") {
            // 断线直接回大厅
            ViewMgr.goBackHall(Config.GameType.LHDB);
        }
    };

    async initScene(data: any) {
        LHDBConfig.coreConfig = data.gameData.coreConfig;
        LHDBConfig.gameRule = data.gameData.gameRule;
        LHDBConfig.profitPercentage = data.gameData.profitPercentage;

        let brickData = this.gameCore.brickData = data.gameData.totalBrick;
        let level = this.gameCore.getLevel();
        // 初始化金砖
        this.initBrick(brickData);
        // 显示关卡标题
        this.setLevel(level);
        // 显示当前评分
        this.updateInfo(null, 0, null, "set");
        // 显示玩家金币
        let userInfo = data.roomUserInfoArr[0].userInfo;
        this.updateInfo(userInfo.gold, null, null, "set");
        // 初始化操作面板
        this.operation.init(LHDBConfig.gameRule.baseScore);
        // 显示奖池
        this.updateInfo(null, null, data.gameData.prizePool);
        // 加载当前关卡宝石资源
        await this.loadGemRes(level);
        let [err1, gemBoom] = await AssetMgr.loadDragonBones("Game/LHDB/ani/gemBoom");
        // // 生成宝石爆炸特效节点池
        this.gemBoomPool = new cc.NodePool();
        for (let i = 0; i < 5; i++) {
            let node = this.newDragonBonesComp();
            let db = node.getComponent(dragonBones.ArmatureDisplay);
            db.dragonAsset = gemBoom[0], db.dragonAtlasAsset = gemBoom[1];// db.armatureName = "Sprite";
            this.gemBoomPool.put(node);
        }
        let [err2, brickBoom] = await AssetMgr.loadDragonBones("Game/LHDB/ani/brickBoom");
        this.brickBoomDB = this.newDragonBonesComp();
        /* 
         * db.armatureName = "armatureName" 之前
         * 一定不要让挂有骨龙动画的节点悬空,即未挂载到场景(骨龙的预制不清楚)
         * 引擎有Bug:
         * 悬空节点销毁时,引擎不会移除该节点挂载的骨龙组件的 clock 相关信息,导致clock启动时 无限报警告
         * The armature data has been disposed.\nPlease make sure dispose armature before call factory.clear().
         */
        this.brickBoomDB.parent = this.node;
        let db = this.brickBoomDB.getComponent(dragonBones.ArmatureDisplay);
        db.dragonAsset = brickBoom[0], db.dragonAtlasAsset = brickBoom[1], db.armatureName = "Sprite";
        this.brickBoomDB.active = false;


        Waiting.hide(999);  // 准备就绪
    }
    updateInfo(gold: number, currScore: number = undefined, prizePool: number = undefined, op: "add" | "set" = "add") {
        if (gold != undefined) {
            let value = 0;
            if (op == "add") {
                value = Number(this.gold.string);
                // 盈利部分进行抽水
                let gain = (gold - this.currBetValue);
                if (gold > 0 && gain > 0) {
                    console.log(`抽水前::${gold}`);
                    gold -= gain * (LHDBConfig.profitPercentage / 100);
                    console.log(`抽水后::${gold}`);
                }

            }
            value += gold;
            this.gold.string = Global.Utils.numberRound(value).toString();
        }
        if (currScore != undefined) {
            let value = 0;
            if (op == "add") {
                value = Number(this.currScore.string);
            }

            value += currScore;
            if (value < 0) {
                value = 0;  // 当前评分不能为负数
            }
            this.currScore.string = Global.Utils.numberRound(value).toString();
        }
        if (prizePool != undefined) {
            this.prizePool.string = Global.Utils.numberRound(prizePool).toString();
        }
    }
    async loadGemRes(level: number) {
        let baseDir = "Game/LHDB/";
        let promiseList = []
        for (let i = 0; i < 6; i++) {
            let kind = Number("2" + level + (i + 1));
            if (i == 5) {
                kind = 241; // 始终多加载一个钻头
            }
            let dir = baseDir + LHDBConfig.gemConfig[kind];
            this.gemDragonBones[kind] = [];
            // console.log(kind, dir);
            /**
             * 此处无法使用 await 操作符，否则造成引擎API无限递归而报错，原因不明，遂改外 Promise.all
             */
            promiseList.push(AssetMgr.loadDragonBones(dir, this.gemDragonBones[kind]));
        }
        await Promise.all(promiseList);
        console.log(this.gemDragonBones);
        // 校验加载完整性
        if (CC_DEV) {
            for (let i = 0; i < 5; i++) {
                let kind = Number("2" + level + (i + 1));
                let db = this.gemDragonBones[kind];
                if (db.length != 2) {
                    console.error(`宝石 ${kind} 资源加载失败！`);
                }
            }
        }
        // 释放上一个关卡的资源
        if (level >= 2) {
            // level = level - 1;
            // let dir = "Game/LHDB/gem/" + "level" + level;
            // AssetMgr.removeCacheDir(dir);       // 移除缓存持有
            // AssetReleaseMgr.releaseDir(dir);    // 将资源已入释放队列
            // AssetReleaseMgr.releaseImmediate(); // 立即释放资源
            // AssetReleaseMgr._releaseUtile.showAllCacheUrl(); // 调试使用
        }
    }

    initBrick(brickData: number) {
        for (let i = 0; i < 45; i++) {
            this.brickNodes[i].active = true;
        }
        for (let i = 0; i < 45 - brickData; i++) {
            this.brickNodes[i].active = false;
        }
    }


    async onGameStart(data: any) {
        this.gemListNode.destroyAllChildren();
        this.topGemNodes = [];
        this.gemNodeMatrix = [[], [], [], [], [], []]; // 初始化宝石阵列节点数组
        this.result.init();
        let lastLevel = this.gameCore.level;
        ////// 更新金币 评分
        this.updateInfo(-data.userData.bet, -data.userData.bet);
        this.currBetValue = data.userData.bet;
        this.gameCore.initResultData(data);
        this.initBrick(this.gameCore.brickData);
        if (lastLevel != this.gameCore.level) {
            // 替换关卡标题
            this.levelTitle.displayByIndex(this.gameCore.level - 1);
            await this.loadGemRes(this.gameCore.level); // 先加载当前关卡宝石资源
        }
        await this.initGemMatrix();
        console.log("宝石阵列初始化完毕, 开始消除宝石");
        let totalScore = data.userData.score;//  为当局游戏消除宝石获得的总数值
        // 测试代码 检验 消除宝石 的总数值
        if (CC_DEV) {
            let localScore = 0;
            for (let i = 0; i < this.gameCore.viewArray.length; i++) {
                localScore += this.gameCore.viewArray[i].score;
            }
            if (localScore != totalScore) {
                console.error(`本地计算消除数值与服务端消除数值不相等 ${totalScore}!=${localScore}`);
                console.log("本地计算数据::" + JSON.stringify(this.gameCore.viewArray))
            }
        }

        this.goNextView(totalScore).catch((reason) => {// 动画过程中发生错误
            console.error("发生错误", reason);
            this.setOperation(true);
        });
    }

    onGameEnd(data: any) {
        /**
         * score 为当局游戏真实的输赢数值
         */



        Confirm.show("欢迎进入龙珠夺宝环节", () => {
            Confirm.show("但是我还没有做完");
        })
    }

    async initGemMatrix() {
        let viewData = this.gameCore.viewArray[0];  // 初始化不移除数据
        // 显示宝石阵列
        // if (true && CC_DEV) {  // 打印一下
        //     this.gameCore.printView(viewData);
        // }
        let promiseList: Promise<any>[] = [];
        for (let y = 0, len = 6; y < len; y++) {    // 行 从最底部一行开始
            for (let x = 0; x < viewData.viewMatrix.length; x++) {  // 列
                let pos = this.getGemNodePosition(cc.v2(x, y));
                let kind = viewData.viewMatrix[x][y];
                let gemNode = this.createGemNode({ kind: kind, pos: pos });
                this.gemNodeMatrix[x][y] = gemNode;
                if (!gemNode) {
                    continue;
                }
                gemNode.active = true;
                // 宝石下落
                gemNode.setPosition(pos.x, 720);
                let delay = (x + y * 6) * 0.1 + (Math.random() * 50 + 50) * 0.01;
                promiseList.push(this.gameCore.gemFalling(gemNode, delay, 0.2, pos));
            }
        }
        setTimeout(() => {
            this.playEffect("lhdb_bsdl");
        }, 1000);
        await Promise.all(promiseList);
        promiseList = [];
        // 显示顶部宝石
        await this.fixTopGem(viewData.topView);
    }
    async fixTopGem(topView: number[]) {
        let promiseList = [];
        for (let i = 0; i < 6; i++) {
            if (!this.topGemNodes[i] || this.topGemNodes[i].active == false) {
                let kind = topView[i];
                let pos = this.getGemNodePosition(cc.v2(i, 0));
                let gemNode = this.createGemNode({ kind: kind });
                if (this.topGemNodes[i]) {
                    this.topGemNodes[i].destroy();  // 销毁就节点
                }
                this.topGemNodes[i] = gemNode;      // 缓存顶部宝石 方便管理与使用
                if (!gemNode) {
                    continue;
                }
                gemNode.active = true;
                // 宝石下落
                gemNode.setPosition(pos.x, 720);
                // let delay = (level - 1) * 0.6 + 2.4 + 0.2 + 1;
                let tween = cc.tween()
                    .to(0.2, { position: cc.v2(pos.x, 550) });
                promiseList.push(Actions.runActionSync(gemNode, tween));
            }
        }

        await Promise.all(promiseList);
    }
    /**
     * 显示下一屏
     */
    async goNextView(totalScore: number) {
        /**
         * 使用当前屏的消除数据过度到下一屏
         * 下一屏的顶部宝石要使用下一屏的数据
         */
        let viewData = this.gameCore.viewArray.shift();   // 移除数据

        // 消除宝石
        await this.gemDestory(viewData);
        // 阵列宝石下落
        await this.gemMatrixFalling(viewData);
        // 补全阵列
        await this.fixGemMatrix(viewData);
        // 补全顶部宝石 使用下一屏的顶部宝石数据
        let netView = viewData.getNextView();
        if (netView) {
            await this.fixTopGem(netView.topView);
        }
        // 继续下一屏
        if (this.gameCore.viewArray.length > 0) {
            await Utiles.sleep(1000);   // 延迟一会儿
            await this.goNextView(totalScore);
        }
        else {  // 如果没有下一屏则处理结束
            this.dealWithAllEnd(totalScore);
        }
    }
    /**
     * 宝石消除
     */
    async gemDestory(viewData: LHDBView) {
        let destroyData = viewData.destroyData
        let promiseList = [];
        for (let i = 0; i < destroyData.line.length; i++) {
            let point = destroyData.line[i]
            let gemNode = this.gemNodeMatrix[point.x][point.y];
            let boom = this.gteGemBoomNode();
            boom.parent = this.gemListNode;
            boom.setPosition(this.getGemNodePosition(point));
            gemNode.active = false;
            // 播放音效
            let pm = Actions.runDragonBonesSync(boom, "Sprite", "Sprite", 1, 3).then(() => {
                this.gemBoomPool.put(boom); // 放回爆炸池
            });
            if (destroyData.kind == 241) {
                promiseList.push(this.brickDestory())   // 消除金砖
            }
            promiseList.push(pm);
            // let tween = cc.tween()
            //     .to(0.2, { opacity: 0 })
            //     .call(() => {
            //         gemNode.opacity = 255;
            //         gemNode.active = false;
            //     })
            //     ;
            // promiseList.push(Actions.runActionSync(gemNode, tween));
        }
        // 播放音效
        if (promiseList.length) {
            this.playEffect("lhdb_bsxc");
        }
        await Promise.all(promiseList).catch((err) => {
            console.error(err);
        });
        await this.dealWithResult(viewData);
        console.log("消除完成");
    }
    /** 
     * 处理结果 
     */
    async dealWithResult(viewData: LHDBView) {
        let kind = viewData.destroyData.kind;
        if (!kind || kind == 241 || kind == 242) {
            return
        }
        let count = viewData.destroyData.line.length;
        let score = viewData.score;
        if (score > 0 && kind && kind != 242) {
            // Tip.makeText("+ " + score);
            // 右边添加当前消除信息
            let dbinfo = this.gemDragonBones[kind];
            this.result.showResultItem(dbinfo, viewData);
        }
        //  更新当前评分 (玩家金币最后在更新方便算抽水)
        this.updateInfo(null, score, null);
        // 显示暴富特效
        if (score / this.currBetValue >= 5) {   // 原来的值是 10
            AssetMgr.loadResSync("Game/LHDB/ui/baofula_ske", cc.Prefab).then((res) => {
                if (cc.isValid(this)) {
                    this.playEffect("lhdb_llj");
                    let node = cc.instantiate(res);
                    node.active = false;
                    node.parent = this.root;
                    let label = node.children[0].getComponent(cc.Label);
                    label.string = Global.Utils.numberRound(score).toString();
                    this.viewMgrOpen("baofula_ske").then(() => {
                        setTimeout(() => {
                            node.destroy();
                        }, 4000);
                    })
                }
            });
        }

    }
    /**
     * 宝石阵列下移
     */
    async gemMatrixFalling(viewData: LHDBView) {
        console.log("开始下移")
        let fallList: { gemNode: cc.Node, endPos: cc.Vec2 }[] = [];
        for (let x = 0; x < 6; x++) {
            let len = viewData.addMatrix[x].length;
            if (len) {
                let desCount = 0;
                // 重置消除的宝石
                for (let y = 0; y < viewData.border; y++) {
                    let gemNode = this.gemNodeMatrix[x][y];
                    if (gemNode && gemNode.active == false) {
                        desCount++;
                    }
                    else if (desCount) {
                        this.gemNodeMatrix[x][y] = this.gemNodeMatrix[x][y - desCount];
                        this.gemNodeMatrix[x][y - desCount] = gemNode;
                        fallList.push({
                            gemNode: gemNode,
                            endPos: this.getGemNodePosition(cc.v2(x, y - desCount))
                        })
                    }
                }
            }
        }
        let promiseList = [];
        for (let i = 0, len = fallList.length; i < len; i++) {
            let gemNode = fallList[i].gemNode;
            let pos = fallList[i].endPos;
            let delay = 0;  // 同时下移
            promiseList.push(this.gameCore.gemFalling(gemNode, delay, 0.2, pos));
        }
        await Promise.all(promiseList);

    }
    /**
     * 宝石阵列补全
     */
    async fixGemMatrix(viewData: LHDBView) {
        let addMatrix = viewData.addMatrix;
        let promiseList = [];
        let count = 0;
        for (let x = 0; x < addMatrix.length; x++) {
            for (let y = 0, len = addMatrix[x].length; y < len; y++) {
                count++;
                let kind = addMatrix[x][y];
                let gemNode = this.topGemNodes[x];
                let _y = viewData.border - len + y;
                let pos = this.getGemNodePosition(cc.v2(x, _y));
                // let delay = count * 0.1 + (Math.random() * 50 + 50) * 0.01;
                let delay = count * 0.1;
                console.log("宝石下落::", kind, delay, count, pos, x, y);
                // 优先落下顶部宝石
                if (gemNode && gemNode.active) {
                    // 交换宝石
                    this.topGemNodes[x] = this.gemNodeMatrix[x][_y];
                    // this.topGemNodes[x].active = false;
                    this.gemNodeMatrix[x][_y] = gemNode;
                }
                else {
                    gemNode = this.createGemNode({ kind: kind });
                    gemNode.active = true;
                    gemNode.setPosition(pos.x, 720);
                    this.gemNodeMatrix[x][_y].destroy();
                    this.gemNodeMatrix[x][_y] = gemNode;
                }
                promiseList.push(this.gameCore.gemFalling(gemNode, delay, 0.2, pos))
            }
        }
        await Promise.all(promiseList);

    }
    /**
     * 消除金砖
     */
    async brickDestory() {
        // 重要数据变更
        this.gameCore.brickData--;  // 随界面更变更 新钻头数量

        let brickNodes = this.brickNodes;
        let node: cc.Node;
        for (let i = 0; i < brickNodes.length; i++) {
            if (brickNodes[i].active) {
                node = brickNodes[i]
                break;
            }
        }
        if (CC_DEV && !node) {
            console.error("没有可消除的金砖");
            return;
        }
        this.brickBoomDB.parent = node.parent;
        this.brickBoomDB.setPosition(node.getPosition());
        this.brickBoomDB.active = true;
        node.active = false;
        await Actions.runDragonBonesSync(this.brickBoomDB, "Sprite", "Sprite", 1, 3).then(() => {
            this.brickBoomDB.active = false;
            this.brickBoomDB.parent = this.node;
        }).catch((err) => {
            console.error(err);
        })
    }

    /**
     *  全部结束
     */
    async dealWithAllEnd(totalScore: number) {
        console.log("处理结束::");
        LHDBProto.gemeEndNotify();
        this.goNextLevel();
        // 更新玩家金币
        // this.updateInfo(totalScore);
        this.updateInfo(this.gold406Value, null, null, "set");
        if (this.isAutoStart == false) {    // 自动开始时 按钮始终禁用
            this.setOperation(true);
        }

        let currScore = +this.currScore.string
        if (currScore == 0 && this.gameCore.brickData == 0) {
            this.setAutoStart(false);
            Confirm.show("当前评分为 0 无法进入龙珠夺宝关卡");
        }
    }
    goNextLevel() {
        let level = this.gameCore.level;
        let nextLevel = this.gameCore.getLevel();
        console.log(`当前关卡 ${level} 下一关卡 ${nextLevel}`)
        if (nextLevel == 4) {
            // setTimeout(() => {
            //     this.setLevel(1);
            // }, 2000);
        }
        else if (level == nextLevel - 1) {
            // 进入下一关
            console.log("进入下一关");
            // 替换关卡标题
            this.setLevel(nextLevel);
        }
    }
    setLevel(level: number) {
        // 替换关卡标题
        this.levelTitle.displayByIndex(level - 1);
        // 显示提示
        this.levelTip.displayByIndex(level - 1);
        setTimeout(() => {
            this.levelTip.displayByIndex(-1);
        }, 1500);
    }

    createGemNode(gem: { kind: number, pos?: cc.Vec2 }) {
        if (!gem.kind || gem.kind == 242) {
            return undefined;
        }
        let gdb = this.gemDragonBones[gem.kind];
        if (!gdb || !cc.isValid(gdb[0]) || !cc.isValid(gdb[1])) {
            console.error("宝石骨龙资源失效::" + gem.kind, this.gemDragonBones)
            return;
        }
        if (!gem.pos) {
            gem.pos = cc.v2(0, 0);
        }
        let gemNode = this.newDragonBonesComp();
        gemNode.scale = 0.8 // 缩小
        let dbad = gemNode.getComponent(dragonBones.ArmatureDisplay);
        dbad.dragonAsset = gdb[0];
        dbad.dragonAtlasAsset = gdb[1];
        dbad.armatureName = "Sprite";
        dbad.animationName = "Sprite";

        // let gemNode = Global.CCHelper.createSpriteNode("Game/LHDB/ui/zhuantou_gold");
        gemNode.active = false;
        gemNode.parent = this.gemListNode;
        gemNode.setPosition(gem.pos);
        return gemNode;
    }
    newDragonBonesComp() {
        let node = new cc.Node("dbn");
        let comp = node.addComponent(dragonBones.ArmatureDisplay);
        return node;
    }
    /**
     * 请先初始化至少一个节点到池中
     */
    gteGemBoomNode() {
        if (this.gemBoomPool.size() > 1) {
            return this.gemBoomPool.get();
        } else if (this.gemBoomPool.size() == 1) {
            let node = this.gemBoomPool.get();
            let newNode = cc.instantiate(node);
            this.gemBoomPool.put(node);
            return newNode;
        }
        return undefined;
    }

    /**
     * 获取宝石节点的坐标
     */
    getGemNodePosition(arrPos: { x: number, y: number }) {
        // let arrPos = this.gameCore.getArrayPos(index, 6);   /* 6*6矩阵 */
        // let x = 45 + 90 * arrPos.x;
        // let y = 60 + 75 * arrPos.y;
        let x = 65 + 80 * arrPos.x;
        let y = 60 + (75) * arrPos.y;
        return cc.v2(x, y);
    }

    setOperation(can: boolean) {
        this.operation.setOperation(can);
        console.log("设置操作::" + can);
        this.btnStart.interactable = can;
        this.btnStart.node.children[1].active = can;
    }

    async onStartClicked(ev?: cc.Event) {
        clearTimeout(this.autoStartTimeOut);
        this.autoStartTimeOut = undefined;

        // 检验玩家当前金币是否足够当前下注
        let bet = this.operation.getBetNum();
        let gold = +this.gold.string;
        if (bet > gold) {
            Confirm.show("金币不足");
            return;
        }
        // 开始按钮、加注按钮禁用
        this.setOperation(false);

        await this.removeGem();

        LHDBProto.gameStartNotify(bet);
    }

    async removeGem() {
        let promiseList = [];
        // 先移除桌面上的宝石
        for (let i = 0; i < this.gemListNode.children.length; i++) {
            let gemNode = this.gemListNode.children[i];
            let w = (Math.random() * 20 + 15) * 15;
            let h = (Math.random() * 20 + 50) * 15;
            let f = (i) % 6;
            let flag = f > 3 ? 1 : -1;
            promiseList.push(gemNode.runAction(cc.jumpBy(0.8, cc.v2(flag * w, -1000), h, 1)));
        }
        if (promiseList.length) {
            this.playEffect("lhdb_bssk");
        }
        await Promise.all(promiseList);
        if (promiseList.length) {
            await Utiles.sleep(900);   // jumpBy的动作时间好像不是整个动作的时间，此处需要追加延迟以保证动作完整执行完毕            
        }
    }
    async viewMgrOpen(viewUrl: string | { viewUrl: string, prefabUrl?: string, isShowAction?: boolean, isWait?: boolean }, msg?: PUSH_DATA, callback?: (script: BaseView) => void) {
        let rootUrl = ViewMgr.getNodeUrl(this.root) + "/";
        if (typeof viewUrl == "string") {
            viewUrl = rootUrl + viewUrl;
        }
        else {
            viewUrl.viewUrl = rootUrl + viewUrl.viewUrl;
        }
        await ViewMgr.open(viewUrl, msg, callback);
    }

    playEffect(uri: string) {
        let url = "Game/LHDB/sound/" + uri;
        AudioMgr.playSound(url);
    }

    fitScene() {
        let dr = LHDBConfig.designResolution;
        let sx = cc.winSize.width / dr.width;
        let sy = cc.winSize.height / dr.height;
        let rootNode = this.node.getChildByName("root");
        rootNode.setScale(sx, sy);
    }

    onHelpClicked(ev?: cc.Event, param?: string) {
        let viewUrl = {
            viewUrl: "LHDBHelp",
            prefabUrl: "Game/LHDB/ui/LHDBHelp"
        }

        let msg = { key: "", arguments: [undefined] };
        if (param == "leijijiang") {
            msg.key = "showPrizePoolHelp"
        }
        else if (param == "rule") {
            msg.key = "showRuleHelp"
            msg.arguments.push(LHDBConfig.profitPercentage);    // 传递抽水数值
        }
        this.viewMgrOpen(viewUrl, msg);
    }
}


