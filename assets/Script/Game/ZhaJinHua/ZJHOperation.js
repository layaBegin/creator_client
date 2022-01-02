let gameProto = require('./GameProtoZJH');

cc.Class({
    extends: cc.Component,

    properties: {
        timeBg: cc.Node,
        timeText: cc.Label,

        stakeBtn: cc.Node,
        autoStakeBtn: cc.Toggle,
        lookCardBtn: cc.Node,
        compareBtn: cc.Node,
        addStakeBtn: cc.Node,
        btnGroup: cc.Node
    },

    setEventCallback: function (cb) {
        this.callback = cb;
    },

    showAutoEff: function (autoStake) {
        this.autoStakeBtn.node.active = autoStake;
    },

    setLookCardBtnState:function(isInteractable){
        this.lookCardBtn.getComponent(cc.Button).interactable = isInteractable;
    },

    showSpecialOperationUI: function () {
        this.node.active = true;
        this.btnGroup.active = true;
        this.autoStake = this.autoStakeBtn.isChecked
        if (this.autoStake) {
            this.scheduleOnce(function () {
                Global.Utils.invokeCallback(this.callback(null, 'stake'));
            }.bind(this), 1);
            return;
        }
        //
        // let anim = this.getComponent(cc.Animation);
        // let animState = anim.play('showSpecialUI');
        // animState.wrapMode = cc.WrapMode.Normal;
        //
        // this.startCountDown();
        this.addStakeBtn.active = true;
        this.stakeBtn.active = true;
        this.lookCardBtn.active = true;
        this.compareBtn.active = true;
        this.autoStakeBtn.node.active = false;

        this.operationType = 1;
    },

    showNormalOperationUI: function () {
        this.node.active = true;
        this.btnGroup.active = true;
        this.addStakeBtn.active = false;
        this.stakeBtn.active = false;
        this.lookCardBtn.active = true;
        this.compareBtn.active = false;
        this.autoStakeBtn.node.active = true;

        // this.stopCountDown();

        // if (this.autoStake) {
        //     this.autoStakeBtn.active = false;
        //     return;
        // }
        //
        // let anim = this.getComponent(cc.Animation);
        // let animState = anim.play('showSpecialUI');
        // animState.wrapMode = cc.WrapMode.Reverse;

        this.operationType = 2;
    },

    updateStakeLevel: function (stakeLevel, multiple) {
        this.currentStakeLevel = stakeLevel || this.currentStakeLevel;
        this.currentMultiple = multiple || this.currentMultiple;

        /*this.autoStakeNum.string = proto.STAKE_LEVEL[this.currentStakeLevel] * this.currentMultiple;
        this.stakeNum.string = proto.STAKE_LEVEL[this.currentStakeLevel] * this.currentMultiple;
        this.compareStakeNum.string = proto.STAKE_LEVEL[this.currentStakeLevel] * this.currentMultiple;*/

        // this.compareBtn.interactable = data.canCompare;
        // this.compareBtn.interactable = true;
    },

    startCountDown: function () {
        cc.log('开始下注倒计时');
        this.stopCountDown();

        this.timeBg.active = true;
        let time = gameProto.OPERATION_TIME;
        this.timeText.string = time;
        this.schedule(function () {
            time -= 1;
            if (time >= 0) {
                this.timeText.string = time;
            } else {
                if (this.timeBg.active) {
                    Global.Utils.invokeCallback(this.callback(null, 'giveUp'));
                }
                this.stopCountDown();
            }
        }.bind(this), 1);
    },

    stopCountDown: function () {
        cc.log('停止下注倒计时');

        this.timeBg.active = false;
        this.unscheduleAllCallbacks();
    },

    // use this for initialization
    onLoad: function () {
        this.reSet();

        this.operationType = 0; //1:speical ,2:normal
    },

    onDestroy: function () {
        this.stopCountDown();
    },

    reSet: function () {
        //this.autoLabel.string = '自动加注';

        this.currentStakeLevel = 0;
        this.currentMultiple = 1;
        this.operationType = 0;
        this.autoStakeBtn.isChecked = false;
        this.autoStakeBtn.node.active = false;
        this.timeBg.active = false;
        this.stopCountDown();
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});