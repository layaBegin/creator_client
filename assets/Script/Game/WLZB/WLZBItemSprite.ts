
const {ccclass, property} = cc._decorator;

@ccclass
export default class WLZBItemSprite extends cc.Component {

    @property(cc.Sprite)
    icon: cc.Sprite = undefined;
    @property
    posIndex:number = 0;
    @property(dragonBones.ArmatureDisplay)
    ani1:dragonBones.ArmatureDisplay = undefined;

    iconIndex:number = 0;
    onLoad () {
        this.ani1.node.active = false;
    }

    setDragonAsset1(dragonAsset: string, dragonAtlasAsset: string){
        var self = this;
        var callFunc = function(err, res){
            if (err) cc.error(err);
            this.ani1.dragonAtlasAsset = res;
            this.ani1.node.active = false;
        };

        cc.loader.loadRes(dragonAsset, dragonBones.DragonBonesAsset, (err, res) => {
            if (err) cc.error(err);
            self.ani1.dragonAsset = res;
            cc.loader.loadRes(dragonAtlasAsset, dragonBones.DragonBonesAtlasAsset, callFunc.bind(this));
        });
    }

    callFunc1() {
        this.ani1.node.active = false;
    }

    playAni1(){
        cc.log("====== 进入playAni1动画");
        this.ani1.armatureName = "Armature";
        this.ani1.off(dragonBones.EventObject.COMPLETE,this.callFunc1,this);
        this.ani1.on(dragonBones.EventObject.COMPLETE,this.callFunc1,this);
        this.ani1.node.active = true;
        this.ani1.playAnimation("newAnimation",1);
    }

    callFuncHongBao() {
        this.ani1.node.active = false;
    }
    playHongBaoAni(){
        cc.log("====== 进入playHongBaoAni动画");
        this.ani1.node.active = true;
        this.ani1.armatureName = "armatureName";
        this.ani1.off(dragonBones.EventObject.COMPLETE,this.callFuncHongBao,this);
        this.ani1.on(dragonBones.EventObject.COMPLETE,this.callFuncHongBao,this);
        this.ani1.playAnimation("fu",1);
    }

    playAction(callBack){
        // let tweenAction = cc.tween().to(0.3,{scale:0.6,easing:cc.easeElasticIn(3.0)}).to(0.4,{scale:1,easing:cc.easeElasticOut(3.0)});
        this.node.runAction(cc.sequence(
            cc.scaleTo(0.3,0.5).easing(cc.easeBackIn()),
            cc.scaleTo(0.4,1.1).easing(cc.easeBackOut()),
            cc.scaleTo(0.3,0.8).easing(cc.easeBackIn()),
            cc.scaleTo(0.3,1).easing(cc.easeBackOut()),
            cc.callFunc(callBack)
        ).repeatForever())
        // tweenAction.clone(this.node).then(cc.callFunc(() => {
        // })).start();
    }

    initScale(){
        this.node.setScale(1);
        this.icon.node.setScale(1);
    }
}
