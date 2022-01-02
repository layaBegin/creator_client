import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class ServerList extends BaseView {
    @property(cc.Node)
    btnNodes: cc.Node = undefined;

    start() {
        let list = Global.Constant.serverList;
        for (let i = 0; i < list.length; i++) {
            if (list[i] && list[i].length) {
                let node = this.btnNodes.children[i];
                if (!cc.isValid(node)) {
                    node = cc.instantiate(this.btnNodes.children[0]);
                    node.parent = this.btnNodes;
                }
                let btn = node.getComponent(cc.Button);
                btn.clickEvents[0].target = this.node;
                btn.clickEvents[0].handler = "onClicked"
                btn.clickEvents[0].component = "ServerList";
                btn.clickEvents[0].customEventData = i + "";

                node.children[0].children[0].getComponent(cc.Label).string = list[i][2] || "";
            }
        }
    }

    onClicked(ev: cc.Event, param: string) {
        let index = parseInt(param);
        let item = Global.Constant.serverList[index];
        Global.Constant.gameServerAddress = item[0];
        Global.Constant.webServerAddress = item[1];
        console.log("服务器已切换至 " + item[0]);
    }
    // update (dt) {}
}
