let gameProto = require('./API/HHDZGameProto');

cc.Class({
    extends: cc.Component,

    properties: {
        trendItemController: require("./HHDZTrendItem"),

        blackWinPercentLabel: cc.Label,
        redWinPercentLabel: cc.Label,
        blackProgressBar:cc.Node,
        redProgressBar:cc.Node,

        dirPoint: cc.Prefab,
        pointContent: cc.Node,
        dirCardTypeImg: cc.Prefab,
        cardTypeImgContent: cc.Node,

        redCount: cc.Label,
        blackCount: cc.Label,
        totalCount: cc.Label
    },

    start() {
        this.points = [];
        this.cardTypeImgs = [];
        this.dirRecordArr = this.dialogParameters.dirRecordArr;

        this.updateTrendItemController();
        this.addDirRecord(this.dirRecordArr);
        this.updateWinPercent();

        Global.MessageCallback.addListener('UpdateDirRecord', this);
    },

    onDestroy() {
        Global.MessageCallback.removeListener('UpdateDirRecord', this);
    },

    messageCallbackHandler(router, msg) {
        if (router === 'UpdateDirRecord') {
            this.dirRecordArr = this.dirRecordArr.concat(msg);
            this.addDirRecord(msg);
            this.updateWinPercent();
            this.updateTrendItemController();
        }
    },

    buttonEvent(event, param) {
        if (param === "close") {
            Global.CCHelper.playPreSound();
            Global.DialogManager.destroyDialog(this);
        }
    },

    updateTrendItemController() {
        let arr = [];
        let startIndex = 0;
        let redWinCount = 0;
        let blackWinCount = 0;
        if (this.dirRecordArr.length > gameProto.DIR_COUNT) {
            startIndex = this.dirRecordArr.length - gameProto.DIR_COUNT;
        }

        for (let i = startIndex; i < this.dirRecordArr.length; i++) {
            arr.push(this.dirRecordArr[i].winner);

            if (this.dirRecordArr[i].winner === gameProto.BLACK) {
                blackWinCount++;
            } else if (this.dirRecordArr[i].winner === gameProto.RED) {
                redWinCount++;
            }
        }

        this.redCount.string = '红 ' + redWinCount;
        this.blackCount.string = '黑 ' + blackWinCount;
        this.totalCount.string = '局数 ' + (redWinCount + blackWinCount);
        this.trendItemController.init(arr, Global.Enum.gameType.HHDZ);
    },

    addDirRecord(dirRecordList) {
        for (let i = 0; i < dirRecordList.length; i++) {
            if (this.points.length === 20) {
                this.points[0].destroy();
                this.points.shift();
            }

            if (this.cardTypeImgs.length === 20) {
                this.cardTypeImgs[0].destroy();
                this.cardTypeImgs.shift();
            }

            let point = cc.instantiate(this.dirPoint);
            point.parent = this.pointContent;
            point.getChildByName('redPoint').active = dirRecordList[i].winner === gameProto.RED;
            this.points[this.points.length] = point;

            let cardTypeImg = cc.instantiate(this.dirCardTypeImg);
            cardTypeImg.parent = this.cardTypeImgContent;
            // Global.CCHelper.updateSpriteFrame('HongHeiDaZhan/dir_cardType_' + dirRecordList[i].winnerCardType, cardTypeImg.getComponent(cc.Sprite));
            cardTypeImg.type = dirRecordList[i].winnerCardType;

            let backSpriteStr = 'HongHeiDaZhan/back_1';
            if (cardTypeImg.type == 10) {
                backSpriteStr = 'HongHeiDaZhan/back_2';
            }
            Global.CCHelper.updateSpriteFrame(backSpriteStr, cardTypeImg.getComponent(cc.Sprite));
            Global.CCHelper.updateSpriteFrame('HongHeiDaZhan/old_' + cardTypeImg.type, cardTypeImg.getChildByName("font").getComponent(cc.Sprite));
            this.cardTypeImgs[this.cardTypeImgs.length] = cardTypeImg;
        }
        this.updateCardTypeNewFlag();
    },

    updateCardTypeNewFlag() {
        let len = this.cardTypeImgs.length;
        for (let i = 0; i < len; ++i) {
            if (i == len - 1) {
                this.cardTypeImgs[i].getChildByName("new_flag").active = true;
            }
            else {
                this.cardTypeImgs[i].getChildByName("new_flag").active = false;
            }
        }
    },

    updateWinPercent() {
        let blackWinCount = 0;
        let redWinCount = 0;

        let startIndex = 0;
        if (this.dirRecordArr.length >= 20) {
            startIndex = this.dirRecordArr.length - 20;
        }

        for (let i = startIndex; i < this.dirRecordArr.length; i++) {
            if (this.dirRecordArr[i].winner === gameProto.BLACK)
                blackWinCount++;
            else if (this.dirRecordArr[i].winner === gameProto.RED)
                redWinCount++;
        }

        if (blackWinCount === redWinCount) {
            this.blackWinPercentLabel.string = "50%";
            this.redWinPercentLabel.string = "50%";
            this.blackProgressBar.width = (this.blackProgressBar.width + this.redProgressBar.width) / 2;
            this.redProgressBar.width = this.blackProgressBar.width;
        } else {
            let blackWinPercent = Math.floor(blackWinCount / (blackWinCount + redWinCount) * 100);
            this.blackWinPercentLabel.string = blackWinPercent + "%";
            this.redWinPercentLabel.string = (100 - blackWinPercent) + "%";

            this.blackProgressBar.width = (this.blackProgressBar.width + this.redProgressBar.width) * (blackWinPercent / 100);
            if (this.blackProgressBar.width < 230) this.blackProgressBar.width = 230;
            if (this.blackProgressBar.width > 500) this.blackProgressBar.width = 500;
            this.redProgressBar.width = 730 - this.blackProgressBar.width;
        }
    }
});
