
cc.Class({
    extends: cc.Component,

    properties: {

    },

    start() {
        this.sprite = this.node.getComponent(cc.Sprite);

        this.setPosition();
        this.node.anchorX = 0;
        this.node.setScale(0);
    },

    setPosition() {
        this.node.position = this.startPos;
        let angle = Math.atan2(this.endPos.y - this.startPos.y, this.endPos.x - this.startPos.x);
        let rotation = -angle * 180.0 / Math.PI;
        this.node.rotation = rotation;
        let scaleX = this.startPos.sub(this.endPos).mag() / this.node.width;

        this.node.runAction(cc.sequence(
            cc.scaleTo(0.5, scaleX, 0.5),
            cc.delayTime(0.6),
            cc.spawn(cc.scaleTo(0.1, 0), cc.fadeOut(0.1)),
            cc.removeSelf()));
    },

    startAnimation() {
        let curIndex = 0;
        let spriteFrameCount = this.spriteFrameArr.length;
        this.schedule(function () {
            curIndex = (curIndex + 1) % spriteFrameCount;
            if (!!this.spriteFrameArr[curIndex]) {
                this.sprite.spriteFrame = this.spriteFrameArr[curIndex];
            }
        }.bind(this), 0.1);
    },

    setInfo(startPos, endPos) {
        this.startPos = startPos;
        this.endPos = endPos;

        let ramdomValue = Math.ceil(Math.random() * 3);
        if (ramdomValue == 0) {
            ramdomValue = 1;
        }
        let len = 4;
        if (ramdomValue == 3) {
            len = 5;
        }
        let lightningUrl = "ShenHaiBuYu/effect/lightning";
        AssetMgr.loadResSync(lightningUrl, cc.SpriteAtlas, undefined, function (err, spriteAtlas) {
            if (!!err) {
                console.error(err);
            } else {
                if (!this.node) return;
                this.spriteFrameArr = [];
                for (let i = 1; i <= len; ++i) {
                    this.spriteFrameArr.push(spriteAtlas.getSpriteFrame("lightning" + ramdomValue + "_0" + i));
                }
                if (this.spriteFrameArr.length > 0) {
                    let spriteFrame = this.spriteFrameArr[0];
                    let rect = spriteFrame.getRect();
                    this.node.width = rect.width;
                    this.node.height = rect.height;
                    this.startAnimation();
                }
            }
        }.bind(this));

    }
});
