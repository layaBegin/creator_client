

import BCBMProto = require('./BCBMProto');
import roomAPI = require("../../Api/RoomAPI");
import RoomProto = require('../../API/RoomProto');



export class BCBMModel{
    private static _instance:BCBMModel;

    private gameStatus:number = undefined;
    private statusTime:number =  undefined;
    private Statustime:number = undefined;
    private myUid:number = undefined;
    private oddsArr = [];
    private dirRecord = [];

    public profitPercentage:number = null;
    public redLimitInfo = [];
    public baseScoreArr = [];
    public kindId:number = null;
    private Resultindex: number = 0;
    private roomID: number = undefined;

    public static getInstance():BCBMModel{
        if(this._instance == null){
            this._instance = new BCBMModel();
        }
        return this._instance;
    }

    constructor(){
    }

    public initData(msg){
        let data = msg.gameData;
        this.kindId = msg.kindId;
        this.redLimitInfo =  data.parameters.config.gameConfig;
        this.baseScoreArr = data.parameters.baseScoreArr;
        this.myUid = Global.Player.getPy('uid');
        this.dirRecord = data.dirRecord;
        this.profitPercentage = data.parameters.profitPercentage;
        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
    }
    messageCallbackHandler = function (router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.chairId === this.myChairId) {
                    this.onDestroy();
                }
            }
            else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
                this.answerRoomDismissPush(msg.data.reason);
            }
            else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo])
                this.answerRoomSceneInfoPush(msg.data);
            }
        }
        else if (router === 'GameMessagePush') {
            if (msg.type === BCBMProto.GAME_START_PUSH) {
                this.answerGameStartPush(msg.data);
            }
            else if (msg.type === BCBMProto.GAME_RESULT_PUSH) {
                this.answerGameResultPush(msg.data);
            }
        }
    }
    answerRoomSceneInfoPush(data){
        this.roomID = data.roomID;
        this.redLimitInfo = data.gameData.parameters.config.gameConfig;
        this.oddsArr = data.gameData.parameters.config.odds;
        this.gameStatus = data.gameData.gameStatus;
        this.statusTime = data.gameData.statusTime;
    }
    answerRoomDismissPush = function (reason) {
        this.onDestroy();
    };
    onDestroy(){
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        if (BCBMModel._instance) {
            BCBMModel._instance = null;
        }
    }
    answerGameStartPush(data){
        this.gameStatus = BCBMProto.gameStatus.GAME_STARTED;
        this.statusTime = data.Statustime;

    }
    answerGameResultPush(data){
        this.gameStatus = BCBMProto.gameStatus.GAME_END;
        this.Resultindex  = data.Resultindex;
    }

    getGameStatus(){
        return this.gameStatus;
    }
    getMyUid(){
        return this.myUid;
    }
    getOddsById(end){
        if (this.oddsArr[end]) {
            return this.oddsArr[end];
        }
    }
    getdirRecord(){
        return this.dirRecord;
    }
    getResultindex(){
        return this.Resultindex;
    }
    getstatusTime(){
        return this.statusTime;
    }

    getRoomId() {
        return this.roomID;
    }
};