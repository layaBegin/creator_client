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
export default class Wash extends BaseView {

    @property({ type: cc.Node, tooltip: "洗码总量" })
    waitWashCodeALLGold: cc.Node = undefined;

    @property({ type: cc.Node, tooltip: "可洗码量" })
    waitWashCodeGold: cc.Node = undefined;

    @property({ type: cc.Node, tooltip: "洗码比例" })
    washCodeRate: cc.Node = undefined;

    @property({ type: cc.Node, tooltip: "可洗码金额" })
    washCodeGold: cc.Node = undefined;

    @property(cc.Node)
    ListContent: cc.Node = undefined;
    @property(cc.Node)
    ListItem: cc.Node = undefined;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    async init() {
        if (AudioConfig._Wash) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/wash");
            AudioConfig._Wash = false
        }
        this.initWashCodeDate()
        this.initWashCodeRecord()
    }
    //初始化洗码信息
    initWashCodeDate() {
        Waiting.show();
        Global.API.hall.getWashCodeDate((msg) => {
            let data = msg.msg;
            this.waitWashCodeALLGold.getComponent(cc.Label).string = Global.Utils.formatNum2(data.allBetGold) + ""
            this.waitWashCodeGold.getComponent(cc.Label).string = Global.Utils.formatNum2(data.waitWashCodeGold) + ""
            this.washCodeRate.getComponent(cc.Label).string = Global.Utils.formatNum2(data.washCodeRate) + "%"
            this.washCodeGold.getComponent(cc.Label).string = Global.Utils.formatNum2(data.washCodeGold) + ""
            Waiting.hide();
        });
    }
    //初始化洗码记录
    initWashCodeRecord() {
        Waiting.show();
        for (let i = 0; i < this.ListContent.children.length; i++) {
            this.ListContent.children[i].active = false
        }
        Global.API.hall.getWashCodeRecord((msg) => {
            let data = msg.msg;
            data.sort((a, b) => {
                return b.createTime - a.createTime
            })
            this.ListContent.removeAllChildren()
            for (let i = 0; i < data.length; i++) {
                let item: cc.Node = this.ListContent.children[i]
                if (!cc.isValid(item)) {
                    item = cc.instantiate(this.ListItem);
                }
                item.active = true
                item.children[0].getComponent(cc.Label).string = (new Date(data[i].createTime)).format('yyyy-MM-dd hh:mm:ss')
                item.children[1].getComponent(cc.Label).string = Global.Utils.formatNum2(data[i].waitWashCodeGold) + ""
                item.children[2].getComponent(cc.Label).string = Global.Utils.formatNum2(data[i].gold) + ""
                item.children[3].getComponent(cc.Label).string = data[i].washCodeRate + '%'
                item.parent = this.ListContent
            }
            Waiting.hide();
        });
    }
    washCodeRequest() {
        Waiting.show();
        Global.API.hall.washCodeRequest((msg) => {
            let data = msg.msg;
            Waiting.hide();
            Confirm.show("洗码成功", () => {
                this.initWashCodeDate()
                this.initWashCodeRecord()
            })
        });
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'washCode':
                this.washCodeRequest()
                break;
        }
    }
}
