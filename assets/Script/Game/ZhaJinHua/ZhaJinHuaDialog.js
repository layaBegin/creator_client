let gameProto = require('./GameProtoZJH');
let roomProto = require('../../API/RoomProto');
let roomAPI = require('../../API/RoomAPI');
let ZJHAudio = require('./ZJHAudio');
let ZJHModel = require('./ZJHModel');

cc.Class({
    extends: cc.Component,

    properties: {
        chairPos: [cc.Node],

        chairPrefab: cc.Prefab,
        cardsPrefab: cc.Prefab,
        comparePrefab: cc.Prefab,
        gameDropDownList: cc.Node,
        chipPool: require('ZJHChipPool'),
        operationWidgetCtrl: require('ZJHOperation'),
        addStakeWidgetCtrl: require('ZJHAddStake'),
        selectChairWidgetCtrl: require('ZJHSelectChair'),
        baseScoreLabel: cc.Label,


        Btn_gzyz: cc.Button,

        Ani_gzyz: dragonBones.ArmatureDisplay,
    },

    // use this for initialization
    onLoad: function () {
        ZJHAudio.gameBg();
        //服务器推送消息
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);

        this.myChairID = -1;
        this.gameTypeInfo = null;
        this.profitPercentage = 0;
        this.giveUping = false;
        this.roomUserInfoArr = [null, null, null, null, null];
        this.chairCtrlArr = [null, null, null, null, null];
        this.cardCtrlArr = [null, null, null, null, null];
        this.gameInited = false;

        this.operationWidgetCtrl.setEventCallback(this.onBtnClk.bind(this));

        this.Ani_gzyz.node.active = false;


        this.curStakeLevel = 0;

        this.firstChairLookingCard = false;

        this.isFirstChairFailCompare = false;

        // 获取场景数据
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
        }, 0.2);
    },

    onDestroy: function () {
        //移除事件监听
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    },

    onBtnClk: function (event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'dissRoom':
                if (!this.gameInited) return;
                this.leaveRoom();
                break;
            case 'roomRule':
                // Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog", {
                //     kind: Global.Enum.gameType.ZJH
                // });
                break;
            case 'setting':
                // Global.DialogManager.createDialog('Setting/SettingDialog');
                break;

            case 'lookCard':
                if (this.chairCtrlArr[0].isLookedCard()) {
                    Confirm.show("已经看牌，无法重复看牌");
                    return;
                }
                roomAPI.gameMessageNotify(gameProto.userLookCardNotify());
                break;
            case 'giveUp':
                if (this.firstChairLookingCard == true) {
                    Tip.makeText("您的操作太快了");
                    return;
                }
                Confirm.show("您确定要弃牌吗", function () {
                    roomAPI.gameMessageNotify(gameProto.userGiveUpNotify());
                    this.operationWidgetCtrl.node.active = false;
                }.bind(this), function () {

                });
                //this.operationWidgetCtrl.showNormalOperationUI();
                break;
            case 'stake':
                let currentStakeLevel = this.operationWidgetCtrl.currentStakeLevel;
                let currentMultiple = this.operationWidgetCtrl.currentMultiple;
                if (this.chairCtrlArr[0].getUserGold() <= gameProto.STAKE_LEVEL[currentStakeLevel] * currentMultiple) {
                    return;
                }

                // ZJHAudio.genZhu();
                roomAPI.gameMessageNotify(gameProto.userStakeNotify(currentStakeLevel));
                break;
            case 'stake_gzyz':
                // 若金钱不足以下注，则孤注一掷和下家比牌，赢了继续比牌，输了直接GG
                let currentStakeLevel_gzyz = this.operationWidgetCtrl.currentStakeLevel;
                let currentMultiple_gzyz = this.operationWidgetCtrl.currentMultiple;
                if (this.chairCtrlArr[0].getUserGold() <= gameProto.STAKE_LEVEL[currentStakeLevel_gzyz] * currentMultiple_gzyz) {
                    roomAPI.gameMessageNotify(gameProto.guzhuyizhiNotify(this.chairCtrlArr[0].getUserGold()));
                }
                break;
            case 'addStake':
                if (!this.addStakeWidgetCtrl.node.active) {
                    this.addStakeWidgetCtrl.node.active = true;
                    let currentStakeLevel = this.operationWidgetCtrl.currentStakeLevel;
                    let currentMultiple = this.operationWidgetCtrl.currentMultiple;
                    this.addStakeWidgetCtrl.startSelectStake(currentStakeLevel, currentMultiple, this.onSelfStake.bind(this), this.chairCtrlArr[0].firstChairLookedCardStatus, this.chairCtrlArr[0].getUserGold());
                } else {
                    this.addStakeWidgetCtrl.node.active = false;
                }
                break;
            case 'autoStake':
                this.autoStake = !this.autoStake;
                this.operationWidgetCtrl.showAutoEff(this.autoStake);
                break;
            case 'compare':
                if (this.selectChairWidgetCtrl.node.active) return;
                this.selectChairWidgetCtrl.node.active = true;
                // 查询当前正在玩的玩家
                let currentPlayerUserChairID = [];
                let isCanCompare = false;
                for (let i = 0; i < 5; ++i) {
                    if (i === this.myChairID) continue;
                    let index = this.getUserChairIndex(i);
                    let ctrl = this.chairCtrlArr[index];
                    if (!ctrl) continue;
                    if (ctrl.canCompare()) {
                        this.selectChairWidgetCtrl.addSelectEff(index, this.chairPos[index].position, i, function (chairId) {
                            this.selectChairWidgetCtrl.clearWidget();
                            roomAPI.gameMessageNotify(gameProto.userCompareNotify(chairId));
                            this.operationWidgetCtrl.node.active = false;
                        }.bind(this));

                        isCanCompare = true;
                    }
                    if (ctrl.isPlayingGame()) {
                        currentPlayerUserChairID.push(i);
                    }
                }
                //如果只剩下两个人，则随时可以比牌
                if (currentPlayerUserChairID.length === 1) {
                    for (let i = 0; i < currentPlayerUserChairID.length; i++) {
                        if (currentPlayerUserChairID[i] !== this.myChairID) {
                            let index = this.getUserChairIndex(currentPlayerUserChairID[i]);
                            this.selectChairWidgetCtrl.addSelectEff(index, this.chairPos[index].position, currentPlayerUserChairID[i], function (chairId) {
                                this.selectChairWidgetCtrl.clearWidget();
                                roomAPI.gameMessageNotify(gameProto.userCompareNotify(chairId));
                                this.operationWidgetCtrl.node.active = false;
                            }.bind(this));
                            isCanCompare = true;
                        }
                    }
                }
                // 显示比牌选择组件
                if (isCanCompare) {
                    // 隐藏加注按钮
                    this.addStakeWidgetCtrl.node.active = false;
                } else {
                    this.selectChairWidgetCtrl.node.active = false;
                    Tip.makeText("玩家人数超过两人，只能跟已看牌的玩家比牌");
                }
                break;
            case 'endCompare':
                this.selectChairWidgetCtrl.clearWidget();
                break;
        }
    },

    messageCallbackHandler: function (route, msg) {
        if (route === 'RoomMessagePush') {
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
                    if (this.roomUserInfoArr[i].userInfo.uid === msg.data.changeInfo.uid) {
                        this.roomUserInfoArr[i].userInfo = msg.data.changeInfo;
                        break;
                    }
                }
            } else if (msg.type === roomProto.GAME_END_PUSH) {} else if (msg.type === roomProto.ROOM_DISMISS_PUSH) {
                Confirm.show("当前房间已解散！", () => {
                    ViewMgr.goBackHall(Config.GameType.ZJH)
                })
            }
        } else if (route === 'ReConnectSuccess') {
            if (Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(Global.Player.getPy("roomID"), () => {
                    //roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
                }, undefined, Config.GameType.ZJH);
            } else {
                this.exitGame();
            }
        } else if (route === 'GameMessagePush') {
            if (!this.gameInited) return;
            switch (msg.type) {
                case gameProto.GAME_START_PUSH:
                    ZJHAudio.start();
                    this.onGameStart(msg.data.stakeLevel, msg.data.firstXiaZhu, msg.data.bankerchair, msg.data.goldSumAmount, msg.data.round, msg.data.userStakeCountArr, msg.data.operationtime);
                    break;
                case gameProto.GAME_OPERATE_STAKE_PUSH:

                    if (msg.data.chairId != this.myChairID) {
                        // ZJHAudio.xiaZhu();

                    }
                    if (msg.data.isguzhu == true) {
                        this.Ani_gzyz.node.active = true;
                        setTimeout(() => {
                            if (!cc.isValid(this)) {
                                return;
                            }
                            this.Ani_gzyz.node.active = false;

                            this.Btn_gzyz.node.active = false;
                        }, 2000);
                        this.onUserGuZhuStake(msg.data.chairId, msg.data.multiple, msg.data.userStakeCount, msg.data.goldSumAmount)
                    } else {
                        this.onUserStake(msg.data.chairId, msg.data.stakeLevel, msg.data.multiple, msg.data.userStakeCount, msg.data.goldSumAmount, msg.data.round);
                        let index = this.getUserChairIndex(msg.data.chairId);
                        if (msg.data.stakeLevel > this.curStakeLevel) {
                            this.chairCtrlArr[index].showOperationStatus("jiazhu");
                            ZJHAudio.jiaZhu();
                        } else if (msg.data.stakeLevel == this.curStakeLevel) {
                            ZJHAudio.genZhu();
                            this.chairCtrlArr[index].showOperationStatus("genzhu");

                        }

                        this.curStakeLevel = msg.data.stakeLevel;
                    }
                    break;
                case gameProto.GAME_OPERATE_GIVEUP_PUSH:
                    ZJHAudio.giveUp();
                    this.onUserGiveUp(msg.data.chairId);
                    break;
                case gameProto.GAME_OPERATE_LOOK_PUSH:
                    ZJHAudio.kanPai();
                    this.onUserLookCard(msg.data.chairId, "look", msg.data.cardType, msg.data.cardDataArr);
                    break;
                case gameProto.GAME_OPERATE_COMPARE_PUSH:
                    ZJHAudio.compare();
                    this.onUserCompare(msg.data.chairId, msg.data.loserchairId, msg.data.comparechairId);
                    break;
                case gameProto.GAME_OPERATE_GU_ZHU_YI_ZHI_PUSH:
                    this.showGuzhuyizhiCompare(msg);
                    break;
                case gameProto.GAME_OPERATE_SHOWDOWN_PUSH:
                    this.onUserShowdown();
                    break;
                case gameProto.GAME_CHAIR_TURN_PUSH:
                    this.operationWidgetCtrl.updateStakeLevel(msg.data.currentStakeLevel, msg.data.currentMultiple);
                    cc.log('当前轮到操作者：' + msg.data.chairId + "我的" + this.myChairID)
                    cc.log('当前轮到操作者视图ID：' + this.getUserChairIndex(msg.data.chairId))
                    this.startClock(this.getUserChairIndex(msg.data.chairId), msg.data.operationtime)
                    if (msg.data.chairId === this.myChairID) {
                        this.operationWidgetCtrl.showSpecialOperationUI();

                        let currentStakeLevel = this.operationWidgetCtrl.currentStakeLevel;
                        let currentMultiple = this.operationWidgetCtrl.currentMultiple;
                        if (this.chairCtrlArr[0].getUserGold() <= gameProto.STAKE_LEVEL[currentStakeLevel] * currentMultiple) {
                            this.Btn_gzyz.node.active = true;
                        }
                    } else {
                        if (this.chairCtrlArr[0].isPlayingGame() && this.isFirstChairFailCompare == false) {
                            this.operationWidgetCtrl.showNormalOperationUI();
                        }
                    }
                    break;
                case gameProto.GAME_END_PUSH:
                    if (msg.data.profitPercentage) {
                        this.profitPercentage = msg.data.profitPercentage;
                        this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(Global.Enum.gameType.ZJH, this.profitPercentage);
                    }

                    if (this.giveUping) {
                        this.stopClock()
                        this.endMsg = msg.data;
                        return;
                    }
                    this.stopClock()
                    this.checkCompareEnd(msg.data);
                    break;
            }
        }
    },

    gameInit: function (roomUserInfoArr, gameData) {
        if (!Array.isArray(roomUserInfoArr)) {
            return;
        }
        // 按照椅子号从小到大排序
        roomUserInfoArr.sort((a, b) => {
            return a.chairId - b.chairId;
        })
        console.log("debug::", roomUserInfoArr);

        this.gameInited = true;
        this.gameTypeInfo = gameData.gameTypeInfo;
        this.baseScoreLabel.string = "底分:" + this.gameTypeInfo.baseScore;
        gameProto.MAX_ROUND = gameData.maxround || 20;
        this.curStakeLevel = 0;
        // 记录抽水比例
        this.profitPercentage = gameData.profitPercentage;
        this.gameDropDownList.getComponent('GameDropDownList').setGameInfo(Global.Enum.gameType.ZJH, this.profitPercentage);
        // 获取自己的位置
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            let roomUserInfo = roomUserInfoArr[i];
            if (roomUserInfo.userInfo.uid === Global.Player.getPy('uid')) {
                this.myChairID = roomUserInfo.chairId;
                break;
            }
        }
        // 设置用户基础信息
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            this.onUserEntryRoom(roomUserInfoArr[i]);
        }
        // 未开局状态
        if (gameData.gameStatus === gameProto.gameStatus.NONE) {
            roomAPI.roomMessageNotify(roomProto.userReadyNotify(true));
            this.operationWidgetCtrl.node.active = false; // 关闭操作界面
        }
        // 已经开始 (断线重连)
        else if (gameData.gameStatus === gameProto.gameStatus.PLAYING) {
            // 设置当前下注等级
            this.operationWidgetCtrl.updateStakeLevel(gameData.currentStakeLevel);
            // 显示当前操作玩家倒计时
            this.startClock(gameData.currentUserchairId, gameData.operationtime);

            // 设置所有玩家信息
            for (let i = 0; i < this.chairCtrlArr.length; i++) {
                let index = this.getUserChairIndex(i);
                let userStatus = gameData.userStatus[i];
                if (!this.chairCtrlArr[index]) continue;
                if (userStatus == gameProto.USER_STATE_NONE) {
                    CC_DEBUG && Debug.assert(this.chairCtrlArr[index], "数据错误,当前玩家座位存在,但状态表示为空");
                    continue;
                }
                if (userStatus == gameProto.LEAVE) {
                    /**
                     * 当玩家弃牌或者比牌失败后允许离开房间
                     * 但是断线重连回来应该依然显示该玩家的弃牌或者比牌输了的状态 而不是离开状态
                     */
                    CC_DEBUG && Debug.assert(this.chairCtrlArr[index], "玩家不应该存在离开状态");
                    continue;
                }
                let isSelf = i == this.myChairID;
                // 设置牌
                if (i === this.myChairID && userStatus === gameProto.LOOK_CARD) {
                    this.createCard(index, gameData.userCardsArr, false);
                    this.operationWidgetCtrl.updateStakeLevel(null, 2);
                } else {
                    this.createCard(index, null, false);
                }
                // 设置操作界面
                if (isSelf) {
                    if (this.myChairID === gameData.currentUserchairId) {
                        this.operationWidgetCtrl.showSpecialOperationUI();
                    } else if (userStatus == gameProto.GIVE_UP || userStatus == gameProto.LOSE) {
                        this.operationWidgetCtrl.node.active = false; // 关闭操作界面
                        // 显示继续游戏
                        continueBtn.show(this.gameTypeInfo.gameTypeID);
                    } else {
                        this.operationWidgetCtrl.showNormalOperationUI();
                    }
                    // 显示自己的牌
                    if (Array.isArray(gameData.userCardsArr)) {
                        let cardType = ZJHModel.getCardType(gameData.userCardsArr);
                        this.cardCtrlArr[index].showFirstChairCardType(cardType);
                    }
                }

                // 显示状态以及相关信息
                if (userStatus == gameProto.LOOK_CARD) {
                    if (isSelf) {
                        this.operationWidgetCtrl.setLookCardBtnState(false); // 禁用看牌按钮
                    } else {
                        this.chairCtrlArr[index].showStatus(userStatus);
                    }
                } else if (userStatus == gameProto.GIVE_UP) {
                    this.chairCtrlArr[index].showStatus(userStatus);
                    if (isSelf) {

                    } else {
                        this.cardCtrlArr[index].giveUpCards(isSelf); // 显示弃牌特效
                    }
                } else if (userStatus == gameProto.LOSE) {
                    this.chairCtrlArr[index].showStatus(userStatus);
                    if (isSelf) {
                        this.cardCtrlArr[index].showFirstChairFailCompareSprite();
                    } else {
                        this.cardCtrlArr[index].giveUpCards(isSelf); // 显示弃牌特效
                    }

                }
                //设置玩家分数
                this.chairCtrlArr[index].onUserStake(gameData.userStakeCountArr[i], gameData.userStakeCountArr[i]);
            }
            //设置下注池
            this.chipPool.setChips(gameData.goldSumAmount, gameData.round, gameData.stakeArr);
            this.chipPool.showPoolInfoGroup();
            /*//隐藏准备模块
            this.chairCtrlArr[0].hideReadyGroup();*/
            //设置庄家
            // this.chairCtrlArr[this.getUserChairIndex(gameData.bankerchair)].showZhuang();
            //设置先手标识
            this.chairCtrlArr[this.getUserChairIndex(gameData.firstXiaZhu)].showFirstXiaZhu();
        }
    },

    resetGame: function () {
        this.node.stopAllActions();
        this.unscheduleAllCallbacks();
        //牌移除
        for (let i = 0; i < this.cardCtrlArr.length; ++i) {
            if (!this.cardCtrlArr[i]) continue;
            this.cardCtrlArr[i].node.destroy();
        }
        this.cardCtrlArr = [null, null, null, null, null];
        //座位状态清除
        for (let i = 0; i < this.chairCtrlArr.length; ++i) {
            if (!this.chairCtrlArr[i]) continue;
            this.chairCtrlArr[i].node.destroy();
        }
        this.chairCtrlArr = [null, null, null, null, null];
        //移除筹码
        this.chipPool.removeAllChips();
        //隐藏操作器
        this.operationWidgetCtrl.node.active = false;
        //隐藏孤注一掷按钮
        this.Btn_gzyz.node.active = false;
        //加注组件
        this.addStakeWidgetCtrl.node.active = false;
        //清除比牌组件
        if (this.compareUI) {
            this.compareUI.node.destroy();
            this.compareUI = null;
        }
        //清楚选坐组件
        this.selectChairWidgetCtrl.clearWidget();

        this.operationWidgetCtrl.setLookCardBtnState(true);

        this.firstChairLookingCard = false;

        this.isFirstChairCompareFailed = false;
    },

    onReconnection: function () {
        this.resetGame();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },
    //显示头像
    onUserEntryRoom: function (roomUserInfo) {
        let node = cc.instantiate(this.chairPrefab);
        let index = this.getUserChairIndex(roomUserInfo.chairId);
        node.zIndex = 99
        node.parent = this.chairPos[index];
        let ctrl = node.getComponent('ZJHChair');
        ctrl.setEventCallback(this.onBtnClk.bind(this));
        this.chairCtrlArr[index] = ctrl;
        ctrl.updateUI(roomUserInfo.userInfo, index, this.profitPercentage, this.node);

        this.roomUserInfoArr[roomUserInfo.chairId] = roomUserInfo;
    },

    onUserLeaveRoom: function (roomUserInfo) {
        // 删除用户信息
        if (roomUserInfo.chairId === this.myChairID) {
            Waiting.hide();
            if (!Matching.isMatching) {
                this.exitGame();
            }
        } else {
            // 清除座位信息
            let index = this.getUserChairIndex(roomUserInfo.chairId);
            this.chairCtrlArr[index].node.destroy();
            this.chairCtrlArr[index] = null;

            this.roomUserInfoArr[roomUserInfo.chairId] = null;
        }
    },

    onUserReady: function (chairId) {},

    updateUserInfo: function () {
        for (let i = 0; i < 5; ++i) {
            let roomUserInfo = this.roomUserInfoArr[i];
            if (!roomUserInfo) continue;
            let index = this.getUserChairIndex(i);
            this.chairCtrlArr[index].updateUserInfo(roomUserInfo.userInfo);
        }
    },

    onGameStart: function (stakeLevel, firstXiaZhu, bankerchair, goldSumAmount, round, userStakeCountArr, operationtime) {
        // 设置下底注信息
        for (let i = 0; i < 5; i++) {
            let index = this.getUserChairIndex(i);
            if (!this.chairCtrlArr[index]) continue;
            // 添加下注
            this.chipPool.addChip(stakeLevel, 1, goldSumAmount, round, this.chairCtrlArr[index].node.position);
            // 更新下注信息
            this.chairCtrlArr[index].onUserStake(userStakeCountArr[i], userStakeCountArr[i]);
            ZJHAudio.chip();
        }
        this.chipPool.showPoolInfoGroup();

        //发牌
        this.createCards();

        //显示庄家
        // this.chairCtrlArr[this.getUserChairIndex(bankerchair)].showZhuang();
        // 显示先手玩家
        this.chairCtrlArr[this.getUserChairIndex(firstXiaZhu)].showFirstXiaZhu(firstXiaZhu);

        this.startClock(this.getUserChairIndex(firstXiaZhu), operationtime)

        // 如果先手玩家是自己则，显示操作器
        this.operationWidgetCtrl.node.active = true;
        // 设置下注等级
        this.operationWidgetCtrl.updateStakeLevel(0, 1);
        this.scheduleOnce(function () {
            if (firstXiaZhu === this.myChairID) {
                this.operationWidgetCtrl.showSpecialOperationUI();
            } else {
                this.operationWidgetCtrl.showNormalOperationUI();
            }
            cc.find("ZJHOperationNew/btnGroup/btn_giveUp", this.operationWidgetCtrl.node).active = true
        }, 1)
    },

    onSelfStake: function (stakeLevel) {
        roomAPI.gameMessageNotify(gameProto.userStakeNotify(stakeLevel));
        this.operationWidgetCtrl.node.active = false;
        this.addStakeWidgetCtrl.node.active = false;
    },

    onUserGuZhuStake: function (chairId, multiple, userStakeCount, goldSumAmount) {
        let index = this.getUserChairIndex(chairId);
        this.chairCtrlArr[index].onUserStake(multiple, userStakeCount);
        this.chipPool.setSumAmount(goldSumAmount);
    },

    onUserStake: function (chairId, stakeLevel, multiple, userStakeCount, goldSumAmount, round) {
        let index = this.getUserChairIndex(chairId);
        this.chipPool.addChip(stakeLevel, multiple, goldSumAmount, round, this.chairPos[index].position);

        this.chairCtrlArr[index].onUserStake(gameProto.STAKE_LEVEL[stakeLevel] * multiple, userStakeCount);
    },

    onUserGiveUp: function (chairId) {

        if (chairId === this.myChairID) {
            this.operationWidgetCtrl.node.active = false;
        }

        this.giveUping = true;
        // 更新玩家状态
        let index = this.getUserChairIndex(chairId);
        this.chairCtrlArr[index].showStatus(gameProto.GIVE_UP);
        this.chairCtrlArr[index].showOperationStatus("qipai");

        this.cardCtrlArr[index].hideFirstChairCardType();

        if (!!this.cardCtrlArr[index]) {
            this.cardCtrlArr[index].giveUpCards(chairId === this.myChairID, function () {
                this.giveUping = false;
                if (!!this.endMsg) {
                    // 显示最终结果
                    this.showGameEnd(this.endMsg);
                } else {
                    // 显示重新匹配按钮
                    if (chairId === this.myChairID) {
                        // this.continueNode.active = true;
                        continueBtn.show(this.gameTypeInfo.gameTypeID)
                    }
                }
            }.bind(this));
        } else {
            this.scheduleOnce(function () {
                this.cardCtrlArr[index].giveUpCards(chairId === this.myChairID, function () {
                    this.giveUping = false;
                    if (!!this.endMsg) {
                        this.showGameEnd(this.endMsg);
                    } else {
                        // 显示重新匹配按钮
                        if (chairId === this.myChairID) {
                            // this.continueNode.active = true;
                            continueBtn.show(this.gameTypeInfo.gameTypeID)
                        }
                    }
                }.bind(this));
            }.bind(this), 0.7);
        }
    },

    onUserLookCard: function (chairId, showType, cardTye, cardDataArr) {
        let index = this.getUserChairIndex(chairId);
        if (chairId != this.myChairID) {
            this.chairCtrlArr[index].showStatus(gameProto.LOOK_CARD);
            this.chairCtrlArr[index].showOperationStatus("kanpai");
        } else {
            if (this.chairCtrlArr[index].getFirstChairLookedCardStatus() == 0) {
                this.chairCtrlArr[index].showOperationStatus("kanpai");

                this.operationWidgetCtrl.setLookCardBtnState(false);

                if (cardDataArr == null)
                    return;

                let cardType = ZJHModel.getCardType(cardDataArr);
                this.firstChairLookingCard = true;
                setTimeout(() => {
                    this.firstChairLookingCard = false;

                    if (this.chairCtrlArr == null)
                        return;
                    if (this.chairCtrlArr[index] && this.chairCtrlArr[index].getGiveUpStatus() == true)
                        return;

                    this.cardCtrlArr[index].showFirstChairCardType(cardType);
                }, 1000)
            }
            if (!!this.operationWidgetCtrl.operationType && this.operationWidgetCtrl.operationType == 1) {
                this.chairCtrlArr[index].setFirstChairLookedCardStatus();
            }
        }
        this.cardCtrlArr[index].showCards(showType, cardTye, cardDataArr, index);
    },

    onUserCompare: function (chairId, loserchairId, comparechairId) {
        let callback = function () {
            if (loserchairId === this.myChairID) {
                ZJHAudio.compareFailure();
            } else if (chairId === this.myChairID || comparechairId === this.myChairID) {
                ZJHAudio.compareVictory();
            }

            if (!!this.compareUI) {
                this.compareUI.destroy();
                this.compareUI = null;
            }

            //输的人显示输
            let loseIndex = this.getUserChairIndex(loserchairId);
            this.chairCtrlArr[loseIndex].showResult(false, null, this.cardCtrlArr[loseIndex], loserchairId === this.myChairID);
            // 如果自己输了则不能再操作
            if (loserchairId === this.myChairID) {
                this.operationWidgetCtrl.node.active = false;

                this.cardCtrlArr[loseIndex].showFirstChairFailCompareSprite();

                // 比牌输，显示重新匹配按钮
                // this.continueNode.active = true;
                continueBtn.show(this.gameTypeInfo.gameTypeID)
            }
            //显示先手和状态信息
            this.chairCtrlArr[this.getUserChairIndex(chairId)].showOther();
            this.chairCtrlArr[this.getUserChairIndex(comparechairId)].showOther();
        }.bind(this);

        this.chairCtrlArr[this.getUserChairIndex(chairId)].showOperationStatus("bipai");

        //在进行比牌动画时隐藏操作界面
        this.operationWidgetCtrl.node.active = false;

        //隐藏先手和状态信息
        this.chairCtrlArr[this.getUserChairIndex(chairId)].hideOther();
        this.chairCtrlArr[this.getUserChairIndex(comparechairId)].hideOther();

        this.isFirstChairFailCompare = (loserchairId === chairId);

        let compareUI = cc.instantiate(this.comparePrefab);
        compareUI.parent = this.node;
        compareUI.getComponent('ZJHCompare').startCompare(this.chairCtrlArr[this.getUserChairIndex(chairId)], this.chairCtrlArr[this.getUserChairIndex(comparechairId)], callback, loserchairId === chairId, loserchairId === this.myChairID);
        this.compareUI = compareUI;
    },

    onUserShowdown: function (chairId, cardType, cardDataArr) {
        let index = this.getUserChairIndex(chairId);
        this.chairCtrlArr[index].showCardGroup();
        if (!!this.cardCtrlArr[index]) {
            this.cardCtrlArr[index].showCards('showdown', cardType, cardDataArr, index);
        }
    },

    createCard: function (index, cardsArr, isTween) {
        // 创建牌组件
        let cards = cc.instantiate(this.cardsPrefab);
        cards.parent = this.chairPos[index];
        cards.zIndex = 1;
        let ctrl = cards.getComponent('ZJHCards');
        // 设置牌的位置
        ctrl.setPos(index, cardsArr, this.chairPos[index].position, isTween);
        // 如果有牌删除之前的牌
        if (!!this.cardCtrlArr[index]) this.cardCtrlArr[index].node.destroy();
        this.cardCtrlArr[index] = ctrl;

        /*if(!!cardsArr){
            this.scheduleOnce(function () {
                ctrl.showCards(cardsArr);
                ctrl.hideAllBtns();
            }.bind(this), 1);
        }*/
        /*this.scheduleOnce(function () {
            // 创建牌组件
            let cards = cc.instantiate(this.cardsPrefab);
            cards.parent = this.chairPos[index];
            cards.zIndex = 1;
            let ctrl = cards.getComponent('ZJHCards');
            // 设置牌的位置
            ctrl.setPos(index, this.chairPos[index].position, noAnim);
            // 如果有牌删除之前的牌
            if (!!this.cardCtrlArr[index]) this.cardCtrlArr[index].node.destroy();
            this.cardCtrlArr[index] = ctrl;
    
            if(!!cardsArr){
                this.scheduleOnce(function () {
                    ctrl.showCards(cardsArr);
                    ctrl.hideAllBtns();
                }.bind(this), 1);
            }
        }.bind(this), index * 0.1);*/
    },
    //发牌
    createCards: function () {
        for (let i = 0; i < this.chairCtrlArr.length; ++i) {
            let index = this.getUserChairIndex(i);
            let chairCtrl = this.chairCtrlArr[index];
            if (!chairCtrl) continue;
            this.createCard(index, null, true);
        }
    },

    leaveRoom: function () {
        Confirm.show('确认退出游戏?', function () {
            if (Global.Player.getPy('roomID')) {
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Waiting.show();
            } else {
                this.exitGame();
            }
        }.bind(this), function () {});
    },

    exitGame: function () {
        ViewMgr.goBackHall(Config.GameType.ZJH);
    },

    checkCompareEnd: function (endData) {
        if (!!this.compareUI) {
            this.scheduleOnce(function () {
                this.checkCompareEnd(endData);
            }, 1.5);
        } else {
            this.showGameEnd(endData);
        }
    },

    showGameEnd: function (data) {
        //有牌的人才显示输赢
        cc.log('========showGameEnd===========', data)
        for (let i = 0; i < this.chairCtrlArr.length; ++i) {
            let index = this.getUserChairIndex(i);
            if (!this.chairCtrlArr[index]) continue;
            //this.chairCtrlArr[index].showResult(data.winnerchairId === this.myChairID, data.winnerCardType);
            this.chairCtrlArr[index].showGoldChangeEff(data.scoreChangeArr[i], this.profitPercentage);
            this.chairCtrlArr[index].showTag("3")
        }
        //隐藏下注入息操作界面
        this.operationWidgetCtrl.node.active = false;

        //显示赢家的牌
        let winnerIndex = this.getUserChairIndex(data.winnerchairId);
        this.chairCtrlArr[winnerIndex].showCardGroup(true);
        this.cardCtrlArr[winnerIndex].showCards("showdown", data.userCardTypeArr[data.winnerchairId], data.userCardIndexArr[data.winnerchairId], winnerIndex);
        this.cardCtrlArr[winnerIndex].hideFirstChairCardType();

        if (!!this.cardCtrlArr[0]) {
            //显示亮牌操作
            this.cardCtrlArr[0].showShowBtn();
            if (data.winnerchairId === this.myChairID) {
                //赢家是自己，则不展示亮牌
                this.cardCtrlArr[0].hideAllBtns();
            } else {
                //赢家不是自己，显示自己的牌
                this.cardCtrlArr[0].showCards("", data.userCardTypeArr[this.myChairID], data.userCardIndexArr[this.myChairID], 0);
            }
        }

        //奖池的钱移动到赢家的座位处
        this.chipPool.collectChips(this.chairPos[winnerIndex]);

        // 刷新用户信息
        this.updateUserInfo();

        //3秒之后再自动准备开始游戏
        this.scheduleOnce(function () {
            // 显示匹配按钮
            // this.continueNode.active = true;
            continueBtn.show(this.gameTypeInfo.gameTypeID)
        }.bind(this), 3);
    },

    showGuzhuyizhiCompare: function (msg, showIndex) {
        showIndex = showIndex || 0;
        let showData = msg.data[showIndex];
        let startIndex = this.getUserChairIndex(showData.chairId);
        let compareIndex = this.getUserChairIndex(showData.comparechairId);
        let lostIndex = this.getUserChairIndex(showData.loserchairId);
        let callback = function () {
            if (showData.loserchairId === this.myChairID) {
                ZJHAudio.compareFailure();

                this.operationWidgetCtrl.node.active = false;

                // 如果自己输了，则显示重新匹配界面
                //this.continueNode.active = true;
                continueBtn.show(this.gameTypeInfo.gameTypeID)
            } else if (showData.chairId === this.myChairID || showData.comparechairId === this.myChairID) {
                ZJHAudio.compareVictory();
            }

            if (!!this.compareUI) {
                this.compareUI.destroy();
                this.compareUI = null;
            }
            //输的人显示输
            this.chairCtrlArr[lostIndex].showResult(showData, null, this.cardCtrlArr[lostIndex], showData.loserchairId === this.myChairID);
            //显示先手和状态信息=
            this.chairCtrlArr[startIndex].showOther();
            this.chairCtrlArr[compareIndex].showOther();

            showIndex++;
            if (!!msg.data[showIndex]) {
                this.showGuzhuyizhiCompare(msg, showIndex);
            }
        }.bind(this);

        //在进行比牌动画时隐藏操作界面
        this.operationWidgetCtrl.node.active = false;

        //隐藏先手和状态信息
        this.chairCtrlArr[startIndex].hideOther();
        this.chairCtrlArr[compareIndex].hideOther();

        let compareUI = cc.instantiate(this.comparePrefab);
        compareUI.parent = this.node;
        compareUI.getComponent('ZJHCompare').startCompare(this.chairCtrlArr[startIndex], this.chairCtrlArr[compareIndex], callback.bind(this), showData.loserchairId === showData.chairId);
        this.compareUI = compareUI;
    },

    getUserChairIndex: function (chairID) {
        return (chairID - this.myChairID + 5) % 5;
    },
    //开启当前操作者头像进度条
    stopClock: function () {
        cc.log("停止所有定时器")
        for (let i = 0; i < this.chairCtrlArr.length; i++) {
            if (this.chairCtrlArr[i]) {
                this.chairCtrlArr[i].stopClock()
            }
        }
    },

    startClock(index, operationtime) {
        this.stopClock()
        cc.log("操作者椅子号：" + index + "我的椅子号" + this.getUserChairIndex(this.myChairID))
        if (index != undefined) {
            this.chairCtrlArr[index].startClock(operationtime)
        }
    }
});