let TWO_HAND_CARDS_OFFSET = 10;
let CHIP_NUMBER = require('./BJProto').chipAmount;
let BET_OFFSET = 5;
let offset_y = 70;
let BJAudio = require("./BJAudio");

cc.Class({
    extends: cc.Component,

    properties: {
        showBetCountWidget: cc.Prefab
    },

    onLoad() {
        this.chipNumberArr = CHIP_NUMBER;
        this.betNodeArr = [];
        this.Label_betCount = null;

        this.totalBetNodeCount = 0;
        this.totalBetCount = 0;

        this.node.position = cc.v2(this.node.position.x, this.node.position.y + offset_y);
    },

    initWidget: function (headPos, betCount, isDouble, isCut) {
        this.cleanBet(true);
        this.betNodeArr = [];
        headPos = this.node.convertToNodeSpaceAR(headPos);
        this.headPos = headPos;
        if (!betCount) return;
        let node = this.createBetNodes(betCount);
        if (isCut) {
            node.parent = this.node;
            node.position = cc.v2(-TWO_HAND_CARDS_OFFSET, 0);
            this.betNodeArr.push(node);

            let betCountNode = cc.instantiate(this.showBetCountWidget);
            this.Label_betCount = betCountNode.getChildByName("betCount").getComponent(cc.Label);
            this.Label_betCount.string = parseFloat(betCount.toFixed(8)).toString();
            betCountNode.parent = this.node;
            //betCountNode.position = cc.v2(0,0 - offset_y);

            let node2 = cc.instantiate(node);
            node2.parent = this.node;
            node2.position = cc.v2(TWO_HAND_CARDS_OFFSET, 0);
            this.Label_betCount.string = this.getDoubleBetNum(this.Label_betCount);
            this.betNodeArr.push(node);
        } else {
            node.parent = this.node;
            node.position = cc.v2(0, 0);
            this.betNodeArr.push(node);

            let betCountNode = cc.instantiate(this.showBetCountWidget);
            this.Label_betCount = betCountNode.getChildByName("betCount").getComponent(cc.Label);
            this.Label_betCount.string = parseFloat(betCount.toFixed(8)).toString();
            betCountNode.parent = this.node;
            //betCountNode.position = cc.v2(0,0 - offset_y);
            if (isDouble) {
                let node2 = cc.instantiate(node);
                node2.parent = this.node;
                node2.position = cc.v2(50, 0);
                this.Label_betCount.string = this.getDoubleBetNum(this.Label_betCount);
                this.betNodeArr.push(node);
            }
        }
    },

    createBetNodes: function (count) {
        let rootNode = new cc.Node();
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i) {
            let chipNumber = this.chipNumberArr[i];
            let temp = Math.floor(count / chipNumber);
            while (temp-- > 0) {
                count -= chipNumber;
                let node = this.createBetNode(i);
                if (this.totalBetNodeCount > 10) {
                    node.y = BET_OFFSET * 10;
                } else {
                    node.y = BET_OFFSET * this.totalBetNodeCount;
                }
                node.parent = rootNode;

                this.totalBetNodeCount++;
            }
        }
        return rootNode;
    },

    createBetNode: function (index) {
        let node = Global.CCHelper.createSpriteNode("GameCommon/Jetton/jetton" + this.chipNumberArr[index]);
        node.scale = 0.4;
        return node;
    },

    betCount: function (count) {
        if (!count) return;

        this.totalBetCount = count;

        let betNodeRoot = this.createBetNodes(count);
        betNodeRoot.position = this.headPos;
        betNodeRoot.parent = this.node;
        this.betNodeArr.push(betNodeRoot);

        if (this.Label_betCount == null) {
            let betCountNode = cc.instantiate(this.showBetCountWidget);
            this.Label_betCount = betCountNode.getChildByName("betCount").getComponent(cc.Label);
            this.Label_betCount.string = parseFloat(count.toFixed(8)).toString();
            betCountNode.parent = this.node;
            //betCountNode.position = cc.v2(0,0 - offset_y);
        }
        else {
            this.Label_betCount.string = parseFloat(count.toFixed(8)).toString();
        }

        BJAudio.playAudio("rengjinbi");

        betNodeRoot.runAction(cc.moveTo(0.3, cc.v2(0, 0)));
    },

    addBetCount: function (count) {
        let index = 0;
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i) {
            if (this.chipNumberArr[i] === count) {
                index = i;
                break;
            }
        }
        let node = this.createBetNode(index);
        node.position = this.headPos;
        node.parent = this.node;
        let y;
        if (this.totalBetNodeCount > 10) {
            y = BET_OFFSET * 10;
        } else {
            y = BET_OFFSET * this.totalBetNodeCount;
        }
        this.totalBetNodeCount++;

        this.totalBetCount += count;

        BJAudio.playAudio("rengjinbi");

        node.runAction(cc.sequence([cc.moveTo(0.3, cc.v2(0, y)), cc.callFunc(
            function () {
                this.cleanBet(false);
                let rootNode = this.createBetNodes(this.totalBetCount);
                rootNode.parent = this.node;
                this.betNodeArr.push(rootNode);

                if (this.Label_betCount == null) {
                    let betCountNode = cc.instantiate(this.showBetCountWidget);
                    this.Label_betCount = betCountNode.getChildByName("betCount").getComponent(cc.Label);
                    this.Label_betCount.string = parseFloat(this.totalBetCount.toFixed(8)).toString();
                    betCountNode.parent = this.node;
                    //betCountNode.position = cc.v2(0,0 - offset_y);
                }
                else {
                    this.Label_betCount.string = parseFloat(this.totalBetCount.toFixed(8)).toString();
                }

                node.removeFromParent();
            }.bind(this)
        )]));
    },

    cleanBet: function (isCleanBetCount) {
        for (let i = 0; i < this.betNodeArr.length; ++i) {
            this.betNodeArr[i].removeFromParent();
        }
        this.betNodeArr = [];

        this.totalBetNodeCount = 0;
        if (isCleanBetCount) {
            this.totalBetCount = 0;
        }

        if (this.Label_betCount)
            this.Label_betCount.string = 0;
    },

    getTotalBetCount: function () {
        return this.totalBetCount;
    },

    double: function () {
        let node = cc.instantiate(this.betNodeArr[0]);
        if (node == null)
            return;
        node.position = this.headPos;
        node.parent = this.node;
        this.betNodeArr.push(node);

        node.runAction(cc.moveTo(0.3, cc.v2(70, 0)));

        this.Label_betCount.string = this.getDoubleBetNum(this.Label_betCount);
    },

    cutCard: function () {
        let node = cc.instantiate(this.betNodeArr[0]);
        node.position = this.headPos;
        node.parent = this.node;
        this.betNodeArr.push(node);

        this.betNodeArr[0].runAction(cc.moveTo(0.3, cc.v2(-TWO_HAND_CARDS_OFFSET, 0)));
        node.runAction(cc.moveTo(0.3, cc.v2(TWO_HAND_CARDS_OFFSET, 0)))

        this.Label_betCount.string = this.getDoubleBetNum(this.Label_betCount);
    },

    getDoubleBetNum: function (Label_betCount_) {
        if (Label_betCount_ == null)
            return 0;

        let betNum = parseFloat(Label_betCount_.string) + parseFloat(Label_betCount_.string);
        return Math.floor(betNum);
    }
});
