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
export default class VipDialog extends BaseView {

    @property(cc.Label)
    nowVip1: cc.Label = undefined;

    @property(cc.Sprite)
    nowVip2: cc.Sprite = undefined;

    @property(cc.Label)
    betGold: cc.Label = undefined;

    @property(cc.Label)
    vipLabel: cc.Label = undefined;

    @property(cc.Node)
    progressBar: cc.Node = undefined;

    @property(cc.Node)
    vipItem: cc.Node = undefined;

    @property(cc.Node)
    vipInfoItem: cc.Node = undefined;

    @property(cc.Node)
    vipList: cc.Node = undefined;

    @property(cc.Node)
    rechText: cc.Node = undefined;


    vipData: any;

    // monthGiftbool: true
    // riselevelGiftbool: true

    // vipLevel: 1
    // waitWashCodeALLGold: 0
    // weekGiftbool: true


    init() {
        Waiting.show();
        Global.API.hall.getVIPactivityRequest((msg) => {
            let data = msg.msg
            this.vipData = data
            this.nowVip1.string = (data.vipLevel - 1) + ""
            Global.CCHelper.updateSpriteFrame('Common/vip/' + data.vipLevel, this.nowVip2)
            let nextVip1 = (data.vipLevel + 1) > data.length ? data.length : data.vipLevel + 1
            let vipinfo = Global.VipConfig.getVipInfo(data.vipLevel + 1)
            this.vipLabel.string = "VIP" + nextVip1
            //?????????????????????????????????
            let betGold = (vipinfo.grandTotalBet - data.allBetGold).toFixed(2)
            this.betGold.string = betGold + ''
            this.progressBar.getComponent(cc.Sprite).fillRange = data.allBetGold / vipinfo.grandTotalBet

            this.initBtnParam()
            this.initVIPInfo()
            Waiting.hide();
        })


    }
    //?????????????????????
    initBtnParam() {
        let vipinfo = Global.VipConfig.getVipInfo(this.vipData.vipLevel)
        for (let index = 0; index < this.vipItem.children.length; index++) {
            if (index == 0) {
                if (!this.vipData.riselevelGiftbool) {
                    this.vipItem.children[index].getChildByName('btn').getComponent(cc.Button).interactable = false
                    this.vipItem.children[index].getChildByName('btn').getChildByName('Background')
                    this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                }
                if (vipinfo.riseLevelGiftScore <= 0) {
                    this.vipItem.children[index].getChildByName('btn').getComponent(cc.Button).interactable = false
                    Global.CCHelper.updateSpriteFrame('Hall/btn_get_hui', this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getComponent(cc.Sprite));
                    this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                }
                this.vipItem.children[index].getChildByName('num').getComponent(cc.Label).string = vipinfo.riseLevelGiftScore + "???"
            } else if (index == 1) {
                if (!this.vipData.weekGiftbool) {
                    this.vipItem.children[index].getChildByName('btn').getComponent(cc.Button).interactable = false
                    this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                }
                if (vipinfo.weekGiftScore <= 0) {
                    this.vipItem.children[index].getChildByName('btn').getComponent(cc.Button).interactable = false
                    Global.CCHelper.updateSpriteFrame('Hall/btn_get_hui', this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getComponent(cc.Sprite));
                    this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                }
                this.vipItem.children[index].getChildByName('num').getComponent(cc.Label).string = vipinfo.weekGiftScore + "???"
            }
            else if (index == 2) {
                if (!this.vipData.monthGiftbool) {
                    this.vipItem.children[index].getChildByName('btn').getComponent(cc.Button).interactable = false
                    this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                }
                if (vipinfo.monthGiftScore <= 0) {
                    this.vipItem.children[index].getChildByName('btn').getComponent(cc.Button).interactable = false
                    Global.CCHelper.updateSpriteFrame('Hall/btn_get_hui', this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getComponent(cc.Sprite));
                    this.vipItem.children[index].getChildByName('btn').getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                }
                this.vipItem.children[index].getChildByName('num').getComponent(cc.Label).string = vipinfo.monthGiftScore + "???"
            }
            else if (index == 3) {
                this.vipItem.children[index].getChildByName('num').getComponent(cc.Label).string = vipinfo.washCodeRate + "%"
            }
        }
    }
    //?????????????????????
    initVIPInfo() {
        let list = Global.VipConfig.vipConfig
        for (let i = 0; i < this.vipList.children.length; i++) {
            this.vipList.children[i].active = false
        }
        for (let i = 0; i < list.length; i++) {
            let item: cc.Node = this.vipList.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.vipInfoItem);
            }
            item.children[0].getComponent(cc.Label).string = list[i].vipID
            item.children[1].getComponent(cc.Label).string = list[i].grandTotalBet
            item.children[2].getComponent(cc.Label).string = list[i].riseLevelGiftScore
            item.children[3].getComponent(cc.Label).string = list[i].weekGiftScore
            item.children[4].getComponent(cc.Label).string = list[i].monthGiftScore
            item.children[5].getComponent(cc.Label).string = list[i].washCodeRate + "%"
            item.active = true
            item.parent = this.vipList
        }

        this.rechText.getComponent(cc.RichText).string = "?????????????????????<color=#f0b156>??????????????????</c>??????????????????????????????????????????????????????<color=#f0b156>???????????? = ??????</c>?????????<color=#f0b156>2019</c>????????????<color=#f0b156>8888</c>?????????????????????????????????<color=#f0b156>35102</c>????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????<br/>???????????????????????????????????????????????????<color=#f0b156>????????????????????????</c>?????????????????????????????????<color=#f0b156>?????????????????????????????????????????????</c>??????????????????????????????????????????????????????"
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'riselevel':
                Waiting.show();
                Global.API.hall.getVipReward(3, (msg) => {
                    Confirm.show('????????????');
                    event.currentTarget.getComponent(cc.Button).interactable = false
                    event.currentTarget.getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                    Waiting.hide();
                })
                break;
            case 'week':
                Waiting.show();
                Global.API.hall.getVipReward(1, (msg) => {
                    Confirm.show('????????????');
                    event.currentTarget.getComponent(cc.Button).interactable = false
                    event.currentTarget.getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                    Waiting.hide();
                })

                break;
            case 'month':
                Waiting.show();
                Global.API.hall.getVipReward(2, (msg) => {
                    Confirm.show('????????????');
                    event.currentTarget.getComponent(cc.Button).interactable = false
                    event.currentTarget.getChildByName('Background').getChildByName('Label').getComponent(cc.Label).string = "?????????"
                    Waiting.hide();
                })
                break;

            case 'washcode':
                ViewMgr.open("Wash", { key: "init" });
                break;
        }
    }

    // update (dt) {}
}
