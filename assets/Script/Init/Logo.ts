
const { ccclass, property } = cc._decorator;

@ccclass
export default class Logo extends cc.Component {

    onLoad() {

        cc.director.loadScene("Init");
    }

}
