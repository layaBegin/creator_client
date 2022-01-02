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
export default class AliPayRecharge extends BaseView {

    @property(cc.Node)
    cotent: cc.Node = undefined;

    @property(cc.Node)
    error: cc.Node = undefined;

    @property(cc.EditBox)
    money: cc.EditBox = undefined;

    @property(cc.Node)
    btnMask: cc.Node = undefined;

    @property(cc.Label)
    tip: cc.Label = undefined;

    @property(cc.Label)
    rechargeTip: cc.Label = undefined;

    @property(cc.Node)
    moneyBtnList: cc.Node = undefined;

    rechargeConfig = undefined


    init(data) {
        this.money.string = ''
        if (data.isFixedAmount) {
            this.btnMask.active = true
            this.money.placeholder = "请选择下方金额"
        } else {
            this.btnMask.active = false
            this.money.placeholder = "请输入充值金额"
        }

        Global.API.hall.getOnlineRechargeConfig(data.id, (msg) => {
            this.cotent.active = true
            this.error.active = false
            this.tip.string = "提示：" + msg.msg.explain
            this.updateBtnUI(msg.msg)
            this.rechargeConfig = msg.msg
        }, (msg) => {
            this.cotent.active = false
            this.error.active = true
        })
    }


    updateBtnUI(data) {
        for (let i = 0; i < this.moneyBtnList.children.length; i++) {
            this.moneyBtnList.children[i].active = false
        }
        this.rechargeTip.string = data.minRecharge + "~" + data.maxRecharge + "元"
        let btnList = data.fastArrs.split(',');
        btnList.sort(function (a, b) {
            return a - b
        })
        btnList = btnList.slice(0, 8)
        for (let i = 0; i < btnList.length; i++) {
            let node: cc.Node = this.moneyBtnList.children[i]
            node.active = true
            node.getChildByName('bg').getChildByName('num').getComponent(cc.Label).string = btnList[i]
        }
    }

    submit() {
        let rechargeGold = this.money.string
        if (rechargeGold > this.rechargeConfig.maxRecharge || rechargeGold < this.rechargeConfig.minRecharge) {
            Tip.makeText('请输入正确的充值金额！')
            return
        }
        Global.API.hall.getOnlineRechargeUrl(this.rechargeConfig.rechargeID, rechargeGold, (msg) => {
            cc.sys.openURL(msg.msg);
        })
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'clear':
                this.money.string = ''
                break;
            case 'select':
                this.money.string = event.currentTarget.getChildByName('bg').getChildByName('num').getComponent(cc.Label).string
                break;
            case 'submit':
                this.submit()
                break;
        }
    }
}
