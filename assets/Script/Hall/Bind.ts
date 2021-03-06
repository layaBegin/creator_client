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
            this.tip.string = '???????????????????????????????????????????????????????????????????????????????????????~';
        } else if (this.showType === 'zfb') {
            this.bankNode.active = false;
            Global.CCHelper.updateSpriteFrame('Bank/labelImg_bindZFB', this.titleImg, function () {
                this.zfbNode.active = true;
            }.bind(this));
            this.tip.string = '????????????????????????????????????????????????????????????????????????????????????~';
        }
    }

    //???????????????????????????
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
                        Confirm.show('?????????????????????');
                        return;
                    }
                    if (ownerName === '') {
                        Confirm.show('??????????????????');
                        return;
                    }
                    if (cardNumber === '') {
                        Confirm.show('??????????????????');
                        return;
                    }
                    if (code === '') {
                        Confirm.show('??????????????????');
                        return;
                    }
                    if (province === '') {
                        Confirm.show('??????????????????');
                        return;
                    }
                    if (city === '') {
                        Confirm.show('?????????????????????');
                        return;
                    }
                    Global.API.hall.updateBankCardInfoRequest(ownerName, cardNumber, this.bankCode, province, city, bankInfo, function () {
                        Confirm.show('???????????????', () => {
                            this.close()
                        });
                    }.bind(this));
                } else if (this.showType === 'zfb') {
                    let account = this.zfbaccountEdit.string;
                    let name = this.zfbnameEdit.string;
                    if (account === '') {
                        Confirm.show('??????????????????');
                        return;
                    }
                    if (name === '') {
                        Confirm.show('??????????????????');
                        return;
                    }
                    if (name.indexOf(' ') !== -1) {
                        Confirm.show('?????????????????????');
                        return;
                    }
                    Global.API.hall.updateAliPayInfoRequest(account, name, () => {
                        Confirm.show('???????????????', () => {
                            this.close()
                        });
                    });
                }
                break;
        }
    }
}
