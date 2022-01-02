export class HttpAPI_new {

    async register({ account, password, code, uniqueID }: { account: string; password: string; code: string; uniqueID: string; }) {
        let route = "/register";
        let requestData = {
            account: account,
            password: password,
            code: code,
            device: Global.SDK.getDeviceId(),
            uniqueID: uniqueID
        };
        // 绑定上级代理
        if (Global["spreaderID"]) {
            requestData["spreaderID"] = Global["spreaderID"]
        }

        if (account == null && password == null) {
            delete requestData.account;
            delete requestData.password;
        }
        let regData = await NetworkMgr.httpRequestSync(route, 'POST', requestData);
        console.log(regData);
        if (regData.code != OK) {
            Tip.makeText("注册失败");
            return {};
        }
        Global.SDK.openinstall.reportRegister();
        console.log("账号注册成功:: " + regData.msg.server.token);
        // 连接 webSocket
        let serverInfo = regData.msg.server.serverInfo;
        let conData = await NetworkMgr.connect(serverInfo.host, serverInfo.port, regData.msg.server.token);
        if (conData.code != OK) {
            return {};
        }

        return regData;
    };
    async login(account: string, password: string) {
        let route = "/login";
        let requestData = {
            account: account,
            password: password,
            device: Global.SDK.getDeviceId()
        };
        // Http 请求登入
        let loginData = await NetworkMgr.httpRequestSync(route, 'POST', requestData);
        console.log(loginData);
        if (loginData.code != OK) {
            // Tip.makeText("登录失败");
            return loginData;
        }
        // 连接 webSocket
        let serverInfo = loginData.msg.serverInfo;
        let conData = await NetworkMgr.connect(serverInfo.host, serverInfo.port, loginData.msg.token);
        if (conData.code != OK) {
            // webSocket 连接失败 或者进入大厅失败
            return {};
        }
        // 返回 login 的数据, 而不是 API.hall.entry 的返回数据 
        return loginData;
    };

    async resetPasswordByPhoneRequest(account: any, newPassword: any, smsCode: any, imgCodeInfo: any, cbSuccess?: any, cbFail?: any) {
        let route = '/resetPasswordByPhone';
        let requestData = {
            account: account,
            newPassword: newPassword,
            smsCode: smsCode,
            imgCodeInfo: imgCodeInfo
        };
        return await NetworkMgr.httpRequestSync(route, 'POST', requestData, cbSuccess, cbFail);
    };

    async  getServiceInfo(cbSuccess?: any, cbFail?: any) {
        let route = "/getServiceInfo";
        let requestData = {};
        return await NetworkMgr.httpRequestSync(route, 'GET', requestData, cbSuccess, cbFail);
    };

    async getImgCode(uniqueID: any, cbSuccess?: any, cbFail?: any) {
        let route = "/getImgCode";
        let requestData = {
            uniqueID: uniqueID
        };
        return await NetworkMgr.httpRequestSync(route, 'POST', requestData, cbSuccess, cbFail);
    };
    async getPhoneCode(phoneNumber: any, cbSuccess?: any, cbFail?: any) {
        let route = "/getSMSCode";
        let requestData = {
            phoneNumber: phoneNumber,
        };
        return await NetworkMgr.httpRequestSync(route, 'POST', requestData, cbSuccess, cbFail);
    };
}