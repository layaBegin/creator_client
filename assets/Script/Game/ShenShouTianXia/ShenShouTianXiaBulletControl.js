let utils = require('../../Shared/utils');

let BULLET_MOVE_SPEED = 700;
cc.Class({
    extends: cc.Component,

    properties: {
    },

    start() {
        this.isDestroyed = false;
    },

    initWidget: function (chairID, bulletId, bulletLevel, superBullet, captureCallback) {
        this.ownerChairID = chairID;
        this.bulletId = bulletId;
        this.bulletLevel = parseInt(bulletLevel);
        this.superBullet = superBullet;
        this.captureCallback = captureCallback;
        this.spr = this.node.getComponent(cc.Sprite);
        let bulletNo = chairID + 1;
        let powerLevel = 1;
        if (this.bulletLevel <= 3) {
            powerLevel = 1;
        } else if (this.bulletLevel <= 5) {
            powerLevel = 2;
        } else if (this.bulletLevel <= 8) {
            powerLevel = 3;
        } else {
            powerLevel = 4;
        }
        let res = cc.loader.getRes("ShenShouTianXia/Atlas/bullet", cc.SpriteAtlas);
        let bulletName = "";
        if (this.superBullet === true) {
            bulletName = "bullet" + powerLevel + "_ion_01";
        } else {
            bulletName = "bullet" + powerLevel + "_norm" + bulletNo + "_02";
        }
        this.spr.spriteFrame = res.getSpriteFrame(bulletName);
    },

    emit: function (cannonPos, mathRote, targetFish, moveTime, wallRoot) {
        this.fireRote = mathRote;
        this.cannonPos = cannonPos;
        let unitVector = { x: Math.cos(mathRote / 180 * Math.PI), y: Math.sin(mathRote / 180 * Math.PI) };
        this.startPos = cc.v2(this.node.x, this.node.y);
        this.node.rotation = mathRote * -1 + 90;
        this.unitVector = unitVector;
        this.targetFish = targetFish;
        if (!!this.targetFish) {
            this.node.x = cannonPos.x;
            this.node.y = cannonPos.y;
            this.schedule(this.updateDir.bind(this), 1 / 30);
        } else {
            this.node.x = cannonPos.x + unitVector.x * 100;
            this.node.y = cannonPos.y + unitVector.y * 100;
            if (!!moveTime) {//?????????????????????[????????????]
                this.restoreScene(moveTime, wallRoot);
            } else {
                let moveDistance = 3000;
                let moveBy = new cc.Vec2(unitVector.x * moveDistance, unitVector.y * moveDistance);
                this.node.runAction(cc.moveBy(moveDistance / BULLET_MOVE_SPEED, moveBy));
            }
        }
    },

    //??????????????????
    restoreScene: function (moveTime, wallRoot) {
        this.restoreScene = true;
        let totalDistance = moveTime * BULLET_MOVE_SPEED;//?????????????????????
        let windowSize = cc.view.getVisibleSize();
        let tbHypotenuse = 0;
        let lrHypotenuse = 0;
        let tempHeight = 0;
        if (this.node.y > 0) {
            tempHeight = windowSize.height / 2 + this.node.y;
        } else {
            tempHeight = windowSize.height / 2 - this.node.y;
        }
        tbHypotenuse = tempHeight / this.unitVector.y;//??????????????????????????????????????????
        tbHypotenuse = Math.abs(tbHypotenuse);

        let tempWidth = 0;
        if (this.fireRote > 90) {
            if (this.node.x < 0) {
                tempWidth = windowSize.width / 2 + this.node.x;
            } else {
                tempWidth = windowSize.width / 2 + this.node.x;
            }
        } else {
            if (this.node.x < 0) {
                tempWidth = windowSize.width / 2 - this.node.x;
            } else {
                tempWidth = windowSize.width / 2 - this.node.x;
            }
        }
        lrHypotenuse = tempWidth / this.unitVector.x;//??????????????????????????????????????????
        lrHypotenuse = Math.abs(lrHypotenuse);

        let moveDistance = 3000;
        let distanceY = 0;
        let hitTime = 0;
        let tempY = 0;
        let distanceX = 0;
        let widthTime = 0;
        let tempX = 0;
        let moveBy = null;
        let heightTime = 0;
        let tempValue = 0;
        if (tbHypotenuse < lrHypotenuse) {//???????????????
            if (tbHypotenuse > totalDistance) {//???????????????
                this.node.x = this.startPos.x + this.unitVector.x * totalDistance;
                this.node.y = this.startPos.y + this.unitVector.y * totalDistance;
                moveBy = new cc.Vec2(this.unitVector.x * moveDistance, this.unitVector.y * moveDistance);
                this.node.runAction(cc.moveBy(moveDistance / BULLET_MOVE_SPEED, moveBy));
            } else {
                distanceY = this.unitVector.y * (totalDistance - tbHypotenuse);//?????????y???????????????????????????
                distanceY = Math.abs(distanceY);
                hitTime = parseInt(distanceY / windowSize.height);//?????????????????????
                tempY = distanceY % windowSize.height;
                if (hitTime % 2 === 0) {
                    this.node.y = (windowSize.height / 2) - tempY;
                    this.unitVector.y *= -1;
                } else {
                    this.node.y = tempY - (windowSize.height / 2);
                }
                distanceX = this.unitVector.x * totalDistance;//???x???????????????????????????
                distanceX = Math.abs(distanceX);

                let distanceXToLR = 0;//????????????????????????
                if (this.startPos.x > 0) {
                    if (this.fireRote > 90) {
                        distanceXToLR = windowSize.width / 2 + this.startPos.x;
                    } else {
                        distanceXToLR = windowSize.width / 2 - this.startPos.x;
                    }
                } else {
                    if (this.fireRote > 90) {
                        distanceXToLR = windowSize.width / 2 + this.startPos.x;
                    } else {
                        distanceXToLR = windowSize.width / 2 - this.startPos.x;
                    }
                }
                if (distanceXToLR > distanceX) {//????????????????????????
                    if (this.fireRote > 90) {
                        this.node.x -= distanceX;
                    } else {
                        this.node.x += distanceX;
                    }
                } else {//?????????????????????
                    distanceX -= distanceXToLR;
                    widthTime = parseInt(distanceX / windowSize.width);
                    tempX = distanceX % windowSize.width;
                    if (widthTime % 2 == 0) {
                        this.node.x = (windowSize.width / 2) - tempX;
                        this.unitVector.x *= -1;
                    } else {
                        this.node.x = tempX - (windowSize.width / 2);
                    }
                }
                this.updateBulletRotation();
                moveBy = new cc.Vec2(this.unitVector.x * moveDistance, this.unitVector.y * moveDistance);
                this.node.runAction(cc.moveBy(moveDistance / BULLET_MOVE_SPEED, moveBy));
            }
        } else if (tbHypotenuse > lrHypotenuse) {//???????????????
            if (lrHypotenuse > totalDistance) {//?????????
                this.node.x = this.startPos.x + this.unitVector.x * totalDistance;
                this.node.y = this.startPos.y + this.unitVector.y * totalDistance;
                moveBy = new cc.Vec2(this.unitVector.x * moveDistance, this.unitVector.y * moveDistance);
                this.node.runAction(cc.moveBy(moveDistance / BULLET_MOVE_SPEED, moveBy));
            } else {
                distanceX = this.unitVector.x * (totalDistance - lrHypotenuse);//?????????x???????????????????????????
                distanceX = Math.abs(distanceX);
                hitTime = parseInt(distanceX / windowSize.width);//?????????????????????
                tempX = distanceX % windowSize.width;
                if (hitTime % 2 == 0) {
                    if (this.fireRote > 90) {
                        this.node.x = tempX - (windowSize.width / 2);
                    } else {
                        this.node.x = (windowSize.width / 2) - tempX;
                    }
                    this.unitVector.x *= -1;
                } else {
                    if (this.fireRote > 90) {
                        this.node.x = (windowSize.width / 2) - tempX;
                    } else {
                        this.node.x = tempX - (windowSize.width / 2);
                    }
                }

                distanceY = this.unitVector.y * totalDistance;//???y???????????????????????????
                distanceY = Math.abs(distanceY);
                if (this.startPos.y > 0) {
                    tempValue = windowSize.height / 2 - this.startPos.y;
                } else {
                    tempValue = windowSize.height / 2 + this.startPos.y;
                }
                distanceY += tempValue;

                heightTime = parseInt(distanceY / windowSize.height);
                tempY = distanceY % windowSize.height;
                if (heightTime % 2 == 0) {
                    this.node.y = tempY - (windowSize.height / 2);
                } else {
                    this.node.y = (windowSize.height / 2) - tempY;
                    this.unitVector.y *= -1;
                }
                this.updateBulletRotation();
                moveBy = new cc.Vec2(this.unitVector.x * moveDistance, this.unitVector.y * moveDistance);
                this.node.runAction(cc.moveBy(moveDistance / BULLET_MOVE_SPEED, moveBy));
            }
        }
    },

    //??????????????????
    updateBulletRotation() {
        let mathRote = Math.acos(this.unitVector.x) * 180 / Math.PI;
        if (this.unitVector.y < 0) mathRote *= -1;
        this.node.rotation = mathRote * -1 + 90;
    },

    onCollisionEnter: function (other) {
        if (this.isDestroyed) return;
        let type = other.node.group;
        if (type === "wall") {
            if (!!this.targetFish) {
                this.targetFish = null;
            }
            let node = other.node;
            if (node.name === "top" || node.name === "bottom") {
                this.unitVector.y *= -1;
            } else {
                this.unitVector.x *= -1;
            }
            let moveBy = new cc.Vec2(this.unitVector.x * 3000, this.unitVector.y * 3000);
            this.node.stopAllActions();
            this.node.runAction(cc.moveBy(3000 / BULLET_MOVE_SPEED, moveBy));
            // ????????????
            this.node.rotation = (Math.acos(this.unitVector.x) / Math.PI * -180 + 90);
            if (this.unitVector.y < 0) this.node.rotation = (this.node.rotation - 90) * -1 + 90;
        } else if (type === "fish") {
            let fishCtrl = other.node.getComponent("ShenShouTianXiaFishCtrl");
            if (!fishCtrl) return;
            // ?????????
            if (!!this.targetFish && !!this.targetFish.node && this.targetFish !== fishCtrl) {
                return;
            }
            if (fishCtrl.bulletNoHit === true) {
                return;
            }
            // ????????????????????????
            this.captureCallback(this, fishCtrl);
        }
    },

    onShootFish: function () {
        this.node.destroy();
        this.isDestroyed = true;
    },

    updateDir: function (dt) {
        if (!!this.targetFish && !!this.targetFish.node) {
            if (this.targetFish.bulletNoHit === true) {
                this.resetTargetFish();
                return;
            }
            this.unitVector = utils.getUnitVector(this.node.position, this.targetFish.node.position);

            let mathRote = Math.acos(this.unitVector.x) * 180 / Math.PI;
            if (this.unitVector.y < 0) mathRote *= -1;
            this.node.rotation = mathRote * -1 + 90;

            this.node.x += (BULLET_MOVE_SPEED * dt * this.unitVector.x);
            this.node.y += (BULLET_MOVE_SPEED * dt * this.unitVector.y);
        } else {
            this.resetTargetFish();
        }
    },

    resetTargetFish: function () {
        this.targetFish = null;
        this.unscheduleAllCallbacks();
        let moveBy = new cc.Vec2(this.unitVector.x * 1000, this.unitVector.y * 1000);
        this.node.runAction(cc.moveBy(1000 / BULLET_MOVE_SPEED, moveBy));
    },
});
