let utils = require("../../Shared/utils");
let gameProto = require("./API/LiKuiBuYuProto");
let fishConfig = require("./API/LiKuiBuYuConfig");

var CALCULUS_SECTION = 1 / 100;     // 微积分切片

cc.Class({
    extends: cc.Component,

    properties: {
        fishSprite: cc.Sprite,
        fishShadowSprite: cc.Sprite,
        fishCollider: cc.PolygonCollider,
        dasanyuan: cc.Node,
        dasixi: cc.Node,
        fishKing: cc.Node,
        dasanyuanFish: [cc.Sprite],
        dasixiFish: [cc.Sprite],

        rewardTimeLabel: cc.Label,
    },

    start() {
        if (this.isPictrue === true) {
            return;
        }
        this.lastPos = this.node.position;

        this.fishSpriteFrameArr = this.fishSpriteFrameArr || [];
        this.isFixScreen = false;
        // this.startMove();
        if (this.isFishArr != true) {
            this.runMoveAction();

            let self = this;
            this.node.runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(function () {
                if (!!self.moveAction && !!self.moveTime) {
                    if (self.moveAction.setElapsed) {
                        self.moveAction.setElapsed(self.moveAction.getElapsed + self.moveTime + 0.1);
                    } else {
                        self.moveAction._elapsed += self.moveTime + 0.1;
                    }
                }
            })));
        }

        this.startAnimation();
        this.listenerOutSenceEvent = false;
    },

    onDestroy() {

    },

    initWidget(fishInfo, callback, fishDelay, moveTime) {
        this.isFishArr = false;
        this.fishInfo = fishInfo;
        this.fishID = fishInfo.fishID;
        this.moveTime = moveTime;
        this.fishDelay = fishDelay;
        this.fishTypeID = fishInfo.fishTypeID;
        this.isRedFish = fishInfo.isRedFish;
        this.fishTypeInfo = fishConfig.fishType[this.fishTypeID];
        if (this.fishTypeID == fishConfig.FishKind.DaSanYuan) {
            this.dasanyuan.active = true;
            this.fishTypeInfo = fishConfig.fishType[fishInfo.fishKind];
        } else if (this.fishTypeID == fishConfig.FishKind.DaSiXi) {
            this.dasixi.active = true;
            this.fishTypeInfo = fishConfig.fishType[fishInfo.fishKind];
        } else if (this.fishTypeID == fishConfig.FishKind.FishKing) {
            this.fishKing.active = true;
            this.fishTypeInfo = fishConfig.fishType[fishInfo.fishKind];
        }
        this.fishKind = fishInfo.fishKind;
        this.fishTraceType = fishInfo.fishTraceType;
        this.pathArr = fishInfo.pathArr;

        let windowSize = cc.view.getVisibleSize();
        if (!!fishInfo.pathArr) {
            let len = fishInfo.pathArr.length;
            this.fishPath = [];
            for (let i = 0; i < len; ++i) {
                let position = new cc.Vec2();
                position.x = (fishInfo.pathArr[i].x - 0.5) * windowSize.width;
                position.y = (fishInfo.pathArr[i].y - 0.5) * windowSize.height;
                this.fishPath[i] = position;
            }
        }
        else {
            cc.log("鱼的数据有问题");
        }

        this.speed = this.fishTypeInfo.moveSpeed;

        // let urlArr = [];
        // for (let i = 1; i <= this.fishTypeInfo.frameCount; ++i) {
        //     let tempStr = i.toString();
        //     if (i < 10) {
        //         tempStr = "0" + i;
        //     }
        //     let fishNo = this.fishTypeInfo.resIndex + 1;
        //     urlArr.push("LiKuiBuYu/Fish/fish" + fishNo + "_" + tempStr);
        // }
        let fishNo = this.fishTypeInfo.resIndex + 1;
        let fishUrl = "LiKuiBuYu/Fish/fish" + fishNo;
        // cc.loader.loadResArray(urlArr, cc.SpriteFrame, function (err, spriteFrameArr) {
        AssetMgr.loadResSync(fishUrl, cc.SpriteAtlas, undefined, function (err, spriteAtlas) {
            if (!!err) {
                console.error(err);
            } else {
                if (!this.node) return;
                this.fishSpriteFrameArr = spriteAtlas.getSpriteFrames();
                this.fishSpriteFrameArr.sort(this.sortFishPic);
                if (this.fishSpriteFrameArr.length > 0) {
                    let spriteFrame = this.fishSpriteFrameArr[0];
                    let rect = spriteFrame.getRect();

                    this.node.width = rect.width;
                    this.node.height = rect.height;

                    this.fishCollider.points = this.fishTypeInfo.points;
                    if (this.fishTypeID === fishConfig.FishKind.DaSanYuan) {
                        this.fishCollider.points = fishConfig.FishPolygonCollider[fishConfig.FishKind.DaSanYuan];
                    }
                    if (this.fishTypeID === fishConfig.FishKind.DaSiXi) {
                        this.fishCollider.points = fishConfig.FishPolygonCollider[fishConfig.FishKind.DaSiXi];
                    }
                    if (this.fishTypeID === fishConfig.FishKind.FishKing) {
                        this.fishCollider.points = fishConfig.FishPolygonCollider[fishConfig.FishKind.FishKing];
                    }

                    this.fishSprite.node.width = this.node.width;
                    this.fishSprite.node.height = this.node.height;

                    if (this.fishTypeID == fishConfig.FishKind.DaSanYuan) {
                        let len = this.dasanyuanFish.length;
                        for (let i = 0; i < len; ++i) {
                            this.dasanyuanFish[i].node.width = this.node.width;
                            this.dasanyuanFish[i].node.height = this.node.height;
                        }

                    } else if (this.fishTypeID == fishConfig.FishKind.DaSiXi) {
                        let len = this.dasixiFish.length;
                        for (let i = 0; i < len; ++i) {
                            this.dasixiFish[i].node.width = this.node.width;
                            this.dasixiFish[i].node.height = this.node.height;
                        }

                    }
                    this.fishShadowSprite.node.width = this.node.width;
                    this.fishShadowSprite.node.height = this.node.height;
                    if (this.isRedFish === true) {
                        this.fishSprite.node.color = new cc.Color(255, 100, 100, 255);
                    }
                }
            }
        }.bind(this));
        this.callback = callback;
    },

    sortFishPic(a, b) {
        let arr = a.name.split("_");
        let aName = 0;
        if (!!arr[1]) {
            aName = parseInt(arr[1]);
        }
        arr = b.name.split("_");
        let bName = 0;
        if (!!arr[1]) {
            bName = parseInt(arr[1]);
        }
        return aName - bName;
    },

    //鱼阵之前子弹无效
    setBulletNoHit(boo) {
        this.bulletNoHit = boo;
    },

    changeShadow() {
        if (!!this.fishShadowSprite) {
            this.fishShadowSprite.node.x = this.fishShadowSprite.node.x * -1;
            this.fishShadowSprite.node.y = this.fishShadowSprite.node.y * -1;
        }
    },

    startAnimation() {
        let curIndex = 0;
        let spriteFrameCount = this.fishTypeInfo.frameCount;
        this.schedule(function () {
            curIndex = (curIndex + 1) % spriteFrameCount;
            if (!!this.fishSpriteFrameArr[curIndex]) {
                let len = 0;
                if (this.fishTypeID == fishConfig.FishKind.DaSanYuan) {
                    len = this.dasanyuanFish.length;
                    for (let i = 0; i < len; ++i) {
                        this.dasanyuanFish[i].spriteFrame = this.fishSpriteFrameArr[curIndex];
                    }
                } else if (this.fishTypeID == fishConfig.FishKind.DaSiXi) {
                    len = this.dasixiFish.length;
                    for (let i = 0; i < len; ++i) {
                        this.dasixiFish[i].spriteFrame = this.fishSpriteFrameArr[curIndex];
                    }
                }
                else {
                    this.fishSprite.spriteFrame = this.fishSpriteFrameArr[curIndex];
                    this.fishShadowSprite.spriteFrame = this.fishSpriteFrameArr[curIndex];
                }
            }
        }.bind(this), 0.1);
    },

    // 被打中
    onBeShot() {
        if (this.isRedFish === true) {//红鱼不做变化
            return;
        }
        this.redState = true;
        this.showRedState();
        this.scheduleOnce(function () {
            this.redState = false;
            this.showRedState();
        }.bind(this), 0.6);
    },

    showRedState() {
        let fishColor = new cc.Color(255, 100, 100, 255);
        if (this.redState != true) {
            fishColor = new cc.Color(255, 255, 255, 255);
        }
        if (this.fishTypeID == fishConfig.FishKind.DaSanYuan) {
            let len = this.dasanyuanFish.length;
            for (let i = 0; i < len; ++i) {
                this.dasanyuanFish[i].node.color = fishColor;
            }
        } else if (this.fishTypeID == fishConfig.FishKind.DaSiXi) {
            let len = this.dasixiFish.length;
            for (let i = 0; i < len; ++i) {
                this.dasixiFish[i].node.color = fishColor;
            }
        }
        else {
            this.fishSprite.node.color = fishColor;
        }
    },

    onRemove() {
        this.unscheduleAllCallbacks();
        if (!!this.node) {
            this.node.stopAllActions();
            this.node.destroy();
        }
    },

    onFadeRemove() {
        if (!!this && !!this.node) {
            this.node.runAction(cc.sequence(cc.fadeOut(0.1), cc.callFunc(function () {
                this.onRemove();
            }.bind(this))));
        }
    },

    // 开始监听鱼移除屏幕消息
    listenerOutScene: function (isStart) {
        // cc.log("[锁定鱼]监听鱼[" + this.fishID + "]出屏幕事件:" + isStart);
        this.listenerOutSenceEvent = isStart;
    },

    isInScene: function () {
        let node = this.node;
        if (!node) return false;
        let parent = this.node.parent;
        if (!!parent) {
            if (node.x > parent.width * 0.5) {
                return false;
            }
            if (node.x < parent.width * -0.5) {
                return false;
            }
            if (node.y > parent.height * 0.5) {
                return false;
            }
            if (node.y < parent.height * -0.5) {
                return false;
            }
            return true;
        }
        return false;
    },

    update() {
        if (this.isPictrue === true) {
            return;
        }
        if (!!this.fishInfo) {
            if (this.fishInfo.fishTraceType != fishConfig.FishTraceType.MultiLine) {//多点直线移动不需要重复计算位置和角度
                //更新游动方向
                if (!this.fishTypeInfo.fixedRotation) {
                    let unitVector = utils.getUnitVector(this.lastPos, this.node.position);
                    if (unitVector.x !== 0 || unitVector.y !== 0) {
                        this.node.rotation = Math.acos(unitVector.x) / Math.PI * -180;
                        if (unitVector.y < 0) {
                            this.node.rotation *= -1;
                        }
                        // this.fishSprite.node.rotation = this.fishShadowSprite.node.rotation;
                        this.lastPos = this.node.position;
                    }
                } else {
                    if (!this.fishTypeInfo.fixedDir) {
                        let unitVector = utils.getUnitVector(this.lastPos, this.node.position);
                        if (unitVector.x >= 0) {
                            this.node.scaleX = 1;
                        } else {
                            this.node.scaleX = -1;
                        }
                    }
                }
            }
        } else {
            let unitVector = utils.getUnitVector(this.lastPos, this.node.position);
            if (unitVector.x !== 0 || unitVector.y !== 0) {
                this.node.rotation = Math.acos(unitVector.x) / Math.PI * -180;
                if (unitVector.y < 0) {
                    this.node.rotation *= -1;
                }
                // this.fishSprite.node.rotation = this.fishShadowSprite.node.rotation;
                this.lastPos = this.node.position;
            }
        }
        // 计算鱼是否移动出去
        if (this.listenerOutSenceEvent) {
            let inScene = this.isInScene();
            if (inScene === false) {
                this.isOutScene = true;
                utils.invokeCallback(this.callback, this, "outScene");
                this.listenerOutSenceEvent = false;
            }
        }
    },

    //播放行为
    runMoveAction: function (moveAction) {
        this.lastPos = this.node.position;
        if (moveAction == null) {
            moveAction = this.createMoveAction();
        }
        if (!!moveAction) {
            moveAction = cc.sequence(moveAction, cc.fadeOut(0.1), cc.callFunc(function () {
                if (!!this && !!this.node) {
                    this.isOutScene = true;
                    utils.invokeCallback(this.callback, this, "outScene");
                    this.onRemove();
                }
            }.bind(this)));
            this.moveAction = moveAction;
            this.node.runAction(this.moveAction);
        }
    },

    createMoveAction: function () {
        let action = null;
        let self = null;
        let dis = null;
        let dt = null;
        let fishAction = null;

        switch (this.fishInfo.fishTraceType) {
            case fishConfig.FishTraceType.Linear:
                dis = this.getPointsDistance(this.fishPath[0], this.fishPath[1]);
                dt = dis / this.speed;
                fishAction = cc.moveTo(dt, this.fishPath[1]);
                if (!!this.fishDelay) {
                    action = cc.sequence(cc.place(this.fishPath[0]), cc.hide(), cc.delayTime(this.fishDelay), cc.show(), fishAction);
                } else {
                    action = cc.sequence(cc.place(this.fishPath[0]), fishAction);
                }
                break;
            case fishConfig.FishTraceType.Bezier:
                // let LiKuiBuYuBezierBy = require("./LiKuiBuYuFishBezierBy");
                // let action = new LiKuiBuYuBezierBy();
                // let action = new LiKuiBuYuFishBezierBy();
                // action.setInfo(this.speed, this.fishPath[0], this.fishPath[3], this.fishPath[1], this.fishPath[2]);
                // action = cc.sequence(cc.place(this.fishPath[0]), action);
                let len = this.fishPath.length;
                dis = this.getPointsDistance(this.fishPath[0], this.fishPath[len - 1]);
                dt = dis / this.speed;
                fishAction = cc.moveTo(dt, this.fishPath[len - 1]);

                if (!!this.fishDelay) {
                    action = cc.sequence(cc.place(this.fishPath[0]), cc.hide(), cc.delayTime(this.fishDelay), cc.show(), fishAction);
                } else {
                    action = cc.sequence(cc.place(this.fishPath[0]), fishAction);
                }
                break;
            case fishConfig.FishTraceType.CatmullRom:
                dis = this.catmullCalcLength(this.fishPath[0], this.fishPath);
                dt = dis / this.speed;
                let action1 = cc.place(this.fishPath[0]);
                let action2 = cc.catmullRomTo(dt, this.fishPath);
                if (!!this.fishDelay) {
                    action = cc.sequence(action1, cc.hide(), cc.delayTime(this.fishDelay), cc.show(), action2);
                } else {
                    action = cc.sequence(action1, action2);
                }
                break;
            case fishConfig.FishTraceType.MultiLine:
                self = this;
                action = cc.place(this.fishPath[0]);
                let preRotate = 0;
                for (let i = 1; i < this.fishPath.length; ++i) {
                    let rotate = this.calcRotation(this.fishPath[i - 1], this.fishPath[i]);
                    dis = this.getPointsDistance(this.fishPath[i - 1], this.fishPath[i]);
                    let dt = dis / this.speed;
                    let rotateDt = Math.abs((rotate - preRotate) / 360);
                    action = cc.sequence(action, cc.spawn(cc.delayTime(rotateDt), cc.callFunc(function () {
                        let action = cc.rotateTo(rotateDt, rotate);
                        if (self.fishSprite instanceof Array) {
                            for (let i = 0; i < self.fishSprite.length; ++i) {
                                self.fishSprite[i].node.runAction(action.clone());
                                if (!!self.fishShadowSprite[i]) {
                                    self.fishShadowSprite[i].node.runAction(action.clone());
                                }
                            }
                        }
                        else {
                            self.fishSprite.node.runAction(action.clone());
                            if (!!self.fishShadowSprite) {
                                self.fishShadowSprite.node.runAction(action.clone());
                            }
                        }
                    })), cc.moveTo(dt, this.fishPath[i]).easing(cc.easeSineOut()));
                    preRotate = rotate;
                }
                break;
            default:
                console.log("default fish ..未标明鱼路径鱼");
                action = cc.delayTime(0);
                break;
        }
        if (this.delayTime > 0) {
            action = cc.sequence(cc.delayTime(this.delayTime), action);
        }
        return action;
    },

    catmullCalcLength: function (st, points) {
        let deltaT = 1 / (points.length - 1);
        let tension = 0.5;
        let self = this;
        let update = function (dt) {
            let p, lt;
            let ps = points;
            if (dt === 1) {
                p = ps.length - 1;
                lt = 1;
            } else {
                let locDT = deltaT;
                p = 0 | (dt / locDT);
                lt = (dt - locDT * p) / locDT;
            }
            let point0 = self.getControlPointAt(ps, p - 1);
            let point1 = self.getControlPointAt(ps, p - 0);
            let point2 = self.getControlPointAt(ps, p + 1);
            let point3 = self.getControlPointAt(ps, p + 2);
            let newPos = self.cardinalSplineAt(point0, point1, point2, point3, tension, lt);
            return newPos;
        };
        let prePos = st;
        let sum = 0;
        for (let st = 0; st <= 1; st += CALCULUS_SECTION) {
            let now = update(st);
            sum += this.getPointsDistance(prePos, now);
            prePos = now;
        }
        return sum;
    },

    calcRotation: function (st, ed) {
        let angle = Math.atan2(ed.y - st.y, ed.x - st.x);
        let rotation = -angle * 180.0 / Math.PI;
        return rotation;
    },

    getControlPointAt: function (controlPoints, pos) {
        var p = Math.min(controlPoints.length - 1, Math.max(pos, 0));
        return controlPoints[p];
    },

    getPointsDistance: function (point0, point1) {
        let position0 = new cc.Vec2(point0.x, point0.y);
        let position1 = new cc.Vec2(point1.x, point1.y);
        let dis = position0.sub(position1).mag();
        return dis;
    },

    cardinalSplineAt: function (p0, p1, p2, p3, tension, t) {
        let t2 = t * t;
        let t3 = t2 * t;

        let s = (1 - tension) / 2;
        let b1 = s * ((-t3 + (2 * t2)) - t);
        let b2 = s * (-t3 + t2) + (2 * t3 - 3 * t2 + 1);
        let b3 = s * (t3 - 2 * t2 + t) + (-2 * t3 + 3 * t2);
        let b4 = s * (t3 - t2);

        let x = (p0.x * b1 + p1.x * b2 + p2.x * b3 + p3.x * b4);
        let y = (p0.y * b1 + p1.y * b2 + p2.y * b3 + p3.y * b4);
        return cc.v2(x, y);
    },

    //定屏
    fixScreen: function (isFix) {
        if (!this.node) {
            return;
        }
        if (this.isFixScreen === isFix) {
            return;
        }
        this.isFixScreen = isFix;
        if (this.isFixScreen) {
            this.node.pauseAllActions();
        }
        else {
            this.node.resumeAllActions();
        }
    },

    //设置鱼阵鱼
    setFishArr: function (data, callback) {
        this.isFishArr = true;
        this.fishID = data.fishID;
        this.fishTypeID = data.fishTypeID;
        this.fishIndex = data.fishIndex;
        this.fishTypeInfo = fishConfig.fishType[this.fishTypeID];

        this.speed = this.fishTypeInfo.moveSpeed;

        // let urlArr = [];
        // for (let i = 1; i <= this.fishTypeInfo.frameCount; ++i) {
        //     let tempStr = i.toString();
        //     if (i < 10) {
        //         tempStr = "0" + i;
        //     }
        //     let fishNo = this.fishTypeInfo.resIndex + 1;
        //     urlArr.push("LiKuiBuYu/Fish/fish" + fishNo + "_" + tempStr);
        // }
        let fishNo = this.fishTypeInfo.resIndex + 1;
        let fishUrl = "LiKuiBuYu/Fish/fish" + fishNo;
        AssetMgr.loadResSync(fishUrl, cc.SpriteAtlas, undefined, function (err, spriteAtlas) {
            if (!!err) {
                console.error(err);
            } else {
                if (!this.node) return;
                this.fishSpriteFrameArr = spriteAtlas.getSpriteFrames();
                this.fishSpriteFrameArr.sort(this.sortFishPic);
                if (this.fishSpriteFrameArr.length > 0) {
                    let spriteFrame = this.fishSpriteFrameArr[0];
                    let rect = spriteFrame.getRect();

                    this.node.width = rect.width;
                    this.node.height = rect.height;

                    this.fishCollider.points = this.fishTypeInfo.points;

                    // this.fishCollider.size.width = this.node.width;
                    // this.fishCollider.size.height = this.node.height;

                    this.fishSprite.node.width = this.node.width;
                    this.fishSprite.node.height = this.node.height;

                    this.fishShadowSprite.node.width = this.node.width;
                    this.fishShadowSprite.node.height = this.node.height;
                }
            }
        }.bind(this));
        this.callback = callback;
    },

    //设置鱼阵行为
    setFishArrAction: function (action, actionTime) {
        action = cc.sequence(action, cc.callFunc(function () {
            if (!!this && !!this.node) {
                this.isOutScene = true;
                utils.invokeCallback(this.callback, this, "outScene");
            }
        }.bind(this)), cc.fadeOut(0.1), cc.callFunc(function () {
            this.onRemove();
        }.bind(this)));
        this.moveAction = action;
        this.node.runAction(action);
        if (!!actionTime) {
            this.moveTime = actionTime;
            let self = this;
            this.node.runAction(cc.sequence(cc.delayTime(0.1), cc.callFunc(function () {
                if (!!self.moveAction && !!self.moveTime) {
                    if (self.moveAction.setElapsed) {
                        self.moveAction.setElapsed(self.moveAction.getElapsed + self.moveTime + 0.1);
                    } else {
                        self.moveAction._elapsed += self.moveTime + 0.1;
                    }
                }
            })));
        }
    },

    //显示锁鱼图片
    showFishPic: function (fishTypeID, fishKind, isRedFish) {
        this.clearPicInfo();
        this.isPictrue = true;
        this.node.removeComponent(cc.BoxCollider);
        if (fishTypeID == fishConfig.FishKind.DaSanYuan) {
            this.dasanyuan.active = true;
            this.fishTypeInfo = fishConfig.fishType[fishKind];
        } else if (fishTypeID == fishConfig.FishKind.DaSiXi) {
            this.dasixi.active = true;
            this.fishTypeInfo = fishConfig.fishType[fishKind];
        } else if (fishTypeID == fishConfig.FishKind.FishKing) {
            this.fishKing.active = true;
            this.fishTypeInfo = fishConfig.fishType[fishKind];
        } else {
            this.fishTypeInfo = fishConfig.fishType[fishTypeID];
        }
        let fishNo = this.fishTypeInfo.resIndex + 1;
        let fishUrl = "LiKuiBuYu/Fish/fish" + fishNo;
        let fishName = "fish";
        fishName = fishName + fishNo + "_01";
        let res = cc.loader.getRes(fishUrl, cc.SpriteAtlas);
        if (fishTypeID == fishConfig.FishKind.DaSanYuan) {
            let len = this.dasanyuanFish.length;
            for (let i = 0; i < len; ++i) {
                this.dasanyuanFish[i].spriteFrame = res.getSpriteFrame(fishName);
                this.dasanyuanFish[i].node.active = true;
            }
        } else if (fishTypeID == fishConfig.FishKind.DaSiXi) {
            let len = this.dasixiFish.length;
            for (let i = 0; i < len; ++i) {
                this.dasixiFish[i].spriteFrame = res.getSpriteFrame(fishName);
                this.dasixiFish[i].node.active = true;
            }
        } else {
            this.fishSprite.spriteFrame = res.getSpriteFrame(fishName);
            this.fishSprite.node.active = true;
        }
        if (isRedFish === true) {
            this.fishSprite.node.color = new cc.Color(255, 100, 100, 255);
        }
    },

    clearPicInfo: function () {
        this.dasanyuan.active = false;
        let children = this.dasanyuan.getChildren();
        let len = children.length;
        let ani = null;
        for (let i = 0; i < len; ++i) {
            ani = children[i].getComponent(cc.Animation);
            if (!!ani) {
                ani.enabled = false;
            }
        }
        this.dasixi.active = false;
        children = this.dasixi.getChildren();
        len = children.length;
        for (let i = 0; i < len; ++i) {
            ani = children[i].getComponent(cc.Animation);
            if (!!ani) {
                ani.enabled = false;
            }
        }
        this.fishKing.active = false;
        ani = this.fishKing.getComponent(cc.Animation);
        if (!!ani) {
            ani.enabled = false;
        }
        len = this.dasanyuanFish.length;
        for (let i = 0; i < len; ++i) {
            this.dasanyuanFish[i].node.active = false;
        }
        len = this.dasixiFish.length;
        for (let i = 0; i < len; ++i) {
            this.dasixiFish[i].node.active = false;
        }
        this.fishSprite.node.active = false;
        this.fishSprite.node.color = new cc.Color(255, 255, 255, 255);
    },

    showReward(timeValue) {
        if (!!this.rewardTimeLabel) {
            this.rewardTimeLabel.string = timeValue.toString();
        }
    },
});