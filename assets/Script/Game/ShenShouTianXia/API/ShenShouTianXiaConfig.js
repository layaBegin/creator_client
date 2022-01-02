let exp = module.exports;
var ReductionFishWay = {
    NormalWay: 0,               //普通方式
    FishArrayWay: 1,            //鱼阵方式
};
//鱼类别
var FishKind = {
    FishKind1: 0,
    FishKind2: 1,
    FishKind3: 2,
    FishKind4: 3,
    FishKind5: 4,
    FishKind6: 5,
    FishKind7: 6,
    FishKind8: 7,
    FishKind9: 8,
    FishKind10: 9,
    FishKind11: 10,
    FishKind12: 11,
    FishKind13: 12,
    FishKind14: 13,
    FishKind15: 14,
    FishKind16: 15,
    FishKind17: 16,
    FishKind18: 17,
    FishKind19: 18,
    FishKind20: 19,
    AutoIncrement: 20,
    FixBomb: 21,                   //定屏炸弹
    LocalBomb: 22,                   //局部炸弹
    SuperBomb: 23,                   //全屏炸弹
    DaSanYuan: 24,                   //大三元
    DaSiXi: 25,                   //大四喜
    FishKing: 26,                   //鱼王

    FishKind42: 41,
    FishKind43: 42,
    FishKind44: 43,
    FishKind45: 44,

    Count: 31,                  //鱼类数量，
    RedFish: 28,                    // 红鱼, 红鱼只是鱼的一种属性
};
// 鱼的多边形点
let FishPolygonCollider = {
    0: [cc.v2(0, 10.2), cc.v2(-29.8, 10.7), cc.v2(-30.3, -3.8), cc.v2(14.1, -9.9), cc.v2(32.2, -0.9)],
    1: [cc.v2(-8.6, 21.2), cc.v2(-29.9, 9), cc.v2(-3.3, -22.9), cc.v2(32.6, -3.2), cc.v2(31.4, 10.1)],
    2: [cc.v2(1.5, 31.5), cc.v2(-40.3, 5), cc.v2(-10.8, -25.1), cc.v2(40.6, -13.9), cc.v2(34.3, 17.6)],
    3: [cc.v2(16, 42.3), cc.v2(-34.7, -2.7), cc.v2(11.3, -40.2), cc.v2(25.2, -30.9), cc.v2(35.7, -0.2)],
    4: [cc.v2(-21.7, 41.8), cc.v2(-38.8, 16.9), cc.v2(-22.7, -31.4), cc.v2(16.1, -34), cc.v2(41.6, 21.7), cc.v2(11, 47.8)],
    5: [cc.v2(-9.5, 61.8), cc.v2(-32.2, 40.6), cc.v2(-18.6, -40.1), cc.v2(12.7, -61.2), cc.v2(39.4, 21.7), cc.v2(26.3, 63.1)],
    6: [cc.v2(-41.4, 38.5), cc.v2(-39.7, -19.3), cc.v2(-6.7, -31.7), cc.v2(56.1, -8.5), cc.v2(55.7, 2.3), cc.v2(5.46, 8.61)],
    7: [cc.v2(-60.1, 20.4), cc.v2(-30.3, -5.9), cc.v2(18.2, -30.8), cc.v2(66.4, -2.6), cc.v2(62.6, 6.9), cc.v2(27.6, 22.3)],
    8: [cc.v2(-95.1, 16), cc.v2(-79.9, -30.6), cc.v2(-8.3, -44.2), cc.v2(32.7, -9.5), cc.v2(31.4, 10.3), cc.v2(2, 36.7)],
    9: [cc.v2(-55.5, 47.8), cc.v2(-57.4, -43.4), cc.v2(-26.7, -55.3), cc.v2(52.2, -26.4), cc.v2(68, 1.4), cc.v2(55.2, 27.5), cc.v2(-25.2, 62)],
    10: [cc.v2(-68, 5.1), cc.v2(-59.7, -25.6), cc.v2(-16.8, -61.1), cc.v2(38.8, -47.5), cc.v2(64.7, 7.9), cc.v2(63.3, 41.3), cc.v2(24.9, 60), cc.v2(-28.4, 57.9)],
    11: [cc.v2(-90.9, 52.6), cc.v2(-124.9, -12.7), cc.v2(-82.4, -2.5), cc.v2(9.3, -50.4), cc.v2(22.1, -83.5), cc.v2(71.5, -75.2), cc.v2(122.2, -7.6), cc.v2(88.4, 55.3), cc.v2(24.9, 60), cc.v2(-71.5, 18.1)],
    12: [cc.v2(28.5, 178.8), cc.v2(-23.4, 17.5), cc.v2(-107.8, -3.3), cc.v2(-26.1, -24.3), cc.v2(31.4, -178.4), cc.v2(119, 0.1)],
    13: [cc.v2(30.2, 43.3), cc.v2(-75.3, 6.7), cc.v2(-135.6, 43), cc.v2(-142.9, -41.9), cc.v2(-72.4, -20.2), cc.v2(33.1, -48.8), cc.v2(157, -2.5)],
    14: [cc.v2(36.3, 47.7), cc.v2(-75.3, 6.7), cc.v2(-153.4, 50.4), cc.v2(-159.9, -46.7), cc.v2(-77.2, -17.6), cc.v2(47.9, -5.4), cc.v2(180.1, -2.1)],
    15: [cc.v2(-21.2, 44.7), cc.v2(-104, 22.9), cc.v2(-116, 5.6), cc.v2(-102.4, -29.3), cc.v2(44.8, -52), cc.v2(111, -17), cc.v2(94.8, 25.8)],
    16: [cc.v2(10.2, 26.4), cc.v2(-113.6, -12.8), cc.v2(-170.4, 21.7), cc.v2(-151.9, -101.4), cc.v2(-114.6, -40.6), cc.v2(55.2, -40.2), cc.v2(171.5, -52.7), cc.v2(152.3, 41.9)],
    17: [cc.v2(25.4, 55.5), cc.v2(-37.1, 3.5), cc.v2(-152.2, 64.8), cc.v2(-171.3, 32.2), cc.v2(-40.5, -49.7), cc.v2(88, -121.6), cc.v2(216.4, 25), cc.v2(166.9, 105.6)],
    18: [cc.v2(82.5, 129.6), cc.v2(81.3, 21.1), cc.v2(-24.7, 49.7), cc.v2(-77.8, 4.3), cc.v2(-9.6, -35.1), cc.v2(94.1, -54.8), cc.v2(234, 0.1), cc.v2(162., 136)],
    19: [cc.v2(193.6, -78.6), cc.v2(170.6, 30.9), cc.v2(-4.1, 37), cc.v2(-185.8, -61.9), cc.v2(62.1, -127.4)],
    20: [cc.v2(182.8, 12.9), cc.v2(-274.6, 14.4), cc.v2(-288.9, -153.4), cc.v2(319.1, -153.4), cc.v2(327.7, -6435)],
    21: [cc.v2(39.9, -63.4), cc.v2(74.5, 19), cc.v2(10.4, 79.8), cc.v2(-71, 29.2), cc.v2(-37.3, -58)],
    22: [cc.v2(39.9, -63.4), cc.v2(88, 2.1), cc.v2(37.5, 70.5), cc.v2(-89.7, 45.3), cc.v2(-91.5, -43.6)],
    23: [cc.v2(55.1, -46.4), cc.v2(88, 2.1), cc.v2(53.9, 46.2), cc.v2(-106.7, 35), cc.v2(-107.3, -32.7)],
    24: [cc.v2(162, -126.9), cc.v2(-164.8, -124), cc.v2(2.7, 171.9)],
    25: [cc.v2(129, -128.3), cc.v2(-136.2, -128.3), cc.v2(-128.5, 130.3), cc.v2(132.6, 132.9)],
    26: [cc.v2(59.5, -58), cc.v2(-51.6, -62.3), cc.v2(-53.9, 54.3), cc.v2(60.2, 56.2)],
    41: [cc.v2(106.1, -76.1), cc.v2(151.7, 16.7), cc.v2(-114.8, 92.9), cc.v2(-148.5, 53.2), cc.v2(-89.1, -100.7), cc.v2(-4.7, -118.8)],
    42: [cc.v2(95.3, -107.6), cc.v2(109.8, 45.2), cc.v2(-36.7, 60), cc.v2(-172.2, -14.2), cc.v2(-96.2, -84.3), cc.v2(-29.1, -83)],
    43: [cc.v2(207.1, -0.8), cc.v2(208.7, 19.4), cc.v2(52.2, 62.2), cc.v2(-208.8, 8), cc.v2(-104.1, -6.2), cc.v2(62.7, -57.2)],
    44: [cc.v2(112.5, 1.4), cc.v2(111.9, 33.7), cc.v2(57.9, 51.4), cc.v2(-99.8, 25.9), cc.v2(-106.3, -31.3), cc.v2(26.1, -68)],
}

exp.fishType = [
    { points: FishPolygonCollider[FishKind.FishKind1], resIndex: FishKind.FishKind1, probability: 0.5, rewardTimes: 2, frameCount: 8, moveSpeed: 90, },
    { points: FishPolygonCollider[FishKind.FishKind2], resIndex: FishKind.FishKind2, probability: 0.333, rewardTimes: 2, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind3], resIndex: FishKind.FishKind3, probability: 0.25, rewardTimes: 3, frameCount: 9, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind4], resIndex: FishKind.FishKind4, probability: 0.2, rewardTimes: 4, frameCount: 7, moveSpeed: 210 },
    { points: FishPolygonCollider[FishKind.FishKind5], resIndex: FishKind.FishKind5, probability: 0.166, rewardTimes: 5, frameCount: 14, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind6], resIndex: FishKind.FishKind6, probability: 0.142, rewardTimes: 6, frameCount: 11, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind7], resIndex: FishKind.FishKind7, probability: 0.125, rewardTimes: 7, frameCount: 8, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind8], resIndex: FishKind.FishKind8, probability: 0.1, rewardTimes: 8, frameCount: 7, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind9], resIndex: FishKind.FishKind9, probability: 0.083, rewardTimes: 9, frameCount: 9, moveSpeed: 180 },
    { points: FishPolygonCollider[FishKind.FishKind10], resIndex: FishKind.FishKind10, probability: 0.066, rewardTimes: 10, frameCount: 9, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind11], resIndex: FishKind.FishKind11, probability: 0.055, rewardTimes: 12, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind12], resIndex: FishKind.FishKind12, probability: 0.006, rewardTimes: 15, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind13], resIndex: FishKind.FishKind13, probability: 0.05, rewardTimes: 18, frameCount: 11, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind14], resIndex: FishKind.FishKind14, probability: 0.033, rewardTimes: 20, frameCount: 12, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind15], resIndex: FishKind.FishKind15, probability: 0.033, rewardTimes: 25, frameCount: 12, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind16], resIndex: FishKind.FishKind16, probability: 0.022, rewardTimes: 30, frameCount: 10, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind17], resIndex: FishKind.FishKind17, probability: 0.02, rewardTimes: 35, frameCount: 12, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind18], resIndex: FishKind.FishKind18, probability: 0.009, rewardTimes: 40, frameCount: 11, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind19], resIndex: FishKind.FishKind19, probability: 0.05, rewardTimes: 120, frameCount: 18, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind20], resIndex: FishKind.FishKind20, probability: 0.008, rewardTimes: 320, frameCount: 8, moveSpeed: 90 },

    { points: FishPolygonCollider[FishKind.AutoIncrement], resIndex: FishKind.AutoIncrement, probability: 0.007, rewardTimes: 40, frameCount: 9, moveSpeed: 90 },//自增长
    { points: FishPolygonCollider[FishKind.FixBomb], resIndex: FishKind.FixBomb, probability: 0.007, rewardTimes: 20, frameCount: 15, moveSpeed: 90 },//定屏
    { points: FishPolygonCollider[FishKind.LocalBomb], resIndex: FishKind.LocalBomb, probability: 0.05, rewardTimes: 40, frameCount: 10, moveSpeed: 60 },//局部炸弹
    { points: FishPolygonCollider[FishKind.SuperBomb], resIndex: FishKind.SuperBomb, probability: 0.033, rewardTimes: 40, frameCount: 15, moveSpeed: 60 },//全屏炸弹
    { points: FishPolygonCollider[FishKind.DaSanYuan], resIndex: FishKind.DaSanYuan, probability: 0.025, rewardTimes: 20, frameCount: 16, moveSpeed: 60 }, //大三元 
    { points: FishPolygonCollider[FishKind.DaSiXi], resIndex: FishKind.DaSiXi, probability: 0.02, rewardTimes: 20, frameCount: 15, moveSpeed: 60 },//大四喜
    { points: FishPolygonCollider[FishKind.FishKing], resIndex: FishKind.FishKing, probability: 0.014, rewardTimes: 10, frameCount: 12, moveSpeed: 60 }, //鱼王

    { points: FishPolygonCollider[FishKind.FishKind42], resIndex: FishKind.FishKind42, probability: 0.003, rewardTimes: 100, frameCount: 8, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind43], resIndex: FishKind.FishKind43, probability: 0.003, rewardTimes: 120, frameCount: 10, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind44], resIndex: FishKind.FishKind44, probability: 0.003, rewardTimes: 120, frameCount: 11, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind45], resIndex: FishKind.FishKind45, probability: 0.003, rewardTimes: 40, frameCount: 15, moveSpeed: 60 },
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