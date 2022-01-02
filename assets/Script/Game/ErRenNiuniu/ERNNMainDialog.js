var ERNNModel = require('./ERNNModel');
var ERNNProto = require('./ERNNProto');
var RoomProto = require('../../API/RoomProto');
var HallApi = require('../../API/HallAPI');
let roomAPI = require('../../API/RoomAPI');
let Actions = require('../../Actions').Actions;

var RoomMessageRouter = 'game.gameHandler.roomMessageNotify';
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';

cc.Class({
    extends: cc.Component,

    properties: {
        chipiLabel: cc.Label,
        cuoPaiToggle: cc.Toggle,
        headPoint0: cc.Node,
        headPoint1: cc.Node,
        waitTipPoint: cc.Node,
        stateItem: cc.Prefab,
        rateRobNode: cc.Node, // 抢庄按钮
        cardPrefab: cc.Prefab,
        headItem: cc.Prefab,
        pourScoreNode: cc.Node, //下注按钮
        cardPoint0: cc.Node,
        cardPoint1: cc.Node,
        cardControl0: cc.Prefab,
        cardControl1: cc.Prefab,
        jieSuanPos0: cc.Node, //赢的结果
        jieSuanPos1: cc.Node,
        jisuankuang: cc.Node, //计算条
        cuoPaiMask: cc.Node,
        showOpenBntNode: cc.Node, // 开牌按钮
        goOn_Btn: cc.Button, //继续游戏
        audioItem: cc.Prefab,
        cardBackPoint: cc.Node, //背牌位置
        exitPoint: cc.Node, //退出按钮
        // rateBntArr:[cc.Node],
        pourBntArr: [cc.Node]

    },

    onLoad: function () {
        this.label1 = null;
        this.label2 = null;
        this.label3 = null;
        this.labelSum = null;
        this.betArray = [];


        var audioItem = cc.instantiate(this.audioItem);
        audioItem.parent = this.node;
        this.audioManager = audioItem.getComponent('ERNNAudioNode');
        // this.dizhuLabel = cc.find("dizhuSprite/dizhuLabel", this.node).getComponent(cc.Label);
        // this.dizhuLabel.string = "底注：" + ERNNModel.baseScore;
        // AudioMgr.startPlayBgMusic('ErRenNiuniu/sound/bg_music');

        let self = this;
        //加载exit
        // AssetMgr.loadResSync("GameCommon/GameDropDownList/GameDropDownList", function (err, prefab) {
        //     let gameDropDownList = cc.instantiate(prefab);
        this.exitPoint.getComponent('GameDropDownList').setGameInfo(ERNNModel.kindId, ERNNModel.profitPercentage);
        // });

        this.cardItemArr = [];
        this.headItemArr = [];
        //头像处理
        let headItem0 = cc.instantiate(this.headItem);
        headItem0.active = false;
        let headItem1 = cc.instantiate(this.headItem);
        headItem1.active = false;

        this.headPoint0.addChild(headItem0);
        this.headPoint1.addChild(headItem1);
        this.headItemArr.push(headItem0.getComponent("ERNNHeadItem"));
        this.headItemArr.push(headItem1.getComponent("ERNNHeadItem"));

        //卡牌处理
        let cardControl0 = cc.instantiate(this.cardControl0);
        let cardControl1 = cc.instantiate(this.cardControl1);
        this.cardPoint0.addChild(cardControl0);
        this.cardPoint1.addChild(cardControl1);

        this.cardItemArr.push(cardControl0.getComponent("ERNNCardItem"));
        this.cardItemArr.push(cardControl1.getComponent("ERNNCardItem"));

        var chairCount = ERNNModel.getChairCount();


        cc.instantiate(this.stateItem).parent = this.waitTipPoint;
        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        this.offLineAndClient();

        // 获取场景
        this.scheduleOnce(function () {
            roomAPI.roomMessageNotify(RoomProto.getRoomSceneInfoNotify());
        }, 0.2);
    },
    // start: function () {
    //     AudioMgr.startPlayBgMusic('ErRenNiuniu/sound/bg_music');
    // },
    reset: function () {
        this.headPoint0.active = true;
        this.headPoint1.active = true;
        this.waitTipPoint.active = true;
        this.waitTipPoint.setPosition(0, 100);
        this.rateRobNode.active = false;
        this.goOn_Btn.node.active = false; //

        this.pourScoreNode.active = false;
        this.showOpenBntNode.active = false; //显示开牌按钮
        this.jisuankuang.active = false;
        this.jieSuanPos0.active = false;
        this.jieSuanPos1.active = false;
        this.chipiLabel.string = "";
        this.betArray = [];
        this.cuoPaiToggle.interactable = true;
        var isChecked = cc.sys.localStorage.getItem('ERNN_Toggle')
        if (isChecked === "Y")
            this.cuoPaiToggle.isChecked = true;
        else
            this.cuoPaiToggle.isChecked = false;



    },
    // 恢复场景 断线重连
    offLineAndClient: function () {
        this.reset();
        var myChairId = ERNNModel.getMyChairId();


        // let chairArr = ERNNModel.getAllChairId();
        //根据服务器传过来的椅子号 显示对应的 头像
        for (let j = 0; j < ERNNModel.getChairCount(); ++j) {
            let viewId = ERNNModel.getViewId(j);
            if (ERNNModel.getPlayerByChairId(j))
                this.showHeadAndCardByChairId(j);
        }

        var gameStatus = ERNNModel.getGameStatus();
        //状态的断线重连
        this.waitTipPoint.getChildByName("ERNNStateItem").getComponent("ERNNStateItem").answerGameStatusPush(gameStatus, ERNNModel.Statustime);
        var myChairIndex = ERNNModel.getChairIdIndex(myChairId);
        //准备状态
        if (gameStatus === ERNNProto.GAME_STATUS_PREPARE) {
            Global.API.room.roomMessageNotify(RoomProto.userReadyNotify(true));
        }
        //抢庄状态
        else if (gameStatus === ERNNProto.GAME_STATUS_ROBBANK) {
            var robBankArr = ERNNModel.getRobBankArr();
            if (myChairIndex >= 0 && robBankArr[myChairId] === -1) {
                this.showRateRobButton(true);
            } else {
                this.showRateRobButton(false);
            }
        }
        //押注状态
        else if (gameStatus === ERNNProto.GAME_STATUS_POURSCORE) {
            if (myChairId !== ERNNModel.getBankChairId()) {
                var pourScoreArr = ERNNModel.getPourScoreArr();
                if (myChairIndex >= 0 && pourScoreArr[myChairId] === 0) {
                    this.answerCanPourScorePush(gameStatus, ERNNModel.addscoresArr, true);
                }
            }
        }
        //看牌状态
        else if (gameStatus === ERNNProto.GAME_STATUS_SORTCARD) {
            this.pourScoreNode.active = false;
            var showCardArr = ERNNModel.getShowCardArr();
            if (myChairIndex >= 0 && showCardArr[myChairId] !== 1) {
                this.showOpenBntNode.active = true;
                this.setYouNiuBtnEnable(false);
            }
            //还原下注
            let i = ERNNModel.getChairCount() - 1 - ERNNModel.getBankChairId();
            this.chipiLabel.string = ERNNModel.getPourScoreArr()[i];
        }
        //显示结果中
        else if (gameStatus === ERNNProto.GAME_STATUS_RESOUT) {
            let finalScoreArr = ERNNModel.getFinalScoreArr();
            if (!Array.isArray(finalScoreArr)) return;
            var myChairId = ERNNModel.getMyChairId();
            var myChairIndex = ERNNModel.getChairIdIndex(myChairId);
            // if (!myChairIndex) return; //我的椅子号取不到，说明 我不在游戏中
            //结算Label
            this.jieSuanPos0.active = true;
            this.jieSuanPos1.active = true;
            let myScore = null;
            let otherScore = null;
            for (let i = 0; i < finalScoreArr.length; ++i) {
                if (i === myChairId)
                    myScore = finalScoreArr[i];
                else
                    otherScore = finalScoreArr[i];
            }
            let winLabel0 = this.jieSuanPos0.getChildByName("winLabel").getComponent(cc.Label);
            let loseLabel0 = this.jieSuanPos0.getChildByName("loseLabel").getComponent(cc.Label);
            let winLabel1 = this.jieSuanPos1.getChildByName("winLabel").getComponent(cc.Label);
            let loseLabel1 = this.jieSuanPos1.getChildByName("loseLabel").getComponent(cc.Label);

            if (myScore > 0) {
                winLabel1.string = "+" + myScore;
                loseLabel1.string = "";
                winLabel0.string = "";
                loseLabel0.string = otherScore;
            } else {
                winLabel1.string = "";
                loseLabel1.string = myScore;
                winLabel0.string = "+" + otherScore;
                loseLabel0.string = "";

            }
        }
        let chairCount = ERNNModel.getChairCount();
        //头像和卡牌分别 重置
        for (var k = 0; k < chairCount; ++k) {
            if (ERNNModel.getPlayerByChairId(k)) {
                let viewId = ERNNModel.getViewId(k);
                this.headItemArr[viewId].offLineAndClient();
                this.cardItemArr[viewId].offLineAndClient();

            }
        }
    },
    //服务器返回消息
    messageCallbackHandler: function (router, msg) {
        var myChairId = ERNNModel.getMyChairId();
        if (router === 'RoomMessagePush') {
            //401玩家准备
            if (msg.type === RoomProto.USER_READY_PUSH) {
                this.answerUserReadyPush(msg.data.chairId);
            }
            //进入房间
            else if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                this.showHeadAndCardByChairId(msg.data.roomUserInfo.chairId);
            }
            //离开房间
            else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.chairId === myChairId) {
                    if (!Matching.isMatching) {
                        this.exitGame();
                    }
                } else {
                    this.hideHeadItemByChairId(msg.data.roomUserInfo.chairId);
                }
            }
            //离开房间
            else if (msg.type === RoomProto.USER_LEAVE_ROOM_RESPONSE) {
                if (msg.data.chairId === myChairId) {
                    Waiting.hide();
                }
            } else if (msg.type === RoomProto.GAME_END_PUSH) {

            } else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
                Confirm.show("当前房间已解散！", () => {
                    ViewMgr.goBackHall(Config.GameType.ERNN)
                })
            } else if (msg.type === RoomProto.USER_RECONNECT_PUSH) { }
        } else if (router === 'GameMessagePush') {
            //最大抢庄倍数
            if (msg.type === ERNNProto.MAX_CALL_BANKER_PUSH) {
                this.answerShowRobRateBtn(msg.data.Maxcallbanker);
            }
            //抢庄下推
            if (msg.type === ERNNProto.ROB_RATE_BANK_PUSH) {
                this.answerRobRateBank(msg.data.chairId);
            }
            //可以押注
            else if (msg.type === ERNNProto.CAN_POUR_SCORE_PUSH) {
                this.answerCanPourScorePush(msg.data.gameStatus, msg.data.addscoresArr, false);

                // this.answerCanPourScorePush(msg.data.gameStatus, msg.data.scoresArr, false);
            }
            //押注回复
            else if (msg.type === ERNNProto.POUR_SCORE_PUSH) {
                this.answerPourScorePush(msg.data.chairId, msg.data.score);
            }
            //发牌
            else if (msg.type === ERNNProto.RESOUT_CARD_PUSH) {
                // this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
            }
            //点击开牌按钮  开牌
            else if (msg.type === ERNNProto.SHOW_CARD_PUSH) {
                this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
            }
            //游戏结果
            else if (msg.type === ERNNProto.GAME_RESOUT_PUSH) {
                this.answerGameResoutPush(msg.data.finalScoreArr, msg.data.bankIndex);
            }
            //游戏状态变化推送
            else if (msg.type === ERNNProto.GAME_STATUS_PUSH) {
                this.answerGameStatusPush(msg.data.gameStatus);
            } else if (msg.type === ERNNProto.CALLBANKARR_CHANGE_PUSH) {
                this.randBanker(msg.data)
            }
        } else if (router === 'ReConnectSuccess') {
            //Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
            if (Global.Player.isInRoom()) {
                Global.API.hall.joinRoomRequest(ERNNModel.getRoomId(), function () {
                    // Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getUserReconnectNotifyData());
                }, undefined, Config.GameType.ERNN);
            } else {
                Confirm.show("当前房间已解散", () => {
                    this.exitGame();
                })
            }
        }
    },

    //抢庄最大倍数下推
    answerShowRobRateBtn: function (maxRobRate) {
        if (typeof maxRobRate === "undefined") return;
        this.rateRobNode.active = true;
        // if (maxRobRate === 0){
        //     this.rateBntArr[0].active = true;
        // }
        // else {
        //     for (let i = 0; i < Math.floor(maxRobRate); i++) {
        //         this.rateBntArr[i].active = true;
        //     }
        // }

    },

    answerFourCardPush: function () {
        var myChairIndex = ERNNModel.getChairIdIndex(ERNNModel.getMyChairId());
    },
    //准备状态
    answerUserReadyPush: function (chairId) {
        this.reset();
        let chairArr = ERNNModel.getAllChairId();
        //根据服务器传过来的椅子号 显示对应的 头像
        for (let j = 0; j < chairArr; ++j) {
            this.showHeadAndCardByChairId(chairArr[j]);
        }
    },
    //抢庄回复
    answerRobRateBank: function (chairId) {
        if (chairId === ERNNModel.getMyChairId()) {
            this.rateRobNode.active = false;
        }
    },
    //可以押注
    answerCanPourScorePush: function (gameStatus, addscoresArr, isOffLine) {
        if (!Array.isArray(addscoresArr) || addscoresArr.length <= 0) return;
        let bankChairId = ERNNModel.getBankChairId();
        let myChairId = ERNNModel.getMyChairId();
        if (!(myChairId == bankChairId)) {
            this.pourScoreNode.active = true;
            for (let i = 0; i < addscoresArr.length; i++) {
                this.pourBntArr[i].active = true;
                this.pourBntArr[i].getChildByName("Label").getComponent(cc.Label).string = addscoresArr[i] //.toFixed(2);
            }
        } else {
            this.pourScoreNode.active = false;
        }
    },

    //押注回复
    answerPourScorePush: function (chairId, score) {
        if (chairId === ERNNModel.getMyChairId()) {
            this.pourScoreNode.active = false;
        }
        var score = score //.toFixed(2);
        this.chipiLabel.string = score;
        let viewId = ERNNModel.getViewId(chairId);
        this.onChipBet(viewId, score);
    },
    //发牌阶段
    answerResoutCardPush: function (chairId, cardArr) {
        this.cuoPaiToggle.interactable = false;
        // this.onSendCardData(chairId, cardArr);
    },
    //开牌回复
    answerShowCardPush: function (chairId, cardArr) {
        if (chairId === ERNNModel.getMyChairId()) {
            this.showOpenBntNode.active = false; //开牌按钮关闭
            this.jisuankuang.active = false;
            if (this.peekCard) {
                this.peekCard.node.destroy();
                this.peekCard = null;
            }
            this.cuoPaiMask.active = false;
        }
    },
    getPercentFinalScore: function (finalScoreArr) {
        var fsArr = [];
        for (let i = 0; i < finalScoreArr.length; i++) {
            let percent = ERNNModel.getProfitPercentage();
            if (finalScoreArr[i] > 0)
                fsArr[i] = (finalScoreArr[i] * (1 - percent)).toFixed(2);
            else
                fsArr[i] = finalScoreArr[i].toFixed(2);
        }
        return fsArr;
    },
    //407 游戏结果
    answerGameResoutPush: function (finalScoreArr, bankIndex) {
        this.waitTipPoint.setPosition(0, 100);
        var myChairId = ERNNModel.getMyChairId();
        var myChairIndex = ERNNModel.getChairIdIndex(myChairId);
        var finalScoreArr = this.getPercentFinalScore(finalScoreArr);

        //结算Label
        this.jieSuanPos0.active = true;
        this.jieSuanPos1.active = true;
        let myScore = null;
        let otherScore = null;
        for (let i = 0; i < finalScoreArr.length; ++i) {
            if (i === myChairId)
                myScore = finalScoreArr[i] //.toFixed(2);
            else
                otherScore = finalScoreArr[i] //.toFixed(2);
        }
        let winLabel0 = this.jieSuanPos0.getChildByName("winLabel").getComponent(cc.Label);
        let loseLabel0 = this.jieSuanPos0.getChildByName("loseLabel").getComponent(cc.Label);
        let winLabel1 = this.jieSuanPos1.getChildByName("winLabel").getComponent(cc.Label);
        let loseLabel1 = this.jieSuanPos1.getChildByName("loseLabel").getComponent(cc.Label);
        var self = this;
        let i = 0;
        let len = this.betArray.length;
        if (myScore > 0) {
            this.schedule(function () {
                let bet = self.betArray[i];
                bet.runAction(
                    cc.moveTo(0.5, self.headPoint1.getPosition())
                );
                self.scheduleOnce(function () {
                    bet.destroy();
                    if (i == len - 1) {

                    }
                }, 0.5);
                if (i % 2 === 0)
                    AudioMgr.playSound('GameCommon/Sound/win_bet');
                i++;
            }.bind(this), 0.05, len - 1, 0.5);
            // AudioMgr.playSound('GameCommon/NN/sound1/sound_win_coin');

            winLabel1.string = "+" + myScore;
            loseLabel1.string = "";

            winLabel0.string = "";
            loseLabel0.string = otherScore;
            AudioMgr.playSound('GameCommon/NN/sound1/win');
        } else {
            this.schedule(function () {
                let bet = self.betArray[i];
                bet.runAction(
                    cc.moveTo(0.5, self.headPoint0.getPosition())
                );
                self.scheduleOnce(function () {
                    bet.destroy();
                    if (i == len - 1) {

                    }
                }, 0.5);
                if (i % 2 === 0)
                    AudioMgr.playSound('GameCommon/Sound/win_bet');
                i++;
            }.bind(this), 0.05, len - 1, 0.5);

            winLabel1.string = "";
            loseLabel1.string = myScore;

            winLabel0.string = "+" + otherScore;
            loseLabel0.string = "";
            AudioMgr.playSound('GameCommon/NN/sound1/lose');
        }
    },

    //游戏状态 服务器主动推送
    answerGameStatusPush: function (gameStatus) {
        //准备状态还原所有场景
        if (gameStatus === ERNNProto.GAME_STATUS_PREPARE) { } else if (gameStatus === ERNNProto.GAME_STATUS_POURSCORE) { }
        //请抢庄
        else if (gameStatus === ERNNProto.GAME_STATUS_ROBBANK) {
            this.showRateRobButton(true);
        } else if (gameStatus === ERNNProto.GAME_STATUS_SORTCARD) {
            // this.pourScoreNode.active = false;
        }
    },

    showRateRobButton: function (state) {
        this.rateRobNode.active = state;

    },

    onButtonClick: function (event, param) {
        //退出按钮
        if (param === 'dismiss') {
            Confirm.show('确认退出游戏?', function () {
                Global.NetworkManager.notify(RoomMessageRouter, RoomProto.getAskForDismissNotifyData());
                Waiting.show();
            }, function () { });
        } else if (param === 'ready') {
            Global.NetworkManager.notify(RoomMessageRouter, RoomProto.userReadyNotify(true));
        }
        //叫庄和不叫统一走 明牌抢庄消息
        else if (param === 'no_rob') {
            Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getRobRateBankNotifyData(0));
            AudioMgr.playSound("ErRenNiuniu/sound/bujiao_0");
        } else if (param === 'rob_1') {
            Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getRobRateBankNotifyData(1));
        }

        //押注请求
        else if (param === 'pour_1') {
            Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getPourScoreNotifyData(ERNNModel.addscoresArr[0]));
        } else if (param === 'pour_2') {
            Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getPourScoreNotifyData(ERNNModel.addscoresArr[1]));
        } else if (param === 'pour_3') {
            Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getPourScoreNotifyData(ERNNModel.addscoresArr[2]));
        } else if (param === 'pour_4') {
            Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getPourScoreNotifyData(ERNNModel.addscoresArr[3]));
        } else if (param === 'kaipai' || param === 'youniu') {
            Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getShowCardNotifyData());
        } else if (param === "toggle") {
            var isChecked = this.cuoPaiToggle.isChecked;
            var temp = "N";
            if (isChecked)
                temp = "Y";
            cc.sys.localStorage.setItem('ERNN_Toggle', temp);
        }
        Global.CCHelper.playPreSound();
        // AudioMgr.playSound("GameCommon/Sound/button-click");
    },


    // onSendCardData: function (chairId, cardDataArray) {
    //     let firstControl = true;
    //     let playerChairArray = [];
    //     let myChairId = ERNNModel.getMyChairId();
    //     for (var i = 0; i < cardDataArray.length; ++i) {
    //         if (cardDataArray[i] != null) {
    //             let viewID = (chairId + 3 - myChairId) % 2;
    //             playerChairArray.push({
    //                 viewID: viewID,
    //                 cardIndex: i
    //             });
    //         }
    //     }
    //     let cardCount = 5 * 2;
    //     let cardArray = [];
    //     // 加载 Prefab
    //     let self = this;
    //     AssetMgr.loadResSync("ErRenNiuniu/cardBack", function (err, prefab) {
    //         if (!cc.isValid(self) || !cc.isValid(self.node)) {
    //             return;
    //         }
    //         for (i = 0; i < cardCount; ++i) {
    //             let newNode = cc.instantiate(prefab);
    //             newNode.parent = self.node;
    //             newNode.setPosition(self.node.convertToNodeSpaceAR(self.cardBackPoint.parent.convertToWorldSpaceAR(self.cardBackPoint.getPosition())));
    //             newNode.setScale(0);
    //             cardArray.push(newNode);
    //         }
    //     });
    //
    //     let m = 0;
    //     let selfindex = 0;
    //     let cardCon0 = this.cardItemArr[0];
    //     let cardCon1 = this.cardItemArr[1];
    //     this.cardPoint0.active = true;
    //     this.cardPoint1.active = true;
    //     this.schedule(function () {
    //
    //         let k = Math.floor(m % 2);
    //         let card = cardArray[m];
    //         let isLast = (m + 1) == cardArray.length;
    //
    //         let viewID = playerChairArray[k].viewID;
    //
    //         if (k === 1) {
    //             selfindex++;
    //             let selfIsLast = selfindex == 5
    //             cardCon1.setCardData(cardDataArray);
    //             let desPos = cardCon1.getCardPos(Math.floor(m / 2));
    //             desPos = this.node.convertToNodeSpaceAR(desPos);
    //             let isCuopai = this.cuoPaiToggle.isChecked;
    //             this.runMyOwnCard(isCuopai, card, desPos, Math.floor(m / 2), cardCon1, isLast, selfIsLast);
    //         } else {
    //             let desPos = cardCon0.getCardPos(Math.floor(m / 2));
    //             desPos = this.node.convertToNodeSpaceAR(desPos);
    //             this.runOtherCard(card, desPos, Math.floor(m / 2), cardCon0, isLast);
    //         }
    //         AudioMgr.playSound("GameCommon/NN/sound1/sendCard");
    //
    //         ++m;
    //
    //     }.bind(this), 0.2, cardCount - 1, 0);
    // },
    // runMyOwnCard: function (isCuopai, card, desPos, m, cardControl, isLast, selfIsLast) {
    //     if (isCuopai && selfIsLast) {
    //         //搓牌特效
    //         this.cuoPaiMask.active = true;
    //         this.waitTipPoint.setPosition(0, 140);
    //
    //         var self = this;
    //         AssetMgr.loadResSync("PeekCard/PeekCard", cc.Prefab, function (err, prefab) {
    //             if (err) {
    //                 cc.log("======PeekCard加载错误");
    //             } else {
    //                 if (!cc.isValid(self) || !cc.isValid(self.cuoPaiMask)) {
    //                     return;
    //                 }
    //                 let newNode = cc.instantiate(prefab);
    //                 newNode.parent = self.cuoPaiMask.parent;
    //                 self.cuoPaiMask.parent.zIndex = 100;
    //                 self.peekCard = newNode.getComponent("PeekCard");
    //                 self.peekCard._moveSpeed = 0.7;
    //                 self.peekCard.setCardSize(cc.size(250 * 2, 179 * 2));
    //                 self.peekCard.setCardBack("GameCommon/cuoPaiCards/cardBack.png");
    //                 self.peekCard.setCardFace(cardControl.getCardImgRes(m));
    //                 self.peekCard.setFinishCallBack(function () {
    //                     setTimeout(function () {
    //                         Global.NetworkManager.notify(GameMessageRouter, ERNNProto.getShowCardNotifyData());
    //                     }, 1000)
    //                 });
    //                 self.peekCard.init();
    //             }
    //         });
    //         card.removeFromParent();
    //         if (selfIsLast) {
    //             this.doSendCardFinish();
    //         }
    //
    //     } else {
    //         card.runAction(cc.spawn(
    //             cc.moveTo(0.15, desPos),
    //             cc.scaleTo(0.15, 1)
    //         ));
    //         this.scheduleOnce(function () {
    //             card.destroy();
    //             var cb = null;
    //             if (selfIsLast) {
    //                 cb = this.doSendCardFinish.bind(this);
    //             }
    //             cardControl.runFlopCard(m, cb);
    //
    //         }.bind(this), 0.15);
    //     }
    // },
    //
    //
    // runOtherCard: function (card, desPos, m, cardControl, isLast) {
    //     card.runAction(cc.spawn(
    //         cc.moveTo(0.2, desPos),
    //         cc.scaleTo(0.2, 1)
    //     ));
    //     this.scheduleOnce(function () {
    //         card.destroy();
    //         cardControl.showBackCard(m);
    //         // if (isLast) {
    //         //     this.doSendCardFinish();
    //         // }
    //     }.bind(this), 0.2);
    // },
    doSendCardFinish: function () {
        this.showOpenBntNode.active = !this.cuoPaiToggle.isChecked;

        this.setYouNiuBtnEnable(false);
        if (this.cuoPaiToggle.isChecked) {
            this.jisuankuang.active = false;
        } else {
            this.jisuankuang.active = true;
            this.label1 = this.jisuankuang.getChildByName("jisuanLabel_1").getComponent(cc.Label);
            this.label2 = this.jisuankuang.getChildByName("jisuanLabel_2").getComponent(cc.Label);
            this.label3 = this.jisuankuang.getChildByName("jisuanLabel_3").getComponent(cc.Label);
            this.labelSum = this.jisuankuang.getChildByName("jisuanLabel_sum").getComponent(cc.Label);

            this.updateJiSuan([]);
            this.cardItemArr[1].setClickEnabled(true);
        }

        this.cuoPaiToggle.interactable = true;
    },
    setYouNiuBtnEnable: function (enable) {
        let youNiuBtn = this.showOpenBntNode.getChildByName("youNiu_Bnt").getComponent(cc.Button);
        youNiuBtn.interactable = enable; //先置灰
    },
    //更新计算信息
    updateJiSuan: function (dataArray) {
        if (dataArray[0] == null)
            this.label1.string = "";
        else
            this.label1.string = Math.floor(dataArray[0]);
        if (dataArray[1] == null)
            this.label2.string = "";
        else
            this.label2.string = Math.floor(dataArray[1]);
        if (dataArray[2] == null)
            this.label3.string = "";
        else
            this.label3.string = Math.floor(dataArray[2]);
        if (dataArray.length == 3)
            this.labelSum.string = Math.floor(dataArray[0] + dataArray[1] + dataArray[2]);
        else
            this.labelSum.string = "";

    },

    //下注逻辑
    onChipBet: function (viewID, score) {

        if (!score || viewID >= ERNNModel.getChairCount()) return;
        let lBetType = [{
            a: "jetton001",
            b: "jetton005"
        },
        {
            a: "jetton01",
            b: "jetton05"
        },
        {
            a: "jetton1",
            b: "jetton5"
        },
        {
            a: "jetton10",
            b: "jetton50"
        },
        {
            a: "jetton100",
            b: "jetton500"
        },
        {
            a: "jetton1000",
            b: "jetton5000"
        },
        {
            a: "jetton1w",
            b: "jetton1w"
        },
        ];
        let startPosArr = [];
        startPosArr.push(this.headPoint0.getPosition());
        startPosArr.push(this.headPoint1.getPosition());

        let startPos = startPosArr[viewID];

        score = Global.Utils.formatNum2(score) * 100; //先将它乘以100
        let index = 0;
        let k = 0;
        let lBetFileName = [];
        while (true) {
            if (index < lBetType.length - 1)
                k = index;
            else
                k = lBetType.length - 1;

            let fileNameA = "GameCommon/Jetton/" + lBetType[k].a;
            let fileNameB = "GameCommon/Jetton/" + lBetType[k].b;

            if (index < lBetType.length - 1) { //1000以内的数 用各种筹码表示
                if (score % 10 < 5 && score % 10 > 0) { //小于5的筹码用1表示
                    for (let i = 0; i < score % 10; i++) {
                        lBetFileName.push(fileNameA);
                    }
                } else if (score % 10 >= 5) { //大于等于5的筹码用5 + 若干1表示
                    lBetFileName.push(fileNameB);
                    var iLeft = score % 10 - 5;
                    for (let i = 0; i < iLeft; i++) {
                        lBetFileName.push(fileNameA);
                    }
                }
            } else { //1000已上用1000的筹码表示
                let iBetNum = (index - 5) * 10;
                for (let i = 0; i < iBetNum + score % 10; i++) {
                    lBetFileName.push(fileNameA);
                }
            }

            score = Math.floor(score / 10); //将score个位干掉
            if (score <= 0) break;

            index++; //index加一次


        }
        let nodeArr = [];
        for (let i = 0; i < lBetFileName.length; i++) {
            nodeArr.push(new cc.Node());
            let nodeSprite = nodeArr[i].addComponent(cc.Sprite);
            Global.CCHelper.updateSpriteFrame(lBetFileName[i], nodeSprite);
            // Global.CCHelper.updateSpriteFrame(lBetFileName, nodeArr[i].addComponent(cc.Sprite));
            nodeArr[i].parent = this.node;
            nodeArr[i].setPosition(startPos);
            nodeArr[i].setScale(0.1);
            let targetPos = this.getChipPos();
            nodeArr[i].runAction(cc.spawn(
                cc.scaleTo(0.2, 0.7),
                cc.moveTo(0.2, targetPos)
            ));
            AudioMgr.playSound("GameCommon/Sound/bet_big");
            this.betArray.push(nodeArr[i]);
            if (i === lBetFileName.length - 1) {
                this.waitTipPoint.zIndex = nodeArr[i].zIndex + 1;
            }
        }
    },
    getChipPos: function () {
        var pos = {};

        pos.x = -50 + Math.random() * 150;
        pos.y = -50 + Math.random() * 100;
        return pos;
    },
    //显示 头像 和卡牌
    showHeadAndCardByChairId: function (chairId) {

        var viewId = ERNNModel.getViewId(chairId);
        // this.headItemArr[viewId].node.parent.active = true;
        this.cardItemArr[viewId].node.parent.active = true;
        let headMgr = this.headItemArr[viewId];
        let cardMgr = this.cardItemArr[viewId];
        let pos;

        pos = ['top', 'bottom'][viewId];
        headMgr.setHeadPosAndChairId(pos, chairId);
        cardMgr.setCardPosAndChairId(pos, chairId);
    },

    hideHeadItemByChairId: function (chairId) {
        var myChairId = ERNNModel.getMyChairId();
        var chairCount = ERNNModel.getChairCount();
        var viewId = ERNNModel.getViewId(chairId);
        this.headItemArr[viewId].node.parent.active = false;
        this.cardItemArr[viewId].node.parent.active = false;
        let jiesuanArr = [this.jieSuanPos0, this.jieSuanPos1];
        jiesuanArr[viewId].active = false; //结算条隐藏
    },

    exitGame: function () {
        ViewMgr.goBackHall(Config.GameType.ERNN);
    },
    getHeadItemByChairId: function (chairId) {
        var myChairId = ERNNModel.getMyChairId();
        var chairCount = ERNNModel.getChairCount();
        var index = (chairId + chairCount - myChairId) % chairCount;
        return this.headItemArr[index];
    },

    onDestroy: function () {
        AudioMgr.stopBgMusic();
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
    },

    getAudioManager: function () {
        return this.audioManager;
    },

    randBanker: function (data) {
        let nodearr = []
        if (data.bankerarr.length > 1) {
            for (let i = 0; i < data.bankerarr.length; i++) {
                let viewId = ERNNModel.getViewId(data.bankerarr[i]);
                nodearr.push(this.headItemArr[viewId].node.getChildByName('randBankerFrame'))
            }
        }
        Actions.RandBanker(nodearr)
    }
});