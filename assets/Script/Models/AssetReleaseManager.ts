import { Utiles } from "./Utiles";

let arrayToObject = function <T>(arr: string[], value: T, obj?: Object) {
    obj = obj || Object.create(null);
    if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length; i++) {
            obj[arr[i]] = value;
        }
    }
    return obj;
}

class EntryUrl {
    type: Function
    uuid: string
}
class EntryUuid {
    type: Function
    path: string
    constructor(type?: any, path?: string) {
        this.type = type;
        this.path = path;
    }
}
let mainTaskInterval = 10000;    // 主任务 执行间隔时间 ms
let autoCollectInterval = 10000; // 自动收集未使用资源任务 的间隔时间 ms 

let _cacheReferenceKeys: { [key: string]: boolean } = Object.create(null);
let _runningReferenceKeys: { [key: string]: boolean } = Object.create(null);

let isAutoRelease: boolean = false;

/**
 * 资源释放管理器
 * 有效资源的定义:
 * 1.被场景持有
 *  常驻节点
 *  静态节点
 *  动态节点
 *      被以上节点的组件持有
 *          引擎预定义组件
 *          开发者自定义组件
 *              必须直接持有 即 this.xxx = cc.Asset 组件内的局部变量持有不算
 *              假如你有一个 cc.SpriteFrame 是局部变量，你使用了异步（延迟）的方式将它赋值给一个精灵。很抱歉它可能在赋值前会被垃圾回收处理掉
 *      
 * 2.明确告知 AssetReleaseManager 的动态缓存对象, 需要调用 addAssetCache 将对象传入
 *
 * @date 2019-05-07
 * @export
 * @class AssetReleaseManager
 */
export class AssetReleaseManager {

    private static _instance: AssetReleaseManager = undefined;
    private _pathToUuid: { [key: string]: EntryUrl } = undefined;
    private _uuidToPath: { [key: string]: EntryUuid } = undefined;   //一个简单的 map 表
    private _unusedReferenceKey: { [key: string]: boolean } = Object.create(null);   // 释放列表
    private _releaseTasks: number[] = [];
    /**
     * cc.loader 是否正在加载信号量
     * 正在加载时暂停自动收集、自动释放任务，否则会对正在加载项的依赖造成误伤
     */
    // private static _loadingCount: number = 0;   // 正在加载 信号量   正在加载时暂停自动释放任务
    _releaseUtile: ReleaseUtile = undefined;
    static assetCacheMap: { [key: string]: any } = Object.create(null);
    /**
     * 添加动态缓存对象
     * 此处不是直接添加资源缓存对象 而是通过资源缓存对象的父对象和属性名动态获取
     * 如此有一个好处就是 在父对象中资源缓存对象可以随时被新对象替换却不用重新 addAssetCache
     *
     * @date 2019-05-07
     * @static
     * @param {string} key 动态缓存对象的属性名
     * @param {*} obj 动态缓存对象所在的父对象 
     * @memberof AssetReleaseManager
     */
    addAssetCache(key: string, obj: any) {
        AssetReleaseManager.assetCacheMap[key] = obj;
    }
    removeAssetCache(key: string) {
        delete AssetReleaseManager.assetCacheMap[key];
    }

    static getInstance() {
        if (!AssetReleaseManager._instance) {
            AssetReleaseManager._instance = new AssetReleaseManager();
        }
        return AssetReleaseManager._instance;
    }
    constructor() {
        AssetReleaseManager._instance = this;
        this._releaseUtile = new ReleaseUtile();

        let path2uuid = (<any>cc.loader)._resources._pathToUuid;
        this._pathToUuid = path2uuid;
        this._uuidToPath = Object.create(null);
        for (const path in path2uuid) {
            let items = path2uuid[path];
            if (!Array.isArray(items)) {
                items = [items];
            }
            for (let i = 0; i < items.length; i++) {
                let entry: EntryUrl = items[i];
                //多个 uuid 对应同一个 path
                this._uuidToPath[entry.uuid] = new EntryUuid(entry.type, path);
            }
        }

        this._startMainTask();
    }
    /**
     * 垃圾收集与垃圾释放任务
     * 此处需要格外注意一个引擎加载逻辑问题:
     * 加载 cc.Asset时(如一个较大的预制体) 引擎是先加载所有依赖再最后一个加载该预制体
     * 基于此种逻辑，当预制体未加载完成时 自动垃圾收集启动, 此时垃圾收集会将该预制体已加载的所有依赖项都列为 垃圾资源 送入释放队列
     * 如果采用 自动释放策略 将有10秒 加载缓存期 10秒内加载完成将不会有任何问题
     * 如果采用 立即释放策略 请注意立即释放的时机, 不要在某项加载未完成前调用立即释放接口，否则将有几率造成正在加载的 cc.Asset 为一个无效资源
     * 如果不希望发生这种异常 可追加一个 加载中信号量 当信号量为 0 才允许释放资源
     */
    private _startMainTask() {
        let autoCollectTask = undefined;    // 自动收集垃圾任务

        setInterval(() => {
            if (isAutoRelease) {
                let keys = Object.keys(this._unusedReferenceKey)
                let size = keys.length;
                if (size > 0) {
                    console.log("共 " + size + " 个资源垃圾等待释放");
                    if (this._releaseTasks.length == 0) {
                        if (autoCollectTask) {
                            clearInterval(autoCollectTask);     // 释放资源时 暂停任务
                            autoCollectTask = undefined;
                        }
                        this.releaseImmediate(keys);    // 立即释放
                    }
                    TextureMemoryUtile.getTotalPngMemory();     // 统计纹理内存
                }
                else {
                    if (this._releaseTasks.length > 0) {
                        for (let i = 0; i < this._releaseTasks.length; i++) {
                            const taskId = this._releaseTasks[i];
                            clearInterval(taskId);
                        }
                        this._releaseTasks = [];
                        console.log("资源释放任务完成");
                    }
                    if (!autoCollectTask) {    //当自动释放任务完成后 再开始自动回收垃圾
                        console.log("开始自动回收垃圾任务");
                        autoCollectTask = this._autoCollectUnusedTask();
                    }
                }
            }
            else {
                TextureMemoryUtile.getTotalPngMemory();     // 统计纹理内存
            }
        }, mainTaskInterval);
    }
    /**
     * 自动收集垃圾资源
     * 由于自动收集到的垃圾资源是延迟释放的,所以此处存在一个不足
     * 假如自动收集到的垃圾为 A ,在 A 被释放前 进行了一次加载 B 的操作 B 引用了 A, 但 B 也是一个垃圾资源
     * 此后 A 会被正确释放, 但是 B 需要在 下一次自动收集垃圾时才会被收集, 所以在 A 被释放时 将会报出若干个警告: A was released but maybe still referenced by B
     */
    private _autoCollectUnusedTask() {
        let usedCount = 0;
        return setInterval(() => {
            let _cache: { [key: string]: any } = (<any>cc.loader)._cache;
            if (Object.keys(_cache).length == usedCount) {
                return;
            }
            console.time("执行自动回收垃圾任务");
            let count = 0;
            _cacheReferenceKeys = this.getCacheReferenceKeys();
            _runningReferenceKeys = this._releaseUtile.getRunningAsset();
            for (const key in _cache) {
                let item = _cache[key];
                if (item.type == "js") {    // 不检查 js
                    continue;
                }
                if (!item.complete) {        // 不检查加载失败(跨域等问题)资源 cc.loader.release 时也跳过了 失败资源
                    continue;
                }
                let isUse = this.isUsed(key);
                if (!isUse) {   //如果 没有被任何对象持有 则放进释放队列 等待释放
                    count++;
                    this._unusedReferenceKey[key] = true;    //如果采用延迟释放 这可能是一个重复的设置
                }
            }
            // 如果没有可回收的垃圾 则简单记录当前资源表个数 用于下次判断是否遍历资源 防止无意义的遍历造成的性能损耗
            // 这可能造成极小几率的极小部分资源内存泄露, 但是我不管 
            // 当资源有且仅被 一个对象(比如node) 持有 并有且仅执行 释放引用操作( node.destroy() 或者 ScriptComp.xxx = null 或者 delete ScriptComp.xxx 等等) 时, 该资源将在 新资源加载 或者 旧资源释放 后(即 cc.loader._cache 变化)才会被自动回收 
            if (count == 0) {
                usedCount = Object.keys(_cache).length;
            }
            console.log("共回收 " + count + " 个资源垃圾");
            console.timeEnd("执行自动回收垃圾任务");
        }, autoCollectInterval);
    }
    releaseUnused() {
        let _cache: { [key: string]: any } = (<any>cc.loader)._cache;
        _cacheReferenceKeys = this.getCacheReferenceKeys();
        _runningReferenceKeys = this._releaseUtile.getRunningAsset();
        for (const key in _cache) {
            let item = _cache[key];
            if (item.type == "js") {
                continue;
            }
            if (!item.complete) {
                continue;
            }
            let isUse = this.isUsed(key);
            if (!isUse) {
                cc.loader.release(key);
                delete this._unusedReferenceKey[key];
            }
        }
    }
    private release(referenceKey: string, isForce: boolean = false) {
        if (!isForce) {
            this._unusedReferenceKey[referenceKey] = true;
        }
        else {
            cc.loader.release(referenceKey);
        }
    }
    releaseUrl(url: string, type?: { new(): cc.Asset }) {
        let referenceKey = this.pathToReferenceKey(url, type);
        if (referenceKey) {
            this.release(referenceKey);
        }
    }
    releaseAsset(asset: cc.Asset) {
        let referenceKey = (<any>cc.loader)._getReferenceKey(asset);
        if (referenceKey) {
            this.release(referenceKey);
        }
    }

    releaseDir(dir: string, type?: { new(): cc.Asset }) {
        let urls: string[] = [];
        console.time("检索目录 " + dir);
        let uuids = (<any>cc.loader)._resources.getUuidArray(dir, type, urls);
        console.timeEnd("检索目录 " + dir);
        console.time("释放目录 " + dir);
        for (let i = 0; i < uuids.length; i++) {
            let referenceKey = (<any>cc.loader)._getReferenceKey(uuids[i]);
            if (referenceKey) {
                // this.release(urls[i]);
                this.release(referenceKey);
            }
        }
        console.timeEnd("释放目录 " + dir);
    }
    releaseDirs(dirs: string[], type?: { new(): cc.Asset }) {
        if (Array.isArray(dirs)) {
            for (let i = 0; i < dirs.length; i++) {
                this.releaseDir(dirs[i], type);
            }
        }
    }
    releaseNode(node: cc.Node, isForce: boolean = false) {
        node.destroy();     // 销毁节点 下一帧生效
        let referenceKeys = this._releaseUtile.getNodeResR(node);
        for (const key in referenceKeys) {
            this.release(key, isForce);
        }
    }


    /**
     * 立即释放 _unusedReferenceKey 队列中的未使用资源
     */
    releaseImmediate(referenceKeys?: string[]) {
        let keys = referenceKeys;
        if (!keys) {
            keys = Object.keys(this._unusedReferenceKey);
        }
        let size: number = keys.length;

        if (size) {
            let keys = Object.keys(this._unusedReferenceKey);
            _cacheReferenceKeys = this.getCacheReferenceKeys();
            _runningReferenceKeys = this._releaseUtile.getRunningAsset();
            let count = 0;
            let released = Object.create(null);
            for (const key of keys) {
                let isUse = this.isUsed(key);
                if (!isUse) {
                    count++;
                    cc.loader.release(key);
                }
                delete this._unusedReferenceKey[key];
            }
            console.log("共释放 " + count + " 个资源垃圾");

            setTimeout(() => {
                console.time("cc.sys.garbageCollect  ")
                cc.sys.garbageCollect();
                console.timeEnd("cc.sys.garbageCollect  ")
            }, 1000);
        }
    }

    isUsed(referenceKey: string) {
        if (_cacheReferenceKeys[referenceKey]) {
            return true;
        }
        if (_runningReferenceKeys[referenceKey]) {
            return true;
        }
        return false;
    }


    referenceKeyToPath(referenceKey: string) {
        let item = (<any>cc.loader)._cache[referenceKey];
        if (item) {
            let entry = this._uuidToPath[item.uuid];
            if (entry) {
                return entry.path;
            }
        }
        if (CC_DEV) {
            // console.error(referenceKey + " 不存在 path 信息");  // 引擎内置纹理没有路径
        }
        return "";
    }
    getResUuid(url: string, type?: { new(): cc.Asset }) {
        return (<any>cc.loader)._getResUuid(url, type);
    }
    pathToReferenceKey(url: string, type?: { new(): cc.Asset }) {
        let uuid = this.getResUuid(url, type);
        return (<any>cc.loader)._getReferenceKey(uuid);
    }


    init() {

    }
    getCacheReferenceKeys() {
        console.time("收集缓存资源")
        let map = AssetReleaseManager.assetCacheMap;
        let referenceKeys = Object.create(null);
        for (const key in map) {
            let cache = map[key][key];
            /**
             * 直接缓存 cc.Asset 的数组
             */
            if (Array.isArray(cache)) {     // 资源数组
                if (cache[0] instanceof cc.Asset) {
                    for (let i = 0; i < cache.length; i++) {
                        let ownerKey = (<any>cc.loader)._getReferenceKey(cache[i]);
                        referenceKeys[ownerKey] = true  // 将主依赖提前
                        arrayToObject(cc.loader.getDependsRecursively(cache[i]), true, referenceKeys);
                    }
                }
            }
            else {
                /**
                 * 以 url 为 key 的对象
                 * 1. url => referenceKeys[]
                 * 2. url => cc.Asset
                 */
                for (const key in cache) {
                    let item = cache[key];
                    if (Array.isArray(item)) {
                        if (typeof item[0] === "string") {      // referenceKey 数组
                            arrayToObject(item, true, referenceKeys);
                        }
                    }
                    else if (item instanceof cc.Asset) {   // 单个资源
                        let ownerKey = (<any>cc.loader)._getReferenceKey(item);
                        referenceKeys[ownerKey] = true  // 将主依赖提前
                        arrayToObject(cc.loader.getDependsRecursively(item), true, referenceKeys);
                    }
                }
            }
        }
        console.timeEnd("收集缓存资源");
        return referenceKeys;
    }

}

class ReleaseUtile {
    showCacheTextureUrl() {
        let caches = (<any>cc.loader)._cache;
        for (const key in caches) {
            let item = caches[key];
            let content = item.content;
            if (content && content instanceof cc.Texture2D) {
                console.log(AssetReleaseManager.getInstance().referenceKeyToPath(key) +
                    Utiles.formatStr("::%s * %s * 4 = %s", content.width, content.height, TextureMemoryUtile.getPngMemoryMb(content)));
            }
        }
    }
    showAllCacheUrl() {
        let caches = (<any>cc.loader)._cache;
        for (const key in caches) {
            console.log(AssetReleaseManager.getInstance().referenceKeyToPath(key));
        }
    }

    getNodeResR(node: cc.Node) {
        var res: { [key: string]: boolean } = Object.create(null);
        console.time("收集正在执行的资源列表");
        this.visitNodeR(node, res);
        console.timeEnd("收集正在执行的资源列表");
        return res;
    }
    /**
     * 收集当前场景的所有依赖资源
     *
     * @date 2019-05-07
     * @returns
     * @memberof ReleaseUtile
     */
    getRunningAsset() {
        var res: { [key: string]: boolean } = Object.create(null);
        let scene = this.getScene();
        console.time("收集正在执行的资源列表");
        this.visitNodeR(scene, res);
        console.timeEnd("收集正在执行的资源列表");
        return res;
    }
    getScene(scene?: cc.Scene) {
        if (scene && scene instanceof cc.Scene) {
            return scene;
        }
        return cc.director.getScene();
    }
    getCanvas(canvas?: cc.Node) {
        if (canvas && canvas instanceof cc.Node && canvas.getComponent(cc.Canvas)) {
            return canvas;
        }
        let scene = this.getScene();
        let comp = scene.getComponentInChildren(cc.Canvas);
        return comp.node;
    }


    parseDependsR(referenceKey: string, parsed: { [x: string]: boolean; }, key?: string) {
        var item = (<any>cc.loader).getItem(referenceKey);
        if (item) {
            var depends = item.dependKeys;
            if (depends) {
                for (var i = 0; i < depends.length; i++) {
                    var depend = depends[i];
                    if (depend == key) {
                        return true
                    }
                    else {
                        if (!parsed[depend]) {
                            parsed[depend] = true;
                            if (this.parseDependsR(depend, parsed, key)) {
                                return true
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    visitAssetR(asset: cc.RawAsset, excludeMap: { [x: string]: boolean; }, key?: string) {
        if (!(<any>asset)._uuid) {
            return false;
        }
        var referenceKey = (<any>cc.loader)._getReferenceKey(asset);
        if (referenceKey == key) {
            return true;
        }
        else {
            if (!excludeMap[referenceKey]) {
                excludeMap[referenceKey] = true;
                return this.parseDependsR(referenceKey, excludeMap, key);
            }
        }
    }

    visitComponentR(comp: cc.Component, excludeMap: { [key: string]: boolean; }, key?: string) {
        var props = Object.getOwnPropertyNames(comp);
        for (var i = 0; i < props.length; i++) {
            var value = comp[props[i]];
            if (typeof value === 'object' && value) {
                if (Array.isArray(value)) {
                    for (let j = 0; j < value.length; j++) {
                        let val = value[j];
                        if (val instanceof cc.RawAsset) {
                            if (this.visitAssetR(val, excludeMap, key)) {
                                return comp;
                            }
                        }
                    }
                }
                else if (!value.constructor || value.constructor === Object) {
                    let keys = Object.getOwnPropertyNames(value);
                    for (let j = 0; j < keys.length; j++) {
                        let val = value[keys[j]];
                        if (val instanceof cc.RawAsset) {
                            if (this.visitAssetR(val, excludeMap, key)) {
                                return comp;
                            }
                        }
                    }
                }
                else if (value instanceof cc.RawAsset) {
                    if (this.visitAssetR(value, excludeMap, key)) {
                        return comp;
                    }
                }
            }
        }
        return false;
    }

    visitNodeR(node: cc.Node, excludeMap: { [key: string]: boolean }, key?: string) {
        for (let i = 0; i < (<any>node)._components.length; i++) {
            if (this.visitComponentR((<any>node)._components[i], excludeMap, key)) {
                return (<any>node)._components[i];
            }
        }
        for (let i = 0; i < node.children.length; i++) {
            let comp = this.visitNodeR(node.children[i], excludeMap, key)
            if (comp) {
                return comp;
            }
        }
        return false;
    }
}

class TextureMemoryUtile {
    private static _rootNode: cc.Node = undefined;
    private static _label: { [key: string]: cc.Label } = undefined;

    static getPngMemory(texture: cc.Texture2D) {
        return texture.width * texture.height * 4;  // Byte
    }

    static getPngMemoryMb(texture: cc.Texture2D) {
        return (texture.width * texture.height * 4 / 1024 / 1024).toFixed(2);
    }

    static getTotalPngMemory() {
        if (!false) {
            return "";
        }
        let total = 0;
        let caches = (<any>cc.loader)._cache;
        for (const key in caches) {
            let item = caches[key];
            let content = item.content;
            if (content && content instanceof cc.Texture2D) {
                total += this.getPngMemory(content);
                // console.log(AssetReleaseManager.referenceKeyToPath(key) + Utiles.formatStr("::%s * %s * 4 = %s", content.width, content.height, this.getPngMemoryMb(content)));
            }
        }
        let totalStr = (total / 1024 / 1024).toFixed(2)
        this._show(totalStr);
        return totalStr;
    }
    /**
     * 显示纹理缓存占用的内存
     *
     * @date 2019-05-08
     * @memberof PngMemoryUtile
     */
    static _show(str: string = "") {
        if (CC_DEV) {
            this._generateNode();
            let leftLabel = this._label.left;
            let rightLabel = this._label.right;
            leftLabel.string = "Texture Memory (Mb)";
            rightLabel.string = str;
        }
    }

    static async _generateNode() {

        if (cc.isValid(this._rootNode)) return;

        this._rootNode = new cc.Node('MEM-PROFILER');
        this._rootNode.x = 10;
        this._rootNode.y = 0;

        this._rootNode.zIndex = cc.macro.MAX_ZINDEX;
        cc.game.addPersistRootNode(this._rootNode);

        let left = new cc.Node('LEFT-PANEL');
        left.anchorX = left.anchorY = 0;
        left.parent = this._rootNode;
        let leftLabel = left.addComponent(cc.Label);
        leftLabel.fontSize = 15;
        leftLabel.lineHeight = 15;

        let right = new cc.Node('RIGHT-PANEL');
        right.anchorX = 1;
        right.anchorY = 0;
        right.x = 200;
        right.parent = this._rootNode;
        let rightLabel = right.addComponent(cc.Label);
        rightLabel.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
        rightLabel.fontSize = 15;
        rightLabel.lineHeight = 15;

        this._label = {
            "left": leftLabel,
            "right": rightLabel
        };
    }
}