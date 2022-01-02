
const { ccclass, property } = cc._decorator;

@ccclass
export default class Poker extends cc.Component {

    _sprite: cc.Sprite = undefined
    get sprite() {
        if (!this._sprite) {
            this._sprite = this.node.getComponent(cc.Sprite);
        }
        return this._sprite;
    }
    _touchColor: cc.Color = cc.color(200, 200, 200);
    _untouchColor: cc.Color = cc.color(255, 255, 255);

    _value: number = -1;
    set value(v: number) {
        if (this._value == v && this.sprite.spriteFrame) {
            return;
        }
        this._value = v;
        this.setSpriteFrame(v + "");
    }
    get value() {
        return this._value;
    }

    get isSelected() {
        return this.node.y == 25;
    }
    get isTouched() {
        return this.node.color.toHEX("#rrggbb") == "200200200";
    }
    touched: boolean = false;

    setTouch(isTouch: boolean) {
        this.node.color = isTouch ? this._touchColor : this._untouchColor;
    }
    setSelecte(isSelected: boolean) {
        this.node.y = isSelected ? 25 : 0;
        this.setTouch(false);       // 消除选中状态
    }

    async setSpriteFrame(value: string) {
        let sp = await AssetMgr.loadResSync(Global.CCHelper.get10CardUrl(value), cc.SpriteFrame);
        if (!cc.isValid(this)) {
            return;
        }
        this.sprite.spriteFrame = sp;
    }

    reset() {
        this.node.y = 0;
        this.node.color = this._untouchColor;
        this.sprite.spriteFrame = null;
    }

}
