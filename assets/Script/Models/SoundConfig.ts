
// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

export class SoundConfig {

    constructor() {
        this.init()
    }

    _Agency: boolean = undefined
    _Bank: boolean = undefined
    _Custom: boolean = undefined
    _Exchange: boolean = undefined
    _Login: boolean = undefined
    _Mail: boolean = undefined
    _Notice: boolean = undefined
    _Recharge: boolean = undefined
    _Sign: boolean = undefined
    _Wash: boolean = undefined
    _Wheel: boolean = undefined


    init() {
        this._Agency = true
        this._Bank = true
        this._Custom = true
        this._Exchange = true
        this._Login = true
        this._Mail = true
        this._Notice = true
        this._Recharge = true
        this._Sign = true
        this._Wash = true
        this._Wheel = true
    }
}
