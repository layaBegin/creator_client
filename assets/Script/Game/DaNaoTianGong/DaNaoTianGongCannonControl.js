let fishConfig = require("./API/DaNaoTianGongConfig");
let CHANGE_GOLD_SHOW_TIME = 3;

cc.Class({
    extends: cc.Component,

    properties: {
        cannon: cc.Node,
        cannonSpr: cc.Node,
        powerLabel: cc.Label,
        changePowerNode: cc.Node,

        cannonBaseNode: cc.Node,

        cannonBack: cc.Sprite,

        userInfoNode: cc.Node,
        avatarSprite: cc.Sprite,
        goldCountLabel: cc.Label,
        nicknameLabel: cc.Label,
        winScoreLabel: cc.Label,

        lockLineWidgetCtrl: require("DaNaoTianGongLockLineWidgetControl"),

        fireEffect1: cc.Node,
        fireEffect2: cc.Node,
        fireEffect3: cc.Node,

        lockFishNode: cc.Node,
        animationNode: cc.Node,
        lockFish: cc.Node,

        prizeNode: cc.Node,
        prize1: cc.Node,
        prize2: cc.Node,
        prize3: cc.Node,
        prizeLabel: cc.Node,

        superNode: cc.Node,
        superAniNode: cc.Node,
        superCountLabel: cc.Label,

        goldPillarNode: cc.Node,
        pillarItem: cc.Node,
    },

    start() {
        this.isDestroyed = false;
        this.powerIndex = this.powerIndex || 1;
        this.lockFishCtrl = this.lockFishCtrl || null;
        this.cannonPos = this.cannon.position;
        this.lockFishNode.active = false;
        this.prizeNode.active = false;
        this.pillarList = [];
        this.isRedPillar = true;
        this.cannonRotation = 90;
    },

    onDestroy() {
        this.isDestroyed = true;
    },

    initWidget(roomUserInfo, isSelf, posIndex, winGold, changeCannonPowerCallback) {
        this.isSelf = isSelf;
        this.roomUserInfo = roomUserInfo;
        this.changePowerNode.active = isSelf;
        this.posIndex = posIndex;
        // 提示玩家自己的位置

        this.winGold = winGold;

        // 更新用户信息
        this.updateUserInfo(roomUserInfo.userInfo, this.winGold);

        // 修改用户信息的位置
        if (posIndex === 1) {
            this.userInfoNode.x *= -1;
            this.lockFishNode.x *= -1;
            this.superNode.x *= -1;
            this.prizeNode.x *= -1;
            this.goldPillarNode.x *= -1;
        } else if (posIndex === 2) {
            this.userInfoNode.x *= -1;
            this.userInfoNode.y *= -1;
            this.lockFishNode.x *= -1;
            this.lockFishNode.y *= -1;
            this.superNode.x *= -1;
            this.superNode.y *= -1;
            this.prizeNode.x *= -1;
            this.prizeNode.y *= -1;
            this.goldPillarNode.x *= -1;
            this.goldPillarNode.y *= -1;
            this.goldPillarNode.scaleY = -1;
            this.cannonBaseNode.rotation = 180;
            this.powerLabel.node.rotation = 180;
            this.powerLabel.node.y = 12;
        } else if (posIndex === 3) {
            this.userInfoNode.y *= -1;
            this.lockFishNode.y *= -1;
            this.superNode.y *= -1;
            this.prizeNode.y *= -1;
            this.goldPillarNode.y *= -1;
            this.goldPillarNode.scaleY = -1;
            this.cannonBaseNode.rotation = 180;
            this.powerLabel.node.rotation = 180;
            this.powerLabel.node.y = 12;
        }

        this.changeCannonPowerCallback = changeCannonPowerCallback;

        this.lockLineWidgetCtrl.setChairIndex(roomUserInfo.chairId);
        let tempValue = roomUserInfo.chairId + 1;
        // let cannonBackUrl = "DaNaoTianGong/cannon/deco" + tempValue;
        // Global.CCHelper.updateSpriteFrame(cannonBackUrl, this.cannonBack);
    },

    updateUserInfo(userInfo, winGold) {
        if (this.isDestroyed) return;
        this.roomUserInfo.userInfo = userInfo;
        this.winGold = winGold;
        Global.CCHelper.updateSpriteFrame(userInfo.avatar, this.avatarSprite);
        this.goldCountLabel.string = parseFloat((userInfo.gold + winGold).toFixed(2)) + '';
        if (userInfo.uid == Global.Player.getPy('uid')) {
            this.nicknameLabel.string = userInfo.nickname;
        } else {
            this.nicknameLabel.string = Global.Player.convertNickname(userInfo.nickname);
        }

    },

    goldChange(changeCount, showAnim) {
        if (this.isDestroyed) return;
        if (changeCount === 0) return;
        this.winGold += changeCount;
        let curCount = this.roomUserInfo.userInfo.gold + this.winGold;
        this.goldCountLabel.string = parseFloat(curCount.toFixed(2)) + '';
        if ((changeCount > 0) && showAnim) {
            this.showGoldChange(changeCount);
        }
    },

    showGoldChange(changeCount) {
        if (changeCount === 0) return;
        this.winScoreLabel.string = "+" + parseFloat(changeCount.toFixed(2)) + '';
        this.winScoreLabel.node.y = 20;
        let endPosY = 40;
        if (this.posIndex === 3 || this.posIndex === 2) {
            this.winScoreLabel.node.y = 10;
            endPosY = 30;
        }
        this.winScoreLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, endPosY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
    },

    onFire(rotation) {
        if (rotation < -20 && rotation > - 160) {
            return;
        }
        this.cannonRotation = rotation;
        if (this.isDestroyed) return;
        this.cannon.rotation = rotation * -1 + 90;
        this.cannon.rotation -= this.cannonBaseNode.rotation;
        // 播放动画
        // this.cannon.startAnimation(false);
        // 锁定时更新锁定路径
        if (!!this.lockFishCtrl && !!this.lockFishCtrl.node) {
            if (!!this.lockFishCtrl.node.parent) {
                this.lockLineWidgetCtrl.updateLine(this.lockFishCtrl.node.parent.convertToWorldSpaceAR(this.lockFishCtrl.node.position));
            }
        }
    },

    //朝向
    onFace(rotation) {
        if (rotation < -20 && rotation > - 160) {
            return;
        }
        this.cannonRotation = rotation;
        if (this.isDestroyed) return;
        this.cannon.rotation = rotation * -1 + 90;
        this.cannon.rotation -= this.cannonBaseNode.rotation;
    },

    getCannonWorldPos: function () {
        if (this.isDestroyed) return cc.v2(0, 0);
        return this.cannonBaseNode.convertToWorldSpaceAR(this.cannon.position);
    },

    getUserHeadWorldPos: function () {
        if (this.isDestroyed) return cc.v2(0, 0);
        return this.avatarSprite.node.parent.convertToWorldSpaceAR(this.avatarSprite.node.position);
    },

    getCurGold: function () {
        return this.roomUserInfo.userInfo.gold + this.winGold;
    },

    onLeave: function () {
        if (this.isDestroyed) return;
        // this.cannonAnimationCtrl.stopAnimation();
        this.node.destroy();
    },

    onChangeCannonPower: function (bulletGold, powerIndex) {
        if (this.isDestroyed) return;
        this.powerIndex = powerIndex;
        cc.log("炮等级:" + this.powerIndex);
        this.bulletGold = bulletGold;
        this.powerLabel.string = parseFloat(bulletGold.toFixed(2)).toString();
        this.updateCannonPic();
    },

    updateCannonPic: function () {
        let gunUrl = "DaNaoTianGong/cannon/gun";
        // if (this.isSuper === true) {
        //     gunUrl = "DaNaoTianGong/cannon/gun_super_";
        // }
        let gunIndex = 1;
        if (this.powerIndex <= 4) {
            gunIndex = 1;
        } else if (this.powerIndex <= 7) {
            gunIndex = 2;
        } else {
            gunIndex = 3;
        }
        gunUrl = gunUrl + gunIndex;
        Global.CCHelper.updateSpriteFrame(gunUrl, this.cannonSpr);
    },

    onLockFish: function (fishCtrl) {
        if (!fishCtrl || !fishCtrl.node) {
            this.lockFishCtrl = null;
            this.lockLineWidgetCtrl.node.active = false;
            this.lockFishNode.active = false;
            this.animationNode.getComponent(cc.Animation).enabled = false;
        } else {
            this.lockFishCtrl = fishCtrl;
            this.lockLineWidgetCtrl.node.active = true;
            this.lockFishNode.active = true;
            this.animationNode.getComponent(cc.Animation).enabled = true;
            let lockFishCtrl = this.lockFish.getComponent("DaNaoTianGongFishCtrl");
            lockFishCtrl.showFishPic(fishCtrl.fishTypeID, fishCtrl.fishKind, fishCtrl.isRedFish);
            let scaleValue = 1;
            switch (fishCtrl.fishTypeID) {
                case fishConfig.FishKind.FishKind15:
                    scaleValue = 0.8;
                    break;
                case fishConfig.FishKind.FishKind16:
                    scaleValue = 0.8;
                    break;
                case fishConfig.FishKind.FishKind17:
                    scaleValue = 0.7;
                    break;
                case fishConfig.FishKind.FishKind18:
                    scaleValue = 0.6;
                    break;
                case fishConfig.FishKind.FishKind19:
                    scaleValue = 0.6;
                    break;
                case fishConfig.FishKind.FishKind20:
                    scaleValue = 0.4;
                    break;
                case fishConfig.FishKind.AutoIncrement:
                    scaleValue = 0.6;
                    break;
                case fishConfig.FishKind.FixBomb:
                    scaleValue = 0.8;
                    break;
                case fishConfig.FishKind.LocalBomb:
                    scaleValue = 0.6;
                    break;
                case fishConfig.FishKind.SuperBomb:
                    scaleValue = 0.8;
                    break;
                case fishConfig.FishKind.DaSanYuan:
                    scaleValue = 0.5;
                    break;
                case fishConfig.FishKind.DaSiXi:
                    scaleValue = 0.5;
                    break;
                case 27:
                    scaleValue = 0.8;
                    break;
                case 28:
                    scaleValue = 0.8;
                    break;
                case 29:
                    scaleValue = 0.4;
                    break;
                case 30:
                    scaleValue = 0.7;
                    break;
            }
            this.lockFish.setScale(scaleValue);
        }
    },

    onBtnClick: function (event, params) {
        if (params === "addPower") {
            if (this.powerIndex === 10) {
                this.powerIndex = 1;
            } else {
                this.powerIndex++;
            }
            this.changeCannonPowerCallback(this.powerIndex);
            AudioMgr.playSound('DaNaoTianGong/sound/effect/cannonSwitch');
        } else if (params === "downPower") {
            if (this.powerIndex === 1) {
                this.powerIndex = 10;
            } else {
                this.powerIndex--;
            }
            this.changeCannonPowerCallback(this.powerIndex);
            AudioMgr.playSound('DaNaoTianGong/sound/effect/cannonSwitch');
        }
    },

    onClear: function () {
        this.isDestroyed = true;
        this.lockFishCtrl = null;
        // this.cannonAnimationCtrl.stopAnimation();
        this.node.destroy();
    },

    update(dt) {
        if (!!this.lockFishCtrl && !!this.lockFishCtrl.node) {
            if (!!this.lockFishCtrl.node.parent) {
                this.lockLineWidgetCtrl.updateLine(this.lockFishCtrl.node.parent.convertToWorldSpaceAR(this.lockFishCtrl.node.position));
                this.cannon.rotation = this.lockLineWidgetCtrl.node.rotation;
                this.cannonRotation = (this.cannon.rotation - 90) * -1;
            }
        }
        this.updateSuperCountTime(dt);
    },

    //更新魔能炮剩余时间
    updateSuperCountTime(dt) {
        if (!this.countTime) {
            this.clearSuperNode();
            return;
        }
        this.countTime -= dt;
        if (this.countTime <= 0) {
            this.clearSuperNode();
            return;
        }
        let tempTime = Math.ceil(this.countTime);
        this.superCountLabel.string = tempTime;
    },

    //后坐力
    recoilForceEffect() {
        let fireAngle = this.cannon.rotation;
        let fireActionTag = 123;
        let power = 10;
        let angle = fireAngle * Math.PI / 180;
        let displacement = cc.v2(-Math.sin(angle) * power, -Math.cos(angle) * power);

        let dt = 0.5;
        if (!this.cannonPos) {
            this.cannonPos = this.cannon.position;
        }
        let tempPos = cc.v2(this.cannonPos.x + displacement.x, this.cannonPos.y + displacement.y);
        let powerAction = cc.sequence(cc.moveTo(dt / 2, tempPos), cc.moveTo(dt / 2, this.cannonPos));
        powerAction.easing(cc.easeExponentialOut());

        this.cannon.stopActionByTag(fireActionTag);
        powerAction.setTag(fireActionTag);
        this.cannon.runAction(powerAction);
    },

    //开炮火光效果
    cannonFireEffect() {
        let fireEffect = null;
        if (this.powerIndex <= 4) {
            fireEffect = cc.instantiate(this.fireEffect1);
            fireEffect.parent = this.fireEffect1.parent;
            fireEffect.position = this.fireEffect1.position;
        } else if (this.powerIndex <= 7) {
            fireEffect = cc.instantiate(this.fireEffect2);
            fireEffect.parent = this.fireEffect2.parent;
            fireEffect.position = this.fireEffect2.position;
        } else {
            fireEffect = cc.instantiate(this.fireEffect3);
            fireEffect.parent = this.fireEffect3.parent;
            fireEffect.position = this.fireEffect3.position;
        }
        if (!!fireEffect) {
            fireEffect.active = true;
            let effectList = fireEffect.getChildren();
            if (!!effectList) {
                let fireEffectCtrl = null;
                let len = effectList.length;
                for (let i = 0; i < len; ++i) {
                    fireEffectCtrl = effectList[i].getComponent(cc.Animation);
                    if (!!fireEffectCtrl) {
                        fireEffectCtrl.on("stop", (event) => {
                            fireEffect.removeFromParent(true);
                        }, this);
                        fireEffectCtrl.play();
                    }
                }
            }
        }
    },

    //显示转盘
    showPrize(gainGold, baseValue) {
        let rewardTimes = gainGold / baseValue / this.powerIndex;
        if (rewardTimes < 25) {
            return;
        }
        this.prize1.active = false;
        this.prize1.stopAllActions();
        this.prize2.active = false;
        this.prize2.stopAllActions();
        this.prize3.active = false;
        this.prize3.stopAllActions();
        this.prizeNode.active = false;
        let totalTime = 4;
        let scaleBigTime = 0.7;
        let scaleSmallTime = 0.8;
        let rotateTime = 2;
        this.prizeLabel.getComponent(cc.Label).string = gainGold.toFixed(2);
        this.prizeNode.active = true;
        let aniCtrl = null;
        let rotateAndScaleAni = cc.spawn(cc.rotateBy(scaleBigTime + scaleSmallTime, 360), cc.sequence(cc.scaleTo(scaleBigTime, 2), cc.scaleTo(scaleSmallTime, 1)));
        rotateAndScaleAni = cc.sequence(rotateAndScaleAni, cc.rotateBy(rotateTime, 540));
        if (rewardTimes < 50) {
            this.prize1.active = true;
            aniCtrl = this.prize1.getComponent("SpriteFrameAnimationWidgetCtrl");
            if (!!aniCtrl) {
                aniCtrl.initAnimation();
                aniCtrl.startAnimation(true, 1);
                this.prize1.runAction(rotateAndScaleAni);
                this.scheduleOnce(function () {
                    this.prizeNode.active = false;
                    this.prize1.active = false;
                    aniCtrl.stopAnimation();
                }.bind(this), totalTime);
            }
            AudioMgr.playSound('DaNaoTianGong/sound/effect/bingo');
            return;
        }
        if (rewardTimes < 100) {
            this.prize2.active = true;
            this.prize2.runAction(rotateAndScaleAni);
            this.scheduleOnce(function () {
                this.prizeNode.active = false;
                this.prize2.active = false;
            }.bind(this), totalTime);
            AudioMgr.playSound('DaNaoTianGong/sound/effect/bingo');
            return;
        }
        this.prize3.active = true;
        aniCtrl = this.prize3.getComponent("SpriteFrameAnimationWidgetCtrl");
        if (!!aniCtrl) {
            aniCtrl.initAnimation();
            aniCtrl.startAnimation(true, 1);
            this.prize3.runAction(rotateAndScaleAni);
            this.scheduleOnce(function () {
                this.prizeNode.active = false;
                this.prize3.active = false;
                aniCtrl.stopAnimation();
            }.bind(this), totalTime);
            AudioMgr.playSound('DaNaoTianGong/sound/effect/prize1');
        }
    },

    //设置魔能炮状态和倒计时
    setSuperInfo(isSuper, countTime) {
        this.isSuper = isSuper;
        let changePowerActive = false;
        if (this.isSuper === false && this.isSelf) {
            changePowerActive = true;
        }
        this.changePowerNode.active = changePowerActive;
        this.updateCannonPic();
        if (isSuper === false) {
            this.clearSuperNode();
        } else {
            this.superNode.active = true;
            let ani = this.superAniNode.getComponent(cc.Animation);
            ani.enabled = true;
            this.countTime = countTime;
        }
    },

    //清理魔能炮节点
    clearSuperNode() {
        this.superNode.active = false;
        let ani = this.superAniNode.getComponent(cc.Animation);
        ani.enabled = false;
    },

    //显示金币柱子
    showGoldPillar(goldValue, baseValue) {
        if (!this.pillarList) {
            this.pillarList = [];
        }
        let len = this.pillarList.length;
        for (let i = 0; i < len; ++i) {
            let pillarctrl = this.pillarList[i].getComponent("DaNaoTianGongGoldPillarControl");
            if (i == 0 && len == 4) {
                pillarctrl.clearPillar();
                continue;
            }
            pillarctrl.movePillar();
        }
        if (len >= 4) {
            this.pillarList.splice(0, 1);
        }
        let pillarItem = cc.instantiate(this.pillarItem);
        let pillarCtrl = pillarItem.getComponent("DaNaoTianGongGoldPillarControl");
        let showTime = 0.15;
        let moveDistance = 33;
        let moveDir = 1;
        if (this.posIndex === 1 || this.posIndex === 2) {
            moveDir = -1;
        }
        pillarCtrl.setInfo(goldValue, baseValue, this.powerIndex, this.isRedPillar, showTime, moveDistance, this.clearTimeOverPillar.bind(this), moveDir);
        pillarItem.parent = this.goldPillarNode;
        pillarItem.active = true;
        pillarCtrl.showPillar();
        this.pillarList.push(pillarItem);
        this.isRedPillar = !this.isRedPillar;
    },

    //清理时间到的金币柱子
    clearTimeOverPillar() {
        let len = this.pillarList.length;
        for (let i = len - 1; i >= 0; --i) {
            let pillarctrl = this.pillarList[i].getComponent("DaNaoTianGongGoldPillarControl");
            if (pillarctrl.clearFlag === true) {
                pillarctrl.clearPillar();
                this.pillarList.splice(i, 1);
                continue;
            }
        }
    },
});