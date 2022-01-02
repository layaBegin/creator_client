

const {ccclass, property} = cc._decorator;

@ccclass
export default class RunCar extends cc.Component {

    // @property(dragonBones.ArmatureDisplay)
    // runCarArmature: dragonBones.ArmatureDisplay = null;
    @property(dragonBones.ArmatureDisplay)
    runCar1: dragonBones.ArmatureDisplay = null;

    isPlaying:boolean = false;
    // @property
    // text: string = 'hello';
    onLoad () {
        this.runCar1.enabled  = false;
    }
    turnOnTheLamp() {
        if (this.isPlaying) return;
        cc.log("===== 打开跑圈动画");
        this.runCar1.enabled  = true;
        // this.runCarArmature.playAnimation("newAnimation", 1);
        this.runCar1.playAnimation("newAnimation",0);
        this.isPlaying = true;
    }

    turnOffTheLamp() {
        this.runCar1.enabled  = false;
        // this.runCarArmature.node.active = false;
        this.isPlaying = false;
    }
}
