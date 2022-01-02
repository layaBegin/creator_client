let TWO_HAND_CARDS_OFFSET = 100;
cc.Class({
    extends: cc.Component,

    properties: {
        cardsWidget: cc.Prefab,
        bg_card: cc.Sprite,

        node_cards: cc.Node
    },

    onLoad() {
        this.isCanOperate = true;
    },

    initWidget: function (cardDataArr) {
        if (!!this.cardsWidgetCtrlArr) {
            for (let i = 0; i < this.cardsWidgetCtrlArr.length; ++i) {
                this.cardsWidgetCtrlArr[i].node.destroy();
            }
        }
        this.cardsWidgetCtrlArr = [];
        this.cardDataArr = cardDataArr || [];
        this.doubleBetArr = [];
        this.operationIndex = -1;
        if (!cardDataArr) return;

        let cardsArrCount = (!!cardDataArr[0] ? 1 : 0) + (!!cardDataArr[1] ? 1 : 0);
        let len_cardDataArr0 = 0;
        let len_cardDataArr1 = 0;
        if (!!cardDataArr[0]) {
            let node = cc.instantiate(this.cardsWidget);
            let ctrl = node.getComponent('BJCardsWidgetCtrl');
            this.cardsWidgetCtrlArr.push(ctrl);
            ctrl.initWidget(cardDataArr[0], false, null, this.node_cards);
            if (cardsArrCount === 2) {
                //node.x = -TWO_HAND_CARDS_OFFSET;
            }
            node.parent = this.node;
            node.setSiblingIndex(2);

            len_cardDataArr0 = cardDataArr[0].length;
        }
        if (!!cardDataArr[1]) {
            let node = cc.instantiate(this.cardsWidget);
            let ctrl = node.getComponent('BJCardsWidgetCtrl');
            this.cardsWidgetCtrlArr.push(ctrl);
            ctrl.initWidget(cardDataArr[1], false, null, this.node_cards);
            if (cardsArrCount === 2) {
                //node.x = TWO_HAND_CARDS_OFFSET;
                node.y += 50;
            }
            node.parent = this.node;
            node.setSiblingIndex(1);

            len_cardDataArr1 = cardDataArr[1].length;
        }

        this.isCanOperate = true;
        if (this.bg_card) {
            this.bg_card.node.active = true;
            let maxlen = len_cardDataArr0 > len_cardDataArr1 ? len_cardDataArr0 : len_cardDataArr1;
            if (maxlen > 2)
                this.bg_card.node.width = 120 + (maxlen - 2) * 32;
        }
    },

    getCardDataArr: function () {
        return this.cardDataArr;
    },

    sendCard: function (cardDataArr, cb, cb_1 = null) {
        this.cardDataArr = cardDataArr;
        let node = cc.instantiate(this.cardsWidget);
        let ctrl = node.getComponent('BJCardsWidgetCtrl');
        this.cardsWidgetCtrlArr.push(ctrl);
        ctrl.initWidget(cardDataArr[0], true, cb, this.node_cards);
        node.parent = this.node;

        this.isCanOperate = false;
        setTimeout(() => {
            if (!cc.isValid(this)) {
                return;
            }
            this.isCanOperate = true;
            if (cb_1) cb_1();
        }, 2600);

        if (this.bg_card) {
            this.bg_card.node.active = true;
            this.bg_card.node.width = 120;
        }
    },

    addCard: function (index, cardDataArr, cb, cb_1 = null) {
        this.cardDataArr = cardDataArr;
        let arr = cardDataArr[index];
        this.cardsWidgetCtrlArr[index].addCard(arr[arr.length - 1], cb);

        this.isCanOperate = false;
        setTimeout(() => {
            if (!cc.isValid(this)) {
                return;
            }
            this.isCanOperate = true;
            if (cb_1) cb_1();
        }, 1600);

        if (this.bg_card) {
            this.bg_card.node.active = true;
            if (arr.length > 2)
                this.bg_card.node.width = 120 + (arr.length - 2) * 32;
        }
    },

    cutCard: function (cardDataArr, cb) {
        this.cardDataArr = cardDataArr;
        let cardNode = this.cardsWidgetCtrlArr[0].popCardNode();

        let node = cc.instantiate(this.cardsWidget);
        let ctrl = node.getComponent('BJCardsWidgetCtrl');
        this.cardsWidgetCtrlArr.push(ctrl);
        ctrl.initWidget();
        node.parent = this.node;
        ctrl.addCardNode(cardNode, cardDataArr[1][0]);

        this.cardsWidgetCtrlArr[0].hidePoints();
        this.cardsWidgetCtrlArr[0].node.runAction(cc.sequence([cc.moveTo(0.3, cc.v2(0, 0)), cc.delayTime(0.2), cc.callFunc(function () {
            this.cardsWidgetCtrlArr[0].addCard(cardDataArr[0][1], cb);
        }.bind(this))]));
        this.cardsWidgetCtrlArr[0].node.setSiblingIndex(2);

        this.cardsWidgetCtrlArr[0].hidePoints();
        this.cardsWidgetCtrlArr[1].adjustCardPos();
        this.cardsWidgetCtrlArr[1].node.runAction(cc.sequence([cc.moveTo(0.3, cc.v2(0, 50)), cc.delayTime(0.2), cc.callFunc(function () {
            this.cardsWidgetCtrlArr[1].addCard(cardDataArr[1][1]);
        }.bind(this))]));
        this.cardsWidgetCtrlArr[1].node.setSiblingIndex(1);
        cardNode.runAction(cc.moveTo(0.3, cc.v2(0, 0)));

        this.isCanOperate = false;
        setTimeout(() => {
            this.isCanOperate = true;
        }, 2000);

        for (let i = 0; i < this.cardsWidgetCtrlArr.length; i++) {
            this.cardsWidgetCtrlArr[i].cutCard();
        }
    },

    doubleBet: function (cardIndex_) {
        if (this.doubleBetArr.indexOf(cardIndex_) > -1)
            return;
        else {
            this.doubleBetArr.push(cardIndex_);
            this.cardsWidgetCtrlArr[cardIndex_].doubleBet();
        }
    },

    stopCard: function (index) {
        // 计算分数
        this.operationIndex = -1;

        this.cardsWidgetCtrlArr[index].stopCard();
    },

    getCurOperationIndex: function () {
        return this.operationIndex;
    },

    showOperation: function (index) {
        this.operationIndex = index;
        this.cardsWidgetCtrlArr[index].showOperation(true);
        let ctrl = this.cardsWidgetCtrlArr[(index + 1) % 2];
        if (!!ctrl) {
            ctrl.showOperation(false);
        }
    },

    showBankerHandCard: function (cardDataArr, cb) {
        this.cardsWidgetCtrlArr[0].showBankerCardArr(cardDataArr, cb);
    }
});
