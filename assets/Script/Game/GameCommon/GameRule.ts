import BaseView from "../../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameRule extends BaseView {

    @property(cc.Label)
    profitPercentageValue: cc.Label = null;

    @property(cc.Node)
    toggleNode: cc.Node = undefined

    @property(cc.Node)
    ruleContent: cc.Node = undefined

    @property(cc.Node)
    desContent: cc.Node = undefined

    init(data) {
        this.profitPercentageValue.string = (data.profitPercentage | 0) + "%";

        let node = this.ruleContent.getChildByName(data.kind.toString());
        if (!!node) node.active = true;
        let introduce = this.desContent.getChildByName(data.kind.toString());
        if (!!introduce) introduce.active = true;
        this.toggleNode.children[0].getComponent(cc.Toggle).isChecked = true
    }

    closeEvent() {
        Global.CCHelper.playPreSound();
        this.close()
    }

    updateUI() {
        Global.CCHelper.playPreSound();
        this.desContent.parent.parent.getComponent(cc.ScrollView).scrollToTop(0)
        this.ruleContent.parent.parent.getComponent(cc.ScrollView).scrollToTop(0)
    }

}
