let exp = module.exports;
var ReductionFishWay = {
    NormalWay: 0,               //普通方式
    FishArrayWay: 1,            //鱼阵方式
};
//鱼类别
var FishKind = {
    FishKind1: 0,               //小黄鱼
    FishKind2: 1,               //小绿鱼
    FishKind3: 2,              //中黄鱼
    FishKind4: 3,               //鼓鱼眼
    FishKind5: 4,               //难看的鱼
    FishKind6: 5,               //好看的鱼
    FishKind7: 6,                   //肚皮鱼
    FishKind8: 7,                  //蓝鱼
    FishKind9: 8,                   //灯笼
    FishKind10: 9,                  //乌龟
    FishKind11: 10,                 //难看鱼进化
    FishKind12: 11,                 //蝴蝶
    FishKind13: 12,                 //裙子鱼
    FishKind14: 13,                 //尖枪鱼
    FishKind15: 14,                 //魔鬼鱼
    FishKind16: 15,                 //银鲨鱼
    FishKind17: 16,                 //金鲨鱼
    FishKind18: 17,                   //金鲸
    FishKind19: 18,                   //金龙
    FishKind20: 19,                   //双头企鹅
    AutoIncrement: 20,                   //自增长李逵
    FixBomb: 21,                   //定屏炸弹
    LocalBomb: 22,                   //局部炸弹
    SuperBomb: 23,                   //全屏炸弹
    DaSanYuan: 24,                   //大三元
    DaSiXi: 25,                   //大四喜
    FishKing: 26,                   //鱼王
    FishKind42: 41,                 //蝎子
    FishKind43: 42,                 //飞马
    FishKind44: 43,                 //鳄鱼
    FishKind45: 44,                   //海象

    Count: 31,                  //鱼类数量，
    RedFish: 28,                    // 红鱼, 红鱼只是鱼的一种属性
};
// 鱼的多边形点
let FishPolygonCollider = {
    0: [cc.v2(-2, 28), cc.v2(16, 7), cc.v2(-6, 13), cc.v2(-39, -22), cc.v2(41, -6)],
    1: [cc.v2(15, 9), cc.v2(-14, 8), cc.v2(-44, -7), cc.v2(1, -23), cc.v2(50, -10)],
    2: [cc.v2(2, 20), cc.v2(-18, 16), cc.v2(-11, -12), cc.v2(11, -12), cc.v2(26, -6)],
    3: [cc.v2(-3, 21.5), cc.v2(-32.1, 8.7), cc.v2(-27.8, -15.5), cc.v2(37.1, -17.1), cc.v2(25.6, 14.4)],
    4: [cc.v2(16.5, 16.7), cc.v2(-40.7, -2.7), cc.v2(-0.3, -4.3), cc.v2(19.7, -14.8), cc.v2(41.5, 3)],
    5: [cc.v2(12, 31), cc.v2(-35, 13), cc.v2(-30.2, -6.4), cc.v2(17, -31), cc.v2(47.5, 5.4)],
    6: [cc.v2(-11.3, 34.2), cc.v2(-59.3, -2), cc.v2(-22.8, -23.3), cc.v2(16.5, -30.6), cc.v2(63.2, -0.3), cc.v2(34.4, 24.2)],
    7: [cc.v2(18, 27.5), cc.v2(-25.1, -2.4), cc.v2(-55, -1.5), cc.v2(-42.6, -16.5), cc.v2(-23.9, -7.3), cc.v2(45.6, -10.9), cc.v2(55, 2.5), cc.v2(45.2, 24)],
    8: [cc.v2(17.9, 12.9), cc.v2(-3.9, 23.3), cc.v2(-80, 3), cc.v2(-1.2, -21.5), cc.v2(21.4, -7.6), cc.v2(32.5, -22.7), cc.v2(58.1, -20.4), cc.v2(66.5, 7.7), cc.v2(42.8, 30.4)],
    9: [cc.v2(-5.5, 35.5), cc.v2(-51.5, 26.5), cc.v2(-46.5, -34.5), cc.v2(4.5, -39.5), cc.v2(52.5, -0.5)],
    10: [cc.v2(50.4, 45.7), cc.v2(47.4, 1.3), cc.v2(57.8, -36.2), cc.v2(-25.6, -26.7), cc.v2(-12.2, -5.1), cc.v2(-54.5, 4.2), cc.v2(-15, 4.3), cc.v2(-25.6, 29.9)],
    11: [cc.v2(-52.6, 20.1), cc.v2(-16.3, 24.2), cc.v2(60.9, 33.9), cc.v2(79.8, 20.3), cc.v2(79.2, -20.5), cc.v2(57, -37.7), cc.v2(-50, -21.2)],
    12: [cc.v2(87, 75.5), cc.v2(35, 33.5), cc.v2(67, 26.5), cc.v2(-106, 5.5), cc.v2(64, -31.5), cc.v2(35, -47.5), cc.v2(78, -76.5), cc.v2(76, -30.5), cc.v2(107, -10.5)],
    13: [cc.v2(26.9, 18), cc.v2(-123.6, -2.2), cc.v2(29.8, -22.6), cc.v2(139.5, -2.1), cc.v2(1.1, 51.6)],
    14: [cc.v2(18.6, 27.1), cc.v2(-123.2, 12.2), cc.v2(14.7, -21.9), cc.v2(24.6, -67.6), cc.v2(75.9, -24.8), cc.v2(138.2, -7.3), cc.v2(128.7, 17.9), cc.v2(83.4, 23.3), cc.v2(35.1, 66.8)],
    15: [cc.v2(29.3, 28.5), cc.v2(-72, -18), cc.v2(-139, -9), cc.v2(-108, -43), cc.v2(-68.7, -29.8), cc.v2(115, -38.7), cc.v2(137, -10)],
    16: [cc.v2(-109.5, 53.8), cc.v2(-152.2, 17.6), cc.v2(-124.4, -11.6), cc.v2(-37.8, -28.5), cc.v2(53.5, -15.5), cc.v2(64.6, -45.8), cc.v2(88.1, -12.3), cc.v2(133.5, -1.1), cc.v2(150.9, 31.6), cc.v2(62.3, 49.8)],
    17: [cc.v2(60.3, 95.4), cc.v2(19, 62), cc.v2(46, 36), cc.v2(10, 34), cc.v2(46, 9), cc.v2(-154, -8), cc.v2(48, -9), cc.v2(0, -27), cc.v2(48, -34), cc.v2(16, -59), cc.v2(57, -88), cc.v2(63, -140), cc.v2(143, -15), cc.v2(161.7, 3.2), cc.v2(97.4, 81.5), cc.v2(92.7, 111.3), cc.v2(70.7, 140.5)],
    18: [cc.v2(99.9, 55), cc.v2(104.5, 98.9), cc.v2(53.4, 87.3), cc.v2(67.2, 62.2), cc.v2(26.8, 10.1), cc.v2(30, -51), cc.v2(-131, -27), cc.v2(-142, 39), cc.v2(-152, -14), cc.v2(-135.5, -40.5), cc.v2(67, -104), cc.v2(95.3, -72.9), cc.v2(96, 7), cc.v2(158, -36), cc.v2(127.9, 15)],
    19: [cc.v2(-74.5, 197), cc.v2(15.5, 2), cc.v2(-166.2, 18.2), cc.v2(-72.1, -29.8), cc.v2(-159.7, -63.9), cc.v2(-73.6, -55.5), cc.v2(-61.3, -123), cc.v2(66.5, -155.1), cc.v2(64.1, -63.1), cc.v2(183.5, -51), cc.v2(140, -9.4), cc.v2(60.8, -0.8), cc.v2(34.5, 148.6)],
    20: [cc.v2(-3.3, 136.2), cc.v2(-98, -5), cc.v2(-66, -97.1), cc.v2(45, -98), cc.v2(64.3, 25.3)],
    21: [cc.v2(-58, 56), cc.v2(-88, 36), cc.v2(-70, -45), cc.v2(76, -49), cc.v2(93, -27), cc.v2(83, 41)],
    22: [cc.v2(-39, 118.3), cc.v2(-75.1, 70.4), cc.v2(-50.5, 21.2), cc.v2(-17.4, 9.7), cc.v2(-2, -156.8), cc.v2(14.9, 6.8), cc.v2(51.2, 21.8), cc.v2(73.1, 73.2), cc.v2(34.2, 118.8)],
    23: [cc.v2(-0.7, 87.8), cc.v2(-69, 39), cc.v2(-67.5, -51.6), cc.v2(5, -80.5), cc.v2(68.6, -53.2), cc.v2(68.8, 37.3)],
    24: [cc.v2(-68.6, 133.6), cc.v2(65.5, 135.4), cc.v2(174.7, -140), cc.v2(-173.1, -139.5)],
    25: [cc.v2(-138.1, 139.4), cc.v2(135.8, 141.9), cc.v2(138.8, -139.2), cc.v2(-137.3, -141.7)],
    26: [cc.v2(70.5, 75.6), cc.v2(73.2, -74.1), cc.v2(-71.5, -76.7), cc.v2(-72.5, 74)],
    41: [cc.v2(42.6, 17.9), cc.v2(66.5, 23.6), cc.v2(86.7, -21.3), cc.v2(81.1, -53.9), cc.v2(-5.5, -87.3), cc.v2(-55.3, -37.8), cc.v2(-81.8, 13.8), cc.v2(-82.2, 48.5), cc.v2(4.2, 70.4)],
    42: [cc.v2(-20, 48.3), cc.v2(17, 47.6), cc.v2(65.9, -35.3), cc.v2(-18.9, -118.4), cc.v2(-56.1, -32.6)],
    43: [cc.v2(79.6, -20.9), cc.v2(268.9, -57.4), cc.v2(137.5, -116), cc.v2(-252.6, -95.4), cc.v2(-243.7, 10.5), cc.v2(-108.1, 24.3), cc.v2(-89.9, 72.9), cc.v2(-27.3, 122.6)],
    44: [cc.v2(15.3, 81.7), cc.v2(63.7, 1.5), cc.v2(46.4, -82.6), cc.v2(-18.9, -102.7), cc.v2(-38.5, 39.6)],

}

exp.fishType = [
    { points: FishPolygonCollider[FishKind.FishKind1], resIndex: FishKind.FishKind1, probability: 0.5, rewardTimes: 2, frameCount: 12, moveSpeed: 90, },
    { points: FishPolygonCollider[FishKind.FishKind2], resIndex: FishKind.FishKind2, probability: 0.333, rewardTimes: 2, frameCount: 16, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind3], resIndex: FishKind.FishKind3, probability: 0.25, rewardTimes: 3, frameCount: 9, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind4], resIndex: FishKind.FishKind4, probability: 0.2, rewardTimes: 4, frameCount: 9, moveSpeed: 210 },
    { points: FishPolygonCollider[FishKind.FishKind5], resIndex: FishKind.FishKind5, probability: 0.166, rewardTimes: 5, frameCount: 12, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind6], resIndex: FishKind.FishKind6, probability: 0.142, rewardTimes: 6, frameCount: 13, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind7], resIndex: FishKind.FishKind7, probability: 0.125, rewardTimes: 7, frameCount: 24, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind8], resIndex: FishKind.FishKind8, probability: 0.1, rewardTimes: 8, frameCount: 12, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind9], resIndex: FishKind.FishKind9, probability: 0.083, rewardTimes: 9, frameCount: 23, moveSpeed: 180 },
    { points: FishPolygonCollider[FishKind.FishKind10], resIndex: FishKind.FishKind10, probability: 0.066, rewardTimes: 10, frameCount: 20, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind11], resIndex: FishKind.FishKind11, probability: 0.055, rewardTimes: 12, frameCount: 23, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind12], resIndex: FishKind.FishKind12, probability: 0.006, rewardTimes: 15, frameCount: 20, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind13], resIndex: FishKind.FishKind13, probability: 0.05, rewardTimes: 18, frameCount: 24, moveSpeed: 90 },  //胖头鱼
    { points: FishPolygonCollider[FishKind.FishKind14], resIndex: FishKind.FishKind14, probability: 0.033, rewardTimes: 20, frameCount: 13, moveSpeed: 90 },//金枪鱼
    { points: FishPolygonCollider[FishKind.FishKind15], resIndex: FishKind.FishKind15, probability: 0.033, rewardTimes: 25, frameCount: 18, moveSpeed: 60 },//魔鬼鱼
    { points: FishPolygonCollider[FishKind.FishKind16], resIndex: FishKind.FishKind16, probability: 0.022, rewardTimes: 30, frameCount: 13, moveSpeed: 60 },//灰鲨
    { points: FishPolygonCollider[FishKind.FishKind17], resIndex: FishKind.FishKind17, probability: 0.02, rewardTimes: 35, frameCount: 14, moveSpeed: 60 },//金龙鱼
    { points: FishPolygonCollider[FishKind.FishKind18], resIndex: FishKind.FishKind18, probability: 0.009, rewardTimes: 40, frameCount: 13, moveSpeed: 90 },//蓝鳐鱼
    { points: FishPolygonCollider[FishKind.FishKind19], resIndex: FishKind.FishKind19, probability: 0.05, rewardTimes: 120, frameCount: 8, moveSpeed: 90 },//金龙
    { points: FishPolygonCollider[FishKind.FishKind20], resIndex: FishKind.FishKind20, probability: 0.008, rewardTimes: 320, frameCount: 9, moveSpeed: 90 }, //双头企鹅

    { points: FishPolygonCollider[FishKind.AutoIncrement], resIndex: FishKind.AutoIncrement, probability: 0.007, rewardTimes: 40, frameCount: 10, moveSpeed: 90 },//李逵
    { points: FishPolygonCollider[FishKind.FixBomb], resIndex: FishKind.FixBomb, probability: 0.007, rewardTimes: 20, frameCount: 15, moveSpeed: 90 },//定屏
    { points: FishPolygonCollider[FishKind.LocalBomb], resIndex: FishKind.LocalBomb, probability: 0.05, rewardTimes: 40, frameCount: 6, moveSpeed: 60 },//局部炸弹
    { points: FishPolygonCollider[FishKind.SuperBomb], resIndex: FishKind.SuperBomb, probability: 0.033, rewardTimes: 40, frameCount: 11, moveSpeed: 60 },//全屏炸弹
    { points: FishPolygonCollider[FishKind.DaSanYuan], resIndex: FishKind.DaSanYuan, probability: 0.025, rewardTimes: 20, frameCount: 16, moveSpeed: 60 }, //大三元 
    { points: FishPolygonCollider[FishKind.DaSiXi], resIndex: FishKind.DaSiXi, probability: 0.02, rewardTimes: 20, frameCount: 15, moveSpeed: 60 },//大四喜
    { points: FishPolygonCollider[FishKind.FishKing], resIndex: FishKind.FishKing, probability: 0.014, rewardTimes: 10, frameCount: 12, moveSpeed: 60 }, //鱼王

    { points: FishPolygonCollider[FishKind.FishKind42], resIndex: FishKind.FishKind42, probability: 0.003, rewardTimes: 100, frameCount: 8, moveSpeed: 60 },//宝箱 
    { points: FishPolygonCollider[FishKind.FishKind43], resIndex: FishKind.FishKind43, probability: 0.003, rewardTimes: 120, frameCount: 19, moveSpeed: 60 },//黑旋风李逵2 
    { points: FishPolygonCollider[FishKind.FishKind44], resIndex: FishKind.FishKind44, probability: 0.003, rewardTimes: 120, frameCount: 15, moveSpeed: 60 },//大船 
    { points: FishPolygonCollider[FishKind.FishKind45], resIndex: FishKind.FishKind45, probability: 0.003, rewardTimes: 40, frameCount: 18, moveSpeed: 60 },//黑旋风李逵3
];

exp.createFishRange = { x: 900, y: 500 };

exp.FishTraceType = {
    Linear: 0,					//直线方式
    Bezier: 1,					//贝塞尔曲线
    CatmullRom: 2,            //多点曲线
    MultiLine: 3,                //多点直线， 直线跟直线转角部分用鱼旋转解决
    Count: 4,                  //路径种类数
};

//鱼的分类
exp.FishKindType = {
    Ordinaty: 1,                //普通鱼
    Line: 2,                    //线鱼
    Group: 3,                   //群鱼
    Circle: 4                   //圈鱼
}

module.exports.FishKind = FishKind;
module.exports.FishPolygonCollider = FishPolygonCollider;