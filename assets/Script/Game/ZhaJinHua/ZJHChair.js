let gameProto = require('./GameProtoZJH');

cc.Class({
    extends: cc.Component,

    properties: {
        avatarImg: cc.Sprite,
        nameLabel: cc.Label,
        goldNum: cc.Label,
        statusBg: cc.Sprite,
        statusLabel: cc.Label,
        firstXiaZhuUI: cc.Sprite, //先
        loseMask: cc.Sprite,
        bipaiShibai: cc.Node,
        winResultPrefab: cc.Prefab,
        cardGroup: cc.Node,
        readyGroup: cc.Node,

        operationStatus: cc.Sprite,

        lookCardFlag: cc.Node,
        giveUpFlag: cc.Node, //弃牌

        statusGroup: cc.Node, //状态

        stakeGoldGroup: cc.Node, //加注框
        stakeGoldNum: cc.Label,

        addGoldEff: cc.Label,
        minusGoldEff: cc.Label,
        progress: cc.Sprite,
        zhuang: cc.Node,

        vipLabel: cc.Label,
        vipback: cc.Node,
    },

    setEventCallback: function (cb) {
        this.callback = cb;
    },

    onLoad: function () {
        this.lookCardFlag.active = false;
        this.giveUpFlag.active = false;

        this.firstXiaZhuFlag = false;
        this.firstChairLookedCardStatus = 0;
    },
    updateUI: function (userInfo, posIndex, profitPercentage, parentNode) {
        this.parentNode = parentNode || this.parentNode;
        this.userInfo = userInfo;
        this.profitPercentage = profitPercentage;
        this.posIndex = 0;

        // 设置信息
        Global.CCHelper.updateSpriteFrame(this.userInfo.avatar, this.avatarImg.node.getComponent(cc.Sprite));

        if (this.userInfo.uid == Global.Player.getPy('uid')) {
            this.nameLabel.string = this.userInfo.nickname;
        } else {
            this.nameLabel.string = Global.Player.convertNickname(this.userInfo.nickname);
        }
        if (this.userInfo.gold <= 0)
            this.goldNum.string = 0;
        else
            this.goldNum.string = Global.Utils.formatNum2(this.userInfo.gold);
        this.stakeGoldNum.string = "0";

        let offsetX = 150;
        if (posIndex === 2 || posIndex === 1) {
            this.statusBg.node.scaleX = -1;
            this.statusBg.node.x = -100;
            this.statusLabel.node.x = -100;
            this.firstXiaZhuUI.node.x = -43;
            this.statusGroup.x = -160;
            this.stakeGoldGroup.x = -offsetX;
            this.stakeGoldGroup.y = -70;
        } else if (posIndex === 5) {
            this.statusGroup.x = 140;
            this.stakeGoldGroup.x = offsetX;
            this.stakeGoldGroup.y = -70;
        } else if (posIndex === 0) {
            this.statusGroup.x = 160;
            this.stakeGoldGroup.x = offsetX + 80;
            this.stakeGoldGroup.y = 70;
        } else if (posIndex === 3 || posIndex === 4) {
            this.statusGroup.x = 140;
            this.stakeGoldGroup.x = offsetX;
            this.stakeGoldGroup.y = -70;
        }

        if (!!this.vipLabel && !!this.vipback) {
            if (!!userInfo.vipLevel) {
                this.vipLabel.string = "v" + userInfo.vipLevel;
                this.vipback.string = "b";
            } else {
                this.vipLabel.active = false;
                this.vipback.active = false;
            }
        }
    },

    clearWidget: function () {
        this.giveUpStatus = false;
        this.loseStatus = false;
        this.lookCardStatus = false;
        this.firstChairLookedCardStatus = 0;
        this.statusLabel.node.active = false;
        this.firstXiaZhuFlag = false;
        this.firstXiaZhuUI.node.active = false;
        this.zhuang.active = false;
        this.statusBg.node.active = false;
        this.loseMask.node.active = false;
        this.bipaiShibai.active = false;
        this.cardGroup.active = false;
        this.operationStatus.node.active = false;

        this.lookCardFlag.active = false;
        this.giveUpFlag.active = false;

        if (!!this.winResultUI) {
            this.winResultUI.destroy();
            this.winResultUI = null;
        }

        this.hideReadyGroup();
        this.stakeGoldNum.string = 0;
    },

    showGoldChangeEff: function (changeGold, profitPercentage) {
        this.profitPercentage = profitPercentage;


        let goldChangeEff = this.minusGoldEff;
        if (goldChangeEff == null)
            return;
        changeGold = Global.Utils.formatNum2(changeGold);
        goldChangeEff.string = changeGold;
        if (changeGold > 0) {
            goldChangeEff = this.addGoldEff;
            goldChangeEff.string = '+' + (changeGold * (100 - parseInt(this.profitPercentage)) / 100).toFixed(2);
        }
        if (changeGold === 0) return;

        goldChangeEff.node.active = true;
        if (changeGold > 0) {
            goldChangeEff.node.y = 70;
            goldChangeEff.node.runAction(cc.moveBy(0.5, 0, 40));
        } else {
            goldChangeEff.node.runAction(cc.moveBy(0.5, 0, 20));
        }
        this.scheduleOnce(function () {
            goldChangeEff.node.active = false;
            goldChangeEff.node.y = 0;
        }.bind(this), 3000);
    },

    showOperationStatus(status_) {
        Global.CCHelper.updateSpriteFrame("Game/ZhaJinHua/NewImg/" + status_, this.operationStatus);

        this.operationStatus.node.active = true;
        this.operationStatus.node.stopAllActions();
        this.operationStatus.node.runAction(cc.sequence([cc.fadeIn(0.1), cc.fadeOut(2)]));
    },

    showCardGroup: function (haveGoldFrame) {
        this.cardGroup.active = true;
        this.loseMask.node.active = false;
        if (!!haveGoldFrame) {
            this.cardGroup.getChildByName('frame').active = true;
        }
        this.hideOther();
    },

    onUserStake: function (stakeCount, totalStakeCount) {
        this.userInfo.gold -= stakeCount;
        this.stakeGoldNum.string = Math.abs(totalStakeCount).toFixed(2);
        if (this.userInfo.gold <= 0)
            this.goldNum.string = 0;
        else
            this.goldNum.string = Global.Utils.formatNum2(this.userInfo.gold);

        if (this.firstChairLookedCardStatus > 0)
            this.firstChairLookedCardStatus += 1;
    },

    getUserGold: function () {
        return this.userInfo.gold;
    },

    updateUserInfo: function (userInfo) {
        this.userInfo = userInfo;

        Global.CCHelper.updateSpriteFrame(this.userInfo.avatar, this.avatarImg.node.getComponent(cc.Sprite));
        if (this.userInfo.uid == Global.Player.getPy('uid')) {
            this.nameLabel.string = this.userInfo.nickname;
        } else {
            this.nameLabel.string = Global.Player.convertNickname(this.userInfo.nickname);
        }
        if (this.userInfo.gold <= 0)
            this.goldNum.string = 0;
        else
            this.goldNum.string = Global.Utils.formatNum2(this.userInfo.gold);
    },

    showReady: function () {
        this.readyGroup.getChildByName('readyLabel').active = true;
    },

    showStatus: function (userStatus) {
        if (userStatus === gameProto.LOOK_CARD && !this.giveUpStatus && !this.loseStatus) {
            this.lookCardStatus = true;
            this.lookCardFlag.active = true;
        } else if (userStatus === gameProto.GIVE_UP) {
            this.giveUpStatus = true;
            this.lookCardFlag.active = false;
            this.giveUpFlag.active = true;
        } else if (userStatus === gameProto.LOSE) {
            this.loseStatus = true;
            // this.showLoseEff(); // 显示比牌特效
            this.bipaiShibai.active = true;
        }
    },

    showTag: function (show) {
        switch (show) {
            case '1':
                this.lookCardFlag.active = true;
                this.giveUpFlag.active = false;
                break;
            case '2':
                this.lookCardFlag.active = false;
                this.giveUpFlag.active = true;
                break;
            case '3':
                this.lookCardFlag.active = false;
                this.giveUpFlag.active = false;
                break;
        }
    },

    showFirstXiaZhu: function () {
        this.firstXiaZhuFlag = true;
        this.firstXiaZhuUI.node.active = true;
    },


    showZhuang: function () {
        this.zhuang.active = false;
    },

    startClock: function (time) {
        this.totalTime = time;
        this.curTime = time;

        this.progress.fillRange = 1;
        this.progress.node.active = true;

        this.schedule(function (dt) {
            this.curTime -= dt;
            if (this.curTime >= 0) {
                this.progress.fillRange = this.curTime / this.totalTime;
            }
        }.bind(this), 1 / 30);
    },

    stopClock: function () {
        this.unscheduleAllCallbacks();
        if (this.progress && this.progress.node)
            this.progress.node.active = false;
    },


    showResult: function (isWin, winnerCardType, cardsCtrlArr, isFirstChair) {
        if (isWin) {
            this.winResultUI = cc.instantiate(this.winResultPrefab);
            this.winResultUI.parent = this.node;
            this.winResultUI.y = 100;

            if (winnerCardType === gameProto.CARD_TYPE_ZASE_235) {
                this.winResultUI.getComponent('ZJHResultUI').showWinType(gameProto.CARD_TYPE_DAN_ZHANG);
            } else {
                this.winResultUI.getComponent('ZJHResultUI').showWinType(winnerCardType);
            }
        } else {
            this.showStatus(gameProto.LOSE);

            if (isFirstChair == false) {
                for (let i = 0; i < cardsCtrlArr.cards.length; i++) {
                    cardsCtrlArr.cards[i].getComponent("ZJHCard").showLoseState();
                }
            }

            this.lookCardFlag.active = false;
        }
    },

    showLoseEff: function (meLose) {
        this.node.getComponent(cc.Animation).play('loseEff');
        this.scheduleOnce(function () {
            this.loseMask.node.active = true;
            this.loseMask.node.opacity = 0;
            let action = cc.sequence(cc.fadeTo(0.3, 200),
                cc.callFunc(function () {
                    if (!meLose)
                        this.bipaiShibai.active = true;
                }.bind(this)));
            this.loseMask.node.runAction(action);
        }, 1);
    },

    hideOther: function () {
        this.statusBg.node.active = false;
        this.statusLabel.node.active = false;
        this.firstXiaZhuUI.node.active = false;
        this.zhuang.active = false;
        this.stopClock()
    },

    showOther: function () {
        // if (this.loseStatus) {
        //     this.statusBg.node.active = true;
        //     this.statusLabel.node.active = true;
        // }

        if (this.firstXiaZhuFlag) {
            this.firstXiaZhuUI.node.active = true;
        }
    },

    canCompare: function () {
        return (this.lookCardStatus && this.userInfo && !this.loseStatus && !this.giveUpStatus);
    },

    isPlayingGame: function () {
        return this.userInfo && !(this.loseStatus || this.giveUpStatus);
    },

    isLookedCard: function () {
        return this.lookCardStatus;
    },

    setFirstChairLookedCardStatus: function () {
        if (this.firstChairLookedCardStatus > 0)
            return;

        this.firstChairLookedCardStatus += 1;
    },

    getFirstChairLookedCardStatus: function () {
        return this.firstChairLookedCardStatus;
    },

    getGiveUpStatus: function () {
        return this.giveUpStatus;
    }
});