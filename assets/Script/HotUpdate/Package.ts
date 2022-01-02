import JsbAssetsManager, { EventAssetsManager, EventCode } from "./JsbAssetsManager";
import SubpackManager from "./SubpackManager";

type UpdateError = {
    code: EventCode,
    msg: string
}
/**
 * 清单对象
 */
export interface ProjectManifest {
    version: string,
    zhName: string,        //追加中文名
    packageUrl: string,
    remoteManifestUrl: string,
    remoteVersionUrl: string,
    assets: { [key: string]: { size: number, md5: string } },
    searchPaths: string[]
}
/**
 * 包状态
 */
export enum PackageStatus {
    UNCHECK = 0,                // 未检查状态
    CHECKING = 1,               // 正在检查更新
    FIND_NEWVERSION = 2,        // 发现新版本
    UNINSTALL = 3,              // 未安装(未下载)
    DOWNLOADING = 4,            // 正在安装(正在下载)
    ALL_READY = 5,              // 已就绪
    DOWNLOAD_FAIL = 6,          // 下载失败
}
type ProgressFunction = (downloadedFiles: number, totalFiles: number, downloadedBytes?: number, totalBytes?: number) => void;
type CompleteCallbackFunction = (err: UpdateError) => void;
type CheckCallbackFunction = (err: UpdateError, isNew: boolean) => void;
export default class Package {
    VERSION_FILENAME = "version.manifest"
    TEMP_MANIFEST_FILENAME = "project.manifest.temp"
    TEMP_PACKAGE_SUFFIX = "_temp"
    MANIFEST_FILENAME = "project.manifest"
    _storagePath: string = "";
    jsbAssetsManager: JsbAssetsManager = undefined;
    maxConcurrentTask: number = 5;
    _isUpdating: number = 0;
    status: PackageStatus = 0;
    currVersion: string = "";   //当前版本
    remoteVersion: string = ""; //远端版本
    packageName: string = "";   //子包名
    zhName: string = "";        //子包中文名 一般仅显示作用

    manifestNativeUrl: string = "";

    onProgress: ProgressFunction = undefined;
    completeCallback: CompleteCallbackFunction = undefined;
    checkCompleteCallback: CheckCallbackFunction = undefined;

    constructor(initManifest: cc.Asset) {
        if (!CC_JSB) {
            this._storagePath = "";
            cc.log("非jsb环境");
            return
        }
        let names = Package.getPackageName(initManifest);
        this.packageName = names.packageName;
        this.zhName = names.zhName;
        let packageName = this.packageName;
        if (!packageName) {
            cc.error("生成子包对象错误，缺少子包名::" + initManifest.nativeUrl);
            packageName = "Main";   // 主包如果直接使用热更网站跟目录，则不存在包名
        }
        this.manifestNativeUrl = initManifest.nativeUrl;

        this._storagePath = SubpackManager.getInstance().addSearchPath(packageName);
        cc.log('当前存储路径 : ' + this._storagePath);
        this.getJsbAssetsMgrInstance();

        this.status = 0;        //未检测

        SubpackManager._packages[packageName] = this;     //缓存到子包管理器中
        cc.log("初始化完毕");
    }

    private getJsbAssetsMgrInstance() {
        this.jsbAssetsManager = new JsbAssetsManager("", this._storagePath, this.versionCompareHandle.bind(this));
        this.jsbAssetsManager.loadLocalManifest(this.manifestNativeUrl);
        // if (cc.sys.os === cc.sys.OS_ANDROID) {
        // 根据官方提示:: 某些安卓手机在并发量过大时会降低下载速度 官方推荐并发数 2 (太慢了) 10 太快了，App会有严重的卡顿现象
        this.setMaxConcurrentTask(this.maxConcurrentTask);
        // }
        this.jsbAssetsManager.setVerifyCallback(this.verifyCallback.bind(this));
    }


    setMaxConcurrentTask(maxNum: number) {
        // 重要数据做严格校验
        let _maxNum = 2;    // 默认值
        if (typeof maxNum == "number" && maxNum >= 1) {
            _maxNum = parseInt(maxNum + ""); // 取整
        }
        this.maxConcurrentTask = _maxNum;
        if (this.jsbAssetsManager) {
            this.jsbAssetsManager.setMaxConcurrentTask(_maxNum);
        }
    }

    isAllReady() {
        if (!jsb.fileUtils.isFileExist(this._storagePath + "/" + this.MANIFEST_FILENAME)) { // 保险起见追加判断清单文件是否存在
            return false;
        }
        if (this.status != PackageStatus.ALL_READY) {
            return false;
        }
        return true;
    }

    /**
     * 判断资源子包是否已经下载
     * 使用 清单文件 是否存在作为 第二依据 
     * 原因::正常热更逻辑仅使用该文件作为唯一热更依据
     * 但是如果子包一开就是最新版本(版本号一致) 热更目录下将不会下载任何文件包括清单文件
     */
    isDownloaded() {
        if (this.status == PackageStatus.ALL_READY) {
            return true;
        }
        return jsb.fileUtils.isFileExist(this._storagePath + "/" + this.MANIFEST_FILENAME);
    }
    isDownloading() {
        return this._isUpdating;
    }

    checkUpdate(completeCallback?: CheckCallbackFunction) {

        this.checkCompleteCallback = completeCallback;

        if (!this.jsbAssetsManager) {
            this.getJsbAssetsMgrInstance();
        }
        if (!this._isUpdating) {
            this.jsbAssetsManager.setEventCallback(this.checkEventCallback.bind(this));
            cc.log("检测版本开始");
            this.jsbAssetsManager.checkUpdate();
            this._isUpdating = 1;
        }
    }

    update(onProgress?: ProgressFunction | CompleteCallbackFunction, completeCallback?: (err: UpdateError) => void) {
        if (!completeCallback) {    // 如果只有一个参数 默认为热更完成回调
            completeCallback = <CompleteCallbackFunction>onProgress;
            onProgress = undefined;
        }
        this.completeCallback = completeCallback;
        this.onProgress = <ProgressFunction>onProgress;

        if (!this.jsbAssetsManager) {
            this.getJsbAssetsMgrInstance();
        }
        if (!this._isUpdating) {
            this.jsbAssetsManager.setEventCallback(this.eventCallback.bind(this));
            cc.log("热更新开始");
            this.jsbAssetsManager.update();
            this._isUpdating = 1;
        }
        else {
            cc.warn("热更新正在进行中..." + this.packageName);
        }

    }
    /**
     * 检测版本事件处理
     */
    checkEventCallback(event: EventAssetsManager) {
        let code = event.getEventCode();
        let err = {
            code: code,
            msg: "",
        }
        let isNew = false;
        switch (event.getEventCode()) {
            case jsb.EventAssetsManager.ERROR_NO_LOCAL_MANIFEST:
                err.msg = "未发现本地manifest文件";
                this.status = PackageStatus.DOWNLOAD_FAIL;
                break;
            case jsb.EventAssetsManager.ERROR_DOWNLOAD_MANIFEST:
            case jsb.EventAssetsManager.ERROR_PARSE_MANIFEST:
                err.msg = "无法下载manifest文件";
                this.status = PackageStatus.DOWNLOAD_FAIL;
                break;
            case jsb.EventAssetsManager.ALREADY_UP_TO_DATE:
                // err.msg = "已是最新版本";
                cc.log(this.packageName + " 已是最新版本");
                err = undefined;
                isNew = true;
                this.status = PackageStatus.ALL_READY;
                break;
            case jsb.EventAssetsManager.NEW_VERSION_FOUND:
                // err.msg = '发现新版本';
                cc.log(this.packageName + " 发现新版本");
                err = undefined;
                isNew = false;
                this.status = PackageStatus.FIND_NEWVERSION;
                break;
            default:
                return;
        }
        // switch 内部做了 return 处理 到此处表示检查完成
        if (this.checkCompleteCallback) {
            this.checkCompleteCallback(err, isNew);
            this.checkCompleteCallback = undefined;
        }
        console.log("检查更新完成  ", code);
        this.jsbAssetsManager.setEventCallback(null);
        this._isUpdating = 0;
        this.jsbAssetsManager = undefined;
        //判断当前包是否已经安装
        if (!this.isDownloaded()) {
            /**
             * 未安装的状态优先级高于 发现新版本
             */
            this.status = PackageStatus.UNINSTALL;  //设置包未安装状态
        }
    }
    /**
     * 热更新事件处理
     */
    eventCallback(event: EventAssetsManager) {
        let code = event.getEventCode();
        let err = {
            code: code,
            msg: "",
        }
        switch (code) {
            case EventCode.ERROR_NO_LOCAL_MANIFEST:
                err.msg = "未发现本地 manifest 文件";
                this.status = PackageStatus.DOWNLOAD_FAIL;
                break;
            case EventCode.ERROR_DOWNLOAD_MANIFEST:
            case EventCode.ERROR_PARSE_MANIFEST:
                err.msg = "无法下载 manifest 文件";
                this.status = PackageStatus.DOWNLOAD_FAIL;
                break;
            case EventCode.ALREADY_UP_TO_DATE:
                this.status = PackageStatus.ALL_READY;
                break;
            case EventCode.NEW_VERSION_FOUND:       //中间状态不处理
                this.status = PackageStatus.FIND_NEWVERSION;
                return;
            case EventCode.UPDATE_PROGRESSION:   //进度
                if (this.onProgress) {
                    this.onProgress(event.getDownloadedFiles(), event.getTotalFiles(), event.getDownloadedBytes(), event.getTotalBytes());
                }
                this.status = PackageStatus.DOWNLOADING;
                return;     //直接退出
            case EventCode.ASSET_UPDATED:       //一个文件更新完成 可以获取到AssetId
                // console.log("更新资源:" + event.getAssetId());
                this.status = PackageStatus.DOWNLOADING
                return;
            case EventCode.UPDATE_FINISHED:      //更新完成
                this.currVersion = this.remoteVersion;      // 更新版本号
                this.status = PackageStatus.ALL_READY;
                err = undefined;
                break;
            case EventCode.UPDATE_FAILED:       //更新失败
                err.msg = '更新失败' + event.getMessage();
                this.status = PackageStatus.DOWNLOAD_FAIL;
                break;
            case EventCode.ERROR_UPDATING://常见的有404。不常见的有 416(Requested Range Not Satisfiable 断点续传) 或者 Software caused connection abort(断网，或者网络波动造成)
                console.error('资源更新错误:: ' + event.getAssetId() + ', ' + event.getMessage());
                let errMsg = event.getMessage();
                let asset = event.getAssetId();
                if (errMsg && errMsg.indexOf("Requested Range Not Satisfiable") >= 0) { //如果是断点续传问题，可能是服务端该功能未开启支持，也可能是客户端请求数据问题, 此时应该删除该资源重新下载
                    let storagePath: string = this._storagePath == undefined ? "" : this._storagePath;
                    if (storagePath[storagePath.length - 1] == '/') {
                        storagePath = storagePath.substr(0, storagePath.length - 1);
                    }
                    let fullPath = (<any>cc.path).join(storagePath + this.TEMP_PACKAGE_SUFFIX, asset + ".tmp");
                    if (jsb.fileUtils.isFileExist(fullPath)) {
                        console.log("删除中间文件::" + fullPath);
                        jsb.fileUtils.removeFile(fullPath);     // 删除中间文件重新下载
                    }
                }
                return;
            case EventCode.ERROR_DECOMPRESS:
                err.msg = '解压失败 ' + event.getMessage();
                this.status = PackageStatus.DOWNLOAD_FAIL;
                break;
            default:
                console.error("热更新中 未监听的状态:: " + code);
                return;     //其他情况直接退出
        }
        // switch 内部做了 return 处理 到此处已经完成更新
        if (err && err.code != EventCode.ALREADY_UP_TO_DATE) {
            console.error(event.getMessage());
            console.error(err.msg + " code=" + err.code);
        }
        if (this.completeCallback) {
            if (code === EventCode.UPDATE_FINISHED) {  //更新完成
                err = undefined;
            }
            this.completeCallback(err);
        }
        this._isUpdating = 0;
        console.log("完成更新", code, this.status);
        this.jsbAssetsManager.setEventCallback(undefined)
        this.completeCallback = undefined;
        this.onProgress = undefined;

        this.jsbAssetsManager = undefined;
    }


    versionCompareHandle(versionA: string, versionB: string) {
        cc.log("本地版本: " + versionA + ', 远程版本: ' + versionB);
        this.currVersion = versionA;
        this.remoteVersion = versionB;

        var vA = versionA.split('.');
        var vB = versionB.split('.');
        for (var i = 0; i < vA.length; ++i) {
            var a = parseInt(vA[i]);
            var b = parseInt(vB[i] || "0");
            if (a === b) {
                continue;
            }
            else {
                return a - b;
            }
        }
        if (vB.length > vA.length) {
            return -1;
        }
        else {
            return 0;
        }
    };
    Uint8ArrayToString(fileData: Uint8Array) {
        var dataString = "";
        for (var i = 0; i < fileData.length; i++) {
            dataString += String.fromCharCode(fileData[i]);
        }

        return dataString
    }
    /**
     * 热更新文件校验
     * 切记此方法不能被 async 标记为异步
     * @param path 文件的绝对路径
     * @param asset 被校验的资源
     *  `compressed: false`
     *  `downloadState: 1`
     *  `md5: "cd985d4cbfb8b88cc9fc282a617e4fe4"` 热更清单中的MD5
     *  `path: "res/import/0f/0f1dd6f8-ad12-4100-9c5b-ecaf44577336.json"`
     *  `size: 327`
     */
    verifyCallback(path: string, asset: any) {
        /**
         * 此处校验文件 MD5 的算法必须以热更文件中的算法一致
         * 1.二进制形式读取文件字符串
         * 2.MD5 hex 加密算法
         * 须知:在校验大文件时将会耗时过长导致掉帧引起卡顿现象
         * 优化:
         * 方案A. 性能最优:所有文件只做 size 校验
         * 方案B. 准确最优:zip热更 压缩文件做 size 校验 单文件做 MD5 校验
         */
        let plan = "A";
        if (plan == "A") {
            return this.verifySize(path, asset);
        } else if (plan == "B") {
            return this.verifyMD5(path, asset);
        }
        else {
            return true;
        }
        // if (!isOK && jsb.fileUtils.isFileExist(path)) {
        // console.log("检验失败,删除文件::" + path);
        // jsb.fileUtils.removeFile(path);
        // }
    }
    verifySize(path: string, asset: any) {
        console.time("计算size ");
        let size = jsb.fileUtils.getFileSize(path);
        console.timeEnd("计算size ");
        if (size != asset.size) {
            return false;
        }
        return true;
    }
    verifyMD5(path: string, asset: any) {
        if (asset.compressed) {
            cc.log("这是一个压缩文件:%s", path);    // 压缩文件直接通过解压自身校验
            return this.verifySize(path, asset);
        }
        // 检验MD5
        let md5 = this.getFileMD5String(path);
        console.log(asset.path + " 检验MD5:: " + asset.md5 + " <==> " + md5);
        if (md5 != asset.md5) {
            console.error("检验MD5失败:: " + asset.md5 + " <==> " + md5);
            return false;
        }
        return true;
    }
    getFileMD5String(path: string) {
        let content: Uint8Array = jsb.fileUtils.getDataFromFile(path);
        console.time("计算MD5 ");
        let str = this.Uint8ArrayToString(content); // 转成字符串
        let md5 = CryptoJS.MD5(str).toString(CryptoJS.enc.Hex);
        content = undefined;
        console.timeEnd("计算MD5 ");
        return md5;
    }
    static getPackageName(manifestAsset: cc.Asset) {
        /**
         * 此处需要特别注意cc.loader.getRes获取的必须是已经加载过的资源
         * 所以此处务必是manifestAsset已经加载,第一设计方案是在编辑器以cc.Asset类型挂载
         */
        let manifestObj: ProjectManifest = cc.loader.getRes(manifestAsset.nativeUrl);
        if (manifestObj) {
            manifestObj = JSON.parse(<any>manifestObj);
            //默认获取packageUrl最后的字后的字符串 http://hostName/GG1 => GG1
            let packageUrl: string = manifestObj.packageUrl;
            if (packageUrl[packageUrl.length - 1] == "/") {
                packageUrl = packageUrl.substring(0, packageUrl.length - 1);
            }
            let packageName = packageUrl.substr(packageUrl.lastIndexOf('/') + 1);
            let zhName = manifestObj.zhName;
            /**
             * 简单的过滤主包
             * 如果主包路径是 http://hostName 则默认使用 Main 做包名
             */
            if (packageUrl.lastIndexOf('/') == packageUrl.indexOf("/") + 1) {
                packageName = "Main";
            }
            return {
                zhName: zhName,
                packageName: packageName,
            }
        }
        else {
            console.error("找不到或者未加载 当前包的清单文件::", manifestAsset.nativeUrl)
            return {};
        }
    }

}