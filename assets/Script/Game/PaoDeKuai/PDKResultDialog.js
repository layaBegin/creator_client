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

        let resultData = this.dialogParameters.resultData;
        let baseScore = this.dialogParameters.baseScore;
        let myChairID = this.dialogParameters.myChairID;
        this.gameTypeID = this.dialogParameters.gameTypeID;
        let guanchairArr = resultData.guanchairArr;
        this.buttonEventCallback = this.dialogParameters.buttonEventCallback;
        if (this.dialogParameters.profitPercentage > 0) {
            this.profitPercentageLabel.string = '抽取赢得金币的{0}%作为台费'.format(this.dialogParameters.profitPercentage);
        } else {
            this.profitPercentageLabel.node.active = false;
        }

        // if (resultData.winChairID === myChairID) {
        //     this.lostNode.active = false;
        //     this.winNode.active = true;
        // } else {
        //     this.lostNode.active = true;
        //     this.winNode.active = false;
        // }

        for (let i = 0; i < 3; ++i) {
            let node = this.resultInfoItemArr[i];
            let nicknameLabel = node.getChildByName('nickname').getComponent(cc.Label);

            if (myChairID == i) {
                nicknameLabel.string = resultData.nicknameArr[i];
            } else {
                nicknameLabel.string = Global.Player.convertNickname(resultData.nicknameArr[i]);
            }

            let baseScoreLabel = node.getChildByName('baseScore').getComponent(cc.Label);
            baseScoreLabel.string = baseScore.toString();

            let goldLabel = node.getChildByName('gold').getComponent(cc.Label);
            let gold = resultData.scoreChangeArr[i];
            let goldStr = Global.Utils.formatNumberToString(gold, 2);
            goldLabel.string = (gold >= 0) ? ("+" + goldStr) : (goldStr.toString());

            let bombGoldLabel = node.getChildByName('bombGold').getComponent(cc.Label);
            let bombGold = resultData.bombScoreChangeArr[i];
            let bombGoldStr = Global.Utils.formatNumberToString(bombGold, 2);
            bombGoldLabel.string = (bombGold > 0) ? ("+" + bombGoldStr) : (bombGoldStr.toString());

            let cardCountLabel = node.getChildByName('cardCount').getComponent(cc.Label);
            let cardCount = resultData.allCardArr[i].length;
            cardCountLabel.string = cardCount.toString();

            let quanguan = node.getChildByName('quanguan');
            quanguan.active = false;

            if (!!guanchairArr) {
                let len = guanchairArr.length;
                for (let t = 0; t < len; ++t) {
                    if (guanchairArr[t] == i) {
                        quanguan.active = true;
                    }
                }
            }

            if (i === myChairID) {
                let color = new cc.Color(255, 204, 18, 255);
                nicknameLabel.node.color = color;
                baseScoreLabel.node.color = color;
                goldLabel.node.color = color;
                bombGoldLabel.node.color = color;
                cardCountLabel.node.color = color;
            }
        }

        this.showAnimation(resultData.winChairID === myChairID);
        //this.showAnimation(true);
    },

    onBtnClick: function (event, parameters) {
        AudioMgr.playCommonSoundClickButton();
        // if (parameters === 'ready') {
        //     Global.DialogManager.destroyDialog(this, true);
        //     Global.Utils.invokeCallback(this.buttonEventCallback, event, parameters);
        // } else if (parameters === 'exit') {
        //     //Global.DialogManager.destroyDialog(this);
        //     Global.Utils.invokeCallback(this.buttonEventCallback, event, parameters);
        // }
        if (parameters === 'sure') {
            Global.CCHelper.playPreSound();
            Global.DialogManager.destroyDialog(this, true);
            continueBtn.show(this.gameTypeID);
        }
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