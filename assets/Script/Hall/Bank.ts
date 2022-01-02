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
export default class Bank extends BaseView {

    @property(cc.Node)
    inGroup: cc.Node = undefined

    @property(cc.Node)
    outGroup: cc.Node = undefined

    @property(cc.Label)
    goldNum: cc.Label = undefined

    @property(cc.Label)
    bankGoldNum: cc.Label = undefined

    @property(cc.EditBox)
    outEdit: cc.EditBox = undefined

    @property(cc.EditBox)
    inEdit: cc.EditBox = undefined

    @property(cc.Node)
    LeftToggle: cc.Node = undefined


    async init() {
        if (AudioConfig._Bank) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/bank");
            AudioConfig._Bank = false
        }
        this.showInGroup();
        this.updateGold();
        this.inEdit.string = '';
        this.outEdit.string = '';
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    }
    showInGroup() {
        this.inEdit.string = '';
        this.LeftToggle.children[0].getComponent(cc.Toggle).isChecked = true
        this.inGroup.active = true;
        this.outGroup.active = false;
    }

    showOutGroup() {
        this.outEdit.string = '';
        this.inGroup.active = false;
        this.outGroup.active = true;
    }

    updateGold() {
        this.goldNum.string = Global.Player.getPy('gold');
        this.bankGoldNum.string = Global.Player.getPy('safeGold');
    }

    // updateEditText() {
    //     this.inEdit.string = Math.floor(inProgress * Global.Player.getPy('gold'));
    //     this.outEdit.string = Math.floor(outProgress * Global.Player.getPy('safeGold'));
    // }
    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }
    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.updateGold();
                // this.updateEditText();
                break;
        }
    }
    onBtnClkInput(event, param) {
        Global.CCHelper.playPreSound();
        if (param == "del") {
            //this.inEdit.string 有可能取出数字类型 无法截取 需要手动转字符串
            if (this.inGroup.active) {
                this.inEdit.string = (this.inEdit.string + '').substring(0, (this.inEdit.string + '').length - 1);
            } else {
                this.outEdit.string = (this.outEdit.string + '').substring(0, (this.outEdit.string + '').length - 1);
            }
        } else {
            if (this.inGroup.active) {
                this.inEdit.string = this.inEdit.string + param;
                let inNum = this.inEdit.string;
                if (inNum === '') { } else {
                    if (Number(inNum) > Number(Global.Player.getPy('gold'))) {
                        this.inEdit.string = Global.Player.getPy('gold')
                    }
                }

            } else {
                this.outEdit.string = this.outEdit.string + param;
                let outNum = this.outEdit.string;
                if (outNum === '') { } else {
                    if (Number(outNum) > Number(Global.Player.getPy('safeGold'))) {
                        this.outEdit.string = Global.Player.getPy('safeGold')
                    }
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
            case 'in':
                this.showInGroup();
                break;
            case 'out':
                this.showOutGroup();
                break;
            case 'clear':
                if (this.inGroup.active) {
                    this.inEdit.string = '';
                } else {
                    this.outEdit.string = '';
                }
                break;
            case 'confirm_in':
                let inNum = (Number(this.inEdit.string)).toFixed(2);
                if (Number(inNum) == 0) {
                    Tip.makeText('请输入正确的金额！');
                    this.inEdit.string = '';
                    return;
                }
                let isnum = /^\d+\.\d+$/.test(inNum)
                if (!isnum) {
                    Tip.makeText('请输入正确的金额！');
                    this.inEdit.string = '';
                    return;
                }
                if (Number(inNum) > Number(Global.Player.getPy('gold'))) {
                    Tip.makeText('您携带的金额不足！');
                    this.inEdit.string = '';
                    return;
                }

                Waiting.show();
                Global.API.hall.safeBoxOperationRequest(inNum, null, function () {
                    Waiting.hide();
                    Tip.makeText('存入成功！');
                    this.inEdit.string = '';
                }.bind(this));
                break;
            case 'confirm_out':
                let outNum = (Number(this.outEdit.string)).toFixed(2);
                let isoutNum = /^\d+\.\d+$/.test(outNum)
                if (Number(outNum) == 0) {
                    Tip.makeText('请输入正确的金额！');
                    this.inEdit.string = '';
                    return;
                }
                if (!isoutNum) {
                    Tip.makeText('请输入正确的金额！');
                    this.outEdit.string = ''
                    return;
                }
                if (Number(outNum) > Number(Global.Player.getPy('safeGold'))) {
                    Tip.makeText('保险柜金额不足！');
                    this.outEdit.string = ''
                    return;
                }

                Waiting.show();
                Global.API.hall.safeBoxOperationRequest(Number(outNum) * -1, null, function () {
                    Waiting.hide();
                    Tip.makeText('取出成功！');
                    this.outEdit.string = '';
                }.bind(this));
                break;
        }
    }
    // update (dt) {}
}
