window["OK"] = 0;
window["FAIL"] = 1;
var constant = function () {
  this.OK = 0;
  this.FAIL = 1;
  this.REQUEST_DATA_ERROR = 2; // 请求数据错误
  this.MYSQL_ERROR = 3; // 数据库操作错误
  this.INVALID_UERS = 4; // 无效用户
  this.INVALID_PARAM = 5; //发送参数错误
  this.PERMISSION_NOT_ENOUGH = 6; // 权限不足
  this.SMS_CODE_ERROR = 7; // 短信验证码错误
  this.IMG_CODE_ERROR = 8; // 图形验证码错误

  this.SMS_CODE_COUNT_ERROR = 13; // 验证码错误次数大于3

  this.SMS_AUTH_CONFIG_ERROR = 9; // 短信验证配置信息错误
  this.SMS_SEND_FAILED = 10; // 短信发送失败
  this.NO_LOGIN_TYPE = 11; // 不支持的登陆类型
  this.NO_LOGIN_BIND_TYPE = 12; // 不支持的登陆类型
  this.NO_TO_SERVER = 9999; // 账号已被封禁,请联系客服

  this.LOGIN = {
    ACCOUNT_OR_PASSWORD_ERROR: 103, // 账号或密码错误
    GET_HALL_SERVERS_FAIL: 104, // 获取大厅服务器失败
    ACCOUNT_EXIST: 105, // 账号已存在
    ACCOUNT_NOT_EXIST: 106, // 帐号不存在
    ANSWER_ERROR: 107, // 密保问题答案错误
    PASSWORD_ERROR: 108, // 密码错误
    NO_GUEST_REG_ERROR: 109, //不允许游客注册
    NO_GUEST_LOGIN_ERROR: 110, //不允许游客登陆，109 110统一显示这个
    NO_REG_ACCOUNT_ERROR: 111, //账号注册格式错误 
    NO_REG_PASSWORD_ERROR: 112, //密码长度错误   
    NO_REG_PHONE_ERROR: 113, //手机号码不正确
    NO_OPEN_ACCOUNT_ERROR: 114, //暂不支持账号登陆
    NO_OPEN_GUEST_ERROR: 115, //暂不支持手机登陆
    NO_OPEN_PHONE_ERROR: 116, //暂不支持游客登陆
    MAX_IP_REGIS_COUNT_ERROR: 117, //该IP地址已无法注册账号,请联系客服
  };
  this.HALL = {
    TOKEN_INFO_ERROR: 201, // token信息错误
    TOKEN_INVALID: 202, // token失效

    TODAY_ALREADY_SIGNED: 203, // 今日已签到
    TODAY_ALREADY_SHARED: 204, // 今日已分享

    NOT_SPREAD_REWARDS: 205, // 没有可领取的推广奖励

    NOT_ENOUGH_GOLD: 206, // 金币不足
    NOT_ENOUGH_DIAMOND: 207, // 钻石不足

    ALREADY_IN_FRIEND_LIST: 208, // 已经在好友列表中
    ALREADY_IN_REQUEST_LIST: 209, // 已经在请求列表中
    NOT_IN_FRIEND_LIST: 210, // 不再好友列表中
    NOT_IN_REQUEST_LIST: 211, // 不再请求列表中
    NOT_FIND: 212, // 未找到该用户

    CAN_NOT_EVALUATE_TODAY: 213, // 今日评价次数已达上限
    SPREAD_ID_ALREADY_SET: 214, // 已设置过推广ID，无法重复设置
    NOT_FIND_TRADE_ORDER: 215, // 未查询到订单信息
    BROADCAST_STRING_TOO_LONG: 216, // 广播字符数量太长
    BIND_PHONE_ALREADY: 217, // 手机号已被绑定
    BIND_WX_ALREADY: 218, // 微信已经被绑定
    TRADE_INFO_NOT_FIND: 219, // 订单不存在
    NOT_ENOUGH_VIP_LEVEL: 220, // vip等级不足
    INVITED_FRIEND_OFFLINE: 221, // 好友不在线

    CAN_NOT_CHANGE_USER_INFO_BECAUSE_INTERVAL_TIME: 222, // 个人资料三十天才能改变一次

    NICKNAME_TO_LONG: 223, // 名字太长
    NO_LOGIN: 224, // 帐号被冻结，禁止登录
    TODAY_ALREADY_WITHDRAW_CASH: 225, // 今日已退款
    NOT_SPREADER: 226, // 非推广员
    NOT_ENOUGH_COUPON: 227, // 积分不足
    ALREADY_SPREADER: 228, // 该用户已经为推广员
    GOLD_LOCKED: 229, // 当前正在游戏中无法操作金币
    SAFE_PASSWORD_ERROR: 230, // 保险柜密码错误

    NOT_BIND_ALI_PAY: 231, // 未绑定支付宝
    NOT_BIND_BANK_CARD: 232, // 未绑定银行卡

    ALIPAY_ACCOUNT_ERROR: 233, //支付宝账号不正确
    ALIPAY_NAME_ERROR: 234, //支付宝账号名字不正确
    BANK_NUM_ERROR: 235, //银行卡卡号错误
    BANK_NAME_ERROR: 236, //银行卡持卡人错误
    BANK_CODE_ERROR: 237, //不支持的取款银行
    BANK_PROVINCE_ERROR: 238, //省份错误
    BANK_CITY_ERROR: 239, //城市错误
    BANK_BANKINFO_ERROR: 240, //开户行错误

    VIP_LEVEL_ERROR: 241, //vip等级错误

    BIND_REAL_NAME_ERROR: 242, //真实姓名不正确,只能为汉字长度1-6
    REPEAT_BIND_REAL_NAME_ERROR: 243, //真实姓名不能重复绑定,请联系客服

    NICKNAME_ERROR: 244, //昵称不正确,只能为汉字长度1-7

    DRAWA_GOLD_LENGTH_ERROR: 250, //提款金额小于或者大于模板设定金额

    PHONE_BIND_ERROR: 251, //已绑定手机,无法重复绑定
    PHONE_ERROR: 252, //手机号码不正确
    BIND_ONLY_ALLOWED_GUEST: 253, //非游客无法绑定信息
    BIND_ACCOUNT_ALREADY: 254, // 账号已被绑定
    BIND_REPEAT: 255, //重复绑定
  };

  this.GAME_CENTER = {
    ENTERING_ROOM_CANT_MATCH: 301, // 正在进入房间无法重新匹配
    GAME_SERVER_PARAMETER_ERROR: 302, // 游戏服务器参数错误
    MATCHING: 303, // 正在匹配
    ENTERING_ROOM: 304, // 正在进入房间
    NOT_IN_MATCH_LIST: 305, // 没有在匹配队列中
    ALREADY_IN_ROOM: 306, // 已经在房间中，无法创建新的房间
    CREATE_ROOM_ERROR: 307, // 创建房间失败
    ROOM_NOT_EXIST: 308, // 房间不存在
    ROOM_PLAYER_COUNT_FULL: 309, // 房间人数已满
    JOIN_ROOM_ERROR: 310, // 加入房间失败
    ENTRY_ROOM_FAIL_GOLD_NOT_ENOUGH: 311, // 进入房间失败，金币不足
    ENTRY_ROOM_FAIL_GOLD_TOO_MANY: 312, // 进入房间失败，金币超过上限
    ALREADY_IN_MATCH_LIST: 313, // 已经在匹配列表中，无法重新匹配
  };
  this.GAME = {
    ROOM_COUNT_REACH_LIMIT: 401, // 房间数量到达上线
    LEAVE_ROOM_GOLD_NOT_ENOUGH_LIMIT: 402, // 金币不足，无法开始游戏
    LEAVE_ROOM_GOLD_EXCEED_LIMIT: 403, // 金币超过最大限度，无法开始游戏
    ROOM_EXPENSE_NOT_ENOUGH: 404, // 房费不足
    ROOM_HAS_DISMISS: 405, // 房间已解散
    ROOM_HAS_DISMISS_SHOULD_EXIT: 406, // 房间已解散，请离开房间
    CAN_NOT_LEAVE_ROOM: 407, // 正在游戏中无法离开房间
  };

  this.RECHARGE = {
    RECHARGE_FAIL: 501, // 充值失败
    RECHARGE_SUCCESS: 502, // 充值成功
    USER_NOT_FIND: 503, // 未找到用户
    ITEM_NOT_FIND: 504, // 未找到商品信息
    SIGN_CHECK_ERR: 505, // 签名验证错误
    MONEY_COUNT_ERR: 506, // 充值金额错误
    ITEM_INFO_ERR: 507, // 商品信息错误
    USER_PAYMENT_FAILED: 508, // 用户支付失败
    BANK_RECHARGE_STOP: 509, // 充值银行卡已关闭,请联系客服
    BANK_RECHARGE_GOLD_ERROR: 510, // 此通道只支持x-x金额,请联系客服
    RECHARGE_DIS_ERROR: 511, // 该展示渠道暂未支持
    RECHARGE_CHANNEL_ERROR: 512, // 充值渠道为空,暂时无法提供充值
    RECHARGE_ID_ERROR: 513, // 该充值渠道暂未支持
  };

  this.ENTRYANDEXIT = {
    TEMPLATE_STOP: 1000, //出入款模板已经被禁用了
  }


  this.ACTIVITY = {
    ACTIVITY_COLSE: 700,
    ACTIVITY_NO_OPEN: 701,
    ACTIVITY_STOP: 702,
    NOT_CHECKIN: 750,
    ALREADY_CHECKIN: 751,
    INTEGRAL_NOT: 752,
    WASHCODE_GOLD_NOT: 753,
    // WASHCODE_OK: 754,
    RISELEVELGIF: 755,
    WEEKGIF: 756,
    MONTHGIF: 757,
    COMMISSION_DRAW_GOLD_ERROR: 758, //佣金提取金额必须大于1.00元
  };

  this[700] = '活动已结束';
  this[701] = '活动还未开始';
  this[702] = '活动已暂停';
  this[750] = '今日未签到';
  this[751] = '今日已签到,签到失败';
  this[752] = '积分不足无法开启转盘';
  this[753] = '洗码金额必须大于1.00元';
  // this[754] = '洗码成功';
  this[755] = '领取失败，你已经领取过晋级礼金';
  this[756] = '领取失败，你已经领取过周礼金';
  this[757] = '领取失败，你已经领取过月礼金';
  this[758] = '佣金提取金额必须大于1.00元';


  this[1] = '数据请求失败';
  this[2] = '请求数据错误';
  this[3] = '数据库操作错误';
  this[4] = '无效用户';
  this[5] = '发送参数错误';
  this[6] = '权限不足';
  this[7] = '短信验证码错误';
  this[8] = '图形验证码错误';
  this[9] = '短信验证配置信息错误';
  this[10] = '短信发送失败';
  this[11] = '不支持的登陆类型';
  this[12] = '不支持的绑定类型';
  this[9999] = '账号已被封禁,请联系客服';

  this[103] = '账号或密码错误';
  this[104] = '获取大厅服务器失败';
  this[105] = '账号已存在';
  this[106] = '帐号不存在';
  this[107] = '密保问题答案错误';
  this[108] = '密码错误';
  this[109] = '不允许游客登陆';
  this[110] = '不允许游客登陆';
  this[111] = '账号只允许字母开头，包含字母/数字/_/-,长度6-15位';
  this[112] = '密码最大长度6-18位';
  this[113] = '请输入正确的手机号'
  this[114] = '暂不支持账号登陆';
  this[115] = '暂不支持手机登陆';
  this[116] = '暂不支持游客登陆'
  this[117] = '该IP地址已无法注册账号,请联系客服';


  this[201] = 'token信息错误';
  this[202] = 'token失效';
  this[203] = '今日已签到';
  this[204] = '今日已分享';
  this[205] = '没有可领取的推广奖励';
  this[206] = '金币不足';
  this[207] = '钻石不足';
  this[208] = '已经在好友列表中';
  this[209] = '已经在请求列表中';
  this[210] = '不在好友列表中';
  this[211] = '不再请求列表中';
  this[212] = '用户不存在';
  this[213] = '每日最多点踩、赞各10次';
  this[214] = '已设置过推广ID，无法重复设置';
  this[215] = '未查询到订单信息';
  this[216] = '发送内容过长，不能超过50个字符';
  this[217] = '该手机号已经绑定，不能重复绑定';
  this[218] = '该微信号已经绑定，不能重复绑定';
  this[219] = '订单不存在';
  this[220] = '会员等级不足';
  this[221] = '邀请的好友不在线';
  this[222] = '无法修改个人信息，修改间隔不得少于30天';
  this[223] = '昵称长度不能超过五个字符';
  this[224] = '帐号被冻结，禁止登录';
  this[225] = '每天只能提交一次退款申请，不能再次提交';
  this[226] = '请输入正确的邀请码';
  this[227] = '积分不足';
  this[228] = '该用户已经为推广员，无法重复设置';
  this[229] = '当前正在游戏中，无法进行金币操作，请退出游戏或等待游戏结束';
  this[230] = '保险柜密码错误';
  this[231] = '未绑定支付宝';
  this[232] = '未绑定银行卡';
  this[233] = '支付宝账号只能为手机号或者邮箱';
  this[234] = '支付宝账号名字只能为汉字长度1-6';


  this[235] = '银行卡卡号错误只能为数字';
  this[236] = '银行卡持卡人错误只能为汉字长度1-6';
  this[237] = '不支持的取款银行';
  this[238] = '省份错误';
  this[239] = '城市错误';
  this[240] = '开户行错误只能为汉字长度0-20';
  this[241] = 'VIP等级不正确';
  this[242] = '真实姓名不正确,只能为中文字长度1-6';
  this[243] = '真实姓名不能重复绑定,请联系客服';
  this[244] = '昵称不正确,只能为汉字长度3-7';

  this[250] = '取款金额不在支持范围内';
  this[251] = '已绑定手机,无法重复绑定';
  this[252] = '手机号码不正确';
  this[253] = '非游客无法绑定信息';
  this[254] = '账号已被绑定';
  this[255] = '重复绑定';



  this[301] = '正在进入房间无法重新匹配';
  this[302] = '游戏服务器参数错误';
  this[303] = '正在匹配';
  this[304] = '正在进入房间';
  this[305] = '没有在匹配队列中';
  this[306] = '已经在房间中，无法创建新的房间';
  this[307] = '创建房间失败';
  this[308] = '房间不存在';
  this[309] = '房间人数已满';
  this[310] = '加入房间失败';
  this[311] = '金币不足无法进入房间';
  this[312] = '金币超过上线，无法进入房间';
  this[313] = '已经在匹配列表中，无法重复匹配';

  this[401] = '房间数量到达上线';
  this[402] = '金币低于房间的金币下限';
  this[403] = '金币低于房间的金币下限';
  this[404] = '房卡不足';
  this[405] = '房间已解散';
  this[406] = '房间已解散，请离开房间';
  this[407] = '当前正在游戏中，无法离开房间';

  this[500] = '请求超时';
  this[501] = '充值失败';
  this[502] = '充值成功';
  this[509] = '充值银行卡已关闭,请联系客服';
  this[510] = '此通道只支持x-x金额,请联系客服'
  this[511] = '该展示渠道暂未支持'
  this[512] = '充值渠道为空,暂时无法提供充值'
  this[513] = '该充值渠道暂未支持'

  this[1000] = '请联系客服Code:1000'
};
module.exports = new constant();