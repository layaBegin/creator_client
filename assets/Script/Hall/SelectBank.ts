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
export default class SelectBank extends BaseView {

    @property(cc.Node)
    bankList: cc.Node = undefined;

    @property(cc.Node)
    bankItem: cc.Node = undefined;

    @property(cc.ScrollView)
    ScrollView: cc.ScrollView = null;

    @property(cc.Node)
    Content: cc.Node = null;

    @property(cc.Node)
    ItemBg: cc.Node = null;


    bgH = undefined     //选中框背景高度 && item高度
    viewH = undefined
    selectIndex = undefined

    init(bankCode) {
        for (let index = 0; index < Global.drawaBankList.length; index++) {
            if (bankCode && Global.drawaBankList[index].bankCode == bankCode) {
                this.selectIndex = index
            }
        }
        this.initBankList()
        this.initUI()
        this.initScrollList()
    }

    //初始化银行列表
    initBankList() {
        for (let i = 0; i < this.Content.children.length; i++) {
            this.Content.children[i].active = false
        }
        let data = Global.drawaBankList
        if (data) {
            for (let i = 0; i < data.length; i++) {
                let item: cc.Node = this.Content.children[i]
                if (!cc.isValid(item)) {
                    item = cc.instantiate(this.bankItem);
                }
                item.getComponent(cc.Label).string = data[i].bankName
                item.active = true;
                item.parent = this.Content
            }
        }
    }
    initUI() {
        this.bgH = this.ItemBg.height
        this.viewH = this.ScrollView.node.getChildByName('view').height = this.bgH * 5
        this.Content.y = this.viewH / 2
        let y = Math.ceil(this.Content.getPosition().y)
        let index = this.selectIndex ? this.selectIndex : Math.round((y - this.viewH / 2) / this.bgH)
        let ny = this.viewH / 2 + index * this.bgH
        this.ScrollView.setContentPosition(cc.v2(0, ny))
    }

    initScrollList() {
        let y = Math.ceil(this.Content.getPosition().y)
        let index = Math.round((y - this.viewH / 2) / this.bgH)
        let ny = this.viewH / 2 + index * this.bgH

        if (index < 0 || index >= this.Content.children.length) {
            return
        }
        this.Content.children[index].color = cc.color(255, 255, 255)
        this.Content.children[index].scale = 1
        this.Content.children[index].opacity = 255

        if (this.Content.children[index - 1]) {
            this.Content.children[index - 1].opacity = 150
            this.Content.children[index - 1].scale = 0.85
            this.Content.children[index - 1].color = cc.color(255, 255, 255)
        }
        if (this.Content.children[index - 2]) {
            this.Content.children[index - 2].opacity = 100
            this.Content.children[index - 2].scale = 0.7
            this.Content.children[index - 2].color = cc.color(255, 255, 255)
        }
        if (this.Content.children[index - 3]) {
            this.Content.children[index - 3].opacity = 100
            this.Content.children[index - 3].scale = 0.7
            this.Content.children[index - 3].color = cc.color(255, 255, 255)
        }
        if (this.Content.children[index + 1]) {
            this.Content.children[index + 1].opacity = 150
            this.Content.children[index + 1].scale = 0.85
            this.Content.children[index + 1].color = cc.color(255, 255, 255)
        }
        if (this.Content.children[index + 2]) {
            this.Content.children[index + 2].opacity = 100
            this.Content.children[index + 2].scale = 0.7
            this.Content.children[index + 2].color = cc.color(255, 255, 255)
        }
        if (this.Content.children[index + 3]) {
            this.Content.children[index + 3].opacity = 100
            this.Content.children[index + 3].scale = 0.7
            this.Content.children[index + 3].color = cc.color(255, 255, 255)
        }

        if (!this.ScrollView.isScrolling() && !this.ScrollView.isAutoScrolling()) {
            this.ScrollView.setContentPosition(cc.v2(0, ny))
        }
        this.selectIndex = index
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'cancel':
                this.close()
                break;
            case 'complete':
                let selectData = null
                for (let i = 0; i < Global.drawaBankList.length; i++) {
                    if (i == this.selectIndex) {
                        selectData = Global.drawaBankList[this.selectIndex]
                    }
                }
                this.close()
                ViewMgr.pushMessage('Bind', { key: 'setBankData', data: selectData })
                break;
        }
    }
}
