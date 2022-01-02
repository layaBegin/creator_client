let utils = require("../../Shared/utils");
let gameProto = require("./API/gameProto");
let fishConfig = require("./API/fishConfig");
cc.Class({
    extends: cc.Component,

    properties: {
        fishSprite: cc.Sprite,

        fishShadowSprite: cc.Sprite,

        fishCollider: cc.BoxCollider
    },

    start() {
        this.lastPos = this.node.position;

        this.fishSpriteFrameArr = this.fishSpriteFrameArr || [];

        this.startMove();

        this.startAnimation();

        this.listenerOutSenceEvent = false;
    },

    onDestroy() {
        if (!!this.showBeShotTimer) {
            clearTimeout(this.showBeShotTimer);
        }
    },

    initWidget(fishInfo, curServerTime, isShouldFixed, callback) {
        this.fishInfo = fishInfo;
        this.fishID = fishInfo.fishID;
        this.pathData = this.getPathData(fishInfo.pathArr, isShouldFixed);
        this.fishTypeInfo = fishConfig.fishType[fishInfo.fishTypeID];
        this.curServerTime = curServerTime;

        let urlArr = [];
        for (let i = 1; i <= this.fishTypeInfo.frameCount; ++i) {
            urlArr.push("Fish/Fish/fish" + this.fishTypeInfo.resIndex + "_" + i);
        }
        // cc.loader.loadResArray(urlArr, cc.SpriteFrame, function (err, spriteFrameArr) {
        AssetMgr.loadResArraySync(urlArr, cc.SpriteFrame, undefined, function (err, spriteFrameArr) {
            if (!!err) {
                console.error(err);
            } else {
                if (!this.node) return;
                this.fishSpriteFrameArr = spriteFrameArr;
                if (this.fishSpriteFrameArr.length > 0) {
                    let spriteFrame = spriteFrameArr[0];
                    let rect = spriteFrame.getRect();

                    this.node.width = rect.width;
                    this.node.height = rect.height;

                    this.fishCollider.size.width = this.node.width;
                    this.fishCollider.size.height = this.node.height;

                    this.fishSprite.node.width = this.node.width;
                    this.fishSprite.node.height = this.node.height;

                    this.fishShadowSprite.node.width = this.node.width;
                    this.fishShadowSprite.node.height = this.node.height;
                }
            }
        }.bind(this));
        if (!this.pathData) {
            console.error("fish path data err");
            return;
        }
        this.node.position = this.pathData.pointArr[0];

        this.callback = callback;
    },

    getPathData(pathArr, isShouldFixed) {
        let startPos = new cc.Vec2(0, 0);
        let dir = Math.floor(pathArr[0] / 21);
        let unitLengthX = fishConfig.createFishRange.x / 20;
        let unitLengthY = fishConfig.createFishRange.x / 20;
        if (dir % 2 === 0) {
            startPos.x = (pathArr[0] % 21 - 10) * unitLengthX;
            startPos.y = (dir % 4 - 1) * fishConfig.createFishRange.y;
        } else {
            startPos.x = (dir % 4 - 2) * -fishConfig.createFishRange.x;
            startPos.y = (pathArr[0] % 21 - 10) * unitLengthY;
        }

        let point1 = new cc.Vec2(0, 0);
        point1.x = (Math.floor(pathArr[1] / 10) - 5) * unitLengthX;
        point1.y = (pathArr[1] % 10 - 5) * unitLengthY;

        let endPos = new cc.Vec2(0, 0);
        let dir1 = Math.floor(pathArr[2] / 21);
        if (dir1 % 2 === 0) {
            endPos.x = (pathArr[2] % 21 - 10) * unitLengthX;
            endPos.y = (dir1 % 4 - 1) * fishConfig.createFishRange.y;
        } else {
            endPos.x = (dir1 % 4 - 2) * -fishConfig.createFishRange.x;
            endPos.y = (pathArr[2] % 21 - 10) * unitLengthY;
        }

        let time = (Global.Utils.getDist(startPos, point1) + Global.Utils.getDist(point1, endPos)) / 50;

        if (isShouldFixed) {
            startPos.x *= -1;
            startPos.y *= -1;

            point1.x *= -1;
            point1.y *= -1;

            endPos.x *= -1;
            endPos.y *= -1;
        }
        return {
            time: time,
            pointArr: [startPos, point1, endPos]
        }
    },

    startMove() {
        this.lastPos = this.node.position;
        let bezierToAction = cc.bezierTo(this.pathData.time / (this.fishTypeInfo.moveSpeed || 1), this.pathData.pointArr);
        let action = cc.sequence([
            bezierToAction,
            cc.callFunc(function () {
                if (!!this.callback) {
                    this.callback(this, "leave");
                }
            }.bind(this))
        ]);
        this.node.runAction(action);
        let dt = (this.curServerTime - this.fishInfo.createTime) / 1000;
        if (dt > 0) {
            action.step(0);
            action.step(dt);
        }
    },

    startAnimation() {
        let curIndex = 0;
        let spriteFrameCount = this.fishTypeInfo.frameCount;
        this.schedule(function () {
            curIndex = (curIndex + 1) % spriteFrameCount;
            if (!!this.fishSpriteFrameArr[curIndex]) {
                this.fishSprite.spriteFrame = this.fishSpriteFrameArr[curIndex];

                this.fishShadowSprite.spriteFrame = this.fishSpriteFrameArr[curIndex];
            }
        }.bind(this), 0.15);
    },

    // 被打中
    onBeShot() {
        if (!!this.showBeShotTimer) {
            clearTimeout(this.showBeShotTimer);
        }
        this.fishSprite.node.color = new cc.Color(255, 100, 100, 255);
        this.showBeShotTimer = setTimeout(function () {
            if (!cc.isValid(this)) {
                return;
            }
            this.fishSprite.node.color = new cc.Color(255, 255, 255, 255);
        }.bind(this), 1000);
    },

    // 被捕获
    onCapture() {
        this.onRemove();
    },

    onRemove() {
        this.unscheduleAllCallbacks();
        clearTimeout(this.showBeShotTimer);
        this.node.destroy();
    },

    // 开始监听鱼移除屏幕消息
    listenerOutScene: function (isStart) {
        this.listenerOutSenceEvent = isStart;
    },

    isInScene: function () {
        let node = this.node;
        if (!node) return false;
        let parent = this.node.parent;
        return !(node.x > parent.width * 0.5 || node.x < parent.width * -0.5 || node.y > parent.height * 0.5 || node.y < parent.height * -0.5);
    },

    onClear: function () {
        if (!!this.showBeShotTimer) {
            clearTimeout(this.showBeShotTimer);
        }
        this.node.stopAllActions();

        this.node.destroy();
    },

    update() {
        // 更新游动方向
        if (!this.fishTypeInfo.fixedRotation) {
            let unitVector = utils.getUnitVector(this.lastPos, this.node.position);
            if (unitVector.x !== 0 || unitVector.y !== 0) {
                this.node.rotation = Math.acos(unitVector.x) / Math.PI * -180;
                if (unitVector.y < 0) {
                    this.node.rotation *= -1;
                }
                //this.fishShadowSprite.node.rotation = this.fishSprite.node.rotation;
                this.lastPos = this.node.position;
            }
        } else {
            if (!this.fishTypeInfo.fixedDir) {
                let unitVector = utils.getUnitVector(this.lastPos, this.node.position);
                if (unitVector.x >= 0) {
                    this.node.scaleX = 1;
                } else {
                    this.node.scaleX = -1;
                }
            }
        }
        // 计算鱼是否移动出去
        if (this.listenerOutSenceEvent) {
            if (!this.isInScene()) {
                utils.invokeCallback(this.callback, this, "outScene");
                this.listenerOutSenceEvent = false;
            }
        }
    }
});
