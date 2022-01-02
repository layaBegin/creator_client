// Learn cc.Class:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://docs.cocos2d-x.org/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] https://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        recordItem: cc.Node,
        recordRootNode: cc.Node,
        newFlag: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
    },

    addDirRecord: function (dirRecordArr) {
        if (!this.recordDateArr) {
            this.recordDateArr = [];
        }
        let len = dirRecordArr.length;
        for (let i = 0; i < len; ++i) {
            this.recordDateArr.push(dirRecordArr[i]);
        }
        this.clearRecord();
        this.updateRecord();
    },

    clearRecord: function () {

        let childrenArr = this.recordRootNode.getChildren();
        let len = childrenArr.length;
        for (let i = len - 1; i >= 0; --i) {
            if (childrenArr[i] == this.recordItem) {
                continue;
            }
            if (!!childrenArr[i]) {
                childrenArr[i].removeFromParent(true);
            }
        }
        this.newFlag.active = false;
    },

    updateRecord: function () {
        let recordStr = "";
        let startIndex = 0;
        let showItemNum = 10;
        if (this.recordDateArr.length > 0) {
            this.newFlag.active = true;
        }
        if (this.recordDateArr.length > showItemNum) {
            startIndex = this.recordDateArr.length - showItemNum;
        }
        for (let i = startIndex; i < this.recordDateArr.length; ++i) {
            let node = cc.instantiate(this.recordItem);
            node.active = true;
            node.parent = this.recordRootNode;
            let record = this.recordDateArr[i];
            for (let j = 0; j < record.length; ++j) {
                if (record[j] > 0) {
                    recordStr = "BaiRenNiuNiu/trend-win";
                } else {
                    recordStr = "BaiRenNiuNiu/trend-lose";
                }
                Global.CCHelper.updateSpriteFrame(recordStr, node.getChildByName(j.toString()).getChildByName("flag").getComponent(cc.Sprite));
            }
        }
    },

    resetWidget: function () {
        let childrenArr = this.recordRootNode.getChildren();
        for (let i = 0; i < childrenArr.length; ++i) {
            if (childrenArr[i] !== this.recordItem) {
                childrenArr[i].removeFromParent(true);
            }
        }
    },


    clickBtn(event, param) {
        if (param == "close") {
            this.node.active = false;
        }
    }

    // update (dt) {},
});
