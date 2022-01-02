/**
 * Created by yuzheng on 2017/3/14.
 */
var enumeration = module.exports;

enumeration.gameType = {
    ZJH: 1, //扎金花
    NN: 10, //抢庄牛牛
    ERNN: 11, //二人牛牛
    MPNN: 12, //明牌抢庄牛牛
    SSS: 20, //十三水
    TTZ: 30, //推筒子
    HHDZ: 40, //红黑大战
    BJL: 50, //百家乐
    LHD: 60, //龙虎大战
    FISH: 70, // 捕鱼
    DDZ: 80, // 斗地主
    BJ: 90, // 21点
    BCBM: 100, // 奔驰宝马
    BRNN: 110, // 百人牛牛
    DZ: 120, // 德州扑克
    PDK: 130, // 跑得快
};

enumeration.gameName = [];
enumeration.gameName[1] = '扎金花';
enumeration.gameName[10] = '抢庄牛牛';
enumeration.gameName[11] = '二人牛牛';
enumeration.gameName[12] = '明牌抢庄牛牛';
enumeration.gameName[20] = '十三水';
enumeration.gameName[30] = '百人推筒子';
enumeration.gameName[40] = '红黑大战';
enumeration.gameName[50] = '百家乐';
enumeration.gameName[60] = '龙虎大战';
enumeration.gameName[70] = '捕鱼';
enumeration.gameName[80] = '斗地主';
enumeration.gameName[90] = '21点';
enumeration.gameName[100] = '奔驰宝马';
enumeration.gameName[110] = '百人牛牛';
enumeration.gameName[120] = '德州扑克';
enumeration.gameName[130] = '跑得快';

// 广播类型
enumeration.broadcastType = {
    NONE: 0,
    LOOP: 1, // 循环广播
    SYSTEM: 2, // 系统广播
    BIG_WIN: 3 // 赢大奖广播
};

enumeration.goodsType = {
    NONE: 0,
    RMB: 1,
    GOLD: 2,
    DIAMOND: 3,
    TICKET: 4,
    COUPON: 5
};

enumeration.goodsName = [];
enumeration.goodsName[enumeration.goodsType.RMB] = '人民币';
enumeration.goodsName[enumeration.goodsType.GOLD] = '金币';
enumeration.goodsName[enumeration.goodsType.DIAMOND] = '钻石';
enumeration.goodsName[enumeration.goodsType.TICKET] = '门票';
enumeration.goodsName[enumeration.goodsType.COUPON] = '礼券';

enumeration.goodsImg = [];
enumeration.goodsImg[enumeration.goodsType.TICKET] = 'Sell/ticket';
enumeration.goodsImg[enumeration.goodsType.COUPON] = 'Sell/prop';

// 游戏模式
enumeration.roomSettlementMethod = {
    NONE: 0,
    GOLD: 1, // 金币模式
    SCORE: 2, // 积分模式
    LIMIT_GOLD: 3, // 限制金币模式
};

// 房间类型
enumeration.roomType = {
    NONE: 0,
    NORMAL: 1, // 匹配类型
    PRIVATE: 2, // 私有房间（房卡房间）
    HUNDRED: 3 // 百人房间
};

// 操作类型
enumeration.updateDataType = {
    NONE: 0,
    ADD: 1,
    REMOVE: 2,
    UPDATE: 3
};

//玩家性别
enumeration.PlayerSex = {
    MAN: 0,
    WOMAN: 1
};

// 允许登陆类型
enumeration.allowLoginType = {
    NONE: 0,
    ACCOUNT: 1, //账号
    GUEST: 2,
    MOBILE_PHONE: 3 //手机号
};

// 允许注册类型
enumeration.allowRegType = {
    NONE: 0,
    ACCOUNT: 1, //账号
    GUEST: 2,
    MOBILE_PHONE: 3 //手机号
};

enumeration.userRoomState = {
    NONE: 0,
    ENTERING: 1,
    IN_ROOM: 2
};

enumeration.gameRoomStatus = {
    NONE: 0,
    FREE: 1,
    PLAYING: 2
};

enumeration.gameRoomStartType = {
    NONE: 0,
    ALL_READY: 1,
    AUTO_START: 2
};

enumeration.userOnlineStatus = {
    NONE: 0,
    OFF_LINE: 1,
    ON_LINE: 2
};

enumeration.gameRoomChatContentType = {
    NONE: 0,
    EMOTION: 1,
    QUICK_TEXT: 2,
    TEXT: 3,
    VOICE: 4
};

enumeration.VOICE = {
    PU_TONG_HUA: 'putonghua',
    GAN_ZHOU_HUA: 'ganzhouhua'
};

enumeration.ShopType = {
    NONE: 0,
    SHOP_GOLD: 1,
    SHOP_DIAMOND: 2
};

enumeration.RoomUserStatus = {
    NONE: 0,
    ONLINE: 1,
    OFFLINE: 2
};

// 第三方支付平台中的选择支付方式
enumeration.PAY_TYPE = {
    NONE: 0,
    ALI_PAY: 1, //支付宝
    WE_CHAT: 2, //微信
    QQ_PAY: 3, // qq支付
    UNION_PAY: 4 // 银联支付
};

// 充值平台
enumeration.RechargePlatform = {
    NONE: 0,
    ALI: 1, // 支付宝
    WX: 2, // 微信
    ANXEN_PAY: 3 // 安迅通
};

// 系统平台
enumeration.SystemPlatform = {
    NONE: 0,
    ANDROID: 1,
    IOS: 2,
    WEB: 3
};

// 权限类型
enumeration.userPermissionType = {
    NONE: 0,
    LOGIN_CLIENT: 0x0001, // 登录客户端
    LOGIN_MT: 0x0002, // 登录管理工具
    USER_MANAGER: 0x0004, // 用户管理
    USER_SYSTEM_MANAGER: 0x0008, // 系统管理
    EXCHANGE_MANAGER: 0x0010, // 兑换管理
    SPREAD_MANAGER: 0x0020, // 推广管理
    GAME_MANAGER: 0x0040, // 游戏管理
    DATA_MANAGER: 0x0080, // 数据统计
    GAME_CONTROL: 0x0100 // 游戏控制
};

// 邮件状态
enumeration.emailStatus = {
    NONE: 0,
    NOT_RECEIVE: 1,
    RECEIVED: 2
};

// 兑换订单状态
enumeration.exchangeRecordStatus = {
    NONE: 0,
    WAIT_DELIVERY: 1, // 备货中
    ALREADY_DELIVERY: 2 // 已发货
};

// 订单状态
enumeration.orderStatus = {
    WAIT_HANDLE: 1, // 未处理
    ALREADY_HANDLE: 2 // 已处理
};

// 记录类型
enumeration.recordType = {
    NONE: 0,
    RECHARGE: 1, // 充值记录
    WITHDRAWALS: 2, // 提现记录
    GAME: 3, // 游戏记录
    LOGIN: 4, // 登录记录
    EXTRACT_COMMISSION: 5, // 提取佣金记录
    GAME_PROFIT: 6, // 游戏抽水记录
    EXTRACT_INVENTORY: 7, // 库存抽取记录
    ADMIN_GRANT: 8, // 管理员赠送记录
    ACTION: 9, // 行为记录
    EXTRACT_GIVE_COMMISSION: 10, //  佣金发放记录
};

// 行为记录类型
enumeration.actionType = {
    USER_LOGIN: 0, //用户登陆
    TEST_LOGIN: 1, //试玩用户登陆
    USER_REG: 2, //用户注册
    TEST_REG: 3, //试玩用户注册
    TEST_BIND_ACCOUNT: 4 //试玩账号绑定用户
};

// 账号平台类型
enumeration.accountType = {
    NOBILE_USER: 0, //手机账号用户
    ACCOUNT_USER: 1, //自定义账号用户
    WX_USER: 2, //微信用户
    QQ_USER: 3, //QQ用户
    TEST_USER: 4 //试玩账号用户
};

// 变动类型 变动来源类型 0游戏 1充值 2取款 3活动 4佣金 5洗码
enumeration.changeType = {
    GAME: 0, //游戏
    RECHARGE: 1, //充值
    DRAWAL: 2, //取款
    ACTIVITY: 3, //活动
    COMMISSION: 4, //佣金
    CODE: 5, //洗码
    SAFE: 6 //保险柜
};

// 变动类型 小类类型
enumeration.smallType = {
    REG_GIFT: 1000, //注册送金币
    TEST_REG: 1001, //试玩金币
    TURNTABLE: 1002, //转盘
    CHECKIN: 1003, //签到
    WASHCODE: 1004, //洗码
    VIPUP: 1005, //VIP晋级奖金
    VIPWEEK: 1006, //VIP周奖金
    VIPMONTH: 1007, //VIP月奖金
    SAFE_RECHARGE: 1010, //保险柜存入
    SAFE_DRAWAL: 1011, //保险柜取出
    AOOLY_WITHDRAWAL: 1012, //申请取款
    REFUSE_WITHDRAWAL: 1013, //拒绝取款
    RETURN_WITHDRAWAL: 1014, //退回取款
    OK_WITHDRAWAL: 1015, //已出款

    ADMIN_RECHARGE: 1100, //人工存款 后台存入
    ADMIN_ACTIVITY_RECHARGE: 1101, //活动优惠存款
    ADMIN_WITHDRAWAL: 1102, //人工提款
    ADMIN_WITHDRAWAL_MUFF: 1103, //误存提款
    ADMIN_WITHDRAWAL_ADMINISTRATION: 1104, //行政提款
    ADMIN_INTEGRAL: 1105, //人工存入积分

    AGENCYCOMMISSION: 1500 //代理佣金
};

// 活动类型
enumeration.activityType = {
    REG_GIFT: 1000, //注册送金币
    TEST_REG: 1001, //试玩金币
    TURNTABLE: 1002, //转盘
    CHECKIN: 1003, //签到
    WASHCODE: 1004, //洗码
    VIP: 1005, //VIP
    VIPWEEK: 1006, //代理佣金
};


// 变动类型 变动来源类型 0游戏 1充值 2取款 3活动 4佣金 5洗码
enumeration.web_his = {
    //变动来源 游戏
    GAME: {
        1: '扎金花',
        10: '抢庄牛牛',
        11: '二人牛牛',
        12: '明牌抢庄牛牛',
        20: '十三水',
        30: '百人推筒子',
        40: '红黑大战',
        50: '百家乐',
        60: '龙虎斗',
        70: '捕鱼',
        80: '斗地主',
        90: '21点',
        100: '奔驰宝马',
        110: '百人牛牛',
        120: '德州扑克',
        130: '跑得快'
    },
    //变动来源 充值
    RECHARGE: {
        1100: '人工存款',
        1101: '活动优惠存款',
        1105: '人工存入积分'
        //要根据所有的充值方式去显示了
    },
    //变动来源 取款         
    DRAWA: {
        1015: '取款成功',
        1014: '取款退回',
        1012: '申请取款',
        1013: '取款拒绝',
        1102: '人工取款',
        1103: '误存取款',
        1104: '行政取款',
    },
    //变动来源 活动
    ACTIVITY: {
        1000: '注册送金币', //注册送金币
        1001: '试玩金币', //试玩金币
        1002: '转盘抽奖', //转盘
        1003: '每日签到', //签到
        1005: "VIP晋级奖金", //VIP晋级奖金
        1006: "VIP周奖金", //VIP周奖金
        1007: 'VIP月奖金', //VIP月奖金
    },
    //变动来源 佣金        
    COMMISSION: {
        1500: '代理佣金', //代理佣金
    },
    //变动来源 洗码 
    CODE: {
        1004: '洗码',
    },
    SAFE: {
        1010: '保险柜存入',
        1011: '保险柜取出',
    },
};

// 变动类型 变动来源类型 0游戏 1充值 2取款 3活动 4佣金 5洗码
enumeration.changeTypeName = {
    1: '扎金花',
    10: '抢庄牛牛',
    11: '二人牛牛',
    12: '明牌抢庄牛牛',
    20: '十三水',
    30: '百人推筒子',
    40: '红黑大战',
    50: '百家乐',
    60: '龙虎斗',
    70: '捕鱼',
    80: '斗地主',
    90: '21点',
    100: '奔驰宝马',
    110: '百人牛牛',
    120: '德州扑克',
    130: '跑得快',
    1100: '人工存款',
    1101: '活动优惠存款',
    1105: '人工存入积分',

    1015: '取款成功',
    1014: '取款退回',
    1012: '申请取款',
    1013: '取款拒绝',
    1102: '人工取款',
    1103: '误存取款',
    1104: '行政取款',
    1000: '注册送金币', //注册送金币
    1001: '试玩金币', //试玩金币
    1002: '转盘抽奖', //转盘
    1003: '每日签到', //签到
    1005: "VIP晋级奖金", //VIP晋级奖金
    1006: "VIP周奖金", //VIP周奖金
    1007: 'VIP月奖金', //VIP月奖金

    1500: '代理佣金', //代理佣金

    1004: '洗码',

    1010: '保险柜存入',
    1011: '保险柜取出',
};


// 稽核类型
enumeration.auditType = {
    RECHARGE: 1, //1 充值
    ACTIVITY: 2 //2 活动 优惠
};

// 稽核操作类型
enumeration.auditOperateType = {
    NODE: 0,
    OL: 1, //线上入款 
    COM: 2, //公司入款
};



enumeration.withdrawCashType = {
    NONE: 0,
    ALI_PAY: 1, // 支付宝
    BANK_CARD: 2 // 银行卡
};

enumeration.rechargeType = {
    OL_RECHARGE: 1, //在线充值
    BANK_RECHARGE: 2, //银行卡充值
    WECHAT_TO_BANK_RECHARGE: 3, //微信转银行卡充值
    ALIPAY_TO_BANK_RECHARGE: 4, //支付宝转银行卡充值
    VIP_RECHARGE: 5, //VIP快速充值
    AGENT_RECHARGE: 6 //代理充值
}