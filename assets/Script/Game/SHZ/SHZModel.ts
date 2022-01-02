import RoomProto = require('../../API/RoomProto');
import SHZProto = require('./SHZProto');

export class SHZModel {
    private static _instance:SHZModel = undefined;

    private profitPercentage: number = undefined;
    private roomID: number = undefined;
    private selfUid: number = undefined;
    private kindId: number = undefined;
    private baseMoneyCount: number;
    private enddata: any = undefined;
    private nickname: string = undefined;
    private gold: number = undefined;
    private prizePreRound: any = undefined;
    private checkData: any;
    private freeTimes: number;
    private maryData: any;

    public static getInstance():SHZModel{
        if(! this._instance){
            this._instance = new SHZModel();
        }
        return this._instance;
    }

    public setEntryRoomData = function (msg) {
        let data = msg.gameData;
        this.profitPercentage = data.profitPercentage;
        this.roomID = msg.roomID;
        this.selfUid = Global.Player.getPy('uid');
        this.kindId = msg.kindId;
        this.baseMoneyCount = data.gameRule.baseScore;
        this.gold = Global.Player.getPy('gold');

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
    };

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {
                // if (msg.data.roomUserInfo.chairId === this.myChairId) {
                //     this.onDestroy();
                // }
            }
            else if (msg.type === RoomProto.ROOM_DISMISS_PUSH) {
                this.answerRoomDismissPush(msg.data.reason);
            }
            else if(msg.type === RoomProto.ROOM_USER_INFO_CHANGE_PUSH){
                this.answerChangeInfoPush(msg.data);
            }
            else if (msg.type === RoomProto.GET_ROOM_SCENE_INFO_PUSH) {
                GameConfig.initGameRooms([msg.data.gameTypeInfo]);
                this.answerRoomSceneInfoPush(msg.data);
            }
        }
        else if (router === 'GameMessagePush') {
            if (msg.type === SHZProto.ROB_RESULTS_PUSH) {
                this.answerRobResultPush(msg.data.enddata);
            }
            else if (msg.type === SHZProto.ROB_RESULTS_PUSH) {
                this.baseMoneyCount = msg.data.baseMoneyCount;
            }
            else if (msg.type === SHZProto.ROB_START_MARY_PUSH) {
                    this.answerStartMaryPush(msg.data);
            }
            else if (msg.type === SHZProto.ROB_START_DICE_PUSH){
                this.answerStartDicePush(msg.data.enddata);
            }
        }
    }
    answerStartDicePush(enddata){
        this.prizePreRound = enddata.prizePerRound;
    }
    answerStartMaryPush(data){
        this.maryData = data.enddata;
    }
    answerRobResultPush(enddata){
        this.enddata = enddata;
        this.prizePreRound = enddata.prizePerRound;
        this.checkData = enddata.checkData;
        this.freeTimes = enddata.freeTimes;
    }
    answerChangeInfoPush(data){
        this.nickname = data.changeInfo.nickname;
        this.gold = data.changeInfo.gold;
    }
    answerRoomSceneInfoPush(data){
        this.baseMoneyCount = data.gameData.gameRule.baseScore;
    }
    answerRoomDismissPush(reason) {
        this.onDestroy();
    }
    onDestroy(){
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        if (SHZModel._instance) {
            SHZModel._instance = null;
        }
    }
    getKindId(){
        return this.kindId;
    }
    getProfitPercentage(){
        return this.profitPercentage;
    }
    getRoomId(){
        return this.roomID;
    }
    getBaseScore(){
        return this.baseMoneyCount;
    }
    // setBaseScore(baseMoneyCount){
    //     this.baseMoneyCount = baseMoneyCount;
    // }

    getEndData(){
        return this.enddata;
    }
    getSelfUid(){
        return this.selfUid;
    }
    getNickname(){
        return this.nickname;
    }
    getGold(){
        return this.gold;
    }
    getPrizePreRound(){
        return this.prizePreRound;
    }
    getCheckData(){
        return this.checkData;
    }
    getFreeTimes(){
        return this.freeTimes;
    }
    getMaryData(){
        return this.maryData;
    }

}
