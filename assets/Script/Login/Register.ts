import BaseView from "../BaseClass/BaseView";
import { init } from "../Game/ThirteenWater/TWModel";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Register extends BaseView {
    @property(cc.EditBox)
    account: cc.EditBox = undefined;
    @property(cc.EditBox)
    imgCode: cc.EditBox = undefined;
    @property(cc.Sprite)
    imgCodeSprite: cc.Sprite = undefined;
    @property(cc.EditBox)
    phone: cc.EditBox = undefined;
    @property(cc.EditBox)
    smsCode: cc.EditBox = undefined;
    @property(cc.EditBox)
    pwd: cc.EditBox = undefined;
    @property(cc.EditBox)
    pwd2: cc.EditBox = undefined
    @property(cc.Label)
    countDown: cc.Label = undefined
    @property(cc.Button)
    getCodeBtn: cc.Button = undefined

    countDownInterval: any = undefined
    isPhone = undefined
    uniqueID = undefined
    allowRegType = undefined   //允许注册类型
    verifyType = undefined    //验证码类型 1 图片验证码 2 手机验证码 
    isVerifyCode = undefined  //是否开启验证码

    init() {
        this.allowRegType = Global.Data.getData('regConfig').allowRegType
        this.verifyType = Global.Data.getData('regConfig').verifyType
        this.isVerifyCode = Global.Data.getData('regConfig').isVerifyCode

        if (this.allowRegType == Global.Enum.allowRegType.ACCOUNT) {
            if (this.isVerifyCode && this.verifyType == 1) {
                this.imgCode.node.parent.parent.active = true
                this.getIMGCode()
            } else {
                this.imgCode.node.parent.parent.active = false
            }
            this.phone.node.parent.parent.active = false
            this.smsCode.node.parent.parent.active = false
            this.account.node.parent.parent.active = true
        } else if (this.allowRegType == Global.Enum.allowRegType.MOBILE_PHONE) {
            if (this.isVerifyCode && this.verifyType == 2) {
                this.smsCode.node.parent.parent.active = true
            } else {
                this.smsCode.node.parent.parent.active = false
            }
            this.phone.node.parent.parent.active = true
            this.account.node.parent.parent.active = false
            this.imgCode.node.parent.parent.active = false
        }
        this.account.string = ''
        this.phone.string = ''
        this.pwd.string = ''
        this.pwd2.string = ''
        this.smsCode.string = ''
        this.imgCode.string = ''
    }

    onClicked(event?: cc.Event, param?: string) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case "register":
                this.register()
                break;
            case "getSMSCode":
                this.getSMSCode()
                break;
            case "getIMGCode":
                this.getIMGCode()
                break;
            case "close":
                this.close()
                break;
            case "bind":
                this.bind()
                break;
            default:
                break;
        }
    }

    register() {
        if (!this.inputOK()) {
            return;
        }
        let pwd = this.pwd.string;
        let data = undefined
        if (this.allowRegType == Global.Enum.allowRegType.ACCOUNT) {
            data = {
                account: this.account.string || "",
                password: pwd || "",
                loginPlatform: Global.Enum.allowRegType.ACCOUNT,
                code: this.imgCode.string || "",
                uniqueID: this.uniqueID
            };

        } else if (this.allowRegType == Global.Enum.allowRegType.MOBILE_PHONE) {
            data = {
                account: this.phone.string || "",
                password: pwd || "",
                loginPlatform: Global.Enum.allowRegType.MOBILE_PHONE,
                code: this.smsCode.string || "",
            };
        }
        let msg = {
            key: "registerAP",
            data: data
        }
        ViewMgr.pushToScene(msg);
    }

    bind() {
        if (!this.inputOK()) {
            return;
        }
        let pwd = this.pwd.string;
        let account = undefined
        let code = undefined
        let uniqueID = undefined
        if (this.allowRegType == Global.Enum.allowRegType.ACCOUNT) {
            account = this.account.string
            code = this.imgCode.string
            uniqueID = this.uniqueID
        } else if (this.allowRegType == Global.Enum.allowRegType.MOBILE_PHONE) {
            account = this.phone.string
            code = this.smsCode.string
        }
        Waiting.show();
        Global.API.hall.bindAccountRequest(account, code, uniqueID, pwd, (msg) => {
            Waiting.hide();
            if (msg.code == Global.Code.OK) {
                Tip.makeText("绑定账号成功")
                this.close()
                cc.sys.localStorage.setItem('guestAccount', '');
                cc.sys.localStorage.setItem('guestPassword', '');

                cc.sys.localStorage.setItem('account', account);
                cc.sys.localStorage.setItem('password', pwd);
                cc.sys.localStorage.setItem('isAutoLogin', true)
                cc.sys.localStorage.setItem('isGuest', false)
            }
        }, (msg) => {
            if (!!Global.Code[msg.code]) {
                Confirm.show(Global.Code[msg.code]);
            } else {
                Confirm.show('游戏错误，错误码：' + msg.code);
            }
            if (this.isVerifyCode && this.verifyType == 1) {
                this.imgCode.node.parent.parent.active = true
                this.getIMGCode()
            }
        });
    }

    randomString() {
        const expect = 16;
        let str = Math.random().toString(36).substring(2);
        while (str.length & expect) {
            str += Math.random().toString(36).substring(2);
        }
        return str.substring(0, expect);
    }

    //获取图形验证码
    getIMGCode() {
        let time = new Date().getTime() + ''
        this.uniqueID = time.substring(time.length - 6) + this.randomString()
        Global.CCHelper.updateSpriteFrame(Global.Constant.gameServerAddress + "/getImgCode?&uniqueID=" + this.uniqueID, this.imgCodeSprite)
    }

    //获取手机验证码 
    getSMSCode() {
        // let account = this.account.string;
        let phone = /^1[3456789]\d{9}$/.test(this.phone.string)
        if (!phone) {
            Tip.makeText("请输入手机号码!");
            return;
        }
        Global.API.http.getPhoneCode(this.phone.string);
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
    }


    /**
     * 输入检查
     */
    inputOK() {
        let account = this.account.string;
        let phone = this.phone.string;
        let pwd = this.pwd.string;
        let pwd2 = this.pwd2.string;
        let code = this.smsCode.string;
        let ImgCode = this.imgCode.string;

        if (this.allowRegType == Global.Enum.allowRegType.ACCOUNT) {
            let regAccount = /^[a-zA-Z]([-_a-zA-Z0-9]{6,15})$/.test(account);
            if (!regAccount) {
                Tip.makeText("请输入正确的账号!");
                return false;
            }
            if (this.isVerifyCode) {
                if (!ImgCode) {
                    Tip.makeText('请输入验证码！');
                    return false;
                }
            }
        } else if (this.allowRegType == Global.Enum.allowRegType.MOBILE_PHONE) {

            let regPhone = /^1[3456789]\d{9}$/.test(phone)
            if (!regPhone) {
                Tip.makeText("请输入正确的手机号！");
                return false;
            }
            if (this.isVerifyCode) {
                if (!code) {
                    Tip.makeText('请输入验证码！');
                    return false;
                }
            }
        }

        if (!pwd) {
            Tip.makeText("请输入密码!");
            return false;
        }
        if (pwd !== pwd2) {
            Tip.makeText('两次密码不一致!');
            return;
        }


        return true;

    }
    onDestroy() {
        if (this.countDownInterval) {
            clearInterval(this.countDownInterval);
            this.countDownInterval = null;
        }
    }
    // update (dt) {}
}
