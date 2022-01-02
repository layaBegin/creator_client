cc.Class({
    extends: cc.Component,

    properties: {
        Label_num: cc.Label,
        Sp_jetton: cc.Sprite
    },

    getStakeImg: function (stakeLevel) {
        return 'Common/Jetton/JettonIcon/jettonIcon' + "_" + (16 - stakeLevel);
    },

    setStakeNum: function (data, stakeLevelArray_) {
        cc.log("data" + JSON.stringify(data), stakeLevelArray_);
        var stakeLevel = data.stakeLevel || 0;
        var multiple = data.multiple || 1;

        //根据stakeLevel确定chipBg和numLabel的字体    
        Global.CCHelper.updateSpriteFrame(this.getStakeImg(stakeLevel), this.Sp_jetton);
        let self = this;
        var stakeNum = Math.floor(stakeLevelArray_[stakeLevel] * multiple);
        let fontPath = "Common/Jetton/JettonFnt/jettonFnt" + "_" + (16 - stakeLevel);
        AssetMgr.loadResSync(fontPath, cc.Font, function (err, font) {
            if (!err) {
                if (!cc.isValid(self)) {
                    return;
                }
                self.Label_num.font = font;
                self.Label_num.string = stakeNum;
                self.Label_num.node.active = true;
            }
        });
    },

    // use this for initialization
    onLoad: function () {

    }
});