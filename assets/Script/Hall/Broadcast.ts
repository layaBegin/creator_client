
import { randomNum } from "../Game/ZhaJinHua/ZJHAudio";
import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Broadcast extends BaseView {

    @property(cc.RichText)
    noticeText: cc.RichText = undefined

    @property(cc.Node)
    rootNode: cc.Node = undefined

    broadcastContents = undefined

    infoList = ['玩家<color=#00ff00>%s</c>在<color=#D66F00>%s</c>再次赢了<color=#E4D313>%s</color>元，果然人品爆发！',
        '玩家<color=#00ff00>%s</c>在<color=#D66F00>%s</c>一把赢得<color=#E4D313>%s</color>元，真的太厉害了！',
        '天哪!玩家<color=#00ff00>%s</c>在<color=#D66F00>%s</c>神来之笔轻松把<color=#E4D313>%s</color>元收入囊中！',
        '厉害了我的天!玩家<color=#00ff00>%s</c>在<color=#D66F00>%s</c>中沉着冷静、有勇有谋，一举赢得<color=#E4D313>%s</color>元！',
        '玩家<color=#00ff00>%s</c>竟然在<color=#D66F00>%s</c>赢了<color=#E4D313>%s</color>元，金币哗啦啦的！',
        '财神降临！玩家<color=#00ff00>%s</c>在<color=#D66F00>%s</c>赢得<color=#E4D313>%s</color>元，简直是天上掉馅饼呀~~',
        '玩家<color=#00ff00>%s</c>鸿运当头，在<color=#D66F00>%s</c>赢了<color=#E4D313>%s</color>元，真是游戏1分钟，少打10年工!',
        '天哪!玩家<color=#00ff00>%s</c>在<color=#D66F00>%s</c>再度赢了<color=#E4D313>%s</color>元，气氛太火爆了!']

    onLoad() {
        Global.MessageCallback.addListener("BroadcastPush", this);
        this.broadcastContents = [];
        this.node.active = true;
    }
    //更新跑马灯的坐标
    updatePosition(kind = 0) {
        return
    }

    onDestroy() {
        Global.MessageCallback.removeListener("BroadcastPush", this);
    }

    startNext() {
        this.node.active = true;
        if (this.rootNode.active) return;
        if (this.broadcastContents.length === 0) {
            this.rootNode.active = false;
            return;
        }
        this.rootNode.active = true;
        this.noticeText.node.x = 0;

        let scrollSpeed = 100;
        let distance = this.noticeText.node.width + this.noticeText.node.parent.width + 50;
        let time = distance / scrollSpeed;
        let move = cc.moveBy(time, -distance, 0);

        let broadcastContent = this.broadcastContents.shift();
        if (broadcastContent.type === Global.Enum.broadcastType.LOOP || broadcastContent.type === Global.Enum.broadcastType.SYSTEM) {
            this.noticeText.string = broadcastContent.content.content;
        } else if (broadcastContent.type === Global.Enum.broadcastType.BIG_WIN) {
            let gameName = Config.getGameName(broadcastContent.content.kind);
            let nickname = Global.Player.convertNickname(broadcastContent.content.nickname);
            let goldCount = Global.Utils.formatNumberToString(broadcastContent.content.gold, 2);
            // cc.log("==================", broadcastContent.content.kind, gameName)
            // this.noticeText.string = '玩家<color=#00ff00>' + nickname + '</c>财运亨通,在<color=#D66F00>' + gameName + '</color>一把赢得<color=#E4D313>' + goldCount + '元</color>！';
            this.noticeText.string = cc.js.formatStr(this.infoList[randomNum(this.infoList.length - 1)], nickname, gameName, goldCount);

        }
        let moveEnd = cc.callFunc(function () {
            this.rootNode.active = false;
            this.startNext();
        }.bind(this));
        let actions = cc.sequence([move, moveEnd]);
        this.noticeText.node.runAction(actions);
    }

    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'BroadcastPush':
                this.broadcastContents = BroadcastModel.getBroadcastContents()
                this.startNext();
                break;
        }
    }
}
