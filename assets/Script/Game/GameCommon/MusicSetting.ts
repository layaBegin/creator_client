

import BaseView from "../../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MusicSetting extends BaseView {
    @property(cc.Slider)
    bgSlider: cc.Slider = undefined;
    @property(cc.Slider)
    effectSlider: cc.Slider = undefined
    @property(cc.Sprite)
    bgSprite: cc.Sprite = undefined
    @property(cc.Sprite)
    effectSprite: cc.Sprite = undefined;

    onLoad() {

        this.bgSlider.progress = parseFloat(cc.sys.localStorage.getItem('MusicVolume'));
        this.bgSprite.fillRange = this.bgSlider.progress;

        this.effectSlider.progress = parseFloat(cc.sys.localStorage.getItem('SoundVolume'));
        this.effectSprite.fillRange = this.effectSlider.progress;

    }
    onButtonClick(event: cc.Event, param: string) {
        if (param === "close") {
            this.close(false);
        }
    }

    sliderCallBack(slider: cc.Slider, customEventData: string) {
        if (customEventData === 'bgMusic') {
            this.bgSprite.fillRange = this.bgSlider.progress;
            // cc.sys.localStorage.setItem('MusicVolume',this.bgSlider.progress);
            AudioMgr.setMusicVolume(Number(this.bgSlider.progress));

        }
        else if (customEventData === "effectMusic") {
            this.effectSprite.fillRange = this.effectSlider.progress;
            AudioMgr.setSoundVolume(Number(this.effectSlider.progress));
            // cc.sys.localStorage.setItem('SoundVolume',this.effectSlider.progress);
        }
    }


}
