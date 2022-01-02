
const { ccclass, property } = cc._decorator;

@ccclass
export default class LHDBResult extends cc.Component {
    @property(cc.Node)
    resultItem: cc.Node = undefined;

    @property(cc.Node)
    resultAni: cc.Node = undefined;

    time = undefined

    init() {
        this.resultItem.active = false
    }

    async showResultItem(viewData, scoreData) {
        clearTimeout(this.time);
        this.resultItem.active = true
        this.resultAni.active = true
        Global.CCHelper.updateSpriteFrame("Game/TGPD2/candys/cd_" + viewData.kind, this.resultItem.getChildByName('candy'));
        let lineNum = this.resultItem.getChildByName('lineNum').getComponent(cc.Label);
        let score = this.resultItem.getChildByName('score').getComponent(cc.Label);
        lineNum.string = '*' + viewData.line.length;
        score.string = scoreData.toString();
        this.resultAni.getComponent(dragonBones.ArmatureDisplay).playAnimation("Sprite", 1)

        this.time = setTimeout(() => {
            this.resultItem.active = false
        }, 1000);

    }

}