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
export default class Mail extends BaseView {

    @property(cc.Node)
    MailList: cc.Node = undefined

    @property(cc.Node)
    MailItem: cc.Node = undefined

    @property(cc.Node)
    MailTip: cc.Node = undefined

    @property(cc.RichText)
    DetailContent: cc.RichText = undefined;

    mailContent = undefined

    //按数组某个字段排序
    compare(property) {
        return function (a, b) {
            var value1 = a[property];
            var value2 = b[property];
            return value1 - value2;
        }
    }
    //status 1未读   2已读
    async init() {
        if (AudioConfig._Mail) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/mail");
            AudioConfig._Mail = false
        }
        this.onLoadUI()
    }


    onLoadUI() {
        Waiting.show();
        this.MailList.removeAllChildren()
        Global.API.hall.getMailRequest((msg) => {
            let data = msg.msg;

            if (data.length == 0) {
                this.MailTip.active = true
                Waiting.hide();
                return
            } else {
                this.MailTip.active = false
            }
            data.sort(this.compare('status'))
            for (let i = 0; i < data.length; i++) {
                let item: cc.Node = undefined
                if (i == 0) {
                    item = this.MailItem;
                } else {
                    item = cc.instantiate(this.MailItem);
                }
                item.active = true;
                let type = '';
                switch (data[i].mailType) {
                    case 1:
                        type = "系统邮件"
                        break;
                    case 2:
                        type = "活动通知"
                        break;
                    case 3:
                        type = "优惠通知"
                        break;
                    case 4:
                        type = "活动领取"
                        break;
                    default:
                        break;
                }
                if (data[i].status == 2) {
                    Global.CCHelper.updateSpriteFrame("Mail/0", item.getComponent(cc.Sprite))
                    Global.CCHelper.updateSpriteFrame("Mail/read", item.getChildByName('icon').getComponent(cc.Sprite))
                } else {
                    Global.CCHelper.updateSpriteFrame("Mail/1", item.getComponent(cc.Sprite))
                    Global.CCHelper.updateSpriteFrame("Mail/unread", item.getChildByName('icon').getComponent(cc.Sprite))
                }
                item.getChildByName('type').getComponent(cc.Label).string = "【" + type + "】";
                item.getChildByName('title').getComponent(cc.Label).string = data[i].title.substring(0, 20);
                item.getChildByName('time').getComponent(cc.Label).string = (new Date(data[i].createTime)).format('yyyy-MM-dd hh:mm:ss');
                item.getChildByName('btn').getComponent(cc.Button).clickEvents[0].customEventData = data[i];
                item.parent = this.MailList;
            }
            Waiting.hide();
        });
    }
    //邮件详情点击事件
    detailClk(event, param) {
        Global.CCHelper.playPreSound();
        this.mailContent = param
        if (param.status == 1) {
            Waiting.show();
            Global.API.hall.operationEmail(param._id, 2, (msg) => {
                let node = event.currentTarget
                ViewMgr.open('Mail/MailDetail');
                Global.CCHelper.updateSpriteFrame("Mail/0", node.parent.getComponent(cc.Sprite));
                // AssetMgr.loadResSync("Mail/0", cc.SpriteFrame, function (err, spriteFrame) {
                //     node.parent.getComponent(cc.Sprite).spriteFrame = spriteFrame;
                // });
                Global.CCHelper.updateSpriteFrame("Mail/read", node.parent.getChildByName('icon').getComponent(cc.Sprite));
                // AssetMgr.loadResSync("Mail/read", cc.SpriteFrame, function (err, spriteFrame) {
                //     node.parent.getChildByName('icon').getComponent(cc.Sprite).spriteFrame = spriteFrame;
                // });
                Waiting.hide();
            });
        } else {
            ViewMgr.open('Mail/MailDetail');
        }

        this.DetailContent.string = this.mailContent.content
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'closeDetail':
                ViewMgr.close('Mail/MailDetail');
                break;
        }
    }

    delClk(event, param) {
        Global.CCHelper.playPreSound();
        Global.API.hall.operationEmail(this.mailContent._id, 100, (msg) => {
            Waiting.hide();
            ViewMgr.close('Mail/MailDetail');
            this.onLoadUI()
        });
    }
}
