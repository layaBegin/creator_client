let CHIP_NUMBER = require('./BJProto').chipAmount;
cc.Class({
    extends: cc.Component,

    properties: {
        selectChipButtonArr: [cc.Button]
    },

    onLoad() {
    },

    onBtnClick(event, param) {
        //AudioMgr.playCommonSoundClickButton();
        Global.CCHelper.playPreSound();
        if (param === 'bet') {
            this.callback('bet', this.betCount);
        } else if (param === 'cleanBet') {
            this.callback('clean');
            this.betCount = 0;

            this.updateChipButtonState(this.goldCount - this.betCount);
        } else {
            if (this.chipNumberArr.hasOwnProperty(param)) {
                if (!!this.maxBetLimit) {
                    if (this.maxBetLimit < this.betCount + this.chipNumberArr[param]) {
                        Tip.makeText("下注不能超过限红:" + this.maxBetLimit);
                        return;
                    }
                }
                this.betCount += this.chipNumberArr[param];
                this.callback('add', this.chipNumberArr[param]);
                this.updateChipButtonState(this.goldCount - this.betCount);
            }
        }
    },

    initWidget: function () {
        this.chipNumberArr = CHIP_NUMBER;
        for (let i = 0; i < this.selectChipButtonArr.length; ++i) {
            this.selectChipButtonArr[i].enabled = false;
            this.selectChipButtonArr[i].node.opacity = 150;

            // let sprite = this.selectChipButtonArr[i].node.getComponent(cc.Sprite);
            // Global.CCHelper.updateSpriteFrame("GameCommon/Jetton/jetton" + this.chipNumberArr[i], sprite);
        }

        this.selectedChipArr = [];
        for (let i = 0; i < this.chipNumberArr.length; ++i) {
            let node = Global.CCHelper.createSpriteNode("GameCommon/Jetton/jetton" + this.chipNumberArr[i]);
            node.active = false;
            node.parent = this.selectChipButtonArr[i].node;
            this.selectedChipArr.push(node);
        }
    },

    startBet: function (goldCount, callback) {
        this.callback = callback;
        this.node.active = true;
        this.chipNumberArr = CHIP_NUMBER;

        this.curSelectedChipIndex = 0;
        this.goldCount = goldCount;
        this.betCount = 0;

        this.updateChipButtonState(goldCount);
    },

    stopBet: function () {
        this.node.active = false;
        this.callback = function () { };  // 清空回调
        this.goldCount = 0;
        this.betCount = 0;
    },

    getMinBetCount: function () {
        return this.chipNumberArr[0];
    },

    getCurBetCount() {
        return this.betCount;
    },

    // 更新下注按钮状态
    updateChipButtonState(goldCount) {
        for (let i = 0; i < this.selectChipButtonArr.length; ++i) {
            let chipButton = this.selectChipButtonArr[i];
            if (goldCount < this.chipNumberArr[i]) {
                chipButton.enabled = false;
                chipButton.node.opacity = 150;
            }
            else {
                chipButton.enabled = true;
                chipButton.node.opacity = 255;
            }
            // let enable = (this.chipNumberArr[i] < goldCount);
            // chipButton.enabled = enable;
            // chipButton.node.opacity = enable ? 255 : 150;
        }
    },

    setMaxBetScore(maxBetLimit) {
        this.maxBetLimit = maxBetLimit;
        cc.log("设置最大下注值:" + maxBetLimit);
    }
});
