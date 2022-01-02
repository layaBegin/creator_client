

export class Actions {
    /**
     * 同步执行一个Action
     *
     * @date 2019-04-22
     * @static
     * @param {cc.Node} node
     * @param {cc.Tween} tweenAction
     * @returns
     * @memberof Actions
     */
    static async runActionSync(node: cc.Node, tween: cc.Tween) {
        return new Promise((resolve) => {
            tween.clone(node).then(cc.callFunc(() => {
                resolve();
            })).start();
        })
    }
    static async runDragonBonesSync(node: cc.Node, armatureName: string, aniName: string, playTimes: number = 1, timeScale: number = 1) {
        return new Promise((resolve, reject) => {
            try {
                if (node.activeInHierarchy == false) {
                    if (node.parent == undefined) {
                        console.error("当前骨龙动画未挂载到场景");
                    }
                    return;
                }
                let comp = node.getComponent(dragonBones.ArmatureDisplay);
                comp.armatureName = armatureName
                let complete = function () {
                    // comp.off(dragonBones.EventObject.COMPLETE, complete, this);
                    resolve();
                };
                /**存在once方法，引擎文档Bug */
                (<any>comp).once(dragonBones.EventObject.COMPLETE, complete, this);
                comp.timeScale = timeScale;
                comp.playAnimation(aniName, playTimes);

            } catch (error) {
                console.error("播放骨龙动画发生错误.")
                reject();
            }

        });
    }
    /**
     * UI节点专属Action 迅速缩放超过目标再缓慢回退到目标缩放大小
     * 可用于UI的入场 退场可使用 reverseTime() 倒置时间轴
     *
     * @date 2019-04-22
     * @static
     * @param {number} time
     * @param {number} [scale1=0.01]
     * @param {number} [scale2=1]
     * @returns {cc.Tween}
     * @memberof Actions
     */
    static UIScaleBackOut(time: number, scale1: number = 0.01, scale2: number = 1): cc.Tween {
        return cc.tween()
            .to(0, { scale: scale1 })   //一定要先设置初始缩放, 再设置位置和显示, 否则会有一帧的闪烁
            .then(cc.show())
            .then(cc.place(0, 0))
            .to(time, { scale: scale2 }, { easing: "backOut" });
    }
    /**
     * UI节点专属Action 先缓慢缩放超过目标再迅速缩放到目标大小
     * 可用于UI的退场
     *
     * @date 2019-04-22
     * @static
     * @param {number} time
     * @param {number} [scale1=0.01]
     * @param {number} [scale2=1]
     * @returns {cc.Tween}
     * @memberof Actions
     */
    static UIScaleBackIn(time: number, scale1: number = 1, scale2: number = 0.01): cc.Tween {
        return cc.tween()
            .to(0, { scale: scale1 })   //一定要先设置初始缩放, 再设置位置和显示, 否则会有一帧的闪烁
            .then(cc.show())
            .then(cc.place(0, 0))
            .to(time, { scale: scale2 }, { easing: "backIn" });
    }


    /**
     * 随庄动画
     *
     * @static
     * @param {node} Node
     */

    static async  RandBanker(Node: []) {
        for (let i = 0; i < 5; i++) {
            for (let index = 0; index < Node.length; index++) {
                let a = cc.tween().to(0.065, { opacity: 255 }).to(0.065, { opacity: 0 })
                AudioMgr.playSound('GameCommon/NN/sound1/select_banker');
                await this.runActionSync(Node[index], a)
            }
        }
    }


}