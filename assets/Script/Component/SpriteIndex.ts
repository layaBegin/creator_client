
const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
@requireComponent(cc.Sprite)
export default class SpriteIndex extends cc.Component {

    @property([cc.SpriteFrame])
    atlas: cc.SpriteFrame[] = [];

    private _sprite: cc.Sprite = undefined;

    private _status: number = 0;
    get status() { return this._status };

    get sprite() {
        if (!cc.isValid(this._sprite)) {
            this._sprite = this.node.getComponent(cc.Sprite);
        }
        return this._sprite;
    }

    start() {

    }
    displayByIndex(index: number) {
        this.sprite.spriteFrame = this.atlas[index];
        this._status = this.atlas[index] ? index : -1;
    }

    displayByName(name: string) {
        for (let i = 0; i < this.atlas.length; i++) {
            if (this.atlas[i].name == name) {
                this.sprite.spriteFrame = this.atlas[i];
                this._status = i;
                return;
            }
        }
        this._status = -1;
        this.sprite.spriteFrame = null;
    }
    getSpriteFrameByIndex(index: number) {
        return this.atlas[index];
    }
}
