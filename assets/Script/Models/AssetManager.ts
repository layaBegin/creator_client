import { Utiles } from "./Utiles";

export enum AssetRetainType {
    NONE = 0,               // 未被持有
    STATIC_SCENE = 1,       // 场景静态持有
    RUNNING_SCENE = 2,
    MARK = 3,               // 手动标记持有
    RES_MANAGER_CACHE = 4,  // 资源管理器缓存持有
}


export class AssetManager {
    private static _instance: AssetManager = undefined;
    private _cache: { [key: string]: string[] } = Object.create(null);   //所有加载过的资源缓存 url 作为 key 

    get cache() {
        return this._cache;
    }
    static getInstance() {
        if (!AssetManager._instance) {
            AssetManager._instance = new AssetManager();
        }
        return AssetManager._instance;
    }

    constructor() {
        AssetManager._instance = this;
    }
    _loadResUuids(uuids: string[], progressCallback: Function, completeCallback?: (err, resArr, urlArr) => void, urls?: string[]) {
        (<any>cc.loader)._loadResUuids(uuids, progressCallback, (err, resArr, urlArr) => {
            if (!err) {
                for (let i = 0; i < resArr.length; i++) {
                    this.addCache(urlArr[i], resArr[i]);
                }
            }
            if (typeof completeCallback === "function") {
                completeCallback(err, [], []);
            }
        }, urls);
    }
    private _loadRes<T extends cc.Asset>(url: string, type?: { new(): T }, progressCallback?: any, completeCallback?: any) {
        var args = (<any>cc.loader)._parseLoadResArgs(type, progressCallback, completeCallback);
        type = args.type;
        progressCallback = args.onProgress;
        completeCallback = args.onComplete;
        cc.loader.loadRes(url, type, progressCallback, (err, res) => {
            if (!err) {
                if (!cc.isValid(res)) {
                    CC_DEBUG && console.error("资源 %s 加载成功,但被异常释放,正在重新加载", url);
                    cc.loader.loadRes(url, type, (err, res) => {
                        CC_DEBUG && console.error("资源 %s 二次加载%s", url, err ? "失败" : "成功");
                        typeof completeCallback && completeCallback(err, res);
                    })
                } else {
                    typeof completeCallback && completeCallback(err, res);
                }
            } else {
                console.error(err);
                typeof completeCallback && completeCallback(err, undefined);
            }
        });
    }

    async loadResSync<T extends cc.Asset>(url: string, type?: { new(): T }, progressCallback?: (completedCount: number, totalCount: number, item: any) => void, completeCallback?: ((error: Error, resource: T) => void)): Promise<T> {
        var args = (<any>cc.loader)._parseLoadResArgs(type, progressCallback, completeCallback);
        type = args.type;
        progressCallback = args.onProgress;
        completeCallback = args.onComplete;
        return new Promise((resolve) => {
            try {
                this._loadRes(url, type, progressCallback, (err: any, res: T) => {
                    if (!err) {
                        this.addCache(url, res);
                    }
                    if (typeof completeCallback === "function") {
                        completeCallback(err, res);
                    }
                    resolve(res);
                });
            } catch (error) {
                console.error(error);
                resolve(undefined);
            }
        });
    }
    async loadResArraySync<T extends cc.Asset>(urls: string[], type?: { new(): T }, progressCallback?: (c: number, t: number, item: any) => void, completeCallback?: (error: Error, resource: T[]) => void): Promise<T[]> {
        return new Promise((resolve) => {
            cc.loader.loadResArray(urls, <any>type, progressCallback, (err: any, res: T[]) => {
                if (!err) {
                    for (let i = 0; i < res.length; i++) {
                        this.addCache(urls[i], res[i]);
                    }
                }
                if (typeof completeCallback === "function") {
                    completeCallback(err, res);
                }
                resolve(res);
            });
        });
    }
    async loadResDirSync<T extends cc.Asset>(url: string, type?: { new(): T }, progressCallback?: (c: number, t: number, item: any) => void, completeCallback?: (error: Error, resource: T[], urls: string[]) => void): Promise<T[]> {
        return new Promise((resolve) => {
            cc.loader.loadResDir(url, <any>type, progressCallback, (err: any, res: T[], urls: string[]) => {
                if (!err) {
                    for (let i = 0; i < res.length; i++) {
                        this.addCache(urls[i], res[i]);
                    }
                }
                if (typeof completeCallback === "function") {
                    completeCallback(err, res, urls);
                }
                // resolve(res);
                resolve([err, res, urls]);
            });
        });
    }
    async loadDragonBones(dir: string, outArray: any[] = [], outUrls: any[] = []) {
        let [err, res, urls] = await AssetMgr.loadResDirSync(dir);
        if (err) {
            console.error("加载骨龙资源失败::" + dir);
            return [err];
        }
        for (let i = 0; i < res.length; i++) {
            if (res[i] instanceof dragonBones.DragonBonesAsset) {
                outArray[0] = res[i];
                outUrls[0] = urls[i];
            }
            else if (res[i] instanceof dragonBones.DragonBonesAtlasAsset) {
                outArray[1] = res[i];
                outUrls[1] = urls[i];
            }
        }
        return [null, outArray, outUrls];
    }


    loadResDir1(dir: string, onComplete?: (errors: any, assetRes: cc.Asset[], urlRes: string[]) => void){

        cc.loader.loadResDir(dir,cc.Asset,onComplete)

    }

    loadResDirs(dirs: string[],
        onProgress?: (c: number, t: number, item: any) => void,
        onComplete?: (errors: any, assetRes: cc.Asset[], urlRes: string[]) => void,
        maxConcurrent = 1) {
        let loader: any = cc.loader
        let uuids = [];
        let urls = [];
        /**
         * 加载目录时如果并发数量太大，将会有严重卡顿现象
         */
        cc.macro.DOWNLOAD_MAX_CONCURRENT = maxConcurrent > 64 ? 64 : maxConcurrent;
        console.time("解析目录...");
        for (let i = 0; i < dirs.length; i++) {
            let url = dirs[i];
            let urls_temp = [];
            let uuids_temp = loader._resources.getUuidArray(url, undefined, urls_temp);
            uuids = uuids.concat(uuids_temp);
            urls = urls.concat(urls_temp);
        }
        console.timeEnd("解析目录...");
        loader._loadResUuids(uuids, onProgress, (errors, assetRes, urlRes) => {
            // cc.macro.DOWNLOAD_MAX_CONCURRENT = 64;  // 还原官方默认值
            typeof onComplete == "function" && onComplete(errors, assetRes, urlRes);
            if (!urlRes) {
                urlRes = []
                console.warn("资源url不存在");
            }
            for (let i = 0; i < urlRes.length; i++) {
                const url = urlRes[i];
                this.addCache(url, assetRes[i]);
            }
        }, urls);
    }
    async getRes<T extends cc.Asset>(url: string, type?: { new(): T }) {
        let res: T = cc.loader.getRes(url, type);
        if (!res) {
            res = await this.loadResSync(url, type);
        }
        return res;
    }

    removeCache(url: string) {
        let keys = this._cache[url];
        delete this._cache[url];
        // console.log("删除缓存资源::" + url);
        return keys;
    }

    removeCacheDirs(dirs: string[], type?: { new(): cc.Asset }) {
        if (!Array.isArray(dirs)) {
            return;
        }
        for (let i = 0; i < dirs.length; i++) {
            this.removeCacheDir(dirs[i], type);
        }
    }
    removeCacheDir(dir: string, type?: { new(): cc.Asset }) {
        let urls: string[] = [];
        (<any>cc.loader)._resources.getUuidArray(dir, type, urls);
        for (let index = 0; index < urls.length; index++) {
            this.removeCache(urls[index]);
        }
    }

    addCache(url: string, asset: cc.Asset) {
        let assetKeys = cc.loader.getDependsRecursively(asset);
        if (this._cache[url] && this._cache[url].length > assetKeys.length) {    //相同 url 合并依赖
            this._cache[url] = Utiles.arrayMerge(this._cache[url], assetKeys);
        }
        else {
            this._cache[url] = assetKeys;
        }
        // console.log("添加缓存资源 " + url)
    }

}

