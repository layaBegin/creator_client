let model = module.exports;
let gameProto = require('./BRNNProto');
let RoomProto = require('../../API/RoomProto');

model.setEntryRoomData = function (msg) {
    this.onLoad(msg);
};

model.onLoad = function (msg) {
    let data = msg.gameData;
    this.profitPercentage = data.profitPercentage;
    this.roomID = msg.roomID;
    this.selfUid = Global.Player.getPy('uid');
    this.kindId = msg.kindId;
};

model.onDestroy = function () {
};