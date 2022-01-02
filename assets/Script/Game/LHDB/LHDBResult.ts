import { LHDBView } from "./LHDBGameCore";
import { Actions } from "../../Actions";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LHDBResult extends cc.Component {
    @property(cc.Label)
    score: cc.Label = undefined;
    @property(cc.Node)
    itemPrefab: cc.Node = undefined;

    itemList: cc.Node[] = [];

    pos: cc.Vec2 = undefined;

    init() {
        for (let i = 0; i < this.itemList.length; i++) {
            this.itemList[i].active = false;
        }
        this.itemList = [];
        this.pos = cc.v2(340, 230);
    }

    async showResultItem(dbinfo: any[], viewData: LHDBView) {
        this.score.string = "+" + viewData.score;
        this.moveUpSync(this.score.node, 0.4, 100);

        let itemNode = this.getItemNode();
        this.setItemNode(itemNode, dbinfo, viewData);
        let height = this.pos.y - (this.itemList.length - 1) * 60;
        await this.moveUpSync(itemNode, 0.4, height, 0);

    }
    setItemNode(itemNode: cc.Node, dbinfo: any[], viewData: LHDBView) {
        let gem = itemNode.children[0].getComponent(dragonBones.ArmatureDisplay);
        gem.dragonAsset = dbinfo[0];
        gem.dragonAtlasAsset = dbinfo[1];
        gem.armatureName = "Sprite";
        gem.animationName = "Sprite";

        let lineNum = itemNode.children[2].getComponent(cc.Label);
        let score = itemNode.children[4].getComponent(cc.Label);
        lineNum.string = viewData.destroyData.line.length.toString();
        score.string = viewData.score.toString();
    }

    getItemNode() {
        for (let i = 0; i < this.itemList.length; i++) {
            if (this.itemList[i].active == false) {
                return this.itemList[i];
            }
        }
        let item = cc.instantiate(this.itemPrefab);
        item.parent = this.node;
        this.itemList.push(item);
        return item;
    }


    async moveUpSync(node: cc.Node, duration: number, height: number = 100, startY?: number) {
        node.stopAllActions();

        node.active = true;
        if (startY != undefined) {
            node.y = startY;
        }
        let tween = cc.tween().
            by(duration, { y: height }).
            call(() => {
                this.score.node.active = false;
            })
            ;
        await Actions.runActionSync(node, tween);
    }

}