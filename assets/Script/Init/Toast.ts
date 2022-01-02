
const { ccclass, property } = cc._decorator;



@ccclass
export class Toast extends cc.Component {
    private _toastPool: cc.NodePool = undefined;

    initToast(node: cc.Node, content: string) {    //要显示的内容
        let label = node.getChildByName("content").getComponent(cc.Label);
        label.string = content;
        let width = label.node.width + 50;
        // node.width = width;
        node.opacity = 255;
        node.setPosition(0, 0);
    }


    init() {

        if (!this._toastPool) {
            this._toastPool = new cc.NodePool();   // 使用当前组件控制对象池
        }
        for (let i = 0; i < 5; i++) {
            let node = cc.instantiate(this.node.children[0]);
            this._toastPool.put(node);
        }
    }


    makeText(content: string, duration: number = 0.8, length: number = 150) {
        let node = this.makeToastNode(content);
        node.active = true;
        // action
        let action = this.getAction(duration, length);
        node.runAction(action);
    }

    private makeToastNode(content: string) {
        let node: cc.Node = undefined;
        if (this._toastPool.size() > 0) {
            node = this._toastPool.get();
        }
        else {
            node = cc.instantiate(this.node.children[0]);
        }

        this.initToast(node, content);

        node.parent = this.node;
        return node;
    }

    getAction(duration: number, length: number) {
        let ac1 = cc.spawn(cc.moveBy(duration, cc.v2(0, length)), cc.fadeTo(duration, 200))
        let ac = cc.sequence(ac1, cc.callFunc((target) => {
            target.stopAllActions();
            this._toastPool.put(target);
        }));
        return ac;
    }

}
