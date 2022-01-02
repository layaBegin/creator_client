import BaseView from "../../BaseClass/BaseView";

let { ccclass, property } = cc._decorator;

@ccclass
export default class TGPD2Help extends BaseView {


    @property(cc.PageView)
    helpScroll: cc.PageView = undefined

    @property(cc.Label)
    profitPercentage: cc.Label = undefined;
    _level: -1 | 0 | 1 | 2 | 3 | 4 = 0;  // 0 显示游戏介绍 1~4显示对应关卡的算分 -1显示累计奖规则


    showRuleHelp(level: number = this._level, profitPercentage?: number) {
        if (profitPercentage != undefined) {
            this.profitPercentage.string = "当前游戏抽水比例:" + profitPercentage + "%";
        }
    }


    hide() {
        Global.CCHelper.playPreSound();
        this.close()
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'leftsroll':
                let index = this.helpScroll.getCurrentPageIndex()
                let allpage = this.helpScroll.getPages()
                if (index <= 0) {
                    index = allpage.length - 1
                } else {
                    index -= 1
                }
                this.helpScroll.scrollToPage(index, 0)
                break;
            case 'rightsroll':
                index = this.helpScroll.getCurrentPageIndex()
                allpage = this.helpScroll.getPages()
                if (index >= allpage.length - 1) {
                    index = 0
                } else {
                    index += 1
                }
                this.helpScroll.scrollToPage(index, 0)
                break;
        }


    }

