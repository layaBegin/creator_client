import BaseView from "../BaseClass/BaseView";
import HallApi = require('../API/HallAPI');

const { ccclass, property } = cc._decorator;
let Global = (<any>window).Global
@ccclass
export default class RewardWhellRecord extends BaseView {

    @property(cc.Node)
    content: cc.Node = undefined
    @property(cc.Node)
    selfContent: cc.Node = undefined
    @property(cc.ScrollView)
    rewardContent: cc.ScrollView = undefined

    @property(cc.Label)
    Label_hint_page2: cc.Label = undefined

    @property(cc.Label)
    Label_curScore: cc.Label = undefined
    @property(cc.Label)
    Label_curValidScore: cc.Label = undefined

    @property(cc.Node)
    TopBtn: cc.Node = undefined

    scrollGold = ''
    recordData = null
    configData = null

    init(data) {
        if (!data || data.length == 0) {
            return
        }
        this.configData = data
        this.TopBtn.children[0].getComponent(cc.Toggle).check()
        this.scrollGold = data.scrollGold;
        this.Label_curScore.string = data.integral.toFixed(2)
        this.Label_curValidScore.string = data.todayIntegral.toFixed(2);

        HallApi.getTurntableGrandPrizeRecordRequest((data) => {
            this.updateList(data.msg);
            this.recordData = data.msg
            this.updateRecordInfoList()
        });

        HallApi.getTurntableSelfRecordRequest((data) => {
            if (data == null || data.msg.length == 0) {
                this.Label_hint_page2.node.active = true;
            } else {
                this.Label_hint_page2.node.active = false
            }
            this.updateSelfList(data.msg);
        })
    }


    updateList(data) {
        for (let i = 0; i < data.length; i++) {
            let item: cc.Node = this.content.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.content.children[0]);
            }
            item.active = true
            item.children[0].getComponent(cc.Label).string = (new Date(data[i].createTime)).format('MM-dd hh:mm:ss')
            item.children[1].getComponent(cc.Label).string = data[i].nickName
            item.children[2].getComponent(cc.Label).string = this.getShowType(data[i].type)
            item.children[3].getComponent(cc.Label).string = Global.Utils.formatNum2(data[i].gold) + ""
            item.parent = this.content
        }
    }

    updateSelfList(data) {
        for (let i = 0; i < data.length; i++) {
            let item: cc.Node = this.selfContent.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.selfContent.children[0]);
            }
            item.active = true
            item.children[0].getComponent(cc.Label).string = (new Date(data[i].createTime)).format('MM-dd hh:mm:ss')
            item.children[1].getComponent(cc.Label).string = this.getShowType(data[i].type)
            item.children[2].getComponent(cc.Label).string = Global.Utils.formatNum2(data[i].gold) + ""
            item.parent = this.selfContent
        }
    }
    updateRecordInfoList() {
        let scrolldata = []
        for (let i = 0; i < this.recordData.length; i++) {
            if (this.recordData[i].gold > this.configData.scrollGold) {
                scrolldata.push(this.recordData[i])
            }
        }
        if (this.autoScroll.prototype.autoHandle) {
            clearTimeout(this.autoScroll.prototype.autoHandle);
            this.autoScroll.prototype.autoHandle = undefined;
        }
        this.rewardContent.stopAutoScroll()
        this.rewardContent.scrollToTop(0);
        let contentNode = this.rewardContent.content;
        for (let i = 0; i < scrolldata.length; i++) {
            // let d = scrolldata[i];
            let item: cc.Node = contentNode.children[i];
            if (!cc.isValid(item)) {
                item = cc.instantiate(contentNode.children[0]);
            }
            item.children[0].getComponent(cc.Label).string = "恭喜【" + scrolldata[i].nickName + "】在" + this.getShowType(scrolldata[i].type) + "中获得";
            item.children[1].getComponent(cc.Label).string = Global.Utils.formatNum2(scrolldata[i].gold) + "元";
            item.parent = contentNode;
            item.active = true;
        }

        this.autoScroll(scrolldata.length);
    }
    onDisable() {
        clearTimeout(this.autoScroll.prototype.autoHandle)
    }
    autoScroll(length: number) {
        if (length > 4) {
            let st = length * 1;
            this.rewardContent.scrollToTop(0);
            this.rewardContent.scrollToBottom(st, false);
            this.autoScroll.prototype.autoHandle = setTimeout(() => {
                if (!cc.isValid(this)) {
                    return
                }
                this.autoScroll(length);
            }, st * 1000 + 1000);   // 停顿 1秒 再继续滚动

            let scrollview: any = this.rewardContent
            this.rewardContent.node.off(cc.Node.EventType.TOUCH_START, scrollview._onTouchBegan, scrollview, true);
            this.rewardContent.node.off(cc.Node.EventType.TOUCH_MOVE, scrollview._onTouchMoved, scrollview, true);
            this.rewardContent.node.off(cc.Node.EventType.TOUCH_END, scrollview._onTouchEnded, scrollview, true);
            this.rewardContent.node.off(cc.Node.EventType.TOUCH_CANCEL, scrollview._onTouchCancelled, scrollview, true);

        }
    }


    getShowType(type) {
        if (type == 1) {
            return "白银轮盘";
        }
        else if (type == 2) {
            return "黄金轮盘";
        }
        else if (type == 3) {
            return "钻石轮盘"
        }
    }
}
