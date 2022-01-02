cc.Class({
    extends: cc.Component,

    properties: {
        cardSpriteArr: [cc.Sprite],
        cardTypeAni: cc.Node
    },

    onLoad() {
        this.cardPosArr = [];
        for (let i = 0; i < this.cardSpriteArr.length; ++i) {
            this.cardPosArr[i] = this.cardSpriteArr[i].node.position;
        }
    },

    sendCard(index, isTween) {
        this.resetWidget();

        this.node.active = true;
        this.cardTypeAni.parent.active = false;
        for (let i = 0; i < this.cardSpriteArr.length; ++i) {
            this.cardSpriteArr[i].node.active = true;
        }
        if (!!isTween) {
            let startWorldPos = this.node.parent.parent.convertToWorldSpaceAR(cc.v2(0, 0));
            for (let i = 0; i < this.cardSpriteArr.length; ++i) {
                let node = this.cardSpriteArr[i].node;
                node.position = this.node.convertToNodeSpaceAR(startWorldPos);
                let moveAction = cc.moveTo(0.35, this.cardPosArr[i]);
                //moveAction.easing(cc.easeBackOut());
                node.runAction(cc.sequence([cc.delayTime(0.03 * i + index * 0.2 + 0.5), moveAction]));
            }
        }
    },

    showCard(cardDataArr, cardType, index) {
        this.resetWidget();

        let self = this;

        function startAction(cardData, sprite, pos, cardType) {
            self.node.active = true;
            sprite.node.active = true;
            sprite.node.runAction(cc.sequence([cc.delayTime(0.7 * index + 1), cc.moveTo(0.3, cc.v2(0, 0)), cc.callFunc(
                function () {
                    let cardUrl = Global.CCHelper.getCardUrl(cardData);
                    Global.CCHelper.updateSpriteFrame(cardUrl, sprite);
                }.bind(self)
            ), cc.delayTime(0.05), cc.moveTo(0.3, pos), cc.callFunc(function () {
                if (cardType !== null) {
                    // 牌类型
                    // Global.CCHelper.updateSpriteFrame("BaiRenNiuNiu/win_" + cardType, self.cardTypeSprite, function () {
                    //     self.cardTypeSprite.node.parent.active = true;
                    //     AudioMgr.playSound("BaiRenNiuNiu/sound/N" + cardType + "_1");
                    // }.bind(self));
                    this.cardTypeAni.parent.active = true;
                    let name = this.getTypeAnimationName(cardType);
                    this.cardTypeAni.active = true
                    this.cardTypeAni.getComponent(dragonBones.ArmatureDisplay).playAnimation(name, 1)
                    AudioMgr.playSound("BaiRenNiuNiu/sound/N" + cardType + "_1");
                }
            }.bind(self))]));
        }

        for (let i = 0; i < this.cardSpriteArr.length; ++i) {
            startAction(cardDataArr[i], this.cardSpriteArr[i], this.cardPosArr[i], (i === 0) ? cardType : null);
        }
    },

    resetWidget() {
        for (let i = 0; i < this.cardSpriteArr.length; ++i) {
            this.cardSpriteArr[i].node.active = false;
            Global.CCHelper.updateSpriteFrame("GameCommon/Cards/cardBack", this.cardSpriteArr[i]);

            this.cardSpriteArr[i].node.stopAllActions();
            this.cardSpriteArr[i].node.position = this.cardPosArr[i];
        }

        this.cardTypeAni.parent.active = false;

        this.node.active = false;
    },

    /*
     * 获取类型名
     */
    getTypeAnimationName(cardType) {
        if (cardType === 12) {
            return 'br_wuhuaniu'
        } else if (cardType === 13) {
            return 'br_zhadanniu';
        } else if (cardType === 14) {
            return 'br_wuxiaoniu';
        } else if (cardType === 11) {
            return 'br_sihuaniu';
        } else {
            if (cardType == 10) {
                return 'niuniu';
            } else if (cardType == 0) {
                return 'wuniu';
            } else {
                return 'niu' + cardType;
            }

        }
    },
});