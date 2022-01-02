let roomProto = require('../../API/RoomProto');
let roomAPI = require('../../API/RoomAPI');
let gameProto = require('./API/gameProto');
let utils = require("../../Shared/utils");


cc.Class({
    extends: cc.Component,

    properties: {
        cannonPosArr: [cc.Node],
        cannonWidgetPrefab: cc.Prefab,

        fireControlWidgetCtrl: require('FireControlWidget'),

        effectCtrl: require("EffectCtrl"),

        bulletRoot: cc.Node,
        bulletWidgetPrefab: cc.Prefab,
        bulletBoomAnimationWidgetPrefab: cc.Prefab,

        fishRoot: cc.Node,
        fishWidgetPrefab: cc.Prefab,

        rightMenuRoot: cc.Node,
        menuOutBtnNode: cc.Node,
        menuInBtnNode: cc.Node,

        toggleAutoFire: cc.Toggle,
        toggleLockFish: cc.Toggle
    },

    start() {
        this.gameInited = false;
        this.selfChairID = -1;
        this.cannonWidgetCtrlList = {};

        this.fishWidgetCtrlArr = [];

        this.lockFishCtrlArr = [null, null, null, null];
        this.baseScore = 0.01;
        this.profitPercentage = 0;
        this.isOnLockFishState = false;

        this.isRoomOwner = false;

        this.fireControlWidgetCtrl.initWidget(this.onSelfFire.bind(this));

        this.startCollision(true);

        Global.MessageCallback.addListener('RoomMessagePush', this);
        Global.MessageCallback.addListener('GameMessagePush', this);
        Global.MessageCallback.addListener('ReConnectSuccess', this);
        Global.MessageCallback.addListener('GAME_EVENT', this);

        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
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
                    ViewMgr.goBackHall(Config.GameType.FISH);
                } else {
                    this.onUserLeave(msg.data.roomUserInfo);
                    // 更新房主信息
                    this.updateRoomOwner();
                }
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                // 初始化界面场景
                this.gameInit(msg.data.gameData, msg.data.roomUserInfoArr);
            } else if (msg.type === roomProto.OTHER_USER_ENTRY_ROOM_PUSH) {
                if (!this.gameInited) return;
                this.onUserEntry(msg.data.roomUserInfo, 0);
                this.onChangeCannonPower(msg.data.roomUserInfo.chairId, 1);

                // 更新房主信息
                this.updateRoomOwner();
            }
        } else if (router === "GameMessagePush") {
            if (!this.gameInited) return;
            if (msg.type === gameProto.GAME_FIRE_PUSH) {
                if (msg.data.chairID === this.selfChairID) return;
                this.onOtherUserFire(msg.data);
            } else if (msg.type === gameProto.GAME_CHANGE_CANNON_PUSH) {
                if (msg.data.chairID === this.selfChairID) return;
                this.onChangeCannonPower(msg.data.chairID, msg.data.powerIndex);
            } else if (msg.type === gameProto.GAME_CAPTURE_PUSH) {
                this.onCapture(msg.data);
            } else if (msg.type === gameProto.GAME_LOCK_FISH_PUSH) {
                if (msg.data.chairID === this.selfChairID) return;
                this.onUserLockFish(msg.data.chairID, msg.data.fishID);
            } else if (msg.type === gameProto.GAME_ADD_FISH_PUSH) {
                for (let i = 0; i < msg.data.fishArr.length; ++i) {
                    this.addFish(msg.data.fishArr[i]);
                }
            }
        } else if (router === "ReConnectSuccess") {
            ViewMgr.goBackHall(Config.GameType.FISH);
        } else if (router === 'GAME_EVENT') {
            if (msg === cc.game.EVENT_HIDE) {
                this.gameInited = false;
            } else if (msg === cc.game.EVENT_SHOW) {
                this.onReconnection();
            }
        }
    },

    onBtnClick: function (event, params) {
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
            this.onChangeLockFishState(toggle.isChecked);
        } else if (params === "settings") {
            Global.DialogManager.createDialog("Setting/SettingDialog");
        } else if (params === "help") {
            Global.DialogManager.createDialog("Fish/FishHelpDialog");
        }
    },

    startCollision: function (isStart) {
        let manager = cc.director.getCollisionManager();
        manager.enabled = isStart;
    },

    // 初始化游戏场景
    gameInit: function (gameData, roomUserInfoArr) {
        this.clearScene();

        this.gameInited = true;

        this.serverOffsetTime = gameData.serverTime - Date.now();
        this.baseScore = gameData.baseScore;
        this.profitPercentage = gameData.profitPercentage;

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

        // 初始化场景中的鱼
        for (let key in gameData.fishList) {
            if (gameData.fishList.hasOwnProperty(key)) {
                this.addFish(gameData.fishList[key]);
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

        // 更新房主信息
        this.updateRoomOwner();
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
            this.fishWidgetCtrlArr[i].onClear();
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

    onReconnection: function () {
        this.clearScene();

        roomAPI.roomMessageNotify(roomProto.getRoomSceneInfoNotify());
    },

    onUserEntry: function (roomUserInfo, curWinGold) {
        let posIndex = (roomUserInfo.chairId + ((this.selfChairID >= 2) ? 2 : 0)) % 4;
        let node = cc.instantiate(this.cannonWidgetPrefab);
        let ctrl = node.getComponent("CannonWidgetCtrl");
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

    updateRoomOwner: function () {
        this.isRoomOwner = true;
        let robotChairIDArr = [];
        // 判定是否是房主
        for (let key in this.cannonWidgetCtrlList) {
            if (this.cannonWidgetCtrlList.hasOwnProperty(key)) {
                let ctrl = this.cannonWidgetCtrlList[key];
                if (ctrl.roomUserInfo.chairId < this.selfChairID && !ctrl.roomUserInfo.userInfo.robot) {
                    this.isRoomOwner = false;
                }
                if (ctrl.roomUserInfo.userInfo.robot) {
                    robotChairIDArr.push(ctrl.roomUserInfo.chairId);
                }
            }
        }
        // 如果是房主，则设置机器人自动开炮
        if (this.isRoomOwner && robotChairIDArr.length > 0) {
            this.fireControlWidgetCtrl.startRobotOperation(robotChairIDArr, this.onRobotFire.bind(this));
        } else {
            this.fireControlWidgetCtrl.stopRobotOperation();
        }
    },

    onRobotFire: function (chairIDArr, roteArr) {
        let tempChairIDArr = [];
        let tempRoteArr = [];
        for (let i = 0; i < chairIDArr.length; ++i) {
            let cannonCtrl = this.cannonWidgetCtrlList[chairIDArr[i]];
            if (!cannonCtrl) {
                console.error("onRobotFire err: not fid ctrl");
                return;
            }
            if (cannonCtrl.roomUserInfo.userInfo.gold + cannonCtrl.winGold < cannonCtrl.powerIndex * this.baseScore) {
                console.warn("onRobotFire warn: robot gold not enough");
                return;
            }

            tempChairIDArr.push(chairIDArr[i]);
            tempRoteArr.push(roteArr[i]);
        }

        roomAPI.gameMessageNotify(gameProto.gameRobotFireNotify(chairIDArr, roteArr));
    },

    onChangeAutoFire: function (isStart) {
        this.toggleAutoFire.isChecked = isStart;

        if (isStart) {
            this.onChangeLockFishState(false);
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
            this.onChangeAutoFire(false);
            // 修改开火控制器状态
            this.fireControlWidgetCtrl.onChangeLockFishState(true, this.onSelectLockFish.bind(this));
        } else {
            this.toggleLockFish.isChecked = false;
            // 修改开火控制器状态
            this.fireControlWidgetCtrl.onChangeLockFishState(false);
            this.fireControlWidgetCtrl.stopLockFire();
            // 取消锁定目标
            roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(-1));
            // 更新状态
            this.onUserLockFish(this.selfChairID, -1);
        }
    },

    onSelectLockFish: function (targetWorldPoint) {
        if (!this.gameInited) return;
        // 如果是锁定目标状态，则选择锁定目标
        let selectFishCtrl = null;
        for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
            let ctrl = this.fishWidgetCtrlArr[i];
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
        if (!!selectFishCtrl) {
            roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(selectFishCtrl.fishID));
            this.onUserLockFish(this.selfChairID, selectFishCtrl.fishID);

            this.fireControlWidgetCtrl.startLockFire(selectFishCtrl);
        }
    },

    selectedLockFishLeaved: function () {
        let selectFishCtrl = null;
        for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
            let ctrl = this.fishWidgetCtrlArr[i];
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
            roomAPI.gameMessageNotify(gameProto.gameLockFishNotify(selectFishCtrl.fishID));
            this.onUserLockFish(this.selfChairID, selectFishCtrl.fishID);

            this.fireControlWidgetCtrl.startLockFire(selectFishCtrl);
        } else {
            this.onChangeLockFishState(false);
        }
    },

    onUserLockFish: function (chairID, fishID) {
        let cannonCtrl = this.cannonWidgetCtrlList[chairID];
        if (!cannonCtrl) return;
        // 取消锁定
        if (fishID < 0) {
            cannonCtrl.onLockFish(null);
            if (chairID === this.selfChairID) {
                this.fireControlWidgetCtrl.stopLockFire();
                if (!!this.lockFishCtrlArr[chairID]) {
                    this.lockFishCtrlArr[chairID].listenerOutScene(false);
                }
            }
            this.lockFishCtrlArr[chairID] = null;
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
            // 如果是自己，则监听该鱼移动出屏幕的回调
            if (chairID === this.selfChairID) {
                fishCtrl.listenerOutScene(true);
                if (!!this.lockFishCtrlArr[chairID]) {
                    this.lockFishCtrlArr[chairID].listenerOutScene(false);
                }
            }
            this.lockFishCtrlArr[chairID] = fishCtrl;
        }
    },

    onOtherUserFire: function (data) {
        if (!this.gameInited) return;
        if (data.chairID === this.selfChairID) return;
        this.onFire(data.chairID, data.rote);
    },

    onSelfFire: function (targetWorldPoint) {
        if (!this.gameInited) return;
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
        this.fireControlWidgetCtrl.bulletCountChange(1);
        // 计算角度
        let cannonPos = this.bulletRoot.convertToNodeSpaceAR(ctrl.getCannonWorldPos());
        let targetPoint = this.bulletRoot.convertToNodeSpaceAR(targetWorldPoint);
        let unitVector = utils.getUnitVector(cannonPos, targetPoint);
        let mathRote = Math.acos(unitVector.x) / Math.PI * 180;
        if (unitVector.y < 0) mathRote *= -1;
        this.onFire(this.selfChairID, mathRote);
    },

    onFire: function (chairID, mathRote) {
        if (!this.gameInited) return;
        let ctrl = this.cannonWidgetCtrlList[chairID];
        if (!ctrl) {
            console.error("not find ctrl");
            return;
        }
        if (ctrl.posIndex >= 2) mathRote += 180;
        let cannonPos = this.bulletRoot.convertToNodeSpaceAR(ctrl.getCannonWorldPos());
        // 创建炮弹
        let node = cc.instantiate(this.bulletWidgetPrefab);
        node.parent = this.bulletRoot;
        let bulletCtrl = node.getComponent('BulletWidgetCtrl');
        bulletCtrl.initWidget(chairID, 0, this.onBeShot.bind(this));
        bulletCtrl.emit(cannonPos, mathRote, this.lockFishCtrlArr[chairID]);
        //this.bulletWidgetCtrlArr.push(bulletCtrl);
        // 播放炮台动画
        ctrl.onFire(mathRote);
        // 更新金币
        ctrl.goldChange(ctrl.powerIndex * this.baseScore * -1, false);
        // 发送服务器通知
        if (chairID === this.selfChairID) {
            roomAPI.gameMessageNotify(gameProto.gameFireNotify(mathRote));
        }
    },

    onBeShot: function (bullet, fishCtrl) {
        // 移除子弹
        bullet.onShootFish();
        // 播放爆炸动画
        let boomAnim = cc.instantiate(this.bulletBoomAnimationWidgetPrefab);
        boomAnim.parent = this.bulletRoot;
        boomAnim.position = bullet.node.position;
        let boomCtrl = boomAnim.getComponent("SpriteFrameAnimationWidgetCtrl");
        boomCtrl.initAnimation();
        boomCtrl.startAnimation(false, 1, function () {
            boomCtrl.node.destroy();
        });
        // 播放鱼被打中效果
        fishCtrl.onBeShot();
        // 向服务器发送鱼被打消息
        if (bullet.ownerChairID === this.selfChairID) {
            this.fireControlWidgetCtrl.bulletCountChange(-1);
            roomAPI.gameMessageNotify(gameProto.gameCaptureNotify(fishCtrl.fishID));
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
        if (!fishCtrl) {
            console.error("not find fish id");
            return;
        }
        // 播放金币动画
        let cannonCtrl = this.cannonWidgetCtrlList[data.chairID];
        if (!cannonCtrl) {
            console.error("not find cannon ctrl");
            return;
        }
        this.effectCtrl.fishCapture(data.gainGold, fishCtrl, cannonCtrl);
        // 删除鱼
        fishCtrl.onCapture();
        // 如果是锁定鱼被打死，则取消锁定
        for (let i = 0; i < this.lockFishCtrlArr.length; ++i) {
            if (this.lockFishCtrlArr[i] === fishCtrl) {
                if (i === this.selfChairID) {
                    this.selectedLockFishLeaved();
                } else {
                    this.onUserLockFish(i, -1);
                }
            }
        }
    },

    addFish: function (fishInfo) {
        let node = cc.instantiate(this.fishWidgetPrefab);
        let ctrl = node.getComponent("FishWidgetCtrl");
        node.parent = this.fishRoot;
        ctrl.initWidget(fishInfo, Date.now() + this.serverOffsetTime, this.selfChairID >= 2, this.onFishLeaved.bind(this));
        this.fishWidgetCtrlArr.push(ctrl);
    },

    onFishLeaved: function (ctrl, event) {
        if (event === 'leave') {
            for (let i = 0; i < this.fishWidgetCtrlArr.length; ++i) {
                if (this.fishWidgetCtrlArr[i] === ctrl) {
                    this.fishWidgetCtrlArr.splice(i, 1);
                    break;
                }
            }
            ctrl.onRemove();
            if (this.lockFishCtrlArr[this.selfChairID] === ctrl) {
                this.selectedLockFishLeaved();
            }
        } else if (event === 'outScene') {
            if (this.lockFishCtrlArr[this.selfChairID] === ctrl) {
                this.selectedLockFishLeaved();
            }
        }
    },

    onSelfCannonPowerChange: function (powerIndex) {
        if (powerIndex <= 0 || powerIndex > 10) {
            console.error("onSelfCannonPowerChange index err:" + powerIndex);
            return;
        }
        this.onChangeCannonPower(this.selfChairID, powerIndex);
        roomAPI.gameMessageNotify(gameProto.gameChangeCannonNotify(powerIndex));
    },

    onChangeCannonPower: function (chairID, index) {
        let ctrl = this.cannonWidgetCtrlList[chairID];
        if (!ctrl) {
            console.error("onChangeCannonPower err: not find ctrl");
            return;
        }
        ctrl.onChangeCannonPower(index * this.baseScore, index);
    }
});
