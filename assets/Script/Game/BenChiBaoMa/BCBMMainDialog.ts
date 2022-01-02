import { Config } from "../../Models/Config";
import roomAPI = require("../../Api/RoomAPI");
import roomProto = require('../../API/RoomProto');
import BCBMCarIconItem from "./BCBMCarIconItem";
import BCBMProto = require("./BCBMProto");
import { BCBMModel } from "./BCBMModel";

let ZZConfig = {
    accTime: 2,         //加速时间
    a1: 10,
    breakTime: 2,         //减速时间
    totalEndTime: 7,
    uniTime: 3,         //匀速时间
    interval: 0.02,
    offSet: 0.5
    // uniSpeed:25,       //匀速速度,  每秒移动几格
};

const { ccclass, property } = cc._decorator;

@ccclass
export default class BCBMMainDialog extends cc.Component {

    @property(BCBMCarIconItem)
    NodeCarIconItem_arr: BCBMCarIconItem[] = [];
    @property(cc.Node)
    betArea_arr: cc.Node[] = [];
    @property(cc.Prefab)
    carPrefab: cc.Prefab = undefined;

    @property(cc.Label)
    betCountLabelArr: cc.Label[] = [];
    @property(cc.Label)
    selfBetCountLabelArr: cc.Label[] = [];

    @property(cc.Node)
    npcStartNode: cc.Node = undefined;
    @property(cc.Node)
    npcGameEndNode: cc.Node = undefined;
    @property(cc.Node)
    sp_gaugeneedle: cc.Node = undefined;
    @property(cc.Label)
    leftTimeLabel: cc.Label = undefined;
    @property(cc.Label)
    statusLabel: cc.Label = undefined;
    @property(cc.ProgressBar)
    progressBar: cc.ProgressBar = undefined;
    @property(dragonBones.ArmatureDisplay)
    kaijiangAction: dragonBones.ArmatureDisplay = undefined;
    @property(cc.Node)
    BCBMRecord: cc.Node = undefined;
    @property(cc.Node)
    carLight1: cc.Node = undefined;
    @property(cc.Node)
    carLight2: cc.Node = undefined;
    @property(cc.Node)
    carLight3: cc.Node = undefined;
    @property(cc.Node)
    carLight4: cc.Node = undefined;
    @property(dragonBones.ArmatureDisplay)
    daojishiDragon: dragonBones.ArmatureDisplay = undefined;
    @property(cc.Node)
    winType: cc.Node = undefined;

    gameCommonCtrl: any = undefined;
    gameDropDownList: any = undefined;

    // slotIndexNode:cc.Node = new cc.Node;//模拟跑圈的 竖条
    turnStatus: number = 0;//1:加速 2:匀速 3:减速
    turnArounding = false; //是否正在转转
    nowSlotIndex: number = 0;
    nowPos: number = 0;
    startIndex: number = 0;
    turnAroundedSlotArray = []; // 开转之后经过得车槽位下标
    runCar: cc.Node = undefined;

    isFirstEnter = false;
    isResultStatus = false; //是否是开奖状态

    leftTop = 0;
    rightTop = 6;//右上角 直路车标位置
    rightButtom = 16;
    leftButtom = 22;//

    betCountList = [];
    selfBetCountList = [];
    gameInited = null;
    enableBet = true;
    gameResultData = null;
    startFreeTime = 0;
    totalFreeTime = 1;

    time = 0;
    uniTime = 0;
    private accS: number = 0;
    private uniS: number = 0;
    private breakS: number = 0;
    private tempPos: any;
    private tempV: number;
    private carRunSoundEf: any = null;
    private lastTime: number = 0;
    private breakAudio: any;
    // private callback : any = undefined;

    onLoad() {
        if (Global.CCHelper.isIphoneX() == true) {
            this.BCBMRecord.getComponent(cc.Widget).right = 70
        }
        this.gameDropDownList = this.node.getChildByName("GameDropDownList").getComponent("GameDropDownList");
        this.gameCommonCtrl = this.node.getChildByName("GameCommonRoot").getComponent("GameCommonController");
        this.gameDropDownList.setGameInfo(BCBMModel.getInstance().kindId, BCBMModel.getInstance().profitPercentage);
        this.daojishiDragon.node.active = false;
        var callFunc = function () {
            this.daojishiDragon.node.active = false;
        }.bind(this);
        this.daojishiDragon.addEventListener(dragonBones.EventObject.COMPLETE, callFunc, this);
        var callFunc1 = function () {
            this.kaijiangAction.node.active = false;
        }.bind(this);
        this.kaijiangAction.addEventListener(dragonBones.EventObject.COMPLETE, callFunc1, this);
        this.kaijiangAction.node.active = false;

        this.runCar = cc.instantiate(this.carPrefab);
        this.runCar.parent = this.node.getChildByName("runCardPoint");
        //模拟跑圈
        // this.slotIndexNode.parent = this.node;

        this.reset();
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        // 获取场景数据
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 0.2);
    }
    messageCallbackHandler(route: string, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.userInfo.uid === Global.Player.getPy('uid')) {
                    ViewMgr.goBackHall(Config.GameType.BCBM);
                }
            }
            else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo]);
                // 初始化界面场景
                this.gameInit(msg.data.gameData);
                let gameStatus = msg.data.gameData.gameStatus;
                let statusTime = msg.data.gameData.statusTime;
                if (!statusTime) {
                    statusTime = msg.data.gameData.statusTime;
                }
                this.showTickTime(gameStatus, statusTime);
            }
        } else if (route === "ReConnectSuccess") {
            cc.log("断线重连");
            if (Global.Player.isInRoom()) {
                cc.log("房间id:" + BCBMModel.getInstance().getRoomId());
                Global.API.hall.joinRoomRequest(BCBMModel.getInstance().getRoomId(), () => {
                    // this.onReconnection();
                }, undefined, Config.GameType.BCBM);
            } else {
                cc.log("没有在房间中");
                ViewMgr.goBackHall(Config.GameType.BCBM);
            }
        } else if (route === 'GameMessagePush') {
            //游戏开始推送
            if (msg.type === BCBMProto.GAME_START_PUSH) {
                this.onGameStart(msg.data);
            }
            else if (msg.type === BCBMProto.GAME_POURGOLD_PUSH) {
                this.userBet(msg.data, true, true);
                this.updateBetCount();
            }
            //游戏结果推送
            else if (msg.type === BCBMProto.GAME_RESULT_PUSH) {
                this.onGameResult(msg.data);
            }
        }
    }
    reset() {
        for (let i = 0; i < this.selfBetCountLabelArr.length; i++) {
            this.betCountList[i] = 0;
            this.selfBetCountList[i] = 0;
        }
        this.turnOffIconLigth();
    }
    setCarPos() {
        var recordArr = BCBMModel.getInstance().getdirRecord();
        if (recordArr.length > 0) {
            this.nowSlotIndex = this.getViewEndLogo(recordArr[recordArr.length - 1])
        }
        else
            this.nowSlotIndex = 0;
        this.nowPos = this.nowSlotIndex + ZZConfig.offSet;
        this.showCarAction(this.nowPos);
    }
    gameInit(gameData) {
        this.setCarPos();
        this.gameInited = true;
        BCBMModel.getInstance().profitPercentage = gameData.parameters.profitPercentage;
        this.gameCommonCtrl.onGameInit(BCBMModel.getInstance().profitPercentage, BCBMModel.getInstance().kindId);
        this.gameCommonCtrl.setHideOtherPlayer(true);
        // this.updateParameters(gameData.parameters);
        this.gameCommonCtrl.updateJetton(gameData);
        if (gameData.gameStatus === BCBMProto.gameStatus.GAME_STARTED) {
            this.onGameStart(gameData);
            this.updateBetRecordList(gameData.betRecordList);
        }
        else if (gameData.gameStatus === BCBMProto.gameStatus.GAME_END || gameData.gameStatus === BCBMProto.gameStatus.NONE) {
            this.gameCommonCtrl.showWait(true);
        }
    }

    /**
     * @param {number} progress 0--0.5
     */
    showProgressTimer(curTime, totalTime) {
        let progress = curTime / totalTime * 0.5;
        this.progressBar.progress = progress;
    }
    //update仪表盘显示
    updateGauge(curTime, totalTime) {
        let offset = curTime / totalTime;
        let gaugeNeedleDegree = 180 * offset;
        if (isNaN(gaugeNeedleDegree))
            return;
        this.sp_gaugeneedle.setRotation(gaugeNeedleDegree + 180);
    }

    showTickTime(gameStatus, statusTime) {

    }
    //更新下注记录
    updateBetRecordList(betRecordList) {
        // 设置筹码
        if (!!betRecordList) {
            for (let key in betRecordList) {
                if (betRecordList.hasOwnProperty(key)) {
                    let userBetInfo = betRecordList[key];
                    for (let i = 0; i < this.betArea_arr.length; i++) {
                        if (!!userBetInfo[i]) {
                            let betInfo = {
                                uid: key,
                                betType: i,
                                count: userBetInfo[i]
                            };
                            this.userBet(betInfo, false, true);
                        }
                    }
                }
            }
        }
        this.updateBetCount();
    }

    onBtnClick(event: cc.Event, param: string) {
        Global.CCHelper.playPreSound();
        if (param === "0" || param === "1" || param === "2" || param === "3" || param === "4"
            || param === "5" || param === "6" || param === "7") {
            let betValue = this.gameCommonCtrl.getCurChipNumber();
            let aeraType = parseInt(param);
            let betTip = this.checkXianhong(aeraType, betValue);
            //非下注状态，不能下注
            var gameStatus = BCBMModel.getInstance().getGameStatus();
            if (gameStatus !== BCBMProto.gameStatus.GAME_STARTED) {
                Tip.makeText("非下注时间，无法下注");
                return;
            }
            else if (!!betTip) {
                Tip.makeText("下注失败，此区域限红" + betTip);
                return;
            }

            roomAPI.gameMessageNotify(BCBMProto.gameUserBetNotify(
                aeraType,
                betValue
            ));
        }
    }
    //检测限红
    checkXianhong(betType, betValue) {
        if (!!this.selfBetCountList) {
            if (!isNaN(this.selfBetCountList[betType])) {
                betValue += this.selfBetCountList[betType];
            }
        }
        if (!!BCBMModel.getInstance().redLimitInfo[betType]) {
            let redLimit = BCBMModel.getInstance().redLimitInfo[betType].redLimit;
            if (!!redLimit) {
                if (betValue > redLimit.max) {
                    return redLimit.min + "-" + redLimit.max;
                }
            }
        }
        return null;
    };
    onDestroy() {
        //移除事件监听
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        BCBMModel.getInstance().onDestroy();
    }

    updateBetCount() {
        for (let i = 0; i < this.betCountList.length; i++) {
            this.betCountLabelArr[i].string = this.betCountList[i];
            this.selfBetCountLabelArr[i].string = this.selfBetCountList[i].toString() + "/";
        }
    }
    //下注
    userBet(data, isTween, showJetton) {
        this.betCountList[data.betType] += data.count;
        if (data.uid === Global.Player.getPy('uid')) {
            this.selfBetCountList[data.betType] += data.count;
        }
        let betRect = this.betArea_arr[data.betType].getBoundingBox();
        this.gameCommonCtrl.userBet(data.uid, data.count, betRect, isTween, showJetton);
    }

    //游戏开始
    onGameStart(gameData) {
        this.reset();
        AudioMgr.stopSoundPeriod("BenChiBaoMa/sound/sound-car-award");
        AudioMgr.playSound("BenChiBaoMa/sound/sound-car-start");
        AudioMgr.startPlayBgMusic("BenChiBaoMa/sound/sound-car-bg", null);
        // AudioMgr.playSound("BenChiBaoMa/sound/startBet");
        this.startFreeTime = gameData.statusTime;

        cc.log("===data.statusTime:%s", gameData.statusTime);
        cc.log("=====this.startFreeTime:%s", this.startFreeTime);
        this.totalFreeTime = BCBMProto.startTotaltime;
        this.turnOnLongLight();
        this.playCarLightAction();

        this.npcStartNode.active = true;
        this.npcStartNode.runAction(cc.sequence(cc.show(), cc.fadeIn(0.1), cc.delayTime(1), cc.fadeOut(1), cc.hide()));

        this.updateBetCount();
        this.node.stopAllActions();
        this.gameCommonCtrl.onGameStart();

        this.showProgressTimer(this.startFreeTime, this.totalFreeTime);
        //更新仪表
        this.updateGauge(this.startFreeTime, this.totalFreeTime);
        this.leftTimeLabel.string = Math.ceil(this.startFreeTime).toString();
        this.statusLabel.string = "下注中";
        this.onBetStart();

    }

    //开始下注
    onBetStart() {
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();
    }
    //结束下注
    onBetStop() {
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();
    }
    //下注结束，结果下推，开始跑圈
    onGameResult(data) {
        this.startFreeTime = ZZConfig.totalEndTime;
        this.totalFreeTime = ZZConfig.totalEndTime;
        this.statusLabel.string = "开奖中";

        //4个角的车灯特效，暂时关闭
        // this.carLightNode.show();
        // this.turnOnCarLight();
        this.scheduleOnce(function () {
            this.startTurnAround(data);
        }, 0.5);
        if (this.isFirstEnter == true) {
            this.isResultStatus = true;
        }
        this.npcGameEndNode.active = true;
        this.npcGameEndNode.runAction(cc.sequence(cc.show(), cc.fadeIn(0.1), cc.delayTime(0.5), cc.fadeOut(0.5), cc.hide()));
        this.scheduleOnce(function () {
            this.onBetStop.bind(this)
        }, 0.5);

        this.gameResultData = data;
        if (this.enableBet) this.onBetStop();
        // this.node.stopAllActions();
        // let cardCount = data.resout.cardsArr[0].length + data.resout.cardsArr[1].length;

        if (!isNaN(data.profitPercentage)) {
            cc.log("税收比例:" + data.profitPercentage);
            BCBMModel.getInstance().profitPercentage = data.profitPercentage;
            this.gameCommonCtrl.profitPercentage = BCBMModel.getInstance().profitPercentage;
            this.gameDropDownList.setGameInfo(BCBMModel.getInstance().kindId, BCBMModel.getInstance().profitPercentage);
        }
    }

    //显示结果:筹码飞行，金币变化
    onShowResult() {

        this.gameCommonCtrl.onGameResult(this.gameResultData.scoreChangeArr);
        // let scoreChangeArr = [];
        // for (let key in this.gameResultData.scoreChangeArr) {
        //     if (this.gameResultData.scoreChangeArr.hasOwnProperty(key)) {
        //         scoreChangeArr.push({
        //             uid: key,
        //             score: this.gameResultData.scoreChangeArr[key]
        //         });
        //     }
        // }
        // this.gameCommonCtrl.onNewGameResult(scoreChangeArr, 2);
    }
    //视图转换
    getViewEndLogo(end: number): number {
        var m = 8 * Math.floor(end / 8);
        var n = m + 8;
        for (let i = m; i < n; i++) {
            if (this.NodeCarIconItem_arr[i].logoType === (end % 8)) {
                return i;
            }
        }
    }
    playSoundMusic() {
        if (this.turnStatus == 1) {

        }
        else if (this.turnStatus == 2) {

        }
        else if (this.turnStatus == 3) {
            // AudioMgr.stopSound(this.carRunSoundEf);
            AudioMgr.stopSoundPeriod("BenChiBaoMa/sound/sound-car-run");
            AudioMgr.playSoundPeriod("BenChiBaoMa/sound/sound-car-turn-end", null);
        }
    }
    update(dt) {
        this.playSoundMusic();
        if (BCBMModel.getInstance().getGameStatus() === BCBMProto.gameStatus.GAME_STARTED || this.turnArounding) {
            this.startFreeTime -= dt;
            if (this.startFreeTime < 0 || isNaN(this.startFreeTime)) {
                this.startFreeTime = 0;
            }
            this.showProgressTimer(this.startFreeTime, this.totalFreeTime);
            //更新仪表
            this.updateGauge(this.startFreeTime, this.totalFreeTime);
            this.leftTimeLabel.string = Math.ceil(this.startFreeTime).toString();
        }
        if (BCBMModel.getInstance().getGameStatus() == BCBMProto.gameStatus.GAME_STARTED) {
            let temp = Math.ceil(this.startFreeTime);
            if (temp == this.lastTime) {
                return;
            }
            if (temp <= 3) {
                AudioMgr.playSound("BenChiBaoMa/sound/CountDown" + temp);
                if (temp == 3) {
                    this.daojishiDragon.node.active = true;
                    this.daojishiDragon.playAnimation("newAnimation", 1);
                    AudioMgr.playSound("BenChiBaoMa/sound/sound-car-start");
                }
            }
            this.lastTime = temp;
        }
    }
    /**
     * 开始转圈
     */
    startTurnAround(data: any, canAllBlink: boolean = false, finishCallback = null) {
        let endIndex = this.getViewEndLogo(data.Resultindex);
        let endPos = endIndex + ZZConfig.offSet * 2;
        // this.callback = finishCallback || this.onFinishAround.bind(this);
        //关闭所有 车标背景灯
        this.turnOffIconLigth();
        // AudioMgr.stopSoundPeriod("BenChiBaoMa/sound/sound-car-bg");
        //汽车轰鸣 开始
        AudioMgr.playSoundPeriod("BenChiBaoMa/sound/sound-car-run", null);
        //汽车跑动 背景音乐
        AudioMgr.startPlayBgMusic("BenChiBaoMa/sound/sound-car-award", null);
        this.turnArounding = true;
        this.turnAroundedSlotArray = [];

        this.nowPos = this.nowSlotIndex + ZZConfig.offSet;
        let Vt = ZZConfig.a1 * ZZConfig.accTime;
        var accS = Vt * ZZConfig.accTime / 2;
        var uniS = Vt * ZZConfig.uniTime;
        var decS = Vt * ZZConfig.breakTime / 2;

        var allS = (this.nowPos + accS + uniS + decS);

        var uniDyEx = endPos - allS % this.NodeCarIconItem_arr.length //- 0.5; // 在匀速期间 额外增加的位移, 控制结果用的
        var uniDtEx = uniDyEx / Vt; // 在匀速期间 额外增加的时间
        this.uniTime = ZZConfig.uniTime + uniDtEx;

        this.time = 0;
        this.accS = 0;
        this.uniS = 0;
        this.breakS = 0;
        this.startIndex = this.nowPos;
        this.turnArounding = true;
        //这里开启定时器 设置车的位置
        this.schedule(this.run.bind(this, endIndex, data), ZZConfig.interval)
    }
    run(endIndex, data) {
        this.time += ZZConfig.interval;
        let Vt = ZZConfig.a1 * ZZConfig.accTime;
        let posY: number;
        if (this.time < ZZConfig.accTime) {
            this.accS = ZZConfig.a1 * this.time * this.time / 2;
            posY = this.accS;
            this.turnStatus = 1;
            this.tempPos = posY;
            this.showCarAction(this.startIndex + posY);
        }
        else if (this.time >= ZZConfig.accTime && this.time < (ZZConfig.accTime + this.uniTime)) {
            let t = (this.time - ZZConfig.accTime); // 用实际的加速时间计算减速时间
            this.uniS = Vt * t;
            posY = this.accS + this.uniS;
            this.turnStatus = 2;
            this.tempPos = posY;
            this.showCarAction(this.startIndex + posY);
        }
        else if (this.time >= ZZConfig.accTime + this.uniTime && this.time < ZZConfig.accTime + this.uniTime + ZZConfig.breakTime) {
            let t = (this.time - ZZConfig.accTime - this.uniTime);

            if (t > ZZConfig.breakTime - 0.02) {
                this.unscheduleAllCallbacks();
                cc.log("===== 进入位移补偿", endIndex + ZZConfig.offSet);
                cc.log("=====this.nowPos : %s", (this.startIndex + this.tempPos) % this.NodeCarIconItem_arr.length);
                this.schedule(function () {
                    // cc.log("=====endPos:%s,",endIndex + ZZConfig.offSet);
                    // cc.log("=====this.tempPos:%s",this.tempPos);
                    // cc.log("=====this.nowPos : %s",(this.startIndex + this.tempPos) % this.NodeCarIconItem_arr.length);
                    if (endIndex != 0 && endIndex + ZZConfig.offSet <= (this.startIndex + this.tempPos) % this.NodeCarIconItem_arr.length) {
                        this.unscheduleAllCallbacks();
                        this.onFinishAround(Math.floor(endIndex), data);
                        return;
                    }
                    if (endIndex == 0 && (this.startIndex + this.tempPos) % this.NodeCarIconItem_arr.length >= endIndex + ZZConfig.offSet
                        && (this.startIndex + this.tempPos) % this.NodeCarIconItem_arr.length < 1) {
                        this.unscheduleAllCallbacks();
                        this.onFinishAround(Math.floor(endIndex), data);
                        return;
                    }
                    this.tempPos += ZZConfig.interval * this.tempV;
                    this.showCarAction(this.startIndex + this.tempPos);
                }, ZZConfig.interval);
            } else {
                this.breakS = Vt * t - (Vt / ZZConfig.breakTime) * t * t / 2;
                posY = this.accS + this.uniS + this.breakS;
                this.tempV = Vt - ZZConfig.a1 * t;
                this.tempPos = posY;
                this.showCarAction(this.startIndex + posY);
            }
            this.turnStatus = 3;
        }
        this.nowSlotIndex = Math.floor((this.startIndex + posY) % this.NodeCarIconItem_arr.length);
        if (!isNaN(this.nowSlotIndex)) {
            this.NodeCarIconItem_arr[this.nowSlotIndex].brightIconLight();
            if (this.turnAroundedSlotArray.indexOf(this.nowSlotIndex) < 0) {
                this.turnAroundedSlotArray.push(this.nowSlotIndex);
            }
            if (this.turnAroundedSlotArray.length >= this.NodeCarIconItem_arr.length) {
                //长条灯再开
                this.NodeCarIconItem_arr[this.nowSlotIndex].playLongLightAction();
            } else {
                //长条灯先灭
                this.NodeCarIconItem_arr[this.nowSlotIndex].turnOffBackGroundLight()
            }
        }
    }
    onFinishAround(endIndex: number, data: any) {
        AudioMgr.stopSoundPeriod("BenChiBaoMa/sound/sound-car-turn-end");
        if (this.breakAudio)
            this.breakAudio.destroy();
        AudioMgr.startPlayBgMusic("BenChiBaoMa/sound/sound-car-award", null);
        AudioMgr.playSound("BenChiBaoMa/sound/result" + (data.Resultindex % 8) % 4);
        this.onShowWin((data.Resultindex % 8).toString());
        this.turnStatus = 0;
        this.nowSlotIndex = endIndex;
        this.nowPos = this.nowSlotIndex + ZZConfig.offSet;
        this.startIndex = this.nowPos;
        this.turnArounding = false;
        this.turnOffCarLight();
        this.BCBMRecord.emit('OnFinishRun', data.Resultindex % 8);
        this.scheduleOnce(function () {
            this.onShowResult();
            this.NodeCarIconItem_arr[endIndex].blink(); //闪烁
        }.bind(this), 0.6);

        this.kaijiangAction.node.parent = this.NodeCarIconItem_arr[endIndex].node;
        this.kaijiangAction.node.setPosition(0, 0);
        this.kaijiangAction.node.active = true;
        this.kaijiangAction.playAnimation("newAnimation", 1);

        let viewUrl = ViewMgr.getNodeUrl(this.node) + "/" + "BCBMSettleLayer";
        let prefabUrl = "BenChiBaoMa/UIPrefabs/BCBMSettleLayer";
        this.scheduleOnce(function () {
            ViewMgr.open({
                viewUrl: viewUrl,
                prefabUrl: prefabUrl
            },
                { key: "init", arguments: [data.Resultindex % 8, data.scoreChangeArr] },
                function () {
                    this.scheduleOnce(function () {
                        if (cc.isValid(this.node.getChildByName("BCBMSettleLayer"))) {
                            ViewMgr.close(viewUrl);
                        }
                    }.bind(this), 2);
                }.bind(this)
            );
        }.bind(this), 2);
    }
    onShowWin(winType) {
        let node = this.winType.getChildByName(winType);
        if (!!node) {
            node.active = true;
            let action = cc.sequence([cc.fadeIn(0.2), cc.delayTime(0.1), cc.fadeOut(0.2)]);
            node.opacity = 0;
            node.runAction(cc.repeat(action, 3));
        }
    }
    //返回ture表示在直线上，返回false表示在弯道上
    checkLine(moveDistance) {
        var upY = 241;
        var downY = -132;
        var startX = -244.5;
        var endX = 251.5;
        var distance = endX - startX;

        if (moveDistance >= this.leftTop && moveDistance < this.rightTop) { //上面对直线
            moveDistance -= this.leftTop;
            var temp1 = moveDistance / (this.rightTop - this.leftTop);
            var temp2 = temp1 * distance;

            this.runCar.setRotation(180);
            this.runCar.setPosition(startX + temp2, upY);
            return true;
        }
        if (moveDistance >= this.rightButtom && moveDistance < this.leftButtom) { //下面的直线
            moveDistance -= this.rightButtom;
            var temp1 = moveDistance / (this.rightTop - this.leftTop);
            var temp2 = temp1 * distance;

            this.runCar.setRotation(0);
            this.runCar.setPosition(endX - temp2, downY);
            return true;
        }
        return false;
    }

    //弯道运行
    curveAction(moveDistance) {
        var radius = 186.5;

        if (moveDistance >= this.rightTop && moveDistance < this.rightButtom) {
            var centerx = 251.5;
            var centery = 54.5;
            var totalFlag = this.rightButtom - this.rightTop;
            var curveValue = moveDistance - this.rightTop;
            var angle = curveValue / (totalFlag * 2) * 360;
            var huduValue = angle * Math.PI / 180;
            this.runCar.setRotation(angle + 180);
            var sinValue = Math.sin(huduValue);
            var updateX = sinValue * radius;
            var cosValue = Math.cos(huduValue);
            var updateY = cosValue * radius;
            this.runCar.setPosition(centerx + updateX, centery + updateY);
            return;
        }

        radius = 186.5;
        var totalDistence = 32;
        if (moveDistance >= this.leftButtom) {
            var centerx = -244.5;
            var centery = 54.5;
            var totalFlag = totalDistence - this.leftButtom;
            var curveValue = moveDistance - this.leftButtom;
            var angle = curveValue / (totalFlag * 2) * 360;
            var huduValue = angle * Math.PI / 180;
            this.runCar.setRotation(angle);
            var sinValue = Math.sin(huduValue);
            var updateX = sinValue * radius;
            var cosValue = Math.cos(huduValue);
            var updateY = cosValue * radius;
            this.runCar.setPosition(centerx - updateX, centery - updateY);
        }
    }

    //显示车辆行动
    showCarAction(nowPos) {
        var timeValue = Math.floor(nowPos / this.NodeCarIconItem_arr.length);
        var distance = nowPos - timeValue * this.NodeCarIconItem_arr.length;

        if (this.turnStatus == 1 || this.turnStatus == 2)
            this.runCar.getComponent("RunCar").turnOnTheLamp();
        else
            this.runCar.getComponent("RunCar").turnOffTheLamp();

        var isLineAction = this.checkLine(distance);
        if (isLineAction) {
            return;
        }
        this.curveAction(distance);
    }
    //先关闭所有logo 灯
    turnOffIconLigth() {
        for (let i = 0; i < this.NodeCarIconItem_arr.length; i++) {
            this.NodeCarIconItem_arr[i].turnOff();
        }
    }
    //开四角的车灯动画
    playCarLightAction() {
        this.turnOnCarLight();
        AudioMgr.playSound("BenChiBaoMa/sound/JiuJiu");
        this.carLight1.runAction(cc.sequence(cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2)));
        this.carLight2.runAction(cc.sequence(cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2)));
        this.carLight3.runAction(cc.sequence(cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2)));
        this.carLight4.runAction(cc.sequence(cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2), cc.fadeOut(0.2), cc.fadeIn(0.2)));
    }
    //开边角的车灯
    turnOnCarLight() {
        this.carLight1.active = true;
        this.carLight2.active = true;
        this.carLight3.active = true;
        this.carLight4.active = true;
    }
    turnOnLongLight() {
        for (let i = 0; i < this.NodeCarIconItem_arr.length; i++) {
            this.NodeCarIconItem_arr[i].turnOnBackGroundLight();
        }
    }
    //关边角的车灯
    turnOffCarLight() {
        this.carLight1.active = false;
        this.carLight2.active = false;
        this.carLight3.active = false;
        this.carLight4.active = false;
    }


}
