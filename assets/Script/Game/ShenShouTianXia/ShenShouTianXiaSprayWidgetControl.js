
cc.Class({
    extends: cc.Component,


    properties: {
    },

    start() {
        this.setAction();
    },

    startAnimation() {
        let spriteFrameCount = this.spriteFrameArr.length;
        let curIndex = 0;
        this.schedule(function () {
            curIndex = (curIndex + 1) % spriteFrameCount;
            if (!!this.spriteFrameArr[curIndex]) {
                this.sprite.spriteFrame = this.spriteFrameArr[curIndex];
            }
        }.bind(this), 0.1);
    },

    setAction() {
        let startPos = null;
        let endPos = null;
        let windowSize = cc.view.getVisibleSize();
        if (this.leftToRight) {
            startPos = cc.v2(-windowSize.width / 2 - 100, 0);
            endPos = cc.v2(windowSize.width / 2 + 100, 0);
        } else {
            startPos = cc.v2(windowSize.width / 2 + 100, 0);
            endPos = cc.v2(-windowSize.width / 2 - 100, 0);
        }
        this.node.position = startPos;
        let actionObj = cc.sequence(cc.moveTo(this.actionTime, endPos), cc.removeSelf());
        this.node.runAction(actionObj);
        if (actionObj.setElapsed) {
            actionObj.setElapsed(actionObj.getElapsed + 3);
        } else {
            actionObj._elapsed += 3;
        }
    },

    setInfo(leftToRight, actionTime) {

        this.leftToRight = leftToRight;
        this.actionTime = actionTime;

        let urlArr = [];
        for (let i = 1; i <= 2; ++i) {
            urlArr.push("ShenShouTianXia/effect/spray_0" + i);
        }
        AssetMgr.loadResArraySync(urlArr, cc.SpriteFrame, undefined, function (err, spriteFrameArr) {
            if (!!err) {
                console.error(err);
            } else {
                if (!this.node) return;
                this.spriteFrameArr = spriteFrameArr;
                if (this.spriteFrameArr.length > 0) {
                    let spriteFrame = spriteFrameArr[0];
                    let rect = spriteFrame.getRect();
                    this.node.width = rect.width;
                    this.node.height = rect.height;

                    this.sprite = this.node.getComponent(cc.Sprite);
                    let boxCollider = this.node.getComponent(cc.BoxCollider);
                    boxCollider.size.width = 15;
                    let windowSize = cc.view.getVisibleSize();
                    boxCollider.size.height = windowSize.height + 100;
                }
                this.startAnimation();
            }
        }.bind(this));

    },

    onCollisionEnter: function (other) {
        let type = other.node.group;
        if (type === "fish") {
            let fishCtrl = other.node.getComponent("ShenShouTianXiaFishCtrl");
            if (!fishCtrl) return;
            if (fishCtrl.bulletNoHit != true) {
                return;
            }
            if (!!this.sprayHideCount) {
                this.sprayHideCount++;
            } else {
                this.sprayHideCount = 1;
            }
            fishCtrl.onRemove();
        }
    },

});

