let gameProto = require('./DZProto');
let CHANGE_GOLD_SHOW_TIME = 3;
cc.Class({
    extends: cc.Component,

    properties: {
        nicknameLabel: cc.Label,
        goldLabel: cc.Label,
        avatar: cc.Sprite,
        vipLabel: cc.Label,

        timeDown: cc.ProgressBar,

        winGoldLabel: cc.Label,
        loseGoldLabel: cc.Label,

        operationTypeNode: cc.Node,
        operationType_giveupNode: cc.Node,

        handCardWidget: cc.Node,
        showWinCardTypeWidget: cc.Node,

        bankIcon: cc.Node,

        _status: 0,
    },

    /**
     *  userInfo::
        avatar: "UserInfo/head_3"
        gold: 352.99
        nickname: "13188209478"
        robot: true
        sex: 1
        takeGold: 195
        uid: "10077"
        vipLevel: 5
     */

    start() {
        // 判断本地座位号
        let index = this.node.parent.getSiblingIndex();
        // 手牌 x轴 取反
        if (index >= 3) {
            this.handCardWidget.x = -this.handCardWidget.x
            this.operationType_giveupNode.x = -this.operationType_giveupNode.x;
        }
    },

    initWidget: function (userInfo) {
        console.log("=============::", userInfo);
        this.node.active = true;

        this.userInfo = userInfo;
        if (userInfo.uid == Global.Player.getPy('uid')) {
            this.nicknameLabel.string = userInfo.nickname;
        } else {
            this.nicknameLabel.string = Global.Player.convertNickname(userInfo.nickname);
        }
        this.nicknameLabel.node.active = true;
        this.goldLabel.string = Global.Utils.formatNumberToString(userInfo.takeGold, 2);
        Global.CCHelper.updateSpriteFrame(userInfo.avatar, this.avatar);

        this.vipLabel.string = "v" + this.userInfo.vipLevel;
    },

    updateGold: function (gold) {
        if (!this.userInfo) return;
        this.userInfo.takeGold = gold;
        this.goldLabel.string = Global.Utils.formatNumberToString(gold, 2);
    },

    addGold: function (count, isTween, profitPercentage) {
        if (!this.userInfo) return;

        if (!isTween) {
            this.userInfo.takeGold += count;
            this.goldLabel.string = Global.Utils.formatNumberToString(this.userInfo.takeGold, 2);
        } else {
            if (count > 0) {
                count = count * (1 - profitPercentage / 100);
                this.userInfo.takeGold += count;
                this.goldLabel.string = Global.Utils.formatNumberToString(this.userInfo.takeGold, 2);
                let label = Global.Utils.formatNumberToString(count, 2) //+ "元";
                label = "+" + label;
                this.winGoldLabel.string = label;
                this.winGoldLabel.node.active = true;
                this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0))]));
            } else {
                this.userInfo.takeGold += count;
                this.goldLabel.string = Global.Utils.formatNumberToString(this.userInfo.takeGold, 2);

                let label = Global.Utils.formatNumberToString(count, 2) //+ "元";
                this.loseGoldLabel.string = label;
                this.loseGoldLabel.node.active = true;
                this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 0))]));
            }
        }
    },

    getGold: function () {
        return !this.userInfo ? 0 : this.userInfo.takeGold;
    },


    getStatus: function () {
        return this._status
    },
    setStatus: function (userStatus) {
        this._status = userStatus;
        if (CC_DEBUG && (userStatus != 0 && userStatus != 1 && userStatus != 2)) {
            debugger;

        }
        if (userStatus === gameProto.userStatus.NONE) {
            this.node.active = false;
        } else if (userStatus === gameProto.userStatus.PLAYING) {
            this.node.active = true;
            this.node.opacity = 255;
        } else if (userStatus === gameProto.userStatus.GIVE_UP) {
            this.node.active = true;
            this.node.opacity = 200;
        }
    },

    setOperation: function (operationType) {
        // if (this.operationType === gameProto.operationType.ALL_IN || this.operationType === gameProto.operationType.GIVE_UP) return;
        this.operationType = operationType;
        let name = "";
        if (operationType === gameProto.operationType.ADD_BET) name = "add";
        else if (operationType === gameProto.operationType.PASS) name = "pass";
        else if (operationType === gameProto.operationType.FLOW) name = "flow";
        else if (operationType === gameProto.operationType.ALL_IN) name = "allin";
        else if (operationType === gameProto.operationType.GIVE_UP) name = "giveup";
        for (let i = 0; i < this.operationTypeNode.children.length; ++i) {
            let node = this.operationTypeNode.children[i];
            node.active = (node.name === name);
        }
        // 显隐昵称
        if (name == "" || operationType == gameProto.operationType.NONE) {
            this.nicknameLabel.node.active = true;
        } else {
            this.nicknameLabel.node.active = false;
        }
    },

    startClock: function (time, cb) {
        this.totalTime = time;
        this.curTime = time;
        this.unscheduleAllCallbacks();

        this.timeDown.progress = 1;
        this.timeDown.node.active = true;

        this.schedule(function (dt) {
            this.curTime -= dt;
            if (this.curTime >= 0) this.timeDown.progress = this.curTime / this.totalTime;
            else {
                this.unscheduleAllCallbacks();
                this.timeDown.node.active = false;
                Global.Utils.invokeCallback(cb, 0);
            }
        }.bind(this), 1 / 30);
    },

    stopClock: function () {
        this.unscheduleAllCallbacks();
        this.timeDown.node.active = false;
    },

    getCenterPos: function () {
        return this.node.parent.convertToWorldSpaceAR(this.node.position);
    },

    showBankIcon(isShow = true) {
        this.bankIcon.active = isShow;
    },

    resetWidget: function () {
        this.userInfo = null;
        this.clearWidget();
    },

    clearWidget: function () {
        this.stopClock();

        this.winGoldLabel.node.stopAllActions();
        this.winGoldLabel.node.y = -100;
        this.winGoldLabel.node.active = false;

        this.loseGoldLabel.node.stopAllActions();
        this.loseGoldLabel.node.y = -100;
        this.loseGoldLabel.node.active = false;

        this.node.opacity = 255;

        this.operationType = gameProto.operationType.NONE;
        this.setOperation(gameProto.operationType.NONE);
        this._status = 0;

        this.showWinCardTypeWidget.active = false;
        // 隐藏庄家标志
        this.showBankIcon(false);
    }
});