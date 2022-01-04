import ProgressBar from "../Component/ProgressBar";
import Package, { PackageStatus } from "./Package";
import { LoadTask } from "../Models/LoadTask";
import { EventCode } from "./JsbAssetsManager";
import ConsConfig from "../Shared/ConstantConfig";

const { ccclass, property } = cc._decorator;

let rootUrl = "Manifest/";
let fileName = "project.manifest";
let subGameManifestsUrl = {
    BJ: rootUrl + "BJ/" + fileName,
    BJL: rootUrl + "BJL/" + fileName,
    BRNN: rootUrl + "BRNN/" + fileName,
    DDZ: rootUrl + "DDZ/" + fileName,
    DZ: rootUrl + "DZ/" + fileName,
    ERNN: rootUrl + "ERNN/" + fileName,
    FISH: rootUrl + "FISH/" + fileName,
    GameCommon: rootUrl + "GameCommon/" + fileName,
    HHDZ: rootUrl + "HHDZ/" + fileName,
    LHD: rootUrl + "LHD/" + fileName,
    LKBY: rootUrl + "LKBY/" + fileName,
    MPNN: rootUrl + "MPNN/" + fileName,
    NN: rootUrl + "NN/" + fileName,
    PDK: rootUrl + "PDK/" + fileName,
    SSS: rootUrl + "SSS/" + fileName,
    TTZ: rootUrl + "TTZ/" + fileName,
    ZJH: rootUrl + "ZJH/" + fileName,
}

@ccclass
export default class HotUpdate extends cc.Component {

    mainManifest: cc.Asset = undefined;
    subGameManifests: cc.Asset[] = [];
    @property(ProgressBar)
    progressBar: ProgressBar = undefined;

    completeCallback: (code: number) => void;

    mainPack: Package = undefined;

    /**
     * 热更配置信息
     */
    updateConfig = {
        "hotUpdate": true,                              // 是否开启热更
        "bigUpdateDownloadUrl": "http://www.baidu.com", // 大版本下载地址 大版本更新逻辑 第一版本号不同时需要重新下载App
        "forceBigUpdate": true,                        // 强制大版本热更新
    }
    onLoad() {
    }

    async startUpdate(completeCallback: (code: 0 | 1 | 2) => void) {
        this.completeCallback = completeCallback;
        //
        // if (!Global.Constant.isHotUpdate || !CC_JSB) {
        //     console.log("跳过热更新");
        //     this.updateEnd(0);
        //     return;
        // }

        console.time("加载主清单文件")
        //先加载本地主清单
        this.mainManifest = await this.loadOneManifest("Main");
        //先check 大厅版本是否要热更

        console.timeEnd("加载主清单文件")

        //初始化中
        this.mainPack = new Package(this.mainManifest);

        // if (!CC_JSB) {
        //     console.log("跳过热更新");
        //     this.updateEnd(0);
        //     return;
        // }
        this.node.active = true;

        this.progressBar.init("正在检查版本...");
        //替换热更域名
        if (ConsConfig.hotUpdateDomain){
            this.mainPack.setHotUpdateDomain(ConsConfig.hotUpdateDomain);
        }

        this.mainPack.checkUpdate((err, isNew)=>{
            if  (this.mainPack.status = PackageStatus.FIND_NEWVERSION){
                console.log("===发现新版本，可以热更");
            }else{
                console.log("===检查热更结果："+ err.msg);

            }
        })
        //await this.checkBigUpdate()
        // this.getConfig(async (code: number) => {
        //     if (this.updateConfig.forceBigUpdate || await this.checkBigUpdate()) {
        //         Confirm.show("当前版本过低,点击确定下载最新版本", () => {
        //             cc.sys.openURL(this.updateConfig.bigUpdateDownloadUrl);
        //         });
        //         return;
        //     }
        //
        //     if (this.updateConfig.hotUpdate) {
        //         // 生成所有子包对象
        //         await this.checkSubPackVersion();
        //
        //         let err = await this.downloadGameCommon();
        //         if (err) {
        //             let downloadCount = Number(cc.sys.localStorage.getItem("downloadCount"));
        //             downloadCount = isNaN(downloadCount) ? 0 : downloadCount;
        //             if (downloadCount >= 3) {
        //                 cc.sys.localStorage.setItem("downloadCount", 0);  // 清 0
        //                 Confirm.show("加载网络资源失败,请联系客服", () => {
        //                     // 打开客服界面
        //                 });
        //             }
        //             else {
        //                 downloadCount++;
        //                 cc.sys.localStorage.setItem("downloadCount", downloadCount);
        //                 Confirm.show("加载网络资源失败,将尝试获取失败资源", () => {
        //                     cc.game.restart();
        //                 });
        //             }
        //             return;
        //         }
        //         cc.sys.localStorage.setItem("downloadCount", 0);
        //         // 开始热更
        //         this.progressBar.init("正在更新游戏大厅...");
        //         // let mainPack = new Package(this.mainManifest);
        //         if (this.mainPack.status != PackageStatus.ALL_READY) {
        //             this.mainPack.update((df: number, tf: number, db: number, tb: number) => {
        //                 if (tb != 0) {
        //                     this.progressBar.progress = db / tb;
        //                 }
        //             }, (err) => {
        //                 if (!err) {
        //                     console.log("主包热更新成功");
        //                     this.progressBar.tip = "更新完成";
        //                     cc.game.restart();
        //                 }
        //                 else {
        //                     if (err.code == EventCode.ALREADY_UP_TO_DATE) {
        //                         this.updateEnd(0);
        //                     }
        //                     else {
        //                         console.log("主包热更新失败:: " + err.code, + " " + err.msg);
        //                         this.progressBar.tip = "更新失败";
        //                         Confirm.show("更新版本失败,点击确认重试更新版本,点击取消下载最新版本", () => {
        //                             cc.game.restart();
        //                         }, () => {
        //                             cc.sys.openURL(this.updateConfig.bigUpdateDownloadUrl);
        //                         });
        //                         // this.updateEnd(1);
        //                     }
        //                 }
        //             });
        //         }
        //         else {
        //             this.updateEnd(0);  // 已经是最新版本无须更新
        //         }
        //     }
        //     else {
        //         // this.updateEnd(code);
        //         this.updateEnd(2);
        //     }
        // });
    }

    async checkSubPackVersion() {
        return new Promise((resolve) => {
            let loadTask = new LoadTask();
            loadTask.init();

            let subGameManifests = this.subGameManifests;

            for (let i = 0; i < subGameManifests.length; i++) {
                let manifest = subGameManifests[i];
                let pack = new Package(manifest);
                loadTask.addTask(1);
                pack.checkUpdate(() => {
                    loadTask.completeTask(1);
                });
            }
            loadTask.loadStart(undefined, () => {
                resolve();
            });
        })
    }

    async downloadGameCommon() {
        if (subpackMgr.packages["GameCommon"] && subpackMgr.packages["GameCommon"].status == PackageStatus.ALL_READY) {
            return undefined;
        }

        if (subpackMgr.packages["GameCommon"] && !subpackMgr.packages["GameCommon"].isDownloaded()) {
            this.progressBar.init("第一次启动将加载一些网络资源,请勿关闭App");
        } else {
            this.progressBar.init("更新少量公共资源");
        }

        return new Promise<any>((resolve) => {
            subpackMgr.packages["GameCommon"].update((df: number, tf: number, db: number, tb: number) => {
                if (tb != 0) {
                    this.progressBar.progress = db / tb;
                }
            }, (err) => {
                if (err && err.code == EventCode.ALREADY_UP_TO_DATE) {
                    err = undefined;
                }
                resolve(err);
            });
        });
    }

    async checkBigUpdate() {
        return new Promise((resolve) => {
            try {
                this.mainPack.checkUpdate(() => {
                    let currRemoteVersion = this.mainPack.remoteVersion.split('.');
                    let currLocalVersion = this.mainPack.currVersion.split('.');
                    console.log("远端版本号::" + this.mainPack.remoteVersion);
                    console.log("安装版本号::" + this.mainPack.currVersion);
                    if (currLocalVersion[0] != currRemoteVersion[0]) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                });
            } catch (error) {   // 检查版本失败 默认不进行大版本更新 (此处能检测失败，估计正常热更也是失败的)
                resolve(false);
            }
        });
    }

    getConfig(cb?: (code: number) => void) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 400)) {
                let response = xhr.responseText;
                this.updateConfig = JSON.parse(response);
                console.log("当前热更配置::", this.updateConfig);
                cb && cb(0);
            }
        };
        xhr.ontimeout = () => {
            console.error("热更请求超时");
            cb && cb(1);
        }
        xhr.onerror = () => {
            console.error("热更请求错误");
            cb && cb(2);
        }
        xhr.open("GET", Global.Constant.updateConfigAddress, true);
        xhr.send();
        cc.log("正在请求热更配置::" + Global.Constant.updateConfigAddress);
    }

    checkHallUpdate(){

    }

    async loadOneManifest(packageName : string) {
        return new Promise<cc.Asset>((resolve) => {
            try {
                AssetMgr.loadResDir1("Manifest/"  + packageName,  (errors, assetRes, urlRes) => {
                    let mainManifest : cc.Asset = null
                    for (let i = 0; i < urlRes.length; i++) {
                        console.log("====urlRes[i]:"+urlRes[i]);
                        if (packageName == "Main") {
                            if  (urlRes[i].indexOf("project") >= 0){
                                mainManifest = assetRes[i];    // 设置主包

                            }
                        }
                        else if (urlRes[i].indexOf("project") >= 0) {
                            mainManifest = assetRes[i];    // 设置子包
                        }
                    }
                    resolve(mainManifest);
                });
            } catch (error) {
                resolve(null);
            }
        })
    }

    async loadAllManifest() {

        return new Promise<void>((resolve) => {
            try {
                AssetMgr.loadResDirs(["Manifest"], undefined, (errors, assetRes, urlRes) => {
                    for (let i = 0; i < urlRes.length; i++) {
                        console.log("====urlRes[i]:"+urlRes[i]);
                        if (urlRes[i].indexOf("Main/project") >= 0) {
                            this.mainManifest = assetRes[i];    // 设置主包
                        }
                        else if (urlRes[i].indexOf("project") >= 0) {
                            this.subGameManifests.push(assetRes[i]);    // 设置子包
                        }
                    }
                    resolve();
                }, 2);
            } catch (error) {
                resolve();
            }
        })
    }

    updateEnd(code: number = 0) {
        // this.node.active = false;
        typeof this.completeCallback == "function" && this.completeCallback(code);
    }



    private checkDomainConnect(domain): Promise<boolean> {
        return new Promise(resolve => {
            let xhr = new XMLHttpRequest()

            xhr.onload = function () {
                if (xhr.status === 200) {
                    resolve(true)
                } else {
                    resolve(false)
                }
            }.bind(this)

            xhr.onerror = function () {
                resolve(false)
            }

            xhr.open("GET", domain, true)
            xhr.send()

            // 5秒没有回调false
            this.scheduleOnce(function () {
                resolve(false)
            }, 5)
        })
    }
}
