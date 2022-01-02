import SpriteIndex from "../../Component/SpriteIndex";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LHDBOperation extends cc.Component {
    @property(cc.Label)
    pointLabel: cc.Label = undefined
    @property(cc.Label)
    lineLabel: cc.Label = undefined
    @property(cc.Slider)
    pointSlider: cc.Slider = undefined
    @property(cc.Sprite)
    pointSliderProgress: cc.Sprite = undefined;
    @property(SpriteIndex)
    ztSpriteIndex: SpriteIndex = undefined;
    @property(cc.Node)
    drillBit: cc.Node = undefined;

    @property([cc.Button])
    btnList: cc.Button[] = []

    lineLabels: cc.Label[] = [];

    baseScore: number = 0;
    maxPointNum: number = 0;

    init(baseScore: number) {
        // 缓存钻头label
        for (let i = 0; i < this.drillBit.children.length; i++) {
            let node = this.drillBit.children[i];
            let label = node.children[0].getComponent(cc.Label);
            label.string = "0";
            label.node.active = false;
            this.lineLabels.push(label);
        }
        this.baseScore = baseScore;
        this.maxPointNum = baseScore * 5;
        this.addDrillBit();    // 默认至少一个钻头
        this.updateLineNum(1, "set");
        this.updatePointNum(this.baseScore, "set");

    }

    setOperation(can: boolean) {
        for (let i = 0, len = this.btnList.length; i < len; i++) {
            this.btnList[i].interactable = can;
        }
        this.pointSlider.enabled = can;
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
        // 更新钻头数值
        this.updateBrillBitValue(value);

        let progress = ((value - this.baseScore) / (this.maxPointNum - this.baseScore));
        this.pointSlider.progress = progress;
        this.pointSliderProgress.fillRange = progress;
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
                if (this.updateLineNum(1)) {
                    this.addDrillBit();
                }
                break;
            case "subLine":
                if (this.updateLineNum(-1)) {
                    this.subDrillBit();
                }
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
    // 添加钻头
    addDrillBit() {
        for (let i = 0, len = this.drillBit.children.length; i < len; i++) {
            let v = Number(this.lineLabels[i].string);
            if (v <= 0) {
                let value = this.pointLabel.string;
                let label = this.lineLabels[i];
                label.node.active = true;
                let spf = this.ztSpriteIndex.getSpriteFrameByIndex(1);  // 黄钻头
                let sp = this.drillBit.children[i].getComponent(cc.Sprite);
                label.string = value
                sp.spriteFrame = spf;
                return;
            }
        }
    }
    subDrillBit() {
        for (let i = this.drillBit.children.length - 1; i >= 1/* 至少有一条线 */; i--) {
            let v = Number(this.lineLabels[i].string);
            if (v > 0) {
                let value = 0
                let label = this.lineLabels[i];
                label.node.active = false;
                let spf = this.ztSpriteIndex.getSpriteFrameByIndex(0);  // 黄钻头
                let sp = this.drillBit.children[i].getComponent(cc.Sprite);
                label.string = value.toString();
                sp.spriteFrame = spf;
                return;
            }
        }
    }

    updateBrillBitValue(value: number) {
        for (let i = 0; i < this.lineLabels.length; i++) {
            let v = Number(this.lineLabels[i].string);
            if (v > 0) {    // 单线点数必定大于 0
                this.lineLabels[i].string = value.toString();
            }
        }
    }


}