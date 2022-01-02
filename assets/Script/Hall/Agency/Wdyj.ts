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
export default class Wdyj extends cc.Component {


    @property(cc.Node)
    yeji: cc.Node = undefined;

    @property(cc.Node)
    yongjin: cc.Node = undefined;

    @property(cc.Node)
    hydl: cc.Node = undefined;




    init() {
        let num = (Global.Player.getPy('directlyMemberAchievement') + Global.Player.getPy('agentMemberAchievement')).toFixed(2) || 0
        this.yeji.getChildByName('today').getComponent(cc.Label).string = num
        this.yeji.getChildByName('todayzs').getComponent(cc.Label).string = (Global.Player.getPy('directlyMemberAchievement')).toFixed(2) || 0
        this.yeji.getChildByName('todaydl').getComponent(cc.Label).string = (Global.Player.getPy('agentMemberAchievement')).toFixed(2) || 0
        this.yeji.getChildByName('yesterday').getComponent(cc.Label).string = (Global.Player.getPy('yesterDayDirectlyMemberAchievement') + Global.Player.getPy('yesterDayAgentMemberAchievement')).toFixed(2) || 0
        this.yeji.getChildByName('yesterdayzs').getComponent(cc.Label).string = (Global.Player.getPy('yesterDayDirectlyMemberAchievement')).toFixed(2) || 0
        this.yeji.getChildByName('yesterdaydl').getComponent(cc.Label).string = (Global.Player.getPy('yesterDayAgentMemberAchievement')).toFixed(2) || 0


        //当天我的佣金客户端根据比例计算

        let profit = Global.AgentProfit.getProportionByNum(num);
        let LowerAgentCommision = (num * profit.proportion - Global.Player.getPy('toDayLowerAgentCommision')).toFixed(2);//本周我的佣金
        this.yongjin.getChildByName('today').getComponent(cc.Label).string = LowerAgentCommision// (Global.Player.getPy('toDayLowerAgentCommision')).toFixed(2) || 0
        this.yongjin.getChildByName('yesterday').getComponent(cc.Label).string = (Global.Player.getPy('yesterDayMeAgentCommision')).toFixed(2) || 0
        this.yongjin.getChildByName('all').getComponent(cc.Label).string = (Global.Player.getPy('totalCommision')).toFixed(2) || 0
        this.yongjin.getChildByName('can').getComponent(cc.Label).string = (Global.Player.getPy('realCommision')).toFixed(2) || 0
        // this.yongjin.getChildByName('xia').getComponent(cc.Label).string = (Global.Player.getPy('lowerAgentCommision')).toFixed(2) || 0


        this.hydl.getChildByName('memberNum').getComponent(cc.Label).string = Global.Player.getPy('directlyMemberCount') || 0
        this.hydl.getChildByName('today').getComponent(cc.Label).string = Global.Player.getPy('toDayAddedDirectlyMemberCount') || 0
        this.hydl.getChildByName('yesterday').getComponent(cc.Label).string = Global.Player.getPy('yesterDayAddedDirectlyMemberCount') || 0
        this.hydl.getChildByName('week').getComponent(cc.Label).string = Global.Player.getPy('weekAddedDirectlyMemberCount') || 0
        this.hydl.getChildByName('month').getComponent(cc.Label).string = Global.Player.getPy('monthAddedDirectlyMemberCount') || 0
        this.hydl.getChildByName('dailiNum').getComponent(cc.Label).string = Global.Player.getPy('agentMemberCount') || 0
        this.hydl.getChildByName('dlToday').getComponent(cc.Label).string = Global.Player.getPy('toDayAddedAgentMemberCount') || 0
        this.hydl.getChildByName('dlYesterday').getComponent(cc.Label).string = Global.Player.getPy('yesterDayAddedAgentMemberCount') || 0
        this.hydl.getChildByName('dlWeek').getComponent(cc.Label).string = Global.Player.getPy('weekAddedAgentMemberCount') || 0
        this.hydl.getChildByName('dlMonth').getComponent(cc.Label).string = Global.Player.getPy('monthAddedAgentMemberCount') || 0
    }

    // update (dt) {}
}
