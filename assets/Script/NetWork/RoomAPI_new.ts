// var api = module.exports;
import RoomProto = require('../API/RoomProto');

export class RoomAPI_new {
    roomMessageNotify(data) {
        var router = 'game.gameHandler.roomMessageNotify';
        NetworkMgr.notify(router, data);
        /**
         * 监听 318 消息超时
         * 当前定时器在 418 返回接口处清除
         */
        if (data.type == RoomProto.GET_ROOM_SCENE_INFO_NOTIFY) {
            this.roomMessageNotify.prototype.timeout = setTimeout(() => {
                Confirm.show("当前房间异常,已解散,返回大厅后请重试", () => {
                    ViewMgr.goBackHall(Matching.kindId);
                });
            }, 3000);
        }
    };
    gameMessageNotify(data) {
        var router = 'game.gameHandler.gameMessageNotify';
        NetworkMgr.notify(router, data);
    };
}

