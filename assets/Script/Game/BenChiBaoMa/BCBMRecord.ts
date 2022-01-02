import {Config} from "../../Models/Config";
import {AssetManager} from "../../Models/AssetManager";
import {BCBMModel} from "./BCBMModel";


const {ccclass, property} = cc._decorator;

@ccclass
export default class BCBMRecord extends cc.Component {
    @property(cc.Node)
    itemBig: cc.Node = null;
    @property(cc.Node)
    itemSmall: cc.Node = null;
    itemArr : cc.Node[] = [];
    BCBMMainDialog = null;
    constNum : number = 10;
    start () {
        this.BCBMMainDialog = this.node.parent.getComponent("BCBMMainDialog");
        this.initItem();
        this.node.on('OnFinishRun',this.onFinishRun.bind(this) );
    }
    initItem(){
        let recordArr = BCBMModel.getInstance().getdirRecord();
        let startIndex = recordArr.length - this.constNum >=0 ? recordArr.length - this.constNum : 0;
        for (let i = startIndex; i < recordArr.length;i++) {
            this.instantiateItem(recordArr[i],i == recordArr.length-1);
        }
    }
    onFinishRun(end:number){
        if (this.itemArr[this.itemArr.length-1]){
            this.itemArr[this.itemArr.length-1].getChildByName("bg1").active = false;
            this.itemArr[this.itemArr.length-1].getChildByName("bg").active = true;

        }
        this.instantiateItem(end,true);


    }
    instantiateItem(record,isLast){
        let item = null;
        if (record%8 > 3)
            item = cc.instantiate(this.itemBig);
        else
            item = cc.instantiate(this.itemSmall);
        AssetManager.getInstance().loadResSync("BenChiBaoMa/carIcon/carIcon_" + (record%8)%4,cc.SpriteFrame,function (err,spriteFrame) {
            let sprite = item.getChildByName("icon").getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
            item.active = true;
            item.getChildByName("bg1").active = isLast;
            item.getChildByName("bg").active = !isLast;

            item.parent = this.itemBig.parent;
            this.itemArr.push(item);
            if(this.itemArr.length > this.constNum){
                let item0 = this.itemArr.shift();
                item0 && item0.destroy();
            }
        }.bind(this));
    }


    // update (dt) {}
}
