cc.Class({
    extends: cc.Component,

    properties: {
        goldAnimationWidgetPrefab: cc.Prefab,
        gainGoldLabelNode: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    fishCapture: function (gainGold, fishCtrl, gainCannonCtrl) {
        let fishTypeInfo = fishCtrl.fishTypeInfo;
        let pos = this.node.convertToNodeSpaceAR(fishCtrl.node.parent.convertToWorldSpaceAR(fishCtrl.node.position));
        let goldCount = fishTypeInfo.rewardTimes/10;
        if (goldCount < 5) goldCount = 5;
        let len = goldCount/5 * 150;
        for (let i = 0; i < goldCount; ++i) {
            let node = cc.instantiate(this.goldAnimationWidgetPrefab);
            let offset = (Math.random() - 0.5) * len;
            node.position = new cc.Vec2(pos.x + offset, pos.y);
            node.parent = this.node;
            let ctrl = node.getComponent("SpriteFrameAnimationWidgetCtrl");
            ctrl.initAnimation();
            ctrl.startAnimation();
            let jumpAction = cc.jumpTo(1, node.position, 100, 2);
            let endPos = this.node.convertToNodeSpaceAR(gainCannonCtrl.getUserHeadWorldPos());
            let time = Global.Utils.getDist(node.position, endPos) / 2000;
            if (i === 0) {
                node.runAction(cc.sequence([cc.delayTime(i * 0.05), jumpAction, cc.delayTime(0.1), cc.moveTo(time, endPos), cc.callFunc(function () {
                    node.destroy();
                    gainCannonCtrl.goldChange(gainGold, true);
                })]));
            } else {
                node.runAction(cc.sequence([cc.delayTime(i * 0.05), jumpAction, cc.delayTime(0.1), cc.moveTo(time, endPos), cc.removeSelf()]));
            }
        }

        let goldLabelNode = cc.instantiate(this.gainGoldLabelNode);
        goldLabelNode.active = true;
        goldLabelNode.parent = this.node;
        goldLabelNode.position = pos;
        goldLabelNode.y += 100;
        goldLabelNode.getComponent(cc.Label).string = "+" + parseFloat(gainGold.toFixed(2));
        goldLabelNode.runAction(cc.sequence([cc.delayTime(1), cc.fadeTo(0.5, 0), cc.removeSelf()]));
    }

    // update (dt) {},
});
