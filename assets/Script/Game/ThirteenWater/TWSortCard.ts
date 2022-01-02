import HandCards from "../GameCommon/Poker/HandCards";
import TWLogic = require('./TWLogic');
import GameProto = require('./TWProto');
import RoomAPI = require('../../API/RoomAPI');

import Poker from "../GameCommon/Poker/Poker";

const { ccclass, property } = cc._decorator;
var GameMessageRouter = 'game.gameHandler.gameMessageNotify';
@ccclass
export default class TWSortCard extends cc.Component {

    @property(HandCards)
    handCard: HandCards = undefined;
    @property(cc.Node)
    cardTypeBtns: cc.Node = undefined;
    @property(cc.Button)
    toudaoNode: cc.Button = undefined;
    @property(cc.Button)
    zhongdaoNode: cc.Button = undefined;
    @property(cc.Button)
    weidaoNode: cc.Button = undefined;

    @property([cc.Sprite])
    cardType_left: cc.Sprite[] = [];
    @property(cc.Node)
    autoSortList: cc.Node = undefined;

    @property(cc.Label)
    clockTimeLabel: cc.Label = undefined;
    @property(cc.Node)
    completeBtns: cc.Node = undefined;
    @property(cc.Node)
    clearBtns:cc.Node[] = [];

    toudaoCardsIndex: number[] = []
    zhongdaoCardsIndex: number[] = []
    weidaoCardsIndex: number[] = []


    sortType: number = 1;           // 排序模式 1 大小 2花色
    cardValues: number[] = [];
    clockTime: number = 0;
    delayTime: number = 0;
    isAlreadyDelay: boolean = false;
    setCards(cardArray: number[], time: number, delayTime: number) {
        this.cardValues = cardArray
        this.onSortTypeClicked(undefined, this.sortType);
        this.updateCards(); // 更新牌显示

        this.setTypeButton();
        this.setAutoSortList();
        // 开启倒计时
        this.unscheduleAllCallbacks();
        this.clockTime = Math.floor(time) || 20;
        this.clockTimeLabel.string = this.clockTime.toString();
        this.schedule(this.clockScheduler.bind(this), 1);
        // 。。。
        this.completeBtns.active = false;
        this.delayTime = delayTime;
        this.isAlreadyDelay = false;
    }
    clockScheduler() {
        this.clockTime--;
        if (this.clockTime < 0) {
            let cardArr = this.cardValues
            let isGuaiPai = TWLogic.hasGuaipai(this.cardValues)
            if (!isGuaiPai) {
                cardArr = TWLogic.autoSortCards(this.cardValues);
            }
            this.sendSortCard(cardArr, isGuaiPai);

            Confirm.hide();
        } else {
            this.clockTimeLabel.string = this.clockTime.toString();
        }
    }
    getClockTime(){
        return this.clockTime;
    }
    setDelayTime(){
        if(this.clockTime != null && this.isAlreadyDelay == false && this.delayTime != null && this.delayTime != undefined){
            this.clockTime += this.delayTime;
            this.isAlreadyDelay = true;
        }
    }
    setTypeButton() {
        let cardValues = this.handCard.getCurrCards();  // 获取当前剩余手牌
        let types = []
        /**
         * 按钮顺序必须与以下数组顺序相同
         */
        types.push(TWLogic.hasDuizi(cardValues))
        types.push(TWLogic.hasLiangdui(cardValues))
        types.push(TWLogic.hasSantiao(cardValues))
        types.push(TWLogic.hasShunzi(cardValues))
        types.push(TWLogic.hasTonghua(cardValues))
        types.push(TWLogic.hasHulu(cardValues))
        types.push(TWLogic.hasSitiao(cardValues))
        types.push(TWLogic.hasTonghuashun(cardValues))
        for (let i = 0; i < this.cardTypeBtns.children.length; i++) {
            let button = this.cardTypeBtns.children[i].getComponent(cc.Button);
            button.interactable = types[i];
        }
    }
    updateCards(cardArray?: number[]) {
        cardArray = Array.isArray(cardArray) ? cardArray : this.cardValues;
        for (let i = 0; i < cardArray.length; i++) {
            this.handCard.cards[i].value = cardArray[i];
        }
    }
    onLoad() {

    }
    start() {

    }
    cardsIndexToValues(indexs: number[]) {
        let values = [];
        for (let i = 0; i < indexs.length; i++) {
            values.push(this.cardValues[indexs[i]]);
        }
        return values;
    }
    /* 自动填充 */
    autoFill() {
        // 判断当前剩余牌数量
        let cards = this.handCard.getCurrCards();
        if (cards.length <= 5) {
            let type: "toudao" | "zhongdao" | "weidao" = "toudao"
            if (cards.length == 3) {
                type = "toudao"
            }
            else {
                if (!this.zhongdaoCardsIndex || this.zhongdaoCardsIndex.length == 0) {
                    type = "zhongdao";
                }
                else {
                    type = "weidao";
                }
            }
            this.handCard.setSelecteds(cards);
            this.onSortClicked(undefined, type);
        }
    }
    onSortClicked(event: cc.Event, parmas: "toudao" | "zhongdao" | "weidao") {
        Global.CCHelper.playPreSound();

        let cardsIndex = this.handCard.getSelecteds()
        // let cards = this.cardsIndexToValues();

        if (cardsIndex.length == 0) {
            return;
        }
        let ret = false;
        if (parmas == "toudao") {
            ret = this.setToudao(cardsIndex);
        }
        else if (parmas == "zhongdao") {
            ret = this.setZhongdao(cardsIndex)
        }
        else if (parmas == "weidao") {
            ret = this.setWeidao(cardsIndex);
        }

        if (ret) {
            this.handCard.removeSelects();

            this.setTypeButton();
            // 自动填充剩下的一道牌
            this.autoFill();
            // 判断是否显示 完成摆牌按钮组
            if (this.toudaoCardsIndex.length == 3 && this.zhongdaoCardsIndex.length == 5 && this.weidaoCardsIndex.length == 5) {
                this.completeBtns.active = true;
            }
        }

    }
    setToudao(cardsIndex: number[]) {
        this.toudaoCardsIndex = cardsIndex
        if (cardsIndex.length != 3) {
            Tip.makeText("头道必须是3张牌");
            this.toudaoCardsIndex = [];
            return false;
        }
        if (!this.verifySortCard()) {
            this.toudaoCardsIndex = [];
            return;
        }

        let cards = this.cardsIndexToValues(cardsIndex);
        let cardNodes = this.toudaoNode.node.children[0].children;
        for (let i = 0; i < cardNodes.length; i++) {
            let poker = cardNodes[i].getComponent(Poker);
            poker.value = cards[i];
            poker.node.active = true;
        }
        Global.CCHelper.updateSpriteFrame(this.getTypeUrlByCardArr(cards, "left"), this.cardType_left[0])
        this.cardType_left[0].node.active = true;
        this.toudaoNode.interactable = false;

        this.clearBtns[0].active = true;
        return true;
    }
    setZhongdao(cardsIndex: number[]) {
        this.zhongdaoCardsIndex = cardsIndex;
        if (cardsIndex.length != 5) {
            Tip.makeText("中道必须是5张牌");
            this.zhongdaoCardsIndex = [];
            return false;
        }
        if (!this.verifySortCard()) {
            this.zhongdaoCardsIndex = [];
            return;
        }
        let cards = this.cardsIndexToValues(cardsIndex);
        let cardNodes = this.zhongdaoNode.node.children[0].children;
        for (let i = 0; i < cardNodes.length; i++) {
            let poker = cardNodes[i].getComponent(Poker);
            poker.value = cards[i];
            poker.node.active = true;
        }
        this.zhongdaoNode.interactable = false;
        Global.CCHelper.updateSpriteFrame(this.getTypeUrlByCardArr(cards, "left"), this.cardType_left[1])
        this.cardType_left[1].node.active = true;

        this.clearBtns[1].active = true;
        return true
    }
    setWeidao(cardsIndex: number[]) {
        this.weidaoCardsIndex = cardsIndex;
        if (cardsIndex.length != 5) {
            Tip.makeText("尾道必须是5张牌");
            this.weidaoCardsIndex = [];
            return false;
        }
        if (!this.verifySortCard()) {
            this.weidaoCardsIndex = [];
            return;
        }
        let cards = this.cardsIndexToValues(cardsIndex);
        let cardNodes = this.weidaoNode.node.children[0].children;
        for (let i = 0; i < cardNodes.length; i++) {
            let poker = cardNodes[i].getComponent(Poker);
            poker.value = cards[i];
            poker.node.active = true;
        }
        this.weidaoNode.interactable = false;
        Global.CCHelper.updateSpriteFrame(this.getTypeUrlByCardArr(cards, "left"), this.cardType_left[2])
        this.cardType_left[2].node.active = true;

        this.clearBtns[2].active = true;
        return true;
    }

    setAutoSortList() {
        let groupCards = TWLogic.getAutoSortCardsArr(this.cardValues);
        console.log("自动摆牌数据::", groupCards)
        for (let i = 0; i < this.autoSortList.children.length; i++) {
            this.autoSortList.children[i].active = false;
        }
        for (let i = 0; i < groupCards.length && i < this.autoSortList.children.length - 1; i++) {
            let groupCardsItem = groupCards[i];
            let itemNode = this.autoSortList.children[i];
            itemNode.active = true;
            let url = this.getTypeUrlByCardArr(groupCardsItem.toudaoArr, "right");
            Global.CCHelper.updateSpriteFrame(url, itemNode.children[0].getComponent(cc.Sprite));
            url = this.getTypeUrlByCardArr(groupCardsItem.zhongdaoArr, "right");
            Global.CCHelper.updateSpriteFrame(url, itemNode.children[1].getComponent(cc.Sprite));
            url = this.getTypeUrlByCardArr(groupCardsItem.weidaoArr, "right");
            Global.CCHelper.updateSpriteFrame(url, itemNode.children[2].getComponent(cc.Sprite));
        }
        // 显示怪牌
        let guaiPaiType = TWLogic.hasGuaipai(this.cardValues);
        if (guaiPaiType) {
            let itemNode = this.autoSortList.children[3];// 最后一个条目固定显示怪牌
            // 显示怪牌牌型

            let url = this.getGuaiPaiUrl(guaiPaiType);
            Global.CCHelper.updateSpriteFrame(url, itemNode.children[0].getComponent(cc.Sprite))
            itemNode.active = true;
        }

        this.setAutoSortList.prototype.groupCards = groupCards;
    }

    onAutoSortClicked(event: cc.Event, parmas: "0" | "1" | "2" | "guaipai") {
        Global.CCHelper.playPreSound();

        if (!Array.isArray(this.setAutoSortList.prototype.groupCards)) {
            return;
        }

        if (parmas == "guaipai") {    // 怪牌固定显示在 第四条 特殊处理
            Confirm.show("是否直接发送怪牌?", () => {
                this.sendSortCard(this.cardValues, true);
            }, () => { });
            return;
        }
        this.onClearClicked(null, "weidao");
        this.onClearClicked(null, "zhongdao");
        this.onClearClicked(null, "toudao");
        let oneGroupCards = this.setAutoSortList.prototype.groupCards[parmas];
        if (!oneGroupCards) {
            return;
        }
        /* 手动摆两道 头道 autoFill() */
        // this.handCard.setSelecteds(oneGroupCards.toudaoArr);
        // this.onSortClicked(null, "toudao");
        this.handCard.setSelecteds(oneGroupCards.zhongdaoArr);
        this.onSortClicked(null, "zhongdao");
        this.handCard.setSelecteds(oneGroupCards.weidaoArr);
        this.onSortClicked(null, "weidao");
    }

    onCardTypeClicked(event: cc.Event, parmas: string) {
        Global.CCHelper.playPreSound();

        let type = this.onCardTypeClicked.prototype.type || "";
        let index = this.onCardTypeClicked.prototype.index || 0;

        let cardValues = this.handCard.getCurrCards();
        let selectCards: number[][] = [[]];
        switch (parmas) {
            case "duizi":
                selectCards = TWLogic.getDuizi(cardValues);
                break;
            case "liangdui":
                selectCards = TWLogic.getLiangdui(cardValues);
                break;
            case "santiao":
                selectCards = TWLogic.getSantiao(cardValues);
                break;
            case "sitiao":
                selectCards = TWLogic.getSitiao(cardValues);
                break;
            case "shunzi":
                selectCards = TWLogic.getShunzi(cardValues);
                selectCards = TWLogic.sortResoutArr(selectCards);       // 对牌型进行排序
                break;
            case "tonghua":
                selectCards = TWLogic.getTonghua(cardValues);
                selectCards = TWLogic.sortResoutArr(selectCards);
                break;
            case "hulu":
                selectCards = TWLogic.getHulu(cardValues);
                break;
            case "tonghuashun":
                selectCards = TWLogic.getTonghuashun(cardValues);
                selectCards = TWLogic.sortResoutArr(selectCards);
                break;
            default:
                selectCards = [[]];
                console.error("牌型 %s 不存在", parmas);
                break;
        }
        CC_DEBUG && Debug.assert(!Array.isArray(selectCards) || selectCards.length == 0, "牌型数据为空");
        // 上一次点选的类型不是当前类型 || 点选类型的牌型已经被改变或者已经轮询到头了
        if (type != parmas || index > selectCards.length - 1) {
            index = 0;
        }
        this.handCard.setSelecteds(selectCards[index]);
        console.log(selectCards[index], index);
        ++index;
        this.onCardTypeClicked.prototype.type = parmas;
        this.onCardTypeClicked.prototype.index = index;
    }

    onSortTypeClicked(event: cc.Event, parmas: string | number) {
        Global.CCHelper.playPreSound();

        this.sortType = +parmas // 1 || 2
        if (this.sortType == 1) {
            this.cardValues = TWLogic.sortCardByCountThenColor(this.cardValues);
        }
        else if (this.sortType == 2) {
            this.cardValues = TWLogic.sortCardByColor(this.cardValues);
        }
        this.handCard.setSelecteds([]);     // 切换排序时 取消所有选中
        this.onClearClicked(undefined, "toudao");
        this.onClearClicked(undefined, "zhongdao");
        this.onClearClicked(undefined, "weidao");
        this.completeBtns.active = false;
        this.updateCards();


        this.onCardTypeClicked.prototype.type = "";     // 切换排序时 清空牌型类型数据
    }
    onClearClicked(event: cc.Event, parmas: "toudao" | "zhongdao" | "weidao") {
        Global.CCHelper.playPreSound();

        let selectIndexs = [];
        let cardsNode: cc.Node[] = [];
        switch (parmas) {
            case "toudao":
                selectIndexs = this.toudaoCardsIndex;
                this.toudaoNode.interactable = true;
                cardsNode = this.toudaoNode.node.children[0].children;
                this.toudaoCardsIndex = [];
                this.cardType_left[0].node.active = false;

                this.clearBtns[0].active = false;
                break;
            case "zhongdao":
                selectIndexs = this.zhongdaoCardsIndex;
                this.zhongdaoNode.interactable = true;
                cardsNode = this.zhongdaoNode.node.children[0].children;
                this.zhongdaoCardsIndex = []
                this.cardType_left[1].node.active = false;

                this.clearBtns[1].active = false;
                break;
            case "weidao":
                selectIndexs = this.weidaoCardsIndex;
                this.weidaoNode.interactable = true;
                cardsNode = this.weidaoNode.node.children[0].children;
                this.weidaoCardsIndex = []
                this.cardType_left[2].node.active = false;

                this.clearBtns[2].active = false;
                break;
        }
        for (let i = 0; i < cardsNode.length; i++) {
            cardsNode[i].active = false;
        }
        this.handCard.gobackSelects(selectIndexs);
        this.setTypeButton();

        this.completeBtns.active = false;

    }

    onBtn_ycClicked(){
        Global.CCHelper.playPreSound();

        RoomAPI.gameMessageNotify(GameProto.getGameDelayRequestData());
    }

    verifySortCard() {
        let toudaoCards = this.cardsIndexToValues(this.toudaoCardsIndex)
        let zhongdaoCards = this.cardsIndexToValues(this.zhongdaoCardsIndex)
        let weidaoCards = this.cardsIndexToValues(this.weidaoCardsIndex)

        if (toudaoCards.length !== 0 && zhongdaoCards.length !== 0) {
            if (!TWLogic.compareCards(zhongdaoCards, toudaoCards,
                TWLogic.getTouZhongWeiCardType(zhongdaoCards),
                TWLogic.getTouZhongWeiCardType(toudaoCards))) {
                Tip.makeText('中道必须大于头道');
                return false;
            }
        }
        if (weidaoCards.length !== 0 && zhongdaoCards.length !== 0) {
            if (!TWLogic.compareCards(weidaoCards, zhongdaoCards,
                TWLogic.getTouZhongWeiCardType(weidaoCards),
                TWLogic.getTouZhongWeiCardType(zhongdaoCards))) {
                Tip.makeText('尾道必须大于中道');
                return false;
            }
        }
        if (toudaoCards.length !== 0 && weidaoCards.length !== 0) {
            if (!TWLogic.compareCards(weidaoCards, toudaoCards,
                TWLogic.getTouZhongWeiCardType(weidaoCards),
                TWLogic.getTouZhongWeiCardType(toudaoCards))) {
                Tip.makeText('尾道必须大于头道');
                return false;
            }
        }
        return true;
    }
    getTypeUrlByCardArr(cardArr: number[], resPath: "left" | "right") {
        var url = "ThirteenWater/TWSortCard/cardTypeText/" + resPath + "/text_"
        let typeName = "wulong"
        if (TWLogic.hasTonghuashun(cardArr)) {
            typeName = "tonghuashun"
        }
        else if (TWLogic.hasSitiao(cardArr)) {
            typeName = "sitiao"
        }
        else if (TWLogic.hasHulu(cardArr)) {
            typeName = "hulu"
        }
        else if (TWLogic.hasTonghua(cardArr)) {
            typeName = "tonghua"
        }
        else if (TWLogic.hasShunzi(cardArr)) {
            typeName = "shunzi"
        }
        else if (TWLogic.hasSantiao(cardArr)) {
            typeName = "santiao"
        }
        else if (TWLogic.hasLiangdui(cardArr)) {
            typeName = "liangdui"
        }
        else if (TWLogic.hasDuizi(cardArr)) {
            typeName = "duizi"
        }

        return url + typeName;
    }
    getGuaiPaiUrl(type: number) {
        let url = "ThirteenWater/TWSortCard/guaipaiType/"
        if (type == 0x001) return url + "sth";
        if (type == 0x002) return url + "ssz";
        if (type == 0x004) return url + "ldb";
        if (type == 0x008) return url + "ytl";
        if (type == 0x010) return url + "zzytl";
    }
    onSendClicked(event: cc.Event) {
        Global.CCHelper.playPreSound();

        var cardArr = [];
        cardArr = cardArr.concat(this.cardsIndexToValues(this.toudaoCardsIndex));
        cardArr = cardArr.concat(this.cardsIndexToValues(this.zhongdaoCardsIndex));
        cardArr = cardArr.concat(this.cardsIndexToValues(this.weidaoCardsIndex));
        this.sendSortCard(cardArr);
    }
    sendSortCard(cardArr: number[], isGuaiPai: boolean = false) {
        if (cardArr.length != 13) {
            console.error("发送失败 牌不是13张");
            debugger;
        }
        if (isGuaiPai) {
            Global.NetworkManager.notify(GameMessageRouter, GameProto.getGameNosortRequestData(!!isGuaiPai, Date.now()));
        }
        else {
            Global.NetworkManager.notify(GameMessageRouter, GameProto.getGameCardsSortRequestData(cardArr, Date.now(), isGuaiPai));
        }
        // console.log(cardArr);
        this.unscheduleAllCallbacks();
        this.node.active = false;
    }
    onCancelAll() {
        this.completeBtns.active = false;
        this.onClearClicked(undefined, "toudao")
        this.onClearClicked(undefined, "zhongdao")
        this.onClearClicked(undefined, "weidao")
    }
}
