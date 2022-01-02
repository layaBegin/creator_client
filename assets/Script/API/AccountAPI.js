var api = module.exports = {};

api.login = function (account, password, cbSuccess, cbFail) {
    let route = "/login";
    let requestData = {
        account: account,
        password: password,
        device: Global.SDK.getDeviceId()
    };
    Global.NetworkLogic.gameServerHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.register = function (account, password, code, uniqueID, cbSuccess, cbFail) {
    let route = "/register";
    let requestData = {
        account: account,
        password: password,
        code: code,
        device: Global.SDK.getDeviceId(),
        uniqueID: uniqueID
    };
    // 绑定上级代理
    if (Global.spreaderID) {
        requestData.spreaderID = Global.spreaderID
    }

    if (account == null && password == null) {
        delete requestData.account;
        delete requestData.password;
    }
    Global.NetworkLogic.gameServerHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.resetPasswordByPhoneRequest = function (account, newPassword, smsCode, imgCodeInfo, cbSuccess, cbFail) {
    let route = '/resetPasswordByPhone';
    let requestData = {
        account: account,
        newPassword: newPassword,
        smsCode: smsCode,
        imgCodeInfo: imgCodeInfo
    };
    Global.NetworkLogic.gameServerHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.getInfo = function (cbSuccess, cbFail) {
    let route = "/getServiceInfo";
    let requestData = {};
    Global.NetworkLogic.gameServerHttpRequest(route, 'GET', requestData, cbSuccess, cbFail);
};

api.getImgCode = function (uniqueID, cbSuccess, cbFail) {
    let route = "/getImgCode";
    let requestData = {
        uniqueID: uniqueID
    };
    Global.NetworkLogic.gameServerHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};