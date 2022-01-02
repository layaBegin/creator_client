import BaseView, { PUSH_DATA } from "../BaseClass/BaseView";
import { AssetManager } from "../Models/AssetManager";
import { Actions } from "../Actions";

let _subViewMaskUrl: "_subViewMask" = "_subViewMask"
let SCALE_ZEOR = 0.001;
export class ViewManager {
    _subViewMask: cc.Node = undefined;      // 打开子界面时临时防击穿 遮罩

    _openingList: string[] = [];
    /**
     * 判断一个界面是否打开
     * @param viewUrl 
     */
    isOpen(viewUrl: string) {
        let [viewName, viewNode] = this._getViewInfo(viewUrl);
        if (cc.isValid(viewNode)) {
            let script: BaseView = viewNode.getComponent(viewName);
            if (script && script instanceof BaseView) {
                return script.isOpen;
            } else {
                return viewNode.active;
            }
        }
        return false;
    }
    /**
     * 打开一个子界面
     * prefabUrl 追加此参数时允许动态创建子界面
     *
     * @date 2019-06-24
     * @param {(string | { viewUrl: string, prefabUrl?: string, isShowAction?: boolean, isWait?: boolean })} viewUrl 子界面对象信息或者子界面节点路径
     * @param {PUSH_DATA} [msg] 传递给子界面的消息对象
     * @param {(script: BaseView) => void} [callback] 打开界面后的回调函数
     * @returns
     * @memberof ViewManager
     */
    async open(viewUrl: string | { viewUrl: string, prefabUrl?: string, isShowAction?: boolean, isWait?: boolean }, msg?: PUSH_DATA, callback?: (script: BaseView) => void) {
        this._showSubViewMask(true);        // 先显示一层透明防击穿层
        let prefabUrl: string = undefined;
        let isShowAction = true;    // 默认执行动画
        let isWait = false;         // 默认不等待完全打开在传递 msg
        if (typeof viewUrl !== "string") {
            prefabUrl = viewUrl.prefabUrl;
            isShowAction = viewUrl.isShowAction === undefined ? true : !!viewUrl.isShowAction;  // 默认开启动画
            isWait = !!viewUrl.isWait;
            viewUrl = viewUrl.viewUrl;
        }
        let [viewName, viewNode, parentNode] = this._getViewInfo(viewUrl);
        if (!viewNode) {    // 场景下不存在该界面节点 需要动态创建
            Waiting.show("正在打开...");
            if (!prefabUrl) {
                prefabUrl = this._getPrefabUrl(viewName);    // 如果没有指定预制路径 则获取配置文件中的预制路径
            }
            if (prefabUrl) {
                let prefab: cc.Prefab = await AssetManager.getInstance().loadResSync(prefabUrl, cc.Prefab);
                Waiting.hide();
                if (cc.isValid(prefab)) {
                    viewNode = cc.instantiate(prefab);
                    viewNode.parent = parentNode;
                }
                else {
                    console.error("加载预制失败 " + prefabUrl);
                    if (typeof callback === "function") {
                        callback(undefined);
                    }
                    return undefined;
                }
            }
        }
        CC_DEBUG && Debug.assert(!viewNode, "界面节点 %s 不存在", viewName);
        let script: BaseView = viewNode.getComponent(viewName);

        // 始终保持被打开的 View 显示在当前父节点最上层
        viewNode.setSiblingIndex(parentNode.childrenCount - 1);
        // 打开界面
        await this._show(script, viewNode, isShowAction, isWait, viewUrl);
        // 回调界面控制脚本
        this._onMessage(script, msg);

        setTimeout(() => {
            this._showSubViewMask(false);   // 当界面完全打开后 关闭防击穿层
        }, 500);
        if (typeof callback === "function") {
            callback(script);
        }
        else {
            return script;
        }
    }
    close(viewUrl: string | cc.Node) {
        this._showSubViewMask(false);    // 关闭透明防击穿层
        let [viewName, viewNode] = this._getViewInfo(viewUrl);
        if (viewNode) {
            let script: BaseView = viewNode.getComponent(viewName);
            if (script) {
                script.close();
            } else {
                this.closeNode(viewNode);
            }
        }
    }
    private async _show(script: any, viewNode: cc.Node, isShowAction: boolean, isWait: boolean, viewUrl?: string) {
        try {
            if (script && typeof script.show == "function") {
                await script.show(isShowAction, isWait);      // 内部执行 onOpen();
            }
            else {
                await this.showNode(viewNode, isShowAction, isWait);
            }
            return true;
        } catch (error) {
            console.error("打开界面失败::%s", viewUrl, error);
            return false;
        }
    }
    private _onMessage(script: any, msg: PUSH_DATA, viewUrl?: string) {
        try {
            // 优先尝试直接调用脚本函数
            if (msg && msg.key) {
                if (script && typeof script[msg.key] === "function") {
                    if (Array.isArray(msg.arguments)) {
                        script[msg.key].apply(script, msg.arguments);
                    }
                    else {
                        script[msg.key](msg.data);
                    }
                    return true;
                }
                // 尝试执行脚本的消息统一处理函数
                else if (script && typeof script.onMessage === "function") {
                    script.onMessage(msg);
                    return true;
                }
                else {
                    CC_DEBUG && Debug.assert(true, "%s 无法处理消息 %s", viewUrl, msg.key);
                    return false;
                }
            }
            else {
                return false;
            }

        } catch (error) {
            console.error("执行函数时发生错误::" + viewUrl + "." + msg.key);
            console.error(error);
            return false;
        }
    }

    pushMessage(viewUrl: string | cc.Node, msg: PUSH_DATA) {
        CC_DEBUG && Debug.assert((!msg || !msg.key), "推送的 msg 对象必须存在 key 属性");
        let [viewName, viewNode] = this._getViewInfo(viewUrl);
        if (viewNode) {
            let script: BaseView = viewNode.getComponent(viewName);
            if (script) {
                this._onMessage(script, msg, viewName);
            }
        }
        else {
            console.log("节点不存在,消息推送失败::" + viewName);
        }
    }
    pushToScene(msg: PUSH_DATA) {
        CC_DEBUG && Debug.assert((!msg || !msg.key), "推送的 msg 对象必须存在 key 属性");
        let scene = cc.director.getScene()
        let canvasNode = scene.children[0] // 规定场景第一节点必须 Canvas 节点
        CC_DEBUG && Debug.assert(!canvasNode.getComponent(cc.Canvas), "当前 %s 场景第一节点不是 Canvas 节点", scene.name);
        // 尝试使用节点名获取脚本组件
        let script = canvasNode.getComponent(canvasNode.name);
        if (!script) {
            // 尝试使用场景名获取脚本组件
            script = canvasNode.getComponent(scene.name);
        }
        CC_DEBUG && Debug.assert(!script, "找不到 %s 场景的控制脚本 规定脚本名必须与 场景 同名或者 Canvas 节点同名", scene.name);
        CC_DEBUG && Debug.assert(typeof script._onMessage !== "function", "当前 %s 场景没有 _onMessage 授信函数", scene.name);
        script._onMessage(msg);
    }
    /** 
     * 从子游戏返回大厅
    */
    goBackHall(gameID: number) {
        Waiting.show("正在返回大厅...");
        Global.Player.setPy("roomID", undefined);   // 清空房间信息
        CC_DEBUG && console.log("从 %s 返回大厅", gameID);
        // 取消所有游戏的消息监听
        Global.MessageCallback.removeListener("RoomMessagePush");
        Global.MessageCallback.removeListener("GameMessagePush");

        cc.director.loadScene("Hall");
        // 移除资源缓存 该子游戏资源将在大厅被延迟释放
        let resDir = Config.GameConfig[gameID] && Config.GameConfig[gameID].resDir
        if (resDir) {
            AssetMgr.removeCacheDirs(resDir);
        }
        else {
            console.warn("返回大厅,但无法识别子游戏,未释放资源");
        }
        Matching.kindId = 0;    // 当前房间置空
    }

    async showNode(node: cc.Node, isShowAction: boolean = true, isWait: boolean) {
        if (isShowAction) {
            let widget = node.getComponent(cc.Widget);
            node.opacity = 0;
            node.active = true;
            if (widget && widget.enabled) {       // 如果界面存在 widget 则在 操作 scale 时会使 widget 触发对齐事件导致节点的 size 发生变化
                // this.node.scale = 1;
                widget.updateAlignment();
                widget.enabled = false;
            }
            node.scale = SCALE_ZEOR;
            node.opacity = 255;
            if (isWait) {
                await Actions.runActionSync(node, Actions.UIScaleBackOut(0.5, SCALE_ZEOR, 1));
            } else {
                Actions.runActionSync(node, Actions.UIScaleBackOut(0.5, SCALE_ZEOR, 1));
            }
        }
        else {
            node.opacity = 255;
            node.active = true;
        }

    }
    async closeNode(node: cc.Node | any) {
        if (node._isClosing) {  // 防止多次关闭
            return;
        }
        node._isClosing = true;
        // 初始 scale 可能不是 1 而需要动态获取节点当前的 scale
        await Actions.runActionSync(node, Actions.UIScaleBackIn(0.5, 1, SCALE_ZEOR));
        node.active = false;
        node._isClosing = false;
    }
    /**
     * 获取Canvas节点下的节点的路径
     * Canvas 节点除外
     * 请勿用于常驻节点等非 Canvas 节点
     * 返回结尾没有 / 的 url
     */
    getNodeUrl(node: cc.Node) {
        let url = node.name;
        let visitNode = function (node: cc.Node) {
            if (!node) {
                return;
            }
            if (node instanceof cc.Scene) {
                return;
            }
            if (node.getComponent(cc.Canvas)) {
                return;
            }
            url = node.name + "/" + url;
            visitNode(node.parent);
        }
        visitNode(node.parent);

        return url;
    }
    _getViewInfo(viewUrl: string | cc.Node): [string, cc.Node, cc.Node] {
        CC_DEBUG && Debug.assert(!viewUrl, "节点路径不存在!");

        let viewNode: cc.Node = undefined;
        let viewName: string = undefined;
        let parentNode: cc.Node = undefined;
        if (viewUrl instanceof cc.Node) {
            viewNode = viewUrl;
            viewName = viewNode.name;
            parentNode = viewNode.parent;
        } else {
            viewName = viewUrl.split('/').pop();
            let parentUrl: string = viewUrl.replace(viewName, "");      // 去除 界面名字
            parentNode = this._getViewParent(parentUrl);
            viewNode = parentNode.getChildByName(viewName);
        }

        return [viewName, viewNode, parentNode];
    }
    _getViewParent(parentUrl: string) {
        let canvasNode = cc.director.getScene().children[0];
        if (!parentUrl) {
            return canvasNode;
        }
        parentUrl = parentUrl.replace(/\/$/, "");       // 去除尾部 '/'
        let parentNode = cc.find(parentUrl, canvasNode);
        if (!parentNode) {
            // CC_DEBUG && Debug.assert(true, "Canvas 下找不到节点 %s ", parentUrl);
            console.log("Canvas 下找不到节点 %s ", parentUrl)
            return canvasNode;
        }

        return parentNode
    }
    _getPrefabUrl(viewName: string) {
        let viewConfig = Config.ViewConfig || {};
        return viewConfig[viewName] || "";
    }
    _showSubViewMask(isShow: boolean) {
        let mask = this._getSubViewMask();
        if (mask) {
            mask.active = isShow;
        }
    }
    _getSubViewMask() {
        if (cc.isValid(this._subViewMask)) {
            return this._subViewMask;
        }

        this._subViewMask = cc.director.getScene().children[0].getChildByName(_subViewMaskUrl);
        return this._subViewMask;
    }

}