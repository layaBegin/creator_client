import BaseComponent from "./BaseComponent";

const { ccclass, property } = cc._decorator;

@ccclass
export class BaseUser extends BaseComponent {

    @property(cc.Sprite)
    headImg_: cc.Sprite = undefined;
    @property(cc.Label)
    private id_: cc.Label = undefined;
    @property(cc.Label)
    private nickName_: cc.Label = undefined;
    @property(cc.Label)
    private gold_: cc.Label = undefined;
    @property(cc.Label)
    private vip_: cc.Label = undefined;

    get headImg() { return this.headImg_.spriteFrame }
    set headImg(v: cc.SpriteFrame | string) {
        if (typeof v === "string") {
            AssetMgr.loadResSync(v, cc.SpriteFrame, undefined, (err, res) => {
                if (!err) {
                    this.headImg_.spriteFrame = res;
                }
            });
        }
        else {
            this.headImg_.spriteFrame = v
        }
    }

    get id() { return this.id_.string }
    set id(v: string) { this.id_.string = v }

    get nickName() { return this.nickName_.string }
    set nickName(v: string) { this.nickName_.string = v }

    get gold() {
        let num = Number(this.gold_.string);
        if (CC_DEBUG && isNaN(num)) {
            Debug.assert(true, "当前金币 Label 不是数字字符串::" + this.gold_.string);
            num = 0;
            this.gold_.string = "0";
        }
        return num;
    }
    set gold(v: number) {
        if (v == undefined) {
            v = 0;
            CC_DEBUG && Debug.assert(true, "设置金币数值错误 v=undefined");
        }
        this.gold_.string = v.toString()
    }

    get vip() { return this.vip_.string }
    set vip(v: string) { this.vip_.string = v }


}
