
const { ccclass, property } = cc._decorator;

@ccclass
export class WaitingLayer extends cc.Component {

    @property(cc.Label)
    tip: cc.Label = undefined;
    @property(cc.Label)
    progress: cc.Label = undefined;
    @property(cc.Sprite)
    loadingSprite: cc.Sprite = undefined;

    private static _waitingCount: number = 0;
    private _action: cc.Tween = undefined;



    show(tip?: string, ignoreCount: boolean = false) {
        if (!this.isWaiting() || !ignoreCount) {  // 当 节点已经在显示的时候 允许设置忽略计数
            console.log("显示 loading");
            WaitingLayer._waitingCount++;
        }

        this.node.active = true;
        if (tip == undefined) {
            tip = "";
        }
        this.tip.string = tip;
        this.progress.string = "";
        this.startAction();
    }



    setProgress(p: number | string = "") {
        this.progress.string = <string>p;   // 引擎内部执行了 toString 此处只要忽略类型检查即可 避免执行多余代码
    }
    hide(count = 1) {
        console.log("隐藏 loading");
        WaitingLayer._waitingCount -= count;
        if (WaitingLayer._waitingCount <= 0) {
            WaitingLayer._waitingCount = 0;
            this.stopAction();
            this.node.active = false;
        }
        else if (CC_DEV) {
            console.log("还有 %s 个等待", WaitingLayer._waitingCount);
        }
    }
    isWaiting() {
        return this.node.active;
    }

    private startAction() {
        let action = this._generateAction(this.loadingSprite.node);
        this._action = action.start();
    }

    private stopAction() {
        if (this._action) {
            this._action.stop();
        }
    }

    private _generateAction(target: cc.Node) {
        return cc.tween(target)
            .by(2, { rotation: 360 }, { easing: 'sineOut' })
            .repeatForever();
    }


}
