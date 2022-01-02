
cc.Class({
    extends: cc.Component,

    properties: {
        cardSprite:cc.Sprite,
    },
    onLoad () {
        this.cardData = null;
        this.cardUp = null;
        this.zIndex = i + 1;
    },

    start () {

    },
    /**
     * 设置牌值
     * @param cardData
     * @returns {boolean}
     */
    setValue: function (cardData,cb) {
        this.cardData = cardData;
        var self = this;
        Global.CCHelper.updateSpriteFrame("Game/DDZ/Card/" + cardData, self.cardSprite, function () {
            cb && cb(self);
        }.bind(this));
    },

});
