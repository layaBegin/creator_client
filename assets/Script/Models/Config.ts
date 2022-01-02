interface View {
    id: number
    enName: string
    zhName?: string
    resDir?: string[]
    prefabUrl: string
    subView?: { [key: string]: View }
}

/**
 * 游戏类型(双向绑定)
 */
export module Config {
    /**
     * 游戏类型 (双向绑定 key <=> value)
     */
    export enum GameType {
        HALL = 0,       // 大厅
        ZJH = 1,        // 扎金花
        NN = 10,        // 牛牛p
        ERNN = 11,      // 二人牛牛
        MPNN = 12,      // 明牌牛牛
        SSS = 20,       // 十三水
        TTZ = 30,       // 推筒子
        HHDZ = 40,      // 红黑大战
        BJL = 50,       // 百家乐
        LHD = 60,       // 龙虎斗
        FISH = 70,      // 捕鱼
        DDZ = 80,       // 斗地主
        BJ = 90,        // 21点
        BCBM = 100,     // 奔驰宝马
        BRNN = 110,     // 百人牛牛
        DZ = 120,       // 德州扑克
        PDK = 130,      // 跑得快
        LKBY = 500,     // 李逵捕鱼
        SHZ = 400,      // 水浒传
        WLZB = 413,      // 虎龙争霸
        LHDB = 410,     // 连环夺宝
        TGPD2 = 412,    // 糖果派对
        SHBY = 510,     // 深海捕鱼
        JCBY = 520,     // 金蟾捕鱼
        SSTX = 521,     // 神兽天下
        DNTG = 522,     // 大闹天宫
    }
    /**
     * 游戏中文名 (单向绑定 key => value)
     */
    export enum GameName {
        HALL = "大厅",
        ZJH = "炸金花",
        NN = "抢庄牛牛",
        ERNN = "二人牛牛牛",
        MPNN = "明牌牛牛",
        SSS = "十三水",
        TTZ = "百人推筒子",
        HHDZ = "红黑大战",
        BJL = "百家乐",
        LHD = "龙虎斗",
        FISH = "捕鱼",
        DDZ = "经典斗地主",
        BJ = "21点",
        BRNN = "百人牛牛",
        DZ = "德州扑克",
        PDK = "跑得快",
        BCBM = "奔驰宝马",
        LKBY = "李逵捕鱼",
        SHZ = "水浒传",
        WLZB = "五龙争霸",
        SHBY = "深海捕鱼",
        LHDB = "连环夺宝",
        TGPD2 = "糖果派对",
        JCBY = "金蟾捕鱼",
        SSTX = "神兽天下",
        DNTG = "大闹天宫",
    }
    export function getGameName(id: number) {
        return GameName[GameType[id]];
    }
    export var GameConfig: { [key: string]: View } = {
        "0": {
            id: 0,
            enName: "HALL",
            zhName: "大厅",
            resDir: ["Hall", "Common"],
            prefabUrl: "Hall/HallDialog",
        },
        "1": {
            id: 1,
            enName: "ZJH",
            zhName: "扎金花",
            resDir: ["Game/ZhaJinHua"],
            prefabUrl: "Game/ZhaJinHua/UIPrefabs/ZhaJinHuaDialog",
        },
        "10": {
            id: 10,
            enName: "NN",
            zhName: "牛牛",
            resDir: ["Niuniu", "GameCommon/Cards", "GameCommon/cuoPaiCards"],
            prefabUrl: "Niuniu/NNMainDialog",
        },
        "11": {
            id: 11,
            enName: "ERNN",
            zhName: "二人牛牛",
            resDir: ["ErRenNiuniu", "GameCommon/Cards", "GameCommon/cuoPaiCards"],
            prefabUrl: "ErRenNiuniu/ERNNMainDialog",
        },
        "12": {
            id: 12,
            enName: "MPNN",
            zhName: "明牌牛牛",
            resDir: ["MingPaiNiuniu", "GameCommon/Cards", "GameCommon/cuoPaiCards"],
            prefabUrl: "MingPaiNiuniu/MPNNMainDialog",
        },
        "20": {
            id: 20,
            enName: "SSS",
            zhName: "十三水",
            resDir: ["ThirteenWater"],
            prefabUrl: "ThirteenWater/TWMainDialog",
        },
        "30": {
            id: 30,
            enName: "TTZ",
            zhName: "推筒子",
            resDir: ["TuiTongZi"],
            prefabUrl: "TuiTongZi/TTZMainDialog",
        },
        "40": {
            id: 40,
            enName: "HHDZ",
            zhName: "红黑大战",
            resDir: ["HongHeiDaZhan"],
            prefabUrl: "HongHeiDaZhan/HHDZMainDialog",
        },
        "50": {
            id: 50,
            enName: "BJL",
            zhName: "百家乐",
            resDir: ["BaiJiaLe"],
            prefabUrl: "BaiJiaLe/BJLMainDialog",
        },
        "60": {
            id: 60,
            enName: "LHD",
            zhName: "龙虎斗",
            resDir: ["LongHuDou"],
            prefabUrl: "LongHuDou/LHDMainDialog",
        },
        "70": {
            id: 70,
            enName: "FISH",
            zhName: "捕鱼",
            resDir: ["Fish"],
            prefabUrl: "Fish/FishMainDialog",
        },
        "80": {
            id: 80,
            enName: "DDZ",
            zhName: "斗地主",
            resDir: ["Game/DDZ"],
            prefabUrl: "Game/DDZ/DDZMainDialog",
        },
        "90": {
            id: 90,
            enName: "BJ",
            zhName: "21点",
            resDir: ["Game/BlackJack"],
            prefabUrl: "Game/BlackJack/BJMainDialog",
        },
        "100": {
            id: 100,
            enName: "BCBM",
            zhName: "奔驰宝马",
            resDir: ["BenChiBaoMa"],
            prefabUrl: "BenChiBaoMa/UIPrefabs/BCBMMainDialog",
        },
        "110": {
            id: 110,
            enName: "BRNN",
            zhName: "百人牛牛",
            resDir: ["BaiRenNiuNiu"],
            prefabUrl: "BaiRenNiuNiu/BRNNMainDialog",
        },
        "120": {
            id: 120,
            enName: "DZ",
            zhName: "德州扑克",
            resDir: ["Game/DeZhouPoker"],
            prefabUrl: "Game/DeZhouPoker/DZMainDialog",
        },
        "130": {
            id: 130,
            enName: "PDK",
            zhName: "跑得快",
            resDir: ["Game/PaoDeKuai"],
            prefabUrl: "Game/PaoDeKuai/PDKMainDialog",
        },
        "400": {
            id: 400,
            enName: "SHZ",
            zhName: "水浒传",
            resDir: ["Game/SHZ"],
            prefabUrl: "Game/SHZ/SHZMain",
        },
        "410": {
            id: 410,
            enName: "LHDB",
            zhName: "连环夺宝",
            resDir: ["Game/LHDB/"],// 仅加载 ui 目录 宝石资源采用动态加载
            prefabUrl: "Game/LHDB/ui/LHDBMain",
        },
        "412": {
            id: 412,
            enName: "TGPD2",
            zhName: "糖果派对2",
            resDir: ["Game/TGPD2/"],
            prefabUrl: "Game/TGPD2/TGPD2Main",
        },
        "413": {
            id: 413,
            enName: "WLZB",
            zhName: "五龙争霸",
            resDir: ["Game/WLZB"],
            prefabUrl: "Game/WLZB/WLZBMainDialog",
        },
        "500": {
            id: 500,
            enName: "LKBY",
            zhName: "李逵捕鱼",
            resDir: ["LiKuiBuYu"],
            prefabUrl: "LiKuiBuYu/LiKuiBuYuMainDialog",
        },
        "510": {
            id: 510,
            enName: "SHBY",
            zhName: "深海捕鱼",
            resDir: ["ShenHaiBuYu"],
            prefabUrl: "ShenHaiBuYu/ShenHaiBuYuMainDialog",
        },
        "520": {
            id: 520,
            enName: "JCBY",
            zhName: "金蟾捕鱼",
            resDir: ["JinChanBuYu"],
            prefabUrl: "JinChanBuYu/JinChanBuYuMainDialog",
        },
        "521": {
            id: 521,
            enName: "SSTX",
            zhName: "神兽天下",
            resDir: ["ShenShouTianXia"],
            prefabUrl: "ShenShouTianXia/ShenShouTianXiaMainDialog",
        },
        "522": {
            id: 522,
            enName: "DNTG",
            zhName: "大闹天宫",
            resDir: ["DaNaoTianGong"],
            prefabUrl: "DaNaoTianGong/DaNaoTianGongMainDialog",
        },
    }
    /**
     * 大厅界面对应的默认预制路径
     * viewName => prefabUrl
     * 具体用法在 ViewManager.open 中
     */
    export let ViewConfig = {
        // 大厅子界面配置
        "Bind": "HallDynamic/Bind",
        "Recharge": "HallDynamic/Recharge",
        "RealName": "HallDynamic/RealName",
        "UserCenter": "HallDynamic/UserCenter",
        "Wash": "HallDynamic/Wash",
        "SysNotice": "HallDynamic/SysNotice",
        "Sign": "HallDynamic/Sign",
        "Bank": "HallDynamic/Bank",
        "Mail": "HallDynamic/Mail",
        "Exchange": "HallDynamic/Exchange",
        "Vip": "HallDynamic/Vip",
        "LuckyWheel": "LuckyWheel/LuckyWheel",
        "Agency": "HallDynamic/Agency",
        "Rank": "HallDynamic/Rank",
        "CustomerServiceDialog": "CustomerService/CustomerServiceDialog",
        "Register": "HallDynamic/Register",
        // 其他 子界面配置

    }

    /**
     * 登入平台
     */
    export enum LoginPlatform {
        NONE = 0,
        ACCOUNT = 1,
        WEI_XIN = 2,
        MOBILE_PHONE = 3
    }
    /**
     * 支付类型
     */
    export enum PayType {
        NONE = 0,
        ALI_PAY = 1,    //支付宝
        WE_CHAT = 2,    //微信
        QQ_PAY = 3,     // qq支付
        UNION_PAY = 4   // 银联支付
    };
    /**
     * 充值类型
     */
    export enum RechargePlatform {
        NONE = 0,
        ALI = 1,        // 支付宝
        WX = 2,         // 微信
        ANXEN_PAY = 3   // 安迅通
    };
    /**
     * 权限类型
     */
    export enum UserPermissionType {
        NONE = 0,
        LOGIN_CLIENT = 0x0001,          // 登录客户端
        LOGIN_MT = 0x0002,              // 登录管理工具
        USER_MANAGER = 0x0004,          // 用户管理
        USER_SYSTEM_MANAGER = 0x0008,   // 系统管理
        EXCHANGE_MANAGER = 0x0010,      // 兑换管理
        SPREAD_MANAGER = 0x0020,        // 推广管理
        GAME_MANAGER = 0x0040,          // 游戏管理
        DATA_MANAGER = 0x0080,          // 数据统计
        GAME_CONTROL = 0x0100           // 游戏控制
    };
    /**
     * 邮件状态类型
     */
    export enum EmailStatus {
        NONE = 0,
        NOT_RECEIVE = 1,
        RECEIVED = 2
    };
    /**
     * 订单状态
     */
    export enum OrderStatus {
        WAIT_HANDLE = 0,    // 未处理
        ALREADY_HANDLE = 1  // 已处理
    };
    /**
     * 记录类型
     */
    export enum RecordType {
        NONE = 0,
        RECHARGE = 1,           // 充值记录
        WITHDRAWALS = 2,        // 提现记录
        GAME = 3,               // 游戏记录
        LOGIN = 4,              // 登录记录
        EXTRACT_COMMISSION = 5, // 提取佣金记录
        GAME_PROFIT = 6,        // 游戏抽水记录
        EXTRACT_INVENTORY = 7,  // 库存抽取记录
        ADMIN_GRANT = 8,         // 管理员赠送记录
        EXTRACT_GIVE_COMMISSION = 10,        //  佣金发放记录
    };

    export enum WithdrawCashType {
        NONE = 0,
        ALI_PAY = 1,    // 支付宝
        BANK_CARD = 2   // 银行卡
    };

}

