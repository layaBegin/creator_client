let gameLogic = require('./PDKGameLogic');
let gameProto = require('./PDKProto');
let analyseOutCard = require('./PDKAnalyseOutCard');

cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
    },

    initWidget: function () {
        this.cardNodeArr = [];
        this.selectedCardArr = [];
        this.searchOutCardResultArr = [];
        this.ignoreCardValueArr = [];
    },

    resetWidget: function () {
        this.node.removeAllChildren();
        this.removeTouchCardEvent();
        this.cardNodeArr = [];
        this.selectedCardArr = [];
    },

    onSendCard: function (cardDataArr, isTween, cb) {
        for (let i = 0; i < cardDataArr.length; ++i) {
            this.addCardNode(cardDataArr[i], i, isTween, function (index) {
                Global.Utils.invokeCallback(cb, index);
            }.bind(this));
        }
    },

    startGame: function () {
        this.addTouchCardEvent();
    },

    setHostingState: function (isHosting) {
        this.isHosting = isHosting;
        this.resetCardPos();
    },

    addCardNode: function (cardData, i, isTween, finishedAllCB) {
        let node = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Card/' + cardData);
        node.cardData = cardData;
        node.cardUp = false;
        node.zIndex = i + 1;
        this.cardNodeArr.push(node);
        if (isTween) {
            this.scheduleOnce(function () {
                /**
                 * 当发牌阶段App切换到后台等让定时器暂停后
                 * 服务端自动出牌 将当前牌(node)打出(被销毁) 此处将有逻辑问题,以及回调到外部代码也有逻辑问题
                 * 解决方案是切后台立即断网自动重连
                 */
                if (cc.isValid(node)) {
                    node.parent = this.node;
                }
                else {
                    console.error("一张牌已经打出::" + cardData);
                }
                Global.Utils.invokeCallback(finishedAllCB, i + 1);
            }.bind(this), (i + 1) * 0.1);
        } else {
            node.parent = this.node;
            Global.Utils.invokeCallback(finishedAllCB, i + 1);
        }
    },

    addTouchCardEvent: function () {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchCardStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchCardEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCardEnd, this);
    },

    removeTouchCardEvent: function () {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchCardStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchCardEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCardEnd, this);
    },

    onTouchCard: function (node) {
        if (!node) return;
        node.cardUp = !node.cardUp;
        node.y = !node.cardUp ? 0 : 30;
        if (node.cardUp) {
            this.selectedCardArr.push(node.cardData);
        } else {
            let index = this.selectedCardArr.indexOf(node.cardData);
            if (index >= 0) {
                this.selectedCardArr.splice(index, 1);
            }
        }
    },

    onTouchCardStart: function (event) {
        if (this.isHosting == true) {
            return;
        }
        let touchStartPos = this.node.convertToNodeSpaceAR(event.getLocation());
        // let touchStartPos = this.node.convertTouchToNodeSpaceAR(event.touch);
        this.touchStartCardIndex = this.getTouchPosIndex(touchStartPos);
    },

    onTouchMove: function (event) {
        if (this.isHosting == true) {
            return;
        }
        let curPos = this.node.convertToNodeSpaceAR(event.getLocation());
        // let curPos = this.node.convertTouchToNodeSpaceAR(event.touch);
        let index = this.getTouchPosIndex(curPos);
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let node = this.cardNodeArr[i];
            node.color = ((i >= this.touchStartCardIndex && i <= index) || (i >= index && i <= this.touchStartCardIndex)) ? cc.Color.GRAY : cc.Color.WHITE;
        }
    },

    onTouchCardEnd: function (event) {
        if (this.isHosting == true) {
            return;
        }
        let curPos = this.node.convertToNodeSpaceAR(event.getLocation());
        // let curPos = this.node.convertTouchToNodeSpaceAR(event.touch);
        let index = this.getTouchPosIndex(curPos);
        let count = 0;
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let node = this.cardNodeArr[i];
            node.color = cc.Color.WHITE;
            if ((i >= this.touchStartCardIndex && i <= index) || (i >= index && i <= this.touchStartCardIndex)) {
                this.onTouchCard(node);
                count++;
            }
        }
        AudioMgr.playSound("Game/PaoDeKuai/Sound/sound_select_card");

        if (this.selectedCardArr.length <= 4 || count <= 4) return;
        if (gameLogic.getCardType(this.selectedCardArr) !== gameProto.cardType.ERROR) return;

        // 自动筛选
        let cardTypeResultArr = [];
        analyseOutCard.analyseOutCardTypeActive(this.selectedCardArr, cardTypeResultArr);
        if (cardTypeResultArr[gameProto.cardType.SINGLE_LINE].cardTypeCount > 0) {
            let cardTypeResult = cardTypeResultArr[gameProto.cardType.SINGLE_LINE];
            let maxCardCountIndex = 0;
            for (let i = 1; i < cardTypeResult.cardTypeCount; ++i) {
                if (cardTypeResult.eachHandCardCount[i] > cardTypeResult.eachHandCardCount[maxCardCountIndex]) {
                    maxCardCountIndex = i;
                }
            }
            let cardDataArr = cardTypeResult.cardDataArr[maxCardCountIndex];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[gameProto.cardType.DOUBLE_LINE].cardTypeCount > 0) {
            let cardTypeResult = cardTypeResultArr[gameProto.cardType.DOUBLE_LINE];
            let maxCardCountIndex = 0;
            for (let i = 1; i < cardTypeResult.cardTypeCount; ++i) {
                if (cardTypeResult.eachHandCardCount[i] > cardTypeResult.eachHandCardCount[maxCardCountIndex]) {
                    maxCardCountIndex = i;
                }
            }
            let cardDataArr = cardTypeResult.cardDataArr[maxCardCountIndex];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO].cardTypeCount > 0) {
            let cardTypeResult = cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_TWO];
            let maxCardCountIndex = 0;
            for (let i = 1; i < cardTypeResult.cardTypeCount; ++i) {
                if (cardTypeResult.eachHandCardCount[i] > cardTypeResult.eachHandCardCount[maxCardCountIndex]) {
                    maxCardCountIndex = i;
                }
            }
            let cardDataArr = cardTypeResult.cardDataArr[maxCardCountIndex];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE].cardTypeCount > 0) {
            let cardTypeResult = cardTypeResultArr[gameProto.cardType.THREE_LINE_TAKE_ONE];
            let maxCardCountIndex = 0;
            for (let i = 1; i < cardTypeResult.cardTypeCount; ++i) {
                if (cardTypeResult.eachHandCardCount[i] > cardTypeResult.eachHandCardCount[maxCardCountIndex]) {
                    maxCardCountIndex = i;
                }
            }
            let cardDataArr = cardTypeResult.cardDataArr[maxCardCountIndex];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        } else if (cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardTypeCount > 0) {
            let cardDataArr = cardTypeResultArr[gameProto.cardType.BOMB_CARD].cardDataArr[0];
            let selectedCardArr = this.selectedCardArr.slice();
            gameLogic.removeCard(cardDataArr, selectedCardArr);
            this.setSelectedCard(selectedCardArr);
        }
    },

    getTouchPosIndex: function (pos) {
        if (!pos) {
            return;
        }
        let lastNode = this.cardNodeArr[this.cardNodeArr.length - 1];
        if (pos.x >= lastNode.x - lastNode.width / 2) {
            return this.cardNodeArr.length - 1;
        } else {
            let len = lastNode.x - lastNode.width / 2 - pos.x;
            let offset = lastNode.width - 105;
            let index = this.cardNodeArr.length - Math.floor(len / offset) - 2;
            if (index < 0) index = 0;
            return index;
        }
    },

    getSelectedCard: function () {
        return this.selectedCardArr;
    },

    getAllCard: function () {
        let cardDataArr = [];
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            cardDataArr.push(this.cardNodeArr[i].cardData);
        }
        return cardDataArr;
    },

    setSelectedCard: function (cardDataArr) {
        for (let i = 0; i < cardDataArr.length; ++i) {
            let cardData = cardDataArr[i];
            for (let j = 0; j < this.cardNodeArr.length; ++j) {
                if (this.cardNodeArr[j].cardData === cardData) {
                    this.onTouchCard(this.cardNodeArr[j]);
                    break;
                }
            }
        }
    },

    resetCardPos: function () {
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let node = this.cardNodeArr[i];
            if (node.cardUp) {
                node.cardUp = false;
                node.y = 0;
            }
        }
        this.selectedCardArr = [];
    },

    addCard: function (cardDataArr, cb) {
        function nodeMove(node) {
            node.runAction(cc.sequence([cc.delayTime(1), cc.callFunc(function () {
                node.cardUp = false;
                node.y = 0;
                Global.Utils.invokeCallback(cb);
            })]));
        }
        for (let i = 0; i < cardDataArr.length; ++i) {
            let cardData = cardDataArr[i];
            let node = Global.CCHelper.createSpriteNode('Game/PaoDeKuai/Card/' + cardData);
            node.cardData = cardData;
            node.cardUp = true;
            node.y = 30;
            node.parent = this.node;
            let cardValue = gameLogic.getCardLogicValue(cardData);
            for (let j = 0; j < this.cardNodeArr.length; ++j) {
                let tempCardData = this.cardNodeArr[j].cardData;
                let tempCardValue = gameLogic.getCardLogicValue(tempCardData);
                if (tempCardValue < cardValue || (tempCardValue === cardValue && tempCardData < cardData)) {
                    this.cardNodeArr.splice(j, 0, node);
                    break;
                }
                if (j === this.cardNodeArr.length - 1) {
                    this.cardNodeArr.push(node);
                    break;
                }
            }
            nodeMove(node, (i === (cardDataArr.length - 1)) ? cb : null);
        }
        // 重新设置数序
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            this.cardNodeArr[i].zIndex = i + 1;
        }
    },

    removeCard: function (cardDataArr) {
        this.selectedCardArr = [];
        for (let i = 0; i < cardDataArr.length; ++i) {
            let cardData = cardDataArr[i];
            for (let j = 0; j < this.cardNodeArr.length; ++j) {
                if (this.cardNodeArr[j].cardData === cardData) {
                    this.cardNodeArr[j].destroy();
                    this.cardNodeArr.splice(j, 1);
                    break;
                }
            }
        }
    },

    searchOutCard: function (turnCardDataArr) {
        let handCardDataArr = [];
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            handCardDataArr.push(this.cardNodeArr[i].cardData);
        }

        if (this.searchOutCardResultArr.length > 0) {
            // 移除牌
            let lastSearchOutCardResult = this.searchOutCardResultArr[this.searchOutCardResultArr.length - 1];
            let cardType = gameLogic.getCardType(lastSearchOutCardResult);
            if (cardType === gameProto.cardType.THREE_LINE || cardType === gameProto.cardType.THREE_LINE_TAKE_ONE || cardType === gameProto.cardType.THREE_LINE_TAKE_TWO) {
                let analyseResult = gameLogic.analyseCardDataArr(lastSearchOutCardResult);
                let firstCardValue = gameLogic.getCardLogicValue(analyseResult.threeCardData[analyseResult.threeCardData.length - 1]);
                this.ignoreCardValueArr.push(firstCardValue);
            } else {
                let firstCardValue = gameLogic.getCardLogicValue(lastSearchOutCardResult[lastSearchOutCardResult.length - 1]);
                this.ignoreCardValueArr.push(firstCardValue);
            }
            cc.log("忽略牌型:" + this.ignoreCardValueArr);
            gameLogic.removeCardByValue(this.ignoreCardValueArr, handCardDataArr);
        }

        cc.log("传入手牌:" + this.showCardInfo(handCardDataArr));
        cc.log("对比牌型:" + this.showCardInfo(turnCardDataArr));
        let resultCardArr = gameLogic.searchOutCard(handCardDataArr, turnCardDataArr);
        cc.log("返回提示牌型:" + this.showCardInfo(resultCardArr));
        if (resultCardArr.length === 0) {
            if (this.searchOutCardResultArr.length === 0) return false;
            else {
                resultCardArr = this.searchOutCardResultArr[0];
                this.searchOutCardResultArr = [];
                this.ignoreCardValueArr = [];
            }
        }

        this.resetCardPos();

        this.setSelectedCard(resultCardArr);

        this.searchOutCardResultArr.push(resultCardArr);
        cc.log("保留牌型:" + this.searchOutCardResultArr);
        return true;
    },

    showCardInfo(cardArr) {
        let cardStr = "";
        let len = cardArr.length;
        for (let i = 0; i < len; ++i) {
            let cardItemStr = "";
            let cardData = cardArr[i];
            let value = cardData % 16;
            let color = parseInt(cardData / 16);
            if (color == 0) {
                cardItemStr = "方片";
            }
            else if (color == 1) {
                cardItemStr = "梅花";
            }
            else if (color == 2) {
                cardItemStr = "红桃";
            }
            else if (color == 3) {
                cardItemStr = "黑桃";
            }
            cardItemStr += value;
            if (cardStr != "") {
                cardStr += ",";
            }
            cardStr += cardItemStr;
        }
        return cardStr;
    },

    resetSearchOutCardState: function () {
        this.searchOutCardResultArr = [];
        this.ignoreCardValueArr = [];
    }
});
