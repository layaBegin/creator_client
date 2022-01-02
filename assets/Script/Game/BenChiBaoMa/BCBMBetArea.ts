const {ccclass, property} = cc._decorator;

@ccclass
export default class BCBMBetArea extends cc.Component {

    @property(cc.Button)
    btn_area:cc.Button = null;
    @property(cc.Sprite)
    sp_carIcon:cc.Sprite = null;
    @property(cc.Node)
    node_betJetton:cc.Node = null;

    start () {

    }
}
