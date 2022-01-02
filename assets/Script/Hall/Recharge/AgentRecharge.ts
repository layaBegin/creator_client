import BaseView from "../../BaseClass/BaseView";

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
export default class agentRecharge extends BaseView {


    @property(cc.Node)
    cotent: cc.Node = undefined;
    @property(cc.Node)
    error: cc.Node = undefined;

    @property(cc.Label)
    myID: cc.Label = null;
    @property(cc.Node)
    agentItemContent: cc.Node = undefined
    @property(cc.Label)
    agentName: cc.Label = undefined
    @property(cc.Label)
    agentweChat: cc.Label = undefined
    @property(cc.Button)
    agentComplaint: cc.Button = undefined

    @property(cc.EditBox)
    complaintWechat: cc.EditBox = undefined
    @property(cc.EditBox)
    complaintContent: cc.EditBox = undefined

    agentRechargeList = undefined

    init() {
        this.myID.string = Global.Player.getPy('uid')
        Global.API.hall.getAgentRechargeConfigs((msg) => {
            if (msg.msg.length == 0) {
                this.cotent.active = false
                this.error.active = true
            } else {
                this.agentRechargeList = msg.msg
                this.initAgent()
                this.cotent.active = true
                this.error.active = false
            }
        }, (msg) => {
            this.cotent.active = false
            this.error.active = true
        })
    }

    //生成充值代理
    initAgent() {
        let newdata: any = this.randomAgent(this.agentRechargeList, 6)
        if (!newdata) {
            return
        }
        newdata.sort(function (a, b) {
            return b.sort - a.sort
        });

        for (let i = 0; i < this.agentItemContent.children.length; i++) {
            this.agentItemContent.children[i].stopAllActions()
            this.agentItemContent.children[i].active = false
        }
        for (let i = 0; i < newdata.length; i++) {
            let item = this.agentItemContent.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.agentItemContent.children[0]);
            }
            item.active = true
            item.opacity = 0
            item.getChildByName('name').getComponent(cc.Label).string = newdata[i].agentName;
            let action = cc.sequence(cc.delayTime(0.05 + i * 0.15), cc.fadeIn(0.3))
            item.runAction(action)
            item.parent = this.agentItemContent;
            item.getChildByName('btn').getComponent(cc.Button).clickEvents[0].customEventData = newdata[i]
        }
    }
    //随机获取充值代理
    randomAgent(arr: any[], maxNum) {
        var numArr = [];
        var newarr = arr.slice();
        // var newarr = arr.concat([]);
        var arrLength = arr.length;
        if (arrLength <= maxNum) {
            return arr
        }
        for (var i = 0; i < arrLength; i++) {
            //取出随机数 
            var number = Math.floor(Math.random() * newarr.length); //生成随机数num
            numArr.push(newarr[number]); //往新建的数组里面传入数值
            newarr.splice(number, 1); //传入一个删除一个，避免重复
            if (newarr.length <= arrLength - maxNum) {
                return numArr;
            }
        }
    }

    //点击代理充值
    ClkAgentRecharge(event, param) {
        ViewMgr.open('Recharge/agentRecharge', null, (msg) => {
            this.agentName.string = param.agentName
            this.agentweChat.string = param.weChat
            this.agentComplaint.clickEvents[0].customEventData = param.weChat
        })
    }

    //点击代理投诉
    ClkAgentComplaint(event, param) {
        ViewMgr.open('Recharge/complaint', null, (msg) => {
            this.complaintContent.string = ''
            this.complaintWechat.string = ''
            if (param && param != '') {
                this.complaintWechat.string = param
            }
        })
    }
    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'copy':
                Global.SDK.copyText(Global.Player.getPy('uid'))
                break;
            case 'change':
                this.initAgent()
                break;
            case 'closeAgent':
                ViewMgr.close('Recharge/agentRecharge')
                break;
            case 'copyAgentWeChat':
                Global.SDK.copyText(this.agentweChat.string)
                break;
            case 'closeComplaint':
                ViewMgr.close('Recharge/complaint')
                break;
            case 'complaintAgent':
                if (!this.inputOK()) return;

                let data = {
                    weChat: this.complaintWechat.string,
                    content: this.complaintContent.string,
                }
                Waiting.show()
                Global.API.hall.complaintAgent(data, (msg) => {
                    Waiting.hide()
                    Tip.makeText('投诉成功')
                    ViewMgr.close('Recharge/complaint')
                })

                break;
        }
    }

    /**
* 输入检查
*/
    inputOK() {
        let weChat = this.complaintWechat.string;
        let content = this.complaintContent.string;
        if (!weChat) {
            Tip.makeText("请输入代理微信号!");
            return false;
        }
        if (!content) {
            Tip.makeText("请输入投诉内容!");
            return false;
        }
        return true;

    }
}
