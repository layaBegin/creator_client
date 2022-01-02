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
export default class Exchange extends BaseView {

    @property(cc.Label)
    goldText: cc.Label = undefined
    @property(cc.Label)
    outTip: cc.Label = undefined
    @property(cc.EditBox)
    outNumEdit: cc.EditBox = undefined
    @property(cc.ProgressBar)
    outProgress: cc.ProgressBar = undefined
    @property(cc.Slider)
    outSlider: cc.Slider = undefined
    @property(cc.Node)
    zbfGroup: cc.Node = undefined
    @property(cc.Label)
    zbfAccountText: cc.Label = undefined
    @property(cc.Node)
    wxGroup: cc.Node = undefined
    @property(cc.Label)
    wxAccountText: cc.Label = undefined
    @property(cc.Node)
    bankCardGroup: cc.Node = undefined
    @property(cc.Label)
    bankCardText: cc.Label = undefined

    @property(cc.Node)
    LeftToggle: cc.Node = undefined
    @property(cc.Node)
    RightBox: cc.Node = undefined

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}
    bank = undefined
    aliPay = undefined

    showBindGroup(group) {
        this.zbfGroup.active = group === 'ali';
        this.bankCardGroup.active = group === 'bankCard';
    }

    updatePlayerInfoUI() {
        this.goldText.string = Global.Player.getPy('gold');

        let aliInfo = Global.Player.getPy('aliPayInfo');
        if (!!aliInfo && !!aliInfo.aliPayAccount && aliInfo.aliPayAccount !== '') {
            this.zbfAccountText.string = aliInfo.aliPayAccount;
        }

        let bankInfo = Global.Player.getPy('bankCardInfo');
        if (!!bankInfo && !!bankInfo.cardNumber && bankInfo.cardNumber !== '') {
            this.bankCardText.string = bankInfo.cardNumber;
        }
    }

    updateEditText() {
        let outProgress = this.outSlider.progress;
        this.outNumEdit.string = Math.floor(outProgress * Global.Player.getPy('gold')) + "";
    }

    updateProgress() {
        let outNum = this.outNumEdit.string;
        if (outNum === '') {
            this.outSlider.progress = 0;
            this.outProgress.progress = 0;
            return;
        }

        this.outSlider.progress = parseInt(outNum) / parseInt(Global.Player.getPy('gold'));
        this.outProgress.progress = parseInt(outNum) / parseInt(Global.Player.getPy('gold'));
    }
    async init() {
        if (AudioConfig._Exchange) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/exchange");
            AudioConfig._Exchange = false
        }

        Global.API.hall.getWithdrawCashConfig((msg) => {
            this.bank = msg.msg.bank
            this.aliPay = msg.msg.aliPay

            if (!this.aliPay && !this.bank) {
                Confirm.show("暂不支持兑换，详情咨询客服", () => {
                    this.close()
                })
                this.RightBox.active = false
                this.LeftToggle.children[0].active = false
                this.LeftToggle.children[1].active = false
                return
            } else {
                this.updateUI()
                this.outNumEdit.string = '';
                this.outSlider.progress = 0;
                this.outProgress.progress = 0;
                this.updatePlayerInfoUI();
                Global.MessageCallback.addListener('UpdateUserInfoUI', this);
            }
        })
    }
    updateUI() {
        if (this.bank) {
            this.LeftToggle.children[1].active = true
            this.onBtnClk(this.LeftToggle.children[1], this.LeftToggle.children[1].getComponent(cc.Toggle).checkEvents[0].customEventData)
        } else {
            this.LeftToggle.children[1].active = false
        }

        if (this.aliPay) {
            this.LeftToggle.children[0].active = true
            this.onBtnClk(this.LeftToggle.children[0], this.LeftToggle.children[0].getComponent(cc.Toggle).checkEvents[0].customEventData)
        } else {
            this.LeftToggle.children[0].active = false
        }

        if (this.aliPay && this.bank) {
            this.LeftToggle.children[0].getComponent(cc.Toggle).check()
            return
        } else if (this.aliPay) {
            this.LeftToggle.children[0].getComponent(cc.Toggle).check()
            return
        } else if (this.bank) {
            this.LeftToggle.children[1].getComponent(cc.Toggle).check()
            return
        }
    }

    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }

    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updatePlayerInfoUI();
                break;
        }
    }

    editEnd(event) {
        let outNum = this.outNumEdit.string;
        if (outNum === '') {
        } else {
            if (parseInt(outNum) > Global.Player.getPy('gold')) {
                this.outNumEdit.string = Global.Player.getPy('gold');
            }
        }
        this.updateProgress();
    }

    slider(event, param) {
        this.outProgress.progress = event.progress;
        this.updateEditText();
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        let nameInfo = Global.Player.getPy('realName') || ''
        switch (param) {
            case 'close':
                this.close();
                break;
            case 'bindZFB':
                ViewMgr.pushToScene({ key: "openBindView", data: "zfb" });
                // if (!nameInfo && nameInfo == '') {
                //     Confirm.show('您还未绑定真实姓名，请先绑定真实姓名', () => {
                //         ViewMgr.open('RealName', { key: "init", data: 1 })
                //     })
                // } else {
                //     ViewMgr.open('Bind', { key: 'init', data: 'zfb' });
                // }
                break;
            case 'bindBankCard':
                ViewMgr.pushToScene({ key: "openBindView", data: "bankCard" });
                // if (!nameInfo && nameInfo == '') {
                //     Confirm.show('您还未绑定真实姓名，请先绑定真实姓名', () => {
                //         ViewMgr.open('RealName', { key: "init", data: 2 })
                //     })
                // } else {
                //     ViewMgr.open('Bind', { key: 'init', data: 'bankCard' });
                // }
                break;
            case 'clear':
                this.outNumEdit.string = '';
                this.outSlider.progress = 0;
                this.outProgress.progress = 0;
                break;
            case 'max':
                this.outSlider.progress = 1;
                this.outProgress.progress = 1;
                this.updateEditText();
                break;
            case 'record':
                ViewMgr.open('Exchange/ExchangeRecord', { key: 'init' });
                break;
            case 'ali':
            case 'wx':
            case 'bankCard':
                this.showBindGroup(param);
                this.outNumEdit.string = '';
                this.outSlider.progress = 0;
                this.outProgress.progress = 0;
                break;
            case 'exchange':
                let outNum = this.outNumEdit.string;
                if (outNum === '') {
                    Tip.makeText('请输入！');
                    return;
                }

                if (parseInt(outNum) <= 0) {
                    Tip.makeText('请输入0以上的数字！');
                    return;
                }

                if (parseInt(outNum) > Global.Player.getPy('gold')) {
                    Tip.makeText('金额不足！');
                    return;
                }

                let tixianType = Global.Enum.withdrawCashType.ALI_PAY;
                if (this.bankCardGroup.active) {
                    tixianType = Global.Enum.withdrawCashType.BANK_CARD;
                }

                if (tixianType === Global.Enum.withdrawCashType.ALI_PAY) {
                    let aliInfo = Global.Player.getPy('aliPayInfo');
                    if (!!aliInfo && !!aliInfo.aliPayAccount && aliInfo.aliPayAccount !== '') {
                    } else {
                        Confirm.show('未绑定支付宝账号，请先绑定！');
                        return;
                    }
                } else if (tixianType === Global.Enum.withdrawCashType.BANK_CARD) {
                    let bankInfo = Global.Player.getPy('bankCardInfo');
                    if (!!bankInfo && !!bankInfo.cardNumber && bankInfo.cardNumber !== '') {
                    } else {
                        Confirm.show('未绑定银行卡，请先绑定！');
                        return;
                    }
                }

                Waiting.show();
                Global.API.hall.withdrawCashRequest(parseInt(outNum), tixianType, (msg) => {
                    Waiting.hide();
                    this.outNumEdit.string = '';
                    this.outSlider.progress = 0;
                    this.outProgress.progress = 0;
                    Confirm.show('提款申请成功！请耐心等待！');
                });
                break;
        }
    }
}
