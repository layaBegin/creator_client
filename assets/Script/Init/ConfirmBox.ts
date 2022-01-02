
const { ccclass, property } = cc._decorator;

@ccclass
export class ConfirmBox extends cc.Component {

    @property(cc.Label)
    content: cc.Label = undefined;
    @property(cc.Button)
    btnOk: cc.Button = undefined;
    @property(cc.Button)
    btnCancel: cc.Button = undefined;

    private _okCallback: () => void = undefined;
    private _cancelCallback: () => void = undefined;

    private _btnX: number = 0;

    init() {
        this._btnX = this.btnOk.node.x;
    }
    onLoad() {
    }

    show(content: string, okCallback?: () => void, cancelCallback?: () => void) {
        this._okCallback = okCallback;
        this._cancelCallback = cancelCallback;
        this.btnCancel.node.active = !!this._cancelCallback
        this.btnOk.node.active = true;      // 一定会有确认按钮显示
        this.btnOk.node.x = 0;      // 只有 OK 按钮则显示在中间
        if (this.btnCancel.node.active) {
            this.btnOk.node.x = this._btnX;
        }

        this.content.string = content || "";    // 防止 undefined 时报错

        this.node.active = true;
    }

    hide() {
        this.node.active = false
    }
    onClicked(event: cc.Event, param: string) {
        switch (param) {
            case 'ok':
                if (typeof this._okCallback === "function") {
                    this._okCallback();
                }
                break;
            case 'cancel':
                if (typeof this._cancelCallback === "function") {
                    this._cancelCallback();
                }
                break;
        }
        this._okCallback = undefined;
        this._cancelCallback = undefined;
        // 关闭界面
        this.node.active = false;
    }

}
