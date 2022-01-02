let roomProto = require('../../API/RoomProto');
let gameProto = require('./API/HHDZGameProto');
let roomAPI = require('../../API/RoomAPI');
let model = require('./HHDZModel');

cc.Class({
    extends: cc.Component,

    properties: {
        gameCommonCtrl: require("GameCommonController"),
        //牌的位置
        blackCardsGroup: cc.Node,
        redCardsGroup: cc.Node,
        //筹码 的 矩形位置
        blackBetRectNode: cc.Node,
        blackBetRectNode1: cc.Node,
        redBetRectNode: cc.Node,
        redBetRectNode1: cc.Node,
        luckBetRectNode: cc.Node,
        luckBetRectNode1: cc.Node,
        //下注量Label
        blackBetCountLabel: cc.Label,
        redBetCountLabel: cc.Label,
        luckBetCountLabel: cc.Label,
        //赢的 图片节点
        winTypeShowNode: cc.Node,

        betRecordItemNode: cc.Node,//记录 走势的节点

        cards: cc.Prefab,

        pointContent: cc.Node,//走势 红星
        cardTypeContent: cc.Node,//走势按钮
        dirPoint: cc.Prefab,//红星预制
        dirCardType: cc.Prefab,//牌型预制

        selfBetCountBlack: cc.Label,
        selfBetCountRed: cc.Label,
        selfBetCountLuck: cc.Label,
        gameDropDownList: cc.Node,

        clickBlack: cc.Node,
        clickRed: cc.Node,
        clickLucky: cc.Node,
        luckyBlink: cc.Node,

        tickNode: cc.Node,
        startSpr: cc.Node,
        resultSpr: cc.Node,
        serverStartSpr: cc.Node,
        tickLabel: cc.Label,

        rateBlackLabel: cc.Label,
        rateRedLabel: cc.Label,
        rateBaoziLabel: cc.Label,
        rateShunjinLabel: cc.Label,
        rateJinhuaLabel: cc.Label,
        rateShunziLabel: cc.Label,
        rateDuiziLabel: cc.Label
    },

    start() {
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        this.dirRecordArr = [];
        this.dirRecordNodeArr = [];
        this.betCountList = {};
        this.betCountList[gameProto.SCORE_BLACK] = 0;
        this.betCountList[gameProto.SCORE_RED] = 0;
        this.betCountList[gameProto.SCORE_LUCK] = 0;
        // 自己下注的金额
        this.selfBetCountList = [];
        this.selfBetCountList[gameProto.SCORE_BLACK] = 0;
        this.selfBetCountList[gameProto.SCORE_RED] = 0;
        this.selfBetCountList[gameProto.SCORE_LUCK] = 0;
        this.points = [];
        this.cardTypeImgs = [];

        this.blackCardsPos = this.blackCardsGroup.position;
        this.redCardsPos = this.redCardsGroup.position;

        //设置牌
        this.blackCards = cc.instantiate(this.cards);
        this.blackCards.parent = this.blackCardsGroup;
        this.redCards = cc.instantiate(this.cards);
        this.redCards.parent = this.redCardsGroup;

        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        AudioMgr.startPlayBgMusic("HongHeiDaZhan/Sound/bg");

        this.clickBlack.opacity = 1;
        this.clickRed.opacity = 1;
        this.luckyBlink.opacity = 1;

        this.tickNode.active = false;
    },

    onLoad() {
        this.clickBlack.on('touchstart', this.onClickBlackShow, this);
        this.clickBlack.on('touchcancel', this.onClickBlackHide, this);
        this.clickBlack.on('touchend', this.onClickBlackHide, this);
        this.clickRed.on('touchstart', this.onClickRedShow, this);
        this.clickRed.on('touchcancel', this.onClickRedHide, this);
        this.clickRed.on('touchend', this.onClickRedHide, this);
        this.clickLucky.on('touchstart', this.onClickLuckyShow, this);
        this.clickLucky.on('touchcancel', this.onClickLuckyHide, this);
        this.clickLucky.on('touchend', this.onClickLuckyHide, this);
    },

    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);

        model.onDestroy();

        AudioMgr.stopBgMusic();

        // this.clickBlack.off('touchstart', this.onClickBlackShow, this);
        // this.clickBlack.off('touchcancel', this.onClickBlackHide, this);
        // this.clickBlack.off('touchend', this.onClickBlackHide, this);
        // this.clickRed.off('touchstart', this.onClickRedShow, this);
        // this.clickRed.off('touchcancel', this.onClickRedHide, this);
        // this.clickRed.off('touchend', this.onClickRedHide, this);
        // this.clickLucky.off('touchstart', this.onClickLuckyShow, this);
        // this.clickLucky.off('touchcancel', this.onClickLuckyHide, this);
        // this.clickLucky.off('touchend', this.onClickLuckyHide, this);
    },

    onClickBlackShow(event) {
        // 多边形检测
        let target = event.currentTarget;
        let lp = target.convertToNodeSpaceAR(event.getLocation());
        if (!cc.Intersection.pointInPolygon(lp, target.getComponent(cc.PolygonCollider).points)) {
            return;
        }
        if (!this.enableBet) return;
        this.clickBlack.opacity = 255;
    },

    onClickBlackHide() {
        if (this.clickBlack.opacity == 255) {
            this.clickBlack.opacity = 1;
            if (!this.enableBet) return;
            this.betEvent(gameProto.SCORE_BLACK);
        }
    },

    onClickRedShow(event) {
        // 多边形检测
        let target = event.currentTarget;
        let lp = target.convertToNodeSpaceAR(event.getLocation());
        if (!cc.Intersection.pointInPolygon(lp, target.getComponent(cc.PolygonCollider).points)) {
            return;
        }
        if (!this.enableBet) return;
        this.clickRed.opacity = 255;
    },

    onClickRedHide() {

        if (this.clickRed.opacity == 255) {
            this.clickRed.opacity = 1;
            if (!this.enableBet) return;
            this.betEvent(gameProto.SCORE_RED);
        }
    },

    onClickLuckyShow(event) {
        // 多边形检测
        let target = event.currentTarget;
        let lp = target.convertToNodeSpaceAR(event.getLocation());
        if (!cc.Intersection.pointInPolygon(lp, target.getComponent(cc.PolygonCollider).points)) {
            return;
        }
        if (!this.enableBet) return;
        this.luckyBlink.opacity = 255;
    },

    onClickLuckyHide() {
        if (this.luckyBlink.opacity == 255) {
            this.luckyBlink.opacity = 1;
            if (!this.enableBet) return;
            this.betEvent(gameProto.SCORE_LUCK);
        }
    },

    messageCallbackHandler(router, msg) {
        // cc.log("router:" + router + ":" + JSON.stringify(msg));
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.userInfo.uid === Global.Player.getPy('uid')) {
                    ViewMgr.goBackHall(Config.GameType.HHDZ);
                }
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo])
                // 初始化界面场景
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
            if (msg.type === gameProto.GAME_OPERATE_STAKE_PUSH) {
                this.userBet(msg.data, true, true);
                this.updateBetCount(this.betCountList);
            } else if (msg.type === gameProto.GAME_START_PUSH) {
                this.onGameStart(true);
                let statusTime = msg.statusTime;
                if (!statusTime) {
                    statusTime = msg.Statustime;
                }
                let state = 1;
                this.showTickTime(state, statusTime);
            } else if (msg.type === gameProto.GAME_END_PUSH) {
                if (!!msg.profitPercentage) {
                    cc.log("结算税收比例:" + msg.profitPercentage);
                    model.profitPercentage = msg.profitPercentage;
                    this.gameCommonCtrl.profitPercentage = model.profitPercentage;
                    this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(Global.Enum.gameType.HHDZ, model.profitPercentage);
                }
                this.onGameEnd(msg.data);
                let statusTime = msg.data.statusTime;
                if (!statusTime) {
                    statusTime = msg.data.Statustime;
                }
                let state = 2;
                this.showTickTime(state, statusTime);
            } else if (msg.type === gameProto.REDLIMIT_ERROR) {
                Tip.makeText("下注失败，超出指定区域限红!");
            }
        } else if (router === "ReConnectSuccess") {
            cc.log("断线重连");
            if (Global.Player.isInRoom()) {
                cc.log("房间id:" + model.roomID);
                Global.API.hall.joinRoomRequest(model.roomID, () => {
                    // this.onReconnection();
                }, undefined, Config.GameType.HHDZ);
            } else {
                ViewMgr.goBackHall(Config.GameType.HHDZ);
                cc.log("没有在房间中");
            }
        }
    },

    betEvent(betType) {
        if (!this.enableBet) return;

        let betValue = this.gameCommonCtrl.getCurChipNumber();
        let tempValue = betValue;
        if (!!this.selfBetCountList[betType]) {
            tempValue += this.selfBetCountList[betType];
        }
        if (!!this.redLimitInfo[betType]) {
            let redLimitInfo = this.redLimitInfo[betType];
            if (redLimitInfo.max < tempValue) {
                Tip.makeText("下注失败，此区域限红" + redLimitInfo.min + "-" + redLimitInfo.max);
                return;
            }
        }

        let data = {
            type: gameProto.GAME_OPERATE_STAKE_NOTIFY,
            data: {
                betType: betType,
                count: betValue
            }
        };
        Global.CCHelper.playPreSound();
        roomAPI.gameMessageNotify(data);
    },

    buttonEvent(event, param) {
        if (param === "recordNode") {
            Global.CCHelper.playPreSound();
            Global.DialogManager.createDialog("HongHeiDaZhan/HHDZDirRecordDialog", {
                dirRecordArr: this.dirRecordArr
            });
        }
    },

    gameInit(gameData) {
        this.gameInited = true;
        this.gameCommonCtrl.onGameInit(model.profitPercentage, Global.Enum.gameType.HHDZ);
        this.gameCommonCtrl.setHideOtherPlayer(false);
        this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(Global.Enum.gameType.HHDZ, model.profitPercentage);
        this.gameCommonCtrl.updateJetton(gameData);

        this.updateParameters(gameData.parameters);
        // 清楚记录
        this.dirRecordArr = [];
        if (this.dirRecordNodeArr.length > 0) {
            for (let i = 0; i < this.dirRecordNodeArr.length; ++i) {
                this.dirRecordNodeArr[i].destroy();
            }
        }
        this.dirRecordNodeArr = [];
        this.addDirRecord(gameData.dirRecord);

        if (gameData.gameStatus === gameProto.gameStatus.NONE) return;

        if (gameData.gameStatus === gameProto.gameStatus.GAME_STARTED) {
            this.onGameStart(false);
            this.updateBetRecordList(gameData.betRecordList);
        } else if (gameData.gameStatus === gameProto.gameStatus.GAME_END) {
            this.gameCommonCtrl.setCacheFlag(true);
            this.updateBetRecordList(gameData.betRecordList);
            if (!!gameData.resultData) {
                if (!!gameData.resultData.data) {
                    this.gameResultData = gameData.resultData.data;
                } else {
                    this.gameResultData = gameData.resultData;
                }
                this.onShowCardResult();
                this.onShowResult();
            }
            // 显示等待
            this.gameCommonCtrl.showWait(true);
        }
    },

    //更新下注记录
    updateBetRecordList(betRecordList) {
        // 设置筹码
        if (!!betRecordList) {
            for (let key in betRecordList) {
                if (betRecordList.hasOwnProperty(key)) {
                    let userBetInfo = betRecordList[key];
                    if (!!userBetInfo[gameProto.SCORE_BLACK]) {
                        let betInfo = {};
                        betInfo.uid = key;
                        betInfo.betType = gameProto.SCORE_BLACK;
                        betInfo.count = userBetInfo[gameProto.SCORE_BLACK];
                        this.userBet(betInfo, false, true);
                    }
                    if (!!userBetInfo[gameProto.SCORE_RED]) {
                        let betInfo = {};
                        betInfo.uid = key;
                        betInfo.betType = gameProto.SCORE_RED;
                        betInfo.count = userBetInfo[gameProto.SCORE_RED];
                        this.userBet(betInfo, false, true);
                    }
                    if (!!userBetInfo[gameProto.SCORE_LUCK]) {
                        let betInfo = {};
                        betInfo.uid = key;
                        betInfo.betType = gameProto.SCORE_LUCK;
                        betInfo.count = userBetInfo[gameProto.SCORE_LUCK];
                        this.userBet(betInfo, false, true);
                    }
                }
            }
        }
        this.updateBetCount(this.betCountList);
    },

    //更新参数
    updateParameters(parameters) {
        if (!!parameters) {
            if (!!parameters.config) {
                this.updateRedLimit(parameters.config.gameConfig);
                this.updateOdds(parameters.config.odds);
            }
        }
    },

    updateRedLimit(redLimitData) {
        this.redLimitInfo = {};
        this.redLimitInfo[gameProto.SCORE_BLACK] = redLimitData[gameProto.SCORE_BLACK].redLimit;
        this.redLimitInfo[gameProto.SCORE_RED] = redLimitData[gameProto.SCORE_RED].redLimit;
        this.redLimitInfo[gameProto.SCORE_LUCK] = redLimitData[gameProto.SCORE_LUCK].redLimit;
    },

    updateOdds(odds) {
        this.rateBlackLabel.string = "1:" + odds[gameProto.SCORE_BLACK];
        this.rateRedLabel.string = "1:" + odds[gameProto.SCORE_RED];
        this.rateDuiziLabel.string = odds[gameProto.CARD_TYPE_DUI_ZI];
        this.rateShunziLabel.string = odds[gameProto.CARD_TYPE_SHUN_ZI];
        this.rateJinhuaLabel.string = odds[gameProto.CARD_TYPE_TONG_HUA];
        this.rateShunjinLabel.string = odds[gameProto.CARD_TYPE_TONG_HUA_SHUN];
        this.rateBaoziLabel.string = odds[gameProto.CARD_TYPE_BAO_ZI];
    },

    onReconnection() {
        // 清理数据
        this.enableBet = false;
        this.gameResultData = null;
        this.gameInited = false;
        // 停止动作
        this.node.stopAllActions();
        // 更新下注信息
        this.betCountList = {};
        this.betCountList[gameProto.SCORE_BLACK] = 0;
        this.betCountList[gameProto.SCORE_RED] = 0;
        this.betCountList[gameProto.SCORE_LUCK] = 0;
        // 自己下注的金额
        this.selfBetCountList = [];
        this.selfBetCountList[gameProto.SCORE_BLACK] = 0;
        this.selfBetCountList[gameProto.SCORE_RED] = 0;
        this.selfBetCountList[gameProto.SCORE_LUCK] = 0;
        this.updateBetCount(this.betCountList);
        // 清理扑克牌
        this.blackCardsGroup.stopAllActions();
        this.blackCardsGroup.active = false;
        this.redCardsGroup.stopAllActions();
        this.redCardsGroup.active = false;
        // 清理走势
        this.dirRecordArr = [];
        for (let i = 0; i < this.dirRecordNodeArr.length; ++i) {
            this.dirRecordNodeArr[i].destroy();
        }
        this.dirRecordNodeArr = [];
        // 游戏公共控制重连
        this.gameCommonCtrl.onReconnection();
        // 请求场景数据
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onGameStart(requireUserInfo) {
        // 清理下注金额
        this.betCountList = {};
        this.betCountList[gameProto.SCORE_BLACK] = 0;
        this.betCountList[gameProto.SCORE_RED] = 0;
        this.betCountList[gameProto.SCORE_LUCK] = 0;

        // 自己下注的金额
        this.selfBetCountList = [];
        this.selfBetCountList[gameProto.SCORE_BLACK] = 0;
        this.selfBetCountList[gameProto.SCORE_RED] = 0;
        this.selfBetCountList[gameProto.SCORE_LUCK] = 0;

        this.updateBetCount(this.betCountList);
        this.node.stopAllActions();
        if (requireUserInfo) {
            // 执行游戏开始
            this.gameCommonCtrl.onGameStart();
        }
        this.gameCommonCtrl.setHideOtherPlayer(false);
        // 开启动作
        //this.node.runAction(cc.sequence([cc.delayTime(1), cc.callFunc(this.onBetStart.bind(this)), cc.delayTime(gameProto.stakeTime), cc.callFunc(this.onBetStop.bind(this))]));
        this.onBetStart();
    },

    onBetStart() {
        this.enableBet = true;
        this.gameCommonCtrl.onGameBetStart();
        this.onDispatchCard();
    },

    onBetStop() {
        this.enableBet = false;
        this.gameCommonCtrl.onGameBetEnd();
        this.node.stopAllActions();
    },

    onGameEnd(data) {
        this.gameResultData = data;
        if (this.enableBet) this.onBetStop();
        this.node.stopAllActions();
        let actions = [];
        actions.push(cc.delayTime(this.enableBet ? 2 : 0.1));
        actions.push(cc.callFunc(this.onShowCard.bind(this)));
        actions.push(cc.delayTime(4));
        actions.push(cc.callFunc(this.onShowWin.bind(this)));
        actions.push(cc.delayTime(3));
        actions.push(cc.callFunc(this.onShowResult.bind(this)));
        this.node.runAction(cc.sequence(actions));
    },

    onShowCard() {
        if (!this.gameResultData) return;
        this.blackCardsGroup.active = true;
        this.redCardsGroup.active = true;

        let blackCardData = this.gameResultData.cardsData[gameProto.BLACK];
        this.blackCards.getComponent('HHDZCards').showCards(blackCardData, gameProto.BLACK);
        let redCardData = this.gameResultData.cardsData[gameProto.RED];
        let self = this;
        setTimeout(function () {
            if (!cc.isValid(self)) {
                return;
            }
            if (!!self.redCards) {
                self.redCards.getComponent('HHDZCards').showCards(redCardData, gameProto.RED);
            } else {
                // cc.log("莫名其妙的报错!!!");
            }

        }, 2000);
        // this.scheduleOnce(function () {
        //     cc.log("红方牌型显示");
        //     this.redCards.getComponent('HHDZCards').showCards(redCardData);
        // }.bind(this), 2);
    },

    onShowCardResult() {
        if (!this.gameResultData) return;
        this.blackCardsGroup.active = true;
        this.redCardsGroup.active = true;

        let blackCardData = this.gameResultData.cardsData[gameProto.BLACK];
        this.blackCards.getComponent('HHDZCards').showCardResult(blackCardData);
        let redCardData = this.gameResultData.cardsData[gameProto.RED];
        this.redCards.getComponent('HHDZCards').showCardResult(redCardData, gameProto.RED);
    },

    onDispatchCard() {
        this.blackCardsGroup.active = true;
        this.redCardsGroup.active = true;

        this.blackCards.getComponent('HHDZCards').hideCards();
        this.redCards.getComponent('HHDZCards').hideCards();

        this.blackCardsGroup.position = cc.v2(0, 25);
        let action1 = cc.moveTo(0.2, this.blackCardsPos);
        action1.easing(cc.easeIn(3.0));
        this.blackCardsGroup.runAction(action1);
        this.redCardsGroup.position = cc.v2(0, 25);
        let action2 = cc.moveTo(0.2, this.redCardsPos);
        action2.easing(cc.easeIn(3.0));
        this.redCardsGroup.runAction(action2);

        AudioMgr.playSound("GameCommon/Sound/sendcard");
    },

    onShowWin() {
        if (!this.gameResultData) return;
        let winType = this.gameResultData.winType;
        let nodeName = "";
        if (winType === gameProto.BLACK) {
            nodeName = "Black";
        } else if (winType === gameProto.RED) {
            nodeName = "Red";
        }

        let node = this.winTypeShowNode.getChildByName(nodeName);
        if (!!node) {
            node.active = true;
            let action = cc.sequence([cc.fadeIn(0.3), cc.delayTime(0.2), cc.fadeOut(0.6)]);
            node.opacity = 0;
            node.runAction(cc.repeat(action, 3));
        }

        if (this.gameResultData.luck) {
            let node = this.winTypeShowNode.getChildByName('Luck');
            if (!!node) {
                node.active = true;
                let action = cc.sequence([cc.fadeIn(0.3), cc.delayTime(0.2), cc.fadeOut(0.6)]);
                node.opacity = 0;
                node.runAction(cc.repeat(action, 3));
            }
        }
    },

    onShowResult() {
        this.gameCommonCtrl.onGameResult(this.gameResultData.scoreChangeArr);
        this.addDirRecord([{
            winner: this.gameResultData.winType,
            winnerCardType: this.gameResultData.winnerCardType
        }]);
    },

    userBet(data, isTween, showJetton) {
        this.betCountList[data.betType] += data.count;
        if (data.uid === Global.Player.getPy('uid')) {
            this.selfBetCountList[data.betType] += data.count;
        }
        let betRect = cc.rect(0, 0, 0, 0);
        let collider = null;
        if (data.betType === gameProto.SCORE_BLACK) {
            betRect = this.blackBetRectNode.getBoundingBox();
            collider = this.blackBetRectNode1;
        } else if (data.betType === gameProto.SCORE_RED) {
            betRect = this.redBetRectNode.getBoundingBox();
            collider = this.redBetRectNode1;
        } else if (data.betType === gameProto.SCORE_LUCK) {
            betRect = this.luckBetRectNode.getBoundingBox();
            collider = this.luckBetRectNode1;
        }

        this.gameCommonCtrl.userBet(data.uid, data.count, betRect, isTween, showJetton, collider);
    },

    updateBetCount(betCountList) {
        this.blackBetCountLabel.string = betCountList[gameProto.SCORE_BLACK].toString();
        this.redBetCountLabel.string = betCountList[gameProto.SCORE_RED].toString();
        this.luckBetCountLabel.string = betCountList[gameProto.SCORE_LUCK].toString();

        this.selfBetCountBlack.string = '下' + this.selfBetCountList[gameProto.SCORE_BLACK].toString();
        this.selfBetCountRed.string = '下' + this.selfBetCountList[gameProto.SCORE_RED].toString();
        this.selfBetCountLuck.string = '下' + this.selfBetCountList[gameProto.SCORE_LUCK].toString();
    },



    addDirRecord(dirRecordList) {
        Global.MessageCallback.emitMessage('UpdateDirRecord', dirRecordList);

        this.dirRecordArr = this.dirRecordArr.concat(dirRecordList);
        while (this.dirRecordArr.length > gameProto.DIR_COUNT) {
            this.dirRecordArr.shift();
        }

        for (let i = 0; i < dirRecordList.length; i++) {
            if (this.points.length === 19) {
                this.points[0].destroy();
                this.points.shift();
            }

            if (this.cardTypeImgs.length === 12) {
                this.cardTypeImgs[0].destroy();
                this.cardTypeImgs.shift();
            }

            let point = cc.instantiate(this.dirPoint);
            point.parent = this.pointContent;
            point.getChildByName('redPoint').active = dirRecordList[i].winner === gameProto.RED;
            this.points[this.points.length] = point;

            if (this.cardTypeImgs.length > 0) {
                let cardImg = this.cardTypeImgs[this.cardTypeImgs.length - 1];
                cardImg.getChildByName("new_flag").active = false;
                let backSpriteStr = 'HongHeiDaZhan/back_1';
                if (cardImg.type == 10) {
                    backSpriteStr = 'HongHeiDaZhan/back_2';
                }
                Global.CCHelper.updateSpriteFrame(backSpriteStr, cardImg.getComponent(cc.Sprite));
                Global.CCHelper.updateSpriteFrame('HongHeiDaZhan/old_' + cardImg.type, cardImg.getChildByName("font").getComponent(cc.Sprite));
            }

            let cardType = dirRecordList[i].winnerCardType;
            let cardTypeImg = cc.instantiate(this.dirCardType);
            cardTypeImg.parent = this.cardTypeContent;
            cardTypeImg.type = cardType;
            cardTypeImg.getChildByName("new_flag").active = true;
            let backSpriteStr = 'HongHeiDaZhan/back_1';
            if (cardTypeImg.type == 10) {
                backSpriteStr = 'HongHeiDaZhan/back_2';
            }
            Global.CCHelper.updateSpriteFrame(backSpriteStr, cardTypeImg.getComponent(cc.Sprite));
            Global.CCHelper.updateSpriteFrame('HongHeiDaZhan/old_' + cardTypeImg.type, cardTypeImg.getChildByName("font").getComponent(cc.Sprite));
            this.cardTypeImgs[this.cardTypeImgs.length] = cardTypeImg;
        }
    },

    //显示倒计时
    showTickTime(state, tickTime) {
        if (state == 0) { //服务器刚启动 20秒倒计时
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