let utils = require("../../Shared/utils");
cc.Class({
    extends: cc.Component,

    properties: {
        maskNode: cc.Node,
        pillarNode: cc.Node,
        goldAniNode: cc.Node,
        valueNode: cc.Node,
        greenValueBack: cc.Node,
        redValueBack: cc.Node,
        valueLabel: cc.Label
    },

    start() {

    },


    setInfo(value, baseValue, powerIndex, isRed, showTime, moveDistance, clearPillarCallBack, moveDir) {
        this.goldValue = value;
        this.baseValue = baseValue;
        this.powerIndex = powerIndex;
        this.isRed = isRed;
        this.showTime = showTime;
        this.moveDistance = moveDistance;
        this.clearPillarCallBack = clearPillarCallBack;
        this.moveDir = moveDir;
        this.moveDistance = this.moveDistance * this.moveDir;
    },

    playAnimation() {
        this.valueLabel.string = this.goldValue.toFixed(2);
        this.redValueBack.active = this.isRed;
        this.greenValueBack.active = !this.isRed;
        this.valueNode.active = false;
        this.goldAniNode.active = true;
        this.goldAnimation = this.goldAniNode.getComponent("SpriteFrameAnimationWidgetCtrl");
        this.goldAnimation.initAnimation();
        this.goldAnimation.startAnimation(true);

        let pillarHeight = this.goldValue / this.baseValue / this.powerIndex * 2;
        // cc.log("金币高度值:" + tempValue);
        // let pillarHeight = tempValue * 20;//当前倍率偏小，乘二十是为了金币柱的高度好看。。。
        if (pillarHeight < 2) {
            pillarHeight = 2;
        }
        let windowSize = cc.view.getVisibleSize();
        let maxHeight = windowSize.height / 2 - 20;
        if (pillarHeight > maxHeight) {
            pillarHeight = maxHeight;
        }
        this.valueNode.y = pillarHeight;
        let moveTime = pillarHeight / 300;
        let goldAniTargetPos = cc.v2(this.goldAniNode.position.x, pillarHeight);
        let actionList = cc.sequence(cc.moveTo(moveTime, goldAniTargetPos), cc.callFunc(function () {
            this.goldAniNode.active = false;
            this.valueNode.active = true;
        }.bind(this)));
        this.goldAniNode.runAction(actionList);

        let pillarTargetPos = cc.v2(this.pillarNode.position.x, pillarHeight);
        this.pillarNode.runAction(cc.moveTo(moveTime, pillarTargetPos));
    },

    //显示金币柱子
    showPillar() {
        this.pillarNode.position.y = 0;
        let targetPos = cc.v2(this.node.x + this.moveDistance, this.node.y);
        let moveAction = cc.spawn(cc.fadeIn(this.showTime), cc.moveTo(this.showTime, targetPos));
        moveAction = cc.sequence(moveAction, cc.callFunc(function () {
            this.playAnimation();
        }.bind(this)));
        this.node.runAction(moveAction);
        this.scheduleOnce(function () {
            this.clearFlag = true;
            if (!!this.clearPillarCallBack) {
                utils.invokeCallback(this.clearPillarCallBack);
            }
        }.bind(this), 4);
    },

    //移动金币柱子
    movePillar() {
        let targetPos = cc.v2(this.node.x + this.moveDistance, this.node.y);
        this.node.runAction(cc.moveTo(this.showTime, targetPos));
    },

    //清理金币柱子
    clearPillar() {
        let targetPos = cc.v2(this.node.x + this.moveDistance, this.node.y);
        let moveAction = cc.spawn(cc.moveTo(this.showTime, targetPos), cc.fadeOut(this.showTime));
        moveAction = cc.sequence(moveAction, cc.callFunc(function () {
            this.node.stopAllActions();
            this.node.removeFromParent();
        }.bind(this)));
        this.node.runAction(moveAction);
    }
});
