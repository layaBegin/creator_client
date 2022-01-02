import SHZProto = require('./SHZProto');
import {SHZModel} from "./SHZModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MaryLayer extends cc.Component {

    @property(cc.Node)
    bgNode: cc.Node = undefined;
    @property(cc.Label)
    moneyLabel:cc.Label = undefined;
    @property(cc.Label)
    zhongjiangLabel:cc.Label = undefined;
    @property(cc.Label)
    zongzhongjiangLabel:cc.Label = undefined;
    @property(cc.Label)
    timesLab:cc.Label = undefined;
    @property(cc.Node)
    outItems :cc.Node[] = [];
    @property(cc.Node)
    inItems :cc.Node[] = [];
    @property(cc.Node)
    batchNodes:cc.Node[] = [];
    @property(cc.Node)
    lightFrame: cc.Node = undefined;
    @property(cc.Node)
    dragonNode: cc.Node = undefined;
    @property(dragonBones.ArmatureDisplay)
    dragonAni: dragonBones.ArmatureDisplay = undefined;
    @property(cc.Label)
    dragonTipsLabel: cc.Label = undefined;

    private curIndex: number = 0;
    private rollSpeed: number = 2000;

    private SHZMain = undefined;

    //小玛丽阵列
    MARY_TYPES = [
        4, 1, 0, 2, 6, -1,
        3, 1, 7, 0, 2, -1,
        5, 3, 1, 0, 6, -1,
        4, 2, 0, 3, 5, -1
    ];
    private sumWinPrize: any = 0;

    start() {
        Global.MessageCallback.addListener('GameMessagePush',this);
        API.room.gameMessageNotify(SHZProto.gameStartMaryNotify());
        this.bgNode.active = false;
        this.dragonNode.active = true;
        this.dragonAni.playAnimation("Sprite",1);
        this.loadTipLabel();
        this.loadInItems();
        this.timesLab.string  = "次数:" + SHZModel.getInstance().getFreeTimes().toString();
        this.moneyLabel.string = SHZModel.getInstance().getGold().toString();
        this.SHZMain = this.node.parent.getComponent("SHZMain");
        AudioMgr.startPlayBgMusic("Game/SHZ/sound/sound_water_mary_bg",null);
    }

    messageCallbackHandler(router,msg) {
        if (router === "GameMessagePush") {
            if (msg.type === SHZProto.ROB_START_MARY_PUSH) {
                this.setMary(msg.data);
            }
        }
    }
    // 加载内部物品
    loadInItems () {
        for (let i = 0, len = 4; i < len; i++) {
            let node = this.inItems[i].getComponent(cc.Sprite);
            Global.CCHelper.updateSpriteFrame('Game/SHZ/img/' + Global.Utils.getRandomNum(0, 8), node);
        }
    }
    setMary(data){
        for (let i = 0; i < data.enddata.itemData.length; i++){
            let node = this.inItems[i].getComponent(cc.Sprite);
            let itemSprite = this.inItems[i].getComponent("ItemSprite");
            itemSprite.iconIndex = data.enddata.itemData[i];
        }
    }

    // 开始小玛丽游戏
    startMary(){
        var enddata = SHZModel.getInstance().getMaryData();
        // // 光圈开始移动
        this.frameStartMoving(enddata);
        // // 中间开始滚动
        this.startRolling();
        // // 结束滚动
        this.endRolling();
    }
    // 中间开始滚动
    startRolling () {
        // 内部物品滚动
        this.inItemRoll(true);
        // batchNode滚动
        this.batchNodeRoll();
    }
    // 内部物品滚动
    inItemRoll (isBegan) {
        var self = this;
        for (let i = 0, len = this.inItems.length; i < len; i++) {
            let item = this.inItems[i];
            item.runAction(cc.sequence(
                cc.moveBy(148 / this.rollSpeed, cc.v2(0, -148)),
                cc.callFunc(function () {
                    if (isBegan) {
                        item.setPosition(item.x,74);
                        let node = item.getComponent(cc.Sprite);
                        Global.CCHelper.updateSpriteFrame('Game/SHZ/img/' + (SHZModel.getInstance().getMaryData().itemData[i]), node);
                    }
                }.bind(this))
            ));
        }
    }
    // batchNode滚动
    batchNodeRoll() {
        var offset = 148 * (30);
        for (let j = 0, lenJ = this.batchNodes.length; j < lenJ; j++) {
            let batchNode = this.batchNodes[j];
            batchNode.runAction( cc.sequence(
                cc.moveBy(offset / this.rollSpeed, cc.v2(0, -offset)),
                cc.callFunc(function () {
                    batchNode.setPosition(batchNode.x,74);
                    if (j === this.batchNodes.length -1){
                        this.inItemRoll(false);
                        AudioMgr.playSound("Game/SHZ/sound/sound_water_mary_roll_inner");
                    }
                }.bind(this))
            ));
        }
    }
    // 结束滚动
    endRolling () {
        this.node.runAction(cc.sequence(
            cc.delayTime(4.0),
            cc.callFunc(function () {

            }.bind(this))
        ));
    }

    // 光圈开始移动
    frameStartMoving (data) {
        var count = 0;
        var diffNum = (24 - (this.curIndex - data.targetIndex)) % 24;       //目标下标与当前下标的差值
        var totalNum = diffNum + 48;                                        //默认至少两圈 最大三圈
        var lastLeft = this.randNum(3, 5, true);
        var moveNum = totalNum - lastLeft;
        this.schedule(function () {
            count++;
            // 更新光圈的位置
            if (count <= moveNum) {
                this.updateFramePos(this.curIndex);
            }
            else {
                this.moveToTarget(lastLeft);
            }
        }.bind(this), 0.1, moveNum);
    }
    // 更新光圈的位置
    updateFramePos () {
        this.curIndex++;
        this.curIndex = this.curIndex % this.outItems.length;
        var p = this.outItems[this.curIndex].getPosition();
        this.lightFrame.setPosition(p);
        AudioMgr.playSound("Game/SHZ/sound/sound_water_mary_roll_out");
    }

    // 移动到目标
    moveToTarget (lastLeft) {
        var count = 0;
        this.schedule(function () {
            count++;
            // 更新光圈的位置
            this.updateFramePos(this.curIndex);
            if (count >= lastLeft) {
                // 兑奖
                this.checkPrize();
            }
        }.bind(this), 1.0, lastLeft - 1);
    }
    // 兑奖
    checkPrize () {
        this.timesLab.string = "次数:" + SHZModel.getInstance().getMaryData().freeTimes;

        if (SHZModel.getInstance().getMaryData().targetIndex === 5 || SHZModel.getInstance().getMaryData().targetIndex === 11 ||
            SHZModel.getInstance().getMaryData().targetIndex === 17 || SHZModel.getInstance().getMaryData().targetIndex === 23){
            this.scheduleOnce(function () {
                Tip.makeText("小玛丽次数 -1");

            },0.2)
        }

        if (SHZModel.getInstance().getMaryData().freeTimes <= 0) {
            // 退出提示
            this.logOutTip();
            AudioMgr.playSound("Game/SHZ/sound/sound_water_mary_icon_exit");
        } else {
            cc.log("====发送 304 ");
            API.room.gameMessageNotify(SHZProto.gameStartMaryNotify());
            // 中奖提示
            this.luckyTip();
        }
    }
    // 中奖提示
    luckyTip () {
        var isLucky = false;
        // 中间的中奖项播放动画
        for (let i = 0, len = this.inItems.length; i < len; i++) {
            let inItems = this.inItems[i].getComponent("ItemSprite");

            if (inItems.iconIndex == this.MARY_TYPES[SHZModel.getInstance().getMaryData().targetIndex]) {
                isLucky = true;
                let dragonAsset = this.SHZMain.dragonAssetArr2[inItems.iconIndex];
                let dragonAtlasAsset = this.SHZMain.DragonBonesAtlasAssetArr2[inItems.iconIndex];
                inItems.setDragonAsset2(dragonAsset,dragonAtlasAsset);
                inItems.playAni2();
            }
        }
        if (isLucky) {
            // 播放提示声音
            this.playTipSound();
            // 更新钱币信息
            this.updateMoneyInfo(isLucky);
        } else {
            Tip.makeText("本次没中奖,重新来过!");
        }

        var delay = isLucky ? 5 : 2;
        this.scheduleOnce(function () {
            this.zhongjiangLabel.string = "0";
            // 再次小玛丽
            this.onBtnClick(null,"start");
        }.bind(this), delay);
    }
    // 更新钱币信息
    updateMoneyInfo (isLucky) {
        if (!isLucky) return;
        this.sumWinPrize += SHZModel.getInstance().getMaryData().winPrize;

        Tip.makeText("当前获得" + SHZModel.getInstance().getMaryData().winPrize + "金币");
        this.timesLab.string = "次数:" + SHZModel.getInstance().getMaryData().freeTimes;
        this.zhongjiangLabel.string = SHZModel.getInstance().getMaryData().winPrize;
        this.zongzhongjiangLabel.string = this.sumWinPrize;
        this.moneyLabel.string = SHZModel.getInstance().getGold().toString();
        this.SHZMain.userGold.string = SHZModel.getInstance().getGold().toString();
    }
    // 退出提示
    logOutTip () {
        // this.firstIn = true;
        Tip.makeText("您的次数已用完,即将退出小玛丽");
        this.scheduleOnce(function () {
            this.node.runAction(cc.sequence(
                cc.moveBy(0.5, cc.v2(-cc.winSize.width, 0)),
                cc.callFunc(function () {
                    this.node.removeFromParent();
                    AudioMgr.startPlayBgMusic("Game/SHZ/sound/sound_water_all_other", null);
                    this.SHZMain.autoBtn.active = true;
                    this.SHZMain.quxiaoBtn.active = false;

                    // // 立即开始
                    this.SHZMain.autoStartGame();
                    // // 更新金币
                    this.SHZMain.userGold.string = SHZModel.getInstance().getGold().toFixed(2).toString();

                    this.SHZMain.changeButtonStatus(!this.SHZMain.isAuto);


                }.bind(this))
            ));
        }.bind(this), 3);
    }
    // 加载提示标签
    loadTipLabel () {
        var count = 3;
        this.schedule(function () {
            this.dragonTipsLabel.string = count + "秒后自动开始";

            if (count <= 0) {
                this.onBtnClick(null,"start");
            }
            count--;
        }.bind(this), 1, 3);
    }
    // 点击开始按钮的处理函数
    onBtnClick (event:cc.Event,param:string) {
        if (param === "start"){
            this.dragonNode.active = false;
            this.bgNode.active = true;
            this.unscheduleAllCallbacks();
            this.startMary();
        }
    }

    randNum (min, max, isInt){
        min = min || 0;
        max = max || 0;
        var offset = max - min;
        var num = min + Math.random() * offset;

        return isInt ? Math.floor(num) : num;
    }

    // 播放提示声音
    playTipSound () {
        var sounds = [
            "futou", "yingqiang", "dadao", "lu", "lin", "song",
            "titianxingdao", "zhongyitiang", "sound_water_shuihuzhuan"
        ];
        var type = this.MARY_TYPES[SHZModel.getInstance().getMaryData().targetIndex];
        var sound = "Game/SHZ/sound/sound_water_" + sounds[type];

        AudioMgr.playSound(sound);

    }

    onDestroy(){
        Global.MessageCallback.removeListener('GameMessagePush', this);


    }
}
