import BaseView from "../../BaseClass/BaseView";
import Recharge from "./Recharge";
import { operationEmail } from "../../API/HallAPI";

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
export default class WechatOrAliPayToBank extends BaseView {

    @property(cc.Node)
    error: cc.Node = undefined;
    @property(cc.Node)
    list: cc.Node = undefined;
    @property(cc.Node)
    info: cc.Node = undefined;
    @property(cc.Node)
    topBtnList: cc.Node = undefined;
    @property(cc.Node)
    moneyBtnList: cc.Node = undefined;

    @property(cc.EditBox)
    rechargeMoney: cc.EditBox = undefined

    @property(cc.Label)
    infoBankName: cc.Label = undefined
    @property(cc.Label)
    infoBankCardNum: cc.Label = undefined
    @property(cc.Label)
    rechargeMoneyInfo: cc.Label = undefined
    @property(cc.EditBox)
    rechargeInfo: cc.EditBox = undefined
    @property(cc.Node)
    operationTip: cc.Node = undefined;

    @property(cc.ScrollView)
    topScrollView: cc.ScrollView = undefined;

    rechargeID = undefined
    rechargeList = undefined
    minRecharge = undefined
    maxRecharge = undefined
    bankUuid = undefined
    selectParam = undefined

    // 93 支付宝转银行卡
    // 94 微信转银行卡

    init(data) {
        this.rechargeID = data.id
        Global.API.hall.getBankRechargeConfigs(2, (msg) => {
            if (msg.msg.length == 0) {
                this.list.active = false
                this.info.active = false
                this.error.active = true
            } else {
                msg.msg.sort(function (a, b) {
                    return b.sort - a.sort
                });
                this.rechargeList = msg.msg
                this.initTopBtn()
                this.list.active = true
                this.info.active = false
                this.error.active = false
                let toggle = this.topBtnList.children[0].getComponent(cc.Toggle);
                if (toggle.isChecked) {
                    this.changeUI(toggle, toggle.checkEvents[0].customEventData);
                } else {
                    toggle.isChecked = true
                }
                this.topScrollView.scrollToLeft(0)
            }

        }, (msg) => {
            this.list.active = false
            this.info.active = false
            this.error.active = true
        })
    }

    //初始化顶部充值方式按钮
    initTopBtn() {
        for (let i = 0; i < this.topBtnList.children.length; i++) {
            this.topBtnList.children[i].active = false
        }
        if (this.rechargeList.length == 0) {
            return
        }
        for (let i = 0; i < this.rechargeList.length; i++) {
            let node: cc.Node = this.topBtnList.children[i]
            if (!cc.isValid(node)) {
                node = cc.instantiate(this.rechargeList.children[0]);
            }
            if (this.rechargeID == 93) {
                node.getChildByName('Background').getChildByName('title').getComponent(cc.Label).string = "支付宝"
                node.getChildByName('checkmark').getChildByName('title').getComponent(cc.Label).string = "支付宝"
            } else if (this.rechargeID == 94) {
                node.getChildByName('Background').getChildByName('title').getComponent(cc.Label).string = "微信"
                node.getChildByName('checkmark').getChildByName('title').getComponent(cc.Label).string = "微信"
            }
            node.getChildByName('Background').getChildByName('exp').getComponent(cc.Label).string = this.rechargeList[i].clientExplain
            node.getChildByName('checkmark').getChildByName('exp').getComponent(cc.Label).string = this.rechargeList[i].clientExplain
            node.getComponent(cc.Toggle).checkEvents[0].customEventData = this.rechargeList[i]
            node.active = true
        }

        this.rechargeMoney.string = ''
    }

    //初始化按钮金额
    initBtnList(data) {
        this.selectParam = data
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

        this.minRecharge = this.selectParam.minRecharge
        this.maxRecharge = this.selectParam.maxRecharge
    }

    changeUI(event, param) {
        Global.CCHelper.playPreSound();
        this.initBtnList(param)
    }
    //初始化转账详情
    recharge() {
        if (!this.inputOK()) {
            return
        }
        this.list.active = false
        this.info.active = true
        this.rechargeInfo.string = ""
        this.rechargeMoneyInfo.string = this.rechargeMoney.string
        this.infoBankName.string = this.selectParam.bankName
        this.infoBankCardNum.string = this.selectParam.bankCardNum
        this.bankUuid = this.selectParam.uuid
        if (this.rechargeID == 93) {
            this.rechargeInfo.placeholder = "请输入存款信息"
            this.operationTip.getChildByName('alipay').active = true
            this.operationTip.getChildByName('wechat').active = false
        } else if (this.rechargeID == 94) {
            this.rechargeInfo.placeholder = "请输入存款信息"
            this.operationTip.getChildByName('wechat').active = true
            this.operationTip.getChildByName('alipay').active = false
        }
    }


    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'changeBtn':
                this.initTopBtn()
                break;
            case 'clear':
                this.rechargeMoney.string = ''
                break;
            case 'back':
                this.list.active = true
                this.info.active = false
                break;
            case 'selectMoney':
                this.rechargeMoney.string = event.currentTarget.getChildByName('bg').getChildByName('num').getComponent(cc.Label).string
                break;
        }
    }

    submit() {
        Global.CCHelper.playPreSound();
        if (this.rechargeInfo.string == '') {
            Tip.makeText('请填写存款信息！')
            return
        }
        let type = undefined
        if (this.rechargeID == 93) {
            type = Global.Enum.rechargeType.ALIPAY_TO_BANK_RECHARGE
        } else if (this.rechargeID == 94) {
            type = Global.Enum.rechargeType.WECHAT_TO_BANK_RECHARGE
        }
        let data = {
            uuid: this.bankUuid,
            rechargeInfo: this.rechargeInfo.string,
            gold: this.rechargeMoney.string,
            type: type
        }
        Waiting.show()
        Global.API.hall.userBankRecharge(data, (msg) => {
            Waiting.hide()
            // Tip.makeText('充值已提交，等待审核！')
            Confirm.show('充值已提交，等待审核！')
            this.rechargeInfo.string = ""
        })

    }

    /**
    * 输入检查
    */
    inputOK() {
        let money = (Number(this.rechargeMoney.string)).toFixed(2);
        let isNum = /^\d+\.\d+$/.test(money)
        if (Number(isNum) == 0) {
            Tip.makeText('请输入正确的金额！');
            this.rechargeMoney.string = '';
            return false;
        }
        if (!isNum) {
            Tip.makeText('请输入正确的金额！');
            this.rechargeMoney.string = ''
            return false;
        }
        if (money < this.minRecharge) {
            Tip.makeText("充值金额过低!");
            return false;
        }
        if (money > this.maxRecharge) {
            Tip.makeText("充值金额超出限额!");
            return false;
        }
        return true;

    }
}
