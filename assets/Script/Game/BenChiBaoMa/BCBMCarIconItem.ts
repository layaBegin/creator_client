const {ccclass, property} = cc._decorator;

@ccclass
export default class BCBMCarIconItem extends cc.Component {

    @property(cc.Sprite)
    bg:cc.Sprite = null;
    @property(cc.Sprite)
    sp_carIcon:cc.Sprite = null;
    @property(cc.Sprite)
    sp_bright:cc.Sprite  = null;
    @property(cc.Node)
    longLight:cc.Node  = null;

    isAlwaysBright:boolean = false;
    logoType : number = undefined;//车标类型

    onLoad () {
        //通过名字来获取车标类型
        this.logoType = parseInt(this.sp_carIcon.node.name);
    }

    brightIconLight(delayTime:number = 0,fadeOutTime:number = 0.5) {
        delayTime = delayTime || 0;
        fadeOutTime = fadeOutTime || 0.5;
        this.sp_bright.node.stopAllActions();
        this.sp_bright.node.opacity = 255;
        this.sp_bright.node.active = true;
        if (!this.isAlwaysBright) {
            this.sp_bright.node.runAction(cc.sequence(cc.delayTime(delayTime), cc.fadeOut(fadeOutTime)));
        }
        this.node.stopAllActions();
        this.node.setScale(1.05);
        this.node.runAction(cc.scaleTo(0.2, 1));
    }
    //打开 长条 背景灯
    turnOnBackGroundLight () {
        this.longLight.stopAllActions();
        this.longLight.opacity= 255;
        this.longLight.active = true;
        // this.longLight.runAction(cc.sequence(cc.delayTime(delayTime), cc.fadeOut(fadeOutTime)));
    }
    playLongLightAction(delayTime:number = 0,fadeOutTime:number = 0.5){
        this.longLight.stopAllActions();
        this.longLight.opacity= 255;
        this.longLight.active = true;
        this.longLight.runAction(cc.sequence(cc.delayTime(delayTime), cc.fadeOut(fadeOutTime)));
    }
    //关闭 长条 背景灯
    turnOffBackGroundLight (delayTime:number = 0,fadeOutTime:number = 0.5) {
        this.longLight.stopAllActions();
        // this.longLight.opacity= 255;
        this.longLight.active = false;
        // this.longLight.runAction(cc.sequence(cc.delayTime(delayTime), cc.fadeOut(fadeOutTime)));
    }

    setInfo(){

    }

    // update (dt) {}

    reset(){
        this.sp_bright.node.active = false;
    }
    //车标灯 关闭
    turnOff(){
        this.sp_bright.node.stopAllActions();
        this.sp_bright.node.opacity = 255;
        this.sp_bright.node.active = false;
        this.isAlwaysBright = false;
    }

    //常亮
    alwaysLight() {
        // this.isAlways = true;
        this.sp_bright.node.stopAllActions();
        this.sp_bright.node.opacity = 255;
        this.sp_bright.node.active = true;
    }
    //车标 闪烁
    blink() {
        var blink = cc.blink(1, 1).repeatForever();
        // this.sp_bright.node.stopAllActions();
        // this.sp_bright.node.opacity = 255;
        this.sp_bright.node.active = true;
        this.sp_bright.node.runAction(blink);
    }
    //播放摇中光效
    playWinEffect(callback) {
        // var winEffect = new ccs.Armature("zhongjiangguangxiao_chehang").show();
        // winEffect.getAnimation().play("Animation1");
        // winEffect.to(this).pp().qscale(0.96);
        // winEffect.getAnimation().setMovementEventCallFunc(function () {
        //     winEffect.removeFromParent();
        //     callback && callback();
        // });
    }

    hideLongLight(){
        this.longLight.active = false;
    }
    showLongLight(){
        this.longLight.active = true;
    }
}
