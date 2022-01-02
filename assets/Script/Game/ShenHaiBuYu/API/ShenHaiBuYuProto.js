var exp = module.exports;

// -----------------------玩家操作----------------------
exp.GAME_FIRE_NOTIFY = 301;           //玩家开火
exp.GAME_FIRE_PUSH = 401;             //开火推送

exp.GAME_CHANGE_CANNON_NOTIFY = 302;  //切换炮形态
exp.GAME_CHANGE_CANNON_PUSH = 402;  //切换炮形态推送

exp.GAME_CAPTURE_NOTIFY = 303;      //子弹碰撞到鱼了
exp.GAME_CAPTURE_PUSH = 403;    //中鱼推送

exp.GAME_LOCK_FISH_NOTIFY = 304;    //锁定鱼
exp.GAME_LOCK_FISH_PUSH = 404;      //锁定鱼 推送

exp.GAME_ROBOT_FIRE_NOTIFY = 305;     //机器人开火
exp.GAME_ROBOT_FIRE_PUSH = 405;

exp.GAME_USER_SKILLS_NOTIFY = 306;    //玩家释放技能
exp.GAME_USER_SKILLS_PUSH = 406;      //玩家释放技能推送

exp.GAME_LIKUI_TIMES_PUSH = 407;      //李逵自增倍数推送
exp.GAME_STATUS_PUSH = 408;           //场景状态切换消息
exp.GAME_TRIGFERFISH_PUSH = 409;           //发射鱼阵
exp.GAME_SWITCH_SCENE_PUSH = 410;           //背景音乐切换消息消息

exp.GAME_FIRE_FAILURE_PUSH = 411;                    //开火失败推送
//捕鱼游戏状态,  值不要乱动
var FGStatus = {
    Normal: 1,                      //正常状态
    FishArrayStatus: 2,           //鱼阵状态
    FixScreen: 4,                   //定屏状态
    ReadyFishArrayStatus: 8,     //准备鱼阵状态, 已经下发切换场景消息， 但还没有下发鱼阵消息的状态
};
var Skills = {
    skillsType1: 1,
    skillsType2: 2
};
module.exports.FGStatus = FGStatus;
module.exports.Skills = Skills;
// ----------------------游戏状态-----------------------
exp.GAME_ADD_FISH_PUSH = 320;                 //新鱼推送
exp.GAME_ADD_ROBOT_SPECIFY_PUSH = 321;        //代理推送
exp.GAME_SUOER_STATUS_PUSH = 322;        //魔能炮状态
exp.GAME_USER_SKILLS_OK_NOTIFY = 323;    //技能冷却成功
exp.GAME_USER_SKILLS_KILL_NOTIFY = 324;    //技能到期
//开火失败
exp.gameFireFailurePush = function (curBullet, cannonPowerIndex) {
    return {
        type: this.GAME_FIRE_FAILURE_PUSH,
        data: {
            curBullet: curBullet,
            cannonPowerIndex: cannonPowerIndex
        }
    }
};
//技能到期
exp.gameUserSkillsKillPush = function (skillsType) {
    return {
        type: this.GAME_USER_SKILLS_KILL_NOTIFY,
        data: {
            skillsType: skillsType
        }
    };
}
//技能冷却成功
exp.gameUserSkillsOkPush = function (skillsType) {
    return {
        type: this.GAME_USER_SKILLS_OK_NOTIFY,
        data: {
            skillsType: skillsType
        }
    };
}
//玩家释放技能
exp.gameUserSkillsNotify = function (chairID, skillsType) {
    return {
        type: this.GAME_USER_SKILLS_NOTIFY,
        data: {
            chairID: chairID,
            skillsType: skillsType
        }
    };
};
//玩家释放技能推送
exp.gameUserSkillsPush = function (chairID, skillsType, skillsKillTime, skillsOkTime) {
    return {
        type: this.GAME_USER_SKILLS_PUSH,
        data: {
            chairID: chairID,
            skillsType: skillsType,
            skillsKillTime: skillsKillTime,
            skillsOkTime: skillsOkTime
        }
    };
};
//魔能炮状态
//SuperBulletTime: 20
//chairID: 0
//isSuperBullet: true
exp.gameSuperBulletPush = function (SuperStatus) {
    return {
        type: this.GAME_SUOER_STATUS_PUSH,
        data: {
            SuperStatus: SuperStatus
        }
    }
};
//机器人代理
exp.gameRobotSpecifyPush = function (chairIDArr) {
    return {
        type: this.GAME_ADD_ROBOT_SPECIFY_PUSH,
        data: {
            chairIDArr: chairIDArr
        }
    };
};
//发射鱼阵
//fishData.fishID 
//fishData.fishKind
//fishData.invalid 
exp.gameTriggerFishPush = function (fishArrayKind, randseek, fishData, TriggerFishtime) {
    return {
        type: this.GAME_TRIGFERFISH_PUSH,
        data: {
            fishArrayKind: fishArrayKind,
            randseek: randseek,
            fishData: fishData,
            TriggerFishtime: TriggerFishtime
        }
    };
};
//背景音乐切换消息消息
exp.gameSwitchScenePush = function (bgIndex, bgmIndex) {
    return {
        type: this.GAME_SWITCH_SCENE_PUSH,
        data: {
            bgIndex: bgIndex,
            bgmIndex: bgmIndex
        }
    };
};
//场景状态切换消息
exp.gameStatusPush = function (gameStatus) {
    return {
        type: this.GAME_STATUS_PUSH,
        data: {
            gameStatus: gameStatus
        }
    };
};
//李逵自增倍数推送
exp.gameLikuiFishPush = function (likuitimes) {
    return {
        type: this.GAME_LIKUI_TIMES_PUSH,
        data: {
            likuirewardTimes: likuitimes
        }
    };
};
exp.gameFireNotify = function (rote, curBullet) {
    return {
        type: this.GAME_FIRE_NOTIFY,
        data: {
            rote: rote,
            curBullet: curBullet
        }
    };
};

// Bulletdate = {
//   BulletID: this.curBullet++,
//   rote: data.rote,
//   bulletGoldCount: bulletGoldCount,
//   chairID: chairID,
//   createTime: Date.now()
// }
exp.gameFirePush = function (chairID, Bulletdate) {
    return {
        type: this.GAME_FIRE_PUSH,
        data: {
            Bulletdate: Bulletdate,
            chairID: chairID
        }
    };
};

exp.gameChangeCannonNotify = function (powerIndex) {
    return {
        type: this.GAME_CHANGE_CANNON_NOTIFY,
        data: {
            powerIndex: powerIndex
        }
    };
};

exp.gameChangeCannonPush = function (chairID, powerIndex) {
    return {
        type: this.GAME_CHANGE_CANNON_PUSH,
        data: {
            chairID: chairID,
            powerIndex: powerIndex
        }
    };
};
//子弹碰撞到鱼 子弹唯一标识 BulletID    fishArr 数组， {fishID：xxxxx，fishTypeID：yyyyyyyyy} 
exp.gameCaptureNotify = function (fishID, BulletID, fishArr) {
    return {
        type: this.GAME_CAPTURE_NOTIFY,
        data: {
            fishID: fishID,
            BulletID: BulletID,
            fishArr: fishArr
        }
    };
};
//击中鱼啦 数组 {fishID：xxxxx}
exp.gameCapturePush = function (chairID, fishID, gainGold, killfishArr, curWinGold) {
    return {
        type: this.GAME_CAPTURE_PUSH,
        data: {
            fishID: fishID,
            chairID: chairID,
            gainGold: gainGold,
            curWinGold: curWinGold,
            killfishArr: killfishArr
        }
    };
};
//新生产的鱼
exp.gameAddFishPush = function (fishArr) {
    return {
        type: this.GAME_ADD_FISH_PUSH,
        data: {
            fishArr: fishArr
        }
    };
};
//锁定鱼
exp.gameLockFishNotify = function (fishID, chairID) {
    return {
        type: this.GAME_LOCK_FISH_NOTIFY,
        data: {
            fishID: fishID,
            chairID: chairID
        }
    };
};
//锁定鱼推送
exp.gameLockFishPush = function (chairID, fishID) {
    return {
        type: this.GAME_LOCK_FISH_PUSH,
        data: {
            chairID: chairID,
            fishID: fishID
        }
    };
};

exp.gameRobotFireNotify = function (chairIDArr, roteArr) {
    return {
        type: this.GAME_ROBOT_FIRE_NOTIFY,
        data: {
            chairIDArr: chairIDArr,
            roteArr: roteArr
        }
    };
};
