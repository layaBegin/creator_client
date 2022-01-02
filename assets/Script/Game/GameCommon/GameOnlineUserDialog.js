let roomProto = require('../../API/RoomProto');
let roomAPI = require('../../API/RoomAPI');

cc.Class({
    extends: cc.Component,

    properties: {
        playerItem: cc.Node,
        playerContent: cc.Node,
    },

    start() {
        Global.MessageCallback.addListener('RoomMessagePush', this);
        roomAPI.roomMessageNotify(roomProto.getRoomOnlineUserInfoNotify());
        this.playerItem.active = false;
    },

    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
    },

    buttonEventClose() {
        Global.CCHelper.playPreSound();
        Global.DialogManager.destroyDialog(this);
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.GET_ROOM_ONLINE_USER_INFO_PUSH) {
                if (msg.data.fuHaoUserInfoArr.length == 0 && !!msg.data.shenSuanZiInfo == false) {
                    let self = this;
                    Confirm.show("没有得到玩家数据", () => {
                        Global.DialogManager.destroyDialog(self);
                    });
                    return;
                }
                if (!!msg.data.shenSuanZiInfo) {
                    let item = cc.instantiate(this.playerItem);
                    this.setItemInfo(item, msg.data.shenSuanZiInfo, true);
                }
                msg.data.fuHaoUserInfoArr.sort(this.sortUserGold);
                for (let i = 0; i < msg.data.fuHaoUserInfoArr.length; ++i) {
                    let item = cc.instantiate(this.playerItem);
                    this.setItemInfo(item, msg.data.fuHaoUserInfoArr[i], false, i);
                }
            }
        }
    },

    sortUserGold(a, b) {
        return b.userInfo.gold - a.userInfo.gold;
    },

    setItemInfo(item, info, isShensuanzi, rank) {
        item.parent = this.playerContent;
        item.active = true;
        if (!!info.userInfo.nickname) {
            item.getChildByName("nameTxt").getComponent(cc.Label).string = Global.Player.convertNickname(info.userInfo.nickname);
        }
        else {
            item.getChildByName("nameTxt").getComponent(cc.Label).string = "0";
        }
        if (!!info.userInfo.gold) {
            item.getChildByName("goldTxt").getComponent(cc.Label).string = info.userInfo.gold.toFixed(2);
        }
        else {
            item.getChildByName("goldTxt").getComponent(cc.Label).string = "0";
        }
        if (!!info.winCount) {
            item.getChildByName("WinLabel").getComponent(cc.Label).string = info.winCount + "局";
        }
        else {
            item.getChildByName("WinLabel").getComponent(cc.Label).string = "0";
        }
        if (!!info.betCount) {
            item.getChildByName("BetLabel").getComponent(cc.Label).string = info.betCount.toFixed(2);
        }
        else {
            item.getChildByName("BetLabel").getComponent(cc.Label).string = "0";
        }
        if (!!info.userInfo.avatar) {
            Global.CCHelper.updateSpriteFrame(info.userInfo.avatar, item.getChildByName("headIcon").getComponent(cc.Sprite));
        }
        else {
            item.getChildByName("headIcon").active = false;
        }
        if (isShensuanzi) {
            item.getChildByName("Shensuanzi").active = true;
            item.getChildByName("Fuhao1").active = false;
            item.getChildByName("RankLabel").active = false;
        }
        else {
            rank += 1;
            if (rank == 1) {
                item.getChildByName("Fuhao1").active = true;
                item.getChildByName("RankLabel").active = false;
            }
            else {
                item.getChildByName("Fuhao1").active = false;
                item.getChildByName("RankLabel").active = true;
                item.getChildByName("RankLabel").getComponent(cc.Label).string = "n" + rank;
            }
            item.getChildByName("Shensuanzi").active = false;
        }
    },

    // setItemNumber(item, number) {
    //     item.getChildByName("fuhaoNumber").getComponent(cc.Label).string = number.toString();
    // }
});
