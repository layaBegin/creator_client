var TWModel = require('./TWModel');
var TWLogic = require('./TWLogic');
var roomAPI = require('../../API/RoomAPI');
var RoomProto = require('../../API/RoomProto');
var GameProto = require('./TWProto');
var enumeration = require('../../Shared/enumeration');

let READY_MAX_WAIT_TIME = 15;

cc.Class({
    extends: cc.Component,

    properties: {
        headItemArr: [require('TWHeadItem')],
        cardItemArr: [require('TWCardItem')],
        glassSprite: cc.Sprite,

        readyBtn: cc.Node,

        sortCardWidgetPrefab: cc.Prefab,
        guaiPaiTipWidgetPrefab: cc.Prefab,

        Label_baseScore: cc.Label,

        waitNextTip: cc.Node,

        dropDownList: cc.Node,


        ani_ksbp: dragonBones.ArmatureDisplay,

        clock: cc.Node,
        Label_leftTime: cc.Label
    },
    gameTypeID: "",

    onLoad: function () {
        this.gameInited = false;
        this.sortCardWidgetCtrl = null;

        this.readyScheduler = null;

        this.delayChairID_arr = [];

        this.clockTime = 0;

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        Global.MessageCallback.addListener('SelfEntryRoomPush', this);

        //this.dropDownList.getComponent("GameDropDownList").setGameInfo(enumeration.gameType.SSS);
        roomAPI.roomMessageNotify(RoomProto.userReadyNotify(true)); // 自动准备
    },

    start: function () {
        roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
    },

    onDestroy: function () {
        TWModel.onDestroy();

        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        Global.MessageCallback.removeListener('SelfEntryRoomPush', this);
    },

    onButtonClick: function (event, param) {
        if (param === 'rule') {
            Global.DialogManager.createDialog('GameCommon/GameRule/GameRuleDialog', {
                kind: Global.Enum.gameType.SSS
            });
        } else if (param === 'setting') {
            Global.DialogManager.createDialog('Setting/SettingDialog');
        } else if (param === 'exit_room') {
            Confirm.show("是否要退出房间？", function () {
                // 发送退出房间的请求
                Global.API.room.roomMessageNotify(RoomProto.userLeaveRoomNotify());
                Waiting.show();
            }, function () {});
        } else if (param === 'continue_game') {
            roomAPI.roomMessageNotify(RoomProto.userReadyNotify(true));
            // this.readyBtn.active = false;
            this.onUserReady(TWModel.myChairId);
            for (let i = 0; i < this.cardItemArr.length; ++i) {
                this.cardItemArr[i].node.active = false;
            }

            if (!!this.readyScheduler) {
                this.unschedule(this.readyScheduler);
                this.readyScheduler = null;
            }
        }
    },

    messageCallbackHandler: function (router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
                /**
                 * 此处整个服务端存在一个Bug : 客户端请求离开房间时 如果服务端禁止玩家离开，依然会下发此协议导致玩家退出游戏
                 * 所以玩家自己离开房间的处理全部放在 USER_LEAVE_ROOM_PUSH(404) 协议中 
                 * by pigger
                 */
                if (msg.data.chairId === TWModel.myChairId) {
                    Waiting.hide()
                }
            } else if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                if (!this.gameInited) return;
                this.onUserEntry(msg.data.roomUserInfo);
            } else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                if (!this.gameInited) return;
                this.onUserLeave(msg.data.roomUserInfo.chairId);
            } else if (msg.type === RoomProto.USER_READY_PUSH) {
                if (!this.gameInited) return;
                this.onUserReady(msg.data.chairId);
            } else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo])
                // 初始化界面场景
                this.gameInit(msg.data);
            } else if (msg.type === RoomProto.ROOM_USER_INFO_CHANGE_PUSH) {
                if (!this.gameInited) return;
                TWModel.updatePlayer(msg.data.changeInfo);
            } else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
                Confirm.show("当前房间已解散！", () => {
                    ViewMgr.goBackHall(Config.GameType.SSS)
                })
            }
        } else if (router === 'GameMessagePush') {
            if (!this.gameInited) return;
            if (msg.type === GameProto.GAME_CARDS_PUSH) {
                this.onSendCards(msg.data);
            } else if (msg.type === GameProto.GAME_CARDS_SORT_PUSH) {
                this.onCardSort(msg.data);
            } else if (msg.type === GameProto.GAME_RESOUT_PUSH) {
                this.onGameResult(msg.data);
            } else if (msg.type === GameProto.GAME_CARDS_NOSORT_PUSH) {
                console.log("=====================收到免摆数据", msg, this.myChairId);
                this.onCardNoSort(msg.data);
            } else if (msg.type === GameProto.GAME_CARDS_DELAY_PUSH) {
                if (this.sortCard != null && msg.data.chairId == TWModel.getMyChairId()) {
                    this.sortCard.setDelayTime();
                }
                if (this.delayChairID_arr.indexOf(msg.data.chairId) < 0) {
                    this.delayChairID_arr.push(msg.data.chairId);
                    let index = TWModel.getIndexByChairId(msg.data.chairId);
                    this.cardItemArr[index].setDelayStatus();
                }
            }
        } else if (router === 'ReConnectSuccess') {
            if (Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(TWModel.roomID, () => {
                    // Global.DialogManager.destroyDialog('ThirteenWater/TWMainDialog');
                    // Global.DialogManager.destroyDialog('ThirteenWater/TWSortCard');
                    //this.onReconnection();
                }, undefined, Config.GameType.SSS);
            } else {
                this.exitGame();
            }

        }
    },

    gameInit: function (data) {
        console.log("=============初始化场景数据::", data);
        this.gameInited = true;
        this.gameTypeID = data.gameTypeInfo.gameTypeID;
        this.baseScore = data.gameTypeInfo.baseScore;
        this.Label_baseScore.string = this.baseScore;
        this.profitPercentage = data.gameData.profitPercentage;

        this.dropDownList.getComponent('GameDropDownList').setGameInfo(Global.Enum.gameType.SSS, this.profitPercentage);
        TWModel.init(data);
        for (let i = 0; i < 4; ++i) {
            this.cardItemArr[TWModel.getIndexByChairId(i)].setChairId(i);
        }
        for (let i = 0; i < 4; ++i) {
            this.headItemArr[TWModel.getIndexByChairId(i)].setChairId(i);
        }
        this.readyBtn.active = false;
        // this.readyBtn.active = (TWModel.gameStatus === GameProto.GAME_STATUS_NOTSTART);
        // 开启准备定时器
        // if (!!this.readyBtn.active) {
        //     if (!!this.readyScheduler) {
        //         this.unschedule(this.readyScheduler);
        //     }
        //     this.readyScheduler = function () {
        //         // 发送退出房间的请求
        //         Global.API.room.roomMessageNotify(RoomProto.userLeaveRoomNotify());

        //         Confirm.show("由于您长时间未准备，已离开房间", function () { });
        //     };
        //     this.scheduleOnce(this.readyScheduler, READY_MAX_WAIT_TIME);
        // }

        // 游戏中显示摆牌界面
        if (TWModel.gameStatus === GameProto.GAME_STATUS_GAMEING) {
            if (!TWModel.hasSortCard(TWModel.myChairId)) {
                let index = TWModel.playingChairArr.indexOf(TWModel.myChairId);
                if (index < 0) {
                    this.waitNextTip.active = true;
                    return;
                }
                let myCardArr = TWModel.getCardsArr()[index];
                if (this.sortCard == null) {
                    let node = cc.instantiate(this.sortCardWidgetPrefab);
                    node.parent = this.node;
                    // this.sortCardWidgetCtrl = node.getComponent('TWSortCardWidgetCtrl');
                    // this.sortCardWidgetCtrl.setCardArr(myCardArr);
                    this.sortCard = node.getComponent('TWSortCard');
                    this.sortCard.setCards(myCardArr, data.gameData.statusTime);
                } else {
                    this.sortCard = node.getComponent('TWSortCard');
                    this.sortCard.setCards(myCardArr, data.gameData.statusTime);
                }

                // if (TWLogic.hasGuaipai(myCardArr)) {
                //     let guaiPaiNode = cc.instantiate(this.guaiPaiTipWidgetPrefab);
                //     guaiPaiNode.parent = this.node;
                //     guaiPaiNode.getComponent('TWGuaipaiTipWidgetCtrl').setLabel(myCardArr);
                // }
            }
        } else if (TWModel.gameStatus === GameProto.GAME_STATUS_SETTLE) {
            if (!!this.sortCard) {
                this.sortCard.node.active = false;
            }

            // 计算结束时间
            this.scheduleOnce(this.onShowGameResultFinished.bind(this), data.gameData.statusTime + 2);

            this.waitNextTip.active = true;
        }

        this.delayChairID_arr = [];

        this.ani_ksbp.node.active = false;
    },

    onReconnection: function () {
        roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
    },

    onUserEntry: function (roomUserInfo) {
        TWModel.addPlayer(roomUserInfo);

        let headItemCtrl = this.headItemArr[TWModel.getIndexByChairId(roomUserInfo.chairId)];
        headItemCtrl.node.active = true;
        headItemCtrl.setChairId(roomUserInfo.chairId);
    },

    onUserLeave: function (chairId) {
        // if (chairId === TWModel.myChairId) return;
        if (chairId === TWModel.myChairId) { // 如果是自己离开
            if (!Matching.isMatching) {
                this.exitGame();
            }
            return;
        }
        TWModel.delPlayer(chairId);
        let headItem = this.headItemArr[TWModel.getIndexByChairId(chairId)];
        headItem.node.active = false;
    },

    onUserReady: function (chairID) {
        TWModel.setPlayerReady(chairID);
        let headItem = this.headItemArr[TWModel.getIndexByChairId(chairID)];
        // if (!!headItem) {
        //     headItem.setReady(true);
        // }
    },

    onSendCards: function (data) {
        TWModel.setCardsPushData(data.cardsArr, data.playingChairArr);

        let cardsArr = data.cardsArr;
        let myCardArr = cardsArr[data.playingChairArr.indexOf(TWModel.getMyChairId())];
        this.scheduleOnce(function () {
            let node = cc.instantiate(this.sortCardWidgetPrefab);
            node.parent = this.node;
            // this.sortCardWidgetCtrl = node.getComponent("TWSortCardWidgetCtrl");
            // this.sortCardWidgetCtrl.setCardArr(myCardArr);
            this.sortCard = node.getComponent('TWSortCard');
            this.sortCard.setCards(myCardArr, data.Statustime, data.Statusaddtime);

            // if (TWLogic.hasGuaipai(myCardArr)) {
            //     let guaiPaiNode = cc.instantiate(this.guaiPaiTipWidgetPrefab);
            //     guaiPaiNode.parent = this.node;
            //     guaiPaiNode.getComponent('TWGuaipaiTipWidgetCtrl').setLabel(myCardArr);
            // }
        }.bind(this), 2.5);

        for (let i = 0; i < this.cardItemArr.length; ++i) {
            this.cardItemArr[i].onSendCardPush();
        }

        for (let i = 0; i < this.headItemArr.length; ++i) {
            this.headItemArr[i].onGameStart();
        }
    },

    onCardSort: function (data) {
        console.log("=============摆牌数据推送::", data)
        TWModel.insertSortChairArr(data.chairId);
        TWModel.cardsArr[data.chairId] = data.cardArr;

        if (data.chairId === TWModel.myChairId) {
            this.clockTime = this.sortCard.getClockTime();

            if (!data.isNosort) {
                console.log("========自己不免摆")
                // this.sortCardWidgetCtrl.setCardArr(data.cardArr);
                this.sortCard.setCards(data.cardArr);
            }
        }

        if (data.chairId === TWModel.myChairId) {
            this.clock.active = true;
            if (!!this.clockScheduler)
                this.unschedule(this.clockScheduler)
            this.Label_leftTime.string = this.clockTime;
            this.schedule(this.clockScheduler.bind(this), 1);

            console.log("========销毁摆牌界面")

            // this.sortCardWidgetCtrl.node.destroy();
            this.sortCard.node.destroy();
        }

        let cardItem = this.cardItemArr[TWModel.getIndexByChairId(data.chairId)];
        if (cardItem) {
            cardItem.onSortCardsPush();
        }
    },

    clockScheduler: function () {
        this.clockTime--;

        if (this.clockTime <= 0)
            this.clock.active = false;
        else
            this.Label_leftTime.string = this.clockTime;
    },

    onCardNoSort: function (data) {
        TWModel.setMianbai(data.chairId);

        let cardItem = this.cardItemArr[(data.chairId + 4 - TWModel.myChairId) % 4];
        cardItem.getComponent('TWCardItem').onShowGuaiPai();
    },

    onGameResult: function (data) {
        AudioMgr.playSound('ThirteenWater/TWSound/tw_kaiju');

        TWModel.setResoutData(data.resout);

        this.profitPercentage = data.profitPercentage;

        this.dropDownList.getComponent('GameDropDownList').setGameInfo(Global.Enum.gameType.SSS, this.profitPercentage);


        this.ani_ksbp.node.active = true;

        this.scheduleOnce(function () {
            this.ani_ksbp.node.active = false;

            for (let i = 0; i < TWModel.playingChairArr.length; ++i) {
                let cardItem = this.cardItemArr[TWModel.getIndexByChairId(TWModel.playingChairArr[i])];
                cardItem.showCard(data.resout, this.onShowGameResultFinished.bind(this));
            }
        }.bind(this), 2)

        this.clock.active = false;
        if (!!this.clockScheduler)
            this.unschedule(this.clockScheduler);
    },

    onShowGameResultFinished: function () {
        this.waitNextTip.active = false;

        // this.readyBtn.active = true;
        continueBtn.show(this.gameTypeID);

        for (let i = 0; i < this.headItemArr.length; ++i) {
            this.headItemArr[i].updateUserInfo();
        }

        if (!!this.readyScheduler) {
            this.unschedule(this.readyScheduler);
        }
        // this.readyScheduler = function () {
        //     // 发送退出房间的请求
        //     Global.API.room.roomMessageNotify(RoomProto.userLeaveRoomNotify());
        //     Waiting.show("", true);
        //     Confirm.show("由于您长时间未准备，已离开房间", function () { });
        // };
        // this.scheduleOnce(this.readyScheduler, READY_MAX_WAIT_TIME);

        let curChairIndex = TWModel.getIndexByChairId(TWModel.getMyChairId());
        let curCardItemIndex = this.cardItemArr[curChairIndex].curCardItemIndex;
        let headItemCtrl = this.headItemArr[curChairIndex];
        let resultSocre = TWLogic.getResultScore(TWModel.getResout(), curCardItemIndex, this.baseScore);
        if (resultSocre > 0)
            headItemCtrl.resultScoreChanged(resultSocre * (1 - (this.profitPercentage) / 100));
        else
            headItemCtrl.resultScoreChanged(resultSocre);
    },

    answerRoomDismisssPush: function (reason) {
        Global.Player.setPy('roomID', 0);
        if (reason === RoomProto.roomDismissReason.NONE) {
            /* 正常结束 */
        } else if (reason === RoomProto.roomDismissReason.RDR_OWENER_ASK) {
            /* 房主解散 */
            if (TWModel.getMyChairId() !== 0) {
                Confirm.show('因房主退出房间,房间解散', function () {
                    this.exitGame();
                }.bind(this));
            } else {
                this.exitGame();
            }
        } else if (reason === RoomProto.roomDismissReason.RDR_USER_ASK) {
            /* 游戏中,请求结束 */
            this.node.getChildByName('ExitButton').active = true;
        } else if (reason === RoomProto.roomDismissReason.RDR_TIME_OUT) {
            /* 超时未响应 */
        }
    },

    answerExitRoomPush: function (data) {
        let arr = data.chairIdArr;
        let myChairId = TWModel.getMyChairId();
        let count = 0,
            i;
        for (i = 0; i < arr.length; ++i) {
            if (arr[i] !== null) {
                ++count;
            }
        }
        if (count === 1 && arr[myChairId] === null) {
            Global.DialogManager.createDialog('ThirteenWater/TWDismissDialog');
        }
    },

    answerNosortPush: function (chairId, isNosort) {
        if (isNosort) {
            TWModel.setMianbai(chairId);
        }
    },

    answerGameResoutPush: function (data) {},

    answerGameEndPush: function (data) {
        if (!this.cardItemArr[0].getComponent('TWCardItem').getIsOnAnimal()) {
            Global.DialogManager.createDialog('ThirteenWater/TWSettleAllDialog', null, function (err, dialog) {
                dialog.getComponent('TWSettleAllDialog').showResout(TWModel.getGameEndData());
            });
        }
    },

    answerGamePreparePush: function (data) {
        //TWModel.setGamePrepareData(data);
    },

    answerGameCardSortPush: function (chairId) {
        if (chairId === TWModel.getMyChairId()) {
            Global.DialogManager.destroyDialog('ThirteenWater/TWSortCardDialog');
        }
    },

    exitGame: function () {
        ViewMgr.goBackHall(Config.GameType.SSS);
    },

    getHeadItemByChairId: function (chairId) {
        let myChairId = TWModel.getMyChairId();
        return this.headItemArr[(chairId + 4 - myChairId) % 4].getChildByName('chatPos');
    },

    glassAnimal: function (cb) {
        AudioMgr.playSound('ThirteenWater/TWSound/tw_suiboli');
        this.scheduleOnce(function () {
            AudioMgr.playSound('ThirteenWater/TWSound/tw_sanchuan');
        }, 0.5);
        this.glassSprite.node.active = true;
        this.scheduleOnce(function () {
            this.glassSprite.node.active = false;
            if (!!cb) {
                cb();
            }
        }.bind(this), 1.5);
    }
});