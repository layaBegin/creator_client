let exp = module.exports;

exp.fishType = [
    {resIndex: 1, probability: 0.5, rewardTimes: 2, frameCount: 10, moveSpeed: 1.5},
    {resIndex: 2, probability: 0.333, rewardTimes: 3, frameCount: 12, moveSpeed: 1.5},
    {resIndex: 3, probability: 0.25, rewardTimes: 4, frameCount: 10, moveSpeed: 1.5},
    {resIndex: 4, probability: 0.2, rewardTimes: 5, frameCount: 9, moveSpeed: 1.3},
    {resIndex: 5, probability: 0.166, rewardTimes: 6, frameCount: 12, moveSpeed: 1.3},
    {resIndex: 6, probability: 0.142, rewardTimes: 7, frameCount: 12, moveSpeed: 1.2},
    {resIndex: 7, probability: 0.125, rewardTimes: 8, frameCount: 13, moveSpeed: 1.2},
    {resIndex: 8, probability: 0.1, rewardTimes: 10, frameCount: 12, moveSpeed: 1.2},
    {resIndex: 9, probability: 0.083, rewardTimes: 12, frameCount: 14, moveSpeed: 1.1},
    {resIndex: 10, probability: 0.066, rewardTimes: 15, frameCount: 12, moveSpeed: 1.1},
    {resIndex: 11, probability: 0.055, rewardTimes: 18, frameCount: 16, moveSpeed: 1},
    {resIndex: 33, probability: 0.05, rewardTimes: 20, frameCount: 13, moveSpeed: 1},
    {resIndex: 13, probability: 0.05, rewardTimes: 20, frameCount: 10, moveSpeed: 1},
    {resIndex: 19, probability: 0.05, rewardTimes: 20, frameCount: 12, moveSpeed: 0.9},
    {resIndex: 37, probability: 0.033, rewardTimes: 30, frameCount: 10, moveSpeed: 0.9},
    {resIndex: 14, probability: 0.033, rewardTimes: 30, frameCount: 12, moveSpeed: 0.9},
    {resIndex: 15, probability: 0.033, rewardTimes: 30, frameCount: 12, moveSpeed: 0.9},
    {resIndex: 41, probability: 0.025, rewardTimes: 40, frameCount: 16, moveSpeed: 0.8, fixedRotation: true, fixedDir: false},
    {resIndex: 16, probability: 0.022, rewardTimes: 45, frameCount: 15, moveSpeed: 0.8},
    {resIndex: 17, probability: 0.02, rewardTimes: 50, frameCount: 13, moveSpeed: 0.8},
    {resIndex: 38, probability: 0.02, rewardTimes: 50, frameCount: 15, moveSpeed: 0.8},
    {resIndex: 39, probability: 0.014, rewardTimes: 70, frameCount: 12, moveSpeed: 0.8},
    {resIndex: 18, probability: 0.009, rewardTimes: 110, frameCount: 12, moveSpeed: 0.8},
    {resIndex: 20, probability: 0.008, rewardTimes: 120, frameCount: 12, moveSpeed: 0.7},
    {resIndex: 21, probability: 0.007, rewardTimes: 130, frameCount: 12, moveSpeed: 0.7},
    {resIndex: 22, probability: 0.007, rewardTimes: 140, frameCount: 12, moveSpeed: 0.7},
    {resIndex: 12, probability: 0.006, rewardTimes: 150, frameCount: 15, moveSpeed: 0.7},

    {resIndex: 30, probability: 0.003, rewardTimes: 300, frameCount: 12, moveSpeed: 0.5, boss: true, fixedRotation: true, fixedDir: true},
];

exp.createFishRange = {x: 900, y: 500};