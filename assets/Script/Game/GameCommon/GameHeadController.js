// Learn cc.Class:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/class/index.html
// Learn Attribute:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/reference/attributes/index.html
// Learn life-cycle callbacks:
//  - [Chinese] http://www.cocos.com/docs/creator/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/editors_and_tools/creator-chapters/scripting/life-cycle-callbacks/index.html

let CHANGE_GOLD_SHOW_TIME = 2;

cc.Class({
    extends: cc.Component,

    properties: {
        goldLabel: cc.Label,
        nicknameLabel: cc.Label,
        headSprite: cc.Sprite,
        betActionDir: 0,
        winGoldLabel: cc.Label,
        loseGoldLabel: cc.Label,
        progressBar_headFrame: cc.ProgressBar,

        vipLabel: cc.Label,
        vipback: cc.Node,
    },


    start() {
        if (!this.userInfo) {
            this.userInfo = {
                uid: this.uid,
                gold: -1,
                nickname: "",
                avatar: ""
            };
        }
    },

    onLoad() {
        this.isStartClock = false;
        this.sumTime = 0;
        this.passTime = 0;
    },

    update(dt) {
        if (this.isStartClock == true) {
            this.updateProgressBar(dt);
        }
    },

    updateInfo(userInfo) {
        if (!userInfo) {
            this.userInfo = {
                uid: 0,
                gold: -1,
                nickname: "",
                avatar: ""
            };
            this.node.parent.active = false;
        } else {
            this.node.parent.active = true;
            if (!!this.bankReduceGold) {
                if (this.bankReduceGold != -1) {
                    userInfo.gold -= this.bankReduceGold;
                }
            }
            this.userInfo = Global.Utils.clone(userInfo);
            if (!!this.goldLabel) {
                this.goldLabel.string = userInfo.gold.toFixed(2);
            }

            if (userInfo.uid == Global.Player.getPy('uid')) {
                this.nicknameLabel.string = userInfo.nickname;
            } else {
                this.nicknameLabel.string = Global.Player.convertNickname(userInfo.nickname);
            }
            Global.CCHelper.updateSpriteFrame(userInfo.avatar, this.headSprite);
            if (!!this.vipLabel && !!this.vipback) {
                if (!!userInfo.vipLevel) {
                    this.vipLabel.string = "v" + userInfo.vipLevel;
                    this.vipback.string = "b";
                } else {
                    this.vipLabel.active = false;
                    this.vipback.active = false;
                }
            }
        }
    },

    goldChange(changeCount, showAnim) {
        if (!!changeCount) {
            if (changeCount === 0) return;
            this.userInfo.gold += changeCount;
            if (!!this.goldLabel) {
                this.goldLabel.string = this.userInfo.gold.toFixed(2);
            }
            if (!showAnim) return;
            let label = parseFloat(changeCount.toFixed(2));
            let startY = 0;
            if (!!this.moveOffsetY) {
                startY -= this.moveOffsetY;
            }
            let endY = 50;
            if (!!this.moveOffsetY) {
                endY -= this.moveOffsetY;
            }
            if (changeCount > 0) {
                label = "+" + label;
                this.winGoldLabel.string = label;
                this.winGoldLabel.node.y = startY;
                this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.winGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
            } else {
                this.loseGoldLabel.string = label;
                this.loseGoldLabel.node.y = startY;
                this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.loseGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
            }
        }
    },

    showChangeGold(changeCount) {
        let label = parseFloat(changeCount.toFixed(2)) + "元";
        let startY = 0;
        if (!!this.moveOffsetY) {
            startY -= this.moveOffsetY;
        }
        let endY = 50;
        if (!!this.moveOffsetY) {
            endY -= this.moveOffsetY;
        }
        if (changeCount > 0) {
            label = "+" + label;
            this.winGoldLabel.string = label;
            this.winGoldLabel.node.y = startY;
            this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.winGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
        } else {
            this.loseGoldLabel.string = label;
            this.loseGoldLabel.node.y = startY;
            this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.loseGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
        }
    },

    goldChangeIncludeZero(changeCount, showAnim, isHide) {
        if (changeCount != null && this.userInfo != null) {
            this.userInfo.gold += changeCount;
            if (!!this.goldLabel) {
                this.goldLabel.string = this.userInfo.gold.toFixed(2);
            }
            if (!showAnim) return;
            let label = parseFloat(changeCount.toFixed(2));
            let startY = -50;
            if (!!this.moveOffsetY) {
                startY -= this.moveOffsetY;
            }
            let endY = 20;
            if (!!this.moveOffsetY) {
                endY -= this.moveOffsetY;
            }
            if (changeCount >= 0) {
                label = "+" + label;
                this.winGoldLabel.string = label;
                this.winGoldLabel.node.y = startY;
                if (isHide == true)
                    this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.winGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
                else
                    this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.winGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME)]));
            } else {
                this.loseGoldLabel.string = label;
                this.loseGoldLabel.node.y = startY;
                if (isHide == true)
                    this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.loseGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
                else
                    this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(this.loseGoldLabel.node.x, endY)), cc.delayTime(CHANGE_GOLD_SHOW_TIME)]));
            }
        }
    },

    execBet(isTween) {
        if (this.betActionDir === 0 || !isTween) return;
        this.node.runAction(cc.sequence([cc.moveBy(0.1, cc.v2(this.betActionDir * 20, 0)), cc.moveBy(0.1, cc.v2(this.betActionDir * -20, 0))]))
    },

    getUserInfo() {
        return this.userInfo;
    },

    getUid() {
        return !!this.userInfo ? this.userInfo.uid : "";
    },

    getHeadPos: function () {
        return this.node.parent.position;
    },

    getHeadPosToWorldSpaceAR: function () {
        return this.node.parent.parent.convertToWorldSpaceAR(this.node.parent.position);
    },

    updateUserGold(gold) {
        if (!!this.userInfo) {
            this.userInfo.gold = gold;
        }
    },

    //设置减少的金额
    reduceGold(value) {
        if (!!this.userInfo) {
            if (this.userInfo.gold != -1) {
                this.userInfo.gold -= value;
                this.goldLabel.string = this.userInfo.gold.toFixed(2);
            } else {
                this.bankReduceGold = value;
            }
        }
    },

    //重置减少金额
    resetReduceGold() {
        this.bankReduceGold = -1;
    },

    startClock(sumTime_) {
        this.isStartClock = true;
        this.sumTime = sumTime_;
        this.passTime = 0;

        this.progressBar_headFrame.node.active = true;
    },

    stopClock() {
        this.progressBar_headFrame.progress = 1;
        this.progressBar_headFrame.node.active = false;
    },

    updateProgressBar(dt) {
        this.passTime += dt;
        this.progressBar_headFrame.progress = this.passTime / this.sumTime;

        if (this.passTime >= this.sumTime) {
            this.isStartClock = false;
        }
    },

    setMoveOffsetY(value) {
        this.moveOffsetY = value;
    }
});