import BaseView from "../BaseClass/BaseView";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;
let Global = (<any>window).Global

@ccclass
export default class SettingDialog extends BaseView {

    @property(cc.Node)
    progressMusic: cc.Node = undefined;

    @property(cc.Slider)
    sliderMusic: cc.Slider = undefined;

    @property(cc.Node)
    progressSound: cc.Node = undefined;

    @property(cc.Slider)
    sliderSound: cc.Slider = undefined;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}


    onLoad() {
        var musicVolume = cc.sys.localStorage.getItem('MusicVolume');
        var soundVolume = cc.sys.localStorage.getItem('SoundVolume');

        this.progressMusic.getComponent(cc.Sprite).fillRange = +musicVolume;
        this.sliderMusic.progress = musicVolume;
        this.progressSound.getComponent(cc.Sprite).fillRange = +soundVolume;
        this.sliderSound.progress = soundVolume;
    }

    onBtnClk(event, param) {
        switch (param) {
            case 'close':
            case 'confirm':
                Global.CCHelper.playPreSound();
                Global.DialogManager.destroyDialog(this);
                break;
            case 'logout':
                Global.CCHelper.playPreSound();
                // Global.NetworkLogic.disconnect(false);
                NetworkMgr.disconnect(false);
                Global.DialogManager.destroyAllDialog();
                cc.director.loadScene("Login");
                cc.sys.localStorage.setItem('isAutoLogin', false);
                break;
            case 'music_slider':
                this.progressMusic.getComponent(cc.Sprite).fillRange = +event.progress;
                AudioMgr.setMusicVolume(this.progressMusic.getComponent(cc.Sprite).fillRange);

                break;
            case 'sound_slider':
                this.progressSound.getComponent(cc.Sprite).fillRange = +event.progress;
                AudioMgr.setSoundVolume(this.progressSound.getComponent(cc.Sprite).fillRange);

                break;
        }
    }
    // update (dt) {}
}
