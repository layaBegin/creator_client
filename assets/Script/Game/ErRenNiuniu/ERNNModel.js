var model = module.exports;
var ERNNProto = require('./ERNNProto');
var RoomProto = require('../../API/RoomProto');


model.setEntryRoomData = function (msg) {
    // cc.log("======二人牛牛进入房间数据：",JSON.stringify(msg,null,4));
    /*
    ======二人牛牛进入房间数据： {
    "roomUserInfoArr": [
        {
            "userInfo": {
                "uid": "14833",
                "nickname": "15628093583",
                "avatar": "UserInfo/head_1",
                "robot": true,
                "vipLevel": 5,
                "sex": 0,
                "gold": 940.66
            },
            "chairId": 0,
            "userStatus": 1
        },
        {
            "userInfo": {
                "uid": "100035",
                "nickname": "1557128318790",
                "avatar": "UserInfo/head_8",
                "gold": 6666.66,
                "permission": 1,
                "spreaderID": "",
                "sex": 0,
                "vipLevel": 1,
                "diamondLocked": false
            },
            "chairId": 1,
            "userStatus": 0
        }
    ],
    "gameData": {
        "gameRule": {
            "bureau": 0,
            "memberCount": 2,
            "baseScore": 2,
            "otherRule": {
                "shangzhuang": 8,
                "fanbei": 2,
                "shangzhuangfen": 0,
                "qiangzhuang": 1,
                "tuizhu": 0,
                "difenArr": {
                    "0": 1,
                    "1": 2,
                    "2": 3,
                    "3": 4,
                    "4": 5
                },
                "teshupai": 7
            }
        },
        "curBureau": 1,
        "roomId": 184090,
        "gameStatus": 1,
        "bankChairId": null,
        "pourScoreArr": [
            0,
            0,
            0,
            0,
            0,
            0
        ],
        "robBankArr": [],
        "gameStartChairIdArr": [],
        "profitPercentage": "5",
        "askForExitArr": []
    },
    "kindId": 11,
    "roomID": 184090,
    "pushRouter": "SelfEntryRoomPush"
}
}
    */
    var data = msg.gameData;
    // 游戏数据,随时可恢复场景
    this.kindId = msg.kindId;
    this.Maxcallbanker = data.Maxcallbanker || null;
    this.addscoresArr = data.addscoresArr || null;
    if (data.Statustime)
        this.Statustime = data.Statustime;
    this.userArr = msg.roomUserInfoArr;
    this.gameRule = data.gameRule;
    this.baseScore = this.gameRule.baseScore;
    this.curBureau = data.curBureau;
    this.roomId = data.roomId;
    this.gameStatus = data.gameStatus;
    this.bankChairId = data.bankChairId;
    this.robBankArr = data.robBankArr;

    this.pourScoreArr = data.pourScoreArr;
    this.canPourScoreArr = data.canPourScoreArr;
    this.cardArr = data.cardArr;
    this.showCardArr = data.showCardArr;
    if (this.gameStatus === ERNNProto.GAME_STATUS_RESOUT) {
        this.cardsArr = data.resout.cardsArr;
    } else {
        this.cardsArr = data.cardsArr;
    }
    if (data.resout)
        this.finalScoreArr = data.resout.finalScoreArr;

    // this.cardsArr = data.cardsArr;
    // this.resout = this.resout;
    // if (this.resout && Array.isArray(this.resout.finalScoreArr))
    //     this.finalScoreArr = this.resout.finalScoreArr;

    this.gameStartChairIdArr = data.gameStartChairIdArr;
    this.profitPercentage = data.profitPercentage;

    var i;
    if (!this.showCardArr || this.showCardArr.length === 0) {
        this.showCardArr = [];
        for (i = 0; i < this.gameRule.memberCount; ++i) {
            this.showCardArr[i] = 0;
        }
    }

    this.myUid = Global.Player.getPy('uid');
    cc.log("========this.myUid:", this.myUid);
    for (i = 0; i < this.userArr.length; ++i) {
        if (this.userArr[i].userInfo.uid === this.myUid) {
            this.myChairId = this.userArr[i].chairId;
            this.userArr[i].userInfo.nickname = this.userArr[i].userInfo.nickname;
        } else {
            this.userArr[i].userInfo.nickname = Global.Player.convertNickname(this.userArr[i].userInfo.nickname);
        }

    }

    Global.MessageCallback.addListener('RoomMessagePush', this);
    Global.MessageCallback.addListener('GameMessagePush', this);
};

model.setGameData = function (data) {
    for (var key in data) {
        if (data.hasOwnProperty(key) && this.hasOwnProperty(key)) {
            this[key] = data[key];
        }
    }
};

// 游戏未开始时的数据
model.clearGameData = function () {
    var memberCount = this.gameRule.memberCount;
    this.cardsArr = [];
    this.pourScoreArr = [];
    this.showCardArr = [];
    for (var i = 0; i < memberCount; ++i) {
        this.pourScoreArr[i] = 0;
        this.showCardArr[i] = 0;
        this.cardsArr[i] = [];
    }
};

model.messageCallbackHandler = function (router, msg) {
    if (router === 'RoomMessagePush') {
        if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
            this.addPlayer(msg.data.roomUserInfo);
        } else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
            this.delPlayer(msg.data.roomUserInfo);
            if (msg.data.roomUserInfo.chairId === this.myChairId) {
                this.onDestroy();
            }
        } else if (msg.type === RoomProto.USER_READY_PUSH) {
            this.answerUserReadyPush(msg.data.chairId);
        } else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
            this.answerRoomDismissPush(msg.data.reason);
        } else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
            GameConfig.initGameRooms([msg.data.gameTypeInfo])
            this.answerRoomSceneInfoPush(msg.data);
        }
    } else if (router === 'GameMessagePush') {
        if (msg.type === ERNNProto.CAN_POUR_SCORE_PUSH) {
            this.answerCanPourScorePush(msg.data.gameStatus, msg.data.addscoresArr);
        } else if (msg.type === ERNNProto.POUR_SCORE_PUSH) {
            this.answerPourScorePush(msg.data.chairId, msg.data.score);
        } else if (msg.type === ERNNProto.SHOW_CARD_PUSH) {
            this.answerShowCardPush(msg.data.chairId, msg.data.cardArr);
        } else if (msg.type === ERNNProto.RESOUT_CARD_PUSH) {
            this.answerResoutCardPush(msg.data.chairId, msg.data.cardArr);
        } else if (msg.type === ERNNProto.GAME_RESOUT_PUSH) {
            this.answerGameResoutPush(msg.data.bankIndex, msg.data.cardsArr, msg.data.finalScoreArr, msg.data.profitPercentage);
        } else if (msg.type === ERNNProto.GAME_STATUS_PUSH) {
            this.answerGameStatusPush(msg.data.gameStatus);
        } else if (msg.type === ERNNProto.BANK_CHANGE_PUSH) {
            this.answerBankChangePush(msg.data.bankChairId, msg.data.gameStatus, msg.data.robBankArr);
        } else if (msg.type === ERNNProto.ROB_RATE_BANK_PUSH) {
            this.answerRobRateBank(msg.data.chairId, msg.data.rate);
        }
    }
};

model.answerRoomSceneInfoPush = function (data) {
    if (data.gameTypeInfo && data.gameTypeInfo.gameTypeID)
        this.gameTypeID = data.gameTypeInfo.gameTypeID;
};

model.answerCanPourScorePush = function (gameStatus, scoresArr) {
    this.clearGameData();
    this.gameStatus = gameStatus;
    this.addscoresArr = scoresArr;
};

model.answerPourScorePush = function (chairId, score) {
    this.pourScoreArr[chairId] = score;
};

model.answerShowCardPush = function (chairId, cardArr) {
    var chairIndex = this.getChairIdIndex(chairId);
    this.showCardArr[chairId] = true;
    this.cardsArr[chairIndex] = cardArr;
};

model.answerResoutCardPush = function (chairId, cardArr) {
    if (chairId === this.myChairId) {
        // var chairIndex = this.getChairIdIndex(chairId);
        // this.showCardArr[chairIndex] = true;

        this.setMyCardArr(cardArr);
    }
};

model.answerGameResoutPush = function (bankIndex, cardsArr, finalScoreArr, profitPercentage) {
    this.bankChairId = this.getChairIdByIndex(bankIndex);
    this.cardsArr = cardsArr;
    ++this.curBureau;
    this.bankChairId = null;
    this.finalScoreArr = finalScoreArr;
    this.profitPercentage = profitPercentage;

    console.log(this.gameStartChairIdArr, this.userArr);
    for (var i = 0; i < finalScoreArr.length; ++i) {
        var player = this.getPlayerByChairId(this.gameStartChairIdArr[i]);
        if (CC_DEV && !player) {
            console.log("ERNN:: ", finalScoreArr, this.gameStartChairIdArr[i], i);
        }


        if (finalScoreArr[i] > 0) {
            player.userInfo.gold += finalScoreArr[i] * (1 - this.getProfitPercentage());
        } else {
            player.userInfo.gold += finalScoreArr[i];
        }
        if ((player.userStatus & RoomProto.userStatusEnum.READY) > 0) {
            player.userStatus -= RoomProto.userStatusEnum.READY;
        }
    }
};

model.answerGameStatusPush = function (gameStatus) {
    this.gameStatus = gameStatus;
    var i;
    if (this.gameStatus === ERNNProto.GAME_STATUS_ROBBANK) {
        this.gameRule.memberCount = this.gameStartChairIdArr.length;
        for (i = 0; i < this.gameRule.memberCount; ++i) {
            this.robBankArr[i] = -1;
        }
        this.recordGameStartChairId();
    } else if (this.gameStatus === ERNNProto.GAME_STATUS_POURSCORE) {
        this.pourScoreArr = [];
        for (i = 0; i < this.gameRule.memberCount; ++i) {
            this.pourScoreArr[i] = 0;
        }
    } else if (this.gameStatus === ERNNProto.GAME_STATUS_SORTCARD) {
        this.cardsArr = [];
        for (i = 0; i < this.gameRule.memberCount; ++i) {
            this.cardsArr[i] = [];
        }
    }
};


model.answerBankChangePush = function (bankChairId, gameStatus, robBankArr) {
    this.bankChairId = bankChairId;
    this.robBankArr = robBankArr;
    this.answerGameStatusPush(gameStatus);
};

model.answerRobRateBank = function (chairId, rate) {
    this.robBankArr[chairId] = rate;
};

model.answerUserReadyPush = function (chairId) {
    var player = this.getPlayerByChairId(chairId);
    if (player) {
        player.userStatus |= RoomProto.userStatusEnum.READY;
    }
};

model.answerRoomDismissPush = function (reason) {
    this.onDestroy();
};

model.getProfitPercentage = function () {
    return this.profitPercentage / 100;
};

model.getRobBankArr = function () {
    return this.robBankArr;
};

model.getCardsArr = function () {
    return this.cardsArr;
};

model.getPourScoreArr = function () {
    return this.pourScoreArr;
};

model.getGameRule = function () {
    return this.gameRule;
};

model.getGameStatus = function () {
    return this.gameStatus;
};

model.getShowCardArr = function () {
    return this.showCardArr;
};

model.getCanPourScoreArr = function () {
    return this.canPourScoreArr;
};

model.onDestroy = function () {
    Global.MessageCallback.removeListener('RoomMessagePush', this);
    Global.MessageCallback.removeListener('GameMessagePush', this);
};

model.getRoomId = function () {
    return this.roomId;
};

model.getBankChairId = function () {
    return this.bankChairId;
};

model.getAllChairId = function () {
    var chairIdArr = [];
    for (var i = 0; i < this.userArr.length; ++i) {
        chairIdArr.push(this.userArr[i].chairId);
    }
    return chairIdArr;
};

model.getCurBureau = function () {
    return this.curBureau;
};

model.getMaxBureau = function () {
    return this.gameRule.bureau;
};

model.getChairCount = function () {
    return 2;
};
//视图转换
model.getViewId = function (chairId) {
    let chairCount = this.getChairCount();
    return (chairId + chairCount - this.myChairId + 1) % chairCount; //视图转换
},
model.getMyChairId = function () {
    return this.myChairId;
};
//获取玩家信息
model.getPlayerByChairId = function (chairId) {
    for (var i = 0; i < this.userArr.length; ++i) {
        if (this.userArr[i].chairId === chairId) {
            return this.userArr[i];
        }
    }
    return null;
};
model.getSexByChairId = function (chairId) {
    let player = this.getPlayerByChairId(chairId);
    return player.userInfo.sex;
};
model.addPlayer = function (player) {
    player.userInfo.nickname = Global.Player.convertNickname(player.userInfo.nickname);
    for (var i = 0; i < this.userArr.length; ++i) {
        if (this.userArr[i].chairId === player.chairId) {
            this.userArr.splice(i, 1);
        }
    }
    this.userArr.push(player);
};

model.delPlayer = function (player) {
    for (var i = 0; i < this.userArr.length; ++i) {
        if (this.userArr[i].chairId === player.chairId) {
            this.userArr.splice(i, 1);
        }
    }
};

model.getGameEnd = function () {
    return (!!this.isGameEnd);
};

model.setGameEnd = function () {
    this.isGameEnd = true;
};

model.setMyCardArr = function (cardArr) {
    this.cardArr = cardArr;
};

model.getMyCardArr = function () {
    return this.cardArr;
};

model.recordGameStartChairId = function () {
    this.gameStartChairIdArr = [];
    for (var i = 0; i < 6; ++i) {
        if (this.getPlayerByChairId(i)) {
            this.gameStartChairIdArr.push(i);
        }
    }
};
//
model.getChairIdIndex = function (chairId) {
    // cc.log("======获取viewId getChairIdIndex this.gameStartChairIdArr:%s,this.gameStartChairIdArr.indexOf(chairId):%s ",JSON.stringify(this.gameStartChairIdArr),this.gameStartChairIdArr.indexOf(chairId));
    return this.gameStartChairIdArr.indexOf(chairId);
};

model.getChairIdByIndex = function (index) {
    if (index < 0 || index >= this.gameStartChairIdArr.length) {
        return null;
    } else {
        return this.gameStartChairIdArr[index];
    }
};
model.getFinalScoreArr = function () {
    if (this.finalScoreArr)
        return this.finalScoreArr;

}