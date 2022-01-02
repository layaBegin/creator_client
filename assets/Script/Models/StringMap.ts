class MapEntry<V>{
    index: number = 0;
    value: any;
    constructor(index?: number, value?: V) {
        this.value = value;
        this.index = index;
    }
}
/**
 * 一个高效但占用内存稍微有点大的 Map
 * 内部多维护一张 keys 表 以保证 Map 的顺序性
 *
 * @date 2019-05-06
 * @export
 * @class StringMap
 * @template K
 * @template V
 */
export class StringMap<K extends string, V> {
    private _obj: { [key: string]: MapEntry<V> } = undefined;
    private _keys: string[] = undefined;
    private _values: any[] = undefined;

    constructor() {
        this._obj = Object.create(null);
        this._keys = [];
        this._values = [];
    }

    set(key: K, value: V) {
        let index = this._keys.length;
        let entry = new MapEntry<V>(index, value);
        if (this._obj[key]) {
            entry.index = this._obj[key].index;
        }
        this._obj[key] = entry;
        this._keys[entry.index] = key;
        this._values[entry.index] = value;
    }

    get(key: K) {   // 返回值 不代表 key 是否存在
        if (this._obj[key]) {
            return this._obj[key].value;
        }
        return undefined;
    }
    has(key: K) {
        return !!this._obj[key];
    }
    delete(key: K, isReturn: boolean = false) {
        if (this._obj[key]) {
            let entry = this._obj[key];
            delete this._obj[key];
            if (key != this._keys[entry.index]) {       // 测试代码 后期删除
                console.error("StringMap 错误");
            }
            this._keys.splice(entry.index, 1);
            this._values.splice(entry.index, 1);
            //  刷新键值下标 大于 index 的键值 -1
            for (let i = entry.index; i < this._keys.length; i++) {
                let key = this._keys[i];
                this._obj[key].index--;
            }
            return isReturn ? [key, entry.value] : true;
        }
        return undefined;
    }


    get size() {
        return this._keys.length;
    }
    keys() {
        return this._keys.slice();  // 对数组的操作能不写 for while 的就不写 使用原生 Array API 的效率是手写循环的几十倍
    }
    values() {
        return this._values.slice();
    }

    clear() {
        this._obj = Object.create(null);
        this._keys = [];
        this._values = [];
    }
}