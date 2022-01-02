// if (jsb) {
//     var hotUpdateSearchPaths = localStorage.getItem('HotUpdateSearchPaths');
//     if (hotUpdateSearchPaths) {
//         jsb.fileUtils.setSearchPaths(JSON.parse(hotUpdateSearchPaths));
//     }
// }
enum State {
    UNINITED = 0,
    UNCHECKED = 1,
    PREDOWNLOAD_VERSION = 2,
    DOWNLOADING_VERSION = 3,
    VERSION_LOADED = 4,
    PREDOWNLOAD_MANIFEST = 5,
    DOWNLOADING_MANIFEST = 6,
    MANIFEST_LOADED = 7,
    NEED_UPDATE = 8,
    READY_TO_UPDATE = 9,
    UPDATING = 10,
    UNZIPPING = 11,
    UP_TO_DATE = 12,
    FAIL_TO_UPDATE = 13
};
export enum EventCode {
    ERROR_NO_LOCAL_MANIFEST = 0,
    ERROR_DOWNLOAD_MANIFEST = 1,
    ERROR_PARSE_MANIFEST = 2,
    NEW_VERSION_FOUND = 3,
    ALREADY_UP_TO_DATE = 4,
    UPDATE_PROGRESSION = 5,
    ASSET_UPDATED = 6,
    ERROR_UPDATING = 7,     //解压失败和文件校验失败下载失败 常见错误:文件404
    UPDATE_FINISHED = 8,
    UPDATE_FAILED = 9,
    ERROR_DECOMPRESS = 10   //解压失败 同时触发ERROR_UPDATING
}
export interface EventAssetsManager {
    getEventCode: () => number;
    getCURLECode?: () => number;
    getCURLMCode?: () => number;
    getMessage: () => string;   //通常情况为"" 部分错误会返回对应msg 参考C++文件
    getAssetId?: () => string;   //ID=>清单文件中的资产路径
    isResuming?: () => boolean;  //断点续传
    getPercent?: () => number;   //文件数百分比
    getPercentByFile?: () => number;
    getDownloadedBytes?: () => number;
    getTotalBytes?: () => number;
    getDownloadedFiles?: () => number;
    getTotalFiles?: () => number;
}
/**
 * 定义部分Manifest接口
 */
export interface Manifest {
    isVersionLoaded: () => boolean;
    isLoaded: () => boolean;
    getPackageUrl: () => string;
    getManifestFileUrl: () => string;
    getVersionFileUrl: () => string;
    getVersion: () => string;
    getSearchPaths: () => string[];
}
/**
 * 热更资产管理模块
 * 封装jsb.AssetsManager
 * 
 * 功能：
 *  1.实现大厅+子游戏下载和热更新
 *  2.多平台支持(web ios android)
 *  3.基础热更功能 cc.AssetsManager
 *  4.对 searchPaths 的严格管理
 */

export default class JsbAssetsManager {
    static STATE = State;
    static EVENT_CODE = EventCode;

    _jsbAssetManager: any = undefined;
    _storagePath: string = "";

    constructor(manifestUrl: string, storagePath: string, versionCompareHandle?: (localVersion: string, RemotVersion: string) => number) {
        this._storagePath = storagePath;
        this._jsbAssetManager = new jsb.AssetsManager(manifestUrl, storagePath, versionCompareHandle);
    }
    getState(): State {
        return this._jsbAssetManager.getState();
    }
    /**
     * 加载本地manifest文件
     * 注:内部会自动获取缓存目录 「storePath目录」 下的manifest进行比较以确定使用哪个manifest
     * @param nativeUrl manifest本地路径
     */
    loadLocalManifest(nativeUrl: string) {
        let url = nativeUrl
        if (cc.loader.md5Pipe) {
            url = cc.loader.md5Pipe.transformURL(url);
        }
        cc.log("加载本地清单文件：" + url);
        this._jsbAssetManager.loadLocalManifest(url);
    }
    setVerifyCallback(handle: () => void) {
        this._jsbAssetManager.setVerifyCallback(handle);
    }
    setEventCallback(handle: (event: EventAssetsManager) => void) {
        this._jsbAssetManager.setEventCallback(handle);
    }
    setMaxConcurrentTask(maxNum: number) {
        console.log("设置最大并发下载数::" + maxNum);
        this._jsbAssetManager.setMaxConcurrentTask(maxNum);
    }
    getLocalManifest(): Manifest {
        return this._jsbAssetManager.getLocalManifest();
    }

    update() {
        this._jsbAssetManager.update();
    }
    checkUpdate() {
        this._jsbAssetManager.checkUpdate();
    }

    /**
     * 获取本地版本
     * 确保_jsbAssetManager已经初始化
     */
    getLocalVersion(): string | undefined {
        if (this._jsbAssetManager) {
            return this._jsbAssetManager.getLocalManifest().getVersion();
        }
    }
    /**
     * 根据包名添加一个搜索路径到下标 0
     * 如果已经存在则位置提前到下标 0
     * 设置主包(Main) 永远优先搜索 否则当子游戏资源数量达到一定程度后将会降低加载大厅的速度(搜索时间变大)
     * @param packageName 包名
     */
    static addSearchPath(packageName: string) {
        let rootPath = jsb.fileUtils.getWritablePath();
        let pakcageUrl = rootPath + "hotAssets/" + packageName + "/";
        let mainUrl = rootPath + "hotAssets/" + "Main/";
        var searchPaths: string[] = jsb.fileUtils.getSearchPaths();
        // 只保存主包 搜索路径 其他子包搜索路径再启动后直接设置 jsb.fileUtils.setSearchPaths
        if (packageName == "Main") {
            localStorage.setItem('HotUpdateSearchPaths', JSON.stringify([pakcageUrl]));
        }
        searchPaths = [pakcageUrl].concat(searchPaths);
        searchPaths = ArrayClear(searchPaths);
        // jsb.fileUtils.setSearchPaths(searchPaths);
        jsb.fileUtils.addSearchPath(pakcageUrl, true);  // 前置插入一个搜索路径

        return pakcageUrl;
    }

    static delSearchPath(searchPaths, pakcageUrl: string) {
        if (Array.isArray(searchPaths)) {
            for (let i = 0; i < searchPaths.length; i++) {
                if (searchPaths[i] == pakcageUrl) {
                    searchPaths.splice(i, 1);
                }
            }
        }
    }

    /**
     * 字节数转大小(B KB MB GB...)
     * @param bytes 字节数
     */
    bytesToSize(bytes: number) {
        if (bytes === 0) return '0B';
        var k = 1024,
            sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));

        return (bytes / Math.pow(k, i)).toPrecision(3) + '' + sizes[i];
    }

}

function ArrayClear(arr: string[]) {
    let outObj = Object.create(null);
    if (Array.isArray(arr)) {
        for (let i = 0; i < arr.length; i++) {
            outObj[arr[i]] = true;
        }
    }

    return Object.keys(outObj);
}

