let fishConfig = require('./API/ShenHaiBuYuConfig');
cc.Class({
    extends: cc.Component,

    properties: {
        fishInfoItem: cc.Node
    },

    start() {
        for (let i = 0; i < fishConfig.fishType.length; ++i) {
            let fishInfo = fishConfig.fishType[i];
            if (fishInfo.resIndex === fishConfig.FishKind.DaSanYuan ||
                fishInfo.resIndex === fishConfig.FishKind.DaSiXi ||
                fishInfo.resIndex === fishConfig.FishKind.FishKing) {
                continue;
            }
            let node = cc.instantiate(this.fishInfoItem);
            node.getChildByName("timeLabel").getComponent(cc.Label).string = fishInfo.rewardTimes + "倍";
            let nameStr = "";
            if (fishInfo.resIndex === fishConfig.FishKind.LocalBomb) {
                nameStr = "局部炸弹";
            } else if (fishInfo.resIndex === fishConfig.FishKind.SuperBomb) {
                nameStr = "全屏炸弹";
            }
            node.getChildByName("nameLabel").getComponent(cc.Label).string = nameStr;
            let sprite = node.getChildByName("fishSprite").getComponent(cc.Sprite);
            let fishNo = fishInfo.resIndex + 1;
            let fishUrl = "ShenHaiBuYu/Fish/fish" + fishNo;
            let res = cc.loader.getRes(fishUrl, cc.SpriteAtlas);
            let fishName = "fish";
            fishName = fishName + fishNo + "_01";
            sprite.spriteFrame = res.getSpriteFrame(fishName);
            if (fishInfo.resIndex === fishConfig.FishKind.LocalBomb) {
                sprite.node.scale = 0.45;
            } else if (fishInfo.resIndex === fishConfig.FishKind.FishKind17) {
                sprite.node.scale = 0.45;
            } else if (fishInfo.resIndex === fishConfig.FishKind.SuperBomb) {
                sprite.node.scale = 0.55;
            } else {
                if (sprite.node.width > this.fishInfoItem.width - 10) {
                    sprite.node.scale = (this.fishInfoItem.width - 10) / sprite.node.width;
                }
            }
            node.active = true;
            node.parent = this.fishInfoItem.parent;
        }
    },

    onBtnClick() {
        Global.DialogManager.destroyDialog(this);
    }
});
