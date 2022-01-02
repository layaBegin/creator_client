let Player = module.exports = {};

Player.init = function (data) {
    //服务器发过来的数据初始化
    this.setProperties(data);

    //广播数据
    this.broadcastContents = [];

    Global.MessageCallback.addListener('UpdateUserInfoPush', this);
    Global.MessageCallback.addListener('BroadcastPush', this);
    Global.MessageCallback.addListener('mailRedPointPush', this);
    Global.MessageCallback.addListener('UpdateTradeRecordDetailPush', this);
};

Player.messageCallbackHandler = function (router, msg) {
    switch (router) {
        case 'UpdateUserInfoPush':
            delete msg.pushRouter;
            this.setProperties(msg);
            Global.MessageCallback.emitMessage('UpdateUserInfoUI', msg);
            break;
        case 'mailRedPointPush':
            delete msg.pushRouter;
            this.setProperties(msg);
            Global.MessageCallback.emitMessage('mailRedPointUI', msg);
            break;
        case 'BroadcastPush':
            this.setBroadCastContent(msg);
            break;
    }
};

// Player.setProperties = function (properties) {
//     for (let key in properties) {
//         if (properties.hasOwnProperty(key)) {
//             this[key] = properties[key];
//         }
//     }
// };

Player.setProperties = function (properties) {
    for (let key in properties) {
        if (properties.hasOwnProperty(key)) {
            if (typeof properties[key] == "object") {
                // if (key.substr(0, 1) == "_") {
                for (let item in properties[key]) {
                    if (key in this) {
                        this[key][item] = properties[key][item]
                    } else {
                        this[key] = {}
                        this[key][item] = properties[key][item]
                    }
                }
                // }
            } else {
                this[key] = properties[key];
            }
        }
    }
};

//获取属性
Player.getPy = function (property) {
    if (Global.CCHelper.isWechatBrowser()) {
        if (property === 'avatar') {
            return Global.PlayerWechat.getPy('headimgurl');
        }

        if (property === 'nickname') {
            return Global.PlayerWechat.getPy('nickname');
        }
    }

    //金币保留两位小数，转换之后是字符串
    if (property === 'gold') {
        return Global.Utils.formatNum2(this[property])
    }
    if (property === 'safeGold') {
        return Global.Utils.formatNum2(this[property])
    }

    //账号是手机号，做中间4位手机号变*处理
    if (property === 'account') {
        if (this[property].length === 11) {
            return this[property].substring(0, 3) + '****' + this[property].substring(7, 11);
        }
    }

    //如果昵称和账号一样，则做变*处理
    if (property === 'nickname') {
        if (this['nickname'] === this['account']) {
            return this.getPy('account');
        }
    }

    if (this[property] == undefined) {
        return this['_userData'][property]
    }

    return this[property];
};

//设置属性
Player.setPy = function (property, value) {
    this[property] = value;
};

Player.isInRoom = function () {
    return !!this.getPy('roomID') && this.getPy('roomID') > 0;
};

//是否有可领取邮件
Player.checkCanGet = function () {
    return false;
    let mails = Global.Player.getPy('emailArr');
    mails = JSON.parse(mails);
    if (!!mails) {
        for (let i = mails.length - 1; i >= 0; i--) {
            let data = JSON.parse(mails[i]);
            if (data.coupon || data.diamond) {
                if (parseInt(data.status) === Global.Enum.emailStatus.NOT_RECEIVE) {
                    return true;
                }
            }
        }
    }

    return false;
};

Player.checkUnRead = function () {
    let mails = JSON.parse(Global.Player.getPy('emailArr') || '[]');
    let unReadCount = 0;
    for (let i = mails.length - 1; i >= 0; i--) {
        let data = mails[i];
        if (data.isRead === false) {
            unReadCount++;
        }
    }

    return unReadCount;
};

Player.setMailRead = function (mailId) {
    let mails = Global.Player.getPy('emailArr');
    if (!!mails && mails.length > 0) {
        mails = JSON.parse(mails);
    } else {
        mails = [];
    }
    for (let i = mails.length - 1; i >= 0; i--) {
        let data = mails[i];
        if (data.id + '' === mailId + '') {
            data.isRead = true;
            mails[i] = data;
        }
    }
};
Player.convertNickname = function (nickname) {
    let newStr = undefined;
    if (nickname.length < 7) {
        newStr = nickname.substr(0, 2) + '****';
    } else {
        let char = '';
        for (let i = 0, len = nickname.length - 3; i < len; i++) {
            char += '*';
        }
        newStr = nickname.substr(0, 2) + char + nickname.substr(-2, 2);
    }
    return newStr;
};

//设置广播内容
Player.setBroadCastContent = function (data) {
    this.broadcastContents.push(data);
};

//获取广播内容
Player.getBroadCastContents = function () {
    return this.broadcastContents;
};