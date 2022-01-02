var DDZModel = require("./DDZModel");



cc.Class({
    extends: cc.Component,

    properties: {
        rowTitleNode: cc.Node,
        resultInfoItemArr: [cc.Node],
        // lostNode: cc.Node,
        winNode: cc.Node,
        frameBg: cc.Node,

        btnNode: cc.Node,

        rowTitleGold: cc.Label,

        profitPercentageLabel: cc.Label
    },

    onLoad() {
        this.winAni = this.winNode.getComponent(dragonBones.ArmatureDisplay);

        // this.dissMissDragon.addEventListener(dragonBones.EventObject.COMPLETE, callFunc.bind(this));
        // this.winAni.node.parent.active = false;

        let resultData = this.dialogParameters.resultData;
        let baseScore = this.dialogParameters.baseScore;
        let myChairID = this.dialogParameters.myChairID;
        let bankerUserChairID = this.dialogParameters.bankerUserChairID;
        this.buttonEventCallback = this.dialogParameters.buttonEventCallback;
        if (this.dialogParameters.profitPercentage > 0) {
            this.profitPercentageLabel.string = '抽取赢得金币的{0}%作为台费'.format(this.dialogParameters.profitPercentage);
        } else {
            this.profitPercentageLabel.node.active = false;
        }

        let isLand = myChairID === bankerUserChairID;

        for (let i = 0; i < 3; ++i) {
            let node = this.resultInfoItemArr[i];
            let nicknameLabel = node.getChildByName('nickname').getComponent(cc.Label);

            if (myChairID == i) {
                nicknameLabel.string = resultData.nicknameArr[i];
            } else {
                nicknameLabel.string = Global.Player.convertNickname(resultData.nicknameArr[i]);
            }
            // nicknameLabel.string = Global.Utils.cutstr(resultData.nicknameArr[i],5);
            let baseScoreLabel = node.getChildByName('baseScore').getComponent(cc.Label);
            baseScoreLabel.string = baseScore.toString();
            let landScoreLabel = node.getChildByName('landScore').getComponent(cc.Label);
            landScoreLabel.string = resultData.bombTimes.toString();
            let goldLabel = node.getChildByName('gold').getComponent(cc.Label);
            let gold = this.getPercentFinalScore(resultData.scoreChangeArr[i]);
            let goldStr = gold;
            goldLabel.string = (gold >= 0) ? ("+" + goldStr) : (goldStr.toString());

            if (i === myChairID) {
                let color = new cc.Color(255, 180, 0);
                nicknameLabel.node.color = color;
                baseScoreLabel.node.color = color;
                landScoreLabel.node.color = color;
                goldLabel.node.color = color;
            }

            if (i === bankerUserChairID) {
                node.getChildByName('land').active = true;
            }
        }

        this.showAnimation(resultData.isLandWin === isLand);
        //this.showAnimation(true);
    },
    getPercentFinalScore: function (finalScore) {
        let percent = DDZModel.getProfitPercentage();
        if (finalScore > 0)
            finalScore = (finalScore * (1 - percent)).toFixed(2);
        else
            finalScore = finalScore.toFixed(2);
        return finalScore;
    },

    onBtnClick: function (event, parameters) {
        Global.CCHelper.playPreSound();
        // AudioMgr.playCommonSoundClickButton();
        // if(parameters === 'ready'){
        //     Global.DialogManager.destroyDialog(this);
        //     Global.Utils.invokeCallback(this.buttonEventCallback, event, parameters);
        //
        // }else if(parameters === 'exit'){
        //     Global.DialogManager.destroyDialog(this);
        // }
        Global.DialogManager.destroyDialog(this);
        continueBtn.show(DDZModel.gameTypeID);
    },

    showAnimation: function (isWin) {
        {
            if (isWin) {
                this.winAni.playAnimation("shengli", 1);
            } else {
                this.winAni.playAnimation("shibai", 1);
            }
        } {
            this.frameBg.opacity = 0;
            this.frameBg.runAction(cc.sequence([cc.delayTime(0.3), cc.fadeTo(0.3, 100)]));
        } {
            this.rowTitleNode.runAction(cc.sequence([cc.hide(), cc.delayTime(0.4), cc.show()]));
            for (let i = 0; i < 3; ++i) {
                let node = this.resultInfoItemArr[i];
                node.opacity = 0;
                node.runAction(cc.sequence([cc.delayTime(0.7 + i * 0.2), cc.fadeIn(0.2)]));
            }
        }
        /*{
            this.btnNode.scale = 0.1;
            let action1 = cc.scaleTo(0.3, 1);
            action1.easing(cc.easeBackIn());
            this.btnNode.runAction(cc.sequence([cc.delayTime(1.5), action1]));
        }*/
    }
});