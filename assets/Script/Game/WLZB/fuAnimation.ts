
const {ccclass, property} = cc._decorator;

@ccclass
export default class fuAnimation extends cc.Component {



    onAnimCompleted () {
        cc.log('=====onAnimCompleted: param1[%s], param2[%s]');
        this.node.destroy();
    }


}
