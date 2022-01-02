import BaseView from "../../BaseClass/BaseView";
import HallApi = require('../../API/HallAPI');
import { Utiles } from "../../Models/Utiles";
import { Actions } from "../../Actions";

interface WheelConfig {  /* 转盘配置 */
    integral: number            // 当前积分
    scrollGold: number          // 滚动阈值 (中奖金币大于阈值才进入滚动列表)
    todayIntegral: number       // 明日积分
    turntableConfig: {          // 转盘一次 消耗积分配置
        [key: string]: number
        // 1: 1000
        // 2: 5000
        // 3: 20000
    }
    turntablePrizeConfig: {     // 转盘刻度 配置
        [key: string]: number[]
        // 1: (12)[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        // 2: (12)[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        // 3: (12)[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    }
}

enum WheelType {
    SILVER = 1,
    GLOD = 2,
    DIAMOND = 3
}


const { ccclass, property } = cc._decorator;

@ccclass
export default class LuckyWheel extends BaseView {

    @property(cc.ToggleContainer)
    wheelContainer: cc.ToggleContainer = undefined;
    @property(cc.Label)
    currIntergral: cc.Label = undefined;

    @property(cc.Node)
    wheels: cc.Node[] = [];
    @property([cc.Label])
    costTips: cc.Label[] = [];

    sectorCount: number = 12;       // 转盘扇形个数

    private wheelConfig: WheelConfig = undefined;

    private _isRuning: boolean = false;

    async onLoad() {
        if (AudioConfig._Wheel) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/wheel");
            AudioConfig._Sign = false
        }
        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    }
    init(config: WheelConfig) {
        if (!config || !Object.keys(config).length) {
            console.error("转盘配置数据为空");
            return;
        }
        this.wheelConfig = config;
        this.setIntergral(config.integral, config.todayIntegral);

        this.setCostTips(config.turntableConfig);   // 显示转盘消耗积分
        let keys = Object.keys(this.wheelConfig.turntablePrizeConfig);
        for (let i = 0; i < keys.length && i < this.wheels.length; i++) {
            let config = this.wheelConfig.turntablePrizeConfig[keys[i]];
            for (let j = 0; j < config.length && j < this.wheels[i].children.length; j++) {
                this.wheels[i].children[j].getComponent(cc.Label).string = config[j] + "";
                // console.log(config[j]);
            }
        }

        this.node.rotation = 0;

    }
    test(v = 1) {
        for (let i = 0; i < v; i++) {
            HallApi.turntableRequest(3);
        }
    }

    async onStartClicked() {
        Global.CCHelper.playPreSound();
        if (this._isRuning) {
            Tip.makeText("正在抽奖");
            return;
        }
        this._isRuning = true;
        let index = this.getWheelIndex();
        let data = await this.turntableRequest(index + 1)
        if (!data) {
            this._isRuning = false;
            return;
        }

        let duration = 5;   // 转盘持续时间

        if (data.code == Global.Code.OK) {
            let diffAngle = this.getAngleDiff(+data.msg.index);
            let gold = data.msg.gold        // 中奖金币
            // console.log("目标下标 " + data.msg.index, "角度差值 " + diffAngle);
            let tween = cc.tween().by(duration, { rotation: 360 * 20 + diffAngle }, { easing: "expoInOut" });
            await Actions.runActionSync(this.wheels[index], tween);
            if (gold && typeof gold == "number") {
                ViewMgr.open({ viewUrl: "GoldEff", prefabUrl: "HallDynamic/hongbao/GoldEff" }, { key: "setGold", data: gold });
            }
        }

        this._isRuning = false;

    }

    setCostTips(turntableConfig: any) {
        for (let i = 0; i < this.costTips.length; i++) {
            let value = +turntableConfig[i + 1];
            if (typeof value == "number") {
                this.costTips[i].string = "开启转盘消耗" + value + "积分!"
            }
        }
    }
    // 设置积分
    setIntergral(integral: number, todayIntegral?: number, scrollGold?: number) {
        if (typeof integral == "number") {
            this.currIntergral.string = integral.toFixed(2); // 设置当前积分
            // 设置记录面板的当前积分
            ViewMgr.pushMessage(this.node.name + "/WheelRecord", { key: "init", arguments: [integral, todayIntegral, scrollGold] });
        }
        else {
            CC_DEBUG && Debug.assert(true, "非法积分参数");
        }
    }

    getWheelIndex() {
        let index = Utiles.getToggleContainerChecked(this.wheelContainer);
        CC_DEBUG && Debug.assert(index == -1, "找不到转轮类型");
        return index;
    }
    /**
     * 当前角度与目标角度在顺时针方向上的差值
     */
    getAngleDiff(targetIndex: number) {
        let wheel = this.wheels[this.getWheelIndex()];
        // wheel.node.rotation % 360 防止wheel出现非 0-360 角度导致的计算异常
        return (360 + this.getAngleByIndex(targetIndex) - (wheel.rotation % 360)) % 360;
    }
    /**
     * 扇形下标对应的角度
     */
    getAngleByIndex(index: number) {
        let angle = 360 / this.sectorCount;
        return angle * index;
    }

    /////////////////////////// 抽奖记录 相关
    /* 打开抽奖记录 */
    openRecord() {
        Global.CCHelper.playPreSound();
        let viewUrl = this.node.name + "/WheelRecord"
        // 获取大奖记录
        HallApi.getTurntableGrandPrizeRecordRequest((data) => {
            ViewMgr.pushMessage(viewUrl, { key: "setAllRewardList", data: data.msg });
        });
        // 获取个人中奖记录
        HallApi.getTurntableSelfRecordRequest((data) => {
            ViewMgr.pushMessage(viewUrl, { key: "setSelfRewardList", data: data.msg });
        })

        ViewMgr.open({ viewUrl: viewUrl, isShowAction: false });
    }
    closeRecord() {
        Global.CCHelper.playPreSound();
        ViewMgr.close(this.node.name + "/WheelRecord");
    }

    openHelp() {
        Global.CCHelper.playPreSound();
        ViewMgr.open(this.node.name + "/wheelHelp");
    }
    closeHelp() {
        Global.CCHelper.playPreSound();
        ViewMgr.close(this.node.name + "/wheelHelp");
    }

    //////////////////////////


    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }
    // onDisable() {
    //     Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    // }
    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'UpdateUserInfoUI':
                if (typeof msg.integral == "number") {
                    this.setIntergral(msg.integral);
                }
                break;
        }
    }

    //抽奖转盘 抽奖
    async turntableRequest(type: WheelType) {
        var router = 'hall.activityHandler.turntable';
        var requestData = {
            type: type,
        };
        return await this.send(router, requestData);
    };
    //抽奖转盘 获取转盘配置
    async getTurntableGrandConfigRequest() {
        var router = 'hall.activityHandler.getTurntableGrandConfig';
        var requestData = {};
        return await this.send(router, requestData);
    };

    async send(router: string, requestData: any) {
        return new Promise<any>((resolve) => {
            try {
                Global.NetworkManager.send(router, requestData, (data: any) => {
                    resolve(data);
                }, (data) => {
                    if (!!Global.Code[data.code]) {
                        Confirm.show(Global.Code[data.code]);
                    } else {
                        Confirm.show('游戏错误，错误码：' + data.code);
                    }
                    resolve(data);
                });
            } catch (error) {
                console.error(error);
                resolve(undefined);
            }
        });
    }
}
