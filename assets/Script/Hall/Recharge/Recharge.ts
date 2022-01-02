import BaseView from "../../BaseClass/BaseView";

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
export default class Recharge extends BaseView {

    @property(cc.Node)
    toggle: cc.Node = undefined

    @property(cc.Node)
    rightBox: cc.Node = undefined

    @property(cc.Node)
    recordContent: cc.Node = undefined

    @property(cc.Node)
    recordTip: cc.Node = undefined

    rechargeData = undefined

    async init(data) {
        if (AudioConfig._Recharge) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/recharge");
            AudioConfig._Recharge = false
        }
        data.sort((a, b) => {
            return b.sort - a.sort
        })

        this.rechargeData = data
        for (let i = 0; i < this.toggle.children.length; i++) {
            this.toggle.children[i].active = false;
        }

        for (let i = 0; i < data.length; i++) {
            let item: cc.Node = this.toggle.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.toggle.children[0]);
            }
            item.active = true
            item.getChildByName("Background").getChildByName("title").getComponent(cc.Label).string = data[i].disName
            item.getChildByName("checkmark").getChildByName("title").getComponent(cc.Label).string = data[i].disName
            item.setSiblingIndex(i)
            this.setParam(data[i].id, item)
            item.parent = this.toggle;
            this.toggle.getComponent(cc.Layout).updateLayout()
        }
        let toggle = this.toggle.children[0].getComponent(cc.Toggle);
        /**
         * toggle.isChecked 如果当前以及check 则不会触发回调 需要手动调用
         */
        if (toggle.isChecked) {
            this.changeUI(toggle, toggle.checkEvents[0].customEventData);
        } else {
            toggle.isChecked = true
        }
    }

    setParam(id, node) {
        switch (id) {
            case 91:
                node.getComponent(cc.Toggle).checkEvents[0].customEventData = "AgentRecharge"
                break;
            case 92:
                node.getComponent(cc.Toggle).checkEvents[0].customEventData = "BankRecharge"
                break;
            case 93:
            case 94:
                node.getComponent(cc.Toggle).checkEvents[0].customEventData = "WechatOrAliPayToBank"
                break;
            default:
                node.getComponent(cc.Toggle).checkEvents[0].customEventData = "AliPayRecharge"
                break;

        }

    }


    changeUI(event: cc.Toggle, param) {
        let index = event.node.getSiblingIndex()
        Global.CCHelper.playPreSound();
        for (let i = 0; i < this.rightBox.children.length; i++) {
            this.rightBox.children[i].active = false
        }
        this.rightBox.getChildByName(param).active = true
        let js: any = this.rightBox.getChildByName(param).getComponent(param)
        js.init(this.rechargeData[index])
    }

    updateList() {
        for (let index = 0; index < this.recordContent.children.length; index++) {
            this.recordContent.children[index].active = false
        }
        Waiting.show();
        Global.API.hall.getRechargeRecord((msg) => {
            Waiting.hide();
            let data = msg.msg;
            if (data && data.length != 0) {
                this.recordTip.active = false
            }
            for (let i = 0; i < data.length; i++) {
                let node = this.recordContent.children[i]
                if (!cc.isValid(node)) {
                    node = cc.instantiate(this.recordContent.children[0]);
                    node.parent = this.recordContent;
                }
                node.active = true
                this.updateUI(node, data[i]);
            }
        });
    }

    updateUI(node: cc.Node, data) {
        node.getChildByName('num').getComponent(cc.Label).string = data.uuid || '';
        node.getChildByName('goldNum').getComponent(cc.Label).string = data.rechargeGold.toFixed(2) || 0.00;
        node.getChildByName('time').getComponent(cc.Label).string = (new Date(data.createTime * 1000)).format('yyyy-MM-dd hh:mm:ss');
        // 0充值中 3充值成功 4充值失败 30 申请中 31充值成功 32充值失败 其他的一律显示充值中
        let status = '';
        if (data.status == 3) {
            status = "充值成功"
        } else if (data.status == 4 || data.status == 33) {
            status = "充值失败"
        } else if (data.status == 30) {
            status = "申请中"
        } else if (data.status == 31) {
            status = "充值成功"
        } else if (data.status == 32) {
            status = "充值失败"
        } else {
            status = "充值中"
        }
        node.getChildByName('statusDoing').getComponent(cc.Label).string = status;
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'openRecord':
                ViewMgr.open("Recharge/rechargeRecord", null, (msg) => {
                    this.updateList()
                })
                break;
            case 'closeRecord':
                ViewMgr.close("Recharge/rechargeRecord")
                break;
        }
    }
}
