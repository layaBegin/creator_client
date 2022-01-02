let DDZModel = require("./DDZModel");

cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad: function () {
        
    },
    
    initWidget: function (cardDataArr, index,chairId) {
        for(let i = 0; i < cardDataArr.length; ++i){
            let node = Global.CCHelper.createSpriteNode('Game/DDZ/Card/' + cardDataArr[i]);
            if (chairId >=0 && chairId === DDZModel.getBankerChairId() && i === cardDataArr.length - 1) {
                let nodedizhuLogo = Global.CCHelper.createSpriteNode('Game/DDZ/dizhuLogo');
                nodedizhuLogo.parent = node;
                nodedizhuLogo.name = "dizhuLogo";
                nodedizhuLogo.setAnchorPoint(1,1) ;
                nodedizhuLogo.setPosition(82,114.5);
            }
            node.parent = this.node;
        }
        if (index === 1){
            this.node.anchorX = 1;
        }else if (index === 2){
            this.node.anchorX = 0;
        }

        // 播放动画
        this.node.scale = 0.5 * 1;
        // let action = cc.scaleTo(0.15, 0.5);
        // action.easing(cc.easeBackOut());
        // this.node.runAction(action)
    },

    getCenterPos: function () {
        if (this.node.anchorX === 1){
            return cc.v2(-30 * this.node.childrenCount, 0);
        }else if (this.node.anchorX === 0){
            return cc.v2(30 * this.node.childrenCount, 0);
        }else {
            return cc.v2(0, 0);
        }
    }
});
