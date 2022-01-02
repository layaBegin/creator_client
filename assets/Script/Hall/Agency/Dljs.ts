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
export default class Dljs extends BaseView {

    @property(cc.Node)
    content: cc.Node = undefined;

    init() {
        let data = Global.AgentProfit.getData();
        if (data.length == 0) {
            Tip.makeText("暂无配置信息")
            return
        }
        for (let i = 0; i < data.length; i++) {
            let item = this.content.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.content.children[0]);
            }
            item.active = true
            item.getChildByName('level').getComponent(cc.Label).string = data[i].level;
            item.getChildByName('score').getComponent(cc.Label).string = data[i].min + "-" + (data[i].max == -1 ? '不限' : data[i].max);
            item.getChildByName('money').getComponent(cc.Label).string = (data[i].proportion * 10000) + ""
            item.parent = this.content;
        }
    }
}
