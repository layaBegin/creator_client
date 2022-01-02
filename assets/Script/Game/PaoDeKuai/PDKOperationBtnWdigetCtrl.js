cc.Class({
    extends: cc.Component,

    properties: {
        outCardNode: cc.Node,
        readyNode: cc.Node
    },

    onLoad() { },

    setHostingState: function (isHosting) {
        this.isHosting = isHosting;
        if (this.isHosting == true) {
            this.outCardNode.getChildByName('buchu').active = false;
            this.outCardNode.getChildByName('tip').active = false;
            this.outCardNode.getChildByName('outCard').active = false;
        }
        else {
            this.outCardNode.getChildByName('buchu').active = !this.isNewTurn && this.enablePass;
            this.outCardNode.getChildByName('tip').active = !this.isNewTurn && !this.enablePass;
            this.outCardNode.getChildByName('outCard').active = !this.enablePass;
        }
    },

    startReady: function () {
        this.outCardNode.active = false;
        this.readyNode.active = true;
    },

    startOutCard: function (isNewTurn, enablePass) {
        this.isNewTurn = isNewTurn;
        this.enablePass = enablePass;
        this.outCardNode.active = true;
        this.readyNode.active = false;

        this.outCardNode.getChildByName('buchu').active = !isNewTurn && enablePass;
        this.outCardNode.getChildByName('tip').active = !isNewTurn && !enablePass;
        this.outCardNode.getChildByName('outCard').active = !enablePass;
        if (this.isHosting == true) {
            this.outCardNode.getChildByName('buchu').active = false;
            this.outCardNode.getChildByName('tip').active = false;
            this.outCardNode.getChildByName('outCard').active = false;
        }
    },

    clearWidget: function () {
        this.outCardNode.active = false;
        this.readyNode.active = false;
    },

    getClockNode: function () {
        if (this.outCardNode.active) return this.outCardNode.getChildByName('selfClockNode');
        if (this.readyNode.active) return this.readyNode.getChildByName('selfClockNode');
        return null;
    }
});
