class MessageEventCallback {
    constructor() {
        this.fnNames = [];
        this.targets = []
    }
    fnNames: string[]
    targets: any[]
}
/**
 * 消息的回调函数禁止使用 bind 方法
 * 如有 bind 需求请传 target 参数
 */
export class MessageManager {
    static _instance: MessageManager = undefined;
    static get instance() {
        if (!MessageManager._instance) {
            MessageManager._instance = new MessageManager();
        }
        return MessageManager._instance;
    }

    static _callbacks: { [key: string]: MessageEventCallback } = Object.create(null);
    get callbacks() {
        return MessageManager._callbacks;
    }

    constructor() {
        MessageManager._instance = this;

        MessageManager._callbacks = MessageManager._callbacks || Object.create(null);
    }
    on = this.addEventListener;
    addEventListener(event: string, fnName: string, target: any) {
        CC_DEBUG && Debug.assert(typeof target[fnName] !== "function", "被注册事件 %s 的回调 %s 不是一个 函数", event, fnName);

        let events = MessageManager._callbacks[event] = MessageManager._callbacks[event] || new MessageEventCallback();
        if (CC_DEBUG && events.fnNames.length) {        // 事件重复检测
            for (let i = 0; i < events.fnNames.length; i++) {
                if (events.fnNames[i] == fnName && events.targets[i] == target) {
                    console.log("事件 %s 重复注册回调 %s", event, fnName);
                    return;
                }
            }
        }
        events.fnNames.push(fnName);
        events.targets.push(target);
    }

    /**
     * 此处不采用剩余参数列表 最多支持 5 个参数 可节省一点点点的性能
     * @param event 
     */
    emit(event: string, p1?: any, p2?: any, p3?: any, p4?: any, p5?: any) {
        let events = MessageManager._callbacks[event];
        if (events && events.fnNames.length) {
            for (let i = 0; i < events.fnNames.length; i++) {
                let target = events.targets[i];
                let fnName = events.fnNames[i];
                if (!cc.isValid(target)) {      // 检查组件是否被销毁
                    // 清除无效的回调
                    events.targets.splice(i, 1);
                    events.fnNames.splice(i, 1);
                    i--;
                    continue;
                }
                // CC_DEBUG && Debug.assert(typeof target[fnName] !== "function", "事件 %s 的回调 %s 不是一个函数", event, fnName);
                if (typeof target[fnName] === "function") {
                    target[fnName].call(target, p1, p2, p3, p4, p5);
                }
                else if (typeof target["onMessage"] === "function") {
                    target["onMessage"].call(target, fnName, p1);       // onMessage 方法只接受一个参数
                }
                else {
                    console.error("事件 %s 无法被正确响应,fnName=%s", event, fnName, target);
                }
            }
        }
    }
    off = this.removeEventListener;
    removeEventListener(event: string, fnName: string, target: any) {
        let events = MessageManager._callbacks[event];
        if (events && events.fnNames.length) {
            for (let i = 0; i < events.fnNames.length; i++) {
                if (events.fnNames[i] == fnName && events.targets[i] == target) {
                    events.targets.splice(i, 1);
                    events.fnNames.splice(i, 1);
                    CC_DEBUG && console.log("移除消息监听 %s::%s", event, fnName);
                    break;      // 仅删除一条
                }
            }
        }
    }

    removeListener(event: string) {
        MessageManager._callbacks[event] = null;
    }
    removeAllListener() {
        MessageManager._callbacks = Object.create(null);
    }
}