let roomProto = require('../../API/RoomProto');
let gameProto = require('./BRNNProto');
let roomAPI = require('../../API/RoomAPI');
let model = require('./BRNNModel');

cc.Class({
    extends: cc.Component,

    properties: {
        gameCommonCtrl: require("GameCommonController"),
        cardWidgetPrefab: cc.Prefab,
        cardWidgetPosNode: [cc.Node],
        betRectNodeArr: [cc.Node],
        betCountLabelArr: [cc.Label],
        selfBetCountLabelArr: [cc.Label],
        winTypeShowNodeArr: [cc.Node],
        recordWidgetCtrl: require("BRNNRecordWidgetCtrl"),
        drawIDLabel: cc.Label,

        bankerPosNode: cc.Node,

        otherUserWinLabel: cc.Label,
        otherUserLoseLabel: cc.Label,
        gameDropDownList: cc.Node,

        clickEffectArr: [cc.Node],

        tickNode: cc.Node,
        startSpr: cc.Node,
        resultSpr: cc.Node,
        serverStartSpr: cc.Node,
        tickLabel: cc.Label,

        rateLabel0: cc.Label,
        rateLabel1: cc.Label,
        rateLabel2: cc.Label,

        animationNode: cc.Node,

        recordNode: cc.Node,
    },

    start() {
        this.enableBet = false;

        this.gameInited = false;

        this.roomID = "";
        this.profitPercentage = 0;

        this.cardWidgetCtrlArr = [];
        for (let i = 0; i < 5; ++i) {
            let node = cc.instantiate(this.cardWidgetPrefab);
            node.setScale(0.9);
            let ctrl = node.getComponent("BRNNCardWidgetCtrl");
            node.parent = this.cardWidgetPosNode[i];
            this.cardWidgetCtrlArr.push(ctrl);
            node.active = false;
        }

        this.betCountList = {};
        this.lastDrawBetCountList = null;
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        AudioMgr.startPlayBgMusic("BaiRenNiuNiu/sound/bg");

        let len = this.winTypeShowNodeArr.length;
        for (let i = 0; i < len; ++i) {
            this.winTypeShowNodeArr[i].active = false;
        }
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());

        this.tickNode.active = false;
        this.clickEffectArr[0].active = false;
        this.clickEffectArr[1].active = false;
        this.clickEffectArr[2].active = false;
        this.clickEffectArr[3].active = false;

        this.dragonBonesAnimation = this.animationNode.getComponent(dragonBones.ArmatureDisplay);
        this.animationNode.active = false;
        this.recordNode.active = false;
    },

    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        model.onDestroy();
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.userInfo.uid === Global.Player.getPy("uid")) {
                    ViewMgr.goBackHall(Config.GameType.BRNN);
                }
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo])
                // ?????????????????????
                this.gameInit(msg.data.gameData);

                let gameStatus = msg.data.gameData.gameStatus;
                let statusTime = msg.data.gameData.statusTime;
                if (!statusTime) {
                    statusTime = msg.data.gameData.Statustime;
                }
                this.showTickTime(gameStatus, statusTime);
            }
        } else if (router === "GameMessagePush") {
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_POURGOLD_PUSH) {
                // cc.log("??????????????????");
                this.userBet(msg.data, true, true);
                this.updateBetCount(this.betCountList, this.selfBetCountList);
            } else if (msg.type === gameProto.GAME_START_PUSH) {
                let tickTime = msg.data.statusTime;
                if (!tickTime) {
                    tickTime = msg.data.Statustime;
                }
                let state = 1;
                this.showTickTime(state, tickTime);
                this.onGameStart(tickTime, true);

            } else if (msg.type === gameProto.GAME_RESULT_PUSH) {
                let tickTime = msg.data.statusTime;
                if (!tickTime) {
                    tickTime = msg.data.Statustime;
                }
                let state = 2;
                this.showTickTime(state, tickTime);
                this.onGameEnd(msg.data);
            } else if (msg.type === proto.REDLIMIT_ERROR) {
                Tip.makeText("???????????????????????????????????????!");
            }
        } else if (router === "ReConnectSuccess") {
            cc.log("????????????");
            if (Global.Player.isInRoom()) {
                cc.log("??????id:" + model.roomID);
                Global.API.hall.joinRoomRequest(model.roomID, () => {
                    // this.onReconnection();
                }, undefined, Config.GameType.BRNN);
            } else {
                ViewMgr.goBackHall(Config.GameType.BRNN);
                cc.log("??????????????????");
            }
        }
    },

    //????????????
    animationPlayComplete() {
        let animationArr = [];
        animationArr.push(cc.fadeOut(1));
        animationArr.push(cc.callFunc(function () {
            this.animationNode.active = false;
            this.animationNode.opacity = 255;
        }.bind(this)));
        // animationArr.push(cc.fadeOut(0.1));
        this.animationNode.runAction(cc.sequence(animationArr));
        this.dragonBonesAnimation.removeEventListener(dragonBones.EventObject.COMPLETE, this.animationPlayComplete, this);
    },

    //????????????????????????
    playZJTCAnimation() {
        this.animationNode.active = true;
        this.dragonBonesAnimation.addEventListener(dragonBones.EventObject.COMPLETE, this.animationPlayComplete, this);
        this.dragonBonesAnimation.playAnimation("tongchi", 1);
    },

    //????????????????????????
    playZJTPAnimation() {
        this.animationNode.active = true;
        this.dragonBonesAnimation.addEventListener(dragonBones.EventObject.COMPLETE, this.animationPlayComplete, this);
        this.dragonBonesAnimation.playAnimation("tongpei", 1);
    },

    betEvent(event, param) {
        if (param == "record") {
            Global.CCHelper.playPreSound();
            this.recordNode.active = true;
            return;
        }
        if (!this.enableBet) {
            // Confirm.show("??????????????????????????????");
            Tip.makeText("??????????????????????????????");
            return;
        }
        if (param === "continueBet") {
            Global.CCHelper.playPreSound();
            if (!this.lastDrawBetCountList) {
                Confirm.show("???????????????????????????????????????");
                return;
            }
            let totalBetCount = 0;
            let betArr = [];
            for (let key in this.lastDrawBetCountList) {
                if (this.lastDrawBetCountList.hasOwnProperty(key)) {
                    if (!this.lastDrawBetCountList[key]) continue;
                    betArr.push({
                        betType: parseInt(key),
                        betCount: this.lastDrawBetCountList[key]
                    });
                    totalBetCount += this.betCountList[key];
                }
            }
            let selfCtrl = this.gameCommonCtrl.getGameHeadCtrlByUid(Global.Player.getPy("uid"))[0];
            if (selfCtrl.getUserInfo.gold < totalBetCount * 3) {
                // Confirm.show("???????????????????????????????????????1/3");
                Tip.makeText("???????????????????????????????????????1/3");
                return;
            }
            for (let i = 0; i < betArr.length; i++) {
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(betArr[i].betType, betArr[i].betCount));
            }
        } else {
            let totalBetCount = this.selfBetCountList[gameProto.TIAN] + this.selfBetCountList[gameProto.DI] + this.selfBetCountList[gameProto.XUAN] + this.selfBetCountList[gameProto.HUANG];
            let betCount = this.gameCommonCtrl.getCurChipNumber();
            if (totalBetCount + betCount > Global.Player.gold / 3) {
                // Confirm.show("???????????????????????????????????????1/3");
                Tip.makeText("???????????????????????????????????????1/3");
                return;
            }
            let betValue = this.gameCommonCtrl.getCurChipNumber();
            if (param === "tian") {
                Global.CCHelper.playPreSound();
                this.showClickEffect(this.clickEffectArr[0]);
                let betTip = this.checkXianhong(gameProto.TIAN, betValue);
                if (!!betTip) {
                    Tip.makeText("??????????????????????????????" + betTip);
                    return;
                }
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(
                    gameProto.TIAN,
                    betValue
                ));
            } else if (param === "di") {
                Global.CCHelper.playPreSound();
                this.showClickEffect(this.clickEffectArr[1]);
                let betTip = this.checkXianhong(gameProto.DI, betValue);
                if (!!betTip) {
                    Tip.makeText("??????????????????????????????" + betTip);
                    return;
                }
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(
                    gameProto.DI,
                    this.gameCommonCtrl.getCurChipNumber()
                ));
            } else if (param === "xuan") {
                Global.CCHelper.playPreSound();
                this.showClickEffect(this.clickEffectArr[2]);
                let betTip = this.checkXianhong(gameProto.XUAN, betValue);
                if (!!betTip) {
                    Tip.makeText("??????????????????????????????" + betTip);
                    return;
                }
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(
                    gameProto.XUAN,
                    this.gameCommonCtrl.getCurChipNumber()
                ));
            } else if (param === "huang") {
                Global.CCHelper.playPreSound();
                this.showClickEffect(this.clickEffectArr[3]);
                let betTip = this.checkXianhong(gameProto.HUANG, betValue);
                if (!!betTip) {
                    Tip.makeText("??????????????????????????????" + betTip);
                    return;
                }
                roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(
                    gameProto.HUANG,
                    this.gameCommonCtrl.getCurChipNumber()
                ));
            }
        }
    },

    //????????????
    checkXianhong(betType, betValue) {
        if (!!this.selfBetCountList) {
            if (!!this.selfBetCountList[betType]) {
                betValue += this.selfBetCountList[betType];
            }
        }
        if (!!this.redLimitInfo[betType]) {
            let redLimit = this.redLimitInfo[betType].redLimit;
            if (!!redLimit) {
                if (betValue > redLimit.max) {
                    return redLimit.min + "-" + redLimit.max;
                }
            }
        }
        return null;
    },

    showClickEffect(area) {
        area.active = true;
        this.scheduleOnce(function () {
            area.active = false;
        }, 0.1)
    },

    gameInit(gameData) {
        this.gameInited = true;
        this.profitPercentage = gameData.profitPercentage;
        this.gameCommonCtrl.onGameInit(parseInt(gameData.profitPercentage), Global.Enum.gameType.BRNN);
        this.gameCommonCtrl.setHideOtherPlayer(false);
        this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(Global.Enum.gameType.BRNN, this.profitPercentage);
        this.updateParameters(gameData.parameters);
        this.gameCommonCtrl.updateJetton(gameData);

        // ????????????
        this.recordWidgetCtrl.addDirRecord(gameData.dirRecord);
        this.drawIDLabel.node.active = false;
        // this.drawIDLabel.string = "????????????:" + gameData.drawID;
        if (gameData.gameStatus === gameProto.gameStatus.NONE) {
            return;
        }
        if (gameData.gameStatus === gameProto.gameStatus.GAME_END) {
            //???????????????????????????????????????????????????????????????????????????????????????????????????
            this.gameCommonCtrl.setCacheFlag(true);
            this.updateBetRecardList(gameData.betRecordList);
            if (!!gameData.scoreChangeArr) {
                this.gameCommonCtrl.onGameResult(gameData.scoreChangeArr);
            }
            // ??????????????????????????????
            this.gameCommonCtrl.showWait(true);
            return;
        }

        if (gameData.gameStatus === gameProto.gameStatus.GAME_STARTED) {
            let statusTime = gameData.statusTime;
            if (!statusTime) {
                statusTime = gameData.Statustime;
            }
            this.onGameStart(statusTime, false);
            this.updateBetRecardList(gameData.betRecordList);
        }

    },

    updateBetRecardList(betRecordList) {
        // ????????????
        if (!!betRecordList) {
            for (let key in betRecordList) {
                if (betRecordList.hasOwnProperty(key)) {
                    let userBetInfo = betRecordList[key];

                    if (gameProto.TIAN in userBetInfo) {
                        let betInfo = {};
                        betInfo.uid = key;
                        let tempInfo = {};
                        tempInfo.betType = gameProto.TIAN;
                        tempInfo.betCount = userBetInfo[gameProto.TIAN];
                        betInfo.data = tempInfo;
                        this.userBet(betInfo, false, true);
                    }
                    if (gameProto.DI in userBetInfo) {
                        let betInfo = {};
                        betInfo.uid = key;
                        let tempInfo = {};
                        tempInfo.betType = gameProto.DI;
                        tempInfo.betCount = userBetInfo[gameProto.DI];
                        betInfo.data = tempInfo;
                        this.userBet(betInfo, false, true);
                    }
                    if (gameProto.XUAN in userBetInfo) {
                        let betInfo = {};
                        betInfo.uid = key;
                        let tempInfo = {};
                        tempInfo.betType = gameProto.XUAN;
                        tempInfo.betCount = userBetInfo[gameProto.XUAN];
                        betInfo.data = tempInfo;
                        this.userBet(betInfo, false, true);
                    }
                    if (gameProto.HUANG in userBetInfo) {
                        let betInfo = {};
                        betInfo.uid = key;
                        let tempInfo = {};
                        tempInfo.betType = gameProto.HUANG;
                        tempInfo.betCount = userBetInfo[gameProto.HUANG];
                        betInfo.data = tempInfo;
                        this.userBet(betInfo, false, true);
                    }
                }
            }
        }
        this.updateBetCount(this.betCountList, this.selfBetCountList);
    },

    //????????????
    updateParameters: function (parameters) {
        if (!!parameters) {
            if (!!parameters.config) {
                this.redLimitInfo = parameters.config.gameConfig;
            }
        }
    },

    resetGame: function () {
        // ????????????
        this.enableBet = false;
        this.gameInited = false;
        // ????????????
        this.node.stopAllActions();
        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        // ???????????????
        for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i) {
            this.cardWidgetCtrlArr[i].resetWidget();
        }
        // ????????????
        this.recordWidgetCtrl.resetWidget();
    },

    onReconnection() {
        this.resetGame();
        // ????????????????????????
        this.gameCommonCtrl.onReconnection();
        // ??????????????????
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onGameStart(statustime, requireUserInfo) {
        // this.drawIDLabel.string = "????????????:" + drawID;
        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        this.node.stopAllActions();
        if (statustime <= 2) {
            for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i) {
                this.cardWidgetCtrlArr[i].sendCard(i, false);
            }
            return;
        }
        if (requireUserInfo) {
            // ??????????????????
            this.gameCommonCtrl.onGameStart();
        }

        // ????????????
        this.node.runAction(cc.sequence([cc.callFunc(
            function () {
                this.onBetStart(statustime === gameProto.BET_TIME);
            }.bind(this)
        ), cc.delayTime(statustime), cc.callFunc(this.onBetStop.bind(this))]));
    },

    onBetStart(isTween) {
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();

        for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i) {
            this.cardWidgetCtrlArr[i].sendCard(i, isTween);
        }
    },

    onBetStop() {
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();

        this.lastDrawBetCountList = this.selfBetCountList;
    },

    onGameEnd(data) {
        if (!!data.profitPercentage) {
            cc.log("????????????????????????" + data.profitPercentage);
            this.profitPercentage = data.profitPercentage;
            this.gameCommonCtrl.profitPercentage = parseInt(data.profitPercentage);
            this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(model.kindId, model.profitPercentage);
        }

        if (this.enableBet) {
            this.onBetStop();
        }

        this.node.stopAllActions();

        let flag = 0;
        let len = data.winTimesArr.length;
        for (let i = 0; i < len; ++i) {
            if (data.winTimesArr[i] > 0) {
                flag++;
            } else {
                flag--;
            }
        }
        let delayAnimationTime = 5;
        if (flag == len) {
            this.scheduleOnce(this.playZJTPAnimation, delayAnimationTime);
        }
        if (0 - flag == len) {
            this.scheduleOnce(this.playZJTCAnimation, delayAnimationTime);
        }

        let actions = [cc.delayTime(this.enableBet ? 2 : 0.1), cc.callFunc(
                function () {
                    this.onShowCard(data.allCardDataArr, data.cardTypeArr);
                }.bind(this)),
            cc.delayTime(gameProto.SHOW_CARD_TIME),
            cc.callFunc(function () {
                this.onShowWin(data.winTimesArr);
            }.bind(this)),
            cc.delayTime(2),
            cc.callFunc(function () {
                this.onShowResult(data.scoreChangeArr, data.winTimesArr);
            }.bind(this)),
            cc.delayTime(gameProto.PAI_JIANG_TIME - 2),
            cc.callFunc(this.onClear.bind(this))
        ];
        this.node.runAction(cc.sequence(actions));
        if (data.baseScoreArr)
            this.gameCommonCtrl.updateSelectButtonNum(data.baseScoreArr);

    },

    onShowCard(allCardDataArr, cardTypeArr) {
        for (let i = 0; i < allCardDataArr.length; ++i) {
            this.cardWidgetCtrlArr[i].showCard(allCardDataArr[i], cardTypeArr[i], i);
        }
    },

    onShowWin(winTimesArr) {
        for (let i = 0; i < winTimesArr.length; ++i) {
            if (winTimesArr[i] > 0) {
                let node = this.winTypeShowNodeArr[i];
                node.active = true;
                let action = cc.sequence([cc.show(), cc.fadeTo(0.3, 255), cc.fadeTo(0.3, 0)]);
                node.opacity = 0;
                node.runAction(cc.repeat(action, 3));
            }
        }
    },

    onShowResult(scoreChangeArr, winTimesArr) {
        let actions = [];
        let isBankerGain = false;
        for (let i = 0; i < winTimesArr.length; ++i) {
            if (winTimesArr[i] < 0) {
                isBankerGain = true;
                break;
            }
        }
        if (isBankerGain) {
            actions.push(cc.callFunc(function () {
                for (let i = 0; i < winTimesArr.length; ++i) {
                    if (winTimesArr[i] < 0) {
                        let betRect = this.betRectNodeArr[i].getBoundingBox();
                        let jettonRect = cc.rect(betRect.x + 20, betRect.y + 60, 150, 100);
                        this.gameCommonCtrl.execBankerGainGold(this.bankerPosNode.position, jettonRect);
                    }
                }
            }.bind(this)));
            actions.push(cc.delayTime(0.6));
        }
        let isBankerSend = false;
        for (let i = 0; i < winTimesArr.length; ++i) {
            if (winTimesArr[i] > 0) {
                isBankerSend = true;
                break;
            }
        }
        if (isBankerSend) {
            actions.push(cc.callFunc(function () {
                for (let i = 0; i < winTimesArr.length; ++i) {
                    if (winTimesArr[i] > 0) {
                        let betRect = this.betRectNodeArr[i].getBoundingBox();
                        let jettonRect = cc.rect(betRect.x + 20, betRect.y + 60, 150, 100);
                        this.gameCommonCtrl.execBankerSendGold(this.bankerPosNode.position, jettonRect, this.betCountList[i] * winTimesArr[i]);
                    }
                }
            }.bind(this)));
            actions.push(cc.delayTime(0.6));
        }
        let otherUserWinCount = 0;
        for (let i = 0; i < winTimesArr.length; ++i) {
            if (winTimesArr[i] > 0) {
                otherUserWinCount += (winTimesArr[i] * (this.betCountList[i] - this.selfBetCountList[i]) * (1 - this.profitPercentage / 100));
            } else {
                otherUserWinCount += (winTimesArr[i] * (this.betCountList[i] - this.selfBetCountList[i]));
            }
        }
        if (actions.length > 0) {
            actions.push(cc.callFunc(function () {
                this.gameCommonCtrl.onGameResult(scoreChangeArr);
                // // ???????????????????????????
                // if (otherUserWinCount > 0) {
                //     this.otherUserWinLabel.node.active = true;
                //     this.otherUserWinLabel.string = "+" + Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
                //     this.otherUserWinLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(this.otherUserWinLabel.node.x, this.otherUserWinLabel.node.y + 30)), cc.delayTime(2), cc.hide()]));
                // } else if (otherUserWinCount < 0) {
                //     this.otherUserLoseLabel.node.active = true;
                //     this.otherUserLoseLabel.string = Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
                //     this.otherUserLoseLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(this.otherUserLoseLabel.node.x, this.otherUserWinLabel.node.y + 30)), cc.delayTime(2), cc.hide()]));
                // }
            }.bind(this)));
            this.node.runAction(cc.sequence(actions));
        } else {
            this.gameCommonCtrl.onGameResult(scoreChangeArr);
            // // ??????????????????????????????
            // if (otherUserWinCount > 0) {
            //     this.otherUserWinLabel.node.active = true;
            //     this.otherUserWinLabel.string = "+" + Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
            //     this.otherUserWinLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(this.otherUserWinLabel.node.x, this.otherUserWinLabel.node.y + 30)), cc.delayTime(2), cc.hide()]));
            // } else if (otherUserWinCount < 0) {
            //     this.otherUserLoseLabel.node.active = true;
            //     this.otherUserLoseLabel.string = Global.Utils.formatNumberToString(otherUserWinCount, 2) + "???";
            //     this.otherUserLoseLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(this.otherUserLoseLabel.node.x, this.otherUserWinLabel.node.y + 30)), cc.delayTime(2), cc.hide()]));
            // }
        }
        this.recordWidgetCtrl.addDirRecord([winTimesArr]);
    },

    onClear: function () {
        // ??????????????????
        for (let i = 0; i < this.cardWidgetCtrlArr.length; ++i) {
            this.cardWidgetCtrlArr[i].resetWidget();
        }

        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.TIAN] = 0;
        this.betCountList[gameProto.DI] = 0;
        this.betCountList[gameProto.XUAN] = 0;
        this.betCountList[gameProto.HUANG] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.TIAN] = 0;
        this.selfBetCountList[gameProto.DI] = 0;
        this.selfBetCountList[gameProto.XUAN] = 0;
        this.selfBetCountList[gameProto.HUANG] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);

        this.node.stopAllActions();
    },

    userBet(data, isTween, showJetton) {
        let info = data.data;
        this.betCountList[info.betType] += info.betCount;
        if (data.uid === Global.Player.getPy("uid")) {
            this.selfBetCountList[info.betType] += info.betCount;
        }
        let betRect = this.betRectNodeArr[info.betType].getBoundingBox();
        let jettonRect = cc.rect(betRect.x + 20, betRect.y + 60, 150, 100);
        this.gameCommonCtrl.userBet(data.uid, info.betCount, jettonRect, isTween, showJetton);

    },

    updateBetCount(betCountList, selfBetCountList) {
        for (let key in betCountList) {
            if (betCountList.hasOwnProperty(key)) {
                this.betCountLabelArr[key].string = betCountList[key];
            }
        }
        for (let key in selfBetCountList) {
            if (selfBetCountList.hasOwnProperty(key)) {
                // this.selfBetCountLabelArr[key].node.active = selfBetCountList[key] !== 0;
                this.selfBetCountLabelArr[key].string = '???' + selfBetCountList[key];
            }
        }
    },
    //???????????????
    showTickTime(state, tickTime) {
        if (state == 0) { //?????????????????? 20????????????
            this.gameCommonCtrl.showWait(true);
        }
        tickTime = tickTime || 20;
        tickTime = parseInt(tickTime);
        if (tickTime <= 0) {
            return;
        }
        this.tickNode.active = true;

        if (state == 0) {
            this.startSpr.active = false;
            this.resultSpr.active = false;
            this.serverStartSpr.active = true;
        } else if (state == 1) {
            this.startSpr.active = true;
            this.resultSpr.active = false;
            this.serverStartSpr.active = false;
        } else if (state == 2) {
            this.startSpr.active = false;
            this.resultSpr.active = true;
            this.serverStartSpr.active = false;
        }
        this.tickLabel.string = tickTime;
        this.unscheduleAllCallbacks();
        let self = this;
        let callFunc = function () {
            --tickTime;
            if (tickTime <= 0) {
                self.tickNode.active = false;
                self.unschedule(callFunc);
                return;
            }
            self.tickLabel.string = tickTime;
        };
        this.schedule(callFunc, 1);
    }
});