import Package, { PackageStatus } from "./Package";
import JsbAssetsManager from "./JsbAssetsManager";




/**
 * 控制所有子包
 */
export default class SubpackManager {
    static _packages: { [key: string]: Package } = {};      //子包对象

    static _instance: SubpackManager = undefined;
    static getInstance() {
        if (!SubpackManager._instance) {
            SubpackManager._instance = new SubpackManager();
        }
        return SubpackManager._instance;
    }

    get packages() { return SubpackManager._packages }

    constructor() {
        SubpackManager._instance = this;
    }

    addSearchPath(packageName: string) {
        if (!CC_JSB) {
            return "";
        }
        return JsbAssetsManager.addSearchPath(packageName);
    }
    /**
     * 检测一个包是否已经准备就绪
     * @param packageName 包名
     */
    isAllReady(packageName: string) {
        if (!this.packages[packageName]) {
            return false;       // 未检测
        }
        return this.packages[packageName].status == PackageStatus.ALL_READY;
    }
    /**
     * 检测一个包是否已经下载(可能不是最新版本)
     * @param packageName 包名
     */
    isDownloaded(packageName: string) {
        let pack = this.packages[packageName];
        if (!pack) {
            return false;   //未检测的包
        }
        if (pack.status == PackageStatus.ALL_READY) {
            return true;    //最新版本已经下载
        }
        if (pack.status == PackageStatus.UNINSTALL) {
            return false;
        }
        if (pack.isDownloaded()) {
            return true;    //仅仅已经下载 可能不是最新版本
        }
        else {
            pack.status = PackageStatus.UNINSTALL;
            return false;
        }
    }


    isDownloading(packageName?: string) {
        let packages = SubpackManager._packages;
        let keys = Object.keys(packages);
        for (let i = 0; i < keys.length; i++) {
            let pack = packages[keys[i]];
            if (pack.isDownloading() || pack.status == PackageStatus.DOWNLOADING) {
                if (packageName) {
                    if (packageName == pack.packageName) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
                else {
                    return true;
                }
            }
        }
        return false;
    }
    setDownloading(packageName: string) {
        let packages = SubpackManager._packages;
        if (packages[packageName]) {
            packages[packageName].status = PackageStatus.DOWNLOADING;
        }
        else {
            packages[packageName] = <any>{
                packageName: packageName,
                status: PackageStatus.DOWNLOADING
            }
        }
    }
}

