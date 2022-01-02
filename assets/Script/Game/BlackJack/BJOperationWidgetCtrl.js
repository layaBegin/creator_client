let TWO_HAND_CARDS_OFFSET = 60;
cc.Class({
    extends: cc.Component,

    properties: {
        addCard: cc.Node,
        stopCard: cc.Node,
        double: cc.Node,
        cutCard: cc.Node
    },

    onLoad () {
    },

    startOperation: function (operationTypeArr, index, callback) {
        this.node.active = true;
        this.index = index;
        this.callback = callback;
        this.addCard.getComponent(cc.Button).enabled = false;
        this.addCard.opacity = 150;
        this.stopCard.getComponent(cc.Button).enabled = false;
        this.stopCard.opacity = 150;
        this.double.getComponent(cc.Button).enabled = false;
        this.double.opacity = 150;
        this.cutCard.getComponent(cc.Button).enabled = false;
        this.cutCard.opacity = 150;
        for (let i = 0; i < operationTypeArr.length; ++i) {
            this[operationTypeArr[i]].getComponent(cc.Button).enabled = true;
            this[operationTypeArr[i]].opacity = 255;
        }
    },

    stopOperation_addCard: function (isStop_) {
        this.addCard.getComponent(cc.Button).enabled = !isStop_;
        this.addCard.opacity = !isStop_ ? 255 : 150;
    },

    stopOperation: function () {
        this.node.active = false;
    },

    onBtnClick: function (event, param) {
        //AudioMgr.playCommonSoundClickButton();
        Global.CCHelper.playPreSound();
        this.callback(param, this.index);
    }
});
