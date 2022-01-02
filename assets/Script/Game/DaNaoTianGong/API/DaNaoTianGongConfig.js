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

    Count: 27,                  //鱼类数量，
    RedFish: 28,                    // 红鱼, 红鱼只是鱼的一种属性
};
// 鱼的多边形点
let FishPolygonCollider = {
    0: [cc.v2(-24.6, 5.2), cc.v2(28.5, 11.6), cc.v2(29.3, -11.1), cc.v2(-25.6, -10.5)],
    1: [cc.v2(-22.8, 9), cc.v2(27.5, 14.2), cc.v2(27.5, -13.4), cc.v2(-24.2, -8.8)],
    2: [cc.v2(-27.8, 8.3), cc.v2(29, 15.6), cc.v2(29.6, -14), cc.v2(-28.4, -11.5)],
    3: [cc.v2(-36.9, 0.9), cc.v2(22.7, 34.7), cc.v2(33.2, -0.2), cc.v2(22.7, -35.4)],
    4: [cc.v2(-45.8, 27), cc.v2(5.4, 18.8), cc.v2(59, 2.9), cc.v2(27.6, -13.8), cc.v2(-32.1, -12)],
    5: [cc.v2(-13, 12.2), cc.v2(41.6, 39.6), cc.v2(55.2, -1.8), cc.v2(28.3, -3.4), cc.v2(-18.3, -32.7), cc.v2(-29, -20.3)],
    6: [cc.v2(20.7, 30.6), cc.v2(48.8, 8.9), cc.v2(48.8, -7.7), cc.v2(16.7, -29), cc.v2(-22.6, -2), cc.v2(-46.8, -8.3)],
    7: [cc.v2(19.4, 29.1), cc.v2(53.3, 6.4), cc.v2(53.5, -7.9), cc.v2(17.4, -27.3), cc.v2(-35.3, -1.8), cc.v2(-56.1, -6.1)],
    8: [cc.v2(35.9, 23.4), cc.v2(58, 15.7), cc.v2(57.5, -18.9), cc.v2(29.3, -24.7), cc.v2(-35.1, -32.7), cc.v2(-58.7, -0.3), cc.v2(-35.7, 31.5)],
    9: [cc.v2(15.4, 51.6), cc.v2(50.8, 10.4), cc.v2(49.9, -12.1), cc.v2(15, -56.5), cc.v2(-50.1, -27.6), cc.v2(-49.3, 27.2)],
    10: [cc.v2(8, 44.4), cc.v2(47.9, 7.7), cc.v2(48.3, -8.7), cc.v2(7.6, -44.2), cc.v2(-54.1, -5.4), cc.v2(-89.8, -17.1)],
    11: [cc.v2(37.7, 49.4), cc.v2(102.2, 6.5), cc.v2(102, -5.9), cc.v2(38.2, -50.1), cc.v2(-76, -4.5)],
    12: [cc.v2(67.3, 85.1), cc.v2(97.8, -0.9), cc.v2(64.6, -85.5), cc.v2(-7.1, -82.7), cc.v2(-103.4, -34.4), cc.v2(-22, 71.6)],
    13: [cc.v2(-8, 64.5), cc.v2(223.5, 3.3), cc.v2(-2.2, -69.1), cc.v2(-191.7, 12.6)],
    14: [cc.v2(56.4, 83.3), cc.v2(189.5, 11.2), cc.v2(60.9, -80), cc.v2(-161.3, 9.6)],
    15: [cc.v2(56.4, 83.3), cc.v2(189.5, 11.2), cc.v2(60.9, -80), cc.v2(-161.3, 9.6)],
    16: [cc.v2(97.1, 74.2), cc.v2(249, 7.6), cc.v2(91.9, -96.4), cc.v2(-157.7, -12.2), cc.v2(-174.4, 63.7)],
    17: [cc.v2(114.7, 93.6), cc.v2(249, 4.6), cc.v2(156.3, -41.2), cc.v2(-157.7, -12.2), cc.v2(-228.4, 29.7)],
    18: [cc.v2(114.7, 93.6), cc.v2(249, 4.6), cc.v2(156.3, -41.2), cc.v2(-157.7, -12.2), cc.v2(-228.4, 29.7)],
    19: [cc.v2(148.1, -28.4), cc.v2(132.4, -62.8), cc.v2(31.8, -90.4), cc.v2(-148, -41.9), cc.v2(16.9, 86.8), cc.v2(142.4, 10.3)],
    20: [cc.v2(68, -78.8), cc.v2(54.1, -148.4), cc.v2(-86.5, -134.7), cc.v2(-2.9, 110.5)],
    21: [cc.v2(71, 2.5), cc.v2(42, -51.8), cc.v2(-19.8, -61.3), cc.v2(-63.4, -9.6), cc.v2(-39.5, 68.1), cc.v2(39.6, 66.1)],
    22: [cc.v2(68.8, -47.6), cc.v2(31.6, -80.1), cc.v2(-37.2, -77.4), cc.v2(-68.7, -37), cc.v2(-39.1, 88.1), cc.v2(44.8, 87.4)],
    23: [cc.v2(99.7, -1.5), cc.v2(23.4, -89.2), cc.v2(-37.2, -77.4), cc.v2(-96.1, -2.6), cc.v2(-3.4, 66.3)],
    24: [cc.v2(36.1, 130.1), cc.v2(-36.1, 128), cc.v2(-154.7, -127.7), cc.v2(156.1, -121.5)],
    25: [cc.v2(121.7, 124.6), cc.v2(-121.7, 122.5), cc.v2(-125, -122.8), cc.v2(123.3, -121.5)],
    26: [cc.v2(91.4, 98.5), cc.v2(-91.9, 95.2), cc.v2(-92.2, -95.5), cc.v2(96.5, -93)],

}

exp.fishType = [
    { points: FishPolygonCollider[FishKind.FishKind1], resIndex: FishKind.FishKind1, probability: 0.5, rewardTimes: 2, frameCount: 8, moveSpeed: 90, },
    { points: FishPolygonCollider[FishKind.FishKind2], resIndex: FishKind.FishKind2, probability: 0.333, rewardTimes: 2, frameCount: 6, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind3], resIndex: FishKind.FishKind3, probability: 0.25, rewardTimes: 3, frameCount: 6, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind4], resIndex: FishKind.FishKind4, probability: 0.2, rewardTimes: 4, frameCount: 10, moveSpeed: 210 },
    { points: FishPolygonCollider[FishKind.FishKind5], resIndex: FishKind.FishKind5, probability: 0.166, rewardTimes: 5, frameCount: 12, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind6], resIndex: FishKind.FishKind6, probability: 0.142, rewardTimes: 6, frameCount: 12, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind7], resIndex: FishKind.FishKind7, probability: 0.125, rewardTimes: 7, frameCount: 16, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind8], resIndex: FishKind.FishKind8, probability: 0.1, rewardTimes: 8, frameCount: 31, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind9], resIndex: FishKind.FishKind9, probability: 0.083, rewardTimes: 9, frameCount: 12, moveSpeed: 180 },
    { points: FishPolygonCollider[FishKind.FishKind10], resIndex: FishKind.FishKind10, probability: 0.066, rewardTimes: 10, frameCount: 7, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind11], resIndex: FishKind.FishKind11, probability: 0.055, rewardTimes: 12, frameCount: 10, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind12], resIndex: FishKind.FishKind12, probability: 0.006, rewardTimes: 15, frameCount: 12, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind13], resIndex: FishKind.FishKind13, probability: 0.05, rewardTimes: 18, frameCount: 10, moveSpeed: 90 },  //胖头鱼
    { points: FishPolygonCollider[FishKind.FishKind14], resIndex: FishKind.FishKind14, probability: 0.033, rewardTimes: 20, frameCount: 12, moveSpeed: 90 },//金枪鱼
    { points: FishPolygonCollider[FishKind.FishKind15], resIndex: FishKind.FishKind15, probability: 0.033, rewardTimes: 25, frameCount: 12, moveSpeed: 60 },//魔鬼鱼
    { points: FishPolygonCollider[FishKind.FishKind16], resIndex: FishKind.FishKind16, probability: 0.022, rewardTimes: 30, frameCount: 12, moveSpeed: 60 },//灰鲨
    { points: FishPolygonCollider[FishKind.FishKind17], resIndex: FishKind.FishKind17, probability: 0.02, rewardTimes: 35, frameCount: 16, moveSpeed: 60 },//金龙鱼
    { points: FishPolygonCollider[FishKind.FishKind18], resIndex: FishKind.FishKind18, probability: 0.009, rewardTimes: 40, frameCount: 8, moveSpeed: 90 },//蓝鳐鱼
    { points: FishPolygonCollider[FishKind.FishKind19], resIndex: FishKind.FishKind19, probability: 0.05, rewardTimes: 120, frameCount: 8, moveSpeed: 90 },//金龙
    { points: FishPolygonCollider[FishKind.FishKind20], resIndex: FishKind.FishKind20, probability: 0.008, rewardTimes: 320, frameCount: 10, moveSpeed: 90 }, //双头企鹅

    { points: FishPolygonCollider[FishKind.AutoIncrement], resIndex: FishKind.AutoIncrement, probability: 0.007, rewardTimes: 40, frameCount: 32, moveSpeed: 90 },//李逵
    { points: FishPolygonCollider[FishKind.FixBomb], resIndex: FishKind.FixBomb, probability: 0.007, rewardTimes: 20, frameCount: 15, moveSpeed: 90 },//定屏
    { points: FishPolygonCollider[FishKind.LocalBomb], resIndex: FishKind.LocalBomb, probability: 0.05, rewardTimes: 40, frameCount: 18, moveSpeed: 60 },//局部炸弹
    { points: FishPolygonCollider[FishKind.SuperBomb], resIndex: FishKind.SuperBomb, probability: 0.033, rewardTimes: 40, frameCount: 18, moveSpeed: 60 },//全屏炸弹
    { points: FishPolygonCollider[FishKind.DaSanYuan], resIndex: FishKind.DaSanYuan, probability: 0.025, rewardTimes: 20, frameCount: 16, moveSpeed: 60 }, //大三元 
    { points: FishPolygonCollider[FishKind.DaSiXi], resIndex: FishKind.DaSiXi, probability: 0.02, rewardTimes: 20, frameCount: 15, moveSpeed: 60 },//大四喜
    { points: FishPolygonCollider[FishKind.FishKing], resIndex: FishKind.FishKing, probability: 0.014, rewardTimes: 10, frameCount: 12, moveSpeed: 60 }, //鱼王
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