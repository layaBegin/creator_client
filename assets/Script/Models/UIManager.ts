import { AssetManager } from "./AssetManager";

// var uiPrefabUrl: string = "UIPrefabs/";

export class UIManager {
    private static _instance: UIManager = undefined;
    private _root: cc.Node = undefined;

    private __uiParent: cc.Node = undefined;
    private get _uiParent() {
        if (!cc.isValid(this.__uiParent)) {
            this.__uiParent = cc.director.getScene().children[0].getChildByName("_uiParent");
        }
        return this.__uiParent;
    }
    private set _uiParent(v: cc.Node) {
        this.__uiParent = v;
    }

    private __frontNode: cc.Node = undefined;
    private get _frontNode() {
        if (!cc.isValid(this.__frontNode)) {
            this.__frontNode = cc.director.getScene().children[0].getChildByName("_frontNode");
        }
        return this.__frontNode;
    }
    private set _frontNode(v: cc.Node) {
        this.__frontNode = v;
    }
    _loadedUI: { [key: string]: cc.Prefab } = Object.create(null);
    _createdUI: { [key: string]: cc.Node } = Object.create(null);

    private _waiting: cc.Node = undefined;
    private _confirm: cc.Node = undefined;

    static getInstance() {
        if (!UIManager._instance) {
            UIManager._instance = new UIManager();
        }
        return UIManager._instance;
    }
    constructor(rootNode?: cc.Node) {
        UIManager._instance = this;
        if (rootNode) {
            this.init(rootNode);
        }


    }
    async init(rootNode: cc.Node) {
        this._root = rootNode;
        let UIParent = new cc.Node("UIParent");
        this._uiParent = UIParent;
        UIParent.parent = this._root;
        UIParent.setContentSize(this._root.getContentSize());

        let frontNode = new cc.Node("frontNode");
        this._frontNode = frontNode;
        frontNode.parent = this._root;
        frontNode.setContentSize(this._root.getContentSize());

        (<any>window).Global.MessageCallback.addListener("DesignResolutionChanged", this);

    }
    messageCallbackHandler = function (route: string, msg: any) {
        if (route === "DesignResolutionChanged") {
            let size: cc.Size = msg;
            this._uiParent.setContentSize(size);
            this._frontNode.setContentSize(size);
        }
    }
    /**
     * ???????????????????????????
     * @param url ?????????????????????
     * @param data ????????????????????????
     * @param isAutoRelease ???????????????????????????????????? ??????????????? ???UI??????????????????????????? (?????? ?????? ????????????)
     */
    async loadView(url: string, data?: any, isAutoRelease: boolean = true) {
        let uiNode: cc.Node = this._createdUI[url];
        let script: any = undefined;
        let uiName = this._urlToName(url);
        if (!this.isExit(url)) {
            let uiPrefab = this._loadedUI[url];
            if (!cc.isValid(uiPrefab)) {
                uiPrefab = await AssetManager.getInstance().loadResSync(url, cc.Prefab);
                AssetManager.getInstance().removeCache(url);   // ???????????? ui?????????????????? _loadedUI ??????
                if (CC_DEV && !cc.isValid(uiPrefab)) {
                    console.error("??????????????????::" + url);
                    return undefined;
                }
            }
            uiNode = this._createByPrefab(uiPrefab, url);
        }
        script = uiNode.getComponent(uiName);
        if (script) {
            script.dialogParameters = data;
            script.isDestroy = false;
        }
        uiNode.parent = this._uiParent;

        isAutoRelease && delete this._loadedUI[url];
    }
    /**
     * ????????????????????????UI?????????
     * 
     * @date 2019-05-06
     * @
     * @param {string} url ?????? resources ??? ????????? ???????????????
     * @param {*} [params]
     * @param {Function} [cb]
     * @memberof UIManager
     */
    async create(url: string, params?: any, cb?: Function) {
        if (CC_DEBUG && url == "Hall/HallDialog") {
            console.trace();
            debugger;
        }
        cc.log(" create UI:: " + url);
        let IS_SYNC = !cb; // ??????????????????
        let callback = (error: string, uiNode?: cc.Node) => {
            if (!IS_SYNC && typeof cb === "function") { // ????????????
                cb(error, uiNode);
                return [];      // ??????????????? ??????????????? void ??????????????????????????????????????????
            }

            return [error, uiNode]; // ????????????
        }
        let uiName: string = this._urlToName(url);
        if (!uiName) {
            return callback("Create UI failed: url is null");
        }
        // ??????????????? UI
        let uiNode: cc.Node = this._createdUI[url] || null;
        if (this.isExit(url)) {
            console.log("Create UI is exist");
            uiNode.zIndex += 1;
            return callback(null, uiNode);
        }
        let _create = (uiPrefab: cc.Prefab): [string, cc.Node] => {
            if (uiPrefab && cc.isValid(uiPrefab)) {
                this._loadedUI[url] = uiPrefab;
                uiNode = cc.instantiate(uiPrefab);
                if (!uiNode || !cc.isValid(uiNode)) {
                    console.warn(url + " Prefab has been destroyed");
                    delete this._loadedUI[url];     //????????????????????????????????????
                }
                else {
                    this._createdUI[url] = uiNode;
                    uiNode.getComponent(uiName).dialogParameters = params;
                    uiNode.getComponent(uiName).isDestroy = false;
                    uiNode.parent = this._uiParent;
                    return [null, uiNode];
                }
            }
            return ["create failed", null];
        }
        // ?????? UI ??????
        let uiPrefab = this._loadedUI[url];
        // ?????????????????????????????????
        let error: string;
        [error, uiNode] = _create(uiPrefab);
        if (uiNode) {
            return callback(null, uiNode);
        }
        uiPrefab = undefined;
        //?????? UI ??????????????????
        if (IS_SYNC) {     // ??????
            if (!uiPrefab) {
                uiPrefab = await AssetManager.getInstance().loadResSync(url, cc.Prefab);
                AssetManager.getInstance().removeCache(url);   // ????????????
            }
            [error, uiNode] = _create(uiPrefab);
            return callback(error, uiNode);
        }
        else {
            AssetManager.getInstance().loadResSync(url, cc.Prefab, null, (err, res) => {
                AssetManager.getInstance().removeCache(url);   // ????????????
                if (err) {
                    callback("load UI prefab failed", null);
                    return;
                }
                [error, uiNode] = _create(res);
                return callback(error, uiNode);
            })
        }

    }

    isExit(ui: string | cc.Node | cc.Component, ) {
        let [url, uiNode] = this._getUI(ui);
        return !!uiNode && cc.isValid(uiNode) && cc.isValid(uiNode.parent); // ???????????????????????????????????????
        // return !!this._createdUI[url] && cc.isValid(this._createdUI[url]) && cc.isValid(this._createdUI[url].parent);  // ???????????????
    }

    addUI(url: string, uiNode: cc.Node) {
        this._createdUI[url] = uiNode;
    }

    destroyUI(ui: string | cc.Node | cc.Component, isClearPrefabs: boolean = false) {
        let [url, uiNode] = this._getUI(ui);
        if (!uiNode) {
            console.warn("destroy UI not exist:" + url);
            return;
        }
        let uiName = this._urlToName(url);
        let uiJS = uiNode.getComponent(uiName);

        this._unscheduleAll(uiNode);
        uiNode.destroy();

        uiJS.isDestroy = true;
        delete this._createdUI[url];

        if (isClearPrefabs) {
            delete this._loadedUI[url];
            // AssetManager.getInstance().releaseNode(uiNode);
        }
        console.log("destroy UI succeed:" + url);
    }
    private _unscheduleAll(node: cc.Node | any) {
        let visitNodeR = function (node: cc.Node | any) {
            for (let i = 0; i < (<any>node)._components.length; i++) {
                if (typeof node._components[i].unscheduleAllCallbacks === "function") {
                    node._components[i].unscheduleAllCallbacks();
                }
            }
            for (let i = 0; i < node.children.length; i++) {
                visitNodeR(node.children[i]);
            }
        }
        console.time("?????????????????????");
        console.log(node.name);
        visitNodeR(node);
        console.timeEnd("?????????????????????");
    }


    destroyAllUI() {
        for (const url in this._createdUI) {
            let uiNode: cc.Node = this._createdUI[url];
            if (cc.isValid(uiNode)) {           // ???????????????????????????
                let uiName = this._urlToName(url);
                let uiJs = uiNode.getComponent(uiName);
                if (uiJs) {
                    uiJs.isDestroy = true;
                }
                this._unscheduleAll(uiNode);
                uiNode.destroy();
            }
        }

        this._createdUI = Object.create(null);
        this._loadedUI = Object.create(null);
    }
    private _getUI(ui: string | cc.Node | cc.Component): [string, cc.Node] {
        var uiNode: cc.Node = undefined;
        let url = "";
        if (typeof ui === "string") {
            url = ui;
            uiNode = this._createdUI[url];
            return [url, uiNode];
        }

        if (ui instanceof cc.Node) {
            uiNode = ui;
        }
        if (ui instanceof cc.Component) {
            uiNode = ui.node;
        }
        if (!uiNode) {
            console.warn("get ui url failed");
            return [url, null]; // ?????????
        }
        // ????????????????????? UI
        for (const key in this._createdUI) {
            let _uiNode = this._createdUI[key];
            if (_uiNode == uiNode) {
                url = key;
                return [url, uiNode];
            }
        }

        return ["", null];  // ?????????
    }

    private _urlToName(url: string) {
        return url.split('/').slice(-1)[0];
    }
    private _createByPrefab(uiPrefab: cc.Prefab, url: string): cc.Node {
        let uiNode: cc.Node = undefined;
        if (uiPrefab && cc.isValid(uiPrefab)) {
            this._loadedUI[url] = uiPrefab;
            uiNode = cc.instantiate(uiPrefab);
            this._createdUI[url] = uiNode;
            return uiNode;
        }
        if (CC_DEV) {
            console.warn("??????????????????::" + url);
        }
        return undefined;
    }

    // ???????????? ??????
    /*
    async showWaiting(tip?: string, ignoreCount: boolean = false) {
        Global.Waiting.show(tip, ignoreCount);
    }
    removeWaiting(count = 1) {
        Global.Waiting.hide(count);
    }

    async showConfirm(content: string, cbOk: Function, cbCancel: Function, isRotate: boolean) {
        if (!this._confirm || !cc.isValid(this._confirm)) {
            let prefab = await AssetManager.getInstance().loadResSync("Pop/PopDialog", cc.Prefab);
            AssetManager.getInstance().removeCache("Pop/PopDialog");

            this._confirm = cc.instantiate(prefab);
            this._confirm.parent = this._frontNode;
        }
        let uiJs = this._confirm.getComponent("PopDialog");
        if (uiJs) {
            uiJs.addPopDialog(content, cbOk, cbCancel, isRotate)
        }
    }
    removeConfirm() {
        if (this._confirm && cc.isValid(this._confirm)) {
            let uiJs = this._confirm.getComponent("PopDialog");
            if (uiJs) {
                uiJs.removeLastPopDialog();
                return
            }
        }

        if (CC_DEV) {
            console.error("??????????????????????????? PopDialog");
        }
    }

    async showTip(content: string, okCallback?: () => void, cancelCallback?: () => void) {
        Confirm.show(content, okCallback, cancelCallback)
    }

    */

}
