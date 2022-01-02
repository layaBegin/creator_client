import { Actions } from "../../Actions";
import { TGPD2GameCore, TGPD2View } from './TGPD2GameCore';
import { Utiles } from "../../Models/Utiles";
import TGPD2Operation from './TGPD2Operation';
import { TGPD2Proto } from "./TGPD2Proto";
import RoomProto = require('../../API/RoomProto');
import TGPD2Result from './TGPD2Result';
import BaseView, { PUSH_DATA } from '../../BaseClass/BaseView';
import { TGPD2Config } from './TGPD2Config';

let { ccclass, property } = cc._decorator;


@ccclass
export default class TGPD2Main extends cc.Component {
    @property(cc.Node)
    candyMachine: cc.Node = undefined;
    @property(cc.Node)
    gemListNode: cc.Node = undefined
    @property(cc.Node)
    brick: cc.Node = undefined;
    @property(cc.Label)
    gold: cc.Label = undefined;
    @property(cc.Label)
    currScore: cc.Label = undefined;
    @property(cc.Label)
    prizePool: cc.Label = undefined;
    @property(cc.Sprite)
    levelTitle: cc.Sprite = undefined;
    @property(cc.Button)
    btnStart: cc.Button = undefined;
    @property(cc.Node)
    free: cc.Node = undefined;
    @property(cc.Node)
    freeDropRate: cc.Node = undefined;



    @property(TGPD2Operation)
    operation: TGPD2Operation = undefined;

    @property(TGPD2Result)
    result: TGPD2Result = undefined;


    gemBoomPool: cc.NodePool = undefined;
    gameCore: TGPD2GameCore = undefined;
    gemNodeMatrix: cc.Node[][] = [[], [], [], [], [], []];
    topGemNodes: cc.Node[] = [];
    brickNodes: cc.Node[] = []
    autoStartTimeOut: any = undefined;
    isAutoStart: boolean = false
    currBetValue: number;
    gold406Value: number = 0;


    onLoad() {

        this.brickNodes = [];
        for (let i = 0; i < this.brick.children.length; i++) {
            let node = this.brick.children[i];
            for (let j = 0; j < node.children.length; j++) {
                this.brickNodes.push(node.children[j]);
            }
        }
    }

    async start() {
        // 调试代码 
        if (CC_DEV) {
            (<any>window).gameMain = this;
        }
        this.gameCore = new TGPD2GameCore();
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
                    ViewMgr.goBackHall(Config.GameType.TGPD2);
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
                case TGPD2Proto.Type.START_PUSH:             // 游戏开始
                    this.onGameStart(data.data.enddata);
                    break;
                case TGPD2Proto.Type.ROB_USER_SCORE_PUSH:    // 开始失败
                    this.setOperation(true);
                    break;
                case TGPD2Proto.Type.END_PUSH:               // 游戏结束

                    if (this.isAutoStart == false) {
                        this.setOperation(true);
                    }
                    else {
                        // 是否自动开始游戏
                        if (this.isAutoStart) {
                            this.onStartClicked();
                        }
                    }
                    break;
                case TGPD2Proto.Type.UPDATE_PRIZE_POOL_PUSH:    // 奖池更新
                    // this.updateInfo(null, null, data.data.prizePool);
                    break;
                default:
                    break;
            }
        }
        else if (router == "ReConnectSuccess") {
            // 断线直接回大厅
            ViewMgr.goBackHall(Config.GameType.TGPD2);
        }
    };

    async initScene(data: any) {
        TGPD2Config.coreConfig = data.gameData.coreConfig;
        TGPD2Config.gameRule = data.gameData.gameRule;
        TGPD2Config.profitPercentage = data.gameData.profitPercentage;

        let brickData = this.gameCore.brickData = data.gameData.totalBrick;
        let level = this.gameCore.getLevel();
        // 初始化金砖
        this.initBrick(brickData);
        // // 显示关卡标题
        this.setLevel(level);
        // // 显示当前评分
        this.updateInfo(null, 0, null, "set");
        // // 显示玩家金币
        let userInfo = data.roomUserInfoArr[0].userInfo;
        this.updateInfo(userInfo.gold, null, null, "set");
        // 初始化操作面板
        this.operation.init(TGPD2Config.gameRule.baseScore);
        // // 显示奖池
        this.updateInfo(null, null, data.gameData.prizePool);
        // // // 生成宝石爆炸特效节点池
        this.newDragonBonesComp();
        // Waiting.hide(999);  // 准备就绪
    }
    async onGameStart(data: any) {
        this.gemListNode.removeAllChildren()
        // 重置当前评分
        this.updateInfo(null, 0, null, "set");
        this.topGemNodes = [];
        // data = JSON.parse('{"userData":{"isAddDrillBit":false,"indexOfDrillBit":[],"totalBrick":45,"bet":10,"score":10,"currentScore":10,"freeDropTimes":null,"freeDropRate":null,"freeDropIndex":null},"gemArray":["3","4","2","4","1","1","1","4","4","2","4","4","3","1","2","3","5","2","3","3","1","2","1","1","1","1","5","2","4","1","1","4","3","1","3","4","3","4","1","1","3","1","1","3","4","2","5","4","3","3","1","5","2","4","5","4","1","3","1","1","1","4","4","3"]}')
        this.gameCore.initResultData(data);
        await this.initGemMatrix();
        this.goNextView().catch((reason) => {// 动画过程中发生错误
            console.error("发生错误", reason);
            this.setOperation(true);
        });
    }

    // async onBtnClk() {
    //     this.gemListNode.removeAllChildren()
    //     this.result.init();
    //     this.topGemNodes = [];
    //     await EfftectAction.beat(this.candyMachine)
    //     let data = JSON.parse('{"userData":{"isAddDrillBit":true,"indexOfDrillBit":8,"totalBrick":44,"bet":10,"score":-10,"currentScore":10},"gemArray":[2,2,2,2,1,1,1,1,4,1,5,5,4,4,5,2,5,2,2,2,2,2,2,2,2,2,2,2,2,3,1,1,5,1,5,1,5,4,5,2,2,5,5,3,3,5,5,2,4,4,1,3,3,5,1,1,2,4,1,4,2,4,4,1]}')
    //     this.gameCore.initResultData(data);
    //     await this.initGemMatrix();
    //     this.goNextView().catch((reason) => {// 动画过程中发生错误
    //         console.error("发生错误", reason);
    //         this.setOperation(true);
    //     });
    // }
    updateInfo(gold: number, currScore: number = undefined, prizePool: number = undefined, op: "add" | "set" = "add") {
        if (gold != undefined) {
            let value = 0;
            if (op == "add") {
                value = Number(this.gold.string);
                // 盈利部分进行抽水
                let gain = (gold - this.currBetValue);
                if (gold > 0 && gain > 0) {
                    console.log(`抽水前::${gold}`);
                    // gold -= gain * (LHDBConfig.profitPercentage / 100);
                    gold -= gain * (0 / 100);
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

    setLevel(level: number) {
        // 替换关卡标题
        Global.CCHelper.updateSpriteFrame("Game/TGPD2/ui/levelTitle" + level, this.levelTitle);
    }

    initBrick(brickData: number) {
        for (let i = 0; i < 45; i++) {
            this.brickNodes[i].active = true;
        }
        for (let i = 0; i < 45 - brickData; i++) {
            this.brickNodes[i].active = false;
        }
    }

    /**
     * 创建糖果节点
     */
    createGemNode(gem: { kind: number, pos?: cc.Vec2 }) {
        if (!gem.kind || gem.kind == 242) {
            return undefined;
        }
        if (!gem.pos) {
            gem.pos = cc.v2(0, 0);
        }
        let gemNode = Global.CCHelper.createSpriteNode("Game/TGPD2/candys/cd_" + gem.kind);
        gemNode.scale = 0.8
        gemNode.active = false;
        gemNode.parent = this.gemListNode;
        gemNode.setPosition(gem.pos);
        return gemNode;
    }

    async initGemMatrix() {
        let viewData = this.gameCore.viewArray[0];  // 初始化不移除数据
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
                let delay = (x + y * 6) * 0.04 + 0.01;
                promiseList.push(this.gemFalling(gemNode, delay, 0.3, pos));
            }
        }

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
                    this.topGemNodes[i].destroy();  // 销毁旧节点
                }
                this.topGemNodes[i] = gemNode;      // 缓存顶部宝石 方便管理与使用
                if (!gemNode) {
                    continue;
                }
                gemNode.active = true;
                // 宝石下落
                gemNode.setPosition(pos.x, 720);
                let tween = cc.tween()
                    .to(0.2, { position: cc.v2(pos.x, 530) });
                promiseList.push(Actions.runActionSync(gemNode, tween));
            }
        }

        await Promise.all(promiseList);
    }

    /**
     * 显示下一屏
     */
    async goNextView() {
        /**
         * 使用当前屏的消除数据过度到下一屏
         * 下一屏的顶部宝石要使用下一屏的数据
         */
        if (this.gameCore.viewArray.length == 0) {
            debugger;
        }
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
            await this.goNextView();
        }
        else {  // 如果没有下一屏则处理结束
            this.dealWithAllEnd();
        }
    }
    /**
     * 宝石消除
     */
    async gemDestory(viewData: TGPD2View) {
        let destroyData = viewData.destroyData
        let score = viewData.score
        for (let index = 0; index < destroyData.length; index++) {
            let list = [];
            for (let i = 0; i < destroyData[index].line.length; i++) {
                let point = destroyData[index].line[i]
                let gemNode = this.gemNodeMatrix[point.x][point.y];
                let boom = this.gteGemBoomNode();
                boom.parent = this.gemListNode;
                boom.setPosition(this.getGemNodePosition(point));
                gemNode.active = false;
                // 播放糖果爆炸动画
                let pm = Actions.runDragonBonesSync(boom, "Sprite", "Sprite", 1, 3).then(() => {
                    this.gemBoomPool.put(boom); // 放回爆炸池
                });
                if (destroyData[index].kind == 216 || destroyData[index].kind == 226 || destroyData[index].kind == 236) {
                    list.push(this.brickDestory())   // 消除金砖
                }
                list.push(pm);
            }
            await Promise.all(list);
            await this.dealWithResult(destroyData[index], score[index]);
            if (index < destroyData.length - 1) {
                await Utiles.sleep(600);
            }
        }
        // 播放音效
        // if (promiseList.length) {
        //     this.playEffect("lhdb_bsxc");
        // }
        console.log("消除完成");
    }
    /** 
     * 处理结果 
     */
    async dealWithResult(viewData, scoreData) {
        let kind = viewData.kind;
        if (!kind || kind == 216 || kind == 226 || kind == 236 || kind == 242) {
            return
        }
        let score = scoreData;
        if (score > 0 && kind && kind != 242) {
            // Tip.makeText("+ " + score);
            // 右边添加当前消除信息
            this.result.showResultItem(viewData, scoreData);
        }
        //更新当前金币 更新当前评分
        this.updateInfo(score, score, null);
    }
    /**
     * 宝石阵列下移
     */
    async gemMatrixFalling(viewData: TGPD2View) {
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
            promiseList.push(this.gemFalling(gemNode, delay, 0.2, pos));
        }
        await Promise.all(promiseList);

    }
    /**
     * 宝石阵列补全
     */
    async fixGemMatrix(viewData: TGPD2View) {
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
                promiseList.push(this.gemFalling(gemNode, delay, 0.2, pos))
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
        node.active = false;
    }

    //更新钻头
    updateBrick() {

    }

    /**
     *  全部结束
     */
    async dealWithAllEnd() {
        console.log("处理结束::");
        TGPD2Proto.gemeEndNotify();
        this.goNextLevel();

        if (this.isAutoStart == false) {    // 自动开始时 按钮始终禁用
            this.setOperation(true);
        }

        this.updateInfo(this.gold406Value, null, null, "set");

        // let currScore = +this.currScore.string
        // if (currScore == 0 && this.gameCore.brickData == 0) {
        //     this.setAutoStart(false);
        //     Confirm.show("当前评分为 0 无法进入龙珠夺宝关卡");
        // }
        /**
         * 通知服务端游戏结束 302 返回数据后
         * 1.设置当前评分
         * 2.设置当前金币
         * 判断是否进入下一关
         * 3.设置开始按钮可点击
         * 4.是否龙珠夺宝
         */
    }

    /**
     * 获取糖果节点的坐标
     */
    getGemNodePosition(arrPos: { x: number, y: number }) {
        let x = 50.5 + 87 * arrPos.x;
        let y = 40 + 80 * arrPos.y;
        return cc.v2(x, y);
    }

    /**
     * 创建糖果爆炸节点池
     */
    async newDragonBonesComp() {
        let [err1, gemBoom] = await AssetMgr.loadDragonBones("Game/TGPD2/ani/gemBoom");
        this.gemBoomPool = new cc.NodePool();
        for (let i = 0; i < 5; i++) {
            let node = new cc.Node("dbn")
            node.scale = 0.6
            node.addComponent(dragonBones.ArmatureDisplay)
            let db = node.getComponent(dragonBones.ArmatureDisplay)
            db.dragonAsset = gemBoom[0], db.dragonAtlasAsset = gemBoom[1]
            this.gemBoomPool.put(node)
        }
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
     * 糖果下落动作
     * @param node 糖果节点 
     * @param delay  延迟下落时间
     * @param duration 下落时间
     * @param position 下落坐标
     * @param height 弹跳高度
     * @param jumps   弹跳次数
     */
    async gemFalling(node: cc.Node, delay: number, duration: number, position: cc.Vec2, height: number = 40, jumps: number = 1) {
        if (node) {
            let tween = cc.tween()
                .delay(delay)
                .to(duration, { position: position })
            await Actions.runActionSync(node, tween).then(() => {
                EfftectAction.jumpTo(node, 0.2, position, height, jumps)
            });
        }
    }
    async onStartClicked(ev?: cc.Event) {
        clearTimeout(this.autoStartTimeOut);
        this.autoStartTimeOut = undefined;
        EfftectAction.beat(this.candyMachine)

        // 检验玩家当前金币是否足够当前下注
        let bet = this.operation.getBetNum();
        let gold = 999999//+this.gold.string;
        if (bet > gold) {
            Confirm.show("金币不足");
            return;
        }
        // 开始按钮、加注按钮禁用
        this.setOperation(false);

        // await this.removeGem();

        TGPD2Proto.gameStartNotify(bet);
    }


    setOperation(can: boolean) {
        this.operation.setOperation(can);
        console.log("设置操作::" + can);
        this.btnStart.interactable = can;
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

    setAutoStart(value: boolean) {
        this.isAutoStart = value;
        // 显示取消按钮
        this.btnStart.node.children[0].active = value;
    }

    autoStartCancelClicked() {
        this.setAutoStart(false);
    }

    async viewMgrOpen(viewUrl: string | { viewUrl: string, prefabUrl?: string, isShowAction?: boolean, isWait?: boolean }, msg?: PUSH_DATA, callback?: (script: BaseView) => void) {
        // let rootUrl = ViewMgr.getNodeUrl(this.root) + "/";
        if (typeof viewUrl == "string") {
            // viewUrl = rootUrl + viewUrl;
            viewUrl = viewUrl;
        }
        else {
            // viewUrl.viewUrl = rootUrl + viewUrl.viewUrl;
            viewUrl.viewUrl = viewUrl.viewUrl;
        }
        await ViewMgr.open(viewUrl, msg, callback);
    }


    onHelpClicked(ev?: cc.Event, param?: string) {
        let viewUrl = {
            viewUrl: "GameHelp",
            prefabUrl: "Game/TGPD2/GameHelp"
        }

        let msg = { key: "", arguments: [undefined] };
        if (param == "help") {
            msg.key = "showRuleHelp"
            msg.arguments.push(TGPD2Config.profitPercentage);    // 传递抽水数值
        }
        this.viewMgrOpen(viewUrl, msg);
    }
    /**
     * 播放免费次数动画
     * @param freeNum 免费倍数
     */
    async playFreeAni(freeNum: string) {
        this.free.active = true
        let daoshuNode = this.free.getChildByName('daoshu')
        let numNode = this.free.getChildByName('num')
        daoshuNode.active = true

        await Actions.runDragonBonesSync(daoshuNode, "Armature", "daoshu", 2, 1).then(() => {
            daoshuNode.active = false
            numNode.active = true
        });

        await Actions.runDragonBonesSync(numNode, "Armature", freeNum, 1, 1)

        let tween = cc.tween()
            .to(0.7, { position: cc.v2(-457, 100), scale: 0.5 })
        await Actions.runActionSync(numNode, tween).then(() => {
            numNode.position = cc.v2(0, 0)
            numNode.scale = 1
            numNode.active = false
            this.free.active = false
            this.freeDropRate.active = true
            this.freeDropRate.getChildByName('num').getComponent(cc.Label).string = freeNum
        })
    }

}

class EfftectAction {
    /**
     * 节点类心脏的跳动
     * 用于糖果机
     */
    static async beat(node: cc.Node) {
        let tween = cc.tween()
            .to(0.1, { scaleY: 1.05 })
            .to(0.1, { scaleY: 0.9 })
            .to(0.1, { scaleY: 1.03 })
            .to(0.1, { scaleY: 0.95 })
            .to(0.1, { scaleY: 1.01 })
            .to(0.1, { scaleY: 0.98 })
            .to(0.1, { scaleY: 1 })
            ;
        await Actions.runActionSync(node, tween);
    }
    /**
     * 下落到某一点
     * `h = 1/2*g*t²`
     * `g = 9.8`
     * t² = 2h/g
     */
    static async fallTo(node: cc.Node, ) {

    }

    /**
     * 节点跳动到目标点
     * 用于糖果下落后的弹跳
     */
    static async jumpTo(node: cc.Node, duration: number, position: cc.Vec2, height: number = 0, jumps: number = 0) {
        let tween = cc.tween().then(cc.jumpTo(duration, position, height, jumps));
        await Actions.runActionSync(node, tween);
    }

}