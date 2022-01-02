var proto = require('./GameProtoZJH');
var ZJHAudio = require('./ZJHAudio');

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...

        //加注数值显示
        stakeLevelLabel: {
            type: [cc.Label],
            default: []
        },

        //4个加注按钮
        addStakeBtn: {
            type: [cc.Button],
            default: []
        }
    },

    onBtnClk: function (event, param) {
        // if (this.currentStakeLevel < parseInt(param[param.length - 1])) {
        //     if (parseInt(param[param.length - 1]) === 4) {
        //         // ZJHAudio.jiaZhuMax();
        //         ZJHAudio.jiaZhu();
        //     } else {
        //         ZJHAudio.jiaZhu();
        //     }
        // } else {
        //     ZJHAudio.genZhu();
        // }

        switch (param) {
            case 'stakeLevel1':
                Global.Utils.invokeCallback(this.stakeCallback, 1);
                break;
            case 'stakeLevel2':
                Global.Utils.invokeCallback(this.stakeCallback, 2);
                break;
            case 'stakeLevel3':
                Global.Utils.invokeCallback(this.stakeCallback, 3);
                break;
            case 'stakeLevel4':
                Global.Utils.invokeCallback(this.stakeCallback, 4);
                break;
        }
    },
    getStakeImg: function (stakeLevel) {
        return 'Common/Jetton/JettonIcon/jettonIcon' + "_" + (16 - stakeLevel);
    },
    startSelectStake: function (currentStakeLevel, currentMultiple, cb, isMyChairLookedCardStatus,userGoldNum) {
        this.currentStakeLevel = currentStakeLevel;
        let self = this;
        for (let i = 0; i < this.stakeLevelLabel.length; i++) {
            Global.CCHelper.updateSpriteFrame(this.getStakeImg(i + 1), this.addStakeBtn[i].getComponent(cc.Sprite));
            let stakeNum = proto.STAKE_LEVEL[i + 1] * currentMultiple;
            if (isMyChairLookedCardStatus == 1)
                stakeNum = stakeNum * 2;
            let fontPath = "Common/Jetton/JettonFnt/jettonFnt" + "_" + (16 - (i + 1));
            AssetMgr.loadResSync(fontPath, cc.Font, function (err, font) {
                if (!err) {
                    if (!cc.isValid(self)) {
                        return;
                    }
                    self.stakeLevelLabel[i].font = font;
                    self.stakeLevelLabel[i].string = stakeNum;
                }
            });
            if (i < currentStakeLevel - 1) {
                this.addStakeBtn[i].interactable = false;
            }

            if (proto.STAKE_LEVEL[i + 1] * currentMultiple >= userGoldNum) {
                this.addStakeBtn[i].interactable = false;
            }
        }
        this.stakeCallback = cb;
    },

    // use this for initialization
    onLoad: function () {

    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});