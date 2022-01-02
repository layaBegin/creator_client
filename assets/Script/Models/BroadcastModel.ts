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
export default class BroadcastModel extends cc.Component {

    broadcastContents = undefined

    init() {
        Global.MessageCallback.addListener("BroadcastPush", this);
        this.broadcastContents = [];
    }

    getBroadcastContents() {
        return this.broadcastContents
    }

    onDestroy() {
        Global.MessageCallback.removeListener("BroadcastPush", this);
    }

    messageCallbackHandler(router, msg) {
        switch (router) {
            case 'BroadcastPush':
                for (let i = 0; i < msg.broadcastContentArr.length; ++i) {
                    this.broadcastContents.push({
                        type: msg.type,
                        content: msg.broadcastContentArr[i]
                    });
                }
                break;
        }
    }
}
