let gameLogic = require("./BJGameLogic");
let CARD_OFFSET = 63;
let ADD_ONE_CARD_TIME = 1;
let BJAudio = require("./BJAudio");

cc.Class({
    extends: cc.Component,

    properties: {
        pointRootNode: cc.Node,
        pointsLabel: cc.Label,
        showOperationNode: cc.Node,
        sp_double: cc.Sprite,
        cardNode: cc.Node,

        ani_bp: dragonBones.ArmatureDisplay,
        ani_hjk: dragonBones.ArmatureDisplay,
        ani_wxl: dragonBones.ArmatureDisplay,
    },

    onLoad() {
        this.isPlayedAni_bp = false;
        this.isPlayingAni_bp = false;

        this.isHandCardWidgetCtrlCutCard = false; //是否当前HandCardWidgetCtrl分牌了

        this.isPlayAudio_hjk = false;
    },

    initWidget: function (cardArr, isAnim, cb, node_cards_) {
        this.cardArr = [];
        this.cardNodeArr = [];
        this.isDoubleBet = false;
        this.isPlayAni_bp = false;
        if (!cardArr) return;
        if (cardArr.length === 1) {
            cardArr.push(0);
        }

        this.node_cards = node_cards_;

        if (isAnim) {
            let self = this;
            let actions = [];

            function addAction(cardData, cb) {
                actions.push(cc.callFunc(function () {
                    self.addCard(cardData, cb);
                }));
            }
            for (let i = 0; i < cardArr.length; ++i) {
                if (i === cardArr.length - 1) {
                    addAction(cardArr[i], cb);
                } else {
                    addAction(cardArr[i]);
                    actions.push(cc.delayTime(ADD_ONE_CARD_TIME));
                }
            }
            if (actions.length === 1) {
                this.node.runAction(actions[0]);
            } else {
                this.node.runAction(cc.sequence(actions));
            }

        } else {
            for (let i = 0; i < cardArr.length; ++i) {
                let cardUrl = !!cardArr[i] ? Global.CCHelper.getCardUrl(cardArr[i]) : "GameCommon/Cards/cardBack";
                let node = Global.CCHelper.createSpriteNode(cardUrl);
                this.cardNodeArr.push(node);
                this.cardArr.push(cardArr[i]);
                node.x = CARD_OFFSET * (i - (cardArr.length) / 2);
                node.scale = cc.v2(1.29, 1.29);
                node.parent = this.cardNode;
            }

            this.updatePoints();
        }

        this.sp_double.node.active = false;

        this.isHandCardWidgetCtrlCutCard = false;

        this.isPlayAudio_hjk = false;
    },

    addCard: function (cardData, cb) {
        this.adjustCardPos();
        this.cardArr.push(cardData);
        this.scheduleOnce(function () {
            let node = Global.CCHelper.createSpriteNode("GameCommon/Cards/cardBack");
            node.x = CARD_OFFSET * (this.cardNodeArr.length - this.cardNodeArr.length / 2);
            node.scale = cc.v2(1.29, 1.29);
            node.parent = this.cardNode;
            this.cardNodeArr.push(node);
            if (cardData !== 0) {
                this.cardAnimation(node.getComponent(cc.Sprite), cardData, 0, cb, this.node_cards);
            }
        }.bind(this), 0.2);
    },

    doubleBet: function () {
        this.isDoubleBet = true;
    },

    adjustCardPos: function () {
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let x = (CARD_OFFSET) * (i - (this.cardNodeArr.length) / 2);
            this.cardNodeArr[i].runAction(cc.moveTo(0.03, cc.v2(x, 0)));
        }
    },

    stopCard: function () {
        let point = gameLogic.getCardPoint(this.cardArr);
        this.pointsLabel.string = point.toString();
        if (point > 21) {
            this.pointRootNode.getChildByName("red").active = true;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = false;
        } else {
            this.pointRootNode.getChildByName("red").active = false;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = true;
        }
    },

    cutCard: function () {
        this.isHandCardWidgetCtrlCutCard = true;
    },

    popCardNode: function () {
        this.cardArr.pop();
        return this.cardNodeArr.pop();
    },

    addCardNode: function (cardNode, cardData) {
        cardNode.parent = this.cardNode;
        this.cardNodeArr.push(cardNode);
        this.cardArr.push(cardData);
    },

    showOperation: function (isShow) {},

    updatePoints: function () {
        // 更新点数
        this.pointsLabel.node.parent.active = true;
        let points = gameLogic.getShowCardPoint(this.cardArr);
        if (points.length === 1) {
            this.pointsLabel.string = points[0].toString();
        } else {
            this.pointsLabel.string = points[1] + "a" + points[0];
        }

        //正在播放爆牌动画，就先不要隐藏
        if (this.isPlayingAni_bp == false) {
            this.ani_bp.node.active = false;
        }
        this.ani_hjk.node.active = false;
        this.ani_wxl.node.active = false;

        if (points[0] > 21) {
            this.pointRootNode.getChildByName("red").active = true;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = false;

            if (this.isPlayAni_bp == false) {
                this.ani_bp.node.active = true;
                this.ani_bp.playAnimation("newAnimation", 1);
                this.isPlayAni_bp = true;
                BJAudio.playAudio("baozha");
                this.isPlayingAni_bp = true;
                setTimeout(() => {
                    if (!cc.isValid(this)) {
                        return;
                    }
                    this.isPlayingAni_bp = false;
                }, 3000);
            }
        } else if (points[0] === 21) {
            this.pointsLabel.string = points[0].toString();
            this.pointRootNode.getChildByName("red").active = false;
            this.pointRootNode.getChildByName("blue").active = false;
            this.pointRootNode.getChildByName("green").active = true;
        } else if (points[0] > 0 && points[0] < 21) {
            this.pointRootNode.active = true;
            this.pointRootNode.getChildByName("red").active = false;
            this.pointRootNode.getChildByName("blue").active = true;
            this.pointRootNode.getChildByName("green").active = false;
        }

        if (points[0] <= 21 && this.cardArr.length == 5) {
            BJAudio.playAudio("cardTypeAudio/wuxiaolong-0");
            this.ani_wxl.node.active = true;
            this.stopCard();
        }

        //分牌的时候，黑杰克不计算
        if (this.cardArr.length == 2 && points[0] == 21 && this.isHandCardWidgetCtrlCutCard == false) {
            if (this.isPlayAudio_hjk == false) {
                BJAudio.playAudio("cardTypeAudio/heijieke-0");
                this.isPlayAudio_hjk = true;
            }
            this.ani_hjk.node.active = true;
        }
    },

    hidePoints: function () {
        this.pointsLabel.node.parent.active = false;
    },

    cardAnimation: function (cardSprite, cardData, delayTime, cb, node_cards, cardLength = 0) {
        let actions = [];
        let originalPos = {
            x: cardSprite.node.x,
            y: cardSprite.node.y
        };
        let originalScale = {
            x: cardSprite.node.scaleX,
            y: cardSprite.node.scaleY
        };
        actions.push(cc.delayTime(delayTime));
        actions.push(cc.callFunc(function () {
            AudioMgr.playSound('GameCommon/Sound/flipcard');
        }));


        if (node_cards) {
            let pos = this.node_cards.parent.convertToWorldSpaceAR(node_cards.position);
            pos = this.cardNode.convertToNodeSpaceAR(pos);
            cardSprite.node.position = pos;
            actions.push(cc.spawn([cc.moveTo(0.5, originalPos), cc.rotateBy(0.5, 360)]));
        }
        //否则是庄家发牌
        else {
            if (cardLength != 2) {
                cardSprite.node.position = new cc.v2(830, 200);
                actions.push(cc.spawn([cc.moveTo(0.5, originalPos), cc.rotateBy(0.5, 360)]));
            }
        }
        actions.push(cc.moveBy(0.2, 10, originalPos.y));
        actions.push(cc.spawn([cc.scaleTo(0.1, 0.1, originalScale.y), cc.moveBy(0.1, -10, originalPos.y + 10)]));
        actions.push(cc.callFunc(function () {
            let cardUrl = Global.CCHelper.getCardUrl(cardData);
            Global.CCHelper.updateSpriteFrame(cardUrl, cardSprite);
        }));

        actions.push(cc.spawn([cc.scaleTo(0.1, originalScale.x, originalScale.y), cc.moveTo(0.1, originalPos.x, originalPos.y)]));
        let temp = cc.moveTo(0.3, originalPos.x, originalPos.y);
        temp.easing(cc.easeBackOut());
        actions.push(temp);

        actions.push(cc.callFunc(function () {
            this.updatePoints();
            if (this.isDoubleBet) {
                this.sp_double.node.active = true;
                this.sp_double.node.setSiblingIndex(10);
                let cardNodePosition = this.cardNodeArr[this.cardNodeArr.length - 1].position;
                this.sp_double.node.position = new cc.Vec2(cardNodePosition.x + 30, cardNodePosition.y - 45.3);
            }
            Global.Utils.invokeCallback(cb);
        }.bind(this)));

        cardSprite.node.runAction(cc.sequence(actions));
    },

    showBankerCardArr: function (cardDataArr, cb) {
        if (this.cardArr.length === cardDataArr.length && !!this.cardArr[this.cardArr.length - 1]) {
            Global.Utils.invokeCallback(cb);
            return;
        }
        this.cardArr[this.cardArr.length - 1] = cardDataArr[this.cardArr.length - 1];
        this.cardAnimation(this.cardNodeArr[this.cardNodeArr.length - 1].getComponent(cc.Sprite), this.cardArr[this.cardArr.length - 1], 0, function () {
            if (this.cardArr.length === cardDataArr.length) {
                this.stopCard();
                Global.Utils.invokeCallback(cb);
                return;
            }
            let self = this;
            let actions = [];

            function addAction(cardData, cb) {
                actions.push(cc.callFunc(function () {
                    self.addCard(cardData, cb);
                }));
            }
            for (let i = this.cardArr.length; i < cardDataArr.length; ++i) {
                if (i === cardDataArr.length - 1) {
                    addAction(cardDataArr[i], function () {
                        this.stopCard();
                        Global.Utils.invokeCallback(cb);
                    }.bind(this));
                } else {
                    addAction(cardDataArr[i]);
                    actions.push(cc.delayTime(1.6));
                }
            }
            if (actions.length === 1) {
                this.node.runAction(actions[0]);
            } else {
                this.node.runAction(cc.sequence(actions));
            }
        }.bind(this), null, this.cardArr.length);
    }
});