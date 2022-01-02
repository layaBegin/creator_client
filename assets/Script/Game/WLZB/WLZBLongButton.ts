import LongButton from "../GameCommon/LongButton";
import WLZBProto = require('./WLZBProto');
import {WLZBModel} from "./WLZBModel";


export enum btnType {
    ready = -1,
    rolling = 0,
    auto = 1,
    defen = 2,
    wuLong = 3
}

const {ccclass, property} = cc._decorator;

@ccclass
export default class WLZBLongButton extends LongButton {
    @property(cc.Node)
    startIcon:cc.Node = undefined;
    @property(cc.Node)
    autoIcon:cc.Node = undefined;
    @property(cc.Node)
    defenIcon:cc.Node = undefined;

    WLZBMainScript = undefined;
    btnType = btnType.ready;
    onLoad() {
        super.onLoad();
        cc.log("======进入子类onLoad");
        this.WLZBMainScript = this.node.parent.parent.getComponent("WLZBMainDialog")
    }

    btn_status(status){

        if(status == 'short')
        {
            if (this.btnType === btnType.ready) {
                //切换按钮，发送事件
                if (WLZBModel.getInstance().getGold() - WLZBModel.getInstance().getBaseScore() * this.WLZBMainScript.ADD_COUNT < 0){
                    Tip.makeText("金币不足，请先充值");
                    return;
                }
                this.changeBtnState(btnType.rolling);
                API.room.gameMessageNotify(WLZBProto.gameStartNotify(this.WLZBMainScript.ADD_COUNT));

            }
            else if(this.btnType === btnType.auto){
                this.WLZBMainScript.isAuto = false;
                this.changeBtnState(btnType.rolling)
            }
            AudioMgr.playSound("Game/WLZB/sound/5D_button")
        }
         else if (status === "long")
         {
            if (this.btnType === btnType.ready){
                //切换按钮，发送事件
                if (WLZBModel.getInstance().getGold() - WLZBModel.getInstance().getBaseScore() * this.WLZBMainScript.ADD_COUNT < 0){
                    Tip.makeText("金币不足，请先充值");
                    return;
                }
                this.changeBtnState(btnType.auto);
                this.WLZBMainScript.isAuto = true;
                API.room.gameMessageNotify(WLZBProto.gameStartNotify(this.WLZBMainScript.ADD_COUNT));

            }
             AudioMgr.playSound("Game/WLZB/sound/5D_button")

         }
    }

    /**
     *
     * @param state -1 ready, 0 start, 1 auto, 2 defen, 3 rolling
     */
    changeBtnState(state){
        // if (state === btnType.auto && this.btnState === btnType.auto) return;
        this.btnType = state;

        switch (state) {
            case btnType.ready:
                this.startIcon.active = true;
                this.autoIcon.active = false;
                this.defenIcon.active = false;
                Global.CCHelper.changeToGray(this.startIcon,0);
                break;
            case btnType.rolling:
                this.startIcon.active = true;
                this.autoIcon.active = false;
                this.defenIcon.active = false;
                Global.CCHelper.changeToGray(this.startIcon,1);
                break;
            case  btnType.auto:
                this.startIcon.active = false;
                this.autoIcon.active = true;
                this.defenIcon.active = false;
                break;
            case btnType.defen:
                this.startIcon.active = false;
                this.autoIcon.active = false;
                this.defenIcon.active = true;
                break;
            case btnType.wuLong:
                this.startIcon.active = true;
                this.autoIcon.active = false;
                this.defenIcon.active = false;
                Global.CCHelper.changeToGray(this.startIcon,1);
                break;
        }
    }


}
