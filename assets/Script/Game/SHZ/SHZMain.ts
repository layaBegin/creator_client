import BaseView from "../../BaseClass/BaseView";
import { SHZModel } from "./SHZModel";
import RoomProto = require('../../API/RoomProto');
import gameProto = require('./SHZProto');

const { ccclass, property } = cc._decorator;

@ccclass
export default class SHZMain extends BaseView {

    @property(cc.Node)
    NodeList: cc.Node = undefined;
    @property(cc.Node)
    mixArr: cc.Node[] = [];
    @property(cc.Node)
    itemArr: cc.Node[] = [];
    @property(cc.Node)
    startBtn: cc.Node = undefined;
    @property(cc.Node)
    stopBtn: cc.Node = undefined;
    @property(cc.Node)
    autoBtn: cc.Node = undefined;
    @property(cc.Node)
    quxiaoBtn: cc.Node = undefined;
    @property(cc.Node)
    buttons: cc.Node[] = [];
    @property(cc.Label)
    userName: cc.Label = undefined;
    @property(cc.Label)
    userGold: cc.Label = undefined;
    @property(cc.Label)
    costLab: cc.Label = undefined;
    @property(cc.Label)
    costSumLab: cc.Label = undefined;
    @property(cc.Node)
    lines: cc.Node = undefined;
    @property(cc.Node)
    accountLayer:cc.Node = undefined;
    @property(dragonBones.DragonBonesAsset)
    dragonAssetArr1: dragonBones.DragonBonesAsset[] = [];
    @property(dragonBones.DragonBonesAsset)
    dragonAssetArr2: dragonBones.DragonBonesAsset[] = [];
    @property(dragonBones.DragonBonesAtlasAsset)
    DragonBonesAtlasAssetArr1: dragonBones.DragonBonesAtlasAsset[] = [];
    @property(dragonBones.DragonBonesAtlasAsset)
    DragonBonesAtlasAssetArr2: dragonBones.DragonBonesAtlasAsset[] = [];
    ITEM_TYPES = [0,   1,     2,   3,    4,    5,      6,       7,       8];
    ITEM_NAME = ["斧", "枪", "刀", "鲁", "林", "宋", "替天行道", "忠义堂", "水浒传"];
    ADD_COUNT = 1;//当前下注倍数
    MAX_ADD_TIMES = 5;//最大下注倍数
    rollSpeed = 4000;
    showCount = 0;
    private isAuto: boolean = false;
    private gameDropDownList: any;

    start() {
        this.gameDropDownList = this.node.getChildByName("GameDropDownList").getComponent("GameDropDownList");
        this.gameDropDownList.setGameInfo(SHZModel.getInstance().getKindId(), SHZModel.getInstance().getProfitPercentage());
        AudioMgr.startPlayBgMusic("Game/SHZ/sound/sound_water_all_other", null);
        for (let i = 0; i < this.mixArr.length; i++) {
            this.itemArr[i].parent.active = false;
        }
        this.onAddButtonHandler(0);
        this.userInit();
        this.initResultNode();
        this.initMixNode();
        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        API.room.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
    }
    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        SHZModel.getInstance().onDestroy();
    }

    messageCallbackHandler(router,msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.userInfo.uid === SHZModel.getInstance().getSelfUid()) {
                    ViewMgr.goBackHall(Config.GameType.SHZ);
                }
            }
            else if(msg.type === RoomProto.ROOM_USER_INFO_CHANGE_PUSH){
                this.updateCoin(msg.data);
            }
            else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo]);
                this.gameInit(msg.data.gameData); // 初始化界面场景
            }
            else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
                Confirm.show("当前房间已解散！", () => {
                    ViewMgr.goBackHall(Config.GameType.SHZ)
                })
            }
        } else if (router === "GameMessagePush") {
            if (msg.type === gameProto.ROB_RESULTS_PUSH) {
                this.startGame(msg.data.enddata);
            }
            else if (msg.type === gameProto.ROB_USER_SCORE_PUSH) {
                Tip.makeText("金币不足，请先充值")
            }
        } else if (router === "ReConnectSuccess") {
            cc.log("断线重连");
            if (Global.Player.isInRoom()) {
                cc.log("房间id:" + SHZModel.getInstance().getRoomId());
                Global.API.hall.joinRoomRequest(SHZModel.getInstance().getRoomId(), () => {
                }, undefined, Config.GameType.SHZ);
            } else {
                cc.log("没有在房间中");
                ViewMgr.goBackHall(Config.GameType.SHZ);
            }
        }
    }
    onBtnClk(event,param) {
        switch (param) {
            case 'start':
                if (SHZModel.getInstance().getGold() - SHZModel.getInstance().getBaseScore() * this.ADD_COUNT * 9 < 0){
                    Tip.makeText("金币不足，请先充值");
                    return;
                }
                this.isAuto = false;
                this.gameStartNotify();
                break;
            case 'stop':
                this.isAuto = false;
                this.stopRolling();
                break;
            case "auto":
                if (SHZModel.getInstance().getGold() - SHZModel.getInstance().getBaseScore()* this.ADD_COUNT * 9 < 0){
                    this.isAuto = false;
                    this.changeButtonStatus(true);
                    this.setStopButtonVisible(false);
                    this.autoBtn.active = true;
                    this.quxiaoBtn.active = false;
                    Tip.makeText("金币不足，请先充值");
                    return;
                }

                this.isAuto = true;
                this.gameStartNotify();
                break;
            case "quxiao":
                this.isAuto = false;
                this.autoBtn.active = true;
                this.quxiaoBtn.active = false;
                break;
            case 'add':
                this.onAddButtonHandler(1);
                break;
            case 'sub':
                this.onAddButtonHandler(-1);
                break;
        }
    }

    userInit() {
        this.userName.string = Global.Player.getPy('nickname');
        this.userGold.string = Global.Player.getPy('gold');
    }

    gameInit(data) {

    }

    gameStartNotify() {
        API.room.gameMessageNotify(gameProto.gameStartNotify(this.ADD_COUNT));
        this.startBtn.getComponent(cc.Button).interactable = false;
    }

    stopRolling() {
        this.setBtnState(this.stopBtn,false);
        this.startBtn.getComponent(cc.Button).interactable = false;

        let alldelay = 0;
        for (let i = 0; i < this.mixArr.length; i++) {
            let itemCol = this.itemArr[i].parent;
            let mixItem = this.mixArr[i];
            let nh = this.mixArr[i].height;
            itemCol.stopAllActions();
            mixItem.stopAllActions();
            itemCol.position = cc.v2(itemCol.x,480);
            mixItem.position = cc.v2(this.mixArr[i].x, - nh + 480);
            //停止所有动作

            let delay = 0.03 * i;
            alldelay += delay;
            mixItem.runAction(
                cc.moveTo(480/this.rollSpeed,cc.v2(itemCol.x, -nh))
            );
            itemCol.runAction(cc.sequence(
                cc.delayTime(delay),
                cc.callFunc(function(){
                    this.itemNodeStop(itemCol,0,0,i === this.mixArr.length - 1,this.itemRollingEnd.bind(this));
                }.bind(this))
            ));
        }
    }
    initResultNode() {
        for (let i = 0; i < this.itemArr.length; i++) {
            let itemCol = this.itemArr[i];
            let node = itemCol.getComponent(cc.Sprite);
            let callFunc = function(){
                if (i === this.itemArr.length -1 ){
                    this.itemArr[0].parent.active = true;
                    this.itemArr[1].parent.active = true;
                    this.itemArr[2].parent.active = true;
                    this.itemArr[3].parent.active = true;
                    this.itemArr[4].parent.active = true;
                }
            };
            Global.CCHelper.updateSpriteFrame('Game/SHZ/img/' + Global.Utils.getRandomNum(0, 8), node,callFunc.bind(this))
        }
    }

    //初始化模糊节点
    initMixNode() {
        for (let i = 0; i < this.mixArr.length; i++) {
            let mixNode = this.mixArr[i].children;
            for (let j = 0; j < mixNode.length; j++) {
                let node = mixNode[j].getComponent(cc.Sprite);
                Global.CCHelper.updateSpriteFrame('Game/SHZ/img/' + Global.Utils.getRandomNum(0, 8) + '_mix', node)
            }
        }
    }
    /*
    * 逻辑处理
    * */
    // 开始游戏
    startGame(data){

        if (this.isAuto){
            this.stopBtn.active = false;
            this.quxiaoBtn.active = true;
            this.autoBtn.active = false;
        }
        else{
            this.scheduleOnce(function () {
                this.stopBtn.active = true;
                this.stopBtn.getComponent(cc.Button).interactable = true;
                this.changeToGray(this.stopBtn.getChildByName("icon"),0);
            },0.6);
            this.quxiaoBtn.active = false;
            this.autoBtn.active = true;
        }

        // this.roleFlagArmature.getAnimation().play("Animation2");
        // 扣除金币
        // this.updateCoin(data.score - data.prizePerRound, 0.5);
        // 物品显示为亮色
        this.showGrayItems(false);
        // 隐藏拉线和光圈
        this.setLineAndCircleVisible(null, false);

        this.changeButtonStatus(false);
        // 开始滚动
        this.startRolling();
        // 改变按钮状态
        // 显示停止按钮
        // setTimeout(function(){
        //     this.uiLayer.setStopButtonVisible(true);
        // }.bind(this),100);
        AudioMgr.playSound("Game/SHZ/sound/sound_water_bt_start");
    }
    updateCoin(data){

        if (SHZModel.getInstance().getEndData().prizePerRound > 0) {
            this.userGold.string = (Number(this.userGold.string) - this.ADD_COUNT * SHZModel.getInstance().getBaseScore()*9).toFixed(2).toString();
        }
        else {
            this.userGold.string = (data.changeInfo.gold).toFixed(2).toString();
        }
    }

    //开始滚动
    startRolling() {
        let alldelay = 0;

        for (let i = 0; i < this.mixArr.length; i++) {
            let item = this.itemArr[i].parent;
            let mixCol = this.mixArr[i];
            mixCol.position = cc.v2(mixCol.x,480);
            let delay = 0.1 * i;
            alldelay += delay;
            //获取结果节点加上模糊节点的总高度 = 需要移动的总高度 
            this.mixArr[i].active = true;
            // this.NodeList.children[0].getComponent(cc.Layout).updateLayout();
            let nh = this.mixArr[i].height;
            this.itemNodeRoll(item,delay,i === this.mixArr.length-1 ,this.makeResultNode.bind(this));
            mixCol.runAction(cc.sequence(
                cc.delayTime(delay),
                //移动到底部
                cc.moveTo((nh) / this.rollSpeed, cc.v2(mixCol.x, - nh + 480)),
                cc.spawn(
                    cc.moveTo(480/this.rollSpeed,cc.v2(mixCol.x, - nh)),
                    cc.callFunc(function(){
                        //itemCol.position = cc.v2(itemCol.x,480);
                        this.itemNodeStop(item,0,0,i === this.mixArr.length - 1,this.itemRollingEnd.bind(this));
                    }.bind(this))
                )
            ));
        }
    }
    //立刻停止滚动
    stop() {

    }
    // batchNode滚动
    itemNodeRoll(itemNode,delay,isLast,callFunc){
        itemNode.runAction(cc.sequence(
            cc.delayTime(delay),
            cc.moveBy(480 / this.rollSpeed, cc.v2(0, -480)),
            cc.callFunc(function(){
                itemNode.setPosition(itemNode.x,480);
                if (isLast)
                    callFunc();
            })
        ));
    }
    // batchNode滚动
    itemNodeStop(itemNode,delay, posY,isLast,callFunc){
        var actMoveBy = cc.moveTo((480 + 175) / this.rollSpeed, cc.v2(0, posY - 175));
        var actMoveUp = cc.moveTo(0.3, cc.v2(0, posY));
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

        this.stopBtn.active = false;
        //这里处理中奖
        this.scheduleOnce(function () {
            this.checkPrize();
        }.bind(this),0.5);
    }
    // 不管有没中奖 兑奖
    checkPrize() {
        if (SHZModel.getInstance().getEndData().prizePreRound <= 0) {
            this.changeButtonStatus(!this.isAuto);
            this.autoStartGame();
            return;
        }
        if (SHZModel.getInstance().getEndData().isFull || SHZModel.getInstance().getEndData().isMix) {
            this.checkFullPrize();
        } else {
            this.checkNormalPrize();
        }
    }
    //游戏结果
    // 10 11 12 13 14
    // 5  6  7  8  9
    // 0  1  2  3  4
    makeResultNode() {
        var checkDataArr = SHZModel.getInstance().getCheckData();
        var endData = SHZModel.getInstance().getEndData();
        var itemData = SHZModel.getInstance().getEndData().itemData;
        if (SHZModel.getInstance().getEndData()) {
            for (let i = 0; i < itemData.length; i++) {
                let itemCol = this.itemArr[i];
                let node = itemCol.getComponent(cc.Sprite);
                let itemSprite = itemCol.getComponent("ItemSprite");
                itemSprite.ani1.node.active = false;
                itemSprite.ani2.node.active = false;
                Global.CCHelper.updateSpriteFrame('Game/SHZ/img/' + (SHZModel.getInstance().getEndData().itemData[i]), node);
                itemSprite.iconIndex = SHZModel.getInstance().getEndData().itemData[i];
                if (checkDataArr[0]){
                    if(checkDataArr[0].isFull || checkDataArr[0].isMix){
                        let iconIndex = itemSprite.iconIndex;
                        itemSprite.setDragonAsset1(this.dragonAssetArr1[iconIndex],this.DragonBonesAtlasAssetArr1[iconIndex]);
                        itemSprite.setDragonAsset2(this.dragonAssetArr2[iconIndex],this.DragonBonesAtlasAssetArr2[iconIndex]);
                    }
                }
            }
        }
        if (!Array.isArray(checkDataArr) || checkDataArr.length <= 0) return;
        if(endData.isFull || endData.isMix) {
            for (let i = 0; i < this.itemArr.length;i++){
                let itemSprite = this.itemArr[i].getComponent("ItemSprite");
                let iconIndex = itemSprite.iconIndex;
                itemSprite.setDragonAsset1(this.dragonAssetArr1[iconIndex],this.DragonBonesAtlasAssetArr1[iconIndex]);
                itemSprite.setDragonAsset2(this.dragonAssetArr2[iconIndex],this.DragonBonesAtlasAssetArr2[iconIndex]);
            }
        }
        else{
            let luckyPositions = [];
            for (let i = 0;i < checkDataArr.length;i++){
                luckyPositions = luckyPositions.concat(checkDataArr[i].luckyPositions);
                cc.log("======luckyPositions[%s]:%s",i,luckyPositions[i]);
            }
            for (let i = 0; i < luckyPositions.length;i++){
                if (!this.itemArr[luckyPositions[i]]) continue;
                let itemSprite = this.itemArr[luckyPositions[i]].getComponent("ItemSprite");
                let iconIndex = itemSprite.iconIndex;
                itemSprite.setDragonAsset1(this.dragonAssetArr1[iconIndex],this.DragonBonesAtlasAssetArr1[iconIndex]);
                itemSprite.setDragonAsset2(this.dragonAssetArr2[iconIndex],this.DragonBonesAtlasAssetArr2[iconIndex]);
            }
        }
    }
    checkNormalPrize() {
        // 依次执行动作
        this.node.runAction(cc.sequence(
            // 显示所有中奖的线和光圈
            cc.callFunc(this.showLuckyLineAndCircle.bind(this)),
            cc.delayTime(0.25),
            cc.callFunc(function(){
                // 隐藏所有中奖的线
                this.setLineAndCircleVisible(null, false);
            }.bind(this)),
            cc.delayTime(0.2),
            cc.callFunc(function(){
                // 没有中奖则直接恢复点击
                if (SHZModel.getInstance().getEndData().prizePerRound <= 0) {
                    this.autoStartGame();
                } else {
                    this.showCount = 0;
                    // 依次显示中奖的项
                    this.showLuckyItemOneByOne();
                }
            }.bind(this))
        ));
    }
    // 兑换全屏奖
    checkFullPrize() {
        // 依次执行动作
        this.node.runAction(cc.sequence(
            cc.callFunc(function(){
                for (let i = 0;i < this.itemArr.length;i++){
                    this.itemArr[i].getComponent("ItemSprite").playAni2();
                }
                // 播放第一个中奖物品的音效
                this.playItemSound(this.itemArr[0].getComponent("ItemSprite").iconIndex);
            }.bind(this)),
            cc.delayTime(1.8),
            // //更新金币
            // cc.callFunc(function () {
            //     this.userGold.string = SHZModel.getInstance().getGold();
            // }.bind(this)),
            cc.callFunc(this.loadAccountLayer.bind(this)),

        ));
    }

    // 显示所有中奖的线和光圈
    showLuckyLineAndCircle(blink:boolean = true) {
        var checkData = SHZModel.getInstance().getCheckData();

        for (let i = 0; i < checkData.length; i++) {
            let line = this.lines.getChildByName((checkData[i].lineNum + 1) + '');
            line.active = true;

        }
    }

    // 显示、隐藏拉线和光圈
    setLineAndCircleVisible(index, visible) {
        if (index != null) {
            this.lines.children[index].active = visible;
        } else {
            // 隐藏所有线和光圈
            for (let i = 0; i < this.lines.children.length; i++) {
                this.lines.children[i].active = visible
            }
        }
    }

    // 依次显示中奖的项
    showLuckyItemOneByOne() {
        var checkDataArr = SHZModel.getInstance().getEndData().checkData;
        if (!Array.isArray(checkDataArr) ||checkDataArr.length <= 0 ) return;

        let luckyPositions = [];
        for (let i = 0;i < checkDataArr.length;i++){
            luckyPositions = luckyPositions.concat(checkDataArr[i].luckyPositions);
        }

        //播放音效
        AudioMgr.playSound("Game/SHZ/sound/sound_water_line");
        let ani1Count = 0;
        let m = 0;
        this.schedule(function () {
            cc.log("=====checkDataArr.length:",checkDataArr.length);
            let luckyPositions = checkDataArr[m].luckyPositions;
            let lineNum = checkDataArr[m].lineNum;
            this.setLineAndCircleVisible(null,false);
            this.setLineAndCircleVisible(lineNum,true);
            for (let i = 0, numI = this.itemArr.length; i < numI; i++) {
                let colItems = this.itemArr[i];
                if (luckyPositions.indexOf(i) !== -1 ){
                    this.changeToGray(this.itemArr[i],1)
                }else{
                    this.changeToGray(this.itemArr[i],0);
                }
                // 查找中奖位置的物品
                for (let k = 0; k < luckyPositions.length; k++){
                    let luckIndex = luckyPositions[k];
                    if ( i === luckIndex) {
                        // 中奖物品显示为亮色,并播放动画效果
                        this.changeToGray(colItems, 0);
                        // 存储中奖物品
                        let itemSprite = colItems.getComponent("ItemSprite");
                        itemSprite.playAni1();
                        ani1Count ++;
                        break;
                    }
                }
            }
            m ++;
        },0.5,checkDataArr.length-1);
        //第二次播放动画
        this.scheduleOnce(function () {
            this.luckyItemShowDone(luckyPositions);
        },1.5 + checkDataArr.length * 0.5)
    }

    // 中奖项显示完毕
    luckyItemShowDone(luckyPositions){
        // 播放第一个中奖物品的音效
        this.playItemSound(this.itemArr[luckyPositions[0]].getComponent("ItemSprite").iconIndex);

        this.setLineAndCircleVisible(null, false);
        // 中奖物品播放动画效果
        for (let i = 0;i < luckyPositions.length;i++){
            this.itemArr[luckyPositions[i]].getComponent("ItemSprite").playAni2();
        }
        this.node.runAction(cc.sequence(
            cc.delayTime(1.0),
            // //更新金币
            // cc.callFunc(function () {
            //     this.userGold.string = SHZModel.getInstance().getGold();
            // }.bind(this)),
            // 加载结算层
            cc.callFunc(this.loadAccountLayer.bind(this)),
            cc.delayTime(1.0),
            cc.callFunc(function(){
                if (SHZModel.getInstance().getEndData().freeTimes > 0) {
                    var txt = "恭喜!获得" + SHZModel.getInstance().getEndData().freeTimes + "次小玛丽机会!";
                    Tip.makeText(txt);
                }
                this.showLuckyLineAndCircle(false);
            }.bind(this)),
            cc.delayTime(1.5),
            cc.callFunc(this.loadMaryLayer.bind(this))
        ));
    }

    // 加载结算层
    loadAccountLayer(){
        if (this.accountLayer.children.length > 0)
            this.accountLayer.removeAllChildren();

        let self = this;
        AssetMgr.loadResSync("Game/SHZ/AccountLayer", cc.Prefab, function (err, prefab) {
            if (err) {
                cc.log("=======加载CardPrefab 报错");
            } else {
                if (!cc.isValid(self)) {
                    return;
                }
                let newPrefab = cc.instantiate(prefab);
                newPrefab.setScale(0);
                newPrefab.parent = this.accountLayer;
                newPrefab.getComponent("AccountLayer").accountLayerCallback = this.accountLayerCallback.bind(this);
                newPrefab.runAction(
                    cc.scaleTo(0.3,1).easing(cc.easeSineOut())
                );
            }
        }.bind(this));
    }
    // 加载玛丽层
    loadMaryLayer(){
        if (SHZModel.getInstance().getFreeTimes() > 0) {
            this.accountLayer.destroyAllChildren();
            let viewUrl = ViewMgr.getNodeUrl(this.node) + "/" + "MaryLayer";
            let prefabUrl = "Game/SHZ/MaryLayer";
            ViewMgr.open({
                    viewUrl: viewUrl,
                    prefabUrl: prefabUrl,
                    isShowAction:true,
                    isWait:true
                }
            );
        }
    }
    // 加载摇骰子层
    loadDiceLayer(){
        if (SHZModel.getInstance().getFreeTimes() > 0) return;
        let viewUrl = ViewMgr.getNodeUrl(this.node) + "/" + "DiceLayer";
        let prefabUrl = "Game/SHZ/DiceLayer";
        ViewMgr.open({
                viewUrl: viewUrl,
                prefabUrl: prefabUrl,
                isShowAction: true,
                isWait: true
            }
        );
        this.isAuto = false;
    }
    // 自动开始游戏
    autoStartGame(){

        if (this.isAuto) {
            this.autoBtn.active = false;
            this.quxiaoBtn.active = true;
            this.changeToGray(this.startBtn.getChildByName("icon"),1);
            this.startBtn.getComponent(cc.Button).interactable = false;
            var delay = 0.5;

            this.scheduleOnce(function () {
                this.onBtnClk(null,"auto");
                // 移除定时器和结算层
                this.removeTimerAndAccountLayer();
            }.bind(this), delay);
        }
        else {
            this.changeButtonStatus(true);
            // 隐藏停止按钮
            this.setStopButtonVisible(false);
        }
    }

    // 改变按钮状态
    changeButtonStatus (enable) {
        for (let i = 0, num = this.buttons.length -1; i < num; i++) {
            let btn = this.buttons[i];
            this.changeToGray(btn.getChildByName("icon"),enable?0:1);
            btn.getComponent(cc.Button).interactable = enable;
        }
    }
    // 结算层的回调函数
    accountLayerCallback(btnType){
        switch (btnType) {
            case "close":
                for (let i = 0;i < this.itemArr.length; i++){
                    this.itemArr[i].getComponent("ItemSprite").ani2.node.active = false;
                }

                if (SHZModel.getInstance().getEndData().freeTimes > 0 ) {
                    return;
                }
                // // 立即开始
                this.autoStartGame();
                // // 更新金币
                this.userGold.string = SHZModel.getInstance().getGold().toFixed(2).toString();
                this.changeButtonStatus(!this.isAuto);

                break;
            case "bibei":
                if (SHZModel.getInstance().getEndData().freeTimes > 0 ) {
                    return;
                }
                this.loadDiceLayer();
                break;
        }
    }
    // 移除定时器和结算层
    removeTimerAndAccountLayer(touchBeBei = false){
        this.accountLayer && this.accountLayer.removeAllChildren();

    }
    // 点击加注、减注按钮的处理函数
    onAddButtonHandler(dir) {
        let baseScore = SHZModel.getInstance().getBaseScore();
        this.ADD_COUNT += dir;
        this.ADD_COUNT = this.ADD_COUNT <= 0 ? 1 : this.ADD_COUNT;
        this.ADD_COUNT = this.ADD_COUNT > this.MAX_ADD_TIMES ? this.MAX_ADD_TIMES : this.ADD_COUNT;
        // SHZModel.getInstance().setBaseScore(this.ADD_COUNT);
        var costSum = this.ADD_COUNT * baseScore * 9;
        this.costLab.string = Global.Utils.formatNum2(this.ADD_COUNT * baseScore).toString();
        this.costSumLab.string = Global.Utils.formatNum2(costSum).toString();
    }

    /**
     * @param state 0:normal,1:gray
     */
    changeToGray(node, state) {
        if (!node) return;
        node = node.getComponent(cc.Sprite);
        node.setState(state)
    }

    // 播放第一个中奖物品的音效
    playItemSound(type){
        var sounds = [
            "futou", "yingqiang", "dadao", "lu", "lin", "song",
            "titianxingdao", "zhongyitiang", "shuihuzhuan"
        ];
        var sound = "Game/SHZ/sound/sound_water_" + sounds[type];

        AudioMgr.playSound(sound);
    }

    /**
     * 物品显示为灰色
     * @param isGray 0:normal, 1: gray
     */
    showGrayItems(isGray){
        for (var i = 0, col = this.itemArr.length; i < col; i++) {
            this.changeToGray(this.itemArr[i],isGray);
        }
    }

    setBtnState(node,state){
        node.getComponent(cc.Button).interactable = state;
        this.changeToGray(node.getChildByName("icon"),state ? 0 : 1);
    }

    // 设置停止按钮可见性
    setStopButtonVisible (visible) {
        if (!this.isAuto) {
            this.stopBtn.active  = visible;
            this.startBtn.active = !visible;
        }
    }
}
