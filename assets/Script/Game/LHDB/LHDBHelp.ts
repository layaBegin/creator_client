import SpriteIndex from "../../Component/SpriteIndex";
import BaseView from "../../BaseClass/BaseView";

let { ccclass, property } = cc._decorator;

@ccclass
export default class LHDBHelp extends BaseView {
    @property(cc.Node)
    content: cc.Node = undefined;
    @property(SpriteIndex)
    page_1: SpriteIndex = undefined;
    @property(SpriteIndex)
    levelTitle: SpriteIndex = undefined;

    @property(cc.Label)
    pageNum: cc.Label = undefined;
    @property(cc.Label)
    profitPercentage: cc.Label = undefined;
    _level: -1 | 0 | 1 | 2 | 3 | 4 = 0;  // 0 显示游戏介绍 1~4显示对应关卡的算分 -1显示累计奖规则


    onToggleClicked(toggle: cc.Toggle) {
        let index = toggle.node.getSiblingIndex();
        if (index == 0) {   // 游戏介绍
            this._level = 0;
        }
        else if (index == 1) {
            this._level = 1;
        }
        this.showRuleHelp();
    }

    // showPage(level: -1 | 0 | 1 | 2 | 3 | 4) {
    //     this._level = level;
    //     this.onOpen();
    // }
    // onOpen() {
    //     if (this._level == -1) {
    //         this.showPrizePoolHelp()
    //     }
    //     else {
    //         this.showRuleHelp();
    //     }
    // }

    pageUp() {
        this._level--;
        if (this._level < 0) {
            this._level = 0;
        }
        this.showRuleHelp();
        // 更新页数显示
        this.pageNum.string = (this._level + 1) + "/5";
    }
    pageDown() {
        this._level++;
        if (this._level > 4) {
            this._level = 4;
        }
        this.showRuleHelp();
        // 更新页数显示
        this.pageNum.string = (this._level + 1) + "/5";

    }


    showRuleHelp(level: number = this._level, profitPercentage?: number) {
        if (profitPercentage != undefined) {
            this.profitPercentage.string = "当前游戏抽水比例:" + profitPercentage + "%";
        }
        this.node.children[0].active = false;
        this.node.children[1].active = true;
        if (level == 0) {
            this.content.children[0].active = true;
            this.content.children[1].active = false;
        } else {
            this.content.children[0].active = false;
            this.content.children[1].active = true;
            this.page_1.displayByIndex(level - 1);
            this.levelTitle.displayByIndex(level - 1);
        }

    }

    showPrizePoolHelp() {
        this.node.children[0].active = true;
        this.node.children[1].active = false;
    }


    hide() {

        this.close();
    }


}

