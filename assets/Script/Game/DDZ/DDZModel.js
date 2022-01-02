
var model = module.exports;
var DDZProto = require('./DDZProto');
var RoomProto = require('../../API/RoomProto');


model.setEntryRoomData = function (msg) {
    cc.log("===斗地主进房数据:", JSON.stringify(msg, null, 4));
    /*
    "roomUserInfoArr": [
        {
            "userInfo": {
                "uid": "100028",
                "nickname": "戴韵萍MS",
                "avatar": "UserInfo/head_13",
                "gold": 66666367.66,
                "frontendId": "connector-2",
                "permission": 1,
                "spreaderID": "",
                "sex": 1,
                "vipLevel": 1,
                "allBetGold": 650,
                "account": "1558756104385",
                "auditArr": [
                    {
                        "createTime": 1558756104973,
                        "laveCode": 650,
                        "operateType": 1,
                        "auditType": 2,
                        "needInsCode": 66666666.66,
                        "type": 1001,
                        "status": false,
                        "gold": 66666666.66
                    }
                ],
                "auditArrComp": [],
                "robot": false,
                "diamondLocked": false
            },
            "chairId": 0,
            "userStatus": 0
        }
    ],
    "gameData": {
        "outcardtime": 14.999,
        "gameStatus": 0,
        "baseScore": 10,
        "gameTypeInfo": {
            "baseScore": 10,
            "expenses": 0,
            "gameTypeID": "2019461531515066868",
            "goldLowerLimit": 0,
            "goldUpper": 0,
            "kind": 80,
            "level": 2,
            "maxPlayerCount": 3,
            "minPlayerCount": 3,
            "matchRoom": 1,
            "minRobotCount": 1,
            "maxRobotCount": 2,
            "maxDrawCount": 1,
            "hundred": 0,
            "parameters": "{}"
        },
        "profitPercentage": 5,
        "askForExitArr": []
    },
    "kindId": 80,
    "roomID": 395454,
    "drawID": "",
    "pushRouter": "SelfEntryRoomPush"
}
    * */
    var data = msg.gameData;
    this.kindId = msg.kindId;
    this.gameStatus = data.gameStatus;
    this.outcardtime = data.outcardtime;
    this.landChairID = data.bankerUserChairID;
    this.baseScore = data.baseScore;

    this.anwswerGameResultPush(data.profitPercentage);
    //进房监听消息
    Global.MessageCallback.addListener('RoomMessagePush', this);
    Global.MessageCallback.addListener('GameMessagePush', this);
};



model.messageCallbackHandler = function (router, msg) {
    if (router === 'RoomMessagePush') {
        if (msg.type === RoomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
        }
        else if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
            // if(msg.data.roomUserInfo.chairId === this.myChairId) {
            //     this.onDestroy();
            // }
        }
        else if (msg.type === RoomProto.USER_READY_PUSH) {

        }
        else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
            this.answerRoomDismissPush(msg.data.reason);
        }
        //418 匹配消息
        else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
            this.answerRoomSceneInfoPush(msg.data);
            // this.gameInit(msg.data.roomUserInfoArr, msg.data.gameData);
        }
    }
    else if (router === 'GameMessagePush') {
        if (msg.type === DDZProto.GAME_START_PUSH) {
            this.answerGameStartPush(msg.data.landChairID, msg.data.landScore, msg.data.backCardArr);
        }
        else if (msg.type === DDZProto.GAME_RESULT_PUSH) {
            this.anwswerGameResultPush(msg.data.profitPercentage);
        }

    }
};
model.anwswerGameResultPush = function (profitPercentage) {
    this.profitPercentage = profitPercentage;
};
model.answerRoomDismissPush = function (reason) {
    this.onDestroy();
};
model.answerRoomSceneInfoPush = function (data) {
    this.gameTypeID = data.gameTypeInfo.gameTypeID;
    this.profitPercentage = data.gameData.profitPercentage;
    this.userhosting = data.gameData.userhosting;
    this.landChairID = data.gameData.bankerUserChairID;
    for (let i = 0; i < data.roomUserInfoArr.length; ++i) {
        let roomUserInfo = data.roomUserInfoArr[i];
        if (roomUserInfo.userInfo.uid === Global.Player.getPy('uid')) {
            this.myChairId = roomUserInfo.chairId;
            break;
        }
    }
};
model.answerGameStartPush = function (landChairID, landScore, backCardArr) {
    this.landChairID = landChairID;
    this.landScore = landScore;
    this.backCardArr = backCardArr;
};
model.onDestroy = function () {
    Global.MessageCallback.removeListener('RoomMessagePush', this);
    Global.MessageCallback.removeListener('GameMessagePush', this);
};
model.getBankerChairId = function () {
    return this.landChairID;
};
model.getProfitPercentage = function () {
    return this.profitPercentage / 100;
};
model.getMyChairId = function () {
    return this.myChairId;
}
model.ConstCardNum = function () {
    return 17;
}