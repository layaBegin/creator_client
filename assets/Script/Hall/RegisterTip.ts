import BaseView from "../BaseClass/BaseView";
const { ccclass, property } = cc._decorator;

@ccclass
export default class RegisterTip extends BaseView {

    @property(cc.Label)
    registerTipLabel: cc.Label = null;

    @property(cc.Node)
    zcsj: cc.Node = undefined

    @property(cc.Node)
    hlxs: cc.Node = undefined

    @property(cc.Label)
    info: cc.Label = undefined

    url = undefined

    init() {
        this.zcsj.active = false
        this.hlxs.active = false

        if (GameConfig.gameConfig.reg && GameConfig.gameConfig.reg.giftGold) {
            this.zcsj.active = true
            this.registerTipLabel.string = GameConfig.gameConfig.reg.giftGold
        }
        else if (GameConfig.gameConfig.reg && GameConfig.gameConfig.reg.afInfo) {
            this.hlxs.active = true
            this.info.string = GameConfig.gameConfig.reg.afInfo.remark ? GameConfig.gameConfig.reg.afInfo.remark : "";
        }
        else {
            this.node.active = false;   // 直接关闭
        }
        Waiting.show();
        // Global.API.account.getInfo((msg) => {
        API.http.getServiceInfo((msg) => {
            let data = msg.msg;
            this.url = data.csUrl
            Waiting.hide();
        });

    }

    onBtnClk(event: cc.Event, param: string) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'url':
                cc.sys.openURL(this.url);
                break;
            case 'copywx':
                Global.SDK.copyText(GameConfig.gameConfig.reg.afInfo.wechat);
                break;
            case 'copyqq':
                Global.SDK.copyText(GameConfig.gameConfig.reg.afInfo.qq);
                break;
            case 'register':
                this.close();
                ViewMgr.open("Register", { key: 'init' });
                break;
        }
    }
}
