import { roomProto } from "../Shared/Api_old";


const { ccclass, property } = cc._decorator;

@ccclass
export class Continue extends cc.Component {

    gameTypeID = null

    show(gameTypeID: string) {
        this.gameTypeID = gameTypeID
        this.node.active = true
    }
    hide() {
        this.node.active = false
    }
    onBtnClk() {
        Global.CCHelper.playPreSound();
        if (Global.Player.isInRoom()) {
            Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
            Waiting.show();
        }
        Matching.show(this.gameTypeID)

    }
}
