import { BaseUser } from "../BaseClass/BaseUser";


const { ccclass, property } = cc._decorator;

@ccclass
export default class UserInfo extends BaseUser {
    @property(cc.Label)
    private bank_: cc.Label = undefined;

    get bank() { return +this.bank_.string }
    set bank(v: number) { this.bank_.string = <any>v }



}
