import BaseComponent from "./BaseComponent";
import { Actions } from "../Actions";

export interface PUSH_DATA {
    key: string,
    data?: any,
    arguments?: any[]
}
const { ccclass, property } = cc._decorator;

let SCALE_ZEOR = 0.001;     // scale = 0 时会触发引擎一系列Bug 引擎版本2.0.9


@ccclass
/**
 * 界面基类
 * 1.实现消息推送 接受
 * 2.实现界面入场 离场处理逻辑 和 动画
 * 备注：界面节点的 0 1动画预留为入场和离场动画
 */
export default class BaseView extends BaseComponent {
    protected _isClosing: boolean = false;

    _isShowAction: boolean = true;
    _AudioID: number = -1
    /**
     * 判断当前界面(UI)已经被打开
     */
    get isOpen() {

        //界面位于屏幕中心位置并且active
        if ((this.node.x < 100 && this.node.x > -100) &&
            (this.node.y < 100 && this.node.y > -100) &&
            this.node.active) {
            return true;
        }
        return false;
    }

    /**
     * 消息推送函数
     *
     * @date 2019-04-22
     * @param {(string | cc.Node)} node 目标节点或者目标节点的路径
     * @param {PUSH_DATA} data 
     * @param {cc.Node} [parentNode] 目标节点的父节点
     * @memberof BaseView
     */
    push(node: string | cc.Node, data: PUSH_DATA, parentNode?: cc.Node) {
        let target: cc.Node = undefined;
        if (typeof node === "string") {
            target = cc.find(node, parentNode);
        } else {
            target = node;
        }

        CC_DEBUG && Debug.assert(!cc.isValid(target), "节点 %s 不存在, 推送消息失败!", <string>node);
        let script = target.getComponent(target.name);

        CC_DEBUG && Debug.assert(!cc.isValid(script), "组件%s 或者 _onMessage 方法 不存在,推送消息失败!" + target.name);
        script._onMessage(data);
    }
    /**
     * 授信函数
     *
     * @date 2019-04-22
     * @param {PUSH_DATA} msg
     * @memberof BaseView
     */
    _onMessage(msg: PUSH_DATA) {
        if (typeof this[msg.key] === "function") {
            if (Array.isArray(msg.arguments)) {
                this[msg.key].apply(this, msg.arguments);
            }
            else {
                this[msg.key](msg.data);
            }
            return;
        }
        else if (typeof this.onMessage === "function") {
            this.onMessage(msg);
            return;
        }
        CC_DEBUG && Debug.assert(true, "%s 节点无法处理消息: %s", this.node.name, msg.key)
    }
    onMessage(msg: PUSH_DATA) {

    }
    /**
     * 当界面被打开
     */
    onOpen() {

    }
    /**
     * 当界面离开
     */
    onLeave() {

    }
    /**
     * 显示界面
     */
    async show(showAction: boolean = true, isWait: boolean = true) {
        let widget = this.node.getComponent(cc.Widget);
        this.node.opacity = 0;
        this.node.active = true;
        if (widget && widget.enabled) {       // 如果界面存在 widget 则在 操作 scale 时会使 widget 触发对齐事件导致节点的 size 发生变化
            // this.node.scale = 1;
            widget.updateAlignment();
            widget.enabled = false;
        }
        this.node.scale = SCALE_ZEOR;
        this.node.opacity = 255;
        if (showAction && this._isShowAction) {
            if (isWait) {
                await Actions.runActionSync(this.node, Actions.UIScaleBackOut(0.5, SCALE_ZEOR, 1));
            } else {
                Actions.runActionSync(this.node, Actions.UIScaleBackOut(0.5, SCALE_ZEOR, 1));
            }
        }
        else {
            this.node.setPosition(0, 0);
            this.node.scale = 1;
        }
        this.onOpen();
    }
    /**
     * 关闭界面
     * 如果有第二个动画则播放
     */
    async close(showAction: boolean = true) {
        if (this._isClosing) {  // 防止多次关闭
            return;
        }
        AudioMgr.stopSound(this._AudioID)
        if (showAction && this.node.active) {
            this._isClosing = true;
            await Actions.runActionSync(this.node, Actions.UIScaleBackIn(0.5, 1, SCALE_ZEOR));
        }
        this.node.active = false;
        // this.node.setPosition(-20000, 0);
        this.onLeave();
        this._isClosing = false;
    }



}
