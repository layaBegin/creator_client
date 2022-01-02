let utils = require("../../Shared/utils");

let FIRE_INTERVAL_TIME = 0.3;
let MAX_BULLET_COUNT = 30;
let AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME = 0.3;
let LOCK_FIRE_UPDATE_POS_INTERVAL_TIME = 1;
let SPEED_FIRE_TIME = 0.15;

cc.Class({
    extends: cc.Component,

    properties: {
    },

    start() {
        this.fireTargetPoint = null;
        this.lastFireTime = 0;
        this.bulletCount = 0;
        this.stopAutoFireCallback = null;
        this.lockedFishCtrl = null;
        this.isOnLockFishState = false;
        this.selectLockFishCallback = null;

        this.robotOperationTimer = -1;

        // 机器人操作信息
        this.robotChairIDArr = [];
        this.robotFireCallback = null;
        this.robotFireRoteArr = [-1, -1, -1, -1];

        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            let touchStartPos = this.node.convertToNodeSpace(event.getLocation());
            this.onTouchEvent(cc.Node.EventType.TOUCH_START, touchStartPos);
        }.bind(this));

        this.node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            let touchStartPos = this.node.convertToNodeSpace(event.getLocation());
            this.onTouchEvent(cc.Node.EventType.TOUCH_MOVE, touchStartPos);
        }.bind(this));

        this.node.on(cc.Node.EventType.TOUCH_END, function () {
            this.onTouchEvent(cc.Node.EventType.TOUCH_END);
        }.bind(this));

        this.autoFireFlag = false;
        this.touchFireFlag = false;
    },

    onDestroy() {
        if (this.robotOperationTimer >= 0) {
            clearInterval(this.robotOperationTimer);
            this.robotOperationTimer = -1;
        }
    },

    initWidget(fireCallback, gunFaceCallBack) {
        this.fireCallback = fireCallback;
        this.gunFaceCallBack = gunFaceCallBack;
    },

    setSpeedSkill: function (isSpeedSkill) {
        this.isSpeedSkill = isSpeedSkill;
        if (this.touchFireFlag === true) {
            this.unscheduleAllCallbacks();
            let intervalTime = FIRE_INTERVAL_TIME;
            if (this.isSpeedSkill === true) {
                intervalTime = SPEED_FIRE_TIME;
            }
            this.schedule(this.onFire.bind(this), intervalTime);//非自动开火过程中压下开始连续开火
        }
        if (this.autoFireFlag === true) {
            this.unscheduleAllCallbacks();
            let intervalTime = AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME;
            if (this.isSpeedSkill === true) {
                intervalTime = SPEED_FIRE_TIME;
            }
            this.schedule(this.onFire.bind(this), intervalTime);
        }
    },

    onTouchEvent: function (eventType, targetPoint) {
        if (this.isOnLockFishState) {
            if (eventType === cc.Node.EventType.TOUCH_START) {//锁定状态下，触屏选择锁定目标，如果没有点中鱼直接开火
                this.fireTargetPoint = targetPoint;
                utils.invokeCallback(this.selectLockFishCallback, targetPoint);
            }
            return;
        }
        if (eventType === cc.Node.EventType.TOUCH_START) {
            // this.stopAutoFire();
            this.fireTargetPoint = targetPoint;
            if (this.autoFireFlag != true) {
                this.onFire();
                let intervalTime = FIRE_INTERVAL_TIME;
                if (this.isSpeedSkill === true) {
                    intervalTime = SPEED_FIRE_TIME;
                }
                this.schedule(this.onFire.bind(this), intervalTime);//非自动开火过程中压下开始连续开火
                this.touchFireFlag = true;
            }
        } else if (eventType === cc.Node.EventType.TOUCH_MOVE) {
            this.fireTargetPoint = targetPoint;
            if (!!this.gunFaceCallBack) {
                this.gunFaceCallBack(targetPoint);
            }
        } else if (eventType === cc.Node.EventType.TOUCH_END) {
            if (this.autoFireFlag != true) {
                this.unscheduleAllCallbacks();//非自动开火过程中停止计时器
                this.touchFireFlag = false;
            }
        }
    },

    onFire: function () {
        if (this.bulletCount >= MAX_BULLET_COUNT) {
            // Tip.makeText("发射的炮弹太多");
            return;
        }
        // if (Date.now() - this.lastFireTime <= FIRE_INTERVAL_TIME * 900) {
        //     // Tip.makeText("连续发射时间太短");
        //     console.log("fire fail interval time too short");
        //     return;
        // }
        this.lastFireTime = Date.now();
        if (!!this.fireCallback) {
            this.fireCallback(this.fireTargetPoint);
        }
        this.fireTargetPoint = null;
    },

    bulletCountChange: function (changeCount) {
        this.bulletCount += changeCount;
    },

    autoFire: function (cb) {
        this.unscheduleAllCallbacks();
        // this.autoSelectTarget();
        // this.schedule(this.autoSelectTarget.bind(this), AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME);
        this.autoFireFlag = true;
        this.onFire();

        let intervalTime = AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME;
        if (this.isSpeedSkill === true) {
            intervalTime = SPEED_FIRE_TIME;
        }
        this.schedule(this.onFire.bind(this), intervalTime);

        this.stopAutoFireCallback = cb;
    },

    autoSelectTarget: function () {
        this.fireTargetPoint = cc.v2(0, 0);
        let windowSize = cc.view.getVisibleSize();
        this.fireTargetPoint.x = utils.getRandomNum(200, windowSize.width);
        this.fireTargetPoint.y = utils.getRandomNum(200, windowSize.height);
    },

    stopAutoFire: function () {
        this.autoFireFlag = false;
        if (!this.stopAutoFireCallback) return;
        this.stopAutoFireCallback();
        this.stopAutoFireCallback = null;
        this.unscheduleAllCallbacks();
    },

    onChangeLockFishState: function (on, selectLockFishCallback) {
        this.isOnLockFishState = on;
        this.selectLockFishCallback = selectLockFishCallback || null;
    },

    startLockFire: function (fishCtrl) {
        if (!fishCtrl || !fishCtrl.node) return;
        this.unscheduleAllCallbacks();

        this.lockedFishCtrl = fishCtrl;

        this.lockTargetPos();
        this.schedule(this.lockTargetPos.bind(this), LOCK_FIRE_UPDATE_POS_INTERVAL_TIME);
        if (this.autoFireFlag === true) {
            this.onFire();
            let intervalTime = AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME;
            if (this.isSpeedSkill === true) {
                intervalTime = SPEED_FIRE_TIME;
            }
            this.schedule(this.onFire.bind(this), intervalTime);
        }
    },

    lockTargetPos: function () {
        if (!this.lockedFishCtrl || !this.lockedFishCtrl.node) {
            return;
        }
        if (!!this.lockedFishCtrl.node.parent) {
            this.fireTargetPoint = this.lockedFishCtrl.node.parent.convertToWorldSpaceAR(this.lockedFishCtrl.node.position);
        }
    },

    stopLockFire: function () {
        this.lockedFishCtrl = null;
        this.unscheduleAllCallbacks();
        if (this.autoFireFlag === true) {
            this.fireTargetPoint = null;
            this.onFire();

            let intervalTime = AUTO_FIRE_CHANGE_TARGET_INTERVAL_TIME;
            if (this.isSpeedSkill === true) {
                intervalTime = SPEED_FIRE_TIME;
            }
            this.schedule(this.onFire.bind(this), intervalTime);
        }
    },

    //朝锁定鱼的位置开火
    fireToLockFish: function () {
        if (!!this.lockedFishCtrl) {
            if (this.autoFireFlag === true) {
                return;
            }
            this.unscheduleAllCallbacks();
        }
        this.onFire();
    },

});
