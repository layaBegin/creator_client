import BaseView from "../BaseClass/BaseView";
import HallApi = require('../API/HallAPI');

const { ccclass, property } = cc._decorator;

@ccclass
export default class RewardWheel extends BaseView {

    @property({
        type: cc.Button, visible: true,
        displayName: 'SpinBtn',
    })
    spinBtn: cc.Button = undefined
    @property(cc.Sprite)
    wheelSp: cc.Sprite = undefined
    @property({
        type: cc.Float, max: 15, min: 2, step: 0.01
    })
    maxSpeed: number = 5
    @property({
        type: cc.Float, tooltip: "减速前旋转时间", max: 5, min: 1, step: 0.01
    })
    duration: number = 3
    @property({
        type: cc.Float, tooltip: "加速度", max: 0.2, min: 0.01, step: 0.01
    })
    acc: number = 0.1
    @property({
        type: cc.Integer, tooltip: "指定结束时的齿轮", max: 17, min: 0, step: 0.01
    })
    targetID: number = 0
    @property({ tooltip: "旋转结束是否回弹" })
    springback: boolean = false
    @property(cc.Sprite)
    bg: cc.Sprite = undefined
    @property(cc.Sprite)
    Sp_wheel: cc.Sprite = undefined
    @property(cc.Sprite)
    Btn_spin: cc.Sprite = undefined
    @property(cc.Label)
    Label_wheel_score: cc.Label[] = []
    @property(cc.Node)
    Btn_1: cc.Node = undefined
    @property(cc.Node)
    Btn_2: cc.Node = undefined
    @property(cc.Node)
    Btn_3: cc.Node = undefined
    @property(cc.Label)
    Label_score_1: cc.Label = undefined
    @property(cc.Label)
    Label_score_2: cc.Label = undefined
    @property(cc.Label)
    Label_score_3: cc.Label = undefined
    @property(cc.Node)
    Panel_rewardWheel: cc.Node = undefined
    @property(cc.Node)
    Panel_help: cc.Node = undefined
    @property(cc.Node)
    Panel_record: cc.Node = undefined

    rewardType = null
    wheelState = null
    curSpeed = null
    spinTime = null //减速前旋转时间
    gearNum = null
    defaultAngle = null //修正默认角度
    gearAngle = null   // 每个齿轮的角度
    finalAngle = null  //最终结果指定的角度
    effectFlag = null  //用于音效播放
    config_turnTablePrize = []
    turntableConfig = []
    accHadAngle = null
    accSumAngle = null
    accEndAngle = null
    decSumAngle = null
    decStartAngle = null
    grandConfigData: any = undefined;

    private _winGold: number = 0;

    // use this for initialization
    init(data: any) {
        this.wheelState = 0;
        this.curSpeed = 0;
        this.spinTime = 0;                   //减速前旋转时间
        this.gearNum = 12;
        this.defaultAngle = 360 / 12;
        this.gearAngle = 360 / this.gearNum;   //每个齿轮的角度
        //this.wheelSp.node.rotation = this.defaultAngle;
        this.finalAngle = 0;                 //最终结果指定的角度
        this.effectFlag = 0;                 //用于音效播放
        // this.getConfig()
        this.Panel_help.active = false;

        this.grandConfigData = data
        this.config_turnTablePrize = data.turntablePrizeConfig;
        this.turntableConfig = data.turntableConfig;    // 大转盘配置数据
        this.Label_score_1.string = "(" + this.turntableConfig[1] + "积" + ")";
        this.Label_score_2.string = "(" + this.turntableConfig[2] + "积" + ")";
        this.Label_score_3.string = "(" + this.turntableConfig[3] + "积" + ")";
        this.showPanel(0);

        Global.MessageCallback.addListener('UpdateUserInfoUI', this);


    }
    onLoad() {
        this.spinBtn.node.on(cc.Node.EventType.TOUCH_END, function (event) {
            if (this.wheelState !== 0) {
                return;
            }
            Global.CCHelper.playPreSound();

            this.decAngle = 2 * 360;  // 减速旋转两圈
            this.curSpeed = 0;
            this.spinTime = 0;

            this.accSumAngle = 2 * 360;
            this.accEndAngle = Math.floor(this.Sp_wheel.node.rotation + this.accSumAngle);
            this.accHadAngle = 0;
            this.decSumAngle = 0;

            let self = this;

            HallApi.turntableRequest(this.rewardType + 1, function (data) {
                if (data.msg == null)
                    return;
                self.targetID = data.msg.index;
                self.wheelState = 1;

                self._winGold = data.msg.gold;      // 缓存中奖金币

            });
        }.bind(this));
    }


    showPanel(panelType_) {
        if (panelType_ == 0) {
            this.Panel_record.active = true;
            this.Panel_rewardWheel.active = false;
            this.Panel_record.getComponent('RewardWhellRecord').init(this.grandConfigData)
        }
        else if (panelType_ == 1) {
            this.Panel_record.active = false;
            this.Panel_rewardWheel.active = true;
        }
    }
    updateWheelScore(data_) {
        for (let i = 0; i < this.Label_wheel_score.length; i++) {
            this.Label_wheel_score[i].string = data_[(this.Label_wheel_score.length - 1) - i];
        }
    }

    caculateFinalAngle(targetID) {
        this.finalAngle = 360 - this.targetID * this.gearAngle + this.defaultAngle;
        if (this.springback) {
            this.finalAngle += this.gearAngle;
        }
    }

    // called every frame, uncomment this function to activate update callback
    update(dt) {
        if (this.wheelState === 0) {
            return;
        }
        // cc.log('......update');
        // cc.log('......state=%d',this.wheelState);

        // 播放音效有可能卡
        this.effectFlag += this.curSpeed;
        if (!cc.sys.isBrowser && this.effectFlag >= this.gearAngle) {
            // if(this.audioID)
            // {
            //     // cc.audioEngine.pauseEffect(this.audioID);
            // }
            // this.audioID = cc.audioEngine.playEffect(this.effectAudio,false);
            // this.audioID = cc.audioEngine.playEffect(cc.url.raw('resources/Sound/game_turntable.mp3'));
            this.effectFlag = 0;
        }

        if (this.wheelState == 1) {
            //cc.log('....加速,speed:' + this.curSpeed);
            this.spinTime += dt;
            this.wheelSp.node.rotation = Math.floor((this.wheelSp.node.rotation + this.curSpeed) * 100) / 100;
            this.accHadAngle += this.curSpeed;
            this.accHadAngle = Math.floor(this.accHadAngle * 100) / 100
            // cc.log("==============acc=================");
            // cc.log("this.wheelSp.node.rotation ",this.wheelSp.node.rotation);
            // cc.log("this.accHadAngle " + this.accHadAngle);
            // cc.log("this.curSpeed " + this.curSpeed);
            // cc.log("==============acc=================");
            if (this.accHadAngle <= this.accSumAngle) {
                this.curSpeed += this.acc;
                this.curSpeed = Math.floor(this.curSpeed * 100) / 100;
            }
            else {
                // if(this.spinTime<this.duration)
                // {
                //     return;
                // }
                if (this.accHadAngle <= this.accSumAngle) {
                    return;
                }
                //cc.log('....开始减速');
                //设置目标角度
                let offsetAngle = 360 - Math.floor(this.accEndAngle % 360 * 100) / 100;
                this.finalAngle = offsetAngle + this.targetID * this.gearAngle;
                this.maxSpeed = this.curSpeed;
                this.decSumAngle = 360 + this.finalAngle;
                this.wheelSp.node.rotation = this.accEndAngle;
                this.decStartAngle = this.wheelSp.node.rotation;




                if (this.springback) {
                    this.finalAngle += this.gearAngle;
                }
                //this.wheelSp.node.rotation = this.finalAngle;
                this.wheelState = 2;
            }
        }
        else if (this.wheelState == 2) {
            let curRo = this.wheelSp.node.rotation; //应该等于finalAngle
            let hadRo = Math.floor((this.wheelSp.node.rotation - this.decStartAngle) * 100) / 100;
            this.curSpeed = this.maxSpeed * ((this.decSumAngle - hadRo) / this.decSumAngle) + 0.2;
            this.curSpeed = Math.floor(this.curSpeed * 100) / 100;
            this.wheelSp.node.rotation = Math.floor((curRo + this.curSpeed) * 100) / 100;


            if (hadRo >= this.decSumAngle) {
                this.wheelState = 0;
                if (this.springback) {
                    //倒转一个齿轮
                    var act = cc.rotateBy(0.6, -this.gearAngle);
                    var seq = cc.sequence(cc.delayTime(0.2), act);
                    this.wheelSp.node.runAction(seq);
                }
                // 显示特效
                if (this._winGold && typeof this._winGold == "number") {
                    ViewMgr.open({ viewUrl: "GoldEff", prefabUrl: "HallDynamic/hongbao/GoldEff" }, { key: "setGold", data: this._winGold });
                }
            }
        }
    }


    OnBtn_1() {
        if (this.wheelState > 0) {
            return;
        }

        if (this.config_turnTablePrize == null)
            return;

        this.rewardType = 0;
        // Global.CCHelper.updateSpriteFrame("RewardWheel/baiyin/bg", this.bg);
        // Global.CCHelper.updateSpriteFrame("RewardWheel/baiyin/bg1", this.bg1);
        Global.CCHelper.updateSpriteFrame("RewardWheel/baiyin/button", this.Btn_spin);
        Global.CCHelper.updateSpriteFrame("RewardWheel/baiyin/wheel", this.Sp_wheel);

        this.Btn_1.opacity = 255;
        this.Btn_2.opacity = 100;
        this.Btn_3.opacity = 100;
        this.Label_score_1.node.opacity = 255;
        this.Label_score_2.node.opacity = 100;
        this.Label_score_3.node.opacity = 100;

        this.showPanel(1);

        if (this.config_turnTablePrize)
            this.updateWheelScore(this.config_turnTablePrize["1"]);
    }

    OnBtn_2() {
        if (this.wheelState > 0) {
            return;
        }

        if (this.config_turnTablePrize == null)
            return;

        this.rewardType = 1;
        // Global.CCHelper.updateSpriteFrame("RewardWheel/huangjin/bg", this.bg);
        // Global.CCHelper.updateSpriteFrame("RewardWheel/huangjin/bg1", this.bg1);
        Global.CCHelper.updateSpriteFrame("RewardWheel/huangjin/button", this.Btn_spin);
        Global.CCHelper.updateSpriteFrame("RewardWheel/huangjin/wheel", this.Sp_wheel);

        this.Btn_1.opacity = 100;
        this.Btn_2.opacity = 255;
        this.Btn_3.opacity = 100;
        this.Label_score_1.node.opacity = 100;
        this.Label_score_2.node.opacity = 255;
        this.Label_score_3.node.opacity = 100;

        this.showPanel(1);



        if (this.config_turnTablePrize)
            this.updateWheelScore(this.config_turnTablePrize[2]);
    }

    OnBtn_3() {
        if (this.wheelState > 0) {
            return;
        }

        if (this.config_turnTablePrize == null)
            return;

        this.rewardType = 2;
        // Global.CCHelper.updateSpriteFrame("RewardWheel/zhuanshi/bg", this.bg);
        // Global.CCHelper.updateSpriteFrame("RewardWheel/zhuanshi/bg1", this.bg1);
        Global.CCHelper.updateSpriteFrame("RewardWheel/zhuanshi/button", this.Btn_spin);
        Global.CCHelper.updateSpriteFrame("RewardWheel/zhuanshi/wheel", this.Sp_wheel);

        this.Btn_1.opacity = 100;
        this.Btn_2.opacity = 100;
        this.Btn_3.opacity = 255;
        this.Label_score_1.node.opacity = 100;
        this.Label_score_2.node.opacity = 100;
        this.Label_score_3.node.opacity = 255;

        this.showPanel(1);


        if (this.config_turnTablePrize)
            this.updateWheelScore(this.config_turnTablePrize[3]);
    }


    OnBtn_help() {
        this.Panel_help.active = !this.Panel_help.activeInHierarchy;
    }

    OnPanelHelp_Btn_sure() {
        this.Panel_help.active = false;
    }

    OnPanelHelp_Btn_close() {
        this.Panel_help.active = false;
    }

    OnBtn_return() {
        if (this.wheelState > 0) {
            return;
        }

        if (this.Panel_rewardWheel.activeInHierarchy) {
            this.showPanel(0);
        }
        else if (this.Panel_record.activeInHierarchy) {
            this.close()
        }
    }

    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }
    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                this.grandConfigData.integral = msg.integral;
                break;
        }
    }
}
