var api = module.exports;
var RoomProto = require('../API/RoomProto');

api.roomMessageNotify = function (data) {
    CC_DEV && console.warn("RoomAPI.js->roomMessageNotify 已废弃, 请使用 API.room.roomMessageNotify, 并移除导入代码 require('...RoomAPI');");
    API.room.roomMessageNotify(data);
    return;
    var router = 'game.gameHandler.roomMessageNotify';
    Global.NetworkManager.notify(router, data);
    /**
     * 监听 318 消息超时
     * 当前定时器在 418 返回接口处清除
     */
    if (data.type == RoomProto.GET_ROOM_SCENE_INFO_NOTIFY) {
        api.roomMessageNotify.prototype.timeout = setTimeout(() => {
            Confirm.show("当前房间异常,已解散,返回大厅后请重试", () => {
                ViewMgr.goBackHall(Matching.kindId);
            });
        }, 3000);
    }
};

api.gameMessageNotify = function (data) {
    CC_DEV && console.warn("RoomAPI.js->gameMessageNotify 已废弃, 请使用 API.room.gameMessageNotify, 并移除导入代码 require('...RoomAPI');");
    API.room.gameMessageNotify(data);
    return;

    var router = 'game.gameHandler.gameMessageNotify';
    Global.NetworkManager.notify(router, data);

};
