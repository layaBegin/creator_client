let roomProto = require('../../API/RoomProto');
let gameProto = require('./API/LHDProto');
let roomAPI = require('../../API/RoomAPI');
let model = require('./LHDModel');


cc.Class({
    extends: cc.Component,

    properties: {
        gameCommonCtrl: require("GameCommonController"),
        longCardSprite: cc.Sprite,
        huCardSprite: cc.Sprite,
        longBetRectNode: cc.Node,
        huBetRectNode: cc.Node,
        heBetRectNode: cc.Node,
        longBetCountLabel: cc.Label,
        huBetCountLabel: cc.Label,
        heBetCountLabel: cc.Label,
        selfLongBetCountLabel: cc.Label,
        selfHuBetCountLabel: cc.Label,
        selfHeBetCountLabel: cc.Label,
        winTypeShowNode: cc.Node,
        betRecordBar: cc.Node,
        gameDropDownList: cc.Node,
        recordItemSelected: cc.Node,

        clickDragron: cc.Node,
        clickTiger: cc.Node,
        clickTie: cc.Node,

        winGoldLabel: cc.Label,
        loseGoldLabel: cc.Label,

        tickNode: cc.Node,
        startSprite: cc.Node,
        resoultSprite: cc.Node,
        serverStartSprite: cc.Node,
        tickLabel: cc.Label,

        rateLongLabel: cc.Label,
        rateHuLabel: cc.Label,
        rateHeLabel: cc.Label
    },

    start() {
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        this.dirRecordArr = [];
        this.dirRecordNodeArr = [];
        this.betCountList = {};
        this.betCountList[gameProto.LONG] = 0;
        this.betCountList[gameProto.HU] = 0;
        this.betCountList[gameProto.HE] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.LONG] = 0;
        this.selfBetCountList[gameProto.HU] = 0;
        this.selfBetCountList[gameProto.HE] = 0;

        this.longCardPos = this.longCardSprite.node.position;
        this.huCardPos = this.huCardSprite.node.position;

        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        Global.MessageCallback.addListener('ServerMessagePush', this);

        AudioMgr.startPlayBgMusic("LongHuDou/Sound/bg");

        this.clickDragron.opacity = 0
        this.clickTiger.opacity = 0
        this.clickTie.opacity = 0

        this.recordItemSelected.active = false;
        this.tickNode.active = false;
    },

    onLoad() {
        this.clickDragron.on('touchstart', this.onClickDragronShow, this);
        this.clickDragron.on('touchcancel', this.onClickDragronHide, this);
        this.clickDragron.on('touchend', this.onClickDragronHide, this);
        this.clickTiger.on('touchstart', this.onClickTigerShow, this);
        this.clickTiger.on('touchcancel', this.onClickTigerHide, this);
        this.clickTiger.on('touchend', this.onClickTigerHide, this);
        this.clickTie.parent.on('touchstart', this.onClickTieShow, this);
        this.clickTie.parent.on('touchcancel', this.onClickTieHide, this);
        this.clickTie.parent.on('touchend', this.onClickTieHide, this);
    },

    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        Global.MessageCallback.removeListener('ServerMessagePush', this);

        model.onDestroy();
        // ????????? off
        // this.clickDragron.off('touchstart', this.onClickDragronShow, this);
        // this.clickDragron.off('touchcancel', this.onClickDragronHide, this);
        // this.clickDragron.off('touchend', this.onClickDragronHide, this);
        // this.clickTiger.off('touchstart', this.onClickTigerShow, this);
        // this.clickTiger.off('touchcancel', this.onClickTigerHide, this);
        // this.clickTiger.off('touchend', this.onClickTigerHide, this);
        // this.clickTie.parent.off('touchstart', this.onClickTieShow, this);
        // this.clickTie.parent.off('touchcancel', this.onClickTieHide, this);
        // this.clickTie.parent.off('touchend', this.onClickTieHide, this);
    },

    onClickDragronShow(event) {
        // ???????????????
        let target = event.currentTarget;
        let lp = target.convertToNodeSpaceAR(event.getLocation());
        if (!cc.Intersection.pointInPolygon(lp, target.getComponent(cc.PolygonCollider).points)) {
            return;
        }
        if (!this.enableBet) return;
        this.clickDragron.opacity = 255;
    },

    onClickDragronHide(event) {

        if (this.clickDragron.opacity == 255) {
            this.clickDragron.opacity = 0;
            if (!this.enableBet) return;
            this.betEvent(gameProto.LONG);
        }
    },

    onClickTigerShow(event) {
        // ???????????????
        let target = event.currentTarget;
        let lp = target.convertToNodeSpaceAR(event.getLocation());
        if (!cc.Intersection.pointInPolygon(lp, target.getComponent(cc.PolygonCollider).points)) {
            return;
        }
        if (!this.enableBet) return;
        this.clickTiger.opacity = 255;
    },

    onClickTigerHide(event) {
        if (this.clickTiger.opacity == 255) {
            this.clickTiger.opacity = 0;
            if (!this.enableBet) return;
            this.betEvent(gameProto.HU);
        }
    },

    onClickTieShow(event) {
        // ???????????????
        let target = event.currentTarget;
        let lp = target.convertToNodeSpaceAR(event.getLocation());
        if (!cc.Intersection.pointInPolygon(lp, target.getComponent(cc.PolygonCollider).points)) {
            return;
        }
        if (!this.enableBet) return;
        this.clickTie.opacity = 255;
    },

    onClickTieHide(event) {

        if (this.clickTie.opacity == 255) {
            this.clickTie.opacity = 0;
            if (!this.enableBet) return;
            this.betEvent(gameProto.HE);
        }
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.userInfo.uid === model.selfUid) {
                    ViewMgr.goBackHall(Config.GameType.LHD);
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

                // let betList = msg.data.gameData.betRecordList;
                // cc.log("????????????:" + JSON.stringify(betList));
                // this.reconnectBetList(betList);
            }
        } else if (router === "GameMessagePush") {
            // cc.log("router:GameMessagePush:" + msg.type);
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_POURGOLD_PUSH) {
                this.userBet(msg.data, true, true);
                this.updateBetCount(this.betCountList, this.selfBetCountList);
            } else if (msg.type === gameProto.GAME_START_PUSH) {
                this.onGameStart(gameProto.BET_TIME, true);
                let gameStatus = 1;
                let statusTime = msg.data.statusTime;
                if (!statusTime) {
                    statusTime = msg.data.Statustime;
                }
                this.showTickTime(gameStatus, statusTime);
            } else if (msg.type === gameProto.GAME_RESULT_PUSH) {
                this.onGameEnd(msg.data);
                let gameStatus = 2;
                let statusTime = msg.data.statusTime;
                if (!statusTime) {
                    statusTime = msg.data.Statustime;
                }
                this.showTickTime(gameStatus, statusTime);
                this.gameCommonCtrl.resetReduceGold();
            } else if (msg.type === gameProto.REDLIMIT_ERROR) {
                Tip.makeText("???????????????????????????????????????!");
            }
        } else if (router === "ReConnectSuccess") {
            cc.log("????????????");
            if (Global.Player.isInRoom()) {
                cc.log("??????id:" + model.roomID);
                Global.API.hall.joinRoomRequest(model.roomID, function () {
                    // cc.log("??????????????????");
                    // this.onReconnection();
                }.bind(this), undefined, Config.GameType.LHD);
            } else {
                ViewMgr.goBackHall(Config.GameType.LHD);
                cc.log("??????????????????");
            }
        }
    },

    //??????????????????????????????
    reconnectBetList(betList) {
        if (!!betList) {
            let reduceUserGold = 0;
            for (let userId in betList) {
                let userBetInfo = betList[userId];
                for (let betType in userBetInfo) {
                    let betInfo = {};
                    betInfo.uid = userId;
                    betInfo.betType = parseInt(betType);
                    betInfo.count = userBetInfo[betType];
                    this.userBet(betInfo, false, false);
                    if (userId == model.selfUid) {
                        reduceUserGold += betInfo.count;
                    }
                }
            }
            // cc.log("?????????:" + reduceUserGold);
            this.gameCommonCtrl.reduceUserSelfGold(reduceUserGold);
            this.updateBetCount();
        }
    },

    betEvent(paramType) {
        if (!this.enableBet) return;
        let betValue = this.gameCommonCtrl.getCurChipNumber();
        let tempValue = betValue;
        if (!!this.selfBetCountList[paramType]) {
            tempValue += this.selfBetCountList[paramType];
        }
        let redLimitData = this.redLimitInfo[paramType];
        if (tempValue > redLimitData.max) {
            Tip.makeText("??????????????????????????????" + redLimitData.min + "-" + redLimitData.max);
            return;
        }
        Global.CCHelper.playPreSound();
        roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(paramType, betValue));
    },

    buttonEvent(event, param) {
        if (param === "recordNode") {
            Global.CCHelper.playPreSound();
            Global.DialogManager.createDialog("LongHuDou/Trend/LHDTrendDialog", {
                dirRecordArr: this.dirRecordArr
            });
        }
    },

    gameInit(gameData) {
        this.gameInited = true;
        this.gameCommonCtrl.onGameInit(model.profitPercentage, model.kindId);
        this.gameCommonCtrl.setHideOtherPlayer(false);
        this.gameCommonCtrl.updateJetton(gameData);

        ViewMgr.pushMessage(this.gameDropDownList, {
            key: "setGameInfo",
            arguments: [model.kindId, model.profitPercentage]
        })

        this.updateParameters(gameData.parameters);
        // this.updateRate(gameData.Betrate);
        // ????????????
        this.dirRecordArr = [];
        if (this.dirRecordNodeArr.length > 0) {
            for (let i = 0; i < this.dirRecordNodeArr.length; ++i) {
                this.dirRecordNodeArr[i].destroy();
            }
        }
        this.dirRecordNodeArr = [];
        this.addDirRecord(gameData.dirRecord);

        if (gameData.gameStatus === gameProto.gameStatus.NONE) return;

        // cc.log("??????????????????" + JSON.stringify(gameData));
        if (gameData.gameStatus === gameProto.gameStatus.GAME_STARTED) {
            this.onGameStart(gameData.betLeftTime, false);
            this.updateBetRecordList(gameData.betRecordList);
        } else if (gameData.gameStatus === gameProto.gameStatus.GAME_END) {
            this.gameCommonCtrl.setCacheFlag(true);
            this.updateBetRecordList(gameData.betRecordList);
            if (!!gameData.resultData) {
                this.gameResultData = gameData.resultData;
                this.onShowCard(false);
                this.onShowResult();
            }
            // ????????????
            this.gameCommonCtrl.showWait(true);
        }
    },

    updateBetRecordList(betRecordList) {
        // ????????????
        if (!!betRecordList) {
            for (let key in betRecordList) {
                if (betRecordList.hasOwnProperty(key)) {
                    let userBetInfo = betRecordList[key];
                    if (gameProto.LONG in userBetInfo) this.userBet({
                        uid: key,
                        betType: gameProto.LONG,
                        count: userBetInfo[gameProto.LONG]
                    }, false, true);
                    if (gameProto.HU in userBetInfo) this.userBet({
                        uid: key,
                        betType: gameProto.HU,
                        count: userBetInfo[gameProto.HU]
                    }, false, true);
                    if (gameProto.HE in userBetInfo) this.userBet({
                        uid: key,
                        betType: gameProto.HE,
                        count: userBetInfo[gameProto.HE]
                    }, false, true);
                }
            }
        }
        this.updateBetCount(this.betCountList, this.selfBetCountList);

    },

    updateParameters(parameters) {
        if (!!parameters) {
            if (!!parameters.config) {
                this.redLimitInfo = {};
                this.updateRedLimit(parameters.config.gameConfig);
                this.oddsInfo = {};
                this.updateOdds(parameters.config.odds);
            }
        }
    },

    //????????????
    updateRedLimit(gameConfig) {
        if (gameConfig.hasOwnProperty(gameProto.LONG)) {
            this.redLimitInfo[gameProto.LONG] = gameConfig[gameProto.LONG].redLimit;
        }
        if (gameConfig.hasOwnProperty(gameProto.HU)) {
            this.redLimitInfo[gameProto.HU] = gameConfig[gameProto.HU].redLimit;
        }
        if (gameConfig.hasOwnProperty(gameProto.HE)) {
            this.redLimitInfo[gameProto.HE] = gameConfig[gameProto.HE].redLimit;
        }
    },

    //????????????
    updateOdds(odds) {
        let rateValue = odds[gameProto.LONG];
        if (!!rateValue) {
            this.oddsInfo[gameProto.LONG] = rateValue;
            this.rateLongLabel.string = "1:" + rateValue;
        }
        rateValue = odds[gameProto.HU];
        if (!!rateValue) {
            this.oddsInfo[gameProto.HU] = rateValue;
            this.rateHuLabel.string = "1:" + rateValue;
        }
        rateValue = odds[gameProto.HE];
        if (!!rateValue) {
            this.oddsInfo[gameProto.HE] = rateValue;
            this.rateHeLabel.string = "1:" + rateValue;
        }
    },

    onReconnection() {
        cc.log("onReconnection");
        // ????????????
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        // ????????????
        this.node.stopAllActions();
        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.LONG] = 0;
        this.betCountList[gameProto.HU] = 0;
        this.betCountList[gameProto.HE] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.LONG] = 0;
        this.selfBetCountList[gameProto.HU] = 0;
        this.selfBetCountList[gameProto.HE] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        // ???????????????
        this.longCardSprite.node.stopAllActions();
        this.longCardSprite.node.active = false;
        this.huCardSprite.node.stopAllActions();
        this.huCardSprite.node.active = false;
        // ????????????
        this.dirRecordArr = [];
        for (let i = 0; i < this.dirRecordNodeArr.length; ++i) {
            this.dirRecordNodeArr[i].destroy();
        }
        this.dirRecordNodeArr = [];
        // ????????????????????????
        this.gameCommonCtrl.onReconnection();
        // ??????????????????
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onGameStart(betLeftTime, requireUserInfo) {
        // ??????????????????
        this.betCountList = {};
        this.betCountList[gameProto.LONG] = 0;
        this.betCountList[gameProto.HU] = 0;
        this.betCountList[gameProto.HE] = 0;
        this.selfBetCountList = {};
        this.selfBetCountList[gameProto.LONG] = 0;
        this.selfBetCountList[gameProto.HU] = 0;
        this.selfBetCountList[gameProto.HE] = 0;
        this.updateBetCount(this.betCountList, this.selfBetCountList);
        this.node.stopAllActions();
        //if (betLeftTime <= 2) return;
        if (requireUserInfo) {
            // ??????????????????
            this.gameCommonCtrl.onGameStart();
        }
        this.gameCommonCtrl.setHideOtherPlayer(false);
        // ????????????
        //this.node.runAction(cc.sequence([cc.callFunc(this.onBetStart.bind(this)), cc.delayTime(gameProto.BET_TIME), cc.callFunc(this.onBetStop.bind(this))]));
        this.onBetStart();
        // ?????????????????????
        /*
        this.timeLabel.node.stopAllActions();
        this.timeLabel.node.parent.active = true;
        let leftTime = betLeftTime;
        this.timeLabel.node.runAction(cc.repeat(cc.sequence([cc.callFunc(function () {
            this.timeLabel.string = leftTime.toString();
            leftTime--;
        }.bind(this)), cc.delayTime(1)]), leftTime));
        */
    },

    onBetStart() {
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();
        this.onDispatchCard();
    },

    onBetStop() {
        /*this.timeLabel.node.stopAllActions();
        this.timeLabel.node.parent.active = false;*/
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();
    },

    onGameEnd(data) {
        if (!!data.profitPercentage) {
            cc.log("?????????????????????" + data.profitPercentage);
            model.profitPercentage = data.profitPercentage;
            this.gameCommonCtrl.profitPercentage = model.profitPercentage;
            ViewMgr.pushMessage(this.gameDropDownList, {
                key: "setGameInfo",
                arguments: [model.kindId, model.profitPercentage]
            })
        }
        this.gameResultData = data;
        if (this.enableBet) this.onBetStop();
        this.node.stopAllActions();
        let actions = [cc.delayTime(this.enableBet ? 2 : 0.1), cc.callFunc(this.onShowCard.bind(this)), cc.delayTime(2.5), cc.callFunc(this.onShowWin.bind(this)), cc.delayTime(2), cc.callFunc(this.onShowResult.bind(this))];
        this.node.runAction(cc.sequence(actions));
        if (data.baseScoreArr)
            this.gameCommonCtrl.updateSelectButtonNum(data.baseScoreArr);
    },

    onShowCard(isAnim) {
        if (!this.gameResultData) return;
        this.longCardSprite.node.active = true;
        this.huCardSprite.node.active = true;
        this.longCardSprite.node.position = this.longCardPos;
        this.huCardSprite.node.position = this.huCardPos;
        if (isAnim) {
            this.cardAnimation(this.longCardSprite, this.gameResultData.longCard, 0.2);
            this.cardAnimation(this.huCardSprite, this.gameResultData.huCard, 1);
        } else {
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + this.gameResultData.longCard, this.longCardSprite);
            Global.CCHelper.updateSpriteFrame("GameCommon/Card/" + this.gameResultData.huCard, this.huCardSprite);
        }
    },

    cardAnimation: function (cardSprite, cardData, delayTime) {
        let actions = [];
        let originalPos = {
            x: cardSprite.node.x,
            y: cardSprite.node.y
        };
        let originalScale = {
            x: cardSprite.node.scaleX,
            y: cardSprite.node.scaleY
        };
        actions.push(cc.delayTime(delayTime));
        actions.push(cc.callFunc(function () {
            AudioMgr.playSound('GameCommon/Sound/flipcard');
        }));
        actions.push(cc.moveBy(0.2, 10, originalPos.y));
        actions.push(cc.spawn([cc.scaleTo(0.1, 0.1, originalScale.y), cc.moveBy(0.1, -10, originalPos.y + 10)]));
        actions.push(cc.callFunc(function () {
            Global.CCHelper.updateSpriteFrame('GameCommon/Card/' + cardData, cardSprite);

            AudioMgr.playSound("LongHuDou/Sound/lhb_p_" + (cardData & 0x0F));
        }));

        actions.push(cc.spawn([cc.scaleTo(0.1, originalScale.x, originalScale.y), cc.moveTo(0.1, originalPos.x, originalPos.y)]));
        let temp = cc.moveTo(0.3, originalPos.x, originalPos.y);
        temp.easing(cc.easeBackOut());
        actions.push(temp);

        cardSprite.node.runAction(cc.sequence(actions));
    },

    onDispatchCard() {
        this.longCardSprite.node.active = true;
        this.huCardSprite.node.active = true;
        this.longCardSprite.node.stopAllActions();
        this.huCardSprite.node.stopAllActions();
        Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.longCardSprite);
        Global.CCHelper.updateSpriteFrame("GameCommon/Card/card_back", this.huCardSprite);
        this.longCardSprite.node.position = cc.v2(0, 25);

        let action1 = cc.moveTo(0.2, this.longCardPos);
        action1.easing(cc.easeIn(3.0));
        this.longCardSprite.node.runAction(action1);
        this.huCardSprite.node.position = cc.v2(0, 25);
        let action2 = cc.moveTo(0.2, this.huCardPos);
        action2.easing(cc.easeIn(3.0));
        this.huCardSprite.node.runAction(action2);

        AudioMgr.playSound("GameCommon/Sound/sendcard");
    },

    onShowWin() {
        if (!this.gameResultData) return;
        let winType = this.gameResultData.winType;
        let nodeName = "";
        let soundUrl = "LongHuDou/Sound/";
        if (winType === gameProto.LONG) {
            nodeName = "Long";
            soundUrl += "long_win";
        } else if (winType === gameProto.HU) {
            nodeName = "Hu";
            soundUrl += "hu_win";
        } else if (winType === gameProto.HE) {
            nodeName = "He";
            soundUrl += "he";
        }
        AudioMgr.playSound(soundUrl);
        let node = this.winTypeShowNode.getChildByName(nodeName);
        if (!!node) {
            node.active = true;
            let action = cc.sequence([cc.show(), cc.fadeTo(0.3, 255), cc.fadeTo(0.3, 0)]);
            node.opacity = 0;
            node.runAction(cc.repeat(action, 3));
        }
    },

    onShowResult() {
        this.gameCommonCtrl.onGameResult(this.gameResultData.scoreChangeArr);
        this.addDirRecord([this.gameResultData.winType]);
        Global.MessageCallback.emitMessage("UpdateTrendDataNotify", {
            dirRecordArr: this.dirRecordArr
        });
    },

    userBet(data, isTween, showJetton) {
        this.betCountList[data.betType] += data.count;
        if (data.uid === model.selfUid) {
            this.selfBetCountList[data.betType] += data.count;
        }
        let betRect = cc.rect(0, 0, 0, 0);
        if (data.betType === gameProto.LONG) {
            betRect = this.longBetRectNode.getBoundingBox();
        } else if (data.betType === gameProto.HU) {
            betRect = this.huBetRectNode.getBoundingBox();
        } else if (data.betType === gameProto.HE) {
            betRect = this.heBetRectNode.getBoundingBox();
        }
        this.gameCommonCtrl.userBet(data.uid, data.count, betRect, isTween, showJetton);
    },

    updateBetCount() {
        this.longBetCountLabel.string = this.betCountList[gameProto.LONG].toString();
        this.huBetCountLabel.string = this.betCountList[gameProto.HU].toString();
        this.heBetCountLabel.string = this.betCountList[gameProto.HE].toString();

        this.selfLongBetCountLabel.string = this.selfBetCountList[gameProto.LONG].toString();
        this.selfHuBetCountLabel.string = this.selfBetCountList[gameProto.HU].toString();
        this.selfHeBetCountLabel.string = this.selfBetCountList[gameProto.HE].toString();
    },

    addDirRecord(dirRecordList) {
        this.dirRecordArr = this.dirRecordArr.concat(dirRecordList);
        // ????????????
        let parent = this.betRecordBar;
        for (let i = 0; i < dirRecordList.length; ++i) {
            let node = this.createBetRecordItem(dirRecordList[i]);
            node.parent = parent;
            node.y = 0;
            node.setContentSize(30, 30); // ?????????????????????????????????????????????????????????

            node.setScale(0.1);
            node.runAction(cc.scaleTo(0.1, 1.0));
            this.dirRecordNodeArr.push(node);
            if (this.dirRecordNodeArr.length > 24) {
                let firstNode = this.dirRecordNodeArr.shift();
                firstNode.destroy();
                this.dirRecordArr.shift();
            }
        }
        parent.getComponent(cc.Layout).updateLayout(); // ?????????????????? ????????????????????????????????????????????????

        let lastItem = this.dirRecordNodeArr[this.dirRecordNodeArr.length - 1];
        if (lastItem) {
            this.recordItemSelected.parent = lastItem;
            this.recordItemSelected.active = true;
            this.recordItemSelected.position = cc.v2(0, 0);
        }
    },

    createBetRecordItem(type) {
        let res = "";
        if (type === gameProto.LONG) {
            res = "LongHuDou/sprite_long";
        } else if (type === gameProto.HU) {
            res = "LongHuDou/sprite_hu";
        } else if (type === gameProto.HE) {
            res = "LongHuDou/sprite_he";
        }
        return Global.CCHelper.createSpriteNode(res, true);
    },

    goldChange(changeCount, showAnim) {
        if (!showAnim) return;
        if (changeCount === 0) return;
        let label = parseFloat(changeCount.toFixed(2)) + "???";
        if (changeCount > 0) {
            label = "+" + label;
            this.winGoldLabel.string = label;
            this.winGoldLabel.node.y = 20;
            this.winGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 40)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
        } else {
            this.loseGoldLabel.string = label;
            this.loseGoldLabel.node.y = 20;
            this.loseGoldLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.2, cc.v2(0, 40)), cc.delayTime(CHANGE_GOLD_SHOW_TIME), cc.hide()]));
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
            this.startSprite.active = false;
            this.resoultSprite.active = false;
            this.serverStartSprite.active = true;
        } else if (state == 1) {
            this.startSprite.active = true;
            this.resoultSprite.active = false;
            this.serverStartSprite.active = false;
        } else if (state == 2) {
            this.startSprite.active = false;
            this.resoultSprite.active = true;
            this.serverStartSprite.active = false;
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