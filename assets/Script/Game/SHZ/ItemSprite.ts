
const { ccclass, property } = cc._decorator;

@ccclass
export default class ItemSprite extends cc.Component {
    @property(cc.Node)
    heightLight: cc.Node = undefined;
    @property
    posIndex: number = 0;
    @property(dragonBones.ArmatureDisplay)
    ani1: dragonBones.ArmatureDisplay = undefined;
    @property(dragonBones.ArmatureDisplay)
    ani2: dragonBones.ArmatureDisplay = undefined;
    iconIndex: number = 0;
    onLoad() {
        this.ani1.node.active = false;
        this.ani2.node.active = false;
    }

    setDragonAsset1(dragonAsset, dragonAtlasAsset) {
        if (!this.ani1.node || !this.node.parent) return;
        this.ani1.dragonAsset = dragonAsset;
        this.ani1.dragonAtlasAsset = dragonAtlasAsset;
        this.ani1.node.active = false;
    }

    callFunc1() {
        this.ani1.node.active = false;
        console.log("debug::ani1")
    }
    callFunc2() {
        this.ani2.node.active = false;
        console.log("debug::ani2")
    }
    callFuncStart() {
    }
    setDragonAsset2(dragonAsset, dragonAtlasAsset) {
        if (!this.ani2.node || !this.node.parent) return;
        this.ani2.dragonAsset = dragonAsset;
        this.ani2.dragonAtlasAsset = dragonAtlasAsset;
        this.ani2.node.active = false;
    }
    playAni1() {
        this.ani1.node.active = true;
        /**
         * 在设置监听事件之前 必须先设置 armatureName
         */
        this.ani1.armatureName = "Sprite";
        this.ani1.off(dragonBones.EventObject.COMPLETE, this.callFunc1, this);
        this.ani1.on(dragonBones.EventObject.COMPLETE, this.callFunc1, this);
        this.ani1.playAnimation("Sprite", 1);
    }
    playAni2() {
        this.ani2.node.active = true;
        this.ani2.armatureName = "Sprite";
        this.ani2.off(dragonBones.EventObject.COMPLETE, this.callFunc2, this);
        this.ani2.on(dragonBones.EventObject.COMPLETE, this.callFunc2, this);
        this.ani2.playAnimation("Sprite", 1);
    }


}
