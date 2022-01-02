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
export default class BankRecharge extends BaseView {

    @property(cc.Node)
    list: cc.Node = null;
    @property(cc.Node)
    info: cc.Node = null;
    @property(cc.Node)
    listContent: cc.Node = null;

    @property(cc.Node)
    error: cc.Node = undefined

    @property(cc.ScrollView)
    bankScrollView: cc.ScrollView = undefined
    @property(cc.Label)
    infoBankName: cc.Label = undefined
    @property(cc.Label)
    infoCardUserName: cc.Label = undefined
    @property(cc.Label)
    infoBankCardNum: cc.Label = undefined
    @property(cc.Label)
    infoBankAdds: cc.Label = undefined

    @property(cc.EditBox)
    userMoney: cc.EditBox = undefined

    @property(cc.EditBox)
    userInfo: cc.EditBox = undefined

    bankRechargeList = undefined
    minRecharge = undefined
    maxRecharge = undefined
    bankUuid = undefined



    init() {
        Global.API.hall.getBankRechargeConfigs(1, (msg) => {
            if (msg.msg.length == 0) {
                this.list.active = false
                this.info.active = false
                this.error.active = true
            } else {
                msg.msg.sort(function (a, b) {
                    return b.sort - a.sort
                });
                this.bankRechargeList = msg.msg
                this.initBank()
                this.list.active = true
                this.info.active = false
                this.error.active = false
            }

        }, (msg) => {
            this.list.active = false
            this.info.active = false
            this.error.active = true
        })
    }

    //生成银行列表
    initBank() {
        this.bankScrollView.scrollToTop(0)
        this.list.active = true
        this.info.active = false
        for (let i = 0; i < this.listContent.children.length; i++) {
            this.listContent.children[i].active = false
        }
        for (let i = 0; i < this.bankRechargeList.length; i++) {
            let item = this.listContent.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.listContent.children[0]);
            }
            item.active = true
            let icon = undefined
            if (this.bankRechargeList[i].bankName.indexOf("工商") != -1) {
                icon = "gongshang"
            } else if (this.bankRechargeList[i].bankName.indexOf("光大") != -1) {
                icon = "guangda"
            } else if (this.bankRechargeList[i].bankName.indexOf("建设") != -1) {
                icon = "jianshe"
            } else if (this.bankRechargeList[i].bankName.indexOf("交通") != -1) {
                icon = "jiaotong"
            } else if (this.bankRechargeList[i].bankName.indexOf("民生") != -1) {
                icon = "minsheng"
            } else if (this.bankRechargeList[i].bankName.indexOf("农业") != -1) {
                icon = "nongye"
            } else if (this.bankRechargeList[i].bankName.indexOf("浦发") != -1) {
                icon = "pufa"
            } else if (this.bankRechargeList[i].bankName.indexOf("兴业") != -1) {
                icon = "xingye"
            } else if (this.bankRechargeList[i].bankName.indexOf("邮政") != -1) {
                icon = "youzheng"
            } else if (this.bankRechargeList[i].bankName.indexOf("招商") != -1) {
                icon = "zhaoshang"
            } else if (this.bankRechargeList[i].bankName.indexOf("中国银行") != -1) {
                icon = "zhongguo"
            } else if (this.bankRechargeList[i].bankName.indexOf("中兴") != -1) {
                icon = "zhongxin"
            }
            Global.CCHelper.updateSpriteFrame('BankIcon/' + icon, item.getChildByName('icon').getComponent(cc.Sprite))
            item.getChildByName('name').getComponent(cc.Label).string = this.bankRechargeList[i].bankName;
            item.getChildByName('number').getComponent(cc.Label).string = this.bankRechargeList[i].bankCardNum;
            item.getChildByName('exp').getComponent(cc.Label).string = "提示：" + this.bankRechargeList[i].clientExplain;
            item.getChildByName('btn').getComponent(cc.Button).clickEvents[0].customEventData = this.bankRechargeList[i]
            item.parent = this.listContent;
        }
    }



    //银行充值详情
    initBankInfo(event, param) {
        Global.CCHelper.playPreSound();
        this.list.active = false
        this.info.active = true
        this.userInfo.string = ""
        this.userMoney.string = ""
        this.infoBankName.string = param.bankName
        this.infoCardUserName.string = param.cardUserName
        this.infoBankCardNum.string = param.bankCardNum
        this.infoBankAdds.string = param.bankAdds
        this.userMoney.placeholder = param.minRecharge + "-" + param.maxRecharge
        this.minRecharge = param.minRecharge
        this.maxRecharge = param.maxRecharge
        this.bankUuid = param.uuid
    }

    submit() {
        Global.CCHelper.playPreSound();
        if (!this.inputOK()) return;
        let data = {
            uuid: this.bankUuid,
            rechargeInfo: this.userInfo.string,
            gold: this.userMoney.string,
            type: Global.Enum.rechargeType.BANK_RECHARGE
        }
        Waiting.show()
        Global.API.hall.userBankRecharge(data, (msg) => {
            Waiting.hide()
            Confirm.show('充值已提交，等待审核！')
            this.userInfo.string = ""
            this.userMoney.string = ""
        })

    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'back':
                this.list.active = true
                this.info.active = false
                break;
            case 'copy':
                Global.SDK.copyText(event.currentTarget.parent.getChildByName('text').getComponent(cc.Label).string)
                break;
        }
    }

    /**
 * 输入检查
 */
    inputOK() {
        let money = this.userMoney.string;
        let info = this.userInfo.string;
        if (!money) {
            Tip.makeText("请输入存款金额!");
            return false;
        }
        if (money < this.minRecharge) {
            Tip.makeText("存款金额过低!");
            return false;
        }
        if (money > this.maxRecharge) {
            Tip.makeText("存款金额超出限额!");
            return false;
        }
        if (!info) {
            Tip.makeText("请输入存款信息!");
            return false;
        }
        return true;

    }
}
