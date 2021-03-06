import BaseView from "../../BaseClass/BaseView";
import {Actions} from "../../Actions";
import {SHZModel} from "./SHZModel";
import SHZProto = require('./SHZProto');

const {ccclass, property} = cc._decorator;

let SCALE_ZEOR = 0.001;

@ccclass
export default class DiceLayer extends BaseView {
    @property(dragonBones.ArmatureDisplay)
    waitAni:dragonBones.ArmatureDisplay = undefined;
    @property(dragonBones.ArmatureDisplay)
    yaojiangAni:dragonBones.ArmatureDisplay = undefined;
    @property(dragonBones.ArmatureDisplay)
    weizhongjiangAni: dragonBones.ArmatureDisplay = undefined;
    @property(dragonBones.ArmatureDisplay)
    zhongjiangAni:dragonBones.ArmatureDisplay = undefined;
    @property(cc.Sprite)
    xiaotouzi1:cc.Sprite = undefined;
    @property(cc.Sprite)
    xiaotouzi2:cc.Sprite = undefined;
    @property(cc.Node)
    datouziArr:cc.Node[] = [];
    @property(cc.Node)
    goldSpr:cc.Node = undefined;
    @property(cc.Node)
    buttons:cc.Node[] = [];
    @property(cc.Label)
    winNumLab:cc.Label = undefined;
    @property(cc.Label)
    userName:cc.Label = undefined;

    resultTips:cc.Node = undefined;
    private SHZMain: any;
    private waitTimer: number;

    bgVolume:number = null;

    start() {
        var nickname = SHZModel.getInstance().getNickname();
        this.userName.string = nickname.toString();
        var winNumLab = SHZModel.getInstance().getPrizePreRound().toFixed(2);
        this.winNumLab.string = winNumLab.toString();

        this.waitAni.playAnimation("Sprite",0);
        Global.MessageCallback.addListener('GameMessagePush', this);
        var callFunc1 = function () {
            this.weizhongjiangAni.node.active = false;
        };
        var callFunc2 = function () {
            this.zhongjiangAni.node.active = false;
        };
        this.weizhongjiangAni.on(dragonBones.EventObject.COMPLETE,callFunc1,this);
        this.zhongjiangAni.on(dragonBones.EventObject.COMPLETE,callFunc2,this);

        this.SHZMain = this.node.parent.getComponent("SHZMain");
    }

    messageCallbackHandler(router,msg) {
        if (router === "GameMessagePush") {
            if (msg.type === SHZProto.ROB_START_DICE_PUSH) {
                this.startDice(msg.data.enddata);
            }
        }
    }
    /**
     * ????????????
     */
    async show(showAction: boolean = true, isWait: boolean = true) {
        let widget = this.node.getComponent(cc.Widget);
        this.node.active = true;
        if (widget && widget.enabled) {       // ?????????????????? widget ?????? ?????? scale ????????? widget ????????????????????????????????? size ????????????
            // this.node.scale = 1;
            widget.updateAlignment();
            widget.enabled = false;
        }
        this.node.setPosition(- cc.winSize.width/2,0);
        if (showAction && this._isShowAction) {
            await Actions.runActionSync(this.node, cc.tween()
                .to(0.3, { position: cc.v2(0, 0) }).
                call(function () {

                    }.bind(this))
                );
        }
        else {
            this.node.setPosition(0, 0);
            this.node.scale = 1;
        }
    }
    /**
     * ????????????
     * ?????????????????????????????????
     */
    async close(showAction: boolean = true) {
        if (this._isClosing) {  // ??????????????????
            return;
        }
        AudioMgr.stopSound(this._AudioID);
        if (showAction && this.node.active) {
            this._isClosing = true;
            var self = this;
            await Actions.runActionSync(this.node,
                cc.tween().
                to(0.3, { position: cc.v2(- cc.winSize.width/2, 0) }).
                call(() => {
                    self.node.destroy();
                })
            );
        }
        this._isClosing = false;
    }

    // ???????????????
    startDice (endData) {
        let gameData = endData;
        var delay = gameData.winPrize > 0 ? 1.65 : 1.05;
        AudioMgr.playSound("Game/SHZ/sound/sound_water_compare_rock");

        // ??????????????????
        this.changeButtonStatus(false);
        // ????????????????????????
        this.stopTimer();

        // SoundEngine.playEffect("res/shuihuzhuan/sound/sound_water_compare_rock.mp3");

        this.node.runAction(cc.sequence(
            cc.callFunc(function () {
                this.waitAni.node.active = false;
                this.yaojiangAni.node.active = true;
                this.yaojiangAni.playAnimation("Sprite",1);
            }.bind(this)),
            cc.delayTime(1.95),
            cc.callFunc(function () {
                // ?????????????????????
                this.updateDiceNum(gameData);
                // ?????????????????????
                // this.showResultTip();
                // ????????????????????????
                this.updateWinNumLabel(gameData.winPrize);
                this.goldSpr.active = false;
            }.bind(this)),
            cc.delayTime(1.0),
            cc.callFunc(function () {
                this.showToast(gameData);
                this.bgVolume = AudioMgr.getMusicVolume();
                AudioMgr.setMusicVolume(0);
            }.bind(this)),
            cc.delayTime(1),
            //??????
            cc.callFunc(function () {
                this.yaojiangAni.node.active = false;
                AudioMgr.setMusicVolume(this.bgVolume);
                if (gameData.winPrize > 0) {
                    this.zhongjiangAni.node.active = true;
                    this.zhongjiangAni.playAnimation("Sprite",1);
                    // ??????????????????
                    // this.addFlagTip(gameData);

                    AudioMgr.playSound("Game/SHZ/sound/sound_water_compare_win");

                } else {
                    this.weizhongjiangAni.node.active = true;
                    this.weizhongjiangAni.playAnimation("Sprite",1);

                    AudioMgr.playSound("Game/SHZ/sound/sound_water_compare_lose");

                }
                // ??????????????????
                // this.winMoneyUp(this.gameData.winPrize);
                //

            }.bind(this)),
            cc.delayTime(delay),
            cc.callFunc(function () {
                // ???????????????
                this.xiaotouzi1.node.active = false;
                this.xiaotouzi2.node.active = false;
                // this.setNodesVisible(this.smallDices, false);
            }.bind(this)),
            cc.delayTime(1.0),
            cc.callFunc(function () {
                this.resultTips.active = false;
                this.zhongjiangAni.node.active = false;
                this.weizhongjiangAni.node.active = false;
                this.waitAni.node.active = true;
                this.waitAni.playAnimation("Sprite",0);
                // ??????????????????
                this.changeButtonStatus(true);
                // ?????????????????????
                this.startTimer();
                // ????????????????????????
                if (gameData.winPrize <= 0) {
                    this.onBtnClick(null,"exit");
                    // this.onCloseButtonHandler(null);
                }
            }.bind(this))
        ));
    }
    // ????????????????????????
    updateWinNumLabel (winPrize) {
        winPrize = winPrize <= 0 ? 0 : winPrize;
        this.winNumLab.string = winPrize.toFixed(2);
        this.startTimer();
    }
    // ?????????????????????
    updateDiceNum (gameData) {
        let diceData = gameData.diceData;
        let flag = gameData.flag > 0 ? 2 : (gameData.flag === 0 ? 1 : 0);
        var num1 = diceData[0];
        var num2 = diceData[1];
        Global.CCHelper.updateSpriteFrame('Game/SHZ/compare/' + num1 + '_small', this.xiaotouzi1.getComponent(cc.Sprite),
            function () {
                this.xiaotouzi1.node.active = true;
            }.bind(this)
        );
        Global.CCHelper.updateSpriteFrame('Game/SHZ/compare/' + num2 + '_small', this.xiaotouzi2.getComponent(cc.Sprite),
            function () {
                this.xiaotouzi2.node.active = true;
            }.bind(this)
        );
        this.resultTips = this.datouziArr[flag];
        let datouziSprite1 = this.resultTips.getChildByName("1").getComponent(cc.Sprite);
        let datouziSprite2 = this.resultTips.getChildByName("2").getComponent(cc.Sprite);
        Global.CCHelper.updateSpriteFrame('Game/SHZ/compare/' + num1, datouziSprite1,()=>{
            Global.CCHelper.updateSpriteFrame('Game/SHZ/compare/' + num2, datouziSprite2,()=>{
                datouziSprite2.node.parent.active = true;
            })
        });
    }
    // ?????????????????????
    changeGoldPoint (type) {
        var points = [cc.v2(-387,-157),cc.v2(0,-157),cc.v2(330,-157)];
        this.goldSpr.setPosition(points[type]);
        this.goldSpr.active = true;
    }
    // ??????????????????
    changeButtonStatus (enabled) {
        cc.log("=========??????????????????");
        if (!this.buttons) return;
        for (let i = 0, num = this.buttons.length; i < num; i++) {
            let btn = this.buttons[i];
            let btnSprite = btn.getChildByName("icon");
            let gray = enabled ? 0 : 1;
            this.changeToGray(btnSprite,gray);
            btn.getComponent(cc.Button).interactable = enabled;
        }
    }
    /**
     * @param state 0: normal,1: gray
     */
    changeToGray(node, state) {
        node = node.getComponent(cc.Sprite);
        node.setState(state)
    }

    onBtnClick(event: cc.Event,param: string){
        if (param === "xiao"){
            this.changeGoldPoint(0);
            API.room.gameMessageNotify(SHZProto.gameStartdiceNotify(-1));
        }
        else if(param === "he"){
            this.changeGoldPoint(1);
            API.room.gameMessageNotify(SHZProto.gameStartdiceNotify(0));
        }
        else if(param === "da"){
            this.changeGoldPoint(2);
            API.room.gameMessageNotify(SHZProto.gameStartdiceNotify(1));
        }
        else if(param === "exit"){
            cc.log("======??????diceLayer gold???",SHZModel.getInstance().getGold());
            this.SHZMain.userGold.string = SHZModel.getInstance().getGold();
            let viewUrl = ViewMgr.getNodeUrl(this.node);
            this.SHZMain.changeButtonStatus(true);
            this.SHZMain.autoBtn.active = true;
            this.SHZMain.quxiaoBtn.active = false;
            this.stopTimer();
            ViewMgr.close(viewUrl);
        }
        AudioMgr.playSound("Game/SHZ/sound/sound_water_button");
    }

    showToast (data) {
        var num = 0;
        for (let i = 0, len = data.diceData.length; i < len; i++) {
            num += data.diceData[i];
        }
        var snd = "Game/SHZ/sound/sound_water_compare_point" + num;
        var txt = num + "???" + (data.flag > 0 ? "???" : (data.flag < 0 ? "???" : "???"));
        txt += data.winPrize > 0 ? " ?????????,???????????????????" : " ?????????,????????????????????????!";
        AudioMgr.playSound(snd);
        Tip.makeText(txt);
    }

    // ???????????????
    startTimer () {
        this.stopTimer();
        this.waitTimer = setInterval(function () {
            var snd = "Game/SHZ/sound/sound_water_compare_wait" + Global.Utils.getRandomNum(1, 5);
            AudioMgr.playSound(snd);
        }.bind(this), 10000);
    }

    // ???????????????
    stopTimer () {
        this.waitTimer && clearInterval(this.waitTimer);
        this.waitTimer = null;
    }

    onDestroy(){
        Global.MessageCallback.removeListener('GameMessagePush', this);
        this.waitTimer && clearInterval(this.waitTimer);
        this.waitTimer = null;
    }

}
