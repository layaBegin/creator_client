// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html
let roomProto = require("../../API/RoomProto");
cc.Class({
    extends: cc.Component,

    properties: {
        switchBtn: cc.Sprite,
        panel: cc.Node,
        effectBtn: cc.Sprite,
        musicBtn: cc.Sprite,
        closeBtn: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start: function () {
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

    setGameInfo: function (kindID, profitPercentage) {
        this.kindID = kindID || 0;
        this.profitPercentage = profitPercentage;
    },

    updateEffectBtn: function () {
        this.soundVolume = cc.sys.localStorage.getItem('SoundVolume');
        this.soundVolumeBank = this.soundVolume;
        if (this.soundVolume > 0) {
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/effect_on_btn', this.effectBtn);
        } else {
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/effect_off_btn', this.effectBtn);
            this.soundVolumeBank = 1;
        }
    },

    updateMusicBtn: function () {
        this.musicVolume = cc.sys.localStorage.getItem('MusicVolume');
        this.musicVolumeBank = this.musicVolume;
        if (this.musicVolume > 0) {
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/music_on_btn', this.musicBtn);
        } else {
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/music_off_btn', this.musicBtn);
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
            case "rule":
                Waiting.show();
                Global.CCHelper.playPreSound();
                this.onClickRuleBtn();
                break;
            case "hall":
                Global.CCHelper.playPreSound();
                this.onClickHallBtn();
                break;
            case "close":
                Global.CCHelper.playPreSound();
                this.onClickCloseBtn();
                break;
        }
    },

    onClickSwitchBtn: function () {
        this.isShow = !this.isShow;
        let endPos = null;
        if (this.isShow) {
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/btn_up', this.switchBtn);
            endPos = cc.v2(this.panel.x, 0);
        } else {
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/btn_down', this.switchBtn);
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
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/effect_off_btn', this.effectBtn);
        } else {
            this.soundVolume = this.soundVolumeBank;
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/effect_on_btn', this.effectBtn);
        }
        AudioMgr.setSoundVolume(Number(this.soundVolume));
    },

    onClickMusicBtn: function () {
        if (this.musicVolume > 0) {
            this.musicVolume = 0;
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/music_off_btn', this.musicBtn);
        } else {
            this.musicVolume = this.musicVolumeBank;
            Global.CCHelper.updateSpriteFrame('GameCommon/GameDropDownList/music_on_btn', this.musicBtn);
        }
        AudioMgr.setMusicVolume(Number(this.musicVolume));
    },

    //点击返回大厅按钮
    onClickHallBtn: function () {
        Confirm.show('确认退出游戏?', function () {
            if (Global.Player.getPy('roomID')) {
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Waiting.show();
            } else {
                ViewMgr.goBackHall(this.kindID);
            }
        }.bind(this), function () { });
    },

    //点击规则按钮
    onClickRuleBtn: function () {
        if (!!this.kindID) {
            let gameInfo = {};
            gameInfo.kind = this.kindID;
            gameInfo.profitPercentage = this.profitPercentage;
            ViewMgr.open({
                viewUrl: "GameRule",
                prefabUrl: "GameCommon/GameRule/GameRule"
            }, {
                    key: "init",
                    data: gameInfo
                }, function () {
                    Waiting.hide();
                })
            // Global.UIManager.create("GameCommon/GameRule/GameRuleDialog", gameInfo, function () {
            //     Waiting.hide();
            // });
        } else {
            Confirm.show("没有传入有效游戏类型ID");
        }
    },

    //点击关闭按钮
    onClickCloseBtn: function () {
        this.onClickSwitchBtn();
    }
    // update (dt) {},
});