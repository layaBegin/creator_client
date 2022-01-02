import BaseView from "../../BaseClass/BaseView";
import { Utiles } from "../../Models/Utiles";

const { ccclass, property } = cc._decorator;

interface WheelRecordItem {
    createTime: number
    gold: number
    nickName: string
    type: WheelType
}
enum WheelType {    /* 转盘类型 */
    "白银转盘" = 1,
    "黄金转盘" = 2,
    "钻石转盘" = 3
}

@ccclass
export default class WheelRecord extends BaseView {

    @property(cc.Label)
    currIntergral: cc.Label = undefined;
    @property(cc.Label)
    todayIntergral: cc.Label = undefined;
    @property(cc.ToggleContainer)
    rewardType: cc.ToggleContainer = undefined;
    @property(cc.ScrollView)
    rewardList: cc.ScrollView = undefined;
    @property(cc.ScrollView)
    autoScrollList: cc.ScrollView = undefined;

    private _selfListData: WheelRecordItem[] = [];
    private _allListData: WheelRecordItem[] = [];
    private scrollThreshold: number = 0;        // 自动滚动阈值
    private _autoScrollList: WheelRecordItem[] = [];
    // 设置积分
    init(integral: number, todayIntegral?: number, scrollThreshold?: number) {
        this.currIntergral.string = integral.toFixed(2); // 设置当前积分
        if (typeof todayIntegral == "number") {
            this.todayIntergral.string = todayIntegral.toFixed(2);
        }
        if (typeof scrollThreshold == "number") {
            this.scrollThreshold = scrollThreshold;
        }
    }

    onClicked() {

    }
    showSelfRewardList() {
        if (Array.isArray(this._selfListData)) {
            this.setRewardList(this._selfListData);
        }
    }
    showAllRewardList() {
        if (Array.isArray(this._allListData)) {
            this.setRewardList(this._allListData);
        }
    }
    setSelfRewardList(data: WheelRecordItem[]) {
        let rewardType = this.getRewardTypeIndex();
        this._selfListData = data;  // 缓存数据
        if (rewardType == 1) {
            this.showSelfRewardList();
        }
    }
    setAllRewardList(data: WheelRecordItem[]) {
        let rewardType = this.getRewardTypeIndex();
        this._allListData = data;   // 缓存数据
        this.setAutoScrollList(data);
        if (rewardType == 0) {
            this.showAllRewardList();
        }
    }

    setItem(itemNode: cc.Node, data: WheelRecordItem) {
        let time = itemNode.getChildByName("time").getComponent(cc.Label);
        let nickName = itemNode.getChildByName("nickName").getComponent(cc.Label);
        let type = itemNode.getChildByName("type").getComponent(cc.Label);
        let gold = itemNode.getChildByName("gold").getComponent(cc.Label);
        time.string = (<any>new Date(data.createTime)).format('MM-dd hh:mm:ss');
        nickName.string = data.nickName;
        type.string = WheelType[data.type];
        gold.string = Global.Utils.formatNum2(data.gold) + "元";

        itemNode.active = true;
    }
    setRewardList(data: WheelRecordItem[]) {
        let contentNode = this.rewardList.content;
        let i
        for (i = 0; i < data.length; i++) {
            let itemNode = contentNode.children[i];

            if (i >= 10) {
                ((_i) => {
                    setTimeout(() => {
                        if (!cc.isValid(this.node)) return;

                        if (!cc.isValid(itemNode)) {
                            itemNode = cc.instantiate(contentNode.children[0]);
                            itemNode.parent = contentNode;
                        }
                        this.setItem(itemNode, data[_i]);
                    }, 100 * _i);
                })(i);
            }
            else {
                if (!cc.isValid(itemNode)) {
                    itemNode = cc.instantiate(contentNode.children[0]);
                    itemNode.parent = contentNode;
                    // cc.log("debug::创建节点");
                }
                this.setItem(itemNode, data[i]);
            }
        }
        // 隐藏剩余节点
        for (let j = i; j < contentNode.children.length; j++) {
            contentNode.children[j].active = false;
        }
    }
    /**
     * 大奖下标 0
     * 个人获奖下标 1
     */
    getRewardTypeIndex() {
        return Utiles.getToggleContainerChecked(this.rewardType);
    }
    /////////////// 自动滚动列表
    setAutoScrollList(data: WheelRecordItem[]) {
        let scrollview: any = this.autoScrollList
        scrollview.node.off(cc.Node.EventType.TOUCH_START, scrollview._onTouchBegan, scrollview, true);
        scrollview.node.off(cc.Node.EventType.TOUCH_MOVE, scrollview._onTouchMoved, scrollview, true);
        scrollview.node.off(cc.Node.EventType.TOUCH_END, scrollview._onTouchEnded, scrollview, true);
        scrollview.node.off(cc.Node.EventType.TOUCH_CANCEL, scrollview._onTouchCancelled, scrollview, true);

        this._autoScrollList = [];
        for (let i = 0; i < data.length; i++) {
            if (data[i].gold >= this.scrollThreshold) {
                this._autoScrollList.push(data[i]);
            }
        }
        if (this.autoScroll.prototype.autoHandle) {
            clearTimeout(this.autoScroll.prototype.autoHandle);
            this.autoScroll.prototype.autoHandle = undefined;
        }
        this.autoScrollList.stopAutoScroll()
        this.autoScrollList.scrollToTop(0);
        let contentNode = this.autoScrollList.content;
        let i = 0;
        for (i = 0; i < this._autoScrollList.length; i++) {
            let itemNode = contentNode.children[i];
            if (i > 10) {
                ((_i) => {
                    let d = this._autoScrollList[_i];

                    setTimeout(() => {
                        if (!cc.isValid(this.node)) return;

                        if (!cc.isValid(itemNode)) {
                            itemNode = cc.instantiate(contentNode.children[0]);
                            itemNode.parent = contentNode;
                        }
                        itemNode.active = true;
                        itemNode.children[0].getComponent(cc.Label).string = "恭喜【" + d.nickName + "】在 " + WheelType[d.type] + " 中获得";
                        itemNode.children[1].getComponent(cc.Label).string = Global.Utils.formatNum2(d.gold) + "元"
                        if (_i == this._autoScrollList.length - 1) {
                            this.autoScroll(this._autoScrollList.length);
                        }
                    }, 100 * _i);

                })(i)
            }
            else {
                let d = this._autoScrollList[i];
                if (!cc.isValid(itemNode)) {
                    itemNode = cc.instantiate(contentNode.children[0]);
                    itemNode.parent = contentNode;
                }
                itemNode.active = true;
                itemNode.children[0].getComponent(cc.Label).string = "恭喜【" + d.nickName + "】在 " + WheelType[d.type] + " 中获得";
                itemNode.children[1].getComponent(cc.Label).string = Global.Utils.formatNum2(d.gold) + "元"
                if (i == this._autoScrollList.length - 1) {
                    this.autoScroll(this._autoScrollList.length);
                }
            }
        }
        for (let j = i; j < contentNode.children.length; j++) {
            contentNode.children[j].active = false;
        }

        // this.autoScroll(this._autoScrollList.length);

    }
    autoScroll(length: number) {
        if (length > 4) {
            let st = length * 1;
            this.autoScrollList.scrollToTop(0);
            this.autoScrollList.scrollToBottom(st, false);
            this.autoScroll.prototype.autoHandle = setTimeout(() => {
                if (!cc.isValid(this)) {
                    return
                }
                this.autoScroll(length);
            }, st * 1000 + 1000);   // 停顿 1秒 再继续滚动

            let scrollview: any = this.autoScrollList
            scrollview.node.off(cc.Node.EventType.TOUCH_START, scrollview._onTouchBegan, scrollview, true);
            scrollview.node.off(cc.Node.EventType.TOUCH_MOVE, scrollview._onTouchMoved, scrollview, true);
            scrollview.node.off(cc.Node.EventType.TOUCH_END, scrollview._onTouchEnded, scrollview, true);
            scrollview.node.off(cc.Node.EventType.TOUCH_CANCEL, scrollview._onTouchCancelled, scrollview, true);
        }
    }


    onDisable() {
        clearTimeout(this.autoScroll.prototype.autoHandle);
        this.autoScroll.prototype.autoHandle = undefined;
    }
}
