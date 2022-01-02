import {WLZBModel} from "./WLZBModel";
import {btnType} from "./WLZBLongButton"
import RoomProto = require('../../API/RoomProto');
import gameProto = require('./WLZBProto');
import BaseView, {PUSH_DATA} from "../../BaseClass/BaseView";



const {ccclass, property} = cc._decorator;

@ccclass
export default class WLZBMainDialog extends cc.Component {
    @property(cc.Prefab)
    fuPrefab: cc.Prefab = undefined;
    @property(cc.Node)
    startBtn: cc.Node = null;
    @property(cc.Node)
    buttons:cc.Node[] = [];
    @property(cc.Node)
    mixArr:cc.Node[] = [];
    @property(cc.Node)
    itemArr: cc.Node[] = [];
    @property(cc.Node)
    itemAddArr: cc.Node[] = [];
    @property(cc.Label)
    topLabel:cc.Label = undefined;
    @property(cc.Node)
    tipsArr:cc.Node[] = [];
    @property(cc.Label)
    bottomLabel:cc.Label = undefined;
    @property(cc.Label)
    zongYingfen:cc.Label = undefined;
    @property(cc.Label)
    costLab:cc.Label = undefined;
    @property(cc.Label)
    userGold:cc.Label = undefined;
    @property(dragonBones.ArmatureDisplay)
    flowerAni1: dragonBones.ArmatureDisplay = undefined;
    @property(dragonBones.ArmatureDisplay)
    flowerAni2: dragonBones.ArmatureDisplay = undefined;
    @property(cc.Node)
    flowerIcon:cc.Node = undefined;
    @property(cc.Label)
    flowerLabel:cc.Label = undefined;
    @property(cc.Sprite)
    voiceIcon :cc.Sprite = undefined;
    @property(cc.SpriteFrame)
    voiceiconOn :cc.SpriteFrame = undefined;
    @property(cc.SpriteFrame)
    voiceiconOff: cc.SpriteFrame = undefined;
    private gameDropDownList: any = null;
    private rollSpeed: number = 4000;
    private rollHeight:number = 680;

    private WLZBLongButtonScript = null;

    private isAuto: boolean = false;

    private topWinText = [
        "挡不住的好手气",
        "太棒了！",
        "这样转就对了！",
        "给力！给力！真给力！",
    ];
    private topLoseText = [
        "再接再厉",
        "再来一次",
        "这样转就对了！",
        "给力！给力！真给力！",
    ];

    //           "9", "10", "J", "Q", "K", "A", "红包", "乌龟", "鲤鱼", "狮子", "凤凰","乾隆通宝", "龙"
    ITEM_TYPES = [0,    1,   2,   3,   4,   5,    6,     7,     8,     9,     10,    11,     12];
    ITEM_NAME = ["9", "10", "J", "Q", "K", "A", "红包", "乌龟", "鲤鱼", "狮子", "凤凰","乾隆通宝", "龙"];
    private ADD_COUNT: number = 1;
    private MAX_ADD_TIMES: number = 5;
    private isInWuLong: boolean = false;
    private posArr = [cc.v2(-50,50),cc.v2(50,60),cc.v2(50,-60),cc.v2(-50,-50)];
    private zongyingfenAni: cc.Node = undefined;
    private voiceOn: boolean = true;
    private soundArr =[false,false,false,false,false];

    onLoad() {
        this.itemArr[0].parent.active = false;
        this.itemArr[1].parent.active = false;
        this.itemArr[2].parent.active = false;
        this.itemArr[3].parent.active = false;
        this.itemArr[4].parent.active = false;
    }

    start() {
        this.WLZBLongButtonScript = this.startBtn.getComponent("WLZBLongButton");

        this.gameDropDownList = this.node.getChildByName("GameDropDown").getComponent("GameDropDown");
        this.gameDropDownList.setGameInfo(WLZBModel.getInstance().getKindId(), WLZBModel.getInstance().getProfitPercentage());
        // AudioMgr.startPlayBgMusic("Game/SHZ/sound/sound_water_all_other", null);

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        API.room.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
        this.onAddButtonHandler(0);
        this.initResultNode();
        this.initMixNode();
        this.init();
        if (AudioMgr.getSoundVolume() <= 0 && AudioMgr.getMusicVolume() <= 0 ){
            this.voiceOn = false;
            this.voiceIcon.spriteFrame = this.voiceiconOff;
        }
        else {
            this.voiceOn = true;
            this.voiceIcon.spriteFrame = this.voiceiconOn;
        }
    }
    init() {
        this.userGold.string = Global.Player.getPy('gold');
        this.zongYingfen.string = 0.00.toString();
        this.costLab.string = (WLZBModel.getInstance().getBaseScore() * this.ADD_COUNT).toString();
    }
    initResultNode() {
        for (let i = 0; i < this.itemArr.length; i++) {
            let WLZBItemSprite = this.itemArr[i].getComponent("WLZBItemSprite");

            let callFunc = function(){
                if (i === this.itemArr.length -1 ){
                    this.itemArr[0].parent.active = true;
                    this.itemArr[1].parent.active = true;
                    this.itemArr[2].parent.active = true;
                    this.itemArr[3].parent.active = true;
                    this.itemArr[4].parent.active = true;
                }
            };
            Global.CCHelper.updateSpriteFrame('Game/WLZB/image/icon/' + Global.Utils.getRandomNum(0, 11), WLZBItemSprite.icon,callFunc.bind(this))
        }
    }
    //初始化模糊节点
    initMixNode() {
        for (let i = 0; i < this.mixArr.length; i++) {
            this.mixArr[i].position = cc.v2(this.mixArr[i].x,this.rollHeight );
            this.mixArr[i].active = false;
            let mixNode = this.mixArr[i].children;
            for (let j = 0; j < mixNode.length; j++) {
                let node = mixNode[j].getChildByName("icon").getComponent(cc.Sprite);
                Global.CCHelper.updateSpriteFrame('Game/WLZB/image/fuzzyIcon/' + Global.Utils.getRandomNum(0, 12), node)
            }
        }
    }
    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        WLZBModel.getInstance().onDestroy();
    }

    messageCallbackHandler(router,msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.userInfo.uid === WLZBModel.getInstance().getSelfUid()) {
                    ViewMgr.goBackHall(Config.GameType.WLZB);
                }
            }
            else if(msg.type === RoomProto.ROOM_USER_INFO_CHANGE_PUSH){
                // this.updateUserGold(msg.data);
            }
            else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo]);
                // this.gameInit(msg.data.gameData); // 初始化界面场景
            }
            else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
                Confirm.show("当前房间已解散！", () => {
                    ViewMgr.goBackHall(Config.GameType.WLZB)
                })
            }
        } else if (router === "GameMessagePush") {
            if (msg.type === gameProto.ROB_RESULTS_PUSH) {
                this.startGame(msg.data.enddata);
            }
            else if (msg.type === gameProto.ROB_USER_SCORE_PUSH) {
                Tip.makeText("金币不足，请先充值")
            }
            //五龙争霸下推
            else if (msg.type === gameProto.ROB_START_WULONG_PUSH) {
                this.isInWuLong = true;
                this.zongYingfen.string = 0.00.toString();
                this.topLabel.string = "剩余免费次数：" + msg.data.freetime;
                this.changeButtonStatus(false);
                AudioMgr.startPlayBgMusic("Game/WLZB/sound/5D_FreeGame_BG", null);

            }
        } else if (router === "ReConnectSuccess") {
            cc.log("断线重连");
            if (Global.Player.isInRoom()) {
                cc.log("房间id:" + WLZBModel.getInstance().getRoomId());
                Global.API.hall.joinRoomRequest(WLZBModel.getInstance().getRoomId(), () => {
                }, undefined, Config.GameType.WLZB);
            } else {
                cc.log("没有在房间中");
                ViewMgr.goBackHall(Config.GameType.WLZB);
            }
        }
    }
    onBtnClick(event,param) {
        switch (param) {
            case 'add':
                this.onAddButtonHandler(1);
                break;
            case 'sub':
                cc.log("====== 点击 sub");
                this.onAddButtonHandler(-1);
                break;
            case "maxChip":
                this.ADD_COUNT = this.MAX_ADD_TIMES;
                this.costLab.string = (this.ADD_COUNT * WLZBModel.getInstance().getBaseScore() ).toString();
                break;
            case "help":
                let viewUrl = {
                    viewUrl: "WLZBHelp",
                    prefabUrl: "Game/WLZB/WLZBHelp"
                };
                this.viewMgrOpen(viewUrl);
                break;
            case "voice":
                this.voiceOn = !this.voiceOn;
                if (this.voiceOn){
                    AudioMgr.setMusicVolume(1);
                    AudioMgr.setSoundVolume(1);
                    this.voiceIcon.spriteFrame = this.voiceiconOn;
                }
                else {
                    AudioMgr.setMusicVolume(0);
                    AudioMgr.setSoundVolume(0);
                    this.voiceIcon.spriteFrame = this.voiceiconOff;
                }
                break;
        }
        AudioMgr.playSound("Game/WLZB/sound/5D_button")
    }

    async viewMgrOpen(viewUrl: string | { viewUrl: string, prefabUrl?: string, isShowAction?: boolean, isWait?: boolean }, msg?: PUSH_DATA, callback?: (script: BaseView) => void) {

        await ViewMgr.open(viewUrl, msg, callback);
    }

    numAction(startNum: number,endNum: number,label: cc.Label){

        let constTime = 0.7;
        let interval = 0.02;
        let repeatCount = Math.round(constTime / interval);
        let perAddCount = (endNum - startNum) / repeatCount;
        let tempNum = 0;
        let callFunc = function () {
            tempNum += perAddCount;
            label.string = (startNum + tempNum).toFixed(2).toString();
            if (startNum + tempNum >= endNum) {
                label.string = endNum.toFixed(2).toString();
                this.unschedule(callFunc);
            }
        };
        this.schedule(callFunc,interval,repeatCount-1);

    }
    updateZongYinfen(){

    }
    // 自动开始游戏
    autoStartGame(btnType,delay:number = 0.5){
        this.scheduleOnce(function () {
            this.WLZBLongButtonScript.changeBtnState(btnType);
            this.gameStartNotify();
        }.bind(this), delay);
    }
    /*
    * 逻辑处理
    * */
    // 开始游戏
    startGame(data){
        for (let i = 0; i < this.soundArr.length; i++) {
            this.soundArr[i] = false;
        }
        // this.fuAni = cc.instantiate(this.fuPrefab);
        // this.fuAni.parent = this.node;
        // var anim = this.fuAni.getComponent(cc.Animation);
        // anim.play("fuClip");

        //公告更新
        if (!this.isInWuLong){
            this.topLabel.node.parent.active = false;
            for (let i = 0; i < this.tipsArr.length; i++) {
                this.tipsArr[i].active = false;
            }
            this.tipsArr[Global.Utils.getRandomNum(0, this.tipsArr.length-1)].active = true;
        }

        for (let i = 0; i < this.itemArr.length; i++) {
            this.itemArr[i].stopAllActions();
            this.itemArr[i].getComponent("WLZBItemSprite").initScale();
        }
        if (this.isInWuLong) {
            this.WLZBLongButtonScript.changeBtnState(btnType.wuLong);
        }
        else{
            this.userGold.string = (Number(this.userGold.string) - this.ADD_COUNT * WLZBModel.getInstance().getBaseScore()).toFixed(2).toString();

            this.zongYingfen.string = 0.00.toString();
            if (this.WLZBLongButtonScript.btnType === btnType.auto){
                this.WLZBLongButtonScript.changeBtnState(btnType.auto);
            }
            else {
                this.WLZBLongButtonScript.changeBtnState(btnType.rolling);
            }
        }
        this.bottomLabel.string = "祝您好运！";
        this.changeButtonStatus(false);

        // 开始滚动
        this.startRolling();

        // AudioMgr.playSound("Game/SHZ/sound/sound_water_bt_start");
    }
    //开始滚动
    startRolling() {
        let alldelay = 0;

        for (let i = 0; i < this.mixArr.length; i++) {
            let item = this.itemArr[i].parent;
            let mixCol = this.mixArr[i];
            mixCol.position = cc.v2(mixCol.x,this.rollHeight);
            mixCol.active = true;
            let delay = 0.1 * i;
            alldelay += delay;
            this.mixArr[i].active = true;
            let nh = this.mixArr[i].height;
            this.itemNodeRoll(item,delay,i === this.mixArr.length-1 ,this.makeResultNode.bind(this));
            mixCol.runAction(cc.sequence(
                cc.delayTime(delay),
                //移动到底部
                cc.moveTo((nh) / this.rollSpeed, cc.v2(mixCol.x, - nh + this.rollHeight)),
                cc.spawn(
                    cc.moveTo(this.rollHeight/this.rollSpeed,cc.v2(mixCol.x, - nh-30)),
                    cc.callFunc(function(){
                        this.itemNodeStop(item,0,0,i === this.mixArr.length - 1,this.itemRollingEnd.bind(this),i);
                    }.bind(this))
                )
            ));
        }
    }

    //游戏结果
    // 10 11 12 13 14
    // 5  6  7  8  9
    // 0  1  2  3  4
    makeResultNode() {
        if (WLZBModel.getInstance().getEndData()) {
            let itemData = WLZBModel.getInstance().getEndData().itemData;
            for (let i = 0; i < itemData.length; i++) {
                let WLZBItemSprite = this.itemArr[i].getComponent("WLZBItemSprite");
                Global.CCHelper.updateSpriteFrame('Game/WLZB/image/icon/' + (WLZBModel.getInstance().getEndData().itemData[i]), WLZBItemSprite.icon);
                WLZBItemSprite.iconIndex = WLZBModel.getInstance().getEndData().itemData[i];
                if (WLZBItemSprite.iconIndex === 12) {
                    let longindex = WLZBModel.getInstance().getEndData().longindex;
                    if (this.isInWuLong && longindex != 5 ){
                        Global.CCHelper.updateSpriteFrame('Game/WLZB/image/icon/' + "d5_" + longindex, WLZBItemSprite.icon);
                    }

                    WLZBItemSprite.setDragonAsset1('Game/WLZB/animation/dragonWin/lzj_ske','Game/WLZB/animation/dragonWin/lzj_tex');

                }
                else if (WLZBItemSprite.iconIndex === 6 && this.isInWuLong){
                    WLZBItemSprite.setDragonAsset1('Game/WLZB/animation/hongbao/hongbao_ske','Game/WLZB/animation/hongbao/hongbao_tex');
                }
            }
            for (let j = 0; j < this.itemAddArr.length; j++) {
                let node = this.itemAddArr[j].getChildByName("icon").getComponent(cc.Sprite);
                Global.CCHelper.updateSpriteFrame('Game/WLZB/image/icon/' + Global.Utils.getRandomNum(0, 11), node)
            }
        }
    }
    // batchNode滚动
    itemNodeRoll(itemNode,delay,isLast,callFunc){
        itemNode.runAction(cc.sequence(
            cc.delayTime(delay),
            cc.moveBy(this.rollHeight / this.rollSpeed, cc.v2(0, -this.rollHeight)),
            cc.callFunc(function(){
                itemNode.setPosition(itemNode.x,this.rollHeight);
                if(isLast)
                    callFunc();
            }.bind(this))
        ));
    }
    // batchNode滚动
    itemNodeStop(itemNode,delay, posY,isLast,callFunc,i){
        var offset = 175;
        let itemData = WLZBModel.getInstance().getEndData().itemData;
        for (let j = i * 5 ; j < i * 5 + 5; j++) {
            if (itemData[j] === 11) {
                this.soundArr[i] = true;
            }
        }
        let bBofangDajiang = true;
        for (let k = 0; k <= i;k++) {
            if (!this.soundArr[k]){
                bBofangDajiang = false;
            }
        }
        if (bBofangDajiang){
            AudioMgr.playSound("Game/WLZB/sound/5D_Coin" + i + "Stop");
        }
        else {
            AudioMgr.playSound("Game/WLZB/sound/5D_ReelStop");
        }

        var actMoveBy = cc.moveTo((this.rollHeight + offset) / this.rollSpeed, cc.v2(0, posY-offset));
        var actMoveUp = cc.moveTo(0.1, cc.v2(0, posY));
        itemNode.runAction(cc.sequence(
            cc.delayTime(delay),
            actMoveBy,
            actMoveUp,
            cc.callFunc(function () {
                if (isLast && typeof callFunc === "function")
                    callFunc();
            }.bind(this))
        ));
    }
    //滚动结束
    itemRollingEnd() {
        this.initMixNode();
        // this.stopBtn.active = false;
        //这里处理中奖
        this.scheduleOnce(function(){
            this.checkPrize();
        }.bind(this),0.3);
    }
    // 不管有没中奖 兑奖
    checkPrize() {
        if (this.isInWuLong) {
            this.topLabel.string = "剩余免费次数：" + WLZBModel.getInstance().getFreeTimes();
            let prizePerRound = WLZBModel.getInstance().getEndData().prizePerRound ;
            let redscore = WLZBModel.getInstance().getEndData().redscore;
            if (prizePerRound > 0 || redscore > 0) {
                if (WLZBModel.getInstance().getEndData().prizePerRound > 0) {
                    this.checkNormalPrize();
                }
                //红包中奖
                if(WLZBModel.getInstance().getEndData().redscore > 0 ){
                    this.checkHongBaoPrize();
                }
            }
            else {
                if (WLZBModel.getInstance().getFreeTimes() > 0){
                    this.autoStartGame(btnType.wuLong,1.5);
                }else{
                    this.numAction(Number(this.userGold.string),WLZBModel.getInstance().getGold(),this.userGold);
                    AudioMgr.stopBgMusic();
                    Tip.makeText("免费次数已用完！");
                    this.changeButtonStatus(true);
                    this.WLZBLongButtonScript.changeBtnState(btnType.ready);
                    this.isInWuLong = false;
                }
            }
        }
        else {
            if (WLZBModel.getInstance().getEndData().prizePerRound <= 0) {
                if (this.WLZBLongButtonScript.btnType === btnType.auto ){
                    this.autoStartGame(btnType.auto);
                }
                else {
                    this.WLZBLongButtonScript.changeBtnState(btnType.ready);
                    this.changeButtonStatus(true);
                }
            }
            else {
                this.checkNormalPrize();
                if (WLZBModel.getInstance().getEndData().isWuLong){
                    this.checkWuLongPrize();
                }
            }
        }
    }
    // 兑换五龙奖
    checkWuLongPrize() {
        if (this.isInWuLong) return;
        this.scheduleOnce(function () {
            this.loadWuLongLayer();
        },1.5)
    }
    newDragonBonesComp() {
        let node = new cc.Node();
        let comp = node.addComponent(dragonBones.ArmatureDisplay);
        return node;
    }
    playCoin(spriteNode,dragonAsset,dragonAtlasAsset,desPos){
        for (let i = 0; i < 4; i++) {
            let dbNode = this.newDragonBonesComp();
            dbNode.parent = this.node;
            let worldPos = spriteNode.parent.convertToWorldSpaceAR(spriteNode.getPosition());
            let nodePos = this.node.convertToNodeSpaceAR(worldPos);
            let newNodePos = cc.v2(nodePos.x + this.posArr[i].x,nodePos.y + this.posArr[i].y);
            dbNode.setPosition(newNodePos);
            let db = dbNode.getComponent(dragonBones.ArmatureDisplay);
            db.dragonAsset = dragonAsset, db.dragonAtlasAsset = dragonAtlasAsset;
            db.armatureName = "armatureName";
            db.timeScale = 3;
            db.playAnimation("jb",0);

            let worldPos1 = this.zongYingfen.node.parent.convertToWorldSpaceAR(this.zongYingfen.node.getPosition());
            let desPos = this.node.convertToNodeSpaceAR(worldPos1);

            dbNode.runAction(cc.sequence(
                cc.moveTo(1,desPos),
                cc.callFunc(function () {
                    dbNode.destroy();
                    if (!this.zongyingfenAni) {
                        this.playBottomCoinAni();
                    }
                }.bind(this))
            ));
        }
    }

    async playBottomCoinAni(){
        if (this.zongyingfenAni) return;
        this.zongyingfenAni = this.newDragonBonesComp();
        let [err1, gemBoom] = await AssetMgr.loadDragonBones("Game/WLZB/animation/hongbao");
        this.zongyingfenAni.parent = this.node;
        let db = this.zongyingfenAni.getComponent(dragonBones.ArmatureDisplay);
        db.dragonAsset = gemBoom[0], db.dragonAtlasAsset = gemBoom[1];

        let worldPos1 = this.zongYingfen.node.parent.convertToWorldSpaceAR(this.zongYingfen.node.getPosition());
        let desPos = this.node.convertToNodeSpaceAR(worldPos1);
        this.zongyingfenAni.setPosition(desPos);
        db.armatureName = "armatureName";
        var callFunc = function(){

            this.zongyingfenAni.active = false;
            this.zongyingfenAni.removeFromParent();
            this.zongyingfenAni.destroy();
            this.zongyingfenAni = undefined;
        };
        db.off(dragonBones.EventObject.COMPLETE,callFunc,this);
        db.on(dragonBones.EventObject.COMPLETE,callFunc,this);
        db.playAnimation("gx",1);
    }
    //红包兑奖
    async checkHongBaoPrize(){
        //更新动画
        let [err1, gemBoom] = await AssetMgr.loadDragonBones("Game/WLZB/animation/hongbao");
        let reditemTypes = WLZBModel.getInstance().getEndData().reditemTypes;
        let iconIndex = this.itemArr[reditemTypes[0]].getComponent("WLZBItemSprite").iconIndex;
        AudioMgr.playSound("Game/WLZB/sound/5D_win" + iconIndex);

        for (let i = 0; i < reditemTypes.length; i++) {
            let WLZBItemSprite = this.itemArr[reditemTypes[i]].getComponent("WLZBItemSprite");
            WLZBItemSprite.playAction();
            WLZBItemSprite.node.runAction(cc.sequence(
                cc.callFunc(function () {
                    // WLZBItemSprite.playHongBaoAni();

                    let fuAni = cc.instantiate(this.fuPrefab);
                    fuAni.parent = WLZBItemSprite.node;
                    fuAni.setPosition(0,0);
                    var anim = fuAni.getComponent(cc.Animation);
                    anim.play("fuClip");
                }.bind(this)),
                cc.delayTime(0.8),
                cc.callFunc(function () {
                    this.playCoin(WLZBItemSprite.node,gemBoom[0],gemBoom[1])
                }.bind(this)),
            ));
        }

        //1.播放飞金币动画

        //2.更新金币
        let redscore = WLZBModel.getInstance().getEndData().redscore;
        let prizePerRound = WLZBModel.getInstance().getEndData().prizePerRound;
        this.bottomLabel.string = (redscore + prizePerRound).toFixed(2);
        this.numAction(Number(this.zongYingfen.string),Number(this.zongYingfen.string) + redscore + prizePerRound,this.zongYingfen)
        // this.zongYingfen.string = Number(this.zongYingfen.string) + redscore + prizePerRound;
        this.userGold.string = WLZBModel.getInstance().getGold().toFixed(2).toString();
        let freetime = WLZBModel.getInstance().getFreeTimes();
        if (freetime > 0){
            this.autoStartGame(btnType.wuLong,2);
        }else{
            Tip.makeText("免费次数已用完！");
            AudioMgr.stopBgMusic();
            this.numAction(Number(this.userGold.string),WLZBModel.getInstance().getGold(),this.userGold);
            // this.userGold.string = WLZBModel.getInstance().getGold().toFixed(2).toString();

            this.changeButtonStatus(true);
            this.WLZBLongButtonScript.changeBtnState(btnType.ready);
            this.isInWuLong = false;
        }
    }

    checkNormalPrize() {
        this.WLZBLongButtonScript.changeBtnState(btnType.defen);
        for (let i = 0; i < this.tipsArr.length; i++) {
            this.tipsArr[i].active = false;
        }

        this.topLabel.string = this.topWinText[Global.Utils.getRandomNum(0,this.topWinText.length-1)];
        this.topLabel.node.parent.active = true;

        if (this.isInWuLong) {
            this.bottomLabel.string = (WLZBModel.getInstance().getEndData().prizePerRound + WLZBModel.getInstance().getEndData().redscore).toFixed(2);
            this.numAction(Number(this.zongYingfen.string),Number(this.zongYingfen.string) + Number(this.bottomLabel.string),this.zongYingfen);
            // this.zongYingfen.string = Number(this.zongYingfen.string) + WLZBModel.getInstance().getEndData().prizePerRound;
            let multiple = WLZBModel.getInstance().getEndData().multiple;
            //开花动画
            if (multiple > 0){
                this.node.runAction(cc.sequence(
                    cc.callFunc(function () {
                            this.playFlowerAni1();
                        }.bind(this)),
                    cc.delayTime(1),
                    cc.callFunc(function () {
                        this.playFlowerAni2();
                    }.bind(this)),
                ))
            }
            if (WLZBModel.getInstance().getFreeTimes() > 0 ){
                this.autoStartGame(btnType.wuLong,1.8);
            }else{
                Tip.makeText("免费次数已用完！");
                this.numAction(Number(this.userGold.string),WLZBModel.getInstance().getGold(),this.userGold);

                this.changeButtonStatus(true);
                this.WLZBLongButtonScript.changeBtnState(btnType.ready);
                this.isInWuLong = false;
            }
        }
        else {
            this.bottomLabel.string = WLZBModel.getInstance().getEndData().prizePerRound.toFixed(2);
            this.numAction(0,WLZBModel.getInstance().getEndData().prizePerRound,this.zongYingfen);
            this.numAction(Number(this.userGold.string),WLZBModel.getInstance().getGold(),this.userGold);
            // this.zongYingfen.string = WLZBModel.getInstance().getEndData().prizePerRound;
            if (WLZBModel.getInstance().getEndData().isWuLong) {
                this.WLZBLongButtonScript.changeBtnState(btnType.ready);
                this.changeButtonStatus(false);
            }
            else if (this.isAuto) {
                this.autoStartGame(btnType.auto,1.5);
            } else {
                this.scheduleOnce(function () {
                    this.WLZBLongButtonScript.changeBtnState(btnType.ready);
                    this.changeButtonStatus(true);
                },1.5);

            }
        }
        // 依次显示中奖的项
        this.showLuckyItem();
        //中奖后再次更新金币
        // this.userGold.string = WLZBModel.getInstance().getGold().toString();
        // this.numAction(0,WLZBModel.getInstance().getEndData().prizePerRound,this.zongYingfen);
        // this.numAction(Number(this.userGold.string),WLZBModel.getInstance().getGold(),this.userGold);

    }
    showLuckyItem(){
        let checkData = WLZBModel.getInstance().getCheckData();
        for (let i = 0; i < checkData.length; i++) {
             let WLZBItemSprite = this.itemArr[checkData[i]].getComponent("WLZBItemSprite");
             if (checkData[i] % 5 === 0 && WLZBItemSprite.iconIndex != 11) {
                 AudioMgr.playSound("Game/WLZB/sound/5D_win" + WLZBItemSprite.iconIndex)
             }
             if (WLZBItemSprite.iconIndex === 12){
                 WLZBItemSprite.playAni1();
             }
             else {
                 WLZBItemSprite.playAction();
             }
        }
    }
    loadWuLongLayer(){

        let viewUrl = ViewMgr.getNodeUrl(this.node) + "/" + "WuLongLayer";
        let prefabUrl = "Game/WLZB/WuLongLayer";
        ViewMgr.open({
                viewUrl: viewUrl,
                prefabUrl: prefabUrl,
                isShowAction: true,
                isWait: true
            }
        );
    }
    gameStartNotify() {
        if (WLZBModel.getInstance().getGold() - WLZBModel.getInstance().getBaseScore() * this.ADD_COUNT < 0){
            this.changeButtonStatus(true);
            this.WLZBLongButtonScript.changeBtnState(btnType.ready);
            Tip.makeText("金币不足，请先充值");
            return;
        }
        if (this.isInWuLong){
            this.topLabel.string = "剩余免费次数：" + WLZBModel.getInstance().getFreeTimes();
        }
        else {
            this.topLabel.node.parent.active = false;
        }

        API.room.gameMessageNotify(gameProto.gameStartNotify(this.ADD_COUNT));
    }

    // 点击加注、减注按钮的处理函数
    onAddButtonHandler(dir) {
        let baseScore = WLZBModel.getInstance().getBaseScore();
        this.ADD_COUNT += dir;
        this.ADD_COUNT = this.ADD_COUNT <= 1 ? 1 : this.ADD_COUNT;
        this.ADD_COUNT = this.ADD_COUNT > this.MAX_ADD_TIMES ? this.MAX_ADD_TIMES : this.ADD_COUNT;
        this.costLab.string = (this.ADD_COUNT * baseScore).toFixed(0).toString();
    }
    // 改变按钮状态
    changeButtonStatus (enable) {

        for (let i = 0; i < this.buttons.length; i++) {
            let btn = this.buttons[i];
            Global.CCHelper.changeToGray(btn.getChildByName("icon"),enable?0:1);
            btn.getComponent(cc.Button).interactable = enable;
        }
    }

    callFunc1() {
        this.flowerLabel.node.active = true;
        this.flowerLabel.string = "x" + WLZBModel.getInstance().getEndData().multiple;
    }

    playFlowerAni1(){
        this.flowerIcon.active = false;
        this.flowerAni1.node.active = true;
        this.flowerAni1.armatureName = "Sprite";
        this.flowerAni1.off(dragonBones.EventObject.COMPLETE,this.callFunc1,this);
        this.flowerAni1.on(dragonBones.EventObject.COMPLETE,this.callFunc1,this);
        this.flowerAni1.playAnimation("Sprite",1);
    }
    callFunc2() {
        this.flowerAni2.node.active = false;
        this.flowerIcon.active = true;
    };
    playFlowerAni2(){
        this.flowerLabel.node.active = false;
        this.flowerAni1.node.active = false;
        this.flowerAni2.node.active = true;
        this.flowerAni1.armatureName = "Sprite";
        this.flowerAni2.off(dragonBones.EventObject.COMPLETE,this.callFunc2,this);
        this.flowerAni2.on(dragonBones.EventObject.COMPLETE,this.callFunc2,this);
        this.flowerAni2.playAnimation("Sprite",1);

    }

}
