
const { ccclass, property } = cc._decorator;

@ccclass
export default class ProgressBar extends cc.Component {

    @property(cc.Sprite)
    bar: cc.Sprite = undefined;
    @property(cc.Label)
    tipStr: cc.Label = undefined;
    @property(cc.Label)
    progressStr: cc.Label = undefined;

    @property
    isReverse: boolean = false;

    private _progressFixed: number = 2;

    private _progress: number = 0;
    /**
     * 设置进度值 0 ~ 1
     * 进度值显示默认保留 2 位小数
     */
    set progress(v: number) {
        if (v == this._progress) {
            return;
        }
        if (CC_DEBUG && (v > 1 || v < 0)) {
            console.warn("ProgressBar::进度取值范围 0 ~ 1");
            return;
        }
        if (isNaN(v)) {
            console.warn("ProgressBar::进度值为NaN");
            v = 0;
        }
        this._progress = v;
        if (this.isReverse) {
            v = 1 - v;
        }
        this.bar.fillRange = v;
        this.progressStr.string = (this._progress * 100).toFixed(this._progressFixed) + "%";
    }
    get progress() { return this._progress }

    set tip(v: string) {
        this.tipStr.string = (v == undefined ? "" : v);
    }
    get tip() { return this.tipStr.string }

    init(str = "", isShowProgressStr: boolean = true, isReverse: boolean = undefined, progressFixed: number = 2) {
        this.node.active = true;
        if (typeof isReverse == "boolean") {
            this.isReverse = isReverse;
        }
        this._progress = 0;
        this.bar.fillRange = 0;
        this.progressStr.string = "";
        this.tipStr.string = str;

        this._progressFixed = progressFixed;
        this.progressStr.node.active = isShowProgressStr;
    }

    hide() {
        this.node.active = false;
    }


}
