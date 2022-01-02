let gameLogic = require('./gameLogic');
let gameProto = require('./DDZProto');
let DDZModel = require("./DDZModel");

cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        // this.cardNodeArr = [];
        this.cardArray = [];
        this.cardsLayout = this.node.getChildByName("cardsLayout");

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
    //发牌，并将牌存储
    onSendCard: function (cardDataArr, isTween, cb) {
        for (let i = 0; i < cardDataArr.length; ++i) {
            this.addCardNode(cardDataArr[i], i, isTween, cardDataArr.length, function (index) {
                Global.Utils.invokeCallback(cb, index);
            }.bind(this));
        }
    },
    //开始游戏时添加点击事件
    startGame: function () {
        this.addTouchCardEvent();
    },
    // //发牌的时候加载卡牌的 预制体试试
    // addCardNode:function(cardData, i, isTween, finishedAllCB){
    //     var self = this;
    //     AssetMgr.loadResSync("Game/DDZ/DDZCard",cc.Prefab,function (err, prefab) {
    //         if (err){
    //             cc.log("=======加载CardPrefab 报错");
    //         }else{
    //
    //             let cardPrefab = cc.instantiate(prefab);
    //             cardPrefab.parent = self.node;
    //             cardPrefab.active = false;
    //
    //             let cardJs = cardPrefab.getComponent("DDZCard");
    //
    //             cardJs.setValue(cardData);
    //             cardJs.cardData = cardData;
    //             cardJs.cardUp = false;
    //             cardJs.zIndex = i + 1;
    //             self.cardNodeArr.push(cardPrefab);
    //             self.cardArray.push(cardJs);
    //
    //             if (isTween){
    //                 self.scheduleOnce(function () {
    //                     cardPrefab.active = true;
    //                     Global.Utils.invokeCallback(finishedAllCB, i + 1);
    //                 }.bind(this), (i + 1) * 0.1);
    //             }else{
    //                 cardPrefab.active = true;
    //                 Global.Utils.invokeCallback(finishedAllCB, i + 1);
    //             }
    //         }
    //     });
    // },
    //发牌添加
    addCardNode: function (cardData, i, isTween, length, finishedAllCB) {
        let node = Global.CCHelper.createSpriteNode('Game/DDZ/Card/' + cardData);
        let nodedizhuLogo = Global.CCHelper.createSpriteNode('Game/DDZ/dizhuLogo');
        nodedizhuLogo.parent = node;
        nodedizhuLogo.name = "dizhuLogo";
        nodedizhuLogo.setAnchorPoint(1, 1);
        nodedizhuLogo.setPosition(82, 114.5);
        nodedizhuLogo.active = false;
        if (i === length - 1 && DDZModel.getMyChairId() === DDZModel.getBankerChairId()) {
            nodedizhuLogo.active = true;
        }
        node.cardData = cardData;
        node.cardUp = false;
        node.zIndex = i + 1;
        this.cardNodeArr.push(node);


        //发牌效果
        if (isTween) {
            this.scheduleOnce(function () {
                node.parent = this.node;
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
        // let touchStartPos = this.node.convertTouchToNodeSpaceAR(event.touch);
        let touchStartPos = this.node.convertToNodeSpaceAR(event.getLocation());
        this.touchStartCardIndex = this.getTouchPosIndex(touchStartPos);
    },

    onTouchMove: function (event) {
        let curPos = this.node.convertToNodeSpaceAR(event.getLocation());
        let index = this.getTouchPosIndex(curPos);
        for (let i = 0; i < this.cardNodeArr.length; ++i) {
            let node = this.cardNodeArr[i];
            node.color = ((i >= this.touchStartCardIndex && i <= index) || (i >= index && i <= this.touchStartCardIndex)) ? cc.Color.GRAY : cc.Color.WHITE;
        }
    },

    onTouchCardEnd: function (event) {
        let curPos = this.node.convertToNodeSpaceAR(event.getLocation());
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
        AudioMgr.playSound("Game/DDZ/Sound/sound_select_card");

        if (this.selectedCardArr.length <= 4 || count <= 4) return;
        // 自动筛选
        let cardTypeResultArr = [];
        gameLogic.analyseOutCardTypeActive(this.selectedCardArr, cardTypeResultArr);
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
        let lastNode = this.cardNodeArr[this.cardNodeArr.length - 1];
        if (pos.x >= lastNode.x - lastNode.width / 2) {
            return this.cardNodeArr.length - 1;
        } else {
            let len = lastNode.x - lastNode.width / 2 - pos.x;
            let offset = lastNode.width - 110;
            let index = this.cardNodeArr.length - Math.floor(len / offset) - 2;
            if (index < 0) index = 0;
            return index
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
    //地主牌添加
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
            let node = Global.CCHelper.createSpriteNode('Game/DDZ/Card/' + cardData);

            let nodedizhuLogo = Global.CCHelper.createSpriteNode('Game/DDZ/dizhuLogo');
            nodedizhuLogo.parent = node;
            nodedizhuLogo.name = "dizhuLogo";
            nodedizhuLogo.setAnchorPoint(1, 1);
            nodedizhuLogo.setPosition(82, 114.5);
            nodedizhuLogo.active = false;

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
                    let tempCard = this.cardNodeArr[j];
                    let tempJ = j;
                    tempCard.opacity = 90;
                    let pos0 = tempCard.getPosition();
                    let bezier = [pos0, cc.v2(pos0.x, (pos0.y + 170)), cc.v2(0, pos0.y + 170)];
                    let bezierForward = cc.bezierTo(0.15, bezier);
                    //甩牌动画
                    this.cardNodeArr.splice(tempJ, 1);
                    var action = cc.sequence(cc.spawn(
                            cc.fadeOut(0.15),
                            bezierForward
                        ),
                        cc.callFunc(function () {
                            tempCard.destroy();
                        }.bind(this))
                    );
                    tempCard.runAction(action);
                    break;
                }
            }
        }
        if (DDZModel.getMyChairId() === DDZModel.getBankerChairId() && this.cardNodeArr.length > 0) {
            this.cardNodeArr[this.cardNodeArr.length - 1].getChildByName("dizhuLogo").active = true;
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
            gameLogic.removeCardByValue(this.ignoreCardValueArr, handCardDataArr);
        }

        let resultCardArr = gameLogic.searchOutCard(handCardDataArr, turnCardDataArr);
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
        for (let i = 0; i < this.searchOutCardResultArr.length; i++) {
            cc.log("=====searchOutCard[i]:", this.searchOutCardResultArr[i]);
        }
        return true;
    },

    resetSearchOutCardState: function () {
        this.searchOutCardResultArr = [];
        this.ignoreCardValueArr = [];
    }
});
