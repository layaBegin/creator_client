import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RoomGroup extends BaseView {

    @property({ type: cc.Label, tooltip: "top/goldBg/value" })
    gold: cc.Label = undefined;

    @property({ type: cc.Label, tooltip: "top/bankBg/value" })
    bank: cc.Label = undefined;

    @property({ type: cc.Sprite, tooltip: "top/titleBg/titleImg" })
    title: cc.Sprite = undefined;

    @property({ type: cc.Layout, tooltip: "rooms/view/content" })
    roomLayout: cc.Layout = undefined;
    @property(cc.Node)
    room: cc.Node = undefined


    @property(cc.Node)
    dzRoom: cc.Node = undefined
    @property(cc.Node)
    dzRoomToggleContainer: cc.Node = undefined
    @property(cc.Node)
    dzRoomPreBetContent: cc.Node = undefined
    @property(cc.Node)
    dzRoomContent: cc.Node = undefined

    @property(cc.Node)
    BJLRoom: cc.Node = undefined
    @property(cc.Node)
    BJLRoomLayout: cc.Node = undefined

    @property(cc.Node)
    QuickBtn: cc.Node = undefined

    roomData = undefined
    userGlod = undefined
    preBet = [];    //前注场
    noPreBet = [];  //非前注场

    kindId: number = 0;

    setTopInfo(gold: number, safeGold: number, kindId: number) {
        this.gold.string = <any>gold;
        this.bank.string = <any>safeGold;
        this.userGlod = gold;
        this.kindId = kindId;
        Global.CCHelper.updateSpriteFrame('RoomGroup/' + kindId + '_title', this.title);

        for (let i = 0; i < this.roomLayout.node.children.length; i++) {
            this.roomLayout.node.children[i].active = false
        }

        this.room.active = false
        this.dzRoom.active = false
        this.BJLRoom.active = false
        this.QuickBtn.active = false
    }

    setRooms(data: any) {
        this.QuickBtn.active = true
        this.preBet = [];
        this.noPreBet = [];
        this.room.active = true
        let content = this.roomLayout.node;
        this.roomData = data
        for (let i = 0; i < content.children.length; i++) {
            content.children[i].active = false;
        }
        for (let i = 0; i < data.length; i++) {
            let node = content.children[i];
            if (!cc.isValid(node)) {
                node = cc.instantiate(content.children[0]);
                node.parent = content;
            }
            this.setRoomItem(data[i], node);
            node.active = true;
        }
        this.roomLayout.updateLayout();
    }
    //德州单独处理选场
    setDzRooms(data: any) {
        this.preBet = [];
        this.noPreBet = [];
        for (let i = 0; i < data.length; i++) {
            let parameters = JSON.parse(data[i].parameters);
            if (parameters.preBetCount > 0) {
                this.preBet.push(data[i])
            } else {
                this.noPreBet.push(data[i])
            }
        }
        this.dzChangeRoom(null, '1')
    }
    //德州切换选场 1:前注场 2:非前注场
    dzChangeRoom(event, param) {
        if (param == '1') {
            this.setDzRoomItem(this.preBet, true)
            this.dzRoomToggleContainer.children[0].getComponent(cc.Toggle).isChecked = true
        } else if (param == '2') {
            this.setDzRoomItem(this.noPreBet, false)
            this.dzRoomToggleContainer.children[1].getComponent(cc.Toggle).isChecked = true
        }
    }

    //设置德州非前注选场
    setDzRoomItem(data, isPreBet) {
        this.QuickBtn.active
        let content = undefined
        if (isPreBet) {
            content = this.dzRoomPreBetContent;
        } else {
            content = this.dzRoomContent;
        }

        this.dzRoom.active = true
        this.roomData = data
        for (let i = 0; i < content.children.length; i++) {
            content.children[i].active = false;
        }
        for (let i = 0; i < data.length; i++) {
            let parameters = JSON.parse(data[i].parameters);
            let node = content.children[i];
            if (!cc.isValid(node)) {
                node = cc.instantiate(content.children[0]);
                node.parent = content;
            }
            if (data[i].level > 4) {
                data[i].level -= 4
            }
            let button = undefined
            if (isPreBet) {
                let bg = node.getChildByName("bg").getComponent(cc.Sprite);
                button = bg.node.getComponent(cc.Button)
                let minGold = node.getChildByName("minGold").getComponent(cc.Label);
                let qianzhu = node.getChildByName("qianzhu").getComponent(cc.Label);
                let mangzhu = node.getChildByName("mangzhu").getComponent(cc.Label);
                minGold.string = data[i].goldLowerLimit + "元"
                qianzhu.string = parameters.preBetCount + "元"
                mangzhu.string = parameters.blindBetCount + "元"
            } else {
                let bg = node.getChildByName("bg").getComponent(cc.Sprite);
                let icon = node.getChildByName("icon").getComponent(cc.Sprite);
                button = bg.node.getComponent(cc.Button)
                let minGold = node.getChildByName("minGold").getComponent(cc.Label);
                let dizhu = node.getChildByName("dizhu").getComponent(cc.Label);
                let url = this.getLevelBgUrl(data[i].kind, data[i].level);

                // Global.CCHelper.updateSpriteFrame("RoomGroup/level_" + data[i].level, bg);
                Global.CCHelper.updateSpriteFrame(url, icon);
                minGold.string = data[i].goldLowerLimit + "元"
                dizhu.string = parameters.blindBetCount + "元"
            }

            // 设置按钮自定义数据
            button.clickEvents[0].customEventData = data[i].gameTypeID;
            node.active = true;
        }
    }


    //百家乐选场
    async setBJLRooms(data: any) {
        this.BJLRoom.active = true
        //房间按限红排序
        var self = this
        data.sort(function (a: any, b: any) {
            let aa = self.getConfig(a.gameData)
            let bb = self.getConfig(b.gameData)
            return aa - bb;
        })
        for (i = 0; i < data.length; ++i) {
            let node = this.BJLRoomLayout.children[i];
            if (!cc.isValid(node)) {
                // 动态加载百家乐资源 不可以预先做在大厅场景中
                let prefab = await AssetMgr.loadResSync("BaiJiaLe/BJLGameItem", cc.Prefab);
                node = cc.instantiate(prefab);
                node.parent = this.BJLRoomLayout;
            }
            node.active = true;
            node.getComponent('BJLGameItem').setData(data[i].gameData, true);
        }
    }

    getConfig(gameData) {
        let min = [];
        let data = gameData.parameters.config.gameConfig

        for (const key in data) {
            min.push(data[key].redLimit.min)
        }
        let minConfig = Math.min.apply(null, min)
        return minConfig
    }


    enterRoom(event?: cc.Event, param?: string) {
        Global.CCHelper.playPreSound();
        let gameTypeID = param;
        Matching.show(gameTypeID)
    }

    quickEnterRoom() {
        Global.CCHelper.playPreSound();
        for (let i = this.roomData.length - 1; i >= 0; i--) {
            if (this.userGlod >= this.roomData[i].goldLowerLimit) {
                Matching.show(this.roomData[i].gameTypeID);
                return
            }
            if (i == 0) {
                Tip.makeText("金币不足，无法匹配")
            }
        }
    }

    setRoomItem(data: { kind: number, level: number, goldLowerLimit: number, baseScore: number, gameTypeID: string }, node: cc.Node) {
        let bg = node.getChildByName("bg").getComponent(cc.Sprite);
        let icon = node.getChildByName("icon").getComponent(cc.Sprite);
        let button = bg.node.getComponent(cc.Button)
        let minGold = node.getChildByName("minGold").getComponent(cc.Label);
        let dizhu = node.getChildByName("dizhu").getComponent(cc.Label);
        let url = this.getLevelBgUrl(data.kind, data.level);

        Global.CCHelper.updateSpriteFrame("RoomGroup/level_" + data.level, bg);
        Global.CCHelper.updateSpriteFrame(url, icon);
        minGold.string = data.goldLowerLimit + "元"
        dizhu.string = data.baseScore + "元"
        // 设置按钮自定义数据
        button.clickEvents[0].customEventData = data.gameTypeID;

    }

    getLevelBgUrl(kindId: number, level: number) {
        let url = ""
        url = "RoomGroup/" + kindId + "_" + level;
        return url;
    }

    hide() {
        Global.CCHelper.playPreSound();
        this.close();

        ViewMgr.pushToScene({ key: "showRoomGroup", data: false });
    }

}
