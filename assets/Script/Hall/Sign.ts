import BaseView from "../BaseClass/BaseView";
import HallApi = require('../API/HallAPI');
// import SignModel from "./SignModel";


enum SignState {
    CAN = 0,//还未签到,可以签到
    CANT = 1,//不能签到了
    DONE = 2,//已经签到

}
const { ccclass, property } = cc._decorator;
@ccclass
export default class Sign extends BaseView {

    @property(cc.Node)
    Node_SignItem: cc.Node[] = []
    @property(cc.Node)
    panel_rule: cc.Node = undefined

    @property(cc.Button)
    signBtn: cc.Button = undefined

    signData = undefined
    state = undefined


    OnBtn_help() {
        this.panel_rule.active = !this.panel_rule.activeInHierarchy;
    }

    OnBtn_close() {
        Global.CCHelper.playPreSound();
        this.close()
    }

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.signData = null;
    }

    async start() {
        if (AudioConfig._Sign) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/sign");
            AudioConfig._Sign = false
        }
        this.refreshUI();
    }

    refreshUI() {
        let self = this;
        HallApi.CheckInRecordRequest(function (data_) {
            self.signData = data_.msg;
            self.updateUI(self.signData);
        });
    }

    updateUI(data_) {

        let len = this.Node_SignItem.length;
        let len_signData;
        let flagCode;
        if (data_.length == 0) {
            len_signData = 0;
            flagCode = false;
        }
        else {
            len_signData = data_.dataArr.length;
            flagCode = data_.flagCode;

            data_.dataArr.sort((a, b) => {
                return a.checkInNum - b.checkInNum;
            })
        }

        for (let i = 0; i < len; i++) {
            let item = this.Node_SignItem[i];

            if (i < len_signData) {
                this.UpdateState(item, SignState.DONE, data_.dataArr[i]);
            }
            else if (i == len_signData) {
                if (flagCode == false)
                    this.UpdateState(item, SignState.CAN, null);
                else
                    this.UpdateState(item, SignState.CANT, null);
            }
            else {
                this.UpdateState(item, SignState.CANT, null);
            }
        }

        if (flagCode == false) {
            this.signBtn.interactable = true
        } else {
            this.signBtn.interactable = false
        }
    }

    UpdateState(item: cc.Node, state_, data_) {
        let Label_score = item.getChildByName('Label_score').getComponent(cc.Label);
        let sp_sign_done = item.getChildByName('sp_sign_done').getComponent(cc.Sprite);
        if (state_ == SignState.CAN) {
            sp_sign_done.node.active = false;
        }
        else if (state_ == SignState.CANT) {
            sp_sign_done.node.active = false;
        }
        else if (state_ == SignState.DONE) {
            sp_sign_done.node.active = true;
            Label_score.string = '' + Global.Utils.formatNum2(data_.gold);
        }
    }

    OnBtn() {
        Global.CCHelper.playPreSound();
        let self = this;
        Waiting.show()
        HallApi.CheckInRequest((data: any) => {
            this.refreshUI();
            Waiting.hide();
            if (data.code == Global.Code.OK) {
                ViewMgr.open({ viewUrl: "GoldEff", prefabUrl: "HallDynamic/hongbao/GoldEff" }, { key: "setGold", data: data.msg.gold });
            }
        });
    }
}
