var api = module.exports = {};

//进入大厅
api.entry = function (token, userInfo, cbRouter, cbFail) {
    var router = 'connector.entryHandler.entry';
    var requestData = {
        token: token,
        userInfo: userInfo
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'EntryHallResponse', cbFail);
};

// --------------------------------------------用户相关------------------------------------------
//查找玩家，获取玩家信息
api.searchRequest = function (uid, cbRouter) {
    var router = 'hall.userHandler.searchUserData';
    var requestData = {
        uid: uid
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'SearchResponse')
};

//绑定手机号
api.bindAccountRequest = function (account, code, uniqueID, password, cbRouter, cbFail) {
    var router = 'hall.userHandler.bindAccount';
    var requestData = {
        account: account,
        code: code,
        uniqueID: uniqueID,
        password: password
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'bindAccountResponse', cbFail);
};

//绑定真实姓名
api.bindRealNameRequest = function (realName, cbRouter) {
    var router = 'hall.userHandler.bindRealName';
    var requestData = {
        realName: realName
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'BindRealNameResponse');
};

// 修改昵称
api.changeNicknameRequest = function (nickName, cbRouter) {
    var router = 'hall.userHandler.updateNickName';
    var requestData = {
        nickName: nickName
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'ChangeNicknameResponse');
};

// 修改头像
api.changeAvatarRequest = function (avatar, sex, cbRouter) {
    var router = 'hall.userHandler.updateAvatar';
    var requestData = {
        avatar: avatar,
        sex: sex
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'ChangeAvatarResponse');
};

// 更新银行卡信息
api.updateBankCardInfoRequest = function (ownerName, cardNumber, code, province, city, bankInfo, cbRouter) {
    var router = 'hall.userHandler.updateBankCardInfo';
    var requestData = {
        bankCardInfo: {
            cardNumber: cardNumber,
            ownerName: ownerName,
            code: code,
            province: province,
            city: city,
            bankInfo: bankInfo,
            //ownerName名字
            // cardNumber 卡号
            // code 银行code
            // province 省份
            // city 城市
            // bankInfo 开户行
        }
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateBankCardInfoResponse');
};

// 更新支付宝信息
api.updateAliPayInfoRequest = function (aliPayAccount, ownerName, cbRouter) {
    var router = 'hall.userHandler.updateAliPayInfoRequest';
    var requestData = {
        aliPayInfo: {
            aliPayAccount: aliPayAccount,
            ownerName: ownerName
        }
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateAliPayInfoResponse');
};

// 保险柜操作
/**
 * @param count 大于0为存入，小于0为取出
 * @param password 取出时需要密码
 * @param cbRouter
 */
api.safeBoxOperationRequest = function (count, password, cbRouter) {
    var router = 'hall.userHandler.safeBoxOperation';
    var requestData = {
        count: Number(count),
        safePassword: password
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'SafeBoxOperationResponse');
};

// 修改登录密码
api.updateLoginPasswordRequest = function (oldPassword, newPassword, cbRouter) {
    var router = 'hall.userHandler.updateLoginPassword';
    var requestData = {
        oldPassword: oldPassword,
        newPassword: newPassword
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateLoginPasswordResponse');
};

// 修改保险柜密码
api.updateSafePasswordRequest = function (oldPassword, newPassword, cbRouter) {
    var router = 'hall.userHandler.updateSafePassword';
    var requestData = {
        oldPassword: oldPassword,
        newPassword: newPassword
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'UpdateSafePasswordResponse');
};

// 提款申请
/**
 * @param count
 * @param withdrawCashType: enumeration.withdrawCashType
 * @param cbRouter
 */
api.withdrawCashRequest = function (count, withdrawCashType, cbRouter) {
    var router = 'hall.currencyHandler.withdrawCashRequest';
    var requestData = {
        count: count,
        withdrawCashType: withdrawCashType
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'WithdrawCashResponse');
};

// 提取佣金
api.extractionCommissionRequest = function (cbRouter) {
    var router = 'hall.currencyHandler.extractionCommission';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'ExtractionCommissionResponse');
};


//提取佣金记录
api.getRecordData = function (startIndex, count, RecordType, cbRouter) {
    var router = 'hall.recordHandler.getRecordData';
    var requestData = {
        recordType: RecordType,
        startIndex: startIndex,
        count: count
    };
    cc.log(router, RecordType)
    Global.NetworkManager.send(router, requestData, cbRouter || 'getRecordDataResponse');
};

// --------------------------------------------排行榜相关------------------------------------------
// 获取今日赢金币数量排行榜
// api.getTodayWinGoldCountRankRequest = function (startIndex, count, cbRouter) {
//     var router = 'hall.rankHandler.getTodayWinGoldCountRankRequest';
//     var requestData = {
//         startIndex: startIndex,
//         count: count
//     };
//     Global.NetworkManager.send(router, requestData, cbRouter || 'GetTodayWinGoldCountRankResponse');
// };

// 获取今日赢金币数量排行榜
api.getTodayWinGoldCountRankRequest = function (startIndex, count, cbRouter) {
    var router = 'center.rankHandler.getTodayWinGoldCountRankRequest';
    var requestData = {
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetTodayWinGoldCountRankResponse');
};

// --------------------------------------------充值相关------------------------------------------
//购买商城物品
api.purchaseRechargeItemRequest = function (itemID, rechargePlatform, rechargeInfo, cbRouter) {
    var router = 'hall.rechargeHandler.purchaseItem';
    var requestData = {
        itemID: itemID,
        rechargePlatform: rechargePlatform,
        rechargeInfo: rechargeInfo
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'PurchaseRechargeItemResponse');
};

// --------------------------------------------记录相关------------------------------------------
// 获取记录
/**
 * recordType : enumeration.recordType
 */
api.getRecordDataRequest = function (recordType, startIndex, count, cbRouter) {
    var router = 'hall.recordHandler.getRecordData';
    var requestData = {
        recordType: recordType,
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetRecordDataResponse')
};

api.getDirectlyMemberRecordDataRequest = function (startIndex, count, cbRouter) {
    var router = 'hall.recordHandler.getDirectlyMemberRecordData';
    var requestData = {
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetDirectlyMemberRecordDataResponse')
};

api.getAgentMemberRecordDataRequest = function (startIndex, count, cbRouter) {
    var router = 'hall.recordHandler.getAgentMemberRecordData';
    var requestData = {
        startIndex: startIndex,
        count: count
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetAgentMemberRecordDataResponse')
};

// --------------------------------------------房间相关------------------------------------------
api.createRoomRequest = function (parameters, gameTypeID, cbRouter) {
    var router = 'hall.gameHandler.createRoom';
    var requestData = {
        gameRule: parameters,
        gameTypeID: gameTypeID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'CreateRoomResponse');
};

api.joinRoomRequest = function (joinRoomID, cbRouter, cbFail, gameID) {
    var router = 'hall.gameHandler.joinRoom';
    var requestData = {
        roomId: joinRoomID
    };
    console.warn("正在加入房间：：" + joinRoomID);

    if (gameID) {
        Global.NetworkManager.send(router, requestData, cbRouter || 'JoinRoomResponse', (data) => {
            Confirm.show("房间已经解散", () => {
                ViewMgr.goBackHall(gameID);
            })
        });
    } else {
        Global.NetworkManager.send(router, requestData, cbRouter || 'JoinRoomResponse', cbFail);
    }

};

api.exitRoomRequest = function (cbRouter) {
    var router = 'hall.gameHandler.exitRoom';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'ExitRoomResponse');
};

api.matchRoomRequest = function (gameTypeID, cbRouter, cbFail) {
    var router = 'hall.gameHandler.matchRoom';
    var requestData = {
        gameTypeID: gameTypeID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'MatchRoomResponse', cbFail);
};

api.stopMatchRoomRequest = function (cbRouter) {
    var router = 'hall.gameHandler.stopMatchRoom';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'StopMatchRoomResponse');
};

api.getAllRoomGameDataByKind = function (kindID, cbRouter) {
    var router = 'hall.gameHandler.getAllRoomGameDataByKind';
    var requestData = {
        kindID: kindID
    };
    //异步函数处理
    if (typeof cbRouter == "function") {
        Global.NetworkManager.send(router, requestData, cbRouter || 'getAllRoomGameDataByKindResponse');
    } else {
        return new Promise((resolve, reject) => {
            Global.NetworkManager.send(router, requestData,
                (msg) => {
                    resolve(msg);
                },
                (msg) => {
                    resolve(msg);
                });
        });
    }
};

api.getRoomGameDataByRoomID = function (roomID, cbRouter) {
    var router = 'hall.gameHandler.getRoomGameDataByRoomID';
    var requestData = {
        roomID: roomID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'GetRoomGameDataByRoomIDResponse');
};

// --------------------------------------------其他相关------------------------------------------
api.readEmailRequest = function (emailID, cbRouter) {
    var router = 'hall.emailHandler.readEmail';
    var requestData = {
        emailID: emailID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'ReadEmailResponse')
};
//获取游戏公告
api.getNoticeRequest = function (cbRouter) {
    var router = 'hall.hallHandler.getNotice';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getNoticeResponse')
};

//签到查询
api.CheckInRecordRequest = function (cbRouter) {
    var router = 'hall.activityHandler.getCheckInRecord';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'CheckInRecordResponse');
}

//签到
api.CheckInRequest = function (cbRouter) {
    var router = 'hall.activityHandler.checkIn';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'CheckInResponse');
}

//获取邮件列表
api.getMailRequest = function (cbRouter) {
    var router = 'hall.emailHandler.getEmail';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getMailResponse')
};

//邮件操作状态
api.operationEmail = function (ID, type, cbRouter) {
    var router = 'hall.emailHandler.operationEmail';
    var requestData = {
        _id: ID,
        type: type
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'operationEmailResponse')
};

//洗码记录
api.getWashCodeRecord = function (cbRouter) {
    var router = 'hall.activityHandler.getWashCodeRecord';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getWashCodeRecordResponse')
};

//获取洗码信息
api.getWashCodeDate = function (cbRouter) {
    var router = 'hall.activityHandler.getWashCodeData';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getWvashCodeDataResponse')
};

//请求洗码
api.washCodeRequest = function (cbRouter) {
    var router = 'hall.activityHandler.washCode';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'washCodeResponse')
};
//抽奖转盘 获取大奖记录
api.getTurntableGrandPrizeRecordRequest = function (cbRouter) {
    var router = 'hall.activityHandler.getTurntableGrandPrizeRecord';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getTurntableGrandPrizeRecordResponse');
};

//抽奖转盘 获取个人中奖记录
api.getTurntableSelfRecordRequest = function (cbRouter) {
    var router = 'hall.activityHandler.getTurntableSelfRecord';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getTurntableSelfRecordResponse');
};

//抽奖转盘 抽奖
api.turntableRequest = function (type_, cbRouter, cbFail) {
    var router = 'hall.activityHandler.turntable';
    var requestData = {};
    requestData.type = type_;
    Global.NetworkManager.send(router, requestData, cbRouter || 'turntableResponse', cbFail);
};

//抽奖转盘 获取转盘配置
api.getTurntableGrandConfigRequest = function (cbRouter) {
    var router = 'hall.activityHandler.getTurntableGrandConfig';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getTurntableGrandConfigResponse');
};

//获取会员等级
api.getVIPactivityRequest = function (cbRouter) {
    var router = 'hall.activityHandler.getUserVipInfo';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getUserVipInfoResponse');
};


// //晋级礼金领取
// api.getVIPPromotionMoney = function (cbRouter) {
//     var router = 'hall.activityHandler.getVIPPromotionMoney';
//     var requestData = {};
//     Global.NetworkManager.send(router, requestData, cbRouter || 'getVIPPromotionMoneyResponse');
// };

// //周礼金领取
// api.getVIPWeeksMoney = function (cbRouter) {
//     var router = 'hall.activityHandler.getVIPWeeksMoney';
//     var requestData = {};
//     Global.NetworkManager.send(router, requestData, cbRouter || 'getVIPWeeksMoneyResponse');
// };

// //月礼金领取
// api.getVIPMonthMoney = function (cbRouter) {
//     var router = 'hall.activityHandler.getVIPMonthMoney';
//     var requestData = {};
//     Global.NetworkManager.send(router, requestData, cbRouter || 'getVIPMonthMoneyResponse');
// };

//领取Vip权益
api.getVipReward = function (type, cbRouter) {
    var router = 'hall.activityHandler.getVipReward';
    var requestData = {
        type: type
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'getVIPMonthMoneyResponse');
};

//获取游戏房间列表
api.getRoomListByKind = function (kindID, cbRouter) {
    var router = 'hall.gameHandler.getRoomListByKind';
    var requestData = {
        kindID: kindID,
    }
    //异步函数处理
    if (typeof cbRouter == "function") {
        Global.NetworkManager.send(router, requestData, cbRouter || 'getRoomListByKindResponse');
    } else {
        return new Promise((resolve, reject) => {
            try {
                Global.NetworkManager.send(router, requestData,
                    (msg) => {
                        resolve(msg);
                    },
                    (msg) => {
                        resolve(msg);
                    });
            } catch (error) {
                console.error(error);
                resolve();
            }

        });
    }

};

//获取游戏代理充值配置
api.getAgentRechargeConfigs = function (cbRouter, cbFail) {
    var router = 'hall.rechargeHandler.getAgentRechargeConfigs';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getAgentRechargeConfigsResponse', cbFail);
};

//获取游戏银行充值配置
//type  1 银行卡转账 2 微信转银行卡 3 支付宝转银行卡
api.getBankRechargeConfigs = function (type, cbRouter, cbFail) {
    var router = 'hall.rechargeHandler.getBankRechargeConfigs';
    var requestData = {
        type: type
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'getBankRechargeConfigsResponse', cbFail);
};

//投诉代理
api.complaintAgent = function (data, cbRouter) {
    var router = 'hall.rechargeHandler.complaintAgent';
    var requestData = {
        weChat: data.weChat,
        content: data.content
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'complaintAgentResponse');
};

// 银行转账充值
api.userBankRecharge = function (data, cbRouter) {
    var router = 'hall.rechargeHandler.userBankRecharge';
    var requestData = {
        uuid: data.uuid,
        rechargeInfo: data.rechargeInfo,
        gold: data.gold,
        type: data.type
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'userBankRechargeResponse');
};

// 获取充值方式
api.getRechargeDis = function (cbRouter, cbFail) {
    var router = 'hall.rechargeHandler.getRechargeDis';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getRechargeDisResponse', cbFail);
};

//获取线上充值配置
api.getOnlineRechargeConfig = function (rechargeDisID, cbRouter, cbFail) {
    var router = 'hall.rechargeHandler.getOnlineRechargeConfig';
    var requestData = {
        rechargeDisID: rechargeDisID
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'getOnlineRechargeConfigResponse', cbFail);
};


//获取充值配置
api.getOnlineRechargeUrl = function (rechargeID, rechargeGold, cbRouter, cbFail) {
    var router = 'hall.rechargeHandler.getOnlineRechargeUrl';
    var requestData = {
        rechargeID: rechargeID,
        rechargeGold: parseInt(rechargeGold)
    };
    Global.NetworkManager.send(router, requestData, cbRouter || 'getOnlineRechargeUrlResponse', cbFail);
};

//获取充值记录
api.getRechargeRecord = function (cbRouter, cbFail) {
    var router = 'hall.rechargeHandler.getRechargeRecord';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getRechargeRecordResponse', cbFail);
};
//获取当前平台支持的提现方式
api.getWithdrawCashConfig = function (cbRouter, cbFail) {
    var router = 'hall.currencyHandler.getWithdrawCashConfig';
    var requestData = {};
    Global.NetworkManager.send(router, requestData, cbRouter || 'getWithdrawCashConfigResponse', cbFail);
};