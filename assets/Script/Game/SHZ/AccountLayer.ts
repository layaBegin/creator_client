import {SHZModel} from "./SHZModel";

const {ccclass, property} = cc._decorator;

@ccclass
export default class AccountLayer extends cc.Component {

    @property(cc.Node)
    layoutNode: cc.Node = undefined;
    @property(cc.Label)
    zongfenLabel: cc.Label = undefined;
    @property(cc.Label)
    fullLabel: cc.Label = undefined;
    accountLayerCallback: any = undefined;
    CHECK_DATA = {
        '0': {
            '3': "2倍",
            '4': "5倍",
            '5': "20倍"
        },
        '1': {
            '3': "3倍",
            '4': "10倍",
            '5': "40倍"
        },
        '2': {
            '3': "5倍",
            '4': "15倍",
            '5': "60倍"
        },
        '3': {
            '3': "7倍",
            '4': "20倍",
            '5': "100倍"
        },
        '4': {
            '3': "10倍",
            '4': "30倍",
            '5': "160倍"
        },
        '5': {
            '3': "15倍",
            '4': "40倍",
            '5': "200倍"
        },
        '6': {
            '3': "20倍",
            '4': "80倍",
            '5': "400倍"
        },
        '7': {
            '3': "50倍",
            '4': "200倍",
            '5': "1000倍"
        },
        '8': {
            '3': "免费1次",
            '4': "免费2次",
            '5': "免费3次"
        },
    };
    FULL_DATA = {
        '0': "板斧全屏奖50倍",
        '1': "枪戟全屏奖100倍",
        '2': "大环刀全屏奖150倍",
        '3': "鲁智深全屏奖250倍",
        '4': "林冲全屏奖400倍",
        '5': "宋江全屏奖500倍",
        '6': "替天行道全屏奖1000倍",
        '7': "忠义堂全屏奖2500倍",
        '8': "水浒传全盘奖4950倍"
    };
    MIX_FULL_DATA = {
        '0': "板斧混版全屏奖30倍",
        '1': "枪戟混版全屏奖30倍",
        '2': "大环刀混版全屏奖30倍",
        '3': "鲁智深混版全屏奖50倍",
        '4': "林冲混版全屏奖50倍",
        '5': "宋江混版全屏奖50倍"
    };

    private SHZMain: any;

    onLoad () {
        var endData = SHZModel.getInstance().getEndData();
        var checkData = SHZModel.getInstance().getEndData().checkData;
        for (let i = 0;i < checkData.length;i++){
            let luckyItemType = checkData[i].luckyItemType;
            if (endData.isFull && !endData.isMix){
                let txt = this.FULL_DATA[luckyItemType];
                this.fullLabel.string = txt;
                this.fullLabel.node.active = true;
            }
            else if (endData.isMix){
                let txt = this.MIX_FULL_DATA[luckyItemType];
                this.fullLabel.string = txt;
                this.fullLabel.node.active = true;
            }
            else {
                let txt = "x" + checkData[i].repeat + "=" + this.CHECK_DATA[luckyItemType][checkData[i].repeat];
                this.layoutNode.children[i].getChildByName("label").getComponent(cc.Label).string = txt;
                let callFunc = function(){
                    this.layoutNode.children[i].active = true;
                };
                let sprite = this.layoutNode.children[i].getChildByName("icon").getComponent(cc.Sprite);
                Global.CCHelper.updateSpriteFrame('Game/SHZ/img/' + luckyItemType,
                    sprite,callFunc.bind(this));
            }
        }
        this.zongfenLabel.string = SHZModel.getInstance().getEndData().prizePerRound;
        this.zongfenLabel.node.active = true;
    }

    start() {

        this.SHZMain = this.node.parent.parent.getComponent("SHZMain");
        if (this.SHZMain.isAuto) {
            this.scheduleOnce(function () {
                this.onBtnClick(null,"close");

            }.bind(this),4)
        }
    }

    onBtnClick(event: cc.Event, param: string){
        this.accountLayerCallback(param);
        this.node.destroy();

    }
}
