import {BCBMModel} from "./BCBMModel";
import {AssetManager} from "../../Models/AssetManager";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BCBMSettleLayer extends cc.Component {
    @property(dragonBones.ArmatureDisplay)
    bgAni: dragonBones.ArmatureDisplay = null;
    @property(cc.Sprite)
    carIcon: cc.Sprite = null;
    @property(cc.Label)
    defen: cc.Label = undefined;
    @property(cc.Label)
    beiShu: cc.Label = undefined;
    onLoad () {
        var callFunc1 = function () {
            this.bgAni.node.active = false;
        }.bind(this);
        this.bgAni.addEventListener(dragonBones.EventObject.COMPLETE, callFunc1, this)
    }
    init(end:number,changeScoreArr){
        this.bgAni.node.active = true;
        this.bgAni.playAnimation("jsk",1);
        this.carIcon.node.active = false;
        AssetManager.getInstance().loadResSync("BenChiBaoMa/newRes/settleIcon_" + end%4,cc.SpriteFrame, function (err, spriteFrame) {
            if (!!err) {
                cc.error(err);
            } else {
                if (cc.isValid(this.carIcon.node)) {
                    this.carIcon.spriteFrame = spriteFrame;
                    this.carIcon.node.active = true;
                    this.beiShu.string = "x"+BCBMModel.getInstance().getOddsById(end).toString();
                }
            }
        }.bind(this));
        for(let i = 0;i<changeScoreArr.length;i++){
            if (changeScoreArr[i].uid === BCBMModel.getInstance().getMyUid()) {
                this.defen.string = changeScoreArr[i].score.toString();
                return;
            }
        }
        this.defen.string = "0";
    }
    start () {
    }
    close(){
        this.node.runAction(cc.sequence(cc.scaleTo(0.5,0).easing(cc.easeOut(3)),cc.callFunc(function () {
            this.node.destroy();
        }.bind(this))))
    }
}
