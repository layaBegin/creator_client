let roomProto = require('../../API/RoomProto');
let roomAPI = require('../../API/RoomAPI');
let gameProto = require('./API/LiKuiBuYuProto');
let utils = require("../../Shared/utils");
let fishConfig = require("./API/LiKuiBuYuConfig");


cc.Class({
    extends: cc.Component,

    properties: {
        cannonPosArr: [cc.Node],
        cannonWidgetPrefab: cc.Prefab,

        fireControlWidgetCtrl: require('FireControl'),

        effectCtrl: require("EffectControl"),

        bulletRoot: cc.Node,
        bulletWidgetPrefab: cc.Prefab,
        bulletBoom0Prefab: cc.Prefab,
        bulletBoom1Prefab: cc.Prefab,
        bulletBoom2Prefab: cc.Prefab,
        bulletBoom3Prefab: cc.Prefab,

        fishRoot: cc.Node,
        fishWidgetPrefab: cc.Prefab,

        rightMenuRoot: cc.Node,
        menuOutBtnNode: cc.Node,
        menuInBtnNode: cc.Node,
        exitBtnNode: cc.Node,
        helpBtnNode: cc.Node,
        musicBtnNode: cc.Node,
        effectBtnNode: cc.Node,

        toggleAutoFire: cc.Toggle,
        toggleLockFish: cc.Toggle,

        lightningPrefab: cc.Prefab,
        sprayPrefab: cc.Prefab,

        backBottom: cc.Node,
        backTop: cc.Node,

        backItem: cc.Node,
        boomEffect: cc.Node,

        fixEffect: cc.Node,
        snowEffect: cc.Node,

        LighntingEffect: cc.Node,

        wallRoot: cc.Node,

        waterMarkNode: cc.Node,

        leftNode: cc.Node,
        rightNode: cc.Node,

        noFireTip: cc.Node,
        noFireCountLabel: cc.Label,
    },

    onLoad() {
        // cc.log("cc.winSize.width:" + cc.winSize.width);
        //cc.log("this.wallRoot.width:" + this.wallRoot.width);
        let winSizeWidth = cc.winSize.width;
        let winSizeHeight = cc.winSize.height;
        cc.log("屏幕宽:" + winSizeWidth + ",高:" + winSizeHeight);
        let polygon = null;
        let tempWidth = 0;
        let tempHeight = 0;
        let tempPoint = null;
        let pointList = null;
        let topWall = this.wallRoot.getChildByName("top");
        if (!!topWall) {
            polygon = topWall.getComponent(cc.PolygonCollider);
            tempWidth = winSizeWidth / 2;
            tempPoint = cc.v2(0 - tempWidth, 0);
            pointList = [];
            pointList.push(tempPoint);
            tempPoint = cc.v2(tempWidth, 0);
            pointList.push(tempPoint);
            polygon.points = pointList;
        }
        let bottomWall = this.wallRoot.getChildByName("bottom");
        if (!!bottomWall) {
            polygon = bottomWall.getComponent(cc.PolygonCollider);
            tempWidth = winSizeWidth / 2;
            tempPoint = cc.v2(0 - tempWidth, 0);
            pointList = [];
            pointList.push(tempPoint);
            tempPoint = cc.v2(tempWidth, 0);
            pointList.push(tempPoint);
            polygon.points = pointList;
        }
        let leftWall = this.wallRoot.getChildByName("left");
        if (!!leftWall) {
            polygon = leftWall.getComponent(cc.PolygonCollider);
            tempHeight = winSizeHeight / 2;
            tempPoint = cc.v2(0, tempHeight);
            pointList = [];
            pointList.push(tempPoint);
            tempPoint = cc.v2(0, 0 - tempHeight);
            pointList.push(tempPoint);
            polygon.points = pointList;
        }
        let rightWall = this.wallRoot.getChildByName("right");
        if (!!rightWall) {
            polygon = rightWall.getComponent(cc.PolygonCollider);
            tempHeight = winSizeHeight / 2;
            tempPoint = cc.v2(0, tempHeight);
            pointList = [];
            pointList.push(tempPoint);
            tempPoint = cc.v2(0, 0 - tempHeight);
            pointList.push(tempPoint);
            polygon.points = pointList;
        }
    },

    start() {
        if (Global.CCHelper.isIphoneX() == true) {
            this.leftNode.getComponent(cc.Widget).left = 70;
            this.rightNode.getComponent(cc.Widget).right = 70;
        }
        this.gameInited = false;
        this.selfChairID = -1;
        this.cannonWidgetCtrlList = {};

        this.fishWidgetCtrlArr = [];

        this.lockFishCtrlArr = [null, null, null, null];
        this.baseScore = 0.01;
        this.profitPercentage = 0;
        this.isOnLockFishState = false;

        this.isRoomOwner = false;

        this.RandMax = 233280;

        this.currentState = gameProto.FGStatus.Normal;//当前状态

        this.backIndex = -1;

        this.bgmList = ["LiKuiBuYu/sound/bgm/bgm1", "LiKuiBuYu/sound/bgm/bgm2", "LiKuiBuYu/sound/bgm/bgm3", "LiKuiBuYu/sound/bgm/bgm4"];
        this.fireControlWidgetCtrl.initWidget(this.onSelfFire.bind(this), this.onSelfFace.bind(this));

        this.startCollision(true);

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        Global.MessageCallback.addListener('GAME_EVENT', this);

        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());

        this.menuOutBtnNode.active = false;
        this.menuInBtnNode.active = true;
        this.selfFireTime = 0;

    },

    onDestroy() {
        Global.MessageCallback.removeListener('RoomMessagePush', this);
        Global.MessageCallback.removeListener('GameMessagePush', this);
        Global.MessageCallback.removeListener('ReConnectSuccess', this);
        Global.MessageCallback.removeListener('GAME_EVENT', this);

        AudioMgr.stopBgMusic();

        this.startCollision(false);
    },

    messageCallbackHandler(router, msg) {
        if (router === 'RoomMessagePush') {
            if (msg.type === roomProto.USER_LEAVE_ROOM_PUSH) {
                if (msg.data.roomUserInfo.userInfo.uid === Global.Player.getPy('uid')) {
                    ViewMgr.goBackHall(Config.GameType.LKBY);
                } else {
                    this.onUserLeave(msg.data.roomUserInfo);
                    // 更新房主信息
                    // this.updateRoomOwner();
                }
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                // 初始化界面场景
                this.gameInit(msg.data.gameData, msg.data.roomUserInfoArr);
            } else if (msg.type === roomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                if (!this.gameInited) return;
                this.onUserEntry(msg.data.roomUserInfo, 0);
                this.onChangeCannonPower(msg.data.roomUserInfo.chairId, 1);

                // 更新房主信息
                // this.updateRoomOwner();
            }
        } else if (router === "GameMessagePush") {
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_FIRE_PUSH) {
                // if (msg.data.chairID === this.selfChairID) return;
                this.onUserFire(msg.data);
            } else if (msg.type === gameProto.GAME_CHANGE_CANNON_PUSH) {
                this.onChangeCannonPower(msg.data.chairID, msg.data.powerIndex);
            } else if (msg.type === gameProto.GAME_CAPTURE_PUSH) {
                this.onCapture(msg.data);
            } else if (msg.type === gameProto.GAME_LOCK_FISH_PUSH) {
                // if (msg.data.chairID === this.selfChairID) return;
                this.onUserLockFish(msg.data.chairID, msg.data.fishID);
            } else if (msg.type === gameProto.GAME_ADD_FISH_PUSH) {
                for (let i = 0; i < msg.data.fishArr.length; ++i) {
                    this.sortFish(msg.data.fishArr[i]);
                }
                if (!!this.lineFishList) {
                    this.fireLineFish(this.lineFishList);
                }
                if (!!this.circleFishList) {
                    this.fireCircleFish(this.circleFishList);
                }
            } else if (msg.type === gameProto.GAME_LIKUI_TIMES_PUSH) {
                cc.log("李逵自增长倍数:" + msg.data.likuirewardTimes);
                this.likuirewardTimes = msg.data.likuirewardTimes;
                if (!!this.autoIncrement) {
                    this.autoIncrement.showReward(msg.data.likuirewardTimes);
                }
            } else if (msg.type === gameProto.GAME_STATUS_PUSH) {
                this.updateState(msg.data.gameStatus);
            } else if (msg.type === gameProto.GAME_TRIGFERFISH_PUSH) {
                this.starteFishArr(msg.data.fishArrayKind, msg.data.randseek, msg.data.fishData);
            } else if (msg.type === gameProto.GAME_ADD_ROBOT_SPECIFY_PUSH) {
                this.updateRobot(msg.data.chairIDArr);
            } else if (msg.type === gameProto.GAME_SUOER_STATUS_PUSH) {
                this.superCannonInfo(msg.data);
            } else if (msg.type === gameProto.GAME_FIRE_FAILURE_PUSH) {
                this.fireFailure(msg.data);
            }
        } else if (router === "ReConnectSuccess") {
            ViewMgr.goBackHall(Config.GameType.LKBY);
        } else if (router === 'GAME_EVENT') {
            if (msg === cc.game.EVENT_HIDE) {
                this.gameInited = false;
            } else if (msg === cc.game.EVENT_SHOW) {
                this.onReconnection();
            }
        }
    },

    onBtnClick: function (event, params) {
        this.selfFireTime = 0;
        if (params === "exit") {
            Confirm.show("是否要退出房间？", function () {
                // 发送退出房间的请求
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Waiting.show();
            }, function () { });
        } else if (params === "autoFire") {
            if (!this.gameInited) return;
            let toggle = event.node.getComponent(cc.Toggle);
            this.onChangeAutoFire(toggle.isChecked);
        } else if (params === "lockFish") {
            if (!this.gameInited) return;
            let toggle = event.node.getComponent(cc.Toggle);
            if (this.currentState === gameProto.FGStatus.ReadyFishArrayStatus) {
                toggle.isChecked = false;
                return;
            }
            this.onChangeLockFishState(toggle.isChecked);
        } else if (params === "music") {
            Global.CCHelper.playPreSound();
            let musicVolume = cc.sys.localStorage.getItem('MusicVolume');
            let musicSpr = this.musicBtnNode.getComponent(cc.Sprite);
            if (musicVolume > 0) {
                this.musicVolumeBank = musicVolume;
                musicVolume = 0;
                Global.CCHelper.updateSpriteFrame('LiKuiBuYu/music_off_btn', musicSpr);
            } else {
                musicVolume = this.musicVolumeBank;
                if (!musicVolume) {
                    musicVolume = 1;
                    this.musicVolumeBank = musicVolume;
                }
                Global.CCHelper.updateSpriteFrame('LiKuiBuYu/music_on_btn', musicSpr);
            }
            AudioMgr.setMusicVolume(Number(musicVolume));
        } else if (params === "effect") {
            Global.CCHelper.playPreSound();
            let soundVolume = cc.sys.localStorage.getItem('SoundVolume');
            let effectSpr = this.effectBtnNode.getComponent(cc.Sprite);
            if (soundVolume > 0) {
                this.soundVolumeBank = soundVolume;
                soundVolume = 0;
                Global.CCHelper.updateSpriteFrame('LiKuiBuYu/effect_off_btn', effectSpr);
            } else {
                soundVolume = this.soundVolumeBank;
                if (!soundVolume) {
                    soundVolume = 1;
                    this.soundVolumeBank = soundVolume;
                }
                Global.CCHelper.updateSpriteFrame('LiKuiBuYu/effect_on_btn', effectSpr);
            }
            AudioMgr.setSoundVolume(Number(soundVolume));
        } else if (params === "help") {
            Global.DialogManager.createDialog("LiKuiBuYu/LiKuiBuYuHelpDialog");
        } else if (params === "menuIn") {
            this.showMenu();
        } else if (params === "menuOut") {
            this.hideMenu();
        }
    },

    //显示菜单
    showMenu() {
        this.menuOutBtnNode.active = true;
        this.menuInBtnNode.active = false;
        let moveTime = 0.2;
        let startPos = cc.v2(0, 0);

        this.exitBtnNode.stopAllActions();
        this.exitBtnNode.active = true;
        this.exitBtnNode.position = startPos;
        let exitEndPos = cc.v2(50, 140);
        this.exitBtnNode.runAction(cc.moveTo(moveTime, exitEndPos).easing(cc.easeCubicActionOut()));

        this.helpBtnNode.stopAllActions();
        this.helpBtnNode.active = true;
        this.helpBtnNode.position = startPos;
        let helpEndPos = cc.v2(120, 50);
        this.helpBtnNode.runAction(cc.moveTo(moveTime, helpEndPos).easing(cc.easeCubicActionOut()));

        let musicVolume = cc.sys.localStorage.getItem('MusicVolume');
        let musicSpr = this.musicBtnNode.getComponent(cc.Sprite);
        if (musicVolume > 0) {
            Global.CCHelper.updateSpriteFrame('LiKuiBuYu/music_on_btn', musicSpr);
        } else {
            Global.CCHelper.updateSpriteFrame('LiKuiBuYu/music_off_btn', musicSpr);
        }
        this.musicBtnNode.stopAllActions();
        this.musicBtnNode.active = true;
        this.musicBtnNode.position = startPos;
        let musicEndPos = cc.v2(120, -50);
        this.musicBtnNode.runAction(cc.moveTo(moveTime, musicEndPos).easing(cc.easeCubicActionOut()));

        let soundVolume = cc.sys.localStorage.getItem('SoundVolume');
        let effectSpr = this.effectBtnNode.getComponent(cc.Sprite);
        if (soundVolume > 0) {
            Global.CCHelper.updateSpriteFrame('LiKuiBuYu/effect_on_btn', effectSpr);
        } else {
            Global.CCHelper.updateSpriteFrame('LiKuiBuYu/effect_off_btn', effectSpr);
        }
        this.effectBtnNode.stopAllActions();
        this.effectBtnNode.active = true;
        this.effectBtnNode.position = startPos;
        let effectEndPos = cc.v2(50, -140);
        this.effectBtnNode.runAction(cc.moveTo(moveTime, effectEndPos).easing(cc.easeCubicActionOut()));
    },

    //隐藏菜单
    hideMenu() {
        this.menuOutBtnNode.active = false;
        this.menuInBtnNode.active = true;
        let moveTime = 0.2;
        let EndPos = cc.v2(0, 0);

        this.exitBtnNode.stopAllActions();
        let exitStartPos = cc.v2(50, 140);
        this.exitBtnNode.position = exitStartPos;
        this.exitBtnNode.runAction(cc.sequence(cc.moveTo(moveTime, EndPos), cc.callFunc(function () {
            this.exitBtnNode.active = false;
        }.bind(this))));

        this.helpBtnNode.stopAllActions();
        let helpStartPos = cc.v2(120, 50);
        this.helpBtnNode.position = helpStartPos;
        this.helpBtnNode.runAction(cc.sequence(cc.moveTo(moveTime, EndPos), cc.callFunc(function () {
            this.helpBtnNode.active = false;
        }.bind(this))));

        this.musicBtnNode.stopAllActions();
        let musicExitStartPos = cc.v2(120, -50);
        this.musicBtnNode.position = musicExitStartPos;
        this.musicBtnNode.runAction(cc.sequence(cc.moveTo(moveTime, EndPos), cc.callFunc(function () {
            this.musicBtnNode.active = false;
        }.bind(this))));

        this.effectBtnNode.stopAllActions();
        let effectExitStartPos = cc.v2(50, -140);
        this.effectBtnNode.position = effectExitStartPos;
        this.effectBtnNode.runAction(cc.sequence(cc.moveTo(moveTime, EndPos), cc.callFunc(function () {
            this.effectBtnNode.active = false;
        }.bind(this))));
    },

    startCollision: function (isStart) {
        let manager = cc.director.getCollisionManager();
        manager.enabled = isStart;
    },

    // 初始化游戏场景
    gameInit: function (gameData, roomUserInfoArr) {
        this.clearScene();
        this.gameInited = true;
        this.initServerTime = gameData.serverTime;
        this.baseScore = gameData.baseScore;
        this.profitPercentage = gameData.profitPercentage;
        this.userStartcurBullet = gameData.userStartcurBullet;

        let selfUid = Global.Player.getPy('uid');
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            if (roomUserInfoArr[i].userInfo.uid === selfUid) {
                this.selfChairID = roomUserInfoArr[i].chairId;
                break;
            }
        }
        if (this.selfChairID < 0) {
            console.error("game data error chairID:" + this.selfChairID);
            return;
        }
        // 初始化炮台
        for (let i = 0; i < roomUserInfoArr.length; ++i) {
            let roomUserInfo = roomUserInfoArr[i];
            this.onUserEntry(roomUserInfo, gameData.winGoldCountArr[roomUserInfo.chairId] || 0);
            this.onChangeCannonPower(roomUserInfo.chairId, gameData.cannonPowerIndexArr[roomUserInfo.chairId]);
        }

        this.currentState = gameData.fishGameStatus;
        // 初始化场景中的鱼
        if (this.currentState === gameProto.FGStatus.FishArrayStatus) {//鱼阵状态下生成鱼
            let fishArr = gameData.TriggerFishArray;//鱼的排列顺序，id列表
            if (!!fishArr) {
                let fishArrKind = gameData.fishArrayKind;
                let randSeed = gameData.randseek;
                let actionTime = (gameData.serverTime - gameData.TriggerFishtime) / 1000;
                if (fishArrKind != 1 && fishArrKind != 16) {
                    this.starteFishArr(fishArrKind, randSeed, fishArr, actionTime);
                }
            }
        } else if (this.currentState === gameProto.FGStatus.FixScreen) {
            let tempFixTime = this.initServerTime - gameData.FixScreentime;
            let fixTime = null;
            if (tempFixTime < gameData.elaspedFixScreen) {
                fixTime = tempFixTime;
            }

            for (let key in gameData.fishList) {
                if (gameData.fishList.hasOwnProperty(key)) {
                    this.addFish(gameData.fishList[key], null, true, fixTime);
                }
            }

            fixTime = gameData.elaspedFixScreen - fixTime;
            fixTime = fixTime / 1000;
            this.scheduleOnce(function () {
                this.fixScreen(true);
                let tempPos = cc.v2(0, 0);
                this.showFixEffect(tempPos, fixTime);
                this.showSnowEffect(fixTime);
            }.bind(this), 0.2);

        } else {
            for (let key in gameData.fishList) {
                if (gameData.fishList.hasOwnProperty(key)) {
                    this.addFish(gameData.fishList[key], null, true);
                }
            }
        }

        // 设置鱼锁定信息
        for (let i = 0; i < gameData.userLockFishIDArr.length; ++i) {
            let fishID = gameData.userLockFishIDArr[i];
            if (fishID >= 0) {
                for (let j = 0; j < this.fishWidgetCtrlArr.length; ++j) {
                    if (fishID === this.fishWidgetCtrlArr[j].fishID) {
                        this.onUserLockFish(i, fishID);
                    }
                }
            }
        }

        //初始化场景中的子弹
        for (let key in gameData.bulletList) {
            if (gameData.bulletList.hasOwnProperty(key)) {
                this.showSceneBullet(gameData.bulletList[key]);
            }
        }

        //设置背景
        this.bgmIndex = gameData.bgmIndex;
        if (!this.bgmIndex) {
            this.bgmIndex = 0;
        }
        AudioMgr.startPlayBgMusic(this.bgmList[this.bgmIndex]);
        this.backIndex = 0;
        this.backIndex = gameData.bgIndex;
        if (!this.backIndex) {
            this.backIndex = 0;
        }
        let backStr = "LiKuiBuYu/background/bg" + this.backIndex;
        Global.CCHelper.updateSpriteFrame(backStr, this.backItem.getComponent(cc.Sprite));

        let sprAni = this.waterMarkNode.getComponent("SpriteFrameAnimationWidgetCtrl");
        sprAni.initAnimation();
        sprAni.startAnimation(true, 1, null);

        this.setSuperCannonInfo(gameData);
    },

    //设置魔能炮信息
    setSuperCannonInfo: function (gameData) {
        if (!!gameData.SuperBulletTime) {
            this.superBulletTime = gameData.SuperBulletTime;
        }
        if (!!gameData.usersuperBullet && !!gameData.usersuperBulletTime) {
            let len = gameData.usersuperBullet.length;
            for (let i = 0; i < len; ++i) {
                if (gameData.usersuperBullet[i] === true) {
                    let superTime = this.initServerTime - gameData.usersuperBulletTime[i];
                    superTime = superTime / 1000;
                    this.cannonWidgetCtrlList[i].setSuperInfo(true, superTime);
                }
            }
        }
    },

    //更新机器人锁定鱼
    updateRobotLockFish: function () {
        if (this.currentState === gameProto.FGStatus.ReadyFishArrayStatus) {
            this.scheduleOnce(function () {
                this.updateRobotLockFish();
            }.bind(this), 5);
            return;
        }
        let len = this.fishWidgetCtrlArr.length;
        let robotLockFishCtrl = null;
        for (let i = 0; i < len; ++i) {
            if (this.fishWidgetCtrlArr[i].isInScene() != true) {
                continue;
            }
            if (this.fishWidgetCtrlArr[i].fishTypeID <= fishConfig.FishKind.FishKind12) {
                continue;
            }
            if (!robotLockFishCtrl) {
                robotLockFishCtrl = this.fishWidgetCtrlArr[i];
                continue;
            }
            if (robotLockFishCtrl.bulletNoHit) {
                continue;
            }
            if (robotLockFishCtrl.fishTypeID < this.fishWidgetCtrlArr[i].fishTypeID) {
                robotLockFishCtrl = this.fishWidgetCtrlArr[i];
            }
        }
        if (!robotLockFishCtrl || !this.robotChairArr || this.robotChairArr.length <= 0) {//如果当前没有获取到符合条件的锁定鱼,或者没有托管的机器人就三秒之后再找一次
            cc.log("没有找到合适的鱼");
        } else {
            let robotLen = this.robotChairArr.length;
            let randomIndex = Math.floor(Math.random() * robotLen);
            let chairID = this.robotChairArr[randomIndex];
            if (!this.lockFishCtrlArr[chairID]) {//没有锁定鱼
                let cannonCtrl = this.cannonWidgetCtrlList[chairID];
                if (!!cannonCtrl) {
                    roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(robotLockFishCtrl.fishID, chairID));
                }
            }
        }
        this.scheduleOnce(function () {
            this.updateRobotLockFish();
        }.bind(this), 5);
    },

    clearScene: function () {
        this.gameInited = false;

        this.selfChairID = -1;
        for (let key in this.cannonWidgetCtrlList) {
            if (this.cannonWidgetCtrlList.hasOwnProperty(key)) {
                this.cannonWidgetCtrlList[key].onClear();
            }
        }
        this.cannonWidgetCtrlList = {};

        // 清理鱼
        for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
            this.fishWidgetCtrlArr[i].onRemove();
        }
        this.fishWidgetCtrlArr = [];
        this.lockFishCtrlArr = [null, null, null, null];
        this.baseScore = 0.01;
        this.profitPercentage = 0;
        this.isOnLockFishState = false;

        this.onChangeLockFishState(false);
        this.onChangeAutoFire(false);

        this.isRoomOwner = false;

        // 清理子弹
        this.bulletRoot.removeAllChildren(true);
    },

    //更新机器人
    updateRobot: function (robotChairArr) {
        this.robotChairArr = robotChairArr;
        if (!!this.robotChairArr) {
            if (this.robotChairArr.length > 0) {
                //更新锁定鱼
                this.updateRobotLockFish();
            }
        }
    },

    //魔能炮信息
    superCannonInfo: function (data) {
        // cc.log("魔能炮数据更新:座位号[" + data.SuperStatus.chairID + "]是否魔能炮[" + data.SuperStatus.isSuperBullet + "]");
        let cannonCtrl = this.cannonWidgetCtrlList[data.SuperStatus.chairID];
        if (!!cannonCtrl) {
            cannonCtrl.setSuperInfo(data.SuperStatus.isSuperBullet, this.superBulletTime);
        }
    },

    //开火失败
    fireFailure: function (data) {
        let returnGold = data.cannonPowerIndex * this.baseScore;
        let cannotCtrl = this.cannonWidgetCtrlList[this.selfChairID];
        cannotCtrl.changeGold(returnGold, false);
    },

    onReconnection: function () {
        this.clearScene();
        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onUserEntry: function (roomUserInfo, curWinGold) {
        let posIndex = (roomUserInfo.chairId + ((this.selfChairID >= 2) ? 2 : 0)) % 4;
        let node = cc.instantiate(this.cannonWidgetPrefab);
        let ctrl = node.getComponent("CannonControl");
        ctrl.initWidget(roomUserInfo, roomUserInfo.chairId === this.selfChairID, posIndex, curWinGold, this.onSelfCannonPowerChange.bind(this));
        node.parent = this.cannonPosArr[posIndex];
        this.cannonWidgetCtrlList[roomUserInfo.chairId] = ctrl;

        this.cannonPosArr[posIndex].getChildByName('wait').active = false;
    },

    onUserLeave: function (roomUserInfo) {
        // 清理状态
        this.lockFishCtrlArr[roomUserInfo.chairId] = null;
        // 清理炮台
        let cannonCtrl = this.cannonWidgetCtrlList[roomUserInfo.chairId];
        if (!cannonCtrl) {
            console.error("onUserLeave err:cannon ctrl not find");
            return;
        }
        cannonCtrl.onLeave();
        delete this.cannonWidgetCtrlList[roomUserInfo.chairId];

        let posIndex = (roomUserInfo.chairId + ((this.selfChairID >= 2) ? 2 : 0)) % 4;
        this.cannonPosArr[posIndex].getChildByName('wait').active = true;
    },

    onChangeAutoFire: function (isStart) {
        this.toggleAutoFire.isChecked = isStart;
        if (isStart) {
            // this.onChangeLockFishState(false);
            this.fireControlWidgetCtrl.autoFire(function () {
                this.toggleAutoFire.isChecked = false;
            }.bind(this));
        } else {
            this.fireControlWidgetCtrl.stopAutoFire();
        }
    },

    onChangeLockFishState: function (isStart) {
        if (isStart) {
            // 停止自动开火
            // this.onChangeAutoFire(false);
            // 修改开火控制器状态
            this.fireControlWidgetCtrl.onChangeLockFishState(true, this.onSelectLockFish.bind(this));
        } else {
            this.toggleLockFish.isChecked = false;
            // 修改开火控制器状态
            this.fireControlWidgetCtrl.onChangeLockFishState(false);
            this.fireControlWidgetCtrl.stopLockFire();
            if (!!this.lockFishCtrlArr[this.selfChairID]) {
                // 取消锁定目标
                cc.log("[锁定鱼]告诉服务器座位号[" + this.selfChairID + "]取消锁定目标");
                roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(-1, this.selfChairID));
            }
            // 更新状态
            // this.onUserLockFish(this.selfChairID, -1);
        }
    },

    onSelectLockFish: function (targetWorldPoint) {
        if (!this.gameInited) return;
        if (this.currentState === gameProto.FGStatus.ReadyFishArrayStatus) {//准备状态下不能锁鱼
            return;
        }
        // 如果是锁定目标状态，则选择锁定目标
        let selectFishCtrl = null;
        for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
            let ctrl = this.fishWidgetCtrlArr[i];
            if (!!ctrl.fishCollider) {
                if (cc.Intersection.pointInPolygon(targetWorldPoint, ctrl.fishCollider.world.points) && ctrl.isInScene()) {
                    if (!selectFishCtrl) {
                        selectFishCtrl = ctrl;
                    } else {
                        if (ctrl.fishTypeInfo.rewardTimes > selectFishCtrl.fishTypeInfo.rewardTimes) {
                            selectFishCtrl = ctrl;
                        }
                    }
                }
            }
        }
        if (!!selectFishCtrl) {
            cc.log("[锁定鱼]告诉服务器座位号[" + this.selfChairID + "]目标鱼id[" + selectFishCtrl.fishID + "]");
            roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(selectFishCtrl.fishID, this.selfChairID));
            this.fireControlWidgetCtrl.startLockFire(selectFishCtrl);
        } else {
            this.fireControlWidgetCtrl.fireToLockFish();
        }
    },

    selectedLockFishLeaved: function (chairID) {
        if (chairID != this.selfChairID) {
            roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(-1, chairID));
            return;
        }
        cc.log("[锁定鱼]寻找需要锁定的鱼");
        let selectFishCtrl = null;
        for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
            let ctrl = this.fishWidgetCtrlArr[i];
            if (ctrl.isOutScene === true) {
                continue;
            }
            if (ctrl.isInScene()) {
                if (!selectFishCtrl) {
                    selectFishCtrl = ctrl;
                } else {
                    if (ctrl.fishTypeInfo.rewardTimes > selectFishCtrl.fishTypeInfo.rewardTimes) {
                        selectFishCtrl = ctrl;
                    }
                }
            }
        }
        if (!!selectFishCtrl) {
            cc.log("[锁定鱼]告诉服务器锁定鱼:" + selectFishCtrl.fishID);
            roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(selectFishCtrl.fishID, chairID));
            // this.onUserLockFish(chairID, selectFishCtrl.fishID);
            // if (chairID === this.selfChairID) {
            //     this.fireControlWidgetCtrl.startLockFire(selectFishCtrl);
            // }
        } else {
            cc.log("[锁定鱼]没有找到可以锁定的鱼");
            this.onChangeLockFishState(false);
        }
    },

    onUserLockFish: function (chairID, fishID) {
        if (chairID === this.selfChairID) {
            cc.log("[锁定鱼]服务器下发玩家[" + chairID + "]锁定鱼[" + fishID + "]");
            if (fishID === -1) {
                cc.log("[锁定鱼]玩家取消锁定鱼");
            }
        }

        let cannonCtrl = this.cannonWidgetCtrlList[chairID];
        if (!cannonCtrl) return;
        // 取消锁定
        if (fishID < 0) {
            if (chairID === this.selfChairID) {
                this.fireControlWidgetCtrl.stopLockFire();
            }
            // if (!!this.lockFishCtrlArr[chairID]) {
            // this.lockFishCtrlArr[chairID].listenerOutScene(false);
            // }
            this.lockFishCtrlArr[chairID] = null;
            cannonCtrl.onLockFish(null);
        } else {
            let fishCtrl = null;
            for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
                let ctrl = this.fishWidgetCtrlArr[i];
                if (ctrl.fishID === fishID) {
                    fishCtrl = ctrl;
                    break;
                }
            }
            if (!fishCtrl) {
                console.error("onUserLockFish fish not find");
                return;
            }
            cannonCtrl.onLockFish(fishCtrl);
            // if (!!this.lockFishCtrlArr[chairID]) {
            //     this.lockFishCtrlArr[chairID].listenerOutScene(false);
            // }
            this.lockFishCtrlArr[chairID] = fishCtrl;
            this.lockFishCtrlArr[chairID].listenerOutScene(true);
        }
    },

    onUserFire: function (data) {
        if (!this.gameInited) return;
        if (data.chairID === this.selfChairID) return;///玩家本人的子弹在开火的时候已经发送了
        this.onFire(data.chairID, data.Bulletdate);
    },

    onSelfFire: function (targetWorldPoint) {
        if (!this.gameInited) return;
        if (this.currentState === gameProto.FGStatus.ReadyFishArrayStatus) {//准备鱼阵阶段不能开火
            //Tip.makeText("鱼阵准备中");
            return;
        }
        let ctrl = this.cannonWidgetCtrlList[this.selfChairID];
        if (!ctrl) {
            console.error("not find ctrl");
            return;
        }
        // 计算金币是否足够
        let curGold = ctrl.getCurGold();
        if (curGold < ctrl.powerIndex * this.baseScore) {
            Confirm.show("金币不足，无法开炮");
            // 停止开炮
            this.onChangeAutoFire(false);
            this.onChangeLockFishState(false);
            return;
        }
        // 计算角度
        let mathRote = null;
        if (!!targetWorldPoint) {
            let cannonPos = this.bulletRoot.convertToNodeSpaceAR(ctrl.getCannonWorldPos());
            let targetPoint = this.bulletRoot.convertToNodeSpaceAR(targetWorldPoint);
            let unitVector = utils.getUnitVector(cannonPos, targetPoint);
            mathRote = Math.acos(unitVector.x) / Math.PI * 180;
            if (unitVector.y < 0) mathRote *= -1;
        } else {
            mathRote = ctrl.cannonRotation;
        }

        let newBulletId = this.userStartcurBullet[this.selfChairID] + 1;
        this.userStartcurBullet[this.selfChairID] = newBulletId;
        let bulletId = newBulletId * 10 + this.selfChairID;
        roomAPI.gameMessageNotify(gameProto.gameFireNotify(mathRote, bulletId));

        let bulletData = {};
        bulletData.rote = mathRote;
        let cannonCtrl = this.cannonWidgetCtrlList[this.selfChairID];
        bulletData.bulletGoldCount = cannonCtrl.bulletGold;
        bulletData.superBullet = cannonCtrl.isSuper;
        bulletData.BulletID = bulletId;
        this.onFire(this.selfChairID, bulletData);
        this.playSound('LiKuiBuYu/sound/effect/fire1', false, 0.3);
        this.fireControlWidgetCtrl.bulletCountChange(1);
        this.selfFireTime = 0;
    },

    //手指按下炮口朝向
    onSelfFace: function (fasePoint) {
        if (!this.gameInited) return;
        let ctrl = this.cannonWidgetCtrlList[this.selfChairID];
        if (!ctrl) {
            console.error("not find ctrl");
            return;
        }
        let cannonPos = this.bulletRoot.convertToNodeSpaceAR(ctrl.getCannonWorldPos());
        let targetPoint = this.bulletRoot.convertToNodeSpaceAR(fasePoint);
        let unitVector = utils.getUnitVector(cannonPos, targetPoint);
        let mathRote = Math.acos(unitVector.x) / Math.PI * 180;
        if (unitVector.y < 0) {
            mathRote *= -1;
        }
        if (ctrl.posIndex >= 2) {
            mathRote += 180;
        }
        ctrl.onFace(mathRote);
    },

    //显示场景中的子弹
    showSceneBullet: function (bulletData) {
        let ctrl = this.cannonWidgetCtrlList[bulletData.chairID];
        let cannonPos = this.bulletRoot.convertToNodeSpaceAR(ctrl.getCannonWorldPos());
        let rote = bulletData.rote;
        if (ctrl.posIndex >= 2) rote += 180;
        let node = cc.instantiate(this.bulletWidgetPrefab);
        node.parent = this.bulletRoot;
        let bulletCtrl = node.getComponent('BulletControl');

        let moveTime = this.initServerTime - bulletData.createTime;
        moveTime = moveTime / 1000;

        let level = bulletData.bulletGoldCount / this.baseScore;
        bulletCtrl.initWidget(bulletData.chairID, bulletData.BulletID, level, bulletData.superBullet, this.onBeShot.bind(this));
        bulletCtrl.emit(cannonPos, rote, this.lockFishCtrlArr[bulletData.chairID], moveTime, this.wallRoot);
    },

    playSound: function (url, loop, soundVolume) {
        if (!url || !AudioMgr.isSoundEnabled) return;
        if (AudioMgr.soundVolume == 0) {
            return;
        }
        if (loop !== true) loop = false;
        AssetMgr.loadResSync(url, function (err, clip) {
            if (!!err) {
                console.error('playSound failed:' + url);
            } else {
                cc.audioEngine.play(clip, loop, soundVolume);
            }
        });
    },

    //创建炮弹
    onFire: function (chairID, bulletdate) {
        if (!this.gameInited) return;
        let ctrl = this.cannonWidgetCtrlList[chairID];
        if (!ctrl) {
            console.error("not find ctrl");
            return;
        }
        this.playSound('LiKuiBuYu/sound/effect/fire1', false, 0.05);
        let rote = bulletdate.rote;
        if (ctrl.posIndex >= 2) rote += 180;
        if (!this.lockFishCtrlArr[chairID]) {
            ctrl.onFire(rote);
        }
        ctrl.recoilForceEffect();
        ctrl.cannonFireEffect();
        let cannonPos = this.bulletRoot.convertToNodeSpaceAR(ctrl.getCannonWorldPos());
        // 创建炮弹
        let node = cc.instantiate(this.bulletWidgetPrefab);
        node.parent = this.bulletRoot;
        let bulletCtrl = node.getComponent('BulletControl');
        let level = bulletdate.bulletGoldCount / this.baseScore;
        let isSuperBullet = false;
        if (!!bulletdate.superBullet) {
            isSuperBullet = bulletdate.superBullet;
        }
        bulletCtrl.initWidget(chairID, bulletdate.BulletID, level, isSuperBullet, this.onBeShot.bind(this));
        bulletCtrl.emit(cannonPos, rote, this.lockFishCtrlArr[chairID]);

        // 更新金币
        let changeGold = ctrl.powerIndex * this.baseScore * -1;
        ctrl.goldChange(changeGold, false);
        // 发送服务器通知
        // if (chairID === this.selfChairID) {
        //     roomAPI.gameMessageNotify(gameProto.gameFireNotify(mathRote));
        // }
    },

    onBeShot: function (bullet, fishCtrl) {
        // 移除子弹
        bullet.onShootFish();
        // this.playSound("LiKuiBuYu/sound/effect/net2", false, 0.3);
        // 播放爆炸动画
        let boomAnim = null;
        if (bullet.bulletLevel <= 3) {
            boomAnim = cc.instantiate(this.bulletBoom0Prefab);
        } else if (bullet.bulletLevel <= 5) {
            boomAnim = cc.instantiate(this.bulletBoom1Prefab);
        } else if (bullet.bulletLevel <= 8) {
            boomAnim = cc.instantiate(this.bulletBoom2Prefab);
        } else {
            boomAnim = cc.instantiate(this.bulletBoom3Prefab);
        }
        boomAnim.parent = this.LighntingEffect;
        boomAnim.position = bullet.node.position;
        let boomCtrl = boomAnim.getComponent("SpriteFrameAnimationWidgetCtrl");
        boomCtrl.initAnimation();
        boomCtrl.startAnimation(false, 1, function () {
            boomCtrl.node.destroy();
        });
        // 播放鱼被打中效果
        fishCtrl.onBeShot();
        if (bullet.ownerChairID === this.selfChairID) {
            this.fireControlWidgetCtrl.bulletCountChange(-1);
        }
        // 向服务器发送鱼被打消息
        if (bullet.ownerChairID === this.selfChairID || (!!this.robotChairArr && this.robotChairArr.indexOf(bullet.ownerChairID) != -1)) {
            let fishArr = null;
            if (fishCtrl.fishTypeID === fishConfig.FishKind.FishKing) {//击中鱼王
                fishArr = this.captureFishKing(fishCtrl.fishKind);
            } else if (fishCtrl.fishTypeID === fishConfig.FishKind.LocalBomb) {//击中局部炸弹
                fishArr = this.localBomb(fishCtrl.node.position);
            } else if (fishCtrl.fishTypeID === fishConfig.FishKind.SuperBomb) {//击中全屏炸弹
                fishArr = this.captureAllFish();
            } else if (fishCtrl.fishTypeID === fishConfig.FishKind.FixBomb) {//击中定屏炸弹
            } else if (fishCtrl.isRedFish === true) {
                fishArr = this.captureRedFish(fishCtrl.node.position, fishCtrl.fishTypeID);
            } else {
                fishArr = [];
                fishArr.push({ fishID: fishCtrl.fishID, fishTypeID: fishCtrl.fishTypeID });
            }
            roomAPI.gameMessageNotify(gameProto.gameCaptureNotify(fishCtrl.fishID, bullet.bulletId, fishArr));
        } else {
            if (this.isRoomOwner) {
                let cannonCtrl = this.cannonWidgetCtrlList[bullet.ownerChairID];
                if (!cannonCtrl) return;
                if (cannonCtrl.roomUserInfo.userInfo.robot) {
                    roomAPI.gameMessageNotify(gameProto.gameRobotCaptureNotify(cannonCtrl.roomUserInfo.chairId, fishCtrl.fishID));
                }
            }
        }
    },

    //鱼类型id换算
    changeFishTypeID: function (fishTypeID) {
        switch (fishTypeID) {
            case 27:
                fishTypeID = fishConfig.FishKind.FishKind42;
                break;
            case 28:
                fishTypeID = fishConfig.FishKind.FishKind43;
                break;
            case 29:
                fishTypeID = fishConfig.FishKind.FishKind44;
                break;
            case 30:
                fishTypeID = fishConfig.FishKind.FishKind45;
                break;
        }
        return fishTypeID;
    },

    //捕获鱼王时需要把同类型的鱼全都捕获
    captureFishKing: function (fishKind) {
        let captureFishArr = [];
        let len = this.fishWidgetCtrlArr.length;
        for (let i = 0; i < len; ++i) {
            if (!!this.fishWidgetCtrlArr[i]) {
                if (this.fishWidgetCtrlArr[i].isInScene() == false) {
                    continue;
                }
                if (this.fishWidgetCtrlArr[i].fishTypeID == fishKind) {
                    let fishItem = {};
                    fishItem.fishID = this.fishWidgetCtrlArr[i].fishID;
                    fishItem.fishTypeID = this.fishWidgetCtrlArr[i].fishTypeID;
                    captureFishArr.push(fishItem);
                    continue;
                }
                if (this.fishWidgetCtrlArr[i].fishTypeID == fishConfig.FishKind.FishKing) {
                    if (this.fishWidgetCtrlArr[i].fishKind == fishKind) {
                        let fishItem = {};
                        fishItem.fishID = this.fishWidgetCtrlArr[i].fishID;
                        let fishTypeID = this.changeFishTypeID(this.fishWidgetCtrlArr[i].fishTypeID);
                        fishItem.fishTypeID = fishTypeID;
                        captureFishArr.push(fishItem);
                    }
                }
            }
        }
        return captureFishArr;
    },

    //局部炸弹
    localBomb: function (localPos) {
        let captureFishArr = [];
        let len = this.fishWidgetCtrlArr.length;
        for (let i = 0; i < len; ++i) {
            if (!!this.fishWidgetCtrlArr[i]) {
                if (this.fishWidgetCtrlArr[i].isInScene() == false) {
                    continue;
                }
                let distance = localPos.sub(this.fishWidgetCtrlArr[i].node.position).mag();
                if (distance < 300) {
                    let fishItem = {};
                    fishItem.fishID = this.fishWidgetCtrlArr[i].fishID;
                    let fishTypeID = this.changeFishTypeID(this.fishWidgetCtrlArr[i].fishTypeID);
                    fishItem.fishTypeID = fishTypeID;
                    captureFishArr.push(fishItem);
                }
            }
        }
        return captureFishArr;
    },

    //红鱼被击中，捕获范围内同样类型的鱼
    captureRedFish: function (localPos, fishTypeID) {
        let captureFishArr = [];
        let len = this.fishWidgetCtrlArr.length;
        for (let i = 0; i < len; ++i) {
            if (!!this.fishWidgetCtrlArr[i]) {
                if (fishTypeID != this.fishWidgetCtrlArr[i].fishTypeID) {
                    continue;
                }
                if (this.fishWidgetCtrlArr[i].isInScene() == false) {
                    continue;
                }
                let distance = localPos.sub(this.fishWidgetCtrlArr[i].node.position).mag();
                if (distance < 300) {
                    let fishItem = {};
                    fishItem.fishID = this.fishWidgetCtrlArr[i].fishID;
                    let fishTypeID = this.changeFishTypeID(this.fishWidgetCtrlArr[i].fishTypeID);
                    fishItem.fishTypeID = fishTypeID;
                    captureFishArr.push(fishItem);
                }
            }
        }
        return captureFishArr;
    },

    //全屏炸弹捕获所有屏幕内的鱼
    captureAllFish: function () {
        let captureFishArr = [];
        let len = this.fishWidgetCtrlArr.length;
        for (let i = 0; i < len; ++i) {
            if (!!this.fishWidgetCtrlArr[i]) {
                if (this.fishWidgetCtrlArr[i].isInScene() == false) {
                    continue;
                }
                let fishItem = {};
                fishItem.fishID = this.fishWidgetCtrlArr[i].fishID;
                let fishTypeID = this.changeFishTypeID(this.fishWidgetCtrlArr[i].fishTypeID);
                fishItem.fishTypeID = fishTypeID;
                captureFishArr.push(fishItem);
            }
        }
        return captureFishArr;
    },

    onCapture: function (data) {
        let fishCtrl = null;
        for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
            let ctrl = this.fishWidgetCtrlArr[i];
            if (ctrl.fishID === data.fishID) {
                fishCtrl = ctrl;
                this.fishWidgetCtrlArr.splice(i, 1);
                break;
            }
        }
        if (!fishCtrl || !fishCtrl.node) {
            console.error("not find fish id:" + data.fishID);
            return;
        }
        fishCtrl.setBulletNoHit(true);
        // 播放金币动画
        let cannonCtrl = this.cannonWidgetCtrlList[data.chairID];
        if (!cannonCtrl) {
            console.error("not find chair id:" + data.chairID);
            return;
        }

        cannonCtrl.showPrize(data.gainGold, this.baseScore);
        cannonCtrl.showGoldPillar(data.gainGold, this.baseScore);
        this.effectCtrl.fishCapture(data.gainGold, fishCtrl, cannonCtrl);
        this.playSound('LiKuiBuYu/sound/effect/coin2', false, 0.3);
        let fishPos = fishCtrl.node.position;
        if (!!data.killfishArr && data.killfishArr.length > 1) {
            this.showBoomEffect(fishPos);
            this.killFishArr(data.killfishArr, fishPos);
        }
        if (fishCtrl.fishTypeID === fishConfig.FishKind.FixBomb) {//定屏炸弹特效
            this.showFixEffect(fishPos);
            this.showSnowEffect();
        }

        if (fishCtrl.fishTypeID === fishConfig.FishKind.LocalBomb || fishCtrl.fishTypeID === fishConfig.FishKind.SuperBomb
            || fishCtrl.fishTypeID === fishConfig.FishKind.FishKing || fishCtrl.isRedFish === true) {//局部全屏炸弹鱼王需要震屏
            if (fishCtrl.fishTypeID === fishConfig.FishKind.FishKing || fishCtrl.isRedFish === true) {
                this.shakeScreen(5, 5);
            } else {
                this.shakeScreen();
            }
        }

        this.playDieSound(fishCtrl.fishTypeID, fishCtrl.fishID);
        this.clearFish(fishCtrl);
    },

    //播放死亡音效
    playDieSound: function (fishTypeID, fishID) {
        if (fishTypeID === fishConfig.FishKind.LocalBomb || fishTypeID === fishConfig.FishKind.FixBomb
            || fishTypeID === fishConfig.FishKind.SuperBomb || fishTypeID === fishConfig.FishKind.FishKing) {
            if (fishID % 2 == 0) {
                this.playSound("LiKuiBuYu/sound/effect/boom", false, 0.6);
            } else {
                this.playSound("LiKuiBuYu/sound/effect/superarm", false, 0.6);
            }
            return;
        }
        if (fishTypeID <= fishConfig.FishKind.FishKind10) {
            this.playSound("LiKuiBuYu/sound/effect/" + (fishID % 2 == 0 ? "hit0" : "hit1"), false, 1);
        }
        else {
            this.playSound("LiKuiBuYu/sound/effect/" + (fishID % 2 == 0 ? "m" : "f") + (fishID % 7 + 1), false, 1);
        }
    },

    //功能性鱼被击杀 连带杀死的鱼
    killFishArr: function (fishArr, startPos) {
        if (!!fishArr) {
            let len = fishArr.length;
            for (let i = 0; i < len; ++i) {
                this.killFish(fishArr[i], startPos);
            }
        }
    },

    //创建闪电
    createLightning: function (startPos, endPos) {
        let node = cc.instantiate(this.lightningPrefab);
        let ctrl = node.getComponent("LighntingWidgetControl");
        node.parent = this.LighntingEffect;
        ctrl.setInfo(startPos, endPos);
    },

    //显示爆炸效果
    showBoomEffect: function (pos) {
        let node = cc.instantiate(this.boomEffect);
        node.position = pos;
        node.parent = this.bulletRoot;
        node.active = true;
        let particleSystem = node.getComponent(cc.ParticleSystem);
        particleSystem.resetSystem();
        particleSystem.autoRemoveOnFinish = true;
    },

    //显示定屏炸弹定特效
    showFixEffect: function (pos, fixTime) {
        let node = cc.instantiate(this.fixEffect);
        node.position = pos;
        node.parent = this.bulletRoot;
        node.active = true;
        let particleSystem = node.getComponent(cc.ParticleSystem);
        particleSystem.resetSystem();
        particleSystem.autoRemoveOnFinish = true;
        if (!!fixTime) {
            this.scheduleOnce(function () {
                particleSystem.stopSystem();
                node.destroy();
            }.bind(this), fixTime);
        }
    },

    //显示定屏炸弹雪花特效
    showSnowEffect: function (fixTime) {
        let node = cc.instantiate(this.snowEffect);
        let windowSize = cc.view.getVisibleSize();
        node.position = cc.v2(0, windowSize.height / 2);
        node.parent = this.bulletRoot;
        node.active = true;
        let particleSystem = node.getComponent(cc.ParticleSystem);
        particleSystem.resetSystem();
        particleSystem.autoRemoveOnFinish = true;
        if (!!fixTime) {
            this.scheduleOnce(function () {
                particleSystem.stopSystem();
                node.destroy();
            }.bind(this), fixTime);
        }
    },

    //杀死鱼
    killFish: function (killFishID, startPos) {
        let fishCtrl = null;
        for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
            let ctrl = this.fishWidgetCtrlArr[i];
            if (ctrl.fishID === killFishID) {
                fishCtrl = ctrl;
                this.fishWidgetCtrlArr.splice(i, 1);
                fishCtrl.onBeShot();
                break;
            }
        }
        if (!fishCtrl) {
            // console.error("not find fish id");
            return;
        }
        this.createLightning(startPos, fishCtrl.node.position);
        this.clearFish(fishCtrl);
    },

    //清除鱼
    clearFish: function (fishCtrl, delayTime) {
        if (this.autoIncrement === fishCtrl) {
            this.autoIncrement = null;
        }
        if (!delayTime) {
            delayTime = 1;
        }
        fishCtrl.fixScreen(true);
        fishCtrl.setBulletNoHit(true);

        this.scheduleOnce(function () {
            fishCtrl.onRemove();//删除鱼
            // 如果是锁定鱼被打死，则取消锁定
            for (let i = 0; i < this.lockFishCtrlArr.length; ++i) {
                if (this.lockFishCtrlArr[i] === fishCtrl) {
                    if (i === this.selfChairID) {
                        cc.log("[锁定鱼]清理掉锁定的鱼");
                    }
                    this.selectedLockFishLeaved(i);
                }
            }
        }, delayTime);
    },

    //晃动屏幕
    shakeScreen: function (baseValue, randomValue) {
        let shakeBaseValue = baseValue || 10;
        let shakeRandomValue = randomValue || 30;
        let dt = 0.05;
        let times = 30;
        let shakeAction = null;
        for (let i = 0; i < times; ++i) {
            let tempX = null;
            if (Math.random() > 0.5) {
                tempX = shakeBaseValue + Math.random() * shakeRandomValue;
            } else {
                tempX = -shakeBaseValue - Math.random() * shakeRandomValue;
            }
            let tempY = null;
            if (Math.random() > 0.5) {
                tempY = shakeBaseValue + Math.random() * shakeRandomValue;
            } else {
                tempY = -shakeBaseValue - Math.random() * shakeRandomValue;
            }
            let action = cc.place(tempX, tempY);
            if (!!shakeAction) {
                shakeAction = cc.sequence(cc.delayTime(dt), action, shakeAction);
            } else {
                shakeAction = cc.sequence(cc.delayTime(dt), action);
            }
        }
        shakeAction = cc.sequence(shakeAction, cc.place(0, 0));
        this.node.runAction(shakeAction);
    },

    //加入鱼时给鱼分类
    sortFish: function (fishData) {
        if (!!fishData) {
            if (fishData.fishKindType === fishConfig.FishKindType.Ordinaty) {
                this.addFish(fishData);
            }
            else if (fishData.fishKindType === fishConfig.FishKindType.Line) {
                if (!!this.lineFishList) {
                    this.lineFishList.push(fishData);
                }
                else {
                    this.lineFishList = [];
                    this.lineFishList.push(fishData);
                }
            }
            else if (fishData.fishKindType === fishConfig.FishKindType.Circle) {
                if (!!this.circleFishList) {
                    if (!!this.circleFishList[fishData.rounds]) {
                        this.circleFishList[fishData.rounds].push(fishData);
                    } else {
                        this.circleFishList[fishData.rounds] = [];
                        this.circleFishList[fishData.rounds].push(fishData);
                    }
                } else {
                    this.circleFishList = [];
                    this.circleFishList[fishData.rounds] = [];
                    this.circleFishList[fishData.rounds].push(fishData);
                }
            }
        }
    },

    //发射线鱼
    fireLineFish: function (lineFishList) {
        this.lineFishList = null;
        this.lineFishDelay = 0.5;
        if (!!lineFishList) {
            this.showLineFish(lineFishList, 0);
        }
    },

    //显示线鱼
    showLineFish: function (lineFishList, index) {
        if (lineFishList.length > index) {
            this.addFish(lineFishList[index], this.lineFishDelay * index);
            index++;
            this.showLineFish(lineFishList, index);
        }
    },

    //发射圈鱼
    fireCircleFish: function (circleFishList) {
        this.circleFishList = null;
        this.circleFishDelay = 1;
        if (!!circleFishList) {
            this.showCircleFish(circleFishList, 0);
        }
    },

    //显示圈鱼
    showCircleFish: function (fishArr, circleIndex) {
        if (!!fishArr) {
            if (!!fishArr[circleIndex]) {
                let fishLen = fishArr[circleIndex].length;
                for (let i = 0; i < fishLen; ++i) {
                    this.addFish(fishArr[circleIndex][i], this.circleFishDelay * circleIndex);
                }
            }
            circleIndex++;
            if (circleIndex < fishArr.length) {
                this.showCircleFish(fishArr, circleIndex);
            }
        }
    },

    addFish: function (fishInfo, fishDelay, isInit, fixTime) {
        if (fishInfo.fishTypeID == fishConfig.FishKind.FishKind42) {
            fishInfo.fishTypeID = 27;
        } else if (fishInfo.fishTypeID == fishConfig.FishKind.FishKind43) {
            fishInfo.fishTypeID = 28;
        } else if (fishInfo.fishTypeID == fishConfig.FishKind.FishKind44) {
            fishInfo.fishTypeID = 29;
        } else if (fishInfo.fishTypeID == fishConfig.FishKind.FishKind45) {
            fishInfo.fishTypeID = 30;
        }
        if (!fishConfig.fishType[fishInfo.fishTypeID]) {
            cc.log("找不到id是" + fishInfo.fishTypeID + "的鱼!!");
            return;
        }
        let node = cc.instantiate(this.fishWidgetPrefab);
        let ctrl = node.getComponent("LiKuiBuYuFishCtrl");
        node.parent = this.fishRoot;

        let moveTime = null;
        if (isInit === true) {
            moveTime = this.initServerTime - fishInfo.createTime;
            if (!!fixTime) {
                moveTime -= fixTime;
            }
            moveTime = moveTime / 1000;
        }
        ctrl.initWidget(fishInfo, this.onFishLeaved.bind(this), fishDelay, moveTime);
        this.fishWidgetCtrlArr.push(ctrl);

        if (fishInfo.fishTypeID === fishConfig.FishKind.AutoIncrement) {//李逵自增长 
            this.autoIncrement = ctrl;
        }
    },

    onFishLeaved: function (ctrl, event) {
        if (event === 'leave') {
            if (this.autoIncrement === ctrl) {
                this.autoIncrement = null;
            }
            for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
                if (this.fishWidgetCtrlArr[i] === ctrl) {
                    this.fishWidgetCtrlArr.splice(i, 1);
                    break;
                }
            }
            cc.log("[锁定鱼]鱼[" + ctrl.fishID + "]leave场景");
            ctrl.onRemove();
            let len = this.lockFishCtrlArr.length;
            for (let i = 0; i < len; ++i) {
                if (this.lockFishCtrlArr[i] === ctrl) {
                    this.selectedLockFishLeaved(i);
                }
            }
        } else if (event === 'outScene') {
            if (this.autoIncrement === ctrl) {
                this.autoIncrement = null;
            }
            let len = this.lockFishCtrlArr.length;
            for (let i = 0; i < len; ++i) {
                if (this.lockFishCtrlArr[i] === ctrl) {
                    if (i === this.selfChairID) {
                        cc.log("[锁定鱼]鱼[" + ctrl.fishID + "]out场景");
                    }
                    this.selectedLockFishLeaved(i);
                }
            }
        }
    },

    onSelfCannonPowerChange: function (powerIndex) {
        if (powerIndex <= 0 || powerIndex > 10) {
            console.error("onSelfCannonPowerChange index err:" + powerIndex);
            return;
        }
        // this.onChangeCannonPower(this.selfChairID, powerIndex);
        roomAPI.gameMessageNotify(gameProto.gameChangeCannonNotify(powerIndex));
    },

    onChangeCannonPower: function (chairID, index) {
        let ctrl = this.cannonWidgetCtrlList[chairID];
        if (!ctrl) {
            console.error("onChangeCannonPower err: not find ctrl");
            return;
        }
        ctrl.onChangeCannonPower(index * this.baseScore, index);
    },

    //鱼阵来袭，清理锁定鱼
    clearLockFish() {
        if (!!this.lockFishCtrlArr[this.selfChairID]) {
            this.onChangeLockFishState(false);
            // roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(-1, this.selfChairID));
        }
        if (!!this.robotChairArr) {
            let len = this.robotChairArr.length;
            for (let i = 0; i < len; ++i) {
                let chairID = this.robotChairArr[i];
                if (!!this.lockFishCtrlArr[chairID]) {
                    if (chairID === this.selfChairID) {
                        cc.log("[锁定鱼]椅子号[" + chairID + "]取消锁定鱼");
                    }
                    roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(-1, chairID));
                }
            }
        }
    },

    //更新状态
    updateState: function (status) {
        if (status === gameProto.FGStatus.FixScreen) {
            cc.log("更新定屏状态");
            this.fixScreen(true);
        } else if (status === gameProto.FGStatus.FishArrayStatus) {
            cc.log("更新鱼阵状态");
        } else if (status === gameProto.FGStatus.ReadyFishArrayStatus) {
            cc.log("更新准备鱼阵状态");
            if (!this.bgmIndex) {
                this.bgmIndex = 0;
            }
            this.bgmIndex += 1;
            if (this.bgmIndex >= this.bgmList.length) {
                this.bgmIndex = 0;
            }
            AudioMgr.startPlayBgMusic(this.bgmList[this.bgmIndex]);
            this.disableFishList();
            this.showSpray();
            this.changeBackGround();
            this.clearLockFish();
            this.clearNormalFish();
        }

        if (this.currentState == gameProto.FGStatus.FixScreen) {
            if (status === gameProto.FGStatus.Normal) {//恢复定屏状态
                this.fixScreen(false);
            }
        }
        this.currentState = status;
    },

    //设置鱼无效
    disableFishList() {
        let len = this.fishWidgetCtrlArr.length;
        // cc.log("清理前鱼的数量:" + len);
        let clearLen = 0;
        let noHitLen = 0;
        for (let i = len - 1; i >= 0; --i) {
            let inScene = this.fishWidgetCtrlArr[i].isInScene();
            if (inScene != true) {
                clearLen++;
                let tempFish = this.fishWidgetCtrlArr[i];
                this.fishWidgetCtrlArr.splice(i, 1);
                tempFish.onRemove();
                continue;
            }
            noHitLen++;
            this.fishWidgetCtrlArr[i].setBulletNoHit(true);
        }
        // cc.log("被清理掉的鱼的数量:" + clearLen);
        // cc.log("不可击中的鱼的数量:" + noHitLen);
    },

    //显示浪潮
    showSpray() {
        let sprayActionTime = 5.5;
        let sprayNode = cc.instantiate(this.sprayPrefab);
        sprayNode.parent = this.bulletRoot;
        let ctrl = sprayNode.getComponent("SprayWidgetControl");
        ctrl.setInfo(false, sprayActionTime);
        this.playSound("LiKuiBuYu/sound/effect/wave", false, 0.5);
    },

    //改变背景图
    changeBackGround() {
        let changeBackTime = 5;
        let backNode = cc.instantiate(this.backItem);
        backNode.parent = this.backBottom;
        let windowSize = cc.view.getVisibleSize();
        backNode.position = cc.v2(windowSize.width / 2, 0);

        this.backIndex = this.backIndex + 1;
        if (this.backIndex > 2) {
            this.backIndex = 0;
        }
        let backStr = "LiKuiBuYu/background/bg" + this.backIndex;
        Global.CCHelper.updateSpriteFrame(backStr, backNode.getComponent(cc.Sprite));
        let topBackMask = this.backTop.getComponent(cc.Mask);
        if (!!topBackMask) {
            cc.tween(this.backTop).to(changeBackTime, { width: 0 }).call(() => {
                backNode.parent = this.backTop;
                this.backItem.removeFromParent(true);
                this.backTop.width = windowSize.width;
                this.backItem = backNode;
            }).start();
        }
    },

    //定屏
    fixScreen: function (isFixScreen) {
        let len = this.fishWidgetCtrlArr.length;
        for (let i = 0; i < len; ++i) {
            this.fishWidgetCtrlArr[i].fixScreen(isFixScreen);
        }
    },

    update: function (dt) {
        this.updateSelfFireTime(dt);
    },

    updateSelfFireTime: function (dt) {
        this.selfFireTime += dt;
        if (this.selfFireTime > 30) {
            let tempTime = 60 - this.selfFireTime;
            if (tempTime > 0) {
                this.noFireTip.active = true;
                tempTime = Math.ceil(tempTime);
                this.noFireCountLabel.string = tempTime;
            } else {
                this.noFireTip.active = false;
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Waiting.show();
            }
        } else {
            this.noFireTip.active = false;
        }
    },

    //清理普通鱼
    clearNormalFish: function () {
        this.scheduleOnce(function () {
            let len = this.fishWidgetCtrlArr.length;
            for (let i = len - 1; i >= 0; --i) {
                let tempFish = this.fishWidgetCtrlArr[i];
                this.fishWidgetCtrlArr.splice(i, 1);
                tempFish.onFadeRemove();
            }
        }.bind(this), 3.5);
    },

    //开始鱼阵
    starteFishArr: function (fishArrayKind, randseek, fishArr, actionTime) {
        if (!!fishArr) {
            this.setRandSeek(randseek);
            if (fishArrayKind === 2) {
                this.loadFishArray2(fishArr, actionTime);
            } else if (fishArrayKind === 3) {
                this.loadFishArray3(fishArr, actionTime);
            } else if (fishArrayKind === 4) {
                this.loadFishArray4(fishArr, actionTime);
            } else if (fishArrayKind === 5) {
                this.loadFishArray5(fishArr, actionTime);
            } else if (fishArrayKind === 6) {
                this.loadFishArray6(fishArr, actionTime);
            } else if (fishArrayKind === 7) {
                // this.loadFishArray7(fishArr, actionTime);
            } else if (fishArrayKind === 8) {
                this.loadFishArray8(fishArr, actionTime);
            } else if (fishArrayKind === 9) {
                this.loadFishArray9(fishArr, actionTime);
            } else if (fishArrayKind === 10) {
                this.loadFishArray10(fishArr, actionTime);
            } else if (fishArrayKind === 11) {
                this.loadFishArray11(fishArr, actionTime);
            } else if (fishArrayKind === 12) {
                this.loadFishArray12(fishArr, actionTime);
            } else if (fishArrayKind === 13) {
                this.loadFishArray13(fishArr, actionTime);
            } else if (fishArrayKind === 14) {
                this.loadFishArray14(fishArr, actionTime);
            } else if (fishArrayKind === 15) {
                // this.loadFishArray15(fishArr, actionTime);
            }

        }
    },

    //设置随机数
    setRandSeek: function (randSeek) {
        this.randSeek = randSeek;
    },

    //获取随机数
    getRandSeek: function () {
        this.randSeek = (this.randSeek * 9301 + 49297) % this.RandMax;
        return this.randSeek;
    },

    //载入鱼阵
    loadFishArray2: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let windowSize = cc.view.getVisibleSize();
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            fishNode.parent = this.fishRoot;
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            this.fishWidgetCtrlArr.push(ctrl);
            //前两百条是小鱼， 100条从上方游进来， 100条从下方游进来， 在界面中停留一下， 再游出去
            if (i < 200) {
                let x, ys, yd, ye;      //x轴点， 起点， 停留点， 终点
                x = (i % 100) / 100 * windowSize.width - (windowSize.width / 2);
                let rnd = (this.getRandSeek() / this.RandMax) * 50;
                if (i < 100) {
                    ys = -65 - rnd - (windowSize.height / 2);
                    yd = 174 + (this.getRandSeek() / this.RandMax) * 30 - 15 - (windowSize.height / 2);
                    ye = windowSize.height / 2 + 100;
                } else {
                    ys = windowSize.height + 65 + rnd - (windowSize.height / 2);
                    yd = 584 + (this.getRandSeek() / this.RandMax) * 30 - 15 - (windowSize.height / 2);
                    ye = - (windowSize.height / 2) - 100;
                    ctrl.changeShadow();
                }
                let speed = ((this.getRandSeek() / this.RandMax) * 2.0 + 2.0) * 30;         //速度在鱼阵中是另外算的
                let dt1 = Math.abs((yd - ys) / speed);
                let dt2 = 2050 / 30;
                let dt3 = Math.abs((ye - yd) / speed);
                let action = cc.sequence(cc.place(x, ys), cc.moveTo(dt1, x, yd), cc.delayTime(dt2), cc.moveTo(dt3, x, ye));
                ctrl.setFishArrAction(action, actionTime);
            } else {
                let st = cc.v2(), ed = cc.v2();
                if (i % 2) {
                    st.x = -250 - (windowSize.width / 2);
                    ed.x = windowSize.width + 250 - (windowSize.width / 2);
                    st.y = ed.y = 484 - (windowSize.height / 2);
                } else {
                    st.x = windowSize.width + 250 - (windowSize.width / 2);
                    ed.x = -250 - (windowSize.width / 2);
                    st.y = ed.y = 284 - (windowSize.height / 2);
                }
                fishNode.position = st;
                let speed = 3 * 30;         //速度在鱼阵中是另外算的
                let delayTime = (((i - 200) / 2) * 150 + 100) / 30;
                let dt = Math.abs((ed.x - st.x) / speed);
                let action = cc.sequence(cc.delayTime(delayTime), cc.place(st), cc.moveTo(dt, ed));
                ctrl.setFishArrAction(action, actionTime);
            }
        }
    },
    loadFishArray3: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let direction = this.getRandSeek() % 2 != 0;
        let windowSize = cc.view.getVisibleSize();
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            fishNode.parent = this.fishRoot;
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            this.fishWidgetCtrlArr.push(ctrl);

            let st = cc.v2(), ed = cc.v2();
            if (i < 30) {
                st.y = 0;
                ed.y = this.getRandSeek() % (windowSize.height + 1000) - 500 - (windowSize.height / 2);
                if (direction) {
                    st.x = windowSize.width / 2 + 250;
                    ed.x = -250 - (windowSize.width / 2);
                } else {
                    st.x = -250 - (windowSize.width / 2);
                    ed.x = windowSize.width / 2 + 250;
                }
                fishNode.position = st;
                let speed = 3 * 30;         //速度在鱼阵中是另外算的
                let delayTime = (i * 50) / 30;
                let dt = st.sub(ed).mag() / speed;
                let action = cc.sequence(cc.delayTime(delayTime), cc.place(st), cc.moveTo(dt, ed));
                ctrl.setFishArrAction(action, actionTime);
            } else {
                st.x = ed.x = this.getRandSeek() % windowSize.width - (windowSize.width / 2);
                if (i - 30 < 100) {
                    st.y = -65 - (windowSize.height / 2);
                    ed.y = windowSize.height / 2 + 65;
                } else {
                    st.y = windowSize.height / 2 + 65;
                    ed.y = -65 - (windowSize.height / 2);
                }
                fishNode.position = st;
                let speed = 3 * 30;         //速度在鱼阵中是另外算的
                let delayTime = (this.getRandSeek() % 1300 + 200) / 30;
                let dt = st.sub(ed).mag() / speed;
                let action = cc.sequence(cc.delayTime(delayTime), cc.place(st), cc.moveTo(dt, ed));
                ctrl.setFishArrAction(action, actionTime);
            }
        }
    },
    loadFishArray4: function (fishDataArray, actionTime) {
        let windowSize = cc.view.getVisibleSize();
        let len = fishDataArray.length;
        let radius = (windowSize.height - 240) / 2;
        let speed = 1.5 * 30;//速度在鱼阵中是另外算的
        let center = cc.v2(windowSize.width / 2 + radius, 80);
        let actions = [];
        let st = cc.v2(), ed = cc.v2();
        let cellRadian = Math.PI * 2 / 59;
        center.x = -radius;
        let dt = 0;
        let action = null;
        let i = 0;
        let offsetX = 530;
        for (i = 0; i < 59; ++i) {
            st.x = Math.sin(i * cellRadian) * radius + center.x - offsetX;
            st.y = Math.cos(i * cellRadian) * radius;
            ed.x = windowSize.width / 2 + 2 * radius - offsetX;
            ed.y = st.y;
            dt = st.sub(ed).mag() / speed;
            action = cc.sequence(cc.place(st), cc.moveTo(dt, ed));
            actions.push(action);
        }
        cellRadian = Math.PI * 2 / 29;
        for (i = 0; i < 29; ++i) {
            st.x = Math.sin(i * cellRadian) * radius * 0.75 + center.x - offsetX;
            st.y = Math.cos(i * cellRadian) * radius * 0.75;
            ed.x = windowSize.width / 2 + 2 * radius - offsetX;
            ed.y = st.y;
            dt = st.sub(ed).mag() / speed;
            action = cc.sequence(cc.place(st), cc.moveTo(dt, ed));
            actions.push(action);
        }
        center.x = windowSize.width + radius;
        cellRadian = Math.PI * 2 / 59;
        for (i = 0; i < 59; ++i) {
            st.x = Math.sin(i * cellRadian) * radius + center.x - offsetX;
            st.y = Math.cos(i * cellRadian) * radius;
            ed.x = -2 * radius - offsetX;
            ed.y = st.y;
            dt = st.sub(ed).mag() / speed;
            action = cc.sequence(cc.place(st), cc.moveTo(dt, ed));
            actions.push(action);
        }
        cellRadian = Math.PI * 2 / 29;
        for (i = 0; i < 29; ++i) {
            st.x = Math.sin(i * cellRadian) * radius * 0.75 + center.x - offsetX;
            st.y = Math.cos(i * cellRadian) * radius * 0.75;
            ed.x = -2 * radius - offsetX;
            ed.y = st.y;
            dt = st.sub(ed).mag() / speed;
            action = cc.sequence(cc.place(st), cc.moveTo(dt, ed));
            actions.push(action);
        }
        //中心的大鱼
        st.x = -radius - offsetX;
        st.y = 0;
        ed.x = windowSize.width / 2 + 2 * radius - offsetX;
        ed.y = st.y;
        dt = st.sub(ed).mag() / speed;
        action = cc.sequence(cc.place(st), cc.moveTo(dt, ed));
        actions.push(action);

        st.x = center.x - offsetX;
        st.y = 0;
        ed.x = -2 * radius - offsetX;
        ed.y = st.y;
        dt = st.sub(ed).mag() / speed;
        action = cc.sequence(cc.place(st), cc.moveTo(dt, ed));
        actions.push(action);

        for (i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            fishNode.parent = this.fishRoot;
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            ctrl.setFishArrAction(actions[i], actionTime);
            this.fishWidgetCtrlArr.push(ctrl);
        }
    },
    loadFishArray5: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let speed = 3 * 30;//速度在鱼阵中是另外算的
        let st = cc.v2(), ed = cc.v2();
        let windowSize = cc.view.getVisibleSize();
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            fishNode.parent = this.fishRoot;
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            this.fishWidgetCtrlArr.push(ctrl);

            if (i < 100 + 98 + 99) {
                let x, y;
                while (true) {
                    x = (this.getRandSeek() / this.RandMax) * 2 - 1;
                    y = (this.getRandSeek() / this.RandMax) * 2 - 1;
                    if (x * x + y * y <= 1) {
                        break;
                    }
                }
                let radius = 230, r = 2;
                x = radius * x * r;
                y = radius * y;

                let extraX = radius * r + 50;
                st.x = x - extraX - windowSize.width / 2;
                ed.x = x + windowSize.width / 2 + extraX;
                st.y = ed.y = y;
                if (i >= 100) {
                    st.x -= 950;
                    if (i >= 100 + 98) {
                        st.x -= 950;
                    }
                }
            }
            else {
                st.x = -3400 - windowSize.width / 2;
                ed.x = windowSize.width / 2 + 250;
                st.y = ed.y = 0;
            }
            let dt = st.sub(ed).mag() / speed;
            let action = cc.sequence(cc.place(st), new cc.MoveTo(dt, ed));
            ctrl.setFishArrAction(action, actionTime);
        }
    },
    loadFishArray6: function (fishDataArray, actionTime) {
        let a0 = 900, b0 = 300;
        let a1 = 500, b1 = 130;
        let kk = 1;
        let speed = 1.6 * 30;
        let st = cc.v2(), ed = cc.v2();
        let bigArray = [cc.v2(-400 + 100, 0), cc.v2(-200 + 100, -120), cc.v2(-200 + 100, 120), cc.v2(0 + 100, -240), cc.v2(100, 240), cc.v2(300, 0)];
        let windowSize = cc.view.getVisibleSize();
        let len = fishDataArray.length;
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            fishNode.parent = this.fishRoot;
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            this.fishWidgetCtrlArr.push(ctrl);
            let x, y;
            if (i < 135) {
                while (true) {
                    x = this.getRandSeek() / this.RandMax * a0;
                    y = this.getRandSeek() / this.RandMax * b0 * 2 - b0;
                    if (x * x / (a0 * a0) + y * y / (b0 * b0) < 1 && x * x / (a1 * a1) + y * y / (b1 * b1) > 1 && y < kk * x && y > -kk * x)
                        break;
                }
            } else {
                x = bigArray[i - 135].x;
                y = bigArray[i - 135].y;
            }
            st.x = x + 1900 - windowSize.width / 2;
            ed.x = x - 1000 - windowSize.width / 2;
            st.y = ed.y = y + 384 - windowSize.height / 2;

            let dt = st.sub(ed).mag() / speed;
            let action = cc.sequence(cc.place(st), cc.moveTo(dt, ed));
            ctrl.setFishArrAction(action, actionTime);
        }
    },
    loadFishArray8: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let actions = [];
        let sectionNum = 6;
        let split = [6, 90, 114, 90];
        let windowSize = cc.view.getVisibleSize();
        let tAngle = Math.PI / 3;//60度
        let center = cc.v2(windowSize.width / 2, windowSize.height / 2);
        let speed = 120;
        let delayTime = 5;
        let st = cc.v2(0, 0), ed;
        for (let i = 0; i < split.length; ++i) {
            let tt = split[i] / sectionNum;
            for (let j = 0; j < split[i]; ++j) {
                let k = Math.floor(j / tt % sectionNum);
                ed = this.getTargetPoint(tAngle * k + this.getRandSeek() / this.RandMax * Math.PI / 6, center, 300);
                ed = cc.v2(ed.x - windowSize.width / 2, ed.y - windowSize.height / 2);
                let dt = st.sub(ed).mag() / speed;
                let action = cc.sequence(cc.hide(), cc.delayTime(delayTime * i + this.getRandSeek() / this.RandMax * Math.min(2.5, split[i] / sectionNum)), cc.place(st), cc.show(), cc.moveTo(dt, ed));
                actions.push(action);
            }
        }
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }

            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            fishNode.parent = this.fishRoot;
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            this.fishWidgetCtrlArr.push(ctrl);
            ctrl.setFishArrAction(actions[i], actionTime);
        }
    },
    getTargetPoint: function (angle, src, radius) {
        let target = cc.v2();
        angle = this.angleRange(angle);
        let windowSize = cc.view.getVisibleSize();
        if (angle == 0 || angle == Math.PI * 2) {
            target.x = -radius;
            target.y = src.y;
        } else if (angle == Math.PI / 2) {
            target.x = src.x;
            target.y = -radius;
        } else if (angle == Math.PI) {
            target.x = windowSize.width + radius;
            target.y = src.y;
        } else if (angle == Math.PI / 2 * 3) {
            target.x = src.x;
            target.y = windowSize.height + radius;
        } else if (angle > 0 && angle < Math.PI / 2) {
            target.x = -radius;
            target.y = src.y - (src.x + radius) * Math.tan(angle);
        } else if (angle > Math.PI / 2 && angle < Math.PI) {
            target.x = windowSize.width + radius;
            target.y = src.y + (windowSize.width - src.x + radius) * Math.tan(angle);
        } else if (angle > Math.PI && angle < 3 * Math.PI / 2) {
            target.x = windowSize.width + radius;
            target.y = src.y + (windowSize.width - src.x + radius) * Math.tan(angle);
        } else {
            target.x = -radius;
            target.y = src.y - (src.x + radius) * Math.tan(angle);
        }
        return target;
    },
    angleRange: function (angle) {
        let t = Math.PI * 2;
        while (angle < 0) {
            angle += t;
        }
        while (angle > t) {
            angle -= t;
        }
        return angle;
    },
    loadFishArray12: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let windowSize = cc.view.getVisibleSize();
        let radius = (windowSize.height - 240) / 2;
        let speed = 45;
        let center = cc.v2(windowSize.width + radius, radius + 120);
        let actions = [];
        let tlen = 100;
        let st = cc.v2(), ed = cc.v2();
        let dt;
        for (let i = 0; i < tlen; ++i) {
            st.x = radius * Math.cos(i / tlen * Math.PI * 2) + center.x - windowSize.width * 2;
            st.y = radius * Math.sin(i / tlen * Math.PI * 2) + center.y - windowSize.height / 2;
            ed.x = -2 * radius - windowSize.width / 2 + windowSize.width * 2;
            ed.y = st.y;
            dt = st.sub(ed).mag() / speed;
            actions.push(cc.sequence(cc.place(st), cc.moveTo(dt, ed)));
        }
        let rotateRadian1 = 45 * Math.PI / 180;
        let rotateRadian2 = 135 * Math.PI / 180;
        let radiusSmall = radius;
        let radiusSmall1 = radius / 3;
        let centerSmall = [cc.v2(), cc.v2(), cc.v2(), cc.v2()];
        centerSmall[0].x = center.x + radiusSmall * Math.cos(-rotateRadian2);
        centerSmall[0].y = center.y + radiusSmall * Math.sin(-rotateRadian2);
        centerSmall[1].x = center.x + radiusSmall * Math.cos(-rotateRadian1);
        centerSmall[1].y = center.y + radiusSmall * Math.sin(-rotateRadian1);
        centerSmall[2].x = center.x + radiusSmall * Math.cos(rotateRadian2);
        centerSmall[2].y = center.y + radiusSmall * Math.sin(rotateRadian2);
        centerSmall[3].x = center.x + radiusSmall * Math.cos(rotateRadian1);
        centerSmall[3].y = center.y + radiusSmall * Math.sin(rotateRadian1);

        let ttlen = [17, 17, 30, 30];
        for (let k = 0; k < centerSmall.length; ++k) {
            tlen = ttlen[k];
            for (let i = 0; i < tlen; ++i) {
                st.x = radiusSmall1 * Math.cos(i / tlen * Math.PI * 2) + centerSmall[k].x - windowSize.width * 2;
                st.y = radiusSmall1 * Math.sin(i / tlen * Math.PI * 2) + centerSmall[k].y - windowSize.height / 2;
                ed.x = -2 * radius - windowSize.width / 2 + windowSize.width * 2;
                ed.y = st.y;
                dt = st.sub(ed).mag() / speed;
                actions.push(cc.sequence(cc.place(st), cc.moveTo(dt, ed)));
            }
        }
        tlen = 15;
        for (let i = 0; i < tlen; ++i) {
            st.x = radiusSmall / 2 * Math.cos(i / tlen * Math.PI * 2) + center.x - windowSize.width * 2;
            st.y = radiusSmall / 2 * Math.sin(i / tlen * Math.PI * 2) + center.y - windowSize.height / 2;
            ed.x = -2 * radius - windowSize.width / 2 + windowSize.width + windowSize.width * 2;
            ed.y = st.y;
            dt = st.sub(ed).mag() / speed;
            actions.push(cc.sequence(cc.place(st), cc.moveTo(dt, ed)));
        }
        for (let i = 0; i < 4; ++i) {
            st.x = centerSmall[i].x - windowSize.width / 2 - windowSize.width * 2 + windowSize.width / 2;
            st.y = centerSmall[i].y - windowSize.height / 2;
            ed.x = -2 * radius - windowSize.width / 2 + windowSize.width * 2;
            ed.y = st.y;
            dt = st.sub(ed).mag() / speed;
            actions.push(cc.sequence(cc.place(st), cc.moveTo(dt, ed)));
        }
        st.x = center.x - windowSize.width / 2 - windowSize.width * 2 + windowSize.width / 2
        st.y = center.y - windowSize.height / 2;
        ed.x = -2 * radius - windowSize.width / 2 + windowSize.width * 2;
        ed.y = st.y;
        dt = st.sub(ed).mag() / speed;
        actions.push(cc.sequence(cc.place(st), cc.moveTo(dt, ed)));
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            fishNode.parent = this.fishRoot;
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            this.fishWidgetCtrlArr.push(ctrl);
            ctrl.setFishArrAction(actions[i], actionTime);
        }
    },
    loadFishArray13: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let windowSize = cc.view.getVisibleSize();
        let radius = (windowSize.height - 240) / 2;
        let speed = 45;
        let center = cc.v2(windowSize.width + radius, windowSize.height / 2);
        let actions = [];
        let st = cc.v2(), ed = cc.v2();
        let centerXArray = [-radius, windowSize.width + radius];
        let edXArray = [windowSize.width + 2 * radius, -2 * radius];
        for (let kk = 0; kk < 2; ++kk) {
            //方向
            let dir = kk * 2 - 1;
            center.x = centerXArray[kk];
            let split = [50, 40, 30];
            let radiuses = [radius, radius * 40 / 50, radius * 30 / 50];
            let centers = [center, cc.v2(center.x + dir * radius / 5, center.y), cc.v2(center.x + dir * radius * 2 / 5, center.y)];
            for (let i = 0; i < split.length; ++i) {
                let tlen = split[i];
                for (let j = 0; j < tlen; ++j) {
                    st.x = radiuses[i] * Math.cos(j / tlen * Math.PI * 2) + centers[i].x - windowSize.width / 2;
                    st.y = radiuses[i] * Math.sin(j / tlen * Math.PI * 2) + centers[i].y - windowSize.height / 2;
                    ed.x = edXArray[kk] - windowSize.width / 2;
                    ed.y = st.y;
                    actions.push(cc.sequence(cc.place(st), cc.moveTo(st.sub(ed).mag() / speed, ed)));
                }
            }
            let stY = [center.y - radius, center.y + radius, center.y];
            for (let i = 0; i < 3; ++i) {
                st.x = center.x - windowSize.width / 2;
                if (i == 2) {
                    st.x += dir * radius * 2 / 5;
                }
                st.y = stY[i] - windowSize.height / 2;
                ed.x = edXArray[kk] - windowSize.width / 2;
                ed.y = st.y;
                actions.push(cc.sequence(cc.place(st), cc.moveTo(st.sub(ed).mag() / speed, ed)));
            }
        }
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            fishNode.parent = this.fishRoot;
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            this.fishWidgetCtrlArr.push(ctrl);
            ctrl.setFishArrAction(actions[i], actionTime);
        }
    },
    loadFishArray14: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let speed = 90;
        let windowSize = cc.view.getVisibleSize();
        let center1 = cc.v2(windowSize.width / 3 - windowSize.width / 2, windowSize.height / 3 - windowSize.height / 2);
        let center2 = cc.v2(windowSize.width / 3 * 2 - windowSize.width / 2, windowSize.height / 3 * 2 - windowSize.height / 2);
        let center3 = cc.v2(windowSize.width / 3 - windowSize.width / 2, windowSize.height / 3 * 2 - windowSize.height / 2);
        let center4 = cc.v2(windowSize.width / 3 * 2 - windowSize.width / 2, windowSize.height / 3 - windowSize.height / 2);
        let centers = [center1, center2, center3, center4];
        let st = cc.v2(), ed = cc.v2();
        let fishIndex = 0;
        let tempActionTime = actionTime;
        for (let i = 0; i < 20; ++i) {
            for (let j = 0; j < 15; ++j) {
                let delayTime = Math.floor(i / 2) * 3.5;
                if (fishIndex < len) {
                    let fishData = fishDataArray[fishIndex];
                    fishIndex++;
                    if (!fishData || !fishData.invalid) {
                        continue;
                    }

                    if (!!actionTime) {
                        if (delayTime < actionTime) {
                            st.x = centers[i % 4].x;
                            st.y = centers[i % 4].y;
                            ed = this.getTargetPoint(j / 15 * Math.PI * 2, st, 600);
                            let distance = st.sub(ed).mag();
                            let moveTime = distance / speed;
                            if (delayTime + moveTime < actionTime) {
                                continue;
                            }
                            tempActionTime = actionTime - delayTime;
                            let action = cc.sequence(cc.place(st), cc.moveTo(moveTime, ed));
                            let fishNode = cc.instantiate(this.fishWidgetPrefab);
                            fishNode.parent = this.fishRoot;
                            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
                            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
                            ctrl.setFishArrAction(action, tempActionTime);
                            this.fishWidgetCtrlArr.push(ctrl);
                            continue;
                        }
                        delayTime -= actionTime;
                        tempActionTime = null;
                    }
                    this.scheduleOnce(function () {
                        st.x = centers[i % 4].x;
                        st.y = centers[i % 4].y;
                        ed = this.getTargetPoint(j / 15 * Math.PI * 2, st, 600);
                        let distance = st.sub(ed).mag();
                        let moveTime = distance / speed;
                        let action = cc.sequence(cc.place(st), cc.moveTo(moveTime, ed));
                        let fishNode = cc.instantiate(this.fishWidgetPrefab);
                        fishNode.parent = this.fishRoot;
                        let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
                        ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
                        ctrl.setFishArrAction(action, tempActionTime);
                        this.fishWidgetCtrlArr.push(ctrl);
                    }.bind(this), delayTime);
                }
            }
        }
    },
    loadFishArray10: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let actions = [];
        let fishInitPos = [];
        let speed = 90;
        let windowSize = cc.view.getVisibleSize();
        //宝箱
        fishInitPos.push(cc.v2(50, windowSize.height / 2 - 50));
        fishInitPos.push(cc.v2(150, windowSize.height / 2 - 50));
        //黄鱼
        for (let i = 0; i < 5; ++i) {
            fishInitPos.push(cc.v2(270, windowSize.height / 2 + 120 + 30 * i));
        }
        //粉鱼
        for (let i = 0; i < 20; ++i) {
            fishInitPos.push(cc.v2(220 + 45 * i, windowSize.height / 2 - 110));
        }
        for (let i = 0; i < 5; ++i) {
            fishInitPos.push(cc.v2(220, windowSize.height / 2 - 70 + 40 * i));
            fishInitPos.push(cc.v2(1075, windowSize.height / 2 - 70 + 40 * i));
        }
        for (let i = 0; i < 3; ++i) {
            fishInitPos.push(cc.v2(270 + 50 * i, windowSize.height / 2 + 90));
            fishInitPos.push(cc.v2(1025 - 50 * i, windowSize.height / 2 + 90));
        }
        //斜着
        for (let i = 0; i < 3; ++i) {
            fishInitPos.push(cc.v2(420 + 20 * i, windowSize.height / 2 + 90 + 30 * i));
            fishInitPos.push(cc.v2(875 - 20 * i, windowSize.height / 2 + 90 + 30 * i));
        }
        for (let i = 0; i < 8; ++i) {
            fishInitPos.push(cc.v2(480 + 45 * i, windowSize.height / 2 + 180));
        }
        //////////////////////////////////////////////////////////////////////
        //乌龟
        fishInitPos.push(cc.v2(windowSize.width / 2 - 300, windowSize.height / 2));
        fishInitPos.push(cc.v2(windowSize.width / 2 + 250, windowSize.height / 2));
        //////////////////////////////////////////////////////////////////////////
        //灯笼
        fishInitPos.push(cc.v2(windowSize.width - 180, windowSize.height / 2 - 50));
        fishInitPos.push(cc.v2(windowSize.width - 180, windowSize.height / 2 + 50));
        //金沙
        fishInitPos.push(cc.v2(windowSize.width / 2 - 50, windowSize.height / 2));
        //绿小鱼
        for (let i = 0; i < 20; ++i) {
            let tempX = windowSize.width / 2 - 320 + (this.getRandSeek() / this.RandMax) * 100 - 50;
            let tempY = windowSize.height / 2 - 200 + (this.getRandSeek() / this.RandMax) * 100 - 50;
            fishInitPos.push(cc.v2(tempX, tempY));
            tempX = windowSize.width / 2 + 200 + (this.getRandSeek() / this.RandMax) * 100 - 50;
            tempY = windowSize.height / 2 - 200 + (this.getRandSeek() / this.RandMax) * 100 - 50;
            fishInitPos.push(cc.v2(tempX, tempY));
        }
        //海马
        for (let i = 0; i < 3; ++i) {
            fishInitPos.push(cc.v2(windowSize.width / 2 - 160 + 125 * i, windowSize.height / 2 + 100));
        }
        //////////////////////////////////////////////////////////////////////////
        let dir = 1;//前后没有对称， 不能直接这样子， 所以， 先算了
        for (let i = 0; i < len; ++i) {
            fishInitPos[i].x -= windowSize.width * dir;
            let dis = windowSize.width * 2 * dir;
            let tempPos = cc.v2(fishInitPos[i].x - windowSize.width / 2, fishInitPos[i].y - windowSize.height / 2);
            let action = cc.place(tempPos);
            actions.push(cc.sequence(action, cc.moveBy(Math.abs(dis / speed), cc.v2(dis, 0))));
        }
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            fishNode.parent = this.fishRoot;
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            ctrl.setFishArrAction(actions[i], actionTime);
            this.fishWidgetCtrlArr.push(ctrl);
        }
    },
    loadFishArray11: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let actions = [];
        let fishInitPos = [];
        let speed = 90;
        let windowSize = cc.view.getVisibleSize();
        let radius = windowSize.height / 2;
        //绿色小鱼
        for (let i = 0; i < 3; ++i) {
            for (let j = 0; j < 20; ++j) {
                let tempX = Math.sin((35 + j * 5.5) / 180 * Math.PI) * radius + windowSize.width / 2 + 55 * i + 30;
                let tempY = Math.cos((35 + j * 5.5) / 180 * Math.PI) * radius + windowSize.height / 2;
                fishInitPos.push(cc.v2(tempX, tempY));
                tempX = Math.sin((35 + 180 + j * 5.5) / 180 * Math.PI) * radius + windowSize.width / 2 - 55 * i - 30;
                tempY = Math.cos((35 + 180 + j * 5.5) / 180 * Math.PI) * radius + windowSize.height / 2;
                fishInitPos.push(cc.v2(tempX, tempY));
            }
        }

        //粉色小鱼, 黄色小鱼
        let offset = 22;
        let dy = 55;
        let dx = 65;
        let allOffsetX = -20;
        for (let k = 0; k < 2; ++k) {
            for (let i = 0; i < 2; ++i) {
                fishInitPos.push(cc.v2(windowSize.w / 2 + offset * k + allOffsetX, windowSize.height / 2 + dy * 5 * (1 - i * 2) - offset * k));
            }
            for (let i = 0; i < 7; ++i) {
                fishInitPos.push(cc.v2(windowSize.width / 2 - 150 + dx * i + offset * k + allOffsetX, windowSize.height / 2 + dy * 4 - offset * k));
                fishInitPos.push(cc.v2(windowSize.width / 2 - 150 + dx * i + offset * k + allOffsetX, windowSize.height / 2 - dy * 4 - offset * k));
            }
            for (let i = 0; i < 9; ++i) {
                fishInitPos.push(cc.v2(windowSize.width / 2 - 200 + dx * i + offset * k + allOffsetX, windowSize.height / 2 + dy * 3 - offset * k));
                fishInitPos.push(cc.v2(windowSize.width / 2 - 200 + dx * i + offset * k + allOffsetX, windowSize.height / 2 - dy * 3 - offset * k));
            }
            for (let i = 0; i < 9; ++i) {
                if (i == 4)
                    continue;
                fishInitPos.push(cc.v2(windowSize.width / 2 - 200 + dx * i + offset * k + allOffsetX, windowSize.height / 2 + dy * 2 - offset * k));
                fishInitPos.push(cc.v2(windowSize.width / 2 - 200 + dx * i + offset * k + allOffsetX, windowSize.height / 2 - dy * 2 - offset * k));
            }
            for (let i = 0; i < 9; ++i) {
                if (i == 4 || i == 3 || i == 5)
                    continue;
                fishInitPos.push(cc.v2(windowSize.width / 2 - 200 + dx * i + offset * k + allOffsetX, windowSize.height / 2 + dy - offset * k));
                fishInitPos.push(cc.v2(windowSize.width / 2 - 200 + dx * i + offset * k + allOffsetX, windowSize.height / 2 - dy - offset * k));
            }
            for (let i = 0; i < 11; ++i) {
                if (i >= 3 && i <= 7) {
                    continue;
                }
                fishInitPos.push(cc.v2(windowSize.width / 2 - 300 + dx * i + offset * k + allOffsetX, windowSize.height / 2 - offset * k));
            }
        }
        ///////////////
        //乌龟王子， 灯笼皇后
        fishInitPos.push(cc.v2(windowSize.width / 2 + 25, windowSize.height / 2 + 50));
        fishInitPos.push(cc.v2(windowSize.width / 2 + 25, windowSize.height / 2 - 50));
        //////////////////////////////////////////////////////////////////////////
        let dir = this.getRandSeek() % 2 * 2 - 1;
        for (let i = 0; i < len; ++i) {
            fishInitPos[i].x += windowSize.width * dir;
            let dis = -windowSize.width * 2 * dir;
            let tempPos = cc.v2(fishInitPos[i].x - windowSize.width / 2, fishInitPos[i].y - windowSize.height / 2);
            let action = cc.place(tempPos);
            actions.push(cc.sequence(action, cc.moveBy(Math.abs(dis / speed), cc.v2(dis, 0))));
        }
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            fishNode.parent = this.fishRoot;
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            ctrl.setFishArrAction(actions[i], actionTime);
            this.fishWidgetCtrlArr.push(ctrl);
        }
    },
    loadFishArray9: function (fishDataArray, actionTime) {
        let len = fishDataArray.length;
        let actions = [];
        let split = [27, 8, 64, 1];
        let fishInitPos = [];
        let speed = 90;
        let windowSize = cc.view.getVisibleSize();
        //蓝斑鱼的起始位置
        fishInitPos[0] = [
            cc.v2(100 - windowSize.width / 2, - 130),
            cc.v2(100 - windowSize.width / 2, - 50),
            cc.v2(100 - windowSize.width / 2, 50),
            cc.v2(100 - windowSize.width / 2, 130),
            cc.v2(1130 - windowSize.width / 2, 100),
            cc.v2(1130 - windowSize.width / 2, 0),
            cc.v2(1130 - windowSize.width / 2, - 100),
        ];
        for (let i = 0; i < 10; ++i) {
            fishInitPos[0].push(cc.v2(180 + i * 105 - windowSize.width / 2, - 200));
            fishInitPos[0].push(cc.v2(180 + i * 105 - windowSize.width / 2, 200));
        }
        ///////////////////////////////////////////////////////////////////////
        //蓝蝴蝶
        fishInitPos[1] = [
            cc.v2(225 - windowSize.width / 2, 0),
            cc.v2(375 - windowSize.width / 2, 0),
            cc.v2(300 - windowSize.width / 2, - 50),
            cc.v2(300 - windowSize.width / 2, 50),
        ];
        for (let i = 0; i < 4; ++i) {
            fishInitPos[1][i + 4] = cc.v2(fishInitPos[1][i].x + 600, fishInitPos[1][i].y);
        }
        ///////////////////////////////////////////////////////////////
        //粉红色小鱼
        fishInitPos[2] = [];
        for (let i = 0; i < 16; ++i) {
            fishInitPos[2].push(cc.v2(200 + i * 55 - windowSize.width / 2, - 250));
            fishInitPos[2].push(cc.v2(200 + i * 55 - windowSize.width / 2, - 150));
            fishInitPos[2].push(cc.v2(200 + i * 55 - windowSize.width / 2, 250));
            fishInitPos[2].push(cc.v2(200 + i * 55 - windowSize.width / 2, 150));
        }
        //////////////////////////////////////////////////////////////////////////
        //金莎
        fishInitPos[3] = [cc.v2(- 90, 0)];
        //////////////////////////////////////////////////////////////////////////
        let dir = this.getRandSeek() % 2 * 2 - 1;
        for (let i = 0; i < split.length; ++i) {
            for (let j = 0; j < split[i]; ++j) {
                let dis = windowSize.width * 2 * dir;
                let dt = Math.abs(dis / speed);
                actions.push(cc.sequence(cc.place(fishInitPos[i][j].x + windowSize.width * dir, fishInitPos[i][j].y), cc.moveBy(dt, cc.v2(-dis, 0))));
            }
        }
        for (let i = 0; i < len; ++i) {
            let fishData = fishDataArray[i];
            if (!fishData || !fishData.invalid) {
                continue;
            }
            let fishNode = cc.instantiate(this.fishWidgetPrefab);
            fishNode.parent = this.fishRoot;
            let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
            ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
            ctrl.setFishArrAction(actions[i], actionTime);
            this.fishWidgetCtrlArr.push(ctrl);
        }
    },
    // loadFishArray7: function (fishDataArray, actionTime) {
    //     let len = fishDataArray.length;
    //     let startAngle = 135;
    //     // let windowSize = cc.view.getVisibleSize();
    //     let center = cc.v2(0, 0);
    //     let actions = [];
    //     let oneRingTime = 10;           //转一圈所需要的时间
    //     let circleNum = 1;
    //     let lineSpeed = 150;
    //     let split = [40, 40, 24, 13];
    //     let radius = [350, 290, 230, 170];
    //     let delayAngle = 0;
    //     for (let i = 0; i < split.length; ++i) {
    //         delayAngle += 90;
    //         for (let j = 0; j < split[i]; ++j) {
    //             let action = cc.sequence(cc.hide(), cc.delayTime(oneRingTime / split[i] * (j)), cc.show(),
    //                 cc.repeat(new ym.FishRotationAt(oneRingTime, center, radius[i], startAngle, true, 360), circleNum),
    //                 new ym.FishRotationAt(oneRingTime * (1 - (j) / split[i]) + (delayAngle / 360) * oneRingTime, center, radius[i], startAngle, true, delayAngle + 360 * (1 - (j) / split[i]))
    //             );
    //             //计算最终旋转完后 停下的位置
    //             let angle = (startAngle + 360 * (1 - (j) / split[i])) + delayAngle;
    //             let radian = angle / 180 * Math.PI;//转换成弧度
    //             let stopPos = cc.v2(radius[i] * Math.sin(radian) + center.x, radius[i] * Math.cos(radian) + center.y);
    //             let outScreenPos = this.getTargetPoint(Math.PI * 3 - radian, stopPos);
    //             let distance = stopPos.sub(outScreenPos).mag();
    //             let dt = distance / lineSpeed + 0.01;
    //             action = cc.sequence(action, cc.moveTo(dt, outScreenPos));
    //             actions.push(action);
    //         }
    //     }
    //     //// 金海豚。
    //     {
    //         let action = cc.sequence(cc.place(center), cc.rotateTo(0, startAngle - 80), cc.repeat(cc.rotateBy(oneRingTime, 360), circleNum + 2));
    //         let radian = (startAngle - 80) / 180 * Math.PI;//转换成弧度
    //         let outScreenPos = this.getTargetPoint(Math.PI * 3 - radian, stopPos);
    //         let distance = stopPos.sub(outScreenPos).mag();
    //         let dt = distance / lineSpeed;
    //         action = cc.sequence(action, cc.moveTo(dt, outScreenPos));
    //         actions.push(action);
    //     }
    //     for (let i = 0; i < len; ++i) {
    //         let fishData = fishDataArray[i];
    //         if (!fishData || !fishData.invalid) {
    //             continue;
    //         }
    //         let fishNode = cc.instantiate(this.fishWidgetPrefab);
    //         fishNode.parent = this.fishRoot;
    //         let ctrl = fishNode.getComponent("LiKuiBuYuFishCtrl");
    //         ctrl.setFishArr(fishData, this.onFishLeaved.bind(this));
    //         ctrl.setFishArrAction(actions[i], actionTime);
    //         this.fishWidgetCtrlArr.push(ctrl);
    //     }
    // },
});
