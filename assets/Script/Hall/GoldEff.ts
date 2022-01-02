import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GoldEff extends BaseView {

    @property(dragonBones.ArmatureDisplay)
    eff: dragonBones.ArmatureDisplay = undefined;
    @property(cc.Label)
    gold: cc.Label = undefined;

    _isShowAction: boolean = false;     // 禁止打开动画
    _canClose: boolean = false;

    setGold(value: number | string) {
        if (value >= 0) {
            value = "+" + value;
        }
        this.gold.string = value.toString();
    }

    onOpen() {
        this._canClose = false;
        // this.eff.off(dragonBones.EventObject.COMPLETE);
        // this.eff.timeScale = 0.5;
        // this.eff.playAnimation("sanguang", 1);
        // this.eff.on(dragonBones.EventObject.COMPLETE, this.dragonBonesCOMPLETE.bind(this));
        setTimeout(() => {
            this._canClose = true;
        }, 1000);
    }

    hide() {
        if (this._canClose) {
            this.close(false);  // 不显示动画
            // this.node.active = false;
        }
    }

    dragonBonesCOMPLETE(event: any) {
        this._canClose = true;
    }

    start() {

    }

}
