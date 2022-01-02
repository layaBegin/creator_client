import BaseView from "../../BaseClass/BaseView";
import { LHDBConfig } from "./LHDBConfig";
import { Actions } from "../../Actions";
import { Utiles } from "../../Models/Utiles";

let { ccclass, property } = cc._decorator;
//奖励路径
/**
 * 奖励路径 
 * 从左往右
 */
let PathConfig = [
    [
        [0, 1, 3, 6, 10]
    ],
    [
        [0, 1, 3, 6, 11],
        [0, 1, 3, 7, 11],
        [0, 1, 4, 7, 11],
        [0, 2, 4, 7, 11]
    ],
    [
        [0, 1, 3, 7, 12],
        [0, 1, 4, 8, 12],
        [0, 1, 4, 7, 12],
        [0, 2, 4, 7, 12],
        [0, 2, 4, 8, 12],
        [0, 2, 5, 8, 12]
    ],
    [
        [0, 1, 4, 8, 13],
        [0, 2, 4, 8, 13],
        [0, 2, 5, 8, 13],
        [0, 2, 5, 9, 13]
    ],
    [
        [0, 2, 5, 9, 14]
    ]];
@ccclass
export default class LHDBDragonBall extends BaseView {
    @property(cc.Node)
    ball: cc.Node = undefined;
    @property(cc.Label)
    currScore: cc.Label = undefined;
    @property(cc.Label)
    score: cc.Label = undefined;
    @property(cc.Node)
    gems: cc.Node = undefined;
    @property([cc.Node])
    penzi: cc.Node[] = [];

    @property(cc.Node)
    result: cc.Node = undefined;


    posArray: cc.Vec2[] = [];
    randomIndex: number = 0;

    /**
     * 初始化龙珠夺宝界面
     */
    init(data: any) {
        AudioMgr.startPlayBgMusic("Game/LHDB/sound/lztb_bj");
        // 缓存坐标
        for (let i = 0; i < this.gems.children.length; i++) {
            let p = this.gems.children[i].getPosition();
            p = this.gems.convertToWorldSpaceAR(p);
            this.posArray.push(p);
        }
        this.result.active = false;
        // 显示当前评分
        this.score.string = Global.Utils.numberRound(data.score).toString();
        this.currScore.string = Global.Utils.numberRound(data.currentScore).toString();
        // 显示开始按钮
        this.node.getChildByName("btn_start").active = true;
        // 初始化火盆分数
        this.initPenzi(+this.currScore.string);
        // 初始化龙珠位置
        this.ball.setPosition(-10, 260);
        // 设置中奖下标
        this.randomIndex = data.randomIndex;
    }

    // 开始龙珠夺宝
    async onDragonStart(randomIndex: number = 0) {
        this.ball.setPosition(-10, 260);
        var tempVector = PathConfig[4 - randomIndex];
        var flg = Math.floor(Math.random() * tempVector.length);
        var pathVector = tempVector[flg];
        for (var i = 0; i < 5; i++) {
            let pos = this.posArray[pathVector[i]].clone();
            pos.y += 50;
            pos = this.ball.parent.convertToNodeSpaceAR(pos);
            var action = cc.jumpTo(0.5, pos, 10, 1);
            let tween = cc.tween().then(action);
            console.log(pos);
            this.playEffect("lztb_kl");
            await Actions.runActionSync(this.ball, tween);
        }
        // 垂直下落到盆子中
        let pos = this.ball.getPosition();
        pos.y -= 200;
        let tween = cc.tween().then(cc.jumpTo(1, pos, 0, 1))
        await Actions.runActionSync(this.ball, tween);
        // 盆子发出火焰特效
        this.playFire(pathVector[pathVector.length - 1]);
        await Utiles.sleep(800);
    }

    async onStartClicked(ev: cc.Event) {
        let btn: cc.Node = ev.target;
        btn.active = false;
        console.log("中奖下标::" + this.randomIndex);
        await this.onDragonStart(this.randomIndex);

        this.playEffect("lztb_js"); // 结算音
        this.result.active = true;
        // setTimeout(() => {
        //     this.close();
        // }, 5000);
    }
    async playFire(index: number) {
        let penzi: cc.Node = this.gems.children[index];
        let res = await AssetMgr.loadResSync("Game/LHDB/ani/penhuo/penhuo", cc.ParticleAsset);
        if (res) {
            let node = new cc.Node();
            node.parent = penzi;
            let ps = node.addComponent(cc.ParticleSystem);
            ps.autoRemoveOnFinish = true;   // 自动移除
            ps.file = <any>res;
            this.playEffect("lztb_dr");
        }
        // let fire = await AssetMgr.loadResSync("Game/LHDB/ani/penhuo/penhuo");
        // console.log(fire);
    }

    initPenzi(currScore: number) {
        let settleConfig = LHDBConfig.coreConfig.SettleConfig;
        let flag = 0;
        for (let i = 4; i >= 0; i--) {
            if (currScore < settleConfig.baseScore[i]) {
                flag = i;
            }
        }

        for (var i = 0; i < this.penzi.length; i++) {
            let score = currScore / settleConfig.baseBonus[flag] * settleConfig.gruop[flag][i];
            let label: cc.Label = this.penzi[i].children[1].getComponent(cc.Label);
            label.string = Global.Utils.numberRound(score).toString();
        }
    }

    onLeave() {
        AudioMgr.startPlayBgMusic("Game/LHDB/sound/lhdb_bj");
    }

    playEffect(uri: string) {
        let url = "Game/LHDB/sound/" + uri;
        AudioMgr.playSound(url);
    }

}
