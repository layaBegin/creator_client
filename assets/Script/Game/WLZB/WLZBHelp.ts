import BaseView from "../../BaseClass/BaseView";

const {ccclass, property} = cc._decorator;

@ccclass
export default class WLZBHelp extends BaseView {

    @property(cc.Label)
    percentage: cc.Label = undefined;
    //
    // @property
    // text: string = 'hello';

    init (data) {
        this.percentage.string = "当前抽水比例：" + (data.profitPercentage | 0) + "%";
    }

    onBtnClick (event:cc.Event,param:string) {
        if (param === "close") {
            this.close();
        }
    }

}
