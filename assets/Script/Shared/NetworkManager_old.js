var messageCallback = require('./MessageCallback');
let roomAPI = require('../API/RoomAPI');

var pomelo = window.pomelo;

var networkManager = module.exports = {};

networkManager.init = function (params, cb) {
    pomelo.init({
        host: params.host,
        port: params.port,
        // log: true,
        // reconnect: true,
        // maxReconnectAttempts: 30,
    }, cb);
};

networkManager.disconnect = function () {
    console.log("主动断开网络连接。。。")
    pomelo.disconnect();
};

networkManager.request = function (route, msg, cbSuccess, cbFail) {
    console.log('Send:' + route);
    console.log(msg);
    pomelo.request(route, msg, function (data) {
        console.log('Receive:' + (((typeof cbSuccess) === 'string') ? cbSuccess : route));
        console.log(data);

        if (data.code !== Global.Code.OK) {
            Waiting.hide();

            if (typeof (cbFail) === 'function') {
                cbFail(data);
                return;
            }
            if (!!Global.Code[data.code]) {
                Confirm.show(Global.Code[data.code]);
            } else {
                Confirm.show('游戏错误，错误码：' + data.code);
            }
        } else {
            if (!!cbSuccess) {
                if (typeof (cbSuccess) === 'function') {
                    cbSuccess(data);
                } else {
                    messageCallback.emitMessage(cbSuccess, data);
                }
            }
        }
    });
};

networkManager.send = function (route, msg, cbRoute, cbFail) {
    this.request(route, msg, cbRoute, cbFail);
};

networkManager.notify = function (route, msg) {
    console.log('Notify:' + route);
    console.log(msg);
    pomelo.notify(route, msg);
};

networkManager.addReceiveListen = function (route, cbRoute) {
    cbRoute = cbRoute || route;
    let pushCallback = function (msg) {
        if (!!cbRoute) {
            if (CC_DEBUG && msg.pushRouter != "BroadcastPush") { // 不打印轮播公告 有需要可开启
                console.log('push:' + cbRoute);
                console.log(msg);
            }
            if (msg.pushRouter == "RoomMessagePush" && msg.type == 418) {
                let timeout = roomAPI.roomMessageNotify.prototype.timeout;
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = undefined;
                }
            }

            messageCallback.emitMessage(cbRoute, msg);
        }
    };
    pomelo.on(route, pushCallback);
    return pushCallback;
};

networkManager.removeListener = function (route, callback) {
    pomelo.removeListener(route, callback);
};

networkManager.removeAllListeners = function () {
    pomelo.removeAllListeners();
};