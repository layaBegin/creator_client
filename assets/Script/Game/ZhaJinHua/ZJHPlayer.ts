// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class ZJHPlayer extends cc.Component {
    @property(cc.Sprite)
    avatarImg: cc.Sprite = undefined
    @property(cc.Label)
    nameLabel: cc.Label = undefined
    @property(cc.Label)
    goldNum: cc.Label = undefined
    @property(cc.Sprite)
    statusBg: cc.Sprite = undefined
    @property(cc.Label)
    statusLabel: cc.Label = undefined
    @property(cc.Sprite)
    firstXiaZhuUI: cc.Sprite = undefined
    @property(cc.Sprite)
    loseMask: cc.Sprite = undefined
    @property(cc.Prefab)
    winResultPrefab: cc.Prefab = undefined
    @property(cc.Node)
    cardGroup: cc.Node = undefined
    @property(cc.Node)
    readyGroup: cc.Node = undefined
    @property(cc.Node)
    lookCardFlag: cc.Node = undefined
    @property(cc.Node)
    giveUpFlag: cc.Node = undefined
    @property(cc.Node)
    statusGroup: cc.Node = undefined
    @property(cc.Node)
    stakeGoldGroup: cc.Node = undefined
    @property(cc.Label)
    stakeGoldNum: cc.Label = undefined
    @property(cc.Label)
    addGoldEff: cc.Label = undefined
    @property(cc.Label)
    minusGoldEff: cc.Label = undefined
    @property(cc.Sprite)
    qipao: cc.Sprite = undefined

    firstXiaZhuFlag = false
    userInfo = null
    onLoad() {
        this.lookCardFlag.active = false;
        this.giveUpFlag.active = false;
        this.firstXiaZhuFlag = false;
    }
    updateUI(userInfo) {
        this.userInfo = userInfo;
        cc.log('++++++++++++', userInfo)
        // 设置信息
        Global.CCHelper.updateSpriteFrame(this.userInfo.avatar, this.avatarImg.node.getComponent(cc.Sprite));
        if (this.userInfo.uid == Global.Player.getPy('uid')) {
            this.nameLabel.string = this.userInfo.nickname;
        } else {
            this.nameLabel.string = Global.Player.convertNickname(this.userInfo.nickname);
        }

        this.goldNum.string = this.userInfo.gold.toFixed(2);
        this.stakeGoldNum.string = "0";
    }
}
