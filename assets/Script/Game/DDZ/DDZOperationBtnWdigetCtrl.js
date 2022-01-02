
cc.Class({
    extends: cc.Component,

    properties: {
        callLandNode: cc.Node,
        outCardNode: cc.Node,
        // readyNode: cc.Node,
        // callBankArr:[cc.Node]
    },

    onLoad () {},

    startReady: function () {
        this.callLandNode.active = false;
        this.outCardNode.active = false;
        // this.readyNode.active = true;
    },
    
    startCallLand: function (scoreArr) {
        this.callLandNode.active = true;
        this.outCardNode.active = false;
        // this.readyNode.active = false;
        for (let i = 1;  i <= 3; ++i){
            let node = this.callLandNode.getChildByName(i.toString());
            if (!!node){
                let bActive = scoreArr.indexOf(i) !== -1;
                node.active = bActive;
            }
        }
    },
    
    startOutCard: function (isNewTurn) {
        this.callLandNode.active = false;
        this.outCardNode.active = true; //出牌按钮
        // this.readyNode.active = false;

        this.outCardNode.getChildByName('buchu').active = !isNewTurn;
        this.outCardNode.getChildByName('tip').active = !isNewTurn;
    },

    clearWidget: function () {
        this.callLandNode.active = false;
        this.outCardNode.active = false;
        // this.readyNode.active = false;
    },

    getClockNode: function () {
        if (this.callLandNode.active) return this.callLandNode.getChildByName('selfClockNode');
        if (this.outCardNode.active) return this.outCardNode.getChildByName('selfClockNode');
        // if (this.readyNode.active) return this.readyNode.getChildByName('selfClockNode');
        return null;
    }
});
