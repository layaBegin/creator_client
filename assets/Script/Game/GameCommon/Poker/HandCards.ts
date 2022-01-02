import Poker from "./Poker";

const { ccclass, property } = cc._decorator;

@ccclass
export default class HandCards extends cc.Component {

    _touchDirection: "left" | "right" | "" = "";   // 触摸方向 "left" "right" 或者 空
    _startIndex: number = -1;
    _endIndex: number = -1;
    _touchStartPos: cc.Vec2 = undefined;


    private _cards: Poker[] = undefined;
    get cards() {   // 所有牌集合
        if (!this._cards || this._cards.length == 0) {
            this._cards = [];
            for (let i = 0; i < this.node.children.length; i++) {
                let poker = this.node.children[i].getComponent(Poker);
                if (poker) {
                    this._cards.push(poker);
                }
            }
        }
        return this._cards;
    }

    getSelecteds() {
        let cardsIndexs = []
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].node.active && this.cards[i].isSelected) {
                cardsIndexs.push(i);
            }
        }
        return cardsIndexs;
    }
    setSelecteds(cards: number[]) {
        if (!Array.isArray(cards)) {
            return;
        }
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].node.active) {
                let index = cards.indexOf(this.cards[i].value);
                if (index >= 0) {
                    this.cards[i].setSelecte(true);
                }
                else {
                    this.cards[i].setSelecte(false);
                }
            }
        }
    }
    removeSelects(selectArr?: number[]) {
        selectArr = Array.isArray(selectArr) ? selectArr : this.getSelecteds();
        for (let i = 0; i < selectArr.length; i++) {
            let card = this.cards[selectArr[i]]
            card.node.active = false;
            // card.reset();
        }
    }
    gobackSelects(selectArr: number[]) {
        if (!Array.isArray(selectArr)) {
            return;
        }
        for (let i = 0; i < selectArr.length; i++) {
            this.cards[selectArr[i]].node.active = true;
            this.cards[selectArr[i]].setSelecte(false);
        }
    }

    getCurrCards() {
        let cardValues = []
        for (let i = 0; i < this.cards.length; i++) {
            if (this.cards[i].node.active) {
                cardValues.push(this.cards[i].value);
            }
        }
        return cardValues;
    }

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart.bind(this));
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove.bind(this));
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd.bind(this));
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel.bind(this));
    }

    reset() {
        this._endIndex = -1;
        this._startIndex = -1;
        this._touchDirection = "";
        this._touchStartPos = undefined;
    }

    onTouchStart(event: cc.Event.EventTouch) {
        console.log("开始")
        this.reset();
        var wp = event.getLocation();
        let box = this.node.getBoundingBoxToWorld();
        if (box.contains(wp)) {     // 开始触摸点必须落在牌区域内
            this._touchStartPos = wp;
            this._startIndex = this._indexOf(wp);       // 因为牌区域紧包所有牌，所以开始下标一定有值
            if (CC_DEBUG && this._startIndex == -1) {
                debugger;
            }
        }
        else {
            this._touchStartPos = undefined;
        }

    }
    onTouchMove(event: cc.Event.EventTouch) {
        if (!this._touchStartPos) {
            return;
        }
        var wp = event.getLocation();
        let currIndex = this._indexOf(wp);  //  触摸点的牌下标
        if (currIndex >= 0) {
            this._endIndex = currIndex;
            this.setCardTouched(currIndex, true);  // 设置该牌被触摸
            // 确定方向
            if (!this._touchDirection && this._startIndex >= 0 && this._startIndex != currIndex) {
                this._touchDirection = this._startIndex > currIndex ? "left" : "right";
            }
            // 判断是否触摸回退 
            let lastPos = event.getPreviousLocation();
            let isBack = false;
            if (this._touchDirection == "left" && (wp.x - lastPos.x > 0)) {     // 方向向左 向右回退
                isBack = true;
                this.setCardTouched(currIndex - 1, false);
            } else if (this._touchDirection == "right" && (wp.x - lastPos.x < 0)) {     // 方向向右 向左回退
                isBack = true
                this.setCardTouched(currIndex + 1, false);
            }
            if (isBack && this._startIndex == currIndex) {
                this._touchDirection = "";
                return;
            }
        }
    }
    /**
     * 查找当前触摸点所在的 有效(显示)手牌下标
     * @param touchPos 
     */
    private _indexOf(touchPos: cc.Vec2) {
        let len = this.node.children.length
        for (let i = len - 1; i >= 0; i--) {        // 只查找最右侧的第一个牌
            let cardNode = this.node.children[i]
            if (cardNode.active) {
                let box = cardNode.getBoundingBoxToWorld();
                if (box.contains(touchPos)) {
                    this.setCardTouched(i, true);
                    return i;
                }
            }
        }
        return -1;
    }
    onTouchEnd(event: cc.Event.EventTouch) {
        if (!this._touchStartPos || this._startIndex == -1) {
            return;
        }
        let startIndex = Math.min(this._startIndex, this._endIndex);
        let endIndex = Math.max(this._endIndex, this._startIndex);
        if (startIndex == -1) {     // 牌的点选
            startIndex = endIndex;
        }
        for (let i = startIndex; i <= endIndex; i++) {
            this.updateCardSelect(i);
            this.setCardTouched(i, false);
        }
        console.log("结束")
    }
    onTouchCancel(event: cc.Event.EventTouch) {
        if (!this._touchStartPos || this._startIndex == -1) {
            return;
        }
        let startIndex = Math.min(this._startIndex, this._endIndex);
        let endIndex = Math.max(this._endIndex, this._startIndex);
        if (startIndex == -1) {     // 牌的点选
            startIndex = endIndex;
        }
        for (let i = startIndex; i <= endIndex; i++) {
            this.setCardTouched(i, false);      // 取消选中
        }
        this.reset();
        console.log("取消")
    }

    updateCardSelect(index: number, isSelect?: boolean) {
        if (this.cards[index]) {
            if (isSelect == undefined) {    // 默认取反
                isSelect = !this.cards[index].isSelected;
            }
            this.cards[index].setSelecte(isSelect);
        }
    }
    setCardTouched(index: number, isTouched: boolean) {
        if (this.cards[index]) {
            this.cards[index].setTouch(isTouched);
        }
    }


}
