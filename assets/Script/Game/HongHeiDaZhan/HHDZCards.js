let HHDZProto = require('./API/HHDZGameProto');

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },
        cards: [cc.Sprite],
        cardType: cc.Sprite
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        if (!this.showResult) {
            this.hideCards();
        } else {
            this.showResult = null;
        }
        this.timeout = [];
    },

    onDestroy() {
        if (!!this.showCardTypeTimeout) {
            clearTimeout(this.showCardTypeTimeout);
        }

        for (let i = 0; i < this.timeout.length; i++) {
            clearTimeout(this.timeout[i]);
        }
    },

    hideCards() {
        this.cardType.node.active = false;
        for (let i = 0; i < this.cards.length; i++) {
            Global.CCHelper.updateSpriteFrame('GameCommon/Card/card_back', this.cards[i]);
        }
        this.timeout = [];
        this.showCardTypeTimeout = null;
    },

    showCards(data, type) {

        if (type === HHDZProto.RED) {
            this.cardType.node.setPosition(-139, 0);
        }

        Global.CCHelper.updateSpriteFrame('HongHeiDaZhan/newRes/cardType/labelImg_cardType_' + data.cardType, this.cardType);
        this.showCardTypeTimeout = setTimeout(function () {
            if (!cc.isValid(this)) {
                return;
            }
            this.cardType.node.active = true;

            AudioMgr.playSound("HongHeiDaZhan/Sound/cardType_" + data.cardType);
        }.bind(this), 1500);

        for (let i = 0; i < data.cards.length; i++) {
            this.cardAnimation(this.cards[i].node, data.cards[i] + '', i);
        }
    },

    cardAnimation: function (card, cardData, index) {
        if (!this.timeout) {
            this.timeout = [];
        }
        this.timeout[index] = setTimeout(function () {
            if (!cc.isValid(this)) {
                return;
            }
            AudioMgr.playSound('GameCommon/Sound/flipcard');
            let originalPos = {
                x: card.x,
                y: card.y
            };
            let originalScale = {
                x: card.scaleX,
                y: card.scaleY
            };
            let actions = [];
            actions[actions.length] = cc.moveBy(0.2, 10, originalPos.y);
            actions[actions.length] = cc.spawn([cc.scaleTo(0.1, 0.1, originalScale.y), cc.moveBy(0.1, -10, originalPos.y + 10)]);
            actions[actions.length] = cc.callFunc(function () {
                Global.CCHelper.updateSpriteFrame('GameCommon/Card/' + cardData, card.getComponent(cc.Sprite));
            }.bind(this));
            actions[actions.length] = cc.spawn([cc.scaleTo(0.1, originalScale.x, originalScale.y), cc.moveTo(0.1, originalPos.x, originalPos.y)]);
            actions[actions.length] = cc.moveTo(0.3, originalPos.x, originalPos.y).easing(cc.easeBackOut());
            card.runAction(cc.sequence(actions));
        }.bind(this), index * 500);
    },

    // update (dt) {},

    showCardResult: function (data, type) {
        this.showResult = true;
        for (let i = 0; i < data.cards.length; i++) {
            let cardUrl = 'GameCommon/Card/' + data.cards[i];
            Global.CCHelper.updateSpriteFrame(cardUrl, this.cards[i]);
        }
        if (type === HHDZProto.RED) {
            this.cardType.node.setPosition(-139, 0);
        }
        let cardTypeUrl = 'HongHeiDaZhan/newRes/cardType/labelImg_cardType_' + data.cardType;
        Global.CCHelper.updateSpriteFrame(cardTypeUrl, this.cardType);

        this.cardType.node.active = true;
    }
});
