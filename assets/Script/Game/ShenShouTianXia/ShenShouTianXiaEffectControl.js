cc.Class({
    extends: cc.Component,

    properties: {
        goldAnimationWidgetPrefab: cc.Prefab,
        silverAnimationWidgetPrefab: cc.Prefab,
        gainGoldLabelNode: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    fishCapture: function (gainGold, fishCtrl, gainCannonCtrl) {
        let fishTypeInfo = fishCtrl.fishTypeInfo;
        if (!fishCtrl.node) {
            return;
        }
        let fishParent = fishCtrl.node.parent;
        if (!fishParent) {
            cc.log("鱼已经被清理掉了，找不到父节点:" + fishCtrl.fishID);
        }
        if (!fishCtrl.node.parent) {
            return;
        }
        let pos = this.node.convertToNodeSpaceAR(fishCtrl.node.parent.convertToWorldSpaceAR(fishCtrl.node.position));

        let isGold = false;
        let goldValue = Math.ceil(gainGold);
        let coinCount = goldValue;
        let goldStr = "银币";
        if (goldValue > 10) {
            coinCount = coinCount / 5;
            coinCount = Math.ceil(coinCount);
            isGold = true;
            goldStr = "金币";
        }
        if (coinCount > 5) {
            coinCount = 5;
        }
        cc.log("得到" + goldStr + "[" + gainGold + "]" + coinCount + "个");
        let len = coinCount / 5 * 150;
        for (let i = 0; i < coinCount; ++i) {
            let node = null;
            if (isGold === true) {
                node = cc.instantiate(this.goldAnimationWidgetPrefab);
            } else {
                node = cc.instantiate(this.silverAnimationWidgetPrefab);
            }

            let offset = (Math.random() - 0.5) * len;
            node.position = new cc.Vec2(pos.x + offset, pos.y);
            node.parent = this.node;
            let ctrl = node.getComponent("SpriteFrameAnimationWidgetCtrl");
            ctrl.initAnimation();
            ctrl.startAnimation(true);
            let jumpAction = cc.jumpTo(2, node.position, 100, 2);
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
