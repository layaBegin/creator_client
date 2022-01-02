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
    0: [cc.v2(-33.99, 11.5), cc.v2(34.12, -9.09), cc.v2(-30.91, -6.52), cc.v2(-29.44, 6.94)],
    1: [cc.v2(26.6, 11.7), cc.v2(26.1, -0.4), cc.v2(4.9, -12.1), cc.v2(-18.3, -2.1), cc.v2(-28.5, 9.7)],
    2: [cc.v2(-11.8, 25.5), cc.v2(39.4, 6.5), cc.v2(37.8, -8.1), cc.v2(9.6, -23.4), cc.v2(-40.8, 2.4)],
    3: [cc.v2(-52.6, 5.3), cc.v2(40.4, 28.2), cc.v2(51.9, -29.8), cc.v2(30.1, -31.9), cc.v2(10, -14.8)],
    4: [cc.v2(-52.4, 20.5), cc.v2(24.9, 22), cc.v2(63.4, -9.8), cc.v2(24.4, -22.5), cc.v2(-27, -12.5)],
    5: [cc.v2(-12.9, 35.7), cc.v2(22.1, 29.8), cc.v2(52.8, 6.5), cc.v2(49.7, -11.4), cc.v2(21.1, -20.6), cc.v2(8.1, -38.1), cc.v2(-51.6, -3.8)],
    6: [cc.v2(2.7, 20.1), cc.v2(36, 24.6), cc.v2(59.9, 10.6), cc.v2(57.3, -12.5), cc.v2(37.5, -27.3), cc.v2(3.5, -22.1), cc.v2(-57.6, -4.2)],
    7: [cc.v2(15.9, 36.3), cc.v2(43.4, 32.8), cc.v2(64.8, 13.3), cc.v2(64.2, -5.9), cc.v2(30.6, -14.4), cc.v2(11.8, -32.8), cc.v2(4.8, -12.6), cc.v2(-50.2, 0.1)],
    8: [cc.v2(-34.3, 20.4), cc.v2(-4.2, 28.6), cc.v2(14.1, 14.6), cc.v2(17.2, -0.1), cc.v2(9.4, -24.1), cc.v2(-28.4, -26.2), cc.v2(-57.3, -16.3), cc.v2(-100.1, 12)],
    9: [cc.v2(10, 47.2), cc.v2(46.5, 30.7), cc.v2(68, 9.6), cc.v2(66.8, -8.2), cc.v2(47.8, -26), cc.v2(1.2, -45.9), cc.v2(-62, -48.8), cc.v2(-62, 48.2)],
    10: [cc.v2(-53.1, 41), cc.v2(51.2, 16.9), cc.v2(96.7, -10.7), cc.v2(28.4, -39.4), cc.v2(-32.4, -22.2), cc.v2(-11.2, 6.2), cc.v2(-54.2, 34.8), cc.v2(-92.3, 35.4)],
    11: [cc.v2(33.1, 76.5), cc.v2(51.8, 70.6), cc.v2(81.4, 1.2), cc.v2(61.8, -42.5), cc.v2(45.6, -81.5), cc.v2(12.3, -76.2), cc.v2(-30.8, -49.8), cc.v2(-39.9, 41)],
    12: [cc.v2(42.5, 25.9), cc.v2(93, 26), cc.v2(112.3, 2.8), cc.v2(96.4, -19.7), cc.v2(58.7, -35.3), cc.v2(6.7, -15.4), cc.v2(-36.1, -40.4), cc.v2(-117.6, 2.8), cc.v2(-43.6, 44.9), cc.v2(5.4, 11.3)],
    13: [cc.v2(48.4, 45.8), cc.v2(95.9, 7.9), cc.v2(142.9, 1.3), cc.v2(43, -21.6), cc.v2(16.7, -44.5), cc.v2(14, -20.9), cc.v2(-102.4, -4.3), cc.v2(-135.3, 31.1), cc.v2(-81.6, 16.2), cc.v2(-17.8, 37.5)],
    14: [cc.v2(45.4, 128.5), cc.v2(82, 38.4), cc.v2(112, 5.2), cc.v2(80.9, -21.2), cc.v2(44.9, -129.1), cc.v2(-48.5, -8.1), cc.v2(-102.1, 12.3), cc.v2(-43, 17.7)],
    15: [cc.v2(-35.1, 25.3), cc.v2(128.6, 54.5), cc.v2(152.9, 6.1), cc.v2(130.5, -50.8), cc.v2(-144.4, 30.3)],
    16: [cc.v2(-35.1, 25.3), cc.v2(128.6, 54.5), cc.v2(152.9, 6.1), cc.v2(130.5, -50.8), cc.v2(-144.4, 30.3)],
    17: [cc.v2(-183.8, -0.2), cc.v2(197.2, 69.1), cc.v2(270.7, 2.5), cc.v2(190, -83)],
    18: [cc.v2(-183.8, -0.2), cc.v2(197.2, 69.1), cc.v2(270.7, 2.5), cc.v2(190, -83)],
    19: [cc.v2(-150.8, 40.7), cc.v2(-17.3, 96.4), cc.v2(148.6, 83.1), cc.v2(226.3, -17.4), cc.v2(40.1, -118.8), cc.v2(23.9, -61.3), cc.v2(-90, -15), cc.v2(-205.9, -66.7)],
    20: [cc.v2(-48.3, -124.2), cc.v2(-136.3, 1.9), cc.v2(-53.2, 122.3), cc.v2(104.8, 98.8), cc.v2(118, 4.8), cc.v2(112.5, -95.9)],
    21: [cc.v2(86.5, -44.6), cc.v2(-84, -41.1), cc.v2(-83.4, 44.1), cc.v2(88.3, 49.3)],
    22: [cc.v2(72.6, -95.1), cc.v2(-56.7, -60.2), cc.v2(-76.1, 6.7), cc.v2(-43.3, 70.7), cc.v2(74.8, 75.4)],
    23: [cc.v2(63.1, -36.3), cc.v2(3.7, -68.1), cc.v2(-55.4, -51.1), cc.v2(-65.2, 30.6), cc.v2(-0.2, 68.1), cc.v2(60.4, 34.9)],
    24: [cc.v2(-49.8, 147.7), cc.v2(51, 142.6), cc.v2(189.9, -142.8), cc.v2(-190.2, -147.8)],
    25: [cc.v2(-147.5, 145.3), cc.v2(147.5, 145.6), cc.v2(145, -147.7), cc.v2(-146.5, -147.2)],
    26: [cc.v2(-74.7, 75.5), cc.v2(78.3, 75.2), cc.v2(77, -79.7), cc.v2(-77.3, -76.8)],

}

exp.fishType = [
    { points: FishPolygonCollider[FishKind.FishKind1], resIndex: FishKind.FishKind1, probability: 0.5, rewardTimes: 2, frameCount: 12, moveSpeed: 90, },
    { points: FishPolygonCollider[FishKind.FishKind2], resIndex: FishKind.FishKind2, probability: 0.333, rewardTimes: 2, frameCount: 16, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind3], resIndex: FishKind.FishKind3, probability: 0.25, rewardTimes: 3, frameCount: 24, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind4], resIndex: FishKind.FishKind4, probability: 0.2, rewardTimes: 4, frameCount: 24, moveSpeed: 210 },
    { points: FishPolygonCollider[FishKind.FishKind5], resIndex: FishKind.FishKind5, probability: 0.166, rewardTimes: 5, frameCount: 24, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind6], resIndex: FishKind.FishKind6, probability: 0.142, rewardTimes: 6, frameCount: 25, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind7], resIndex: FishKind.FishKind7, probability: 0.125, rewardTimes: 7, frameCount: 60, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind8], resIndex: FishKind.FishKind8, probability: 0.1, rewardTimes: 8, frameCount: 20, moveSpeed: 60 },
    { points: FishPolygonCollider[FishKind.FishKind9], resIndex: FishKind.FishKind9, probability: 0.083, rewardTimes: 9, frameCount: 23, moveSpeed: 180 },
    { points: FishPolygonCollider[FishKind.FishKind10], resIndex: FishKind.FishKind10, probability: 0.066, rewardTimes: 10, frameCount: 16, moveSpeed: 150 },
    { points: FishPolygonCollider[FishKind.FishKind11], resIndex: FishKind.FishKind11, probability: 0.055, rewardTimes: 12, frameCount: 24, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind12], resIndex: FishKind.FishKind12, probability: 0.006, rewardTimes: 15, frameCount: 12, moveSpeed: 90 },
    { points: FishPolygonCollider[FishKind.FishKind13], resIndex: FishKind.FishKind13, probability: 0.05, rewardTimes: 18, frameCount: 24, moveSpeed: 90 },  //胖头鱼
    { points: FishPolygonCollider[FishKind.FishKind14], resIndex: FishKind.FishKind14, probability: 0.033, rewardTimes: 20, frameCount: 20, moveSpeed: 90 },//金枪鱼
    { points: FishPolygonCollider[FishKind.FishKind15], resIndex: FishKind.FishKind15, probability: 0.033, rewardTimes: 25, frameCount: 24, moveSpeed: 60 },//魔鬼鱼
    { points: FishPolygonCollider[FishKind.FishKind16], resIndex: FishKind.FishKind16, probability: 0.022, rewardTimes: 30, frameCount: 24, moveSpeed: 60 },//灰鲨
    { points: FishPolygonCollider[FishKind.FishKind17], resIndex: FishKind.FishKind17, probability: 0.02, rewardTimes: 35, frameCount: 24, moveSpeed: 60 },//金龙鱼
    { points: FishPolygonCollider[FishKind.FishKind18], resIndex: FishKind.FishKind18, probability: 0.009, rewardTimes: 40, frameCount: 16, moveSpeed: 90 },//蓝鳐鱼
    { points: FishPolygonCollider[FishKind.FishKind19], resIndex: FishKind.FishKind19, probability: 0.05, rewardTimes: 120, frameCount: 16, moveSpeed: 90 },//金龙
    { points: FishPolygonCollider[FishKind.FishKind20], resIndex: FishKind.FishKind20, probability: 0.008, rewardTimes: 320, frameCount: 20, moveSpeed: 90 }, //双头企鹅

    { points: FishPolygonCollider[FishKind.AutoIncrement], resIndex: FishKind.AutoIncrement, probability: 0.007, rewardTimes: 40, frameCount: 4, moveSpeed: 90 },//李逵
    { points: FishPolygonCollider[FishKind.FixBomb], resIndex: FishKind.FixBomb, probability: 0.007, rewardTimes: 20, frameCount: 6, moveSpeed: 90 },//定屏
    { points: FishPolygonCollider[FishKind.LocalBomb], resIndex: FishKind.LocalBomb, probability: 0.05, rewardTimes: 40, frameCount: 6, moveSpeed: 60 },//局部炸弹
    { points: FishPolygonCollider[FishKind.SuperBomb], resIndex: FishKind.SuperBomb, probability: 0.033, rewardTimes: 40, frameCount: 6, moveSpeed: 60 },//全屏炸弹
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