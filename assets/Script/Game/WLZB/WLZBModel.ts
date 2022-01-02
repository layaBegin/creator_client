import RoomProto = require('../../API/RoomProto');
import WLZBProto = require('./WLZBProto');

export class WLZBModel {
    private static _instance:WLZBModel = undefined;

    private profitPercentage: number = undefined;
    private roomID: number = undefined;
    private selfUid: number = undefined;
    private kindId: number = undefined;
    private baseScore: number;
    private enddata: any = undefined;
    private nickname: string = undefined;
    private gold: number = undefined;
    private prizePreRound: any = undefined;
    private checkData: any = undefined;
    private freetime: number = undefined;

    public static getInstance():WLZBModel{
        if(! this._instance){
            this._instance = new WLZBModel();
        }
        return this._instance;
    }

    public setEntryRoomData = function (msg) {
        let data = msg.gameData;
        this.profitPercentage = data.profitPercentage;
        this.roomID = msg.roomID;
        this.selfUid = Global.Player.getPy('uid');
        this.kindId = msg.kindId;
        this.baseScore = data.gameRule.baseScore;
        this.gold = Global.Player.getPy('gold');

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
    };

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === RoomProto.USER_LEAVE_ROOM_PUSH) {

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
            if (msg.type === WLZBProto.ROB_RESULTS_PUSH) {
                this.answerRobResultPush(msg.data.enddata);
            }
            else if (msg.type === WLZBProto.ROB_RESULTS_PUSH) {
                this.baseScore = msg.data.baseScore;
            }
            else if (msg.type === WLZBProto.ROB_START_WULONG_PUSH) {
                this.answerStartWulongPush(msg.data);
            }
        }
    }
    answerStartDicePush(enddata){
        this.prizePreRound = enddata.prizePerRound;
    }
    answerStartWulongPush(data){
        this.freetime = data.freetime;
    }
    answerRobResultPush(enddata){
        this.enddata = enddata;
        this.prizePreRound = enddata.prizePerRound;
        this.checkData = enddata.checkData;
        this.freetime = enddata.freetime;
    }
    answerChangeInfoPush(data){
        cc.log("=====跟新金币 this。gold：",this.gold);
        this.gold = data.changeInfo.gold;
    }
    answerRoomSceneInfoPush(data){
        this.baseScore = data.gameData.gameRule.baseScore;
    }
    answerRoomDismissPush(reason) {
        this.onDestroy();
    }
    onDestroy(){
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        if (WLZBModel._instance) {
            WLZBModel._instance = null;
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
        return this.baseScore;
    }

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
        return this.freetime;
    }


}
