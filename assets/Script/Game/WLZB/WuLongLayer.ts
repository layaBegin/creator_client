import WLZBProto = require('./WLZBProto');
import BaseView from "../../BaseClass/BaseView";
const {ccclass, property} = cc._decorator;

@ccclass
export default class WuLongLayer extends BaseView {

    @property(cc.Sprite)
    middleIcon: cc.Sprite = undefined;

    @property(cc.Button)
    buttons:cc.Button[] = [];
    @property(dragonBones.ArmatureDisplay)
    wulongAni: dragonBones.ArmatureDisplay = undefined;
    @property(dragonBones.ArmatureDisplay)
    chooseAni:dragonBones.ArmatureDisplay = undefined;


    start () {
        AudioMgr.startPlayBgMusic("Game/WLZB/sound/5D_Selection_BG", null);
        this.wulongAni.playAnimation("newAnimation",0);
    }

    onBtnClick(event: cc.Event,param: string){
        AudioMgr.playSound("Game/WLZB/sound/5D_Selection_Confirm");
        let index = 0;
        if (param === "25"){
            index = 0;
            this.startWuLongNotify(index);
        }
        else if(param === "20"){
            index = 1;
            this.startWuLongNotify(index);
        }
        else if(param === "15"){
            index = 2;
            this.startWuLongNotify(index);
        }
        else if(param === "13"){
            index = 3;
            this.startWuLongNotify(index);
        }
        else if(param === "10"){
            index = 4;
            this.startWuLongNotify(index);
        }
        var callFunc = function(){
            this.middleIcon.node.active = true;
        };
        let callFunc1 = function () {
        };
        Global.CCHelper.updateSpriteFrame('Game/WLZB/image/freeGame/' + "middle_" + index , this.middleIcon,callFunc.bind(this));

        this.playChooseAni(callFunc1);

        for (let i = 0; i < this.buttons.length; i++) {
            this.buttons[i].interactable = false;
        }
        this.scheduleOnce(function () {
            let viewUrl = ViewMgr.getNodeUrl(this.node);
            ViewMgr.close(viewUrl);
            this.node.removeFromParent();
        }.bind(this),1)
    }
    startWuLongNotify(index:number){
        this.scheduleOnce(function () {
            API.room.gameMessageNotify(WLZBProto.gameStartWuLongNotify(index))
        },0.5)

    }

    playChooseAni(callFunc1){
        this.chooseAni.node.active = true;
        this.chooseAni.armatureName = "armatureName";
        this.chooseAni.off(dragonBones.EventObject.COMPLETE,callFunc1);
        this.chooseAni.on(dragonBones.EventObject.COMPLETE,callFunc1);
        this.chooseAni.playAnimation("shandian",1);
    }
}
