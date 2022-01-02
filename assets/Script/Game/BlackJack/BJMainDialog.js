let roomProto = require('../../API/RoomProto');
let gameProto = require('./BJProto');
let roomAPI = require('../../API/RoomAPI');
let gameLogic = require('./BJGameLogic');
var enumeration = require('../../Shared/enumeration');
let BJAudio = require("./BJAudio");

cc.Class({
    extends: cc.Component,

    properties: {
        userHeadCtrlArr: [require('GameHeadController')],
        readyBtnNode: cc.Node,
        clockWidgetCtrl: require('BJClockWidgetCtrl'),
        betWidgetCtrl: require('BJBetWidgetCtrl'),
        handCardWidgetCtrlArr: [require('BJHandCardWidgetCtrl')],
        bankerHandCardCtrl: require('BJHandCardWidgetCtrl'),
        operationWidgetCtrl: require('BJOperationWidgetCtrl'),
        userStatusNodeArr: [cc.Node],
        showBetWidgetCtrlArr: [require('BJShowBetWidgetCtrl')],

        dropDownList: cc.Node,
        sp_arrowTip_arr: {
            default: [],
            type: cc.Sprite
        },
        sp_baoxian_arr: {
            default: [],
            type: cc.Sprite
        }
    },

    onLoad: function () {
        this.gameInited = false;

        this.myChairID = -1;
        this.roomID = "";

        this.betCountArr = [0, 0, 0, 0, 0];

        this.playingStatusArr = [];

        this.roomUserInfoArr = [];

        this.curUserIndex = -1;
        this.curCardIndex = -1;

        this.arrowTipPosY_arr = [this.sp_arrowTip_arr[0].node.position.y,
        this.sp_arrowTip_arr[1].node.position.y,
        this.sp_arrowTip_arr[2].node.position.y,
        this.sp_arrowTip_arr[3].node.position.y,
        this.sp_arrowTip_arr[4].node.position.y
        ];

        // 初始化
        this.betWidgetCtrl.initWidget();

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        //this.dropDownList.getComponent("GameDropDownList").setGameInfo(enumeration.gameType.BJ);

        // 获取场景
        setTimeout(() => {
            if (!cc.isValid(this)) {
                return;
            }

            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 200);
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
                // 设置信息
                this.onUserEntryRoom(msg.data.roomUserInfo);
            } else if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if (!this.gameInited) return;
                // 删除用户信息
                this.onUserLeaveRoom(msg.data.roomUserInfo);
            } else if (msg.type === roomProto.USER_READY_PUSH) {
                if (!this.gameInited) return;
                // 用户准备
                this.onUserReady(msg.data.chairId);
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo])
                this.gameInit(msg.data.roomUserInfoArr, msg.data.gameData);
            } else if (msg.type === roomProto.ROOM_USER_INFO_CHANGE_PUSH) {
                if (!this.gameInited) return;
                for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
                    if (this.roomUserInfoArr[i] &&
                        this.roomUserInfoArr[i].userInfo &&
                        this.roomUserInfoArr[i].userInfo.uid === msg.data.changeInfo.uid) {
                        this.roomUserInfoArr[i].userInfo = msg.data.changeInfo;
                        break;
                    }
                }
            } else if (msg.type === roomProto.ROOM_DISMISS_PUSH) {
                Confirm.show("当前房间已解散！", () => {
                    ViewMgr.goBackHall(Config.GameType.BJ)
                })
            }
        } else if (router === 'GameMessagePush') {
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_START_PUSH) {
                this.onGameStart(msg.data.playingStatusArr, msg.data);
            } else if (msg.type === gameProto.GAME_SEND_CARD_PUSH) {
                this.onGameSendCard(msg.data.bankerCardArr, msg.data.userCardArr, msg.data);
            } else if (msg.type === gameProto.GAME_USER_BET_PUSH) {
                console.log("debug 玩家下注::", msg);
                this.onUserBet(msg.data.chairID, msg.data.count);
            } else if (msg.type === gameProto.GAME_USER_ADD_CARD_PUSH) {
                this.onUserAddCard(msg.data.chairID, msg.data.index, msg.data.userCardArr);
            } else if (msg.type === gameProto.GAME_USER_DOUBLE_BET_PUSH) {
                this.onUserDouble(msg.data.chairID, msg.data.index, msg.data.userCardArr);
            } else if (msg.type === gameProto.GAME_USER_CUT_CARD_PUSH) {
                this.onUserCutCard(msg.data.chairID, msg.data.userCardArr);
            } else if (msg.type === gameProto.GAME_USER_STOP_CARD_PUSH) {
                this.onUserStopCard(msg.data.chairID, msg.data.index);
            } else if (msg.type === gameProto.GAME_END_PUSH) {
                this.onGameResult(msg.data);
            } else if (msg.type === gameProto.GAME_USER_BUY_INSURANCE_PUSH) {
                this.onUserBuyInsurance(msg.data.chairID, msg.data.isBuy);
            } else if (msg.type === gameProto.GAME_INSURANCE_RESULT_PUSH) {
                this.onGameInsuranceResult();
            } else if (msg.type === gameProto.GAME_OPERATION_PLAYER_PUSH) {
                this.onUserOperation(msg.data.curtplayer, msg.data);
            }
        } else if (router === 'ReConnectSuccess') {
            if (Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(Global.Player.getPy('roomID'), () => {
                    // roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());                 
                }, undefined, Config.GameType.BJ);
            } else {
                this.exitGame();
            }
        }
    },

    onBtnClick: function (event, parameter) {
        if (!this.gameInited) return;
        //AudioMgr.playCommonSoundClickButton();
        Global.CCHelper.playPreSound();
        if (parameter === 'ready') {
            this.clockWidgetCtrl.stopClock();
            this.readyBtnNode.active = false;
            // 清理游戏桌面
            this.resetGame();
            roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
        }
    },

    gameInit: function (roomUserInfoArr, gameData) {
        this.gameInited = true;
        this.gameTypeInfo = gameData.gameTypeInfo;
        let maxBetScore = gameData.parameters.maxbetScore;
        if (!!maxBetScore) {
            this.betWidgetCtrl.setMaxBetScore(maxBetScore);
        }
        // 获取自己的位置
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            let roomUserInfo = roomUserInfoArr[i];
            if (roomUserInfo.userInfo.uid === Global.Player.getPy('uid')) {
                this.myChairID = roomUserInfo.chairId;
                break;
            }
        }
        // 设置用户信息
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            this.onUserEntryRoom(roomUserInfoArr[i]);
        }
        // 记录抽水比例
        this.profitPercentage = gameData.profitPercentage;

        this.dropDownList.getComponent("GameDropDownList").setGameInfo(enumeration.gameType.BJ, this.profitPercentage);
        // 未开局状态
        if (gameData.gameStatus === gameProto.gameStatus.NONE) {
            // 显示准备按钮
            //this.readyBtnNode.active = true;
            roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
            // 设置定时器
            //this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "ready", this.autoOperation.bind(this));
        } else if (gameData.gameStatus === gameProto.gameStatus.WAIT_BET) {
            let betCountArr = gameData.betCountArr;
            this.betCountArr = betCountArr;
            this.playingStatusArr = gameData.playingStatusArr;
            for (let i = 0; i < betCountArr.length; ++i) {
                if (!this.playingStatusArr[i]) continue;
                let index = this.getUserChairIndex(i);
                // 初始化筹码显示组件
                let headCtrl = this.userHeadCtrlArr[index];
                this.showBetWidgetCtrlArr[index].initWidget(headCtrl.getHeadPos(), betCountArr[i]);
                // 设置金币
                if (!!betCountArr[i]) {
                    this.updateUserStatus(this.myChairID, null);
                    headCtrl.goldChange(-betCountArr[i], false);
                } else {
                    this.updateUserStatus(this.myChairID, "bet");
                    if (i === this.myChairID) {
                        // 开始下注
                        this.betWidgetCtrl.startBet(headCtrl.getUserInfo().gold, this.selfBet.bind(this));
                        // 开启定时器
                        //this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "bet", this.autoOperation.bind(this));
                    }
                    if (gameData.worktime)
                        this.startUserHeadCtrlClock(true, i, gameData.worktime);
                }
            }
        } else if (gameData.gameStatus === gameProto.gameStatus.WAIT_BUY_INSURANCE) {
            this.betCountArr = gameData.betCountArr;
            this.playingStatusArr = gameData.playingStatusArr;
            let allUserCardArr = gameData.allUserCardArr;

            // 初始化庄家牌
            this.bankerHandCardCtrl.initWidget([gameData.bankerCardArr, null]);
            for (let i = 0; i < this.playingStatusArr.length; ++i) {
                if (!this.playingStatusArr[i]) continue;
                let index = this.getUserChairIndex(i);
                // 设置扑克牌
                this.handCardWidgetCtrlArr[index].initWidget(allUserCardArr[i]);
                // 设置下注金额
                let headPos = this.userHeadCtrlArr[index].getHeadPos();
                this.showBetWidgetCtrlArr[index].initWidget(headPos, gameData.betCountArr[i]);
                // 设置实际金币数
                let totalGold = 0;
                totalGold += this.betCountArr[i];
                if (!!gameData.buyInsuranceStatus[i]) {
                    totalGold += this.betCountArr[i] * 0.5;
                }
                this.userHeadCtrlArr[index].goldChange(-totalGold, false);
            }

            if (gameData.buyInsuranceStatus[this.myChairID] === null && !!this.playingStatusArr[this.myChairID]) {
                Confirm.show("庄家可能会拿到黑杰克，是否购买保险？", function () {
                    this.selfBuyInsurance(true);
                }.bind(this), function () {
                    this.selfBuyInsurance(false);
                }.bind(this));
                if (!!gameData.worktime)
                    this.clockWidgetCtrl.startClock(gameData.worktime - 3, "insurance", this.autoOperation.bind(this));
            }
            for (let i = 0; i < gameData.buyInsuranceStatus.length; i++) {
                if (gameData.buyInsuranceStatus[i] === null &&
                    !!this.playingStatusArr[i] &&
                    !!gameData.worktime) {
                    this.startUserHeadCtrlClock(true, i, gameData.worktime);
                }
            }
        } else if (gameData.gameStatus === gameProto.gameStatus.PLAYING) {
            let allUserCardArr = gameData.allUserCardArr;
            let stopCardStatusArr = gameData.stopCardStatusArr;
            this.betCountArr = gameData.betCountArr;
            this.playingStatusArr = gameData.playingStatusArr;

            // 初始化庄家牌
            this.bankerHandCardCtrl.initWidget([gameData.bankerCardArr, null]);

            for (let i = 0; i < this.playingStatusArr.length; ++i) {
                if (!this.playingStatusArr[i]) continue;
                let index = this.getUserChairIndex(i);
                // 设置扑克牌
                this.handCardWidgetCtrlArr[index].initWidget(allUserCardArr[i]);
                // 设置下注金额
                let headPos = this.userHeadCtrlArr[index].getHeadPos();
                let cardCount = !!allUserCardArr[i][0] ? 1 : 0 + !!allUserCardArr[i][1] ? 1 : 0;
                this.showBetWidgetCtrlArr[index].initWidget(headPos, gameData.betCountArr[i], gameData.doubleBetStatusArr[i][0], cardCount > 1);
                // 设置实际金币数
                let totalGold = 0;
                totalGold += this.betCountArr[i];
                if (!!gameData.doubleBetStatusArr[i][0]) {
                    totalGold += this.betCountArr[i];
                }
                if (!!allUserCardArr[i][1]) {
                    totalGold += this.betCountArr[i];
                }
                if (!!gameData.buyInsuranceStatus[i]) {
                    totalGold += this.betCountArr[i] * 0.5;
                }
                this.userHeadCtrlArr[index].goldChange(-totalGold, false);
                // 设置状态
                if (stopCardStatusArr[i][0] === false || stopCardStatusArr[i][1] === false) {
                    this.updateUserStatus(i, 'addCard');

                    this.startNext(i, !stopCardStatusArr[i][0] ? 0 : 1);
                } else {
                    this.updateUserStatus(i, 'stopCard');
                }
                if (!!stopCardStatusArr[i][0]) {
                    this.handCardWidgetCtrlArr[index].stopCard(0);
                }
                if (!!stopCardStatusArr[i][1]) {
                    this.handCardWidgetCtrlArr[index].stopCard(1);
                }
            }

            this.startUserHeadCtrlClock(false, -1);

            if (!!gameData.worktime)
                this.startUserHeadCtrlClock(true, gameData.curtplayer, gameData.worktime);
            if (gameData.cardindex != null)
                this.showArrowTip(gameData.curtplayer, gameData.cardindex);
        }

        let len = this.sp_baoxian_arr.length;
        for (let i = 0; i < len; i++) {
            this.sp_baoxian_arr[i].node.active = false;
        }
    },

    resetGame: function () {
        // 清理庄家牌
        this.bankerHandCardCtrl.initWidget();
        for (let i = 0; i < this.handCardWidgetCtrlArr.length; ++i) {
            // 清理手牌
            this.handCardWidgetCtrlArr[i].initWidget();
            // 清理筹码
            this.showBetWidgetCtrlArr[i].initWidget();
        }

    },

    onReconnection: function () {
        this.resetGame();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onUserEntryRoom: function (roomUserInfo) {
        // 设置用户角色、昵称、金币
        let index = this.getUserChairIndex(roomUserInfo.chairId);
        this.userHeadCtrlArr[index].updateInfo(roomUserInfo.userInfo);

        if ((roomUserInfo.userStatus & roomProto.userStatusEnum.READY) !== 0 && (roomUserInfo.userStatus & roomProto.userStatusEnum.PLAYING) === 0) {
            this.onUserReady(roomUserInfo.chairId);
        }
        this.roomUserInfoArr[roomUserInfo.chairId] = roomUserInfo;
    },

    onUserLeaveRoom: function (roomUserInfo) {
        // 删除用户信息
        if (roomUserInfo.chairId === this.myChairID && !Matching.isMatching) {
            this.exitGame();
        } else {
            // 清理头像
            let index = this.getUserChairIndex(roomUserInfo.chairId);
            this.userHeadCtrlArr[index].updateInfo(null);
            // 显示准备状态
            this.updateUserStatus(roomUserInfo.chairId, null);

            this.roomUserInfoArr[roomUserInfo.chairId] = null;
        }
    },

    updateUserInfo: function () {
        for (let i = 0; i < 5; ++i) {
            let roomUserInfo = this.roomUserInfoArr[i];
            if (!!roomUserInfo) {
                let index = this.getUserChairIndex(i);
                this.userHeadCtrlArr[index].updateInfo(roomUserInfo.userInfo);
            }
        }
    },

    onUserReady: function (chairID) {
        // 显示准备状态
        this.updateUserStatus(chairID, 'ready');
    },

    onGameStart: function (playingStatusArr, data_) {
        // 清除状态
        this.clearState();
        // 记录状态
        this.playingStatusArr = playingStatusArr;
        // 显示倒计时
        //this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "bet", this.autoOperation.bind(this));
        // 显示下注
        let index = this.getUserChairIndex(this.myChairID);
        let headCtrl = this.userHeadCtrlArr[index];
        this.betWidgetCtrl.startBet(headCtrl.getUserInfo().gold, this.selfBet.bind(this));
        // 初始化下注组件
        for (let i = 0; i < this.playingStatusArr.length; ++i) {
            if (!this.playingStatusArr[i]) continue;
            let index = this.getUserChairIndex(i);
            let headPos = this.userHeadCtrlArr[index].getHeadPosToWorldSpaceAR();
            this.showBetWidgetCtrlArr[index].initWidget(headPos);
        }

        this.startUserHeadCtrlClock(true, -1, data_.worktime);
    },
    onUserOperation: function (curtplayer, data_) {
        if (curtplayer == this.myChairID) {
            this.startNext(this.myChairID, data_.cardindex);
        } else {
            this.operationWidgetCtrl.stopOperation();
        }

        let index = this.getUserChairIndex(data_.curtplayer);
        this.startUserHeadCtrlClock(false, -1);
        this.startUserHeadCtrlClock(true, index, data_.worktime);

        this.showArrowTip(index, data_.cardindex);
    },

    //isStart:是否开启
    //index:-1:开启所有 !-1:开启特定桌位的
    startUserHeadCtrlClock: function (isStart_, index_, sumTime_) {
        if (isStart_ == true) {
            if (index_ == -1) {
                let len = this.userHeadCtrlArr.length;
                for (let i = 0; i < this.userHeadCtrlArr.length; i++) {
                    this.userHeadCtrlArr[i].startClock(sumTime_);
                }
            } else {
                this.userHeadCtrlArr[index_].startClock(sumTime_);
            }
        } else {
            if (index_ == -1) {
                let len = this.userHeadCtrlArr.length;
                for (let i = 0; i < this.userHeadCtrlArr.length; i++) {
                    this.userHeadCtrlArr[i].stopClock();
                }
            } else {
                this.userHeadCtrlArr[index_].stopClock();
            }
        }
    },

    selfBet: function (operateType, betCount) {
        let index = this.getUserChairIndex(this.myChairID);
        if (operateType === "add") {
            // 投注
            this.showBetWidgetCtrlArr[index].addBetCount(betCount);
            this.userHeadCtrlArr[index].goldChange(-betCount, false);
        } else if (operateType === "bet") {
            let curBetCount = this.betWidgetCtrl.getCurBetCount();
            if (curBetCount === 0) return;
            // 更新状态
            this.updateUserStatus(this.myChairID, "alreadyBet");
            // 停止下注器
            this.betWidgetCtrl.stopBet();
            // 定时器
            this.clockWidgetCtrl.stopClock();
            // 发送下注消息
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(curBetCount));
        } else if (operateType === "clean") {
            let curBetCount = this.betWidgetCtrl.getCurBetCount();
            if (curBetCount > 0) {
                this.showBetWidgetCtrlArr[index].cleanBet(true);
                this.userHeadCtrlArr[index].goldChange(curBetCount, false);
            }
        } else if (operateType === "autoBet") {
            let curBetCount = this.betWidgetCtrl.getCurBetCount();
            // if (curBetCount > 0) {
            //     this.showBetWidgetCtrlArr[index].cleanBet(true);
            //     this.userHeadCtrlArr[index].goldChange(curBetCount, false);
            // }
            // curBetCount = this.betWidgetCtrl.getMinBetCount();
            // // 投注
            // this.showBetWidgetCtrlArr[index].betCount(curBetCount);
            // this.userHeadCtrlArr[index].goldChange(-curBetCount, false);
            // 更新状态
            this.updateUserStatus(this.myChairID, "alreadyBet");
            // 停止下注器
            this.betWidgetCtrl.stopBet();
            // 定时器
            this.clockWidgetCtrl.stopClock();
            // 发送下注消息
            roomAPI.gameMessageNotify(gameProto.gameUserBetNotify(curBetCount));
        }

    },

    onUserBet: function (chairID, betCount) {
        this.betCountArr[chairID] = betCount;
        let index = this.getUserChairIndex(chairID);

        this.startUserHeadCtrlClock(false, index);

        if (chairID == this.myChairID) {
            let tempBetCount = this.betWidgetCtrl.getCurBetCount();
            this.betWidgetCtrl.stopBet(); // 停止下注 清空内部下注值
            if (this.showBetWidgetCtrlArr[index].getTotalBetCount() != betCount) {
                this.showBetWidgetCtrlArr[index].cleanBet(true);

                // 更新状态
                this.updateUserStatus(chairID, "alreadyBet");
                // 显示下注金额
                this.showBetWidgetCtrlArr[index].betCount(betCount);
                if (!!tempBetCount && tempBetCount != 0) {
                    betCount -= tempBetCount;
                }
                this.userHeadCtrlArr[index].goldChange(-betCount, false);
            }
        } else {
            // 更新状态
            this.updateUserStatus(chairID, "alreadyBet");
            // 显示下注金额
            this.showBetWidgetCtrlArr[index].betCount(betCount);
            this.userHeadCtrlArr[index].goldChange(-betCount, false);
        }
    },

    selfBuyInsurance: function (isBuy) {
        if (isBuy) {
            let gold = this.userHeadCtrlArr[this.getUserChairIndex(this.myChairID)].userInfo.gold;
            if (gold < this.betCountArr[this.myChairID]) {
                isBuy = false;
                Confirm.show("金币不足无法购买保险");
            } else {
                this.userHeadCtrlArr[this.getUserChairIndex(this.myChairID)].goldChange(-this.betCountArr[this.myChairID] * 0.5, false);
            }
        } else
            Confirm.hide();

        this.clockWidgetCtrl.stopClock();
        roomAPI.gameMessageNotify(gameProto.gameUserByInsuranceNotify(isBuy));
    },

    onUserBuyInsurance: function (chairID, isBuy) {
        if (chairID !== this.myChairID) {
            if (isBuy) {
                this.userHeadCtrlArr[this.getUserChairIndex(chairID)].goldChange(-this.betCountArr[chairID] * 0.5, false);
            }
        }

        let index = this.getUserChairIndex(chairID);
        if (isBuy)
            this.sp_baoxian_arr[index].node.active = true;
        //Confirm.hide();
    },

    onGameSendCard: function (bankerCardArr, allUserCardArr, data_) {
        // 发庄家的牌
        this.bankerHandCardCtrl.initWidget();
        this.bankerHandCardCtrl.sendCard([bankerCardArr, null]);

        this.startUserHeadCtrlClock(false, -1);

        // 发其他玩家的牌
        for (let i = 0; i < this.playingStatusArr.length; ++i) {
            if (!this.playingStatusArr[i]) continue;

            let index = this.getUserChairIndex(i);
            this.handCardWidgetCtrlArr[index].initWidget();

            if (data_.worktime) {
                this.startUserHeadCtrlClock(true, index, data_.worktime);
            }

            if (i === this.myChairID) {
                this.handCardWidgetCtrlArr[index].sendCard(allUserCardArr[i], function () {
                    // 判断是否应该买保险
                    if (gameLogic.getCardValue(bankerCardArr[0]) === 11) {
                        Confirm.show("庄家可能会拿到黑杰克，是否购买保险？", function () {
                            this.selfBuyInsurance(true);
                        }.bind(this), function () {
                            this.selfBuyInsurance(false);
                        }.bind(this));
                        if (data_.worktime)
                            this.clockWidgetCtrl.startClock(data_.worktime - 3, "insurance", this.autoOperation.bind(this));
                    } else {
                        if (gameLogic.getCardPoint(bankerCardArr) !== 21) {
                            // 开始操作
                            //this.startNext(this.myChairID, 0);
                        }
                    }
                }.bind(this));
            } else {
                this.handCardWidgetCtrlArr[index].sendCard(allUserCardArr[i]);
            }
        }
    },

    onGameInsuranceResult: function () {
        this.startNext(this.myChairID, 0);
    },

    userOperation: function (operationType, cardIndex) {
        let index = this.getUserChairIndex(this.myChairID);
        if (this.handCardWidgetCtrlArr[index].isCanOperate == false) {
            Tip.makeText("你操作的太快了")
            return;
        }
        if (operationType === 'addCard') {
            // if (this.handCardWidgetCtrlArr[index].isCanOperate == false) {
            //     return;
            // }

            this.operationWidgetCtrl.stopOperation();
            roomAPI.gameMessageNotify(gameProto.gameUserAddCardNotify(this.curCardIndex));
        } else if (operationType === 'stopCard') {
            // if (this.handCardWidgetCtrlArr[index].isCanOperate == false) {
            //     return;
            // }

            roomAPI.gameMessageNotify(gameProto.gameUserStopCardNotify(this.curCardIndex));
            // 检查是否已经全部停牌
            let selfCardDataArr = this.handCardWidgetCtrlArr[index].getCardDataArr();
            if (!selfCardDataArr[this.curCardIndex + 1]) {
                this.updateUserStatus(this.myChairID, "stopCard");
            }
        } else if (operationType === 'double') {
            // if (this.handCardWidgetCtrlArr[index].isCanOperate == false) {
            //     return;
            // }
            // 更新下注金额
            roomAPI.gameMessageNotify(gameProto.gameUserDoubleBetNotify(cardIndex));
        } else if (operationType === 'cutCard') {
            // if (this.handCardWidgetCtrlArr[index].isCanOperate == false) {
            //     return;
            // }

            roomAPI.gameMessageNotify(gameProto.gameUserCutCardNotify());
            //this.onUserCutCard(0,[1,2]);
        }
        // 停止操作器
        this.operationWidgetCtrl.stopOperation();
        // 停止倒计时
        this.clockWidgetCtrl.stopClock();
    },

    startNext: function (chairID, curIndex) {
        if (curIndex === 2) {
            this.updateUserStatus(chairID, 'stopCard');
            return;
        }
        let index = this.getUserChairIndex(chairID);
        let cardDataArr = this.handCardWidgetCtrlArr[index].getCardDataArr();
        if (!cardDataArr[curIndex]) {
            this.updateUserStatus(chairID, 'stopCard');
            return;
        }
        let points = gameLogic.getCardPoint(cardDataArr[curIndex]);

        if (points >= 21) { //服务器这里已经处理了停牌操作
            // this.startUserHeadCtrlClock(false,index);

            // if (!cardDataArr[curIndex + 1]) {
            //     this.updateUserStatus(chairID, 'stopCard');
            // } else {
            //     if (this.myChairID === chairID) {
            //         // 显示操作器
            //         let operationTypeArr = ["addCard", "stopCard"];
            //         this.handCardWidgetCtrlArr[index].showOperation(curIndex);
            //         // 开始操作
            //         this.betWidgetCtrl.stopBet();
            //         this.operationWidgetCtrl.startOperation(operationTypeArr, curIndex, this.userOperation.bind(this));
            //         // 开始倒计时
            //         //this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "stopCard", this.autoOperation.bind(this));
            //     }
            // }
        } else {
            if (this.myChairID === chairID) {
                // 显示操作器
                let operationTypeArr = ["addCard", "stopCard"];
                // 检查金币是否足够双倍
                let gold = this.userHeadCtrlArr[this.getUserChairIndex(this.myChairID)].userInfo.gold;
                if (gold >= this.betCountArr[this.myChairID] && cardDataArr[curIndex].length === 2 && !cardDataArr[1]) {
                    operationTypeArr.push("double");
                    // 检查是否可以分牌
                    if (gameLogic.isCanCutCard(cardDataArr[0])) {
                        operationTypeArr.push("cutCard");
                    }
                }
                this.handCardWidgetCtrlArr[index].showOperation(curIndex);
                // 开始操作
                this.betWidgetCtrl.stopBet();

                this.operationWidgetCtrl.startOperation(operationTypeArr, curIndex, this.userOperation.bind(this));
                // 开始倒计时
                //this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "stopCard", this.autoOperation.bind(this));
            }
        }
    },

    onUserAddCard: function (chairID, cardIndex, userCardArr) {
        let index = this.getUserChairIndex(chairID);

        BJAudio.playAudio("operationAudio/yaopai-0");

        this.handCardWidgetCtrlArr[index].addCard(cardIndex, userCardArr, function () {
            // 开始操作
            this.startNext(chairID, cardIndex);
        }.bind(this));
    },

    onUserStopCard: function (chairID, cardIndex) {
        this.startUserHeadCtrlClock(false, -1);

        let handCardWidgetCtrl = this.handCardWidgetCtrlArr[this.getUserChairIndex(chairID)];

        BJAudio.playAudio("operationAudio/tingpai-0");

        handCardWidgetCtrl.stopCard(cardIndex);
        // 开始操作
        this.startNext(chairID, cardIndex + 1);
    },

    onUserDouble: function (chairID, cardIndex, userCardArr) {
        let index = this.getUserChairIndex(chairID);

        BJAudio.playAudio("operationAudio/shuangbei-0");

        this.showBetWidgetCtrlArr[index].double();
        this.userHeadCtrlArr[index].goldChange(-this.betCountArr[chairID], false);
        this.handCardWidgetCtrlArr[index].doubleBet(cardIndex);
        this.handCardWidgetCtrlArr[index].addCard(cardIndex, userCardArr, function () {
            this.onUserStopCard(chairID, cardIndex);
        }.bind(this));
    },

    onUserCutCard: function (chairID, userCardArr) {
        let index = this.getUserChairIndex(chairID);
        let handCtrl = this.handCardWidgetCtrlArr[index];

        BJAudio.playAudio("operationAudio/fenpai-0");

        this.showBetWidgetCtrlArr[index].cutCard();
        this.userHeadCtrlArr[index].goldChange(-this.betCountArr[chairID], false);
        handCtrl.cutCard(userCardArr, function () {
            this.startNext(chairID, 0);
        }.bind(this));
    },

    autoOperation: function (operationType) {
        if (operationType === "bet") {
            this.selfBet("autoBet", this.betWidgetCtrl.getMinBetCount());
        } else if (operationType === "stopCard") {
            let index = this.handCardWidgetCtrlArr[this.getUserChairIndex(this.myChairID)].getCurOperationIndex();
            this.userOperation("stopCard", index);
        } else if (operationType === "ready") {
            Waiting.show();
            roomAPI.roomMessageNotify(roomProto.userLeaveRoomNotify());
        } else if (operationType === "insurance") {
            this.selfBuyInsurance(false);
        }
    },

    updateUserStatus: function (chairID, status) {
        if (!!status && status !== 'ready') return;
        let index = this.getUserChairIndex(chairID);
        let node = this.userStatusNodeArr[index];
        for (let i = 0; i < node.children.length; ++i) {
            node.children[i].active = node.children[i].name === status;
        }
    },

    onGameResult: function (resultData) {
        this.profitPercentage = resultData.profitPercentage;


        this.dropDownList.getComponent("GameDropDownList").setGameInfo(enumeration.gameType.BJ, this.profitPercentage);

        // 显示庄家的牌
        this.scheduleOnce(function () {
            this.bankerHandCardCtrl.showBankerHandCard(resultData.bankerCardArr, function () {
                this.bankerHandCardCtrl.stopCard(0);
                // 显示输赢分数
                for (let i = 0; i < resultData.scoreChangeArr.length; ++i) {
                    let score = resultData.scoreChangeArr[i];
                    if (score != null && score != undefined) {
                        let index = this.getUserChairIndex(i);
                        if (score > 0) {
                            this.userHeadCtrlArr[index].goldChangeIncludeZero(score * (1 - (this.profitPercentage) / 100), true, false);
                            if (i === this.myChairID) {
                                BJAudio.playAudio("yingqujinbi");
                                AudioMgr.playSound('GameCommon/Sound/win_game');
                            }
                        } else {
                            this.userHeadCtrlArr[index].goldChangeIncludeZero(score, true, false);
                        }
                    }
                }
                // 刷新分数
                this.updateUserInfo();
                this.operationWidgetCtrl.stopOperation();
                this.clockWidgetCtrl.stopClock();
                this.betWidgetCtrl.stopBet();
                // 显示准备按钮
                //this.readyBtnNode.active = true;
                //this.clockWidgetCtrl.startClock(gameProto.OPERATION_TIME, "ready", this.autoOperation.bind(this));
                this.scheduleOnce(function () {
                    continueBtn.show(this.gameTypeInfo.gameTypeID);
                }, 2)
            }.bind(this));
        }.bind(this), 1);

        this.startUserHeadCtrlClock(false, -1);

        //隐藏ArrowTip
        if (this.sp_arrowTip_arr[this.curUserIndex]) {
            this.sp_arrowTip_arr[this.curUserIndex].node.stopAction();
            this.sp_arrowTip_arr[this.curUserIndex].node.active = false;
        }
        this.curUserIndex = -1;
        this.curCardIndex = -1;

        Confirm.hide();
    },

    getUserChairIndex: function (chairID) {
        return (chairID - this.myChairID + 5) % 5;
    },

    //curCardIndex_:当前哪一副牌
    showArrowTip: function (curIndex_, curCardIndex_) {
        if (this.curUserIndex == curIndex_ && this.curCardIndex_ == curCardIndex_)
            return;

        if (this.sp_arrowTip_arr[this.curUserIndex]) {
            this.sp_arrowTip_arr[this.curUserIndex].node.stopAllActions();
            this.sp_arrowTip_arr[this.curUserIndex].node.active = false;
        }
        this.curUserIndex = curIndex_;
        this.curCardIndex = curCardIndex_;
        this.sp_arrowTip_arr[this.curUserIndex].node.active = true;

        if (curCardIndex_ == 0) {
            this.sp_arrowTip_arr[this.curUserIndex].node.y = this.arrowTipPosY_arr[this.curUserIndex];
            this.sp_arrowTip_arr[this.curUserIndex].node.y = this.arrowTipPosY_arr[this.curUserIndex] - 14;
        } else if (curCardIndex_ == 1) {
            this.sp_arrowTip_arr[this.curUserIndex].node.y = this.arrowTipPosY_arr[this.curUserIndex];
            this.sp_arrowTip_arr[this.curUserIndex].node.y = this.arrowTipPosY_arr[this.curUserIndex] + 14;
        }

        this.sp_arrowTip_arr[this.curUserIndex].node.runAction(new cc.repeatForever(
            new cc.sequence(
                new cc.moveBy(0.5, new cc.Vec2(0, -15)),
                new cc.moveBy(0.5, new cc.Vec2(0, 15))
            )
        ));
    },

    clearState: function () {
        for (let i = 0; i < 5; ++i) {
            this.updateUserStatus(i, null);
        }
    },

    exitGame: function () {
        ViewMgr.goBackHall(Config.GameType.BJ);
    }
});