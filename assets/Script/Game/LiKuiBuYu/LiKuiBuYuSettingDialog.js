
cc.Class({
    extends: cc.Component,

    properties: {
        highEffectSelected: cc.Node,
        middleEffectSelected: cc.Node,
        lowEffectSelected: cc.Node,

        effectSlider: cc.Slider,
        effectBar: cc.Node,
        musicSlider: cc.Slider,
        musicBar: cc.Node,

    },

    start() {
        this.highEffectSelected.active = false;
        this.middleEffectSelected.active = false;
        this.lowEffectSelected.active = false;

    },


    onBtnClick: function (event, params) {
        if (params === "close") {
            Global.DialogManager.destroyDialog(this);
        } else if (params === "high") {
            this.highEffectSelected.active = true;
            this.middleEffectSelected.active = false;
            this.lowEffectSelected.active = false;
        } else if (params === "middle") {
            this.highEffectSelected.active = false;
            this.middleEffectSelected.active = true;
            this.lowEffectSelected.active = false;
        } else if (params === "low") {
            this.highEffectSelected.active = false;
            this.middleEffectSelected.active = false;
            this.lowEffectSelected.active = true;
        }
    },

    onSliderMove: function (event, params) {
        if (params === "effect") {
            let effectBarSpr = this.effectBar.getComponent(cc.Sprite);
            effectBarSpr.fillRange = this.effectSlider.progress;
        } else if (params === "music") {
            let musicBarSpr = this.musicBar.getComponent(cc.Sprite);
            musicBarSpr.fillRange = this.musicSlider.progress;
        }
    }

});
