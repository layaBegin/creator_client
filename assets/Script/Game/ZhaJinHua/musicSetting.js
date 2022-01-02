
cc.Class({
    extends: cc.Component,

    properties: {
        switchBtn: cc.Sprite,
        panel: cc.Node,
        effectBtn: cc.Sprite,
        musicBtn: cc.Sprite,
        closeBtn:cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.soundVolumeBank = 0;
        this.musicVolumeBank = 0;
        this.soundVolume = 0;
        this.musicVolume = 0;
        this.updateEffectBtn();
        this.updateMusicBtn();

        this.isShow = false;
        this.showY = 0;

        this.moveTime = 0.1;
        this.closeBtn.active = false;
    },

    updateEffectBtn: function () {
        this.soundVolume = cc.sys.localStorage.getItem('SoundVolume');
        this.soundVolumeBank = this.soundVolume;
        if (this.soundVolume > 0) {
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/effect_on_btn', this.effectBtn);
        } else {
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/effect_off_btn', this.effectBtn);
            this.soundVolumeBank = 1;
        }
    },

    updateMusicBtn: function () {
        this.musicVolume = cc.sys.localStorage.getItem('MusicVolume');
        this.musicVolumeBank = this.musicVolume;
        if (this.musicVolume > 0) {
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/music_on_btn', this.musicBtn);
        } else {
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/music_off_btn', this.musicBtn);
            this.musicVolumeBank = 1;
        }
    },

    onClickBtn: function (event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case "switch":
                Global.CCHelper.playPreSound();
                this.onClickSwitchBtn();
                break;
            case "effect":
                Global.CCHelper.playPreSound();
                this.onClickEffectBtn();
                break;
            case "music":
                Global.CCHelper.playPreSound();
                this.onClickMusicBtn();
                break;
            case "close":
                Global.CCHelper.playPreSound();
                this.onClickSwitchBtn();
                break;


        }
    },

    onClickSwitchBtn: function () {
         this.isShow = !this.isShow;
        let endPos = 0;
        if (this.isShow) {
            endPos = cc.v2(this.panel.x, 0);
        } else {
            endPos = cc.v2(this.panel.x, 310);
        }

        let moveDownAction = cc.moveTo(this.moveTime, endPos);
        if (this.isShow) {
            this.panel.runAction(cc.sequence(moveDownAction, cc.callFunc(this.showCloseBtn.bind(this))));
        } else {
            this.panel.runAction(cc.sequence(moveDownAction, cc.callFunc(this.hideCloseBtn.bind(this))));
        }

    },

    showCloseBtn: function () {
        this.closeBtn.active = true;
    },

    hideCloseBtn: function () {
        this.closeBtn.active = false;
    },

    onClickEffectBtn: function () {
        if (this.soundVolume > 0) {
            this.soundVolume = 0;
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/effect_off_btn', this.effectBtn);
        } else {
            this.soundVolume = this.soundVolumeBank;
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/effect_on_btn', this.effectBtn);
        }
        AudioMgr.setSoundVolume(Number(this.soundVolume));
    },

    onClickMusicBtn: function () {
        if (this.musicVolume > 0) {
            this.musicVolume = 0;
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/music_off_btn', this.musicBtn);
        } else {
            this.musicVolume = this.musicVolumeBank;
            Global.CCHelper.updateSpriteFrame('Game/ZhaJinHua/NewImg/music_on_btn', this.musicBtn);
        }
        AudioMgr.setMusicVolume(Number(this.musicVolume));
    },
});