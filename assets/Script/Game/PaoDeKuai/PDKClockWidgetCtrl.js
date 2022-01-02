cc.Class({
    extends: cc.Component,

    properties: {
        clockTime: cc.Label
    },

    onLoad: function () {
        this.clockAni = this.node.getChildByName("clockAni");
        this.dragon = this.clockAni.getComponent(dragonBones.ArmatureDisplay);
        this.clockAni.active = false;
        this.clockSprite = this.node.getComponent(cc.Sprite);
    },

    startClock: function (time, callback) {
        this.unscheduleAllCallbacks();
        this.curTime = time;
        this.callback = callback;
        this.clockTime.string = this.curTime.toString();
        this.schedule(this.updateClock.bind(this), 1);
    },

    stopClock: function () {
        this.unscheduleAllCallbacks();
    },

    updateClock: function () {
        this.curTime--;
        if (this.curTime <= 5){
            this.clockSprite.enabled = false;
            this.clockAni.active = true;
            // this.dragon.playAnimation("newAnimation");
        }
        if (this.curTime <= 0) {
            this.unscheduleAllCallbacks();
            Global.Utils.invokeCallback(this.callback);
        } else {
            this.clockTime.string = this.curTime.toString();
            if (this.curTime === 5) {
                AudioMgr.playSound("Game/PaoDeKuai/Sound/sound_remind");
            }
        }
    },

    setClockEnd: function () {
        this.curTime = 0;
    }
});
