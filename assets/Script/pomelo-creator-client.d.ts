interface initParams {
    port: string;
    host: string;
    encode?: Function;
    decode?: Function;
    encrypt?: boolean;
    user?: any;
    handshakeCallback?: Function;   // 握手回调函数
    maxReconnectAttempts?: number;  // 最大重连次数 默认 10 次
    reconnect?: boolean;            // 自动重连
}

interface pomelo_creator {
    // 所有被 private 标记的字段没事就别乱动了, 如果有需求可以删除 private
    private _callbacks: { [key: string]: Function[] };
    init: (params: initParams, cb?: any) => void;
    disconnect: (cb?: () => void) => void;
    request: (route: string, msg: any, cb?: (data: any) => void) => void;
    notify: (route: string, msg: any) => void;
    private encode: (reqId: number, route: string, msg: any) => string;
    private decode: (data: string) => any;

    emit: (event: string, ...data: any[]) => void;

    addEventListener: (event: string, fn: Function) => void;
    on: (event: string, fn: Function) => void;
    once: (event: string, fn: Function) => void;

    off: (event: string, fn: Function) => void;
    removeEventListener: (event: string, fn: Function) => void;
    removeListener: (event: string, callback?: any) => void;
    removeAllListeners: () => void;

    hasListeners: (event: string) => boolean;
    listeners: (event: string) => Function[];
}