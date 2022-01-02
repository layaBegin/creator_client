import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class NewClass extends BaseView {

    @property(cc.Sprite)
    avatar: cc.Sprite = undefined
    @property(cc.EditBox)
    nicknameText: cc.EditBox = undefined
    @property(cc.Label)
    idText: cc.Label = undefined
    @property(cc.Label)
    goldNumText: cc.Label = undefined
    @property(cc.Label)
    realName: cc.Label = undefined
    @property(cc.Label)
    phone: cc.Label = undefined
    @property(cc.Label)
    zbfAccountText: cc.Label = undefined
    @property(cc.Label)
    bankCardText: cc.Label = undefined


    @property(cc.Button)
    music: cc.Button = undefined;

    @property(cc.Button)
    sound: cc.Button = undefined;

    updatePlayerInfo() {
        this.avatar.node.active = false;
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.avatar, function () {
            this.avatar.node.active = true;
        }.bind(this));

        this.nicknameText.string = Global.Player.getPy('nickname');
        this.idText.string = Global.Player.getPy('uid');
        this.goldNumText.string = Global.Player.getPy('gold');


        let nameInfo = Global.Player.getPy('realName');
        if (!!nameInfo && nameInfo !== '') {
            this.realName.string = nameInfo;
            this.realName.node.parent.getChildByName("btn").active = false
        }

        let phone = Global.Player.getPy('phone');
        if (!!phone && phone !== '') {
            this.phone.string = phone;
            this.phone.node.parent.getChildByName("btn").active = false
        }

        let aliInfo = Global.Player.getPy('aliPayInfo')
        if (aliInfo && aliInfo.aliPayAccount && aliInfo.aliPayAccount != '') {
            this.zbfAccountText.string = Global.Utils.cutstr(aliInfo.aliPayAccount, 12);
            this.zbfAccountText.node.parent.getChildByName("btn").active = false
        }

        let bankInfo = Global.Player.getPy('bankCardInfo')
        if (bankInfo && bankInfo.cardNumber && bankInfo.cardNumber != '') {
            this.bankCardText.string = Global.Utils.cutstr(bankInfo.cardNumber, 12);
            this.bankCardText.node.parent.getChildByName("btn").active = false
        }
    }

    init() {
        this.updatePlayerInfo();
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);

        var musicVolume = cc.sys.localStorage.getItem('MusicVolume');
        var soundVolume = cc.sys.localStorage.getItem('SoundVolume');

        if (musicVolume == 0) {
            Global.CCHelper.updateSpriteFrame('UserInfo/on', this.music.node.getChildByName('Background').getComponent(cc.Sprite));
        } else {
            Global.CCHelper.updateSpriteFrame('UserInfo/off', this.music.node.getChildByName('Background').getComponent(cc.Sprite));
        }
        if (soundVolume == 0) {
            Global.CCHelper.updateSpriteFrame('UserInfo/on', this.sound.node.getChildByName('Background').getComponent(cc.Sprite));
        } else {
            Global.CCHelper.updateSpriteFrame('UserInfo/off', this.sound.node.getChildByName('Background').getComponent(cc.Sprite));

        }
    }


    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }



    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updatePlayerInfo();
                break;
        }
    }

    onBtnClk(ev: cc.Event, param: string) {
        Global.CCHelper.playPreSound();
        let real = Global.Player.getPy('realName')
        switch (param) {
            case 'close':
                this.close();
                break;
            case 'changeAvatar':
                ViewMgr.open('UserCenter/ChangeAvatar', { key: 'init' })
                break;
            case 'setting':
                Global.DialogManager.createDialog('Setting/SettingDialog');
                break;
            case 'bindZFB':
                if (Global.Player.getPy('isGuest') == 'true') {
                    Confirm.show('您还未注册成为正式用户，请先注册', () => {
                        ViewMgr.open("Register", { key: 'init' });
                    })
                    return
                }
                ViewMgr.pushToScene({ key: "openBindView", data: "zfb" });
                // if (real == undefined || real == '') {
                //     Confirm.show('您还未绑定真实姓名，请先绑定真实姓名', () => {
                //         ViewMgr.open('RealName', { key: "init", data: 1 })
                //     })
                // } else {
                //     ViewMgr.open('Bind', { key: 'init', data: 'zfb' })
                // }
                break;
            case 'bindBankCard':
                if (Global.Player.getPy('isGuest') == 'true') {
                    Confirm.show('您还未注册成为正式用户，请先注册', () => {
                        ViewMgr.open("Register", { key: 'init' });
                    })
                    return;
                }
                ViewMgr.pushToScene({ key: "openBindView", data: "bankCard" });
                // if (real == undefined || real == '') {
                //     Confirm.show('您还未绑定真实姓名，请先绑定真实姓名', () => {
                //         ViewMgr.open('RealName', { key: "init", data: 2 })
                //     })
                // } else {
                //     ViewMgr.open('Bind', { key: 'init', data: 'bankCard' })
                // }
                break;
            case 'recharge':
                API.hall.getRechargeDis((msg) => {
                    this.close();
                    ViewMgr.open("Recharge", { key: "init", data: msg.msg });
                }, (msg) => {
                    Confirm.show('充值系统维护中')
                })
                break;
            case 'realName':
                if (Global.Player.getPy('isGuest') == 'true') {
                    Confirm.show('您还未注册成为正式用户，请先注册', () => {
                        ViewMgr.open("Register", { key: 'init' });
                    })
                    return;
                }
                ViewMgr.open('RealName')
                break;
            case 'editNickName':
                let nickName = this.nicknameText.string;
                if (nickName.indexOf(' ') !== -1) {
                    Tip.makeText('昵称格式错误！');
                    return;
                }
                if (nickName === '') {
                    Tip.makeText('请输入昵称！');
                    return;
                }
                if (nickName == Global.Player.getPy('nickname')) {
                    Tip.makeText('昵称未更改！');
                    return;
                }
                Global.API.hall.changeNicknameRequest(nickName, function () {
                    Confirm.show('绑定成功！');

                }.bind(this));
                break;
            case 'copy':
                Global.SDK.copyText(Global.Player.getPy('uid'));
                break;
            case 'music':
                var musicVolume = cc.sys.localStorage.getItem('MusicVolume');
                if (musicVolume == 0) {
                    cc.sys.localStorage.setItem('MusicVolume', 1)
                    AudioMgr.setMusicVolume(1);
                    Global.CCHelper.updateSpriteFrame('UserInfo/off', this.music.node.getChildByName('Background').getComponent(cc.Sprite));
                } else {
                    cc.sys.localStorage.setItem('MusicVolume', 0)
                    AudioMgr.setMusicVolume(0);
                    Global.CCHelper.updateSpriteFrame('UserInfo/on', this.music.node.getChildByName('Background').getComponent(cc.Sprite));
                }
                break;
            case 'sound':
                var soundVolume = cc.sys.localStorage.getItem('SoundVolume');
                if (soundVolume == 0) {
                    cc.sys.localStorage.setItem('SoundVolume', 1)
                    AudioMgr.setSoundVolume(1);
                    Global.CCHelper.updateSpriteFrame('UserInfo/off', this.sound.node.getChildByName('Background').getComponent(cc.Sprite));
                } else {
                    cc.sys.localStorage.setItem('SoundVolume', 0)
                    AudioMgr.setSoundVolume(0);
                    Global.CCHelper.updateSpriteFrame('UserInfo/on', this.sound.node.getChildByName('Background').getComponent(cc.Sprite));
                }
                break;
            case 'logout':
                // Global.NetworkLogic.disconnect(false);
                NetworkMgr.disconnect(false);
                Global.DialogManager.destroyAllDialog();
                cc.director.loadScene("Login");
                cc.sys.localStorage.setItem('isAutoLogin', false);
                break;
        }
    }
}
