import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class AccountLogin extends BaseView {

    @property(cc.EditBox)
    account: cc.EditBox = undefined;

    @property(cc.EditBox)
    pwd: cc.EditBox = undefined;
    start() {

    }
    init() {
        let account = cc.sys.localStorage.getItem('account');
        let password = cc.sys.localStorage.getItem('password');

        if (account && password) {
            this.account.string = account;
            this.pwd.string = password;
        } else {
            this.account.string = '';
            this.pwd.string = '';
        }

    }
    onClicked(event?: any, param?: string) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case "login":
                if (!this.inputOK()) return;
                let accountData = {
                    account: this.account.string,
                    password: this.pwd.string,
                    isGuest: false,
                };
                let msg = {
                    key: "login",
                    data: accountData
                }
                ViewMgr.pushToScene(msg);
                break;
            case "reset":
                ViewMgr.open("ResetPwd", { key: "init" });
                break;
            case "save":
                ViewMgr.pushToScene({ key: "setSavePwd", data: (<cc.Toggle>event).isChecked });
                break;
            case "close":
                this.close();
                break;

        }
    }
    /**
     * 输入检查
     */
    inputOK() {
        let account = this.account.string;
        let pwd = this.pwd.string;
        if (!account) {
            Tip.makeText("请输入账号!");
            return false;
        }
        // if (account.length < 11) {
        //     Tip.makeText('请输入正确的手机号！');
        //     return false;
        // }
        if (!pwd) {
            Tip.makeText("请输入密码!");
            return false;
        }
        return true;

    }

}
