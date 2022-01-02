import BaseView from "../BaseClass/BaseView";
import { init } from "../Models/Data";

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
export default class ResetPwd extends BaseView {

    @property(cc.EditBox)
    accountEdit: cc.EditBox = undefined
    @property(cc.EditBox)
    codeEdit: cc.EditBox = undefined
    @property(cc.EditBox)
    pwdEdit: cc.EditBox = undefined
    @property(cc.EditBox)
    confirmPwdEdit: cc.EditBox = undefined
    @property(cc.Button)
    getCodeBtn: cc.Button = undefined
    @property(cc.Label)
    countDown: cc.Label = undefined

    countDownInterval = null

    // onLoad () {}

    init() {
        this.accountEdit.string = ''
        this.codeEdit.string = ''
        this.pwdEdit.string = ''
        this.confirmPwdEdit.string = ''
    }

    start() {

    }

    onDestroy() {
        if (!!this.countDownInterval) {
            clearInterval(this.countDownInterval);
            this.countDownInterval = null;
        }
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        let account = this.accountEdit.string;
        let code = this.codeEdit.string;
        let pwd = this.pwdEdit.string;
        let confirmPwd = this.confirmPwdEdit.string;

        switch (param) {
            case 'close':
                this.close()
                break;
            case 'getCode':
                if (account === '') {
                    Tip.makeText('请输入手机号！');
                    return;
                }

                if (account.length < 11) {
                    Tip.makeText('请输入正确的手机号！');
                    return;
                }

                Global.API.http.getPhoneCode(account);
                let time = 60;
                this.getCodeBtn.node.active = false;
                this.countDown.string = '60s';
                this.countDownInterval = setInterval(function () {
                    time--;
                    if (time < 0) {
                        clearInterval(this.countDownInterval);
                        this.countDownInterval = null;
                        this.getCodeBtn.node.active = true;
                    }
                    this.countDown.string = time + 's';
                }.bind(this), 1000);
                break;
            case 'confirm':
                if (account === '') {
                    Tip.makeText('请输入手机号！');
                    return;
                }

                if (account.length < 11) {
                    Tip.makeText('请输入正确的手机号！');
                    return;
                }

                if (code === '') {
                    Tip.makeText('请输入手机验证码！');
                    return;
                }

                if (pwd === '' || confirmPwd === '') {
                    Tip.makeText('请输入密码！');
                    return;
                }

                if (pwd !== confirmPwd) {
                    Tip.makeText('两次输入的密码不一致！');
                    return;
                }

                API.http.resetPasswordByPhoneRequest(account, pwd, code, {}, function (msg) {
                    if (msg.code === Global.Code.OK) {
                        Global.DialogManager.destroyDialog(this);
                        Tip.makeText('密码重置成功！');
                    }
                }.bind(this));
                break;
        }
    }
    // update (dt) {}
}
