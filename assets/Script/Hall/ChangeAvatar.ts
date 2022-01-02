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
export default class ChangeAvatar extends BaseView {

    @property(cc.Node)
    avatarItem: cc.Node = undefined;

    @property(cc.Node)
    content: cc.Node = undefined

    items = []
    data = undefined;
    index = undefined;

    init() {
        for (let i = 0; i < 16; i++) {
            let data = {

                icon: 'UserInfo/head_' + i
            };
            let item = this.content.children[i]
            if (!cc.isValid(item)) {
                item = cc.instantiate(this.content.children[0]);
            }

            item.parent = this.content;
            this.updateUI(item, data, i);
            this.hideSelect(item);
            if (Global.Player.getPy('avatar') === ('UserInfo/head_' + i)) {
                this.showSelect(item);
            }
            item.active = true
            this.items[i] = item;
        }

        Global.MessageCallback.addListener('UpdateUserInfoUI', this);
    }

    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }

    callback(index) {
        Waiting.show();
        Global.API.hall.changeAvatarRequest('UserInfo/head_' + index, index % 2, (msg) => {
            Waiting.hide();
            for (let j = 0; j < this.items.length; j++) {
                this.hideSelect(this.items[j]);
                if (j === index) {
                    this.showSelect(this.items[j]);
                }
            }
        })
    }

    onBtnClk(event: cc.Event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
            case 'select':
                let target: cc.Node = event.target
                this.callback(target.getSiblingIndex());

                break;
        }
    }


    showSelect(item: cc.Node) {
        Global.CCHelper.playPreSound();
        item.getChildByName('selectIcon').active = true;
    }
    hideSelect(item: cc.Node) {
        item.getChildByName('selectIcon').active = false;
    }

    updateUI(item: cc.Node, data, index) {
        // this.data = data;
        // this.index = index;
        item.active = false;
        Global.CCHelper.updateSpriteFrame(data.icon, item.getComponent(cc.Sprite), function () {
            item.active = true;
        }.bind(this));
    }
}
