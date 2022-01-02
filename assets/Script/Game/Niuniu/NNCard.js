
var NNLogic = require('./NNLogic');


cc.Class({
    extends: cc.Component,

    properties: {

        maskSprite: cc.Sprite, //半透明遮罩

        cardData: null, //牌值
        isShoot: false, //是否弹起
        isFaceUp: false, //是否是正面

        canClicked: false, //能够点击

        cardControl: null, //牌控件
        cardBack: cc.Sprite, //牌背面
        cardFace: cc.Node, //牌zheng面
        ySpace: null, //牌正面的Y值
        cardValue: null,
        cardImgres: null, //牌图片路径

    },
    onLoad () {
        this.ySpace = 20;
        this.reset();

    },
    reset: function () {

        this.canClick = false;
        this.showFace(false);
        this.showBack(false);
        this.setShoot(false);
        this.cardValue = null; //保存value
        this.setClickEnabled(false);
    },


    /**
     * 牌是否可以点击
     * @param enable
     */
    setClickEnabled: function (enable) {
        this.canClicked = enable;
        this.cardFace.getComponent(cc.Button).interactable = enable;
    },

    /**
     * 设置牌值
     * @param cardData
     * @returns {boolean}
     */
    setValue: function (cardData,cb,cb1) {
        this.cardData = cardData;

        var color = NNLogic.getCardColor(cardData);
        var value = NNLogic.getCardNumber(cardData);
        this.cardValue = value; //保存value
        this.cardImgres = "GameCommon/cuoPaiCards/value_" + value + "_" + color;
        var self = this;
        Global.CCHelper.updateSpriteFrame("GameCommon/Cards/value_" + value + "_" + color, self.cardFace.getComponent(cc.Sprite), function () {
            cb &&cb(self);
            cb1 && cb1();
        }.bind(this));

        this.isFaceUp = true;

        return true;
    },

    //设置是否显示正面
    showFace: function (show) {
        if (show) {
            this.cardFace.scaleX = 1;
            this.cardFace.scaleY = 1;
        } else {
            this.cardFace.scaleX = 0;
            this.cardFace.scaleY = 1;
        }
    },
    showBack: function (show) {
        if (show) {
            this.cardBack.node.scaleX = 1;
            this.cardBack.node.scaleY = 1;
        } else {
            this.cardBack.node.scaleX = 0;
            this.cardBack.node.scaleY = 1;
        }
    },
    runFlopCard: function () {
        this.cardBack.node.rotationX = 0;
        this.cardBack.node.rotationY = 0;
        this.cardFace.rotationX = 0;
        this.cardFace.rotationY = -90;

        var action = cc.rotateBy(0.1, 0, 90);
        this.cardBack.node.runAction(action);
        this.cardFace.runAction(cc.sequence(cc.delayTime(0.1), action.clone()));

    },
    /*
	 * 翻牌效果
	 */
    flipCard: function() {
        this.showBack(true);
        this.showFace(false);
        this.cardBack.node.runAction(
            cc.scaleTo(0.1, 0, 1)
        );
        this.scheduleOnce(function () {
            this.cardFace.runAction(cc.scaleTo(0.1,1,1));
        }.bind(this),0.1)
    },
    /**
     * 设置弹起
     * @param shoot
     */
    setShoot: function (shoot) {
        if (this.isShoot == shoot) return;
        let y = this.cardFace.getPosition().y;

        if (this.isShoot) {
            this.cardFace.setPosition(this.cardFace.getPosition().x,y - this.ySpace);
            this.isShoot = false;
            // this.maskSprite.hide();
        } else {
            this.cardFace.setPosition(this.cardFace.getPosition().x,y + this.ySpace);
            this.isShoot = true;
            // this.maskSprite.show();
        }
    },

    //返回牌值图片路径
    getCardImgRes: function () {
        return this.cardImgres
    },

    onButtonClick:function (event,param) {
        this.setShoot(!this.isShoot);
        Global.MessageCallback.emitCustomMessage('NNONCARDSHOOT',this.isShoot);
        Global.CCHelper.playPreSound();
        // AudioMgr.playSound("GameCommon/Sound/button-click");

    }
});
