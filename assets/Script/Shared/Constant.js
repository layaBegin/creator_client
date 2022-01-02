let Constant = module.exports = {};
/**
 * 服务器可选列表
 */
Constant.serverList = [
    ["http://192.168.17.119:13000", "http://192.168.17.119:14000", "大松树"],
    ["http://192.168.17.131:13000", "http://192.168.17.131:14000", "老挑"],
    ["http://192.168.17.92:13000", "http://192.168.17.92:14000", "17.92"],
    ["http://192.168.15.224:13000", "http://192.168.15.224:14000", "15.224"],
    ["http://192.168.15.55:13000", "http://192.168.15.55:14000", "15.55"],

    ["http://gamserver-hk-2.ok858.com:13000", "http://gamserver-hk-2.ok858.com:14000", "hk-2.ok858"],
    ["http://161.117.193.161:13000", "http://161.117.193.161:14000", "线上服193.161"],

]
// 设置默认地址
let defaultServer = Constant.serverList[4];
Constant.gameServerAddress = defaultServer[0];
Constant.webServerAddress = defaultServer[1];

/**
 * 热更新配置地址
 */
Constant.updateConfigAddress = "http://okqp-update.com:81/updateConfig.json";
/**
 * 是否开启热更
 * 与远程配置同为 true 时 才开启热更
 */
Constant.isHotUpdate = true;