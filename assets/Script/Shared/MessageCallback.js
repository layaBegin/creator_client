var messageCallback = module.exports = {};

messageCallback.addListener = function (route, handler) {
    this.handlers = this.handlers || [];

    var handlers = this.handlers[route] || null;
    if (!!handlers) {
        var isHandlerExist = false;
        for (var i in handlers) {
            if (handlers.hasOwnProperty(i) && (handlers[i] === handler)) {
                isHandlerExist = true;
                break;
            }
        }
        if (!isHandlerExist) {
            handlers.push(handler);
        }
    }
    else {
        handlers = [];
        handlers.push(handler);
        this.handlers[route] = handlers;
    }
};

messageCallback.removeListener = function (route, handler = undefined) {
    this.handlers = this.handlers || [];
    var handlers = this.handlers[route] || null;
    if (!!handlers) {
        if (handler == undefined) {
            this.handlers[route] = [];      // 如果不传 第二参数 则移除所有 route 监听事件
        }
        else {
            for (var i = 0; i < handlers.length; ++i) {
                if (handlers[i] === handler) {
                    handlers.splice(i, 1);
                    break;
                }
            }
        }
    }
};
messageCallback.removeCustomListener = function (route) {
    this.handlers = this.handlers || [];
    var handlers = this.handlers[route] || null;
    if (!!handlers) {
        for (var i = handlers.length - 1; i >= 0; --i) {
            handlers.splice(i, 1);
        }
    }
};
//自定义监听
messageCallback.emitCustomMessage = function (route, param1) {
    this.handlers = this.handlers || [];
    var handlers = this.handlers[route] || [];
    if (!!handlers) {
        var handlersTemp = handlers.slice();
        for (var i in handlersTemp) {
            if (handlersTemp.hasOwnProperty(i)) {
                handlersTemp[i](param1);
            }
        }
    }
};

messageCallback.emitMessage = function (route, msg) {
    this.handlers = this.handlers || [];

    var handlers = this.handlers[route] || [];
    if (!!handlers) {
        var handlersTemp = handlers.slice();
        for (var i in handlersTemp) {
            if (handlersTemp.hasOwnProperty(i) && !!handlersTemp[i].messageCallbackHandler && !handlersTemp[i].isDestroy) {
                handlersTemp[i].messageCallbackHandler(route, msg);
            }
        }
    }
};