class Path {
    static EXTNAME_RE = /(\.[^\.\/\?\\]*)(\?.*)?$/;
    static DIRNAME_RE = /((.*)(\/|\\|\\\\))?(.*?\..*$)?/;
    static NORMALIZE_RE = /[^\.\/]+\/\.\.\//;
    join() {
        var l = arguments.length;
        var result = "";
        for (var i = 0; i < l; i++) {
            result = (result + (result === "" ? "" : "/") + arguments[i]).replace(/(\/|\\\\)$/, "");
        }
        return result;
    }
    extname(pathStr: string) {
        var temp = Path.EXTNAME_RE.exec(pathStr);
        return temp ? temp[1] : '';
    }
}
export class Utiles {

    static path: Path = new Path();

    static formatStr(msg: string, ...args: (string | number)[]) {
        var argLen = arguments.length;
        if (argLen === 0) {
            return '';
        }
        if (argLen === 1) {
            return '' + msg;
        }

        var hasSubstitution = /(%s)|(%d)/.test(msg);
        if (hasSubstitution) {
            for (let i = 0; i < args.length; ++i) {
                var arg = args[i];
                var regExpToTest = typeof arg === 'number' ? /(%s)|(%d)/ : /%s/;
                arg = "" + arg;
                if (regExpToTest.test(msg))
                    msg = msg.replace(regExpToTest, arg);
                else
                    msg += ' ' + arg;
            }
        }
        else {
            for (let i = 1; i < argLen; ++i) {
                msg += ' ' + arguments[i];
            }
        }
        return msg;
    }
    /**
     * 延迟
     *
     * @date 2019-04-20
     * @static
     * @param {number} time 毫秒
     * @param {(1 | 2)} [delayType=1] 延迟类型 1 cc.delayTime延迟 2 setTimeOut延迟
     * @returns
     * @memberof Utiles
     */
    static async sleep(time: number) {
        console.time("sleep::" + time);
        return new Promise((resolve) => {
            setTimeout(() => {
                console.timeEnd("sleep::" + time);
                resolve();
            }, time);
        });

    }
    /**
     * 正数四舍五入
     * fixed 保留的小数位个数
     */
    numberRound(num: number, fixed: number = 2) {
        let m = Math.pow(10, fixed);
        return Math.round(num * m) / m;
    }


    //////////////数组工具//////////////////////
    /**
     * 数组交集
     *
     * @date 2019-04-24
     * @static
     * @param {string[]} a
     * @param {string[]} b
     * @returns
     * @memberof Utiles
     */
    static arrayIntersect(a: string[], b: string[]) {
        let bObj = Utiles.arrayToObject(b, true)
        let result: string[] = [];
        if (Array.isArray(a)) {
            for (let i = 0; i < a.length; i++) {
                if (bObj[a[i]]) {
                    result.push(a[i])
                }
            }
        }
        return result;
    }
    /**
     * 数组并集(合并去重)
     *
     * @date 2019-04-24
     * @static
     * @param {string[]} a
     * @param {string[]} b
     * @memberof Utiles
     */
    static arrayMerge(a: string[], b: string[]) {
        let mergeObj = Utiles.arrayToObject(a, true)
        if (Array.isArray(b)) {
            for (let i = 0; i < b.length; i++) {
                mergeObj[b[i]] = true;
            }
        }
        return Object.keys(mergeObj);
    }
    /**
     * 数组 => 纯净对象
     * 数组元素转对象键值
     *
     * @date 2019-04-24
     * @static
     * @param {string[]} arr
     * @param {*} [value=true] 填充对象属性的统一值
     * @memberof Utiles
     */
    static arrayToObject<T>(arr: string[], value: T, outObj?: Object) {
        outObj = outObj || Object.create(null);
        if (Array.isArray(arr)) {
            for (let i = 0; i < arr.length; i++) {
                outObj[arr[i]] = value;
            }
        }
        return outObj;
    }
    //////////////数组工具//////////////////////


    //////// CocosCreator 组件工具 /////////////
    /**
     * 获得单选框的选中下标
     * @static
     * @param {cc.ToggleContainer} container
     */
    static getToggleContainerChecked(container: cc.ToggleContainer) {
        let items = container.toggleItems;
        for (let i = 0; i < items.length; i++) {
            if (items[i].isChecked) {
                return i;
            }
        }
        // CC_DEBUG && Debug.assert(true, "找不到转轮类型");
        return -1;
    }
    //////// CocosCreator 组件工具 /////////////
}

