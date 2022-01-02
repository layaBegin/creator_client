const { ccclass, property } = cc._decorator;

@ccclass
export default class TGPD2Operation extends cc.Component {
    @property(cc.Label)
    pointLabel: cc.Label = undefined
    @property(cc.Label)
    lineLabel: cc.Label = undefined
    @property([cc.Button])
    btnList: cc.Button[] = []

    lineLabels: cc.Label[] = [];

    baseScore: number = 0;
    maxPointNum: number = 0;

    init(baseScore: number) {
        this.baseScore = baseScore;
        this.maxPointNum = baseScore * 5;
        this.updateLineNum(1, "set");
        this.updatePointNum(this.baseScore, "set");

    }

    setOperation(can: boolean) {
        for (let i = 0, len = this.btnList.length; i < len; i++) {
            this.btnList[i].interactable = can;
        }
    }
    /**
     * 获取下注值
     */
    getBetNum() {
        return Number(this.lineLabel.string) * Number(this.pointLabel.string);
    }

    updatePointNum(value: number, op: "add" | "set" = "add") {
        if ("add" == op) {
            let v = Number(this.pointLabel.string);
            value += v;
        }
        if (value < this.baseScore) {
            value = this.baseScore;
        }
        if (value > this.maxPointNum) {
            value = this.maxPointNum;
        }
        this.pointLabel.string = value.toString();
    }
    updateLineNum(value: number, op: "add" | "set" = "add") {
        if ("add" == op) {
            let v = Number(this.lineLabel.string);
            value += v;
        }
        if (value < 1) {
            value = 1;
        }
        if (value > 5) {
            value = 5;
        }
        let v = value.toString();
        if (v != this.lineLabel.string) {
            this.lineLabel.string = v;
            return true;
        }
        return false;
    }

    onBtnClicked(ev?: cc.Event, param?: string) {
        AudioMgr.playCommonSoundClickButton();
        let type = param;
        let value = 0;
        switch (type) {
            case "addLine":
                this.updateLineNum(1)
                break;
            case "subLine":
                this.updateLineNum(-1)
                break;
            case "addPoint":
                this.updatePointNum(this.baseScore);
                break;
            case "subPoint":
                this.updatePointNum(-this.baseScore);
                break;
            default:
                break;
        }
    }

    onPointSlider(slider: cc.Slider) {
        let value = slider.progress * this.maxPointNum;
        value = +value.toFixed(1);  // 保留一位小数
        this.updatePointNum(value, "set");
    }
}