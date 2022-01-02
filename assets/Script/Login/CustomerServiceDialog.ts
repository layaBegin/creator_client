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
let Global = (<any>window).Global
@ccclass
export default class CustomerService extends BaseView {

    @property(cc.Label)
    wxlabel: cc.Label = undefined;

    @property(cc.Label)
    qqlabel: cc.Label = undefined;

    url: string = undefined
    wx: string = undefined
    qq: string = undefined
    async init() {
        if (AudioConfig._Custom) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/custom");
            AudioConfig._Custom = false
        }
        Waiting.show();
        // Global.API.account.getInfo((msg) => {
        API.http.getServiceInfo((msg) => {
            let data = msg.msg;
            this.url = data.csUrl
            this.wx = data.wx
            this.qq = data.qq
            this.wxlabel.getComponent(cc.Label).string = this.wx
            this.qqlabel.getComponent(cc.Label).string = this.qq
            Waiting.hide();
        }, (msg) => {
            this.wxlabel.getComponent(cc.Label).string = 'ceshi'
            this.qqlabel.getComponent(cc.Label).string = 'ceshi'
            Waiting.hide();
        });
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close();
                break;
            case 'url':
                cc.sys.openURL(this.url || 'http://www.baidu.com');
                break;
            case 'copywx':
                Global.SDK.copyText(this.wxlabel.getComponent(cc.Label).string);
                break;
            case 'copyqq':
                Global.SDK.copyText(this.qqlabel.getComponent(cc.Label).string);
                break;
        }
    }
    // update (dt) {}
}
