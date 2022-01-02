import { AssetManager } from "./AssetManager";

// let _isLoading: boolean = false;        //是否正在加载
// let _isInit: boolean = false;
// let _progress: number = 0;
// let _totalCount: number = 0;
// let _completeCount: number = 0;
// let _failedCount: number = 0;
// let _loadList: { [key: string]: boolean } = Object.create(null);

// let _onProgress = undefined;
// let _onComplete = undefined;

// let _isComplete: boolean = false;
export class LoadTask {
    private _isLoading: boolean = false;        //是否正在加载
    private _isInit: boolean = false;
    private _progress: number = 0;
    private _totalCount: number = 0;
    private _completeCount: number = 0;
    private _failedCount: number = 0;
    private _isComplete: boolean = false;
    private _loadList: { [key: string]: string } = Object.create(null);

    onProgress: (c: number, t: number, res?: cc.Asset, p?: number) => void
    onComplete: (failedCount?: number) => void;

    init() {
        this._isInit = true;
        this._totalCount = 0;
        this._completeCount = 0;
        this._progress = 0;
        this._failedCount = 0;
        this._loadList = Object.create(null);
        this._isComplete = false;
        this._isLoading = false;

        // 初始化时默认添加一个任务 在 loadStart() 中自己消化 以确保loadStart能正确回调完成回调函数
        this.addTask(1);
    }
    loadStart(onProgress?: (c: number, t: number, res?: cc.Asset, p?: number) => void, onComplete?: (failedCount?: number) => void) {
        if (!this._isInit) {
            CC_DEBUG && console.log("请先调用 init()");
            return;
        }
        if (this._isLoading) {
            CC_DEBUG && console.error("任务正在加载中...");
            return;
        }

        this.onProgress = onProgress;
        this.onComplete = onComplete;

        this._isLoading = true;
        this._isInit = false;

        let uuids = Object.keys(this._loadList);
        let urls = [];
        for (let i = 0; i < uuids.length; i++) {
            urls.push(this._loadList[uuids[i]]);
        }
        CC_DEV && Debug.assert(uuids.length != urls.length, "资源数据不对应");
        AssetMgr._loadResUuids(uuids, () => {
            this.completeTask(1);
        }, () => {
            // this.completeTask(999);
        }, urls);

        // for (const url in this._loadList) {
        //     AssetManager.getInstance().loadResSync(url, undefined, undefined, (err, res) => {
        //         this.completeTask(1, res, err);
        //     })
        // }

        this.completeTask(1);
    }
    addLoadDir(dir: string | string[], type?: { new(): cc.Asset }) {
        if (!Array.isArray(dir)) {
            dir = [dir]
        }
        for (let i = 0; i < dir.length; i++) {
            let urls: string[] = [];
            let uuids = (<any>cc.loader)._resources.getUuidArray(dir[i], type, urls);
            for (let j = 0; j < uuids.length; j++) {
                // this.addLoadUrl(urls[j]);
                this.addLoadUuid(uuids[j], urls[j]);
            }
        }
    }

    addLoadUrl(url: string, type?) {
        var uuid = (<any>cc.loader)._getResUuid(url, type);
        this.addLoadUuid(uuid, url);
    }
    addLoadUuid(uuid: string, urls: string) {
        if (this._loadList[uuid]) {
            return;
        }
        this._loadList[uuid] = urls;
        this._totalCount++;
    }
    /**
     * 用于外部添加自定义任务
     * @param count 完成数
     */
    addTask(count = 1) {
        this._totalCount += count;
    }
    /**
     * 用于外部完成一次自定义加载
     * @param count 
     */
    completeTask(count = 1, res?: any, err?: any) {
        if (err) {
            this._failedCount++;
        }
        this._completeCount += count;

        this._progress = +(this._completeCount / this._totalCount).toFixed(4);
        CC_DEBUG && Debug.assert(isNaN(this._progress), "加载进度异常 进度值NaN", this._completeCount, this._totalCount)
        //加载进度回调
        typeof this.onProgress === "function" && this.onProgress(this._completeCount, this._totalCount, res, this._progress);
        //加载完成
        if (this._completeCount == this._totalCount) {
            CC_DEBUG && Debug.assert(this._isComplete, "加载任务计数异常 重复完成");
            this._isComplete = true;
            this._isLoading = false;
            typeof this.onComplete === "function" && this.onComplete(this._failedCount);
            this.onComplete = undefined;
            this.onProgress = undefined;
        }
    }





}