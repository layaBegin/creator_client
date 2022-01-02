import BaseView from "../BaseClass/BaseView";

// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html

const { ccclass, property } = cc._decorator;

@ccclass
export default class Rank extends BaseView {

    @property(cc.Node)
    winContent: cc.Node = undefined;

    @property(cc.Node)
    selfRank: cc.Node = undefined;

    startIndex = null
    perCount = null
    maxCount = false
    selfData = null
    selfIndex = null

    onOpen() {
        this.startIndex = 0;
        this.perCount = 30;
        this.maxCount = false
        this.updateList()
        this.winContent.parent.parent.getComponent(cc.ScrollView).scrollToTop(0)
    }

    init() {
        for (let i = 0; i < this.winContent.children.length; i++) {
            this.winContent.children[i].x = -1000
            this.winContent.children[i].active = true
        }
        this.selfRank.active = false
    }
    // onScrollEvent(target, eventType) {
    //     switch (eventType) {
    //         case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
    //             this.updateList();
    //             break;
    //     }
    // }
    //更新排行榜列表数据
    updateList() {
        Waiting.show();
        Global.API.hall.getTodayWinGoldCountRankRequest(this.startIndex, this.perCount, (msg) => {
            let data = msg.msg.rankList;
            for (let i = 0; i < data.length; i++) {
                let item = this.winContent.children[i]
                if (!cc.isValid(item)) {
                    item = cc.instantiate(this.winContent.children[0]);
                }
                item.active = true
                if (i < 3) {
                    Global.CCHelper.updateSpriteFrame('Rank/icon_rank_' + (i + 1), item.getChildByName('img').getComponent(cc.Sprite));
                    item.getChildByName('img').getChildByName('num').active = false;
                } else {
                    item.getChildByName('img').getChildByName('num').active = true;
                    item.getChildByName('img').getChildByName('num').getComponent(cc.Label).string = (i + 1) + '';
                }
                Global.CCHelper.updateSpriteFrame(data[i].avatar, item.getChildByName('avatar').getComponent(cc.Sprite));
                item.getChildByName('name').getComponent(cc.Label).string = Global.Player.convertNickname(data[i].nickname);
                item.getChildByName('gold').getChildByName('num').getComponent(cc.Label).string = Global.Utils.formatNum2(data[i].gold).toString();
                let action = cc.moveTo(0.3 + i * 0.05, 0, 0).easing(cc.easeBackOut())
                item.runAction(action)
                item.parent = this.winContent;
                if (data[i].uid == Global.Player.getPy('uid')) {
                    this.selfData = data[i]
                    this.selfIndex = i
                }
            }
            this.updataSelf()
            if (data.length > 0) {
                this.startIndex += this.perCount;
            }
            Waiting.hide();
        });
    }

    stopAction() {
        for (let i = 0; i < this.winContent.children.length; i++) {
            this.winContent.children[i].stopAllActions()
        }
    }
    //更新自己在排行榜中的数据
    updataSelf() {
        this.selfRank.active = true
        if (this.selfData != null && this.selfIndex != null) {
            if (this.selfIndex < 3) {
                Global.CCHelper.updateSpriteFrame('Rank/icon_rank_' + (i + 1), this.selfRank.getChildByName('img').getComponent(cc.Sprite));
                this.selfRank.getChildByName('img').getChildByName('num').active = false;
            } else {
                Global.CCHelper.updateSpriteFrame('Rank/xin', this.selfRank.getChildByName('img').getComponent(cc.Sprite));
                this.selfRank.getChildByName('img').getChildByName('num').active = true;
                this.selfRank.getChildByName('img').getChildByName('num').getComponent(cc.Label).string = (i + 1) + '';
            }
        }
        Global.CCHelper.updateSpriteFrame(Global.Player.getPy('avatar'), this.selfRank.getChildByName('avatar').getComponent(cc.Sprite));
        this.selfRank.getChildByName('name').getComponent(cc.Label).string = Global.Player.getPy('nickname');
        this.selfRank.getChildByName('gold').getChildByName('num').getComponent(cc.Label).string = Global.Utils.formatNum2(Global.Player.getPy('todayWinGoldCount')) + ''
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.stopAction()
                this.close()
                for (let i = 0; i < this.winContent.children.length; i++) {
                    this.winContent.children[i].active = false
                }
                break;
        }
    }

}
