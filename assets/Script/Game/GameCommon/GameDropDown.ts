import BaseView from "../../BaseClass/BaseView";
import { Actions } from "../../Actions";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameDropDown extends BaseView {

    @property(cc.Toggle)
    switchBtn: cc.Toggle = undefined;
    @property(cc.Node)
    panel: cc.Node = undefined;
    @property(cc.Toggle)
    effectBtn: cc.Toggle = undefined;
    @property(cc.Toggle)
    musicBtn: cc.Toggle = undefined;
    @property(cc.Node)
    closeBtn: cc.Node = undefined;
    @property
    duration: number = 0.1;

    kindID: number;
    profitPercentage: number;

    setGameInfo(kindID: number, profitPercentage: number) {
        this.kindID = kindID || 0;
        this.profitPercentage = profitPercentage;
    }

    start() {
        // 获取当前游戏 kindId
        this.kindID = Matching.kindId;
        // 根据音量显示按钮状态
        let volume = cc.sys.localStorage.getItem('MusicVolume');
        if (volume > 0) {
            this.musicBtn.isChecked = true;
        } else {
            this.musicBtn.isChecked = false;
        }
        volume = cc.sys.localStorage.getItem('SoundVolume');
        if (volume > 0) {
            this.effectBtn.isChecked = true;
        } else {
            this.effectBtn.isChecked = false;
        }

        this.closeBtn.active = false;
    }


    onClickSwitchBtn(toggle: cc.Toggle) {
        !CC_EDITOR && AudioMgr.playCommonSoundClickButton();

        if (toggle.isChecked) {
            this.showPanel();
        }
        else {
            this.hidePanel();
        }
    }
    onClickEffectBtn(toggle: cc.Toggle, isHideBg: string) {
        if (!CC_EDITOR) {
            AudioMgr.playCommonSoundClickButton();
            if (toggle.isChecked) {
                AudioMgr.setSoundVolume(1);
            }
            else {
                AudioMgr.setSoundVolume(0);
            }
        }

        if (isHideBg == "1") {
            toggle.node.getChildByName("Background").active = !toggle.isChecked;
        }
    }
    onClickMusicBtn(toggle: cc.Toggle, isHideBg: string) {
        if (!CC_EDITOR) {
            AudioMgr.playCommonSoundClickButton();
            if (toggle.isChecked) {
                AudioMgr.setMusicVolume(1);
            }
            else {
                AudioMgr.setMusicVolume(0);
            }
        }

        if (isHideBg == "1") {
            toggle.node.getChildByName("Background").active = !toggle.isChecked;
        }
    }
    async showPanel() {
        this.closeBtn.active = true;
        let endPos = cc.v2(this.panel.x, 0);
        let tween = cc.tween().
            to(this.duration, { position: endPos })
            ;

        await Actions.runActionSync(this.panel, tween);
    }
    async hidePanel() {
        this.closeBtn.active = false;
        let endPos = cc.v2(this.panel.x, this.panel.height + 50);
        let tween = cc.tween().
            to(this.duration, { position: endPos })
            ;
        await Actions.runActionSync(this.panel, tween);
    }
    //点击返回大厅按钮
    onClickHallBtn() {
        AudioMgr.playCommonSoundClickButton();

        Confirm.show('确认退出游戏?', function () {
            if (Global.Player.getPy('roomID')) {
                Waiting.show();
                Global.API.room.roomMessageNotify(Global.API.roomProto.userLeaveRoomNotify());
            } else {
                ViewMgr.goBackHall(this.kindID);
            }
        }.bind(this), function () { });
    }

    //点击规则按钮
    onClickRuleBtn() {
        AudioMgr.playCommonSoundClickButton();

        if (!!this.kindID) {
            let gameInfo = {
                kind: this.kindID,
                profitPercentage: this.profitPercentage
            };

            ViewMgr.open({
                viewUrl: "GameRule",
                prefabUrl: "GameCommon/GameRule/GameRule"
            }, {
                    key: "init",
                    data: gameInfo
                }, function () {
                    Waiting.hide();
                })
        } else {
            Confirm.show("没有传入有效游戏类型ID");
        }
    }

    /***
     * 点击规则按钮 可以根据不同的param 打开不同的帮助界面
     * @param event
     * @param param
     */
    onBtnClick(event:cc.Event,param:string){
        if (param === "rule_413") {
            let gameInfo = {
                kind: this.kindID,
                profitPercentage: this.profitPercentage
            };
            ViewMgr.open({
                viewUrl: "WLZBHelp",
                prefabUrl: "Game/WLZB/WLZBHelp"
            }, {
                key: "init",
                data: gameInfo
            }, function () {
                Waiting.hide();
            })
        }

    }

    //点击关闭按钮
    onClickCloseBtn() {

        this.switchBtn.uncheck();
    }

}
