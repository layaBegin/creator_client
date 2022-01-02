import BaseView from "../BaseClass/BaseView";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class ExchangeRecord extends BaseView {

    @property(cc.Node)
    recordContent: cc.Node = undefined

    startIndex = 0;
    perCount = 10;
    maxCount = false;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    init() {
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = false;
        this.updateList();
    }

    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                if (this.maxCount) {
                    cc.log('已加载所有数据');
                    return;
                }
                cc.log('请求新数据');
                this.updateList();
                break;
        }
    }

    updateList() {
        for (let index = 0; index < this.recordContent.children.length; index++) {
            this.recordContent.children[index].active = false
        }
        Waiting.show();
        Global.API.hall.getRecordDataRequest(Global.Enum.recordType.WITHDRAWALS, this.startIndex, this.perCount, function (msg) {
            let totalCount = msg.msg.totalCount;
            let data = msg.msg.recordArr;
            for (let i = 0; i < data.length; i++) {
                let node = this.recordContent.children[i]
                if (!cc.isValid(node)) {
                    node = cc.instantiate(this.recordContent.children[0]);
                    node.parent = this.recordContent;
                }
                node.active = true
                this.updateUI(node, data[i]);
            }

            this.startIndex += this.perCount;
            if (this.startIndex > totalCount) {
                this.maxCount = true;
            }

            Waiting.hide();
        }.bind(this));
    }

    updateUI(node: cc.Node, data) {
        node.getChildByName('num').getComponent(cc.Label).string = data.uuid || '';
        node.getChildByName('goldNum').getComponent(cc.Label).string = data.gold.toFixed(2) || 0.00;
        node.getChildByName('time').getComponent(cc.Label).string = (new Date(data.createTime)).format('MM-dd hh:mm:ss');
        // 1 和 5 处理中 2 已出款 3已退回 4 已拒绝
        let status = '';
        if (data.status == 1 || data.status == 5) {
            status = "处理中"
        } else if (data.status == 2) {
            status = "已出款"
        } else if (data.status == 3) {
            status = "已退回"
        } else if (data.status == 4) {
            status = "已拒绝"
        }
        node.getChildByName('statusDoing').getComponent(cc.Label).string = status;
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close();
                break;
        }
    }
}
