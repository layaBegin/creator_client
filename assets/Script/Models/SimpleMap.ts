
export class SimpleMap<K extends string, V>{
    private _obj: { [key: string]: V } = undefined

    constructor() {
        this._obj = Object.create(null);
    }
    set(key: string, value: V) {
        this._obj[key] = value;
    }

    get(key: K) {
        return this._obj[key];
    }

    has(key: K) {
        return !!this._obj[key];
    }

    delete(key: K) {
        return delete this._obj[key];
    }

    get size() {
        return Object.keys(this._obj).length;
    }

    keys() {
        return Object.keys(this._obj);
    }
    values() {
        let values = [];
        for (const key in this._obj) {
            values.push(this._obj[key])
        }
    }

    clear() {
        this._obj = Object.create(null);
    }



}