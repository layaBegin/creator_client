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
    FixBomb: 21,
    LocalBomb: 22,
    SuperBomb: 23,
    DaSanYuan: 24,
    DaSiXi: 25,
    FishKing: 26,

    Count: 27,                  //鱼类数量，
    RedFish: 28,                    // 红鱼, 红鱼只是鱼的一种属性
};
// 鱼的多边形点
let FishPolygonCollider = {
    0: [cc.v2(-42.3, -10.9), cc.v2(42.7, -21.2), cc.v2(42.2, 20.9), cc.v2(-42.4, 10.6)],
    1: [cc.v2(30.7, 24.6), cc.v2(-28.8, 7.4), cc.v2(-28.8, -10.7), cc.v2(31, -21.9)],
    2: [cc.v2(39, 19.6), cc.v2(-32.9, 21.4), cc.v2(-33.4, -17.8), cc.v2(35.5, -20.7)],
    3: [cc.v2(40.6, -40.9), cc.v2(40.9, 42.9), cc.v2(-40.7, 32.9), cc.v2(-43.1, -33.8)],
    4: [cc.v2(40.6, -40.9), cc.v2(40.2, 32.3), cc.v2(-29, 33.4), cc.v2(-41.9, -28.1)],
    5: [cc.v2(32.3, -17.7), cc.v2(34.3, 19.2), cc.v2(-24, 17.8), cc.v2(-25.6, -15.5)],
    6: [cc.v2(45.6, 1.3), cc.v2(29.9, 43), cc.v2(-43.3, 11.6), cc.v2(-8.4, -20.5), cc.v2(9.9, -24.8), cc.v2(18, -48.6), cc.v2(29.2, -48.2), cc.v2(28.3, -22.5)],
    7: [cc.v2(26.3, 30), cc.v2(2.9, 54.9), cc.v2(-22.3, 30.4), cc.v2(-24.5, -45), cc.v2(-16.1, -45.1), cc.v2(0.9, -0.6), cc.v2(21.8, -48), cc.v2(29.3, -45.3)],
    8: [cc.v2(39.6, 29.8), cc.v2(14.8, 32.1), cc.v2(-7.5, 30.9), cc.v2(-51, -3.7), cc.v2(-28.7, -31.5), cc.v2(1.1, -29.3), cc.v2(25.3, -24.7), cc.v2(48.8, 6.2)],
    9: [cc.v2(58.4, 0.6), cc.v2(27.4, 35.3), cc.v2(26.4, 62.3), cc.v2(-40.6, 35.4), cc.v2(-48.5, 2.9), cc.v2(-42.5, -32.8), cc.v2(26.5, -61.7), cc.v2(35.7, -24.4)],
    10: [cc.v2(68.3, -1.9), cc.v2(39.3, 26.9), cc.v2(4.8, 18.5), cc.v2(-26.5, 51.5), cc.v2(-57.7, 0.4), cc.v2(-31.6, -52.1), cc.v2(6.2, -16.7), cc.v2(38.1, -27.6)],
    11: [cc.v2(126.6, 1.9), cc.v2(27.9, 26.2), cc.v2(-3.8, 46.8), cc.v2(-4.5, 46.9), cc.v2(-38.2, 17.3), cc.v2(-129.8, -2.4), cc.v2(-33.7, -13.8), cc.v2(-8.3, -47.8)],
    12: [cc.v2(99.3, 0.2), cc.v2(63.8, 63.1), cc.v2(2.8, 26.8), cc.v2(-19.7, 9), cc.v2(-78.6, -2.7), cc.v2(-25.6, -9.3), cc.v2(5.3, -30.7), cc.v2(69.4, -71.3)],
    13: [cc.v2(142.1, 4), cc.v2(119.4, 63.1), cc.v2(-12, 36.1), cc.v2(-65.6, 22.5), cc.v2(-137.6, 29.4), cc.v2(-57.7, -11.4), cc.v2(-17.5, -36.6), cc.v2(116, -54.7)],
    14: [cc.v2(106.5, 2.6), cc.v2(84.5, 46.2), cc.v2(2.5, 33), cc.v2(-35.6, -6.1), cc.v2(-108.3, -40.3), cc.v2(-41.1, -36.6), cc.v2(14.6, -40.7), cc.v2(88.4, -45.4)],
    15: [cc.v2(121.3, -27.5), cc.v2(98.7, 29.1), cc.v2(12.7, 25), cc.v2(-29.3, 133.2), cc.v2(-97.5, 104.7), cc.v2(-94, -17.3), cc.v2(-90.6, -126.5), cc.v2(34.3, -55.1)],
    16: [cc.v2(57.1, -116.3), cc.v2(58.3, -33.5), cc.v2(68.2, 21), cc.v2(49.2, 153.1), cc.v2(-30.9, 151.5), cc.v2(-56.7, 18.4), cc.v2(-47, -39.3), cc.v2(-55.3, -117)],
    17: [cc.v2(149.1, -42.6), cc.v2(235.1, -17.6), cc.v2(250.6, 31.3), cc.v2(99.1, 96), cc.v2(-46, 65.9), cc.v2(-231.9, 27.2), cc.v2(-111, -28), cc.v2(37.1, 1.9)],
    18: [cc.v2(149.1, -42.6), cc.v2(235.1, -17.6), cc.v2(250.6, 31.3), cc.v2(99.1, 96), cc.v2(-46, 65.9), cc.v2(-231.9, 27.2), cc.v2(-111, -28), cc.v2(37.1, 1.9)],
    19: [cc.v2(28.8, -92.7), cc.v2(128.1, -64.5), cc.v2(155.4, -16.3), cc.v2(130, 23.8), cc.v2(15.9, 88.9), cc.v2(-30.8, 17.2), cc.v2(-150.2, -22.8), cc.v2(-140.3, -55.8), cc.v2(-61.4, -30.5)],
    20: [cc.v2(47.9, -110.9), cc.v2(74.2, -49.5), cc.v2(46.8, 19.4), cc.v2(40.4, 112.6), cc.v2(-57.9, 97.6), cc.v2(-44.4, 14.9), cc.v2(-69.3, -53.7), cc.v2(-46.7, -106.5)],
    21: [cc.v2(-2.1, -75.2), cc.v2(75.8, -47.9), cc.v2(65, 49.5), cc.v2(-7.2, 76.1), cc.v2(-70.5, 23.1), cc.v2(-59.6, -51.3)],
    22: [cc.v2(5, -122), cc.v2(86.9, -101.8), cc.v2(77.7, 45.5), cc.v2(-0.1, 110.2), cc.v2(-76.8, 42.1), cc.v2(-86.6, -86.2)],
    23: [cc.v2(-2.9, -89.5), cc.v2(78.2, -68.5), cc.v2(77.7, 45.5), cc.v2(-0.1, 110.2), cc.v2(-76.8, 42.1), cc.v2(-79.5, -56.1)],
    24: [cc.v2(36.1, 130.1), cc.v2(-36.1, 128), cc.v2(-154.7, -127.7), cc.v2(156.1, -121.5)],
    25: [cc.v2(121.7, 124.6), cc.v2(-121.7, 122.5), cc.v2(-125, -122.8), cc.v2(123.3, -121.5)],
    26: [cc.v2(91.4, 98.5), cc.v2(-91.9, 95.2), cc.v2(-92.2, -95.5), cc.v2(96.5, -93)],
}

exp.fishType = [
    { points: FishPolygonCollider[FishKind.FishKind1], resIndex: FishKind.FishKind1, probability: 0.5, rewardTimes: 2, frameCount: 4, moveSpeed: 90, },
    { points: FishPolygonCollider[FishKind.FishKind2], resIndex: FishKind.FishKind2, probability: 0.333, rewardTimes: 2, frameCount: 9, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind3], resIndex: FishKind.FishKind3, probability: 0.25, rewardTimes: 3, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind4], resIndex: FishKind.FishKind4, probability: 0.2, rewardTimes: 4, frameCount: 8, moveSpeed: 210 },
    { points: FishPolygonCollider[FishKind.FishKind5], resIndex: FishKind.FishKind5, probability: 0.166, rewardTimes: 5, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind6], resIndex: FishKind.FishKind6, probability: 0.142, rewardTimes: 6, frameCount: 9, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind7], resIndex: FishKind.FishKind7, probability: 0.125, rewardTimes: 7, frameCount: 8, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind8], resIndex: FishKind.FishKind8, probability: 0.1, rewardTimes: 8, frameCount: 11, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind9], resIndex: FishKind.FishKind9, probability: 0.083, rewardTimes: 9, frameCount: 8, moveSpeed: 180 },
    { points: FishPolygonCollider[FishKind.FishKind10], resIndex: FishKind.FishKind10, probability: 0.066, rewardTimes: 10, frameCount: 9, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind11], resIndex: FishKind.FishKind11, probability: 0.055, rewardTimes: 12, frameCount: 9, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind12], resIndex: FishKind.FishKind12, probability: 0.006, rewardTimes: 15, frameCount: 9, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind13], resIndex: FishKind.FishKind13, probability: 0.05, rewardTimes: 18, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind14], resIndex: FishKind.FishKind14, probability: 0.033, rewardTimes: 20, frameCount: 9, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind15], resIndex: FishKind.FishKind15, probability: 0.033, rewardTimes: 25, frameCount: 8, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind16], resIndex: FishKind.FishKind16, probability: 0.022, rewardTimes: 30, frameCount: 8, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind17], resIndex: FishKind.FishKind17, probability: 0.02, rewardTimes: 35, frameCount: 11, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind18], resIndex: FishKind.FishKind18, probability: 0.009, rewardTimes: 40, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind19], resIndex: FishKind.FishKind19, probability: 0.05, rewardTimes: 120, frameCount: 8, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind20], resIndex: FishKind.FishKind20, probability: 0.008, rewardTimes: 320, frameCount: 10, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.AutoIncrement], resIndex: FishKind.AutoIncrement, probability: 0.007, rewardTimes: 10, frameCount: 10, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FixBomb], resIndex: FishKind.FixBomb, probability: 0.007, rewardTimes: 20, frameCount: 15, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.LocalBomb], resIndex: FishKind.LocalBomb, probability: 0.05, rewardTimes: 40, frameCount: 8, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.SuperBomb], resIndex: FishKind.SuperBomb, probability: 0.033, rewardTimes: 40, frameCount: 10, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.DaSanYuan], resIndex: FishKind.DaSanYuan, probability: 0.025, rewardTimes: 20, frameCount: 16, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.DaSiXi], resIndex: FishKind.DaSiXi, probability: 0.02, rewardTimes: 20, frameCount: 15, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKing], resIndex: FishKind.FishKing, probability: 0.014, rewardTimes: 10, frameCount: 12, moveSpeed: 60 },
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