let roomProto = require('../../API/RoomProto');
let DDZProto = require('./DDZProto');
let roomAPI = require('../../API/RoomAPI');
let gameLogic = require('./gameLogic');
let DDZModel = require("./DDZModel");

cc.Class({
    extends: cc.Component,

    properties: {
        handCardWidgetCtrl: require('DDZHandCradWidgetCtrl'),
        operationBtnWidgetCtrl: require('DDZOperationBtnWdigetCtrl'),
        cardCountLabelArr: [cc.Label],
        showTipNodeArr: [cc.Node],
        showOutCardNodeArr: [cc.Node],
        clockPosNodeArr: [cc.Node],
        showHandCardNode: [cc.Node],
        landScoreLabel: cc.Label,
        nicknameLabelArr: [cc.Label],
        vipLabelArr: [cc.Label],
        goldLabelArr: [cc.Label],
        userIconSpriteArr: [cc.Sprite],
        showOutCardWidgetPrefab: cc.Prefab,
        showHandCardWidgetPrefab: cc.Prefab,
        clockWidgetPrefab: cc.Prefab,
        backCardNode: cc.Node,
        landCapNodeArr: [cc.Node],

        cardNode: cc.Node,
        shunziAnimationPrefab: cc.Prefab,
        zhandanAnimationPrefab: cc.Prefab,
        huojianAnimationPrefab: cc.Prefab,
        huojianGuangAnimationPrefab: cc.Prefab,
        animationNode: cc.Node,

        fieldInfoLabel: cc.Label,
        tuoGuanArr: [cc.Node],
        // musicPrefab: cc.Prefab
    },

    onLoad: function () {
        // this.rulePoint = this.node.getChildByName("rulePoint");
        // this.rulePoint.active = false;
        this.backCardNode.active = false;
        this.dissmissHost = this.node.getChildByName("dissmissHost");
        this.dissmissHost.active = false;
        this.dissMissDragon = cc.find("dissmissButton", this.dissmissHost).getComponent(dragonBones.ArmatureDisplay);
        var callFunc = function () {
            this.dissMissDragon.node.parent.active = false;
        };
        this.dissMissDragon.addEventListener(dragonBones.EventObject.COMPLETE, callFunc.bind(this));
        this.dissMissDragon.node.parent.active = false;

        this.hostState = false;
        this.hostBtn = this.node.getChildByName("hostBtn").getComponent(cc.Button);
        this.hostBtn.interactable = false;
        this.gameInited = false;
        // ????????????
        this.landScoreLabel.string = '0';
        this.myChairID = -1;
        this.roomID = "";
        this.baseScore = 1;
        this.bankerUserChairID = -1;
        for (let i = 0; i < this.userIconSpriteArr.length; i++) {
            this.userIconSpriteArr[i].node.parent.active = false;
        }

        this.handCardWidgetCtrl.initWidget();

        this.turnCardDataArr = [];

        this.landCapNode = null;

        this.dragon = this.animationNode.getChildByName("chuntian").getComponent(dragonBones.ArmatureDisplay);
        var callFunc = function () {
            this.dragon.node.active = false;
        };
        this.dragon.addEventListener(dragonBones.EventObject.COMPLETE, callFunc.bind(this));
        this.dragon.node.active = false;

        this.roomUserInfoArr = [null, null, null];

        this.node.getChildByName("GameDropDownList").getComponent('GameDropDownList').setGameInfo(DDZModel.kindId, DDZModel.profitPercentage);

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        // ????????????
        setTimeout(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 200);

        //
        AudioMgr.startPlayBgMusic("Game/DDZ/Sound/sound_bg");
    },
    gameInit: function (roomUserInfoArr, gameData) {
        this.gameInited = true;
        // ?????????????????????
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            let roomUserInfo = roomUserInfoArr[i];
            if (roomUserInfo.userInfo.uid === Global.Player.getPy('uid')) {
                this.myChairID = roomUserInfo.chairId;
                break;
            }
        }
        // ???????????????
        let fieldName = "";
        if (gameData.gameTypeInfo.level === 1) {
            fieldName = "?????????";
        } else if (gameData.gameTypeInfo.level === 2) {
            fieldName = "?????????";
        } else if (gameData.gameTypeInfo.level === 3) {
            fieldName = "?????????";
        } else if (gameData.gameTypeInfo.level === 4) {
            fieldName = "?????????";
        }
        this.fieldInfoLabel.string = DDZModel.baseScore;
        // ??????????????????
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            this.onUserEntryRoom(roomUserInfoArr[i]);
        }
        // ????????????
        this.baseScore = gameData.baseScore;
        // ??????????????????
        this.profitPercentage = gameData.profitPercentage;
        this.landScoreLabel.string = gameData.bombTimes * gameData.landScore || 0;

        // ??????????????? ???????????? ????????????
        if (gameData.gameStatus === DDZProto.gameStatus.NONE) {
            roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));

            // ??????????????????
            // this.operationBtnWidgetCtrl.startReady();
            // ???????????????
            // this.showClock(this.myChairID, DDZProto.READY_TIME, function () {
            //     roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
            //     Waiting.show();
            // }.bind(this));

            //???????????????
        } else if (gameData.gameStatus === DDZProto.gameStatus.SNATCH_LANDLORD) {
            // ????????????
            this.handCardWidgetCtrl.onSendCard(gameData.selfCardArr, false);
            if (Array.isArray(DDZModel.userhosting)) {
                for (let i = 0; i < DDZModel.userhosting.length; i++) {
                    if (DDZModel.userhosting[i])
                        this.answerHostingPush(i);
                    else
                        this.answerDissHostingPush(i);
                }
            }
            for (let i = 0; i < 3; ++i) {
                // ???????????????????????????
                this.updateCardCount(i, gameData.allUserCardCountArr[i]);
                // ???????????????????????????
                this.updateCallLandScore(i, gameData.snatchScoreArr[i])
            }
            // ??????????????????
            this.landScoreLabel.string = gameData.landScore.toString();
            // ????????????????????????????????????????????????
            if (gameData.curChairID === this.myChairID) {
                this.operationBtnWidgetCtrl.startCallLand([gameData.landScore + 1]);
            }
            // ???????????????
            this.showClock(gameData.curChairID, DDZModel.outcardtime, this.autoCallScore.bind(this));
        }
        //????????????
        else if (gameData.gameStatus === DDZProto.gameStatus.OUT_CARD) {
            if (Array.isArray(DDZModel.userhosting)) {
                for (let i = 0; i < DDZModel.userhosting.length; i++) {
                    if (DDZModel.userhosting[i])
                        this.answerHostingPush(i);
                    else
                        this.answerDissHostingPush(i);
                }
            }
            // ????????????
            this.handCardWidgetCtrl.onSendCard(gameData.selfCardArr, false);


            //???????????? ???????????????
            var turnCardDataArr = gameData.turnCardDataArr || null;
            var turnCardChair = gameData.turnCardChair || null;
            if (turnCardChair) {
                let index = this.getUserChairIndex(turnCardChair);
                // ????????????
                let node = cc.instantiate(this.showOutCardWidgetPrefab);
                node.parent = this.showOutCardNodeArr[index];
                let ctrl = node.getComponent('DDZShowOutCardWidgetCtrl');
                ctrl.initWidget(turnCardDataArr, index, turnCardChair);
            }

            this.handCardWidgetCtrl.startGame();
            // ??????????????????
            this.bankerUserChairID = gameData.bankerUserChairID;
            this.showLandCapAnimation(this.bankerUserChairID, false);
            // ???????????????????????????
            for (let i = 0; i < 3; ++i) {
                // ???????????????????????????
                this.updateCardCount(i, gameData.allUserCardCountArr[i]);
            }
            // ??????????????????
            this.landScoreLabel.string = gameData.landScore.toString();
            // ????????????
            let cardNode = cc.instantiate(this.showOutCardWidgetPrefab);
            cardNode.getComponent("DDZShowOutCardWidgetCtrl").initWidget(gameData.backCardArr);
            this.backCardNode.active = true;
            cardNode.parent = this.backCardNode;
            // ?????????????????????
            // ??????????????????????????????????????????
            this.turnCardDataArr = gameData.turnCardDataArr;
            // ?????????????????????????????????????????????
            if (gameData.curChairID === this.myChairID) {
                this.operationBtnWidgetCtrl.startOutCard(gameData.curChairID === gameData.turnWinerChairID);
            }
            // ???????????????
            this.showClock(gameData.curChairID, DDZModel.outcardtime, this.autoOutCard.bind(this));
        }
    },

    onDestroy: function () {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    },

    messageCallbackHandler: function (router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_RESPONSE) {
                if (msg.data.chairId === this.myChairID) {
                    Waiting.hide();
                }
            } else if (msg.type === roomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                if (!this.gameInited) return;
                // ????????????
                this.onUserEntryRoom(msg.data.roomUserInfo);
            } else if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if (!this.gameInited) return;
                // ??????????????????
                this.onUserLeaveRoom(msg.data.roomUserInfo);
            } else if (msg.type === roomProto.USER_READY_PUSH) {
                if (!this.gameInited) return;
                // ????????????
                // this.onUserReady(msg.data.chairId);
            }
            //??????418 ????????????????????????????????????
            else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo])
                this.gameInit(msg.data.roomUserInfoArr, msg.data.gameData);
            } else if (msg.type === roomProto.ROOM_USER_INFO_CHANGE_PUSH) {
                if (!this.gameInited) return;
                for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
                    if (this.roomUserInfoArr[i].userInfo.uid === msg.data.changeInfo.uid) {
                        this.roomUserInfoArr[i].userInfo = msg.data.changeInfo;
                        break;
                    }
                }
            } else if (msg.type === roomProto.ROOM_DISMISS_PUSH) {
                Confirm.show("????????????????????????", () => {
                    ViewMgr.goBackHall(Config.GameType.DDZ)
                })
            }
            // //???????????? ??????
            // else if (msg.type === RoomProto.USER_RECONNECT_PUSH) {
            //     Global.DialogManager.destroyDialog('Game/DDZ/DDZMainDialog');
            //     // NNModel.setGameData(msg.data.gameData);
            //     Global.DialogManager.createDialog('Game/DDZ/DDZMainDialog');
            // }
        } else if (router === 'GameMessagePush') {
            if (!this.gameInited) return;
            //????????????
            if (msg.type === DDZProto.GAME_SEND_CARD_PUSH) {
                this.onGameSendCard(msg.data.curChairID, msg.data.selfCardArr, msg.data.outcardtime);
            }
            //?????????????????????????????????
            else if (msg.type === DDZProto.GAME_SNATCH_LANDLORD_PUSH) {
                this.onUserSnatchLand(msg.data.chairID, msg.data.callbankerscore, msg.data.score, msg.data.curChairID, msg.data.outcardtime);
            }
            //??????????????????
            else if (msg.type === DDZProto.GAME_START_PUSH) {
                this.onGameStart(msg.data.landChairID, msg.data.landScore, msg.data.backCardArr);
            }
            //????????????
            else if (msg.type === DDZProto.GAME_USER_OUT_CARD_PUSH) {
                this.onUserOutCard(msg.data.chairID, msg.data.outCardArr, msg.data.curChairID, msg.data.leftCardCount, msg.data.outcardtime);
            }
            //??????
            else if (msg.type === DDZProto.GAME_USER_PASS_PUSH) {
                this.onUserPass(msg.data.chairID, msg.data.curChairID, msg.data.isNewTurn);
            }
            //????????????
            else if (msg.type === DDZProto.GAME_RESULT_PUSH) {
                this.onGameResult(msg.data);
            }
            //????????????
            else if (msg.type === DDZProto.GAME_USER_HOSTING_PUSH) {
                this.answerHostingPush(msg.data.chairID);
            }
            //??????????????????
            else if (msg.type === DDZProto.GAME_USER_DISSHOSTING_PUSH) {
                this.answerDissHostingPush(msg.data.chairID);
            }

        } else if (router === 'ReConnectSuccess') {
            if (Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(Global.Player.getPy('roomID'), function () {
                    // roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
                    // Global.DialogManager.destroyDialog('Game/DDZ/DDZMainDialog');
                    // Global.DialogManager.createDialog('Game/DDZ/DDZMainDialog');
                }, undefined, Config.GameType.DDZ);
            } else {
                this.exitGame();
            }
        }
    },
    answerHostingPush: function (chairID) {
        if (chairID === DDZModel.getMyChairId()) {
            this.dissmissHost.active = true;
            this.hostBtn.interactable = false;
            this.hostState = true;
        } else {
            let index = this.getUserChairIndex(chairID);
            this.tuoGuanArr[index].active = true;
        }
    },
    answerDissHostingPush: function (chairID) {
        if (chairID === DDZModel.getMyChairId()) {
            this.dissmissHost.active = false;
            this.hostBtn.interactable = true;
            this.hostState = false;
        } else {
            let index = this.getUserChairIndex(chairID);
            this.tuoGuanArr[index].active = false;
        }
    },

    onBtnClick: function (event, parameter) {
        if (!this.gameInited) return;
        Global.CCHelper.playPreSound();
        // AudioMgr.playCommonSoundClickButton();
        if (parameter === 'ready') {
            // let node = this.operationBtnWidgetCtrl.getClockNode();
            // if (!!node) node.destroyAllChildren();
            //
            // this.operationBtnWidgetCtrl.clearWidget();
            //
            // roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
        } else if (parameter === 'changeRoom') {

        } else if (parameter === 'point0') {
            this.onSelfSnatchLand(0);
        } else if (parameter === 'point1') {
            this.onSelfSnatchLand(1);
        } else if (parameter === 'point2') {
            this.onSelfSnatchLand(2);
        } else if (parameter === 'point3') {
            cc.log("====???3??? ????????????");
            this.onSelfSnatchLand(3);
        } else if (parameter === 'pass') {
            roomAPI.gameMessageNotify(DDZProto.gameUserPassNotify());
            // this.selfOutCardCallback(null, true, false);
        } else if (parameter === 'tip') {
            if (!!this.turnCardDataArr && this.turnCardDataArr.length > 0) {
                if (!this.handCardWidgetCtrl.searchOutCard(this.turnCardDataArr)) {
                    roomAPI.gameMessageNotify(DDZProto.gameUserPassNotify());
                }
            }
        } else if (parameter === 'outCard') {
            this.onClickOutCard();
        } else if (parameter === 'exit') {
            Confirm.show('???????????????????', function () {
                roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Waiting.show();
            }, function () {});
        } else if (parameter === 'settings') {
            let viewUrl = ViewMgr.getNodeUrl(this.node) + "/" + "MusicSetting";
            let prefabUrl = "GameCommon/MusicSetting/MusicSetting";
            Waiting.show();
            ViewMgr.open({
                viewUrl: viewUrl,
                prefabUrl: prefabUrl
            }, undefined, function () {
                Waiting.hide();
            });
            // let musicSetting = this.rulePoint.getChildByName("musicSetting");
            // if (musicSetting) {
            //     this.rulePoint.active = true;
            //     musicSetting.active = true;
            // }
            // else {
            //     let newPrefab = cc.instantiate(this.musicPrefab);
            //     newPrefab.parent = this.rulePoint;
            //     this.rulePoint.active = true;
            // }
        } else if (parameter === 'host') {
            roomAPI.gameMessageNotify(DDZProto.gameUserHostingNotify());
        } else if (parameter === 'dissHost') {
            roomAPI.gameMessageNotify(DDZProto.gameUserDissHostingNotify());
        }
        // else if (parameter === "rulePoint") {
        //     this.rulePoint.destroyAllChildren();
        //     this.rulePoint.active = false;

        // }
    },
    resetGame: function (isRetainReady) {
        // ????????????
        // this.handCardWidgetCtrl.resetWidget();
        // ??????????????????
        this.clearState(isRetainReady);
        // ??????????????????
        for (let i = 0; i < 3; ++i) {
            this.showOutCardNodeArr[i].removeAllChildren();
        }
        // ????????????
        // this.backCardNode.removeAllChildren();
        // ????????????
        for (let i = 0; i < 3; ++i) {
            if (i === 0) {
                let node = this.operationBtnWidgetCtrl.getClockNode();
                if (node) {
                    let ctrl = node.getChildByName("DDZClockWidget") && node.getChildByName("DDZClockWidget").getComponent('DDZClockWidgetCtrl');
                    ctrl.stopClock();
                }
                if (node) node.destroyAllChildren();
            } else {
                this.clockPosNodeArr[i].destroyAllChildren();
            }
        }
        // ????????????
        this.operationBtnWidgetCtrl.clearWidget();
        // ????????????
        for (let i = 1; i < 3; ++i) {
            this.cardCountLabelArr[i].node.parent.active = false;
        }
        // ???????????????
        this.turnCardDataArr = [];
        // ??????????????????
        this.landCapNode.destroy();
        this.landCapNode = null;
        this.bankerUserChairID = -1;
        // ??????????????????
        // for (let i = 0; i < this.showHandCardNode.length; ++i) {
        //     this.showHandCardNode[i].removeAllChildren();
        // }

        // ??????????????????
        this.stopSendCardAnimation();
    },

    onReconnection: function () {
        this.resetGame();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onUserEntryRoom: function (roomUserInfo) {
        // ????????????????????????????????????
        let index = this.getUserChairIndex(roomUserInfo.chairId);
        if (roomUserInfo.userInfo.uid == Global.Player.getPy('uid')) {
            this.nicknameLabelArr[index].string = roomUserInfo.userInfo.nickname;
        } else {
            this.nicknameLabelArr[index].string = Global.Player.convertNickname(roomUserInfo.userInfo.nickname);
        }
        this.vipLabelArr[index].string = "v" + roomUserInfo.userInfo.vipLevel;
        this.goldLabelArr[index].string = roomUserInfo.userInfo.gold.toFixed(2);
        var callFunc = function () {
            this.userIconSpriteArr[index].node.parent.active = true;
        };
        Global.CCHelper.updateSpriteFrame(roomUserInfo.userInfo.avatar, this.userIconSpriteArr[index], callFunc.bind(this));
        if (index > 0) this.nicknameLabelArr[index].node.parent.active = true;

        if ((roomUserInfo.userStatus & roomProto.userStatusEnum.READY) !== 0 && (roomUserInfo.userStatus & roomProto.userStatusEnum.PLAYING) === 0) {
            this.onUserReady(roomUserInfo.chairId);
        }
        this.roomUserInfoArr[roomUserInfo.chairId] = roomUserInfo;
    },

    onUserLeaveRoom: function (roomUserInfo) {
        // ??????????????????
        if (roomUserInfo.chairId === this.myChairID) {
            this.exitGame();
        } else {
            let index = this.getUserChairIndex(roomUserInfo.chairId);
            this.nicknameLabelArr[index].node.parent.active = false;

            // ??????????????????
            this.showTipNodeArr[index].getChildByName('ready').active = false;

            this.roomUserInfoArr[roomUserInfo.chairId] = null;
        }
    },

    updateUserInfo: function () {
        for (let i = 0; i < 3; ++i) {
            let roomUserInfo = this.roomUserInfoArr[i];
            if (i === this.myChairID) {
                let index = this.getUserChairIndex(i);
                this.goldLabelArr[index].string = Global.Player.getPy('gold').toString();
            } else {
                if (!!roomUserInfo) {
                    let index = this.getUserChairIndex(roomUserInfo.chairId);
                    this.goldLabelArr[index].string = roomUserInfo.userInfo.gold.toFixed(2);
                }
            }
        }
    },

    onUserReady: function (chairID) {
        // ??????????????????
        let index = this.getUserChairIndex(chairID);
        this.showTipNodeArr[index].getChildByName('ready').active = true;
    },
    //????????????
    onGameSendCard: function (curChairID, selfCardDataArr, outcardtime) {
        if (this.handCardWidgetCtrl.getAllCard().length !== 0) {
            this.handCardWidgetCtrl.resetWidget();
        }
        // ??????????????????
        this.clearState();
        // ????????????
        this.handCardWidgetCtrl.onSendCard(selfCardDataArr, true, function (index) {
            for (let i = 0; i < 3; ++i) {
                this.updateCardCount(i, index);
            }
            AudioMgr.playSound("Game/DDZ/Sound/sound_send_card");
            if (index === 17) {
                // ???????????????????????????????????????????????????
                this.onStartSnatchLand(curChairID, [1, 2, 3], outcardtime);
                // ????????????
                this.stopSendCardAnimation();
                this.hostBtn.interactable = true;
            }
        }.bind(this));
        // ??????????????????
        this.showSendCardAnimation();
        // ??????????????????
        for (let i = 0; i < 3; ++i) {
            this.updateCardCount(i, 17);
        }
    },
    //????????????
    onStartSnatchLand: function (curChairID, scoreArr, outcardtime) {
        // ???????????????????????????????????????
        if (curChairID === this.myChairID && !this.hostState) {
            this.operationBtnWidgetCtrl.startCallLand(scoreArr);
        }
        // ???????????????
        if (!this.hostState || curChairID !== this.myChairID)
            this.showClock(curChairID, outcardtime, this.autoCallScore.bind(this));
    },
    onSelfSnatchLand: function (score, bNotify) {
        // ???????????????
        let clockNode = this.operationBtnWidgetCtrl.getClockNode();
        if (!!clockNode) {
            let ctrl = clockNode.getChildByName("DDZClockWidget") && clockNode.getChildByName("DDZClockWidget").getComponent('DDZClockWidgetCtrl');
            ctrl && ctrl.stopClock();
            clockNode.destroyAllChildren();
        } else {
            console.log("=========selfOutCardCall");
        }
        // ????????????
        this.operationBtnWidgetCtrl.clearWidget();
        // ??????????????????
        if (!bNotify)
            roomAPI.gameMessageNotify(DDZProto.gameUserSnatchLandlordNotify(score));
    },
    //??????
    onUserSnatchLand: function (chairID, callbankerscore, score, curChairID, outcardtime) {
        if (chairID === this.myChairID) {
            // ????????????
            this.operationBtnWidgetCtrl.clearWidget();
        }
        // ??????????????????
        this.updateCallLandScore(chairID, score);
        // ???????????????
        let index = this.getUserChairIndex(chairID);
        this.clockPosNodeArr[index].destroyAllChildren();
        // ???????????????????????????
        if (curChairID >= 0) {
            this.onStartSnatchLand(curChairID, callbankerscore, outcardtime);
        }
    },
    //???????????? ?????????????????????
    onGameStart: function (landChairID, landScore, backCardArr) {
        // ????????????
        this.clearState();
        // ??????????????????
        this.bankerUserChairID = landChairID;
        this.showLandCapAnimation(this.bankerUserChairID, true);
        // ???????????????
        //this.showClock(landChairID, DDZProto.OUT_CARD_TIME, this.autoOutCard.bind(this));
        // ??????????????????
        this.landScoreLabel.string = landScore.toString();
        if (landChairID >= 0) {
            if (landChairID === this.myChairID) {
                this.handCardWidgetCtrl.addCard(backCardArr, function () {
                    this.handCardWidgetCtrl.cardNodeArr[this.handCardWidgetCtrl.cardNodeArr.length - 1].getChildByName("dizhuLogo").active = true;
                    this.handCardWidgetCtrl.startGame();
                    this.onUserStartOutCard(landChairID, true, DDZProto.OUT_CARD_TIME);
                }.bind(this));
            } else {
                this.handCardWidgetCtrl.startGame();
                this.onUserStartOutCard(landChairID, true, DDZProto.OUT_CARD_TIME);
                this.updateCardCount(landChairID, 20);
            }
        }
        // ????????????
        let cardNode = cc.instantiate(this.showOutCardWidgetPrefab);
        cardNode.getComponent("DDZShowOutCardWidgetCtrl").initWidget(backCardArr);
        this.backCardNode.active = true;
        cardNode.parent = this.backCardNode;
    },
    //????????????????????????,???????????????
    onUserStartOutCard: function (chairID, isNewTurn, outcardtime) {
        let index = this.getUserChairIndex(chairID);
        // ????????????????????????1??? ????????? ???
        let tipsNode = this.showTipNodeArr[index];
        for (let i = 0; i < tipsNode.children.length; ++i) {
            tipsNode.children[i].active = false;
        }
        //??????????????? ?????? ???????????????
        this.showOutCardNodeArr[index].removeAllChildren(); // ???????????????????????????
        if (chairID === this.myChairID) {
            if (!this.hostState) {
                this.operationBtnWidgetCtrl.startOutCard(isNewTurn);
                this.showClock(chairID, outcardtime, this.autoOutCard.bind(this));
            }
        } else {
            this.showClock(chairID, outcardtime, null);
        }

    },
    onClickOutCard: function () {
        let selectedCardDataArr = this.handCardWidgetCtrl.getSelectedCard();
        if (selectedCardDataArr.length === 0) {
            return;
        }
        // ???????????????????????????
        selectedCardDataArr = gameLogic.sortCardList(selectedCardDataArr);
        let cardType = gameLogic.getCardType(selectedCardDataArr);
        if (cardType === DDZProto.cardType.ERROR) {
            Tip.makeText('?????????????????????');
            return;
        }
        if (this.turnCardDataArr.length > 0) {
            if (!gameLogic.compareCard(this.turnCardDataArr, selectedCardDataArr)) {
                Tip.makeText('????????????????????????');
                return;
            }
        }
        roomAPI.gameMessageNotify(DDZProto.gameUserOutCardNotify(selectedCardDataArr));
    },
    //???????????? ?????????
    selfOutCardCallback: function (cardDataArr) {

        let clockNode = this.operationBtnWidgetCtrl.getClockNode();
        if (!!clockNode) {
            let ctrl = clockNode.getChildByName("DDZClockWidget") && clockNode.getChildByName("DDZClockWidget").getComponent('DDZClockWidgetCtrl');
            ctrl && ctrl.stopClock();
            clockNode.destroyAllChildren();
        } else {
            console.log("=========clockNode?????????");
        }
        // ????????????
        this.operationBtnWidgetCtrl.clearWidget();
        this.handCardWidgetCtrl.removeCard(cardDataArr);
        this.handCardWidgetCtrl.resetSearchOutCardState();
        let index = this.getUserChairIndex(this.myChairID);
        // ??????????????????
        this.playOutCardSound(!this.turnCardDataArr || this.turnCardDataArr.length === 0, cardDataArr);
        // ????????????
        let node = cc.instantiate(this.showOutCardWidgetPrefab);
        node.parent = this.showOutCardNodeArr[index];
        let ctrl = node.getComponent('DDZShowOutCardWidgetCtrl');
        this.scheduleOnce(function () {
            ctrl.initWidget(cardDataArr, index, DDZModel.getMyChairId());
            // ????????????
            this.playOutCardAnimation(cardDataArr, ctrl);
        }.bind(this), 0.15);


    },
    //???????????? ??????
    onUserOutCard: function (chairID, cardDataArr, curChairID, leftCardCount, outcardtime) {
        // ????????????
        let cardType = gameLogic.getCardType(cardDataArr);
        if (cardType >= DDZProto.cardType.BOMB_CARD) {
            this.landScoreLabel.string = (parseInt(this.landScoreLabel.string) * 2).toString();
        }
        if (chairID !== this.myChairID) {
            // ??????????????????
            this.playOutCardSound(!this.turnCardDataArr || this.turnCardDataArr.length === 0, cardDataArr);
            this.turnCardDataArr = cardDataArr;
            // ?????? ??????????????????
            let node = cc.instantiate(this.showOutCardWidgetPrefab);
            let index = this.getUserChairIndex(chairID);
            node.parent = this.showOutCardNodeArr[index];
            let ctrl = node.getComponent('DDZShowOutCardWidgetCtrl');
            ctrl.initWidget(cardDataArr, index, chairID);

            // ????????????
            this.playOutCardAnimation(cardDataArr, ctrl);
            // ???????????????
            let clockControl = this.clockPosNodeArr[index].getChildByName("DDZClockWidget") &&
                this.clockPosNodeArr[index].getChildByName("DDZClockWidget").getComponent('DDZClockWidgetCtrl');
            clockControl && clockControl.stopClock();
            this.clockPosNodeArr[index].destroyAllChildren();
            // ?????????????????????
            this.updateCardCount(chairID, leftCardCount);
        }
        //?????????????????????
        else {
            this.selfOutCardCallback(cardDataArr);
        }

        // ???????????????????????????
        if (curChairID >= 0) {
            this.onUserStartOutCard(curChairID, false, outcardtime);
        }
    },
    //??????
    playOutCardSound: function (isFirst, cardDataArr) {
        let cardType = gameLogic.getCardType(cardDataArr);
        if (cardType === DDZProto.cardType.SINGLE) {
            let value = gameLogic.getCardValue(cardDataArr[0]);
            AudioMgr.playSound("Game/DDZ/Sound/Man/Man_" + value);
        } else if (cardType === DDZProto.cardType.DOUBLE) {
            let value = gameLogic.getCardValue(cardDataArr[0]);
            AudioMgr.playSound("Game/DDZ/Sound/Man/Man_dui" + value);
        } else if (cardType === DDZProto.cardType.THREE) {
            let value = gameLogic.getCardValue(cardDataArr[0]);
            AudioMgr.playSound("Game/DDZ/Sound/Man/Man_tuple" + value);
        } else if (cardType === DDZProto.cardType.SINGLE_LINE) {
            if (isFirst) {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_shunzi");
            } else {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1, 3));
            }
        } else if (cardType === DDZProto.cardType.DOUBLE_LINE) {
            if (isFirst) {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_liandui");
            } else {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1, 3));
            }
        } else if (cardType === DDZProto.cardType.THREE_LINE) {
            if (isFirst) {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_feiji");
            } else {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1, 3));
            }
        } else if (cardType === DDZProto.cardType.THREE_LINE_TAKE_ONE) {
            if (isFirst) {
                if (cardDataArr.length === 4) {
                    AudioMgr.playSound("Game/DDZ/Sound/Man/Man_sandaiyi");
                } else {
                    AudioMgr.playSound("Game/DDZ/Sound/Man/Man_feiji");
                }
            } else {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1, 3));
            }
        } else if (cardType === DDZProto.cardType.THREE_LINE_TAKE_TWO) {
            if (isFirst) {
                if (cardDataArr.length === 5) {
                    AudioMgr.playSound("Game/DDZ/Sound/Man/Man_sandaiyidui");
                } else {
                    AudioMgr.playSound("Game/DDZ/Sound/Man/Man_feiji");
                }
            } else {
                AudioMgr.playSound("Game/DDZ/Sound/Man/Man_dani" + Global.Utils.getRandomNum(1, 3));
            }
        } else if (cardType === DDZProto.cardType.BOMB_CARD) {
            AudioMgr.playSound("Game/DDZ/Sound/Man/Man_zhadan");
        } else if (cardType === DDZProto.cardType.FOUR_LINE_TAKE_ONE) {
            AudioMgr.playSound("Game/DDZ/Sound/Man/Man_sidaier");
        } else if (cardType === DDZProto.cardType.FOUR_LINE_TAKE_TWO) {
            AudioMgr.playSound("Game/DDZ/Sound/Man/Man_sidailiangdui");
        } else if (cardType === DDZProto.cardType.MISSILE_CARD) {
            AudioMgr.playSound("Game/DDZ/Sound/Man/Man_wangzha");
        }
    },
    //????????????
    playOutCardAnimation: function (cardDataArr, ctrl) {
        let cardType = gameLogic.getCardType(cardDataArr);
        if (cardType === DDZProto.cardType.BOMB_CARD) {
            this.showZhadanAnimation();
        } else if (cardType === DDZProto.cardType.THREE_LINE_TAKE_ONE) {
            if (cardDataArr.length > 4) {
                this.showFeijiAnimation();
            }
        } else if (cardType === DDZProto.cardType.THREE_LINE_TAKE_TWO) {
            if (cardDataArr.length > 5) {
                this.showFeijiAnimation();
            }
        } else if (cardType === DDZProto.cardType.MISSILE_CARD) {
            this.showHuojianAnimation();
        } else if (cardType === DDZProto.cardType.SINGLE_LINE) {
            this.showShunziAnimation(null, ctrl);
        } else if (cardType === DDZProto.cardType.DOUBLE_LINE) {
            this.showLianduiAnimation(null, ctrl);
        }
    },
    //???????????????
    onUserPass: function (chairID, curChairID, isNewTurn) {
        // ??????pass??????
        let index = this.getUserChairIndex(chairID);
        this.showTipNodeArr[index].getChildByName('pass').active = true;

        if (chairID === this.myChairID) {
            this.handCardWidgetCtrl.resetCardPos();
            this.handCardWidgetCtrl.resetSearchOutCardState();
            let node = this.operationBtnWidgetCtrl.getClockNode();
            if (node) {
                let ctrl = node.getChildByName("DDZClockWidget") && node.getChildByName("DDZClockWidget").getComponent('DDZClockWidgetCtrl');
                ctrl.stopClock();
            }
            // ????????????
            this.operationBtnWidgetCtrl.clearWidget();
        } else {
            let node = this.clockPosNodeArr[index];
            if (node) {
                let ctrl = node.getChildByName("DDZClockWidget") && node.getChildByName("DDZClockWidget").getComponent('DDZClockWidgetCtrl');
                ctrl.stopClock();
            }
            this.clockPosNodeArr[index].destroyAllChildren();
        }
        if (isNewTurn) {
            this.turnCardDataArr = [];
        }
        // ???????????????????????????
        if (curChairID >= 0) {
            this.onUserStartOutCard(curChairID, isNewTurn, DDZProto.OUT_CARD_TIME);
        }
        AudioMgr.playSound("Game/DDZ/Sound/Man/Man_buyao1");
    },

    onGameResult: function (resultData) {
        this.profitPercentage = resultData.profitPercentage; // ????????????
        this.node.getChildByName("GameDropDownList").getComponent('GameDropDownList').setGameInfo(DDZModel.kindId, resultData.profitPercentage);
        // ???????????????????????????
        for (let i = 0; i < 3; ++i) {
            let index = this.getUserChairIndex(i);
            if (index === 0) continue;
            let cardArr = resultData.allCardArr[i];
            if (cardArr.length > 0) {
                for (let j = 0; j < cardArr.length; j += 10) {
                    let node = cc.instantiate(this.showHandCardWidgetPrefab);
                    let ctrl = node.getComponent('DDZShowHandCardWidgetCtrl');
                    ctrl.initWidget(cardArr.slice(j, j + 10), index);
                    node.parent = this.showHandCardNode[index];
                }
            }
        }
        // ????????????
        if ((resultData.isLandWin && this.bankerUserChairID === this.myChairID) || (!resultData.isLandWin && this.bankerUserChairID !== this.myChairID)) {
            AudioMgr.playSound("Game/DDZ/Sound/sound_win");
        } else {
            AudioMgr.playSound("Game/DDZ/Sound/sound_lose");
        }
        if (resultData.isSpring) {
            //??????????????????
            this.dragon.node.active = true;
            if (resultData.isLandWin) {
                this.dragon.playAnimation("chuntian", 1);
            } else {
                this.dragon.playAnimation("fanchuntian", 1);
            }
        }
        // ????????????
        this.scheduleOnce(function () {
            // ??????????????????
            let dialogParameters = {
                resultData: resultData,
                myChairID: this.myChairID,
                baseScore: this.baseScore,
                profitPercentage: this.profitPercentage,
                bankerUserChairID: this.bankerUserChairID,
                buttonEventCallback: this.onBtnClick.bind(this)
            };
            Global.DialogManager.createDialog('Game/DDZ/DDZResultDialog', dialogParameters, function () {
                this.resetGame();
                // ??????????????????
                // this.operationBtnWidgetCtrl.startReady();
                // ???????????????
                // this.showClock(this.myChairID, DDZProto.READY_TIME + 10, function () {
                //     roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
                //     Waiting.show();
                // }.bind(this));
            }.bind(this));

            // ??????????????????
            this.updateUserInfo();
        }.bind(this), 3);
        this.dissmissHost.active = false;

    },
    //??????????????? ?????? ????????? ????????????
    autoCallScore: function () {
        this.onSelfSnatchLand(0);
    },
    //????????????
    autoOutCard: function () {
        cc.log("=====autoOutCard");
        roomAPI.gameMessageNotify(DDZProto.gameUserHostingNotify());
    },

    showClock: function (chairID, time, timeOutCallback) {
        let node = cc.instantiate(this.clockWidgetPrefab);
        let ctrl = node.getComponent('DDZClockWidgetCtrl');
        let index = this.getUserChairIndex(chairID);
        if (index === 0) {
            let parentNode = this.operationBtnWidgetCtrl.getClockNode();
            cc.log("parentNode.parent.name:", parentNode.parent.name);
            if (parentNode.children.length > 0) {
                parentNode.destroyAllChildren();
                if (CC_DEV)
                    cc.log("===== CC_DEV parentNode.children.length:", parentNode.children.length);
            }
            node.parent = parentNode;
        } else {
            node.parent = this.clockPosNodeArr[index];
        }
        ctrl.stopClock();
        ctrl.startClock(time, (this.myChairID === chairID) ? timeOutCallback : null);
    },

    updateCardCount: function (chairID, count) {
        if (chairID === this.myChairID) return;
        let index = this.getUserChairIndex(chairID);
        this.cardCountLabelArr[index].node.parent.active = true;
        this.cardCountLabelArr[index].string = count.toString();
    },

    updateCallLandScore: function (chairID, count) {
        if (count < 0) return;
        let index = this.getUserChairIndex(chairID);
        let node = this.showTipNodeArr[index].getChildByName('point' + count);
        node.active = true;

        AudioMgr.playSound('Game/DDZ/Sound/Man/Man_fen' + count);
    },
    //????????????
    getUserChairIndex: function (chairID) {
        return (chairID - this.myChairID + 3) % 3;
    },
    //?????????????????????
    clearState: function (isRetainReady) {
        for (let i = 0; i < this.showTipNodeArr.length; ++i) {
            let node = this.showTipNodeArr[i];
            for (let j = 0; j < node.children.length; ++j) {
                if (isRetainReady && node.children[j].name === 'ready') {
                    if (node.children[j].active) continue;
                }
                node.children[j].active = false;
            }
        }
    },

    exitGame: function () {
        ViewMgr.goBackHall(Config.GameType.DDZ);
    },

    // ????????????
    showSendCardAnimation: function () {
        this.cardNode.active = true;
        this.schedule(this.createCard, 0.1);
    },

    // ??????????????????
    stopSendCardAnimation: function () {
        this.cardNode.active = false;
        this.unschedule(this.createCard)
    },

    // ????????????
    createCard: function () {
        let node0 = cc.instantiate(this.cardNode);
        node0.active = true;
        node0.parent = this.cardNode.parent;
        node0.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(0, -300)), cc.removeSelf()]));

        let node1 = cc.instantiate(this.cardNode);
        node1.active = true;
        node1.parent = this.cardNode.parent;
        node1.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(400, -100)), cc.removeSelf()]));

        let node2 = cc.instantiate(this.cardNode);
        node2.active = true;
        node2.parent = this.cardNode.parent;
        node2.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(-400, -100)), cc.removeSelf()]));
    },

    // ??????????????????
    showLandCapAnimation: function (landChairID, isTween) {
        if (!!this.landCapNode) {
            this.landCapNode.destroy();
            this.landCapNode = null;
        }
        this.landCapNode = Global.CCHelper.createSpriteNode("Game/DDZ/img_land_cap");
        let index = this.getUserChairIndex(landChairID);
        let endPosNode = this.landCapNodeArr[index];

        this.landCapNode.parent = endPosNode.parent;
        if (isTween) {
            this.landCapNode.scale = 3;
            let action1 = cc.scaleTo(0.2, 1.05);
            action1.easing(cc.easeIn(3));
            let action2 = cc.moveTo(0.2, endPosNode.position);
            action2.easing(cc.easeOut(3));
            let action3 = cc.scaleTo(0.2, 1);
            this.landCapNode.runAction(cc.sequence([action1, cc.delayTime(0.3), action2, action3]));
        } else {
            this.landCapNode.x = endPosNode.x;
            this.landCapNode.y = endPosNode.y;
        }
    },

    // ??????
    showShunziAnimation: function (pos, outCardCtrl) {
        if (!pos) pos = outCardCtrl.getCenterPos();
        let node = cc.instantiate(this.shunziAnimationPrefab);
        node.parent = this.animationNode;
        node.position = this.animationNode.convertToNodeSpaceAR(outCardCtrl.node.convertToWorldSpaceAR(pos));
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/shunzi/shunzi');
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3, cc.v2(0, 0));
        moveAction.easing(cc.easeOut(3));
        spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
    },

    // ??????
    showLianduiAnimation: function (pos, outCardCtrl) {
        if (!pos) pos = outCardCtrl.getCenterPos();
        let node = cc.instantiate(this.shunziAnimationPrefab);
        node.parent = this.animationNode;
        node.position = this.animationNode.convertToNodeSpaceAR(outCardCtrl.node.convertToWorldSpaceAR(pos));
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/shunzi/liandui');
        spriteNode.parent = node;
        spriteNode.x = -200;
        let moveAction = cc.moveTo(0.3, cc.v2(0, 0));
        moveAction.easing(cc.easeOut(3));
        spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
    },

    // ??????
    showFeijiAnimation: function () {
        let feijiSpriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/feiji/1q');
        feijiSpriteNode.parent = this.animationNode;
        feijiSpriteNode.x = -800;
        feijiSpriteNode.y = 0;
        let moveAction1 = cc.moveTo(0.6, cc.v2(0, 0));
        moveAction1.easing(cc.easeOut(2));
        let moveAction2 = cc.moveTo(0.6, cc.v2(800, 0));
        moveAction2.easing(cc.easeIn(2));
        feijiSpriteNode.runAction(cc.sequence([moveAction1, moveAction2, cc.removeSelf()]));

        this.scheduleOnce(function () {
            let node = cc.instantiate(this.shunziAnimationPrefab);
            node.parent = this.animationNode;
            node.x = 0;
            node.y = -100;
            let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });

            let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/feiji/1w');
            spriteNode.parent = node;
            spriteNode.x = -200;
            spriteNode.y = 0;
            let moveAction = cc.moveTo(0.3, cc.v2(0, 0));
            moveAction.easing(cc.easeOut(2));
            spriteNode.runAction(cc.sequence([moveAction, cc.fadeOut(0.4), cc.removeSelf()]));
        }.bind(this), 0);
    },

    // ??????
    showZhadanAnimation: function () {
        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/zhadan/o');
        spriteNode.x = -200;
        spriteNode.parent = this.animationNode;
        spriteNode.runAction(cc.sequence([cc.jumpTo(0.3, cc.v2(0, 0), 100, 1), cc.callFunc(function () {
            let node = cc.instantiate(this.zhandanAnimationPrefab);
            node.parent = this.animationNode;
            let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });
            spriteNode.removeFromParent();

            let zhandanNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/zhadan/1');
            zhandanNode.scale = 0.6;
            let action1 = cc.scaleTo(0.5, 1);
            action1.easing(cc.easeBackOut());
            zhandanNode.runAction(cc.sequence([action1, cc.delayTime(0.2), cc.fadeOut(0.3), cc.removeSelf()]));
            zhandanNode.parent = this.animationNode;
        }.bind(this))]));
    },

    // ??????
    showHuojianAnimation: function () {
        let node = cc.instantiate(this.huojianAnimationPrefab);
        node.parent = this.animationNode;
        let ctrl = node.getComponent('SpriteFrameAnimationWidgetCtrl');
        ctrl.startAnimation(false, 1, function () {
            ctrl.node.removeFromParent();
        });

        let spriteNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/huojian/11111111');
        spriteNode.parent = this.animationNode;
        let huojianAction1 = cc.moveTo(0.5, cc.v2(0, 1000));
        huojianAction1.easing(cc.easeIn(1.5));
        let huojianAction2 = cc.moveTo(0.8, cc.v2(0, 0));
        huojianAction2.easing(cc.easeIn(2));
        spriteNode.runAction(cc.sequence([huojianAction1, cc.callFunc(function () {
            spriteNode.scaleY = -1;
        }.bind(this)), huojianAction2, cc.callFunc(function () {
            let nodeGuang = cc.instantiate(this.huojianGuangAnimationPrefab);
            nodeGuang.parent = this.animationNode;
            let ctrl = nodeGuang.getComponent('SpriteFrameAnimationWidgetCtrl');
            ctrl.startAnimation(false, 1, function () {
                ctrl.node.removeFromParent();
            });

            let zhandanNode = Global.CCHelper.createSpriteNode('Game/DDZ/Animation/huojian/2222');
            zhandanNode.scale = 0.6;
            let action1 = cc.scaleTo(0.5, 1);
            action1.easing(cc.easeBackOut());
            zhandanNode.runAction(cc.sequence([action1, cc.delayTime(0.2), cc.fadeOut(0.3), cc.removeSelf()]));
            zhandanNode.parent = this.animationNode;
        }.bind(this)), cc.removeSelf()]));
    }
});