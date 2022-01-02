import BaseView from "../../BaseClass/BaseView";
import Dljs from "./Dljs";
import Wdyj from "./Wdyj";

const { ccclass, property } = cc._decorator;
let Global = (<any>window).Global
@ccclass
export default class Agency extends BaseView {

    @property(cc.Node)
    BtnToggle: cc.Node = undefined
    @property(cc.Node)
    tgzqTop: cc.Node = undefined
    @property(cc.Label)
    realCommision: cc.Label = undefined
    @property(cc.Label)
    directlyMemberCount: cc.Label = undefined
    @property(cc.Label)
    agentMemberCount: cc.Label = undefined
    @property(cc.Label)
    totalCommision: cc.Label = undefined
    @property(cc.Label)
    shareUrl: cc.Label = undefined
    @property(cc.Node)
    qrcodeImg: cc.Node = undefined

    @property(Dljs)
    dljs: Dljs = undefined
    @property(Wdyj)
    wdyj: Wdyj = undefined

    @property(cc.Label)
    yjjlLabel: cc.Label = null;
    @property(cc.Node)
    yjjlContent: cc.Node = null;

    @property(cc.Label)
    txjlLabel: cc.Label = null;
    @property(cc.Node)
    txjlContent: cc.Node = null;

    @property(cc.PageView)
    bannerScroll: cc.PageView = undefined

    @property(cc.Node)
    share: cc.Node = undefined
    @property(cc.Sprite)
    shareImg: cc.Sprite = undefined
    @property(cc.Node)
    shareQrcodeImg: cc.Node = undefined

    srollIndex = undefined
    shareURL = undefined

    async init() {
        if (AudioConfig._Agency) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/agency");
            AudioConfig._Agency = false
        }
        this.BtnToggle.children[0].getComponent(cc.Toggle).check()
        this.initTgzq()
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    }

    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }

    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.initTgzq()
                break;
        }
    }


    initTopInfo(node) {
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), node.getChildByName('head').getChildByName('frame').getComponent(cc.Sprite));
        node.getChildByName('account').getChildByName('text').getComponent(cc.Label).string = Global.Player.getPy('nickname')
        let num = Global.Player.getPy('directlyMemberAchievement') + Global.Player.getPy('agentMemberAchievement');
        let profit = Global.AgentProfit.getProportionByNum(num);
        node.getChildByName('level').getChildByName('text').getComponent(cc.Label).string = profit.level
        node.getChildByName('money').getChildByName('num').getComponent(cc.Label).string = Global.Player.getPy('realCommision').toFixed(2)
    }

    initTgzq() {
        Global.CCHelper.playPreSound();
        this.shareURL = Global.Data.getData('AgentPromotionAddRess') + "?uid=" + Global.Player.getPy('uid')//+ "&pid=" + Global.Data.getData('channelCode') + "&type1=1"
        this.realCommision.string = Global.Player.getPy('realCommision')
        this.directlyMemberCount.string = Global.Player.getPy('directlyMemberCount')
        this.agentMemberCount.string = Global.Player.getPy('agentMemberCount')
        this.totalCommision.string = Global.Player.getPy('totalCommision')
        this.shareUrl.string = this.shareURL

        let url = this.shareURL || (Global.Constant.webServerAddress + "/game-download");
        let ctx = undefined
        if (this.qrcodeImg.getComponent(cc.Graphics)) {
            ctx = this.qrcodeImg.getComponent(cc.Graphics);
        } else {
            ctx = this.qrcodeImg.addComponent(cc.Graphics);
        }
        ctx.clear(true)
        this.QRCreate(ctx, url, this.qrcodeImg);

        this.initTopInfo(this.tgzqTop)
    }

    initWdyj() {
        Global.CCHelper.playPreSound();
        this.wdyj.init()
    }

    initDljs() {
        Global.CCHelper.playPreSound();
        this.dljs.init()
    }
    //系统发放佣金记录
    initYjjl() {
        Global.CCHelper.playPreSound();
        this.yjjlLabel.string = Number(Global.Player.getPy('totalCommision')).toFixed(2)
        Global.API.hall.getRecordData(0, 30, Config.RecordType.EXTRACT_GIVE_COMMISSION, (msg) => {
            let data = msg.msg.recordArr;
            for (let i = 0; i < data.length; i++) {
                let item: cc.Node = this.yjjlContent.children[i]
                if (!cc.isValid(item)) {
                    item = cc.instantiate(this.yjjlContent.children[0]);
                }
                item.getChildByName('time').getComponent(cc.Label).string = (new Date(data[i].createTime)).format('MM-dd hh:mm:ss')
                item.getChildByName('order').getComponent(cc.Label).string = data[i].uuid
                item.getChildByName('money').getComponent(cc.Label).string = (data[i].gold).toFixed(2)
                item.active = true
                item.parent = this.yjjlContent;
            }
        })
    }
    //领取佣金记录
    initTxjl() {
        Global.CCHelper.playPreSound();
        this.txjlLabel.string = Number(Global.Player.getPy('giveCommision')).toFixed(2)
        Global.API.hall.getRecordData(0, 30, Config.RecordType.EXTRACT_COMMISSION, (msg) => {
            let data = msg.msg.recordArr;
            for (let i = 0; i < data.length; i++) {
                let item: cc.Node = this.txjlContent.children[i]
                if (!cc.isValid(item)) {
                    item = cc.instantiate(this.txjlContent.children[0]);
                }
                item.getChildByName('time').getComponent(cc.Label).string = (new Date(data[i].createTime)).format('MM-dd hh:mm:ss')
                item.getChildByName('order').getComponent(cc.Label).string = data[i].uuid
                item.getChildByName('money').getComponent(cc.Label).string = (data[i].count).toFixed(2)
                item.active = true
                item.parent = this.txjlContent;
            }
        })
    }

    QRCreate(ctx, url, node) {
        let qrcode = new QRCode(-1, QRErrorCorrectLevel.H);
        qrcode.addData(url);
        qrcode.make();

        ctx.fillColor = cc.Color.BLACK;
        //块宽高
        let tileW = node.width / qrcode.getModuleCount();
        let tileH = node.height / qrcode.getModuleCount();

        // draw in the Graphics
        for (let row = 0; row < qrcode.getModuleCount(); row++) {
            for (let col = 0; col < qrcode.getModuleCount(); col++) {
                if (qrcode.isDark(row, col)) {
                    // ctx.fillColor = cc.Color.BLACK;
                    let w = (Math.ceil((col + 1) * tileW) - Math.floor(col * tileW));
                    let h = (Math.ceil((row + 1) * tileW) - Math.floor(row * tileW));
                    ctx.rect(Math.round(col * tileW), Math.round(row * tileH), w, h);
                    ctx.fill();
                }
            }
        }
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'hide':
                this.share.active = false
                break;
            case 'copy':
                let text = this.shareUrl.string
                Global.SDK.copyText(text)
                break;
            case 'tixian':
                let info = Global.Player;
                if (info.realCommision <= 0) {
                    Confirm.show('可提现佣金不足！');
                    return;
                }

                Global.API.hall.extractionCommissionRequest(function (msg) {
                    Confirm.show('提取成功！');
                });
                break;
            case 'leftsroll':
                let index = this.bannerScroll.getCurrentPageIndex()
                let allpage = this.bannerScroll.getPages()
                if (index <= 0) {
                    index = allpage.length - 1
                } else {
                    index -= 1
                }
                this.bannerScroll.scrollToPage(index, 0)
                break;
            case 'rightsroll':
                index = this.bannerScroll.getCurrentPageIndex()
                allpage = this.bannerScroll.getPages()
                if (index >= allpage.length - 1) {
                    index = 0
                } else {
                    index += 1
                }
                this.bannerScroll.scrollToPage(index, 0)
                break;
            case 'share':
                this.srollIndex = this.bannerScroll.getCurrentPageIndex()
                Global.CCHelper.updateSpriteFrame("Agency/" + (this.srollIndex + 1), this.shareImg)
                let url = this.shareURL || (Global.Constant.webServerAddress + "/game-download");
                let ctx = undefined
                if (this.shareQrcodeImg.getComponent(cc.Graphics)) {
                    ctx = this.shareQrcodeImg.addComponent(cc.Graphics);
                } else {
                    ctx = this.shareQrcodeImg.addComponent(cc.Graphics);
                }
                ctx.clear(true)
                this.QRCreate(ctx, url, this.shareQrcodeImg);
                this.share.active = true
                break;
            case 'send':
                Global.CCHelper.capScreen(this.shareImg.node)
                break;
        }

    }
}
