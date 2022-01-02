cc.Class({
    extends: cc.Component,

    properties: {

        contentBg: cc.Sprite,
        cardBg: cc.Sprite,

        // value: cc.Sprite,
        // color: cc.Sprite,
        // other: cc.Sprite
    },

    getCardColorValue: function (cardData) {
        return (cardData & 0xF0) / 16;
    },

    getCardLogicValue: function (cardData) {
        return cardData & 0x0F;
    },

    getColorImg: function (data) {
        return 'Game/ZhaJinHua/CardImg/c' + this.getCardColorValue(data);
    },

    getColor: function (data) {
        let colorValue = this.getCardColorValue(data);
        if (colorValue === 2 || colorValue === 0) {
            return new cc.Color(173, 27, 27, 255);
        } else {
            return new cc.Color(32, 27, 27, 255);
        }
    },

    getOtherImg: function (data) {
        let logicValue = this.getCardLogicValue(data);
        let colorValue = this.getCardColorValue(data);
        if (logicValue > 10) {
            return 'Game/ZhaJinHua/CardImg/v' + logicValue + 'c' + colorValue;
        } else {
            return 'Game/ZhaJinHua/CardImg/c' + colorValue;
        }
    },

    getValueImg: function (data) {
        return 'Game/ZhaJinHua/CardImg/v' + this.getCardLogicValue(data);
    },

    showKaBei: function () {
        this.contentBg.node.active = false;
        this.cardBg.node.active = true;
    },

    showLoseState: function () {
        this.contentBg.node.active = false;
        this.cardBg.node.active = true;

        Global.CCHelper.updateSpriteFrame("Game/ZhaJinHua/NewImg/cardBack_qipai", this.cardBg.getComponent(cc.Sprite));
    },
    //设置牌正面
    setData: function (data) {
        this.contentBg.node.active = true;
        Global.CCHelper.updateSpriteFrame(Global.CCHelper.getCardUrl(data), this.contentBg);
        this.cardBg.node.active = false;
    },

    // use this for initialization
    onLoad: function () {

    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});