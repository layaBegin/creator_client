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
export default class Bind extends BaseView {

    @property(cc.Sprite)
    titleImg: cc.Sprite = undefined
    @property(cc.Label)
    tip: cc.Label = undefined
    @property(cc.EditBox)
    zfbaccountEdit: cc.EditBox = undefined
    @property(cc.Label)
    zfbnameEdit: cc.Label = undefined
    @property(cc.Node)
    zfbNode: cc.Node = undefined
    @property(cc.Node)
    bankNode: cc.Node = undefined
    @property(cc.Label)
    ownerName: cc.Label = undefined
    @property(cc.EditBox)
    cardNumber: cc.EditBox = undefined
    @property(cc.EditBox)
    code: cc.EditBox = undefined
    @property(cc.EditBox)
    province: cc.EditBox = undefined
    @property(cc.EditBox)
    city: cc.EditBox = undefined
    @property(cc.EditBox)
    bankInfo: cc.EditBox = undefined

    showType = null
    dialogParameters = null
    bankCode = null

    init(showType) {
        this.showType = showType
        this.zfbaccountEdit.string = '';
        this.zfbnameEdit.string = Global.Player.getPy('realName') || '';
        this.ownerName.string = Global.Player.getPy('realName') || '';
        this.cardNumber.string = '';
        this.code.string = '';
        this.province.string = '';
        this.city.string = '';
        this.bankInfo.string = '';
        if (this.showType === 'bankCard') {
            this.zfbNode.active = false;
            Global.CCHelper.updateSpriteFrame('Bank/labelImg_bindBankCard', this.titleImg, function () {
                this.bankNode.active = true;
            }.bind(this))
            this.tip.string = '请输入正确的银行卡账号以及真实名姓名，否则会导致兑换失败哦~';
        } else if (this.showType === 'zfb') {
            this.bankNode.active = false;
            Global.CCHelper.updateSpriteFrame('Bank/labelImg_bindZFB', this.titleImg, function () {
                this.zfbNode.active = true;
            }.bind(this));
            this.tip.string = '请输入正确的支付宝账号以及真实姓名，否则会导致兑换失败哦~';
        }
    }

    //设置选中银行的数据
    setBankData(data) {
        this.code.string = data.bankName
        this.bankCode = data.bankCode
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'selectBank':
                ViewMgr.open('Bind/SelectBank', { key: 'init', data: this.bankCode })
                break;
            case 'bind':
                cc.log(this.showType);
                if (this.showType === 'bankCard') {
                    let ownerName = this.ownerName.string;
                    let cardNumber = this.cardNumber.string;
                    let code = this.code.string;
                    let province = this.province.string;
                    let city = this.city.string;
                    let bankInfo = this.bankInfo.string;
                    if (ownerName.indexOf(' ') !== -1) {
                        Confirm.show('姓名格式错误！');
                        return;
                    }
                    if (ownerName === '') {
                        Confirm.show('请输入姓名！');
                        return;
                    }
                    if (cardNumber === '') {
                        Confirm.show('请输入账号！');
                        return;
                    }
                    if (code === '') {
                        Confirm.show('请选择银行！');
                        return;
                    }
                    if (province === '') {
                        Confirm.show('请输入省份！');
                        return;
                    }
                    if (city === '') {
                        Confirm.show('请输入归属市！');
                        return;
                    }
                    Global.API.hall.updateBankCardInfoRequest(ownerName, cardNumber, this.bankCode, province, city, bankInfo, function () {
                        Confirm.show('绑定成功！', () => {
                            this.close()
                        });
                    }.bind(this));
                } else if (this.showType === 'zfb') {
                    let account = this.zfbaccountEdit.string;
                    let name = this.zfbnameEdit.string;
                    if (account === '') {
                        Confirm.show('请输入账号！');
                        return;
                    }
                    if (name === '') {
                        Confirm.show('请输入姓名！');
                        return;
                    }
                    if (name.indexOf(' ') !== -1) {
                        Confirm.show('姓名格式错误！');
                        return;
                    }
                    Global.API.hall.updateAliPayInfoRequest(account, name, () => {
                        Confirm.show('绑定成功！', () => {
                            this.close()
                        });
                    });
                }
                break;
        }
    }
}
