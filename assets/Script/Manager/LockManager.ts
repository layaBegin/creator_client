
/**
 * 互斥锁管理器
 * 用于任意事件的互斥操作
 */
let _locks = Object.create(null);
export class LockManager {

    static _instance: LockManager = undefined;

    static getInstance() {
        if (!this._instance) {
            new LockManager();
        }
        return this._instance;
    }
    getLocks() {
        return _locks;
    }
    constructor() {
        LockManager._instance = this;
        _locks = Object.create(null);
    }
    /**
     * 加锁 请注意 key 的唯一性
     * @param key 
     */
    /**
     * 加锁 请注意 key 在使用过程中的唯一性
     * @param isStrict 是否严格模式 非严格模式下可以设置倒计时解锁
     * @param timeOut 解锁倒计时(ms) 默认 10 秒自动解锁
     */
    lock(key: string | number, isStrict: boolean = false, timeOut: number = 10000) {
        CC_DEV && console.log("加锁:: " + key);
        CC_DEV && _locks[key] && console.warn("重复加锁 key=" + key);
        _locks[key] = true;
        if (isStrict == false && timeOut > 0) {
            setTimeout(() => {
                _locks[key] && this.unLock(key);
            }, timeOut);
        }
    }
    /**
     * 解锁
     * @param key 秘钥
     * @param delay 延迟解锁 (ms)
     */
    unLock(key: string | number, delay: number = 0) {
        CC_DEV && console.log("解锁:: " + key);
        CC_DEV && !_locks[key] && console.warn("无须解锁 key=" + key);
        if (delay > 0) {
            setTimeout(() => {
                delete _locks[key];
            }, delay);
        } else
            delete _locks[key];
    }
    isLock(key: string | number) {
        return !!_locks[key];
    }
}
