let roomProto = require("../../API/RoomProto");

let GOLD_BACK_TIME = 0.4;

cc.Class({
    extends: cc.Component,

    properties: {
        gameHeadRichCtrlArr: [require("GameHeadController")],
        gameHeadSelfCtrl: require("GameHeadController"),
        gameHeadShenSuanZiCtrl: require("GameHeadController"),
        onlineNode: cc.Node,
        betRootNode: cc.Node,
        bankNode: cc.Node,
        chipNodeArr: [cc.Node],
        chipJettonLabelArr: [cc.Label],
        selectChipButtonArr: [cc.Button],
        jettonLabelArr: [cc.Label],
        selectedEffect: cc.Node,
        betStartTipNode: cc.Node,
        betStopTipNode: cc.Node,
        waitTipNode: cc.Node,
        tipBgNode: cc.Node,

        otherPlayerWinScoreLabel: cc.Label,
        otherPlayerLoseScoreLabel: cc.Label,
    },

    onLoad() {
        this.chipNumberArr = [1, 10, 50, 100, 500, 1000];
        this.curSelectedChipIndex = 0;
        this.chipArr = [];
        for (let i = 0; i < this.selectChipButtonArr.length; ++i) {
            this.selectChipButtonArr[i].enabled = false;
            this.selectChipButtonArr[i].node.opacity = 150;
        }
        this.userBetCountList = {};

        this.profitPercentage = 0;
        this.kindID = 0;
        this.hideSelectedJetton();

        Global.MessageCallback.addListener("RoomMessagePush", this);

        this.flyToBank = 0.5;
        this.delayTime0 = 0.2;
        this.flyToBet = 0.5;
        this.delayTime1 = 0.2;
        this.flyToPlayer = 0.5;

    },
    updateSelectButtonNum(baseScoreArr) {
        for (let i = 0; i < this.selectChipButtonArr.length; ++i) {
            if (i < baseScoreArr.length) {
                this.selectChipButtonArr[i].node.active = true;
                this.jettonLabelArr[i].string = baseScoreArr[i];
            } else {
                this.selectChipButtonArr[i].node.active = false;
            }
        }
    },

    onDestroy() {
        Global.MessageCallback.removeListener("RoomMessagePush", this);
    },

    messageCallbackHandler(router, msg) {
        if (router === "RoomMessagePush") {
            if (msg.type === roomProto.GET_ROOM_SHOW_USER_INFO_PUSH) {
                this.updateRoomUserInfo(msg.data);
            } else if (msg.type === roomProto.USER_LEAVE_ROOM_RESPONSE) {
                Waiting.hide();
            } else if (msg.type === roomProto.GET_ROOM_SCENE_INFO_PUSH) {
                //this.updateJetton(msg.data.gameData);
            }

        }
    },

    updateJetton(gameData) {
        this.chipNumberArr = gameData.Bettype;
        if (!this.chipNumberArr) {
            this.chipNumberArr = gameData.parameters.baseScoreArr;
        }
        if (!!this.chipNumberArr) {
            let len = this.chipNumberArr.length;
            for (let i = 0; i < len; ++i) {
                this.jettonLabelArr[i].string = this.chipNumberArr[i];
                this.chipJettonLabelArr[i].string = this.chipNumberArr[i];
            }
        }
        if (!!this.chipArr) {
            if (this.chipArr.length > 0) {
                let len = this.chipArr.length;
                for (let i = 0; i < len; ++i) {
                    this.chipArr[i].getChildByName("label").getComponent(cc.Label).string = this.chipNumberArr[this.chipArr[i].typeIndex];
                }
            }
        }

    },

    buttonEvent(event, param) {
        if (param === "exit") {
            Confirm.show("????????????????????????", function () {
                // ???????????????????????????
                Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
                Waiting.show();
            }, function () {});
        } else if (param === "settings") {
            Global.DialogManager.createDialog("Setting/SettingDialog");
        } else if (param === "rule") {
            let ruleInfo = {};
            ruleInfo.kind = this.kindID;
            ruleInfo.profitPercentage = this.profitPercentage;
            Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog", ruleInfo);
        } else if (param === "online") {
            Global.CCHelper.playPreSound();
            Global.DialogManager.createDialog("GameCommon/GameOnlineUser/GameOnlineUserDialog");
        }
    },

    //??????????????????
    requestExit() {
        Confirm.show("????????????????????????", function () {
            // ???????????????????????????
            Global.API.room.roomMessageNotify(roomProto.userLeaveRoomNotify());
            Waiting.show();
        }, function () {});
    },

    //??????????????????
    requestRule() {
        Global.DialogManager.createDialog("GameCommon/GameRule/GameRuleDialog", {
            kind: this.kindID
        });
    },

    betEvent(event, param) {
        if (this.chipNumberArr.hasOwnProperty(param)) {
            Global.CCHelper.playPreSound();
            this.updateChipButtonState(true, param);
        }
    },

    onGameInit(profitPercentage, kindID) {
        // cc.log("????????????????????????????????????");
        // ??????????????????
        Global.API.room.roomMessageNotify(roomProto.getRoomShowUserInfoNotify());

        // ??????????????????
        this.profitPercentage = profitPercentage || 0;

        // kindID
        this.kindID = kindID || 0;
    },

    onReconnection() {
        // ????????????
        for (let i = this.chipArr.length - 1; i >= 0; --i) {
            if (!cc.isValid(this.chipArr[i])) {
                console.error("?????????????????????");
                continue;
            }
            this.chipArr[i].destroy();

        }
        this.chipArr = [];
        // ??????????????????
        this.gameHeadSelfCtrl.updateInfo(null);
        this.gameHeadShenSuanZiCtrl.updateInfo(null);
        for (let i = 0; i < this.gameHeadRichCtrlArr.length; ++i) {
            this.gameHeadRichCtrlArr[i].updateInfo(null);
        }
        // ??????????????????
        this.updateChipButtonState(false);
        this.curSelectedChipIndex = 0;
        // ????????????
        this.betStartTipNode.active = false;
        this.betStopTipNode.active = false;
        this.waitTipNode.active = false;
        this.tipBgNode.active = false;
        // ????????????
        //Global.NetworkManager.disconnect(false);
        this.userBetCountList = {};
    },

    // ????????????
    onGameStart() {
        this.userBetCountList = {};
        // ??????????????????
        Global.API.room.roomMessageNotify(roomProto.getRoomShowUserInfoNotify());
        this.showWait(false);
    },

    // ????????????
    onGameBetStart() {
        if (this.betStartTipNode) {
            this.betStartTipNode.active = true;
            this.betStartTipNode.stopAllActions();
            let db = this.betStartTipNode.getComponent(dragonBones.ArmatureDisplay);
            if (db) {
                db.playAnimation("newAnimation", 1);
                db.on(dragonBones.EventObject.COMPLETE, () => {
                    this.betStartTipNode.active = false;
                });
            } else {
                // ????????????
                this.betStartTipNode.x = -1000;
                let actionIn = cc.moveTo(0.3, cc.v2(0, 0));
                actionIn.easing(cc.easeIn(3.0));
                let actionOut = cc.moveTo(0.3, cc.v2(1000, 0));
                actionOut.easing(cc.easeIn(3.0));
                this.betStartTipNode.runAction(cc.sequence([actionIn, cc.delayTime(0.5), actionOut, cc.callFunc(function () {
                    this.betStartTipNode.active = false;
                }.bind(this))]));
                this.tipBgNode.active = true;
                this.tipBgNode.stopAllActions();
                this.tipBgNode.opacity = 0;
                this.tipBgNode.runAction(cc.sequence([cc.fadeTo(0.2, 255), cc.delayTime(0.7), cc.fadeTo(0.2, 0)]));
            }
        }
        this.selfGold = Global.Player.getPy('gold');
        // ??????????????????
        this.updateChipButtonState(true, this.curSelectedChipIndex);
        // ????????????
        AudioMgr.playSound("GameCommon/Sound/bet_start");
    },

    // ????????????
    onGameBetEnd() {
        if (this.betStopTipNode) {
            // ????????????
            this.betStopTipNode.active = true;
            this.betStopTipNode.stopAllActions();
            this.betStopTipNode.x = -1000;
            let actionIn = cc.moveTo(0.3, cc.v2(0, 0));
            actionIn.easing(cc.easeIn(3.0));
            let actionOut = cc.moveTo(0.3, cc.v2(1000, 0));
            actionOut.easing(cc.easeIn(3.0));
            this.betStopTipNode.runAction(cc.sequence([actionIn, cc.delayTime(0.5), actionOut, cc.callFunc(function () {
                this.betStopTipNode.active = false;
            }.bind(this))]));
            this.tipBgNode.active = true;
            this.tipBgNode.stopAllActions();
            this.tipBgNode.opacity = 0;
            this.tipBgNode.runAction(cc.sequence([cc.fadeTo(0.2, 255), cc.delayTime(0.7), cc.fadeTo(0.2, 0)]));
        }
        // ????????????
        this.updateChipButtonState(false, this.curSelectedChipIndex);
        // ????????????
        AudioMgr.playSound("GameCommon/Sound/bet_stop");
    },

    //????????????????????????
    updateOtherUserPos() {
        this.otherUserBetActionStartPos = Global.CCHelper.getRelativePosition(this.onlineNode, this.betRootNode);
    },

    //????????????
    onGameResult(resultArr) {
        if (this.otherUserBetActionStartPos == null || this.otherUserBetActionStartPos == undefined) {
            this.updateOtherUserPos();
        }
        let self = this;

        function showResult(data) {
            let ctrlArr = self.getGameHeadCtrlByUid(data.uid);
            if (data.score > 0) {
                let uid = data.uid;
                let endPos = self.otherUserBetActionStartPos;
                if (!!ctrlArr[0]) {
                    endPos = Global.CCHelper.getRelativePosition(ctrlArr[0].node, self.betRootNode);
                }
                for (let j = 0; j < self.chipArr.length; ++j) {
                    let chipNode = self.chipArr[j];
                    if (chipNode.ownUid === uid) {
                        chipNode.runAction(cc.sequence([cc.moveTo(GOLD_BACK_TIME, endPos), cc.removeSelf()]));
                        chipNode.ownUid = null;
                    }
                }
            }
            if (ctrlArr.length > 0) {
                setTimeout(function () {
                    if (!cc.isValid(self)) {
                        return;
                    }
                    for (let i = 0; i < ctrlArr.length; ++i) {
                        ctrlArr[i].goldChange(self.userBetCountList[data.uid], false);
                        if (data.score > 0) {
                            ctrlArr[i].goldChange(data.score * (1 - (self.profitPercentage) / 100), (i === 0));
                        } else {
                            ctrlArr[i].goldChange(data.score, (i === 0));
                        }
                    }
                }, 1000 * GOLD_BACK_TIME);
            }
        }

        setTimeout(function () {
            self.showOtherPlayerScoreChange(resultArr);
        }, 1000 * GOLD_BACK_TIME);

        // ????????????????????????
        for (let i = 0; i < resultArr.length; ++i) {
            showResult(resultArr[i]);
        }
        //???????????????????????????????????????
        for (let i = 0; i < this.chipArr.length; ++i) {
            let chipNode = this.chipArr[i];
            if (!!chipNode.ownUid) {
                chipNode.runAction(cc.sequence([cc.moveTo(GOLD_BACK_TIME, this.otherUserBetActionStartPos), cc.removeSelf()]));
                chipNode.ownUid = null;
            }
        }

        this.chipArr = [];
        // ????????????
        AudioMgr.playSound("GameCommon/Sound/win_bet");
    },

    //????????????
    showWait(isShow) {
        this.tipBgNode.active = isShow;
        this.tipBgNode.stopAllActions();
        this.tipBgNode.opacity = 255;
        this.waitTipNode.active = isShow;
    },

    //????????????????????????
    setCacheFlag(isCache) {
        this.isCache = isCache;
    },

    //???????????????????????????
    cacheInitBetInfo(uid, count) {
        if (!!this.isCache) { //?????????return
            return;
        }
        if (this.isUpdateRoomUserInfo != true) { //??????????????????????????????
            if (uid === Global.Player.getPy("uid")) {
                if (!!this.initSelfBetValue) {
                    this.initSelfBetValue += count;
                } else {
                    this.initSelfBetValue = count;
                }
            }
        }
    },

    //????????????
    userBet(uid, count, rect, isTween, showJetton, collider) {
        if (count <= 0) return;
        this.cacheInitBetInfo(uid, count);
        let headCtrl = this.getGameHeadCtrlByUid(uid);
        if (headCtrl.length > 0 && isTween) {
            headCtrl[0].execBet(isTween);
            this.execBet(uid, Global.CCHelper.getRelativePosition(headCtrl[0].node, this.betRootNode), rect, count, isTween, collider);
            // ????????????
            for (let i = 0; i < headCtrl.length; ++i) {
                headCtrl[i].goldChange(count * -1, false);
            }
        } else {
            if (showJetton) {
                if (this.otherUserBetActionStartPos == null || this.otherUserBetActionStartPos == undefined) {
                    this.updateOtherUserPos();
                }
                this.execBet(uid, this.otherUserBetActionStartPos, rect, count, isTween, collider);
            }
        }
        if (uid === Global.Player.getPy("uid")) {
            this.selfGold -= count;
            this.updateChipButtonState(true, this.curSelectedChipIndex);
        }
        if (uid in this.userBetCountList) {
            this.userBetCountList[uid] = this.userBetCountList[uid] + count;
        } else {
            this.userBetCountList[uid] = count;
        }
    },

    execBet(uid, startPosition, rect, count, isTween, collider) {
        if (!Array.isArray(this.chipNumberArr)) return;
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i) {
            let chipNumber = this.chipNumberArr[i];
            let temp = Math.floor(count / chipNumber);
            while (temp-- > 0) {
                count -= chipNumber;
                let endPosition = null;
                if (collider && rect) {
                    let count = 0;
                    while (true) {
                        count++;
                        let endTempPos = cc.v2(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
                        let tempPos = collider.convertToNodeSpaceAR(endTempPos);
                        if (cc.Intersection.pointInPolygon(tempPos, collider.getComponent(cc.PolygonCollider).points)) {
                            endPosition = endTempPos;
                            break;
                        }
                        if (count >= 1000) {
                            endPosition = cc.v2(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
                            break;
                        }
                    }
                } else {
                    endPosition = cc.v2(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
                }

                let node = cc.instantiate(this.chipNodeArr[i]);
                node.betRect = rect;
                node.typeIndex = i;
                node.parent = this.betRootNode;
                if (!!isTween) {
                    node.position = startPosition;
                    node.setScale(0.3);
                    let time = cc.v2(endPosition.x - startPosition.x, endPosition.y - startPosition.y).mag() / 2000;
                    let action = cc.sequence([cc.spawn([cc.scaleTo(time, 1), cc.moveTo(time, endPosition)]), cc.scaleTo(0.3, 0.8)]);
                    node.runAction(action);
                } else {
                    node.setScale(0.8);
                    node.position = endPosition;
                }
                node.ownUid = uid;
                this.chipArr.push(node);
            }
        }
        if (isTween) {
            if (count > 100) {
                AudioMgr.playSound("GameCommon/Sound/bet_big");
            } else {
                AudioMgr.playSound("GameCommon/Sound/bet_small");
            }
        }
    },

    // ???????????????????????????
    getCurChipNumber() {
        return this.chipNumberArr[this.curSelectedChipIndex] || 0;
    },

    // ??????????????????????????????
    updateRoomUserInfo(data) {
        let moveOffsetY = 38;
        this.gameHeadSelfCtrl.updateInfo(data.selfUserInfo.userInfo);
        this.gameHeadSelfCtrl.setMoveOffsetY(moveOffsetY);

        if (this.hideOtherPlayer == false) {
            this.gameHeadShenSuanZiCtrl.updateInfo(!!data.shenSuanZiInfo ? data.shenSuanZiInfo.userInfo : null);
            if (!!data.fuHaoUserInfoArr) {
                for (let i = 0; i < this.gameHeadRichCtrlArr.length; ++i) {
                    this.gameHeadRichCtrlArr[i].updateInfo(!!data.fuHaoUserInfoArr[i] ? data.fuHaoUserInfoArr[i].userInfo : null);
                    if (i > 0) {
                        this.gameHeadRichCtrlArr[i].setMoveOffsetY(moveOffsetY);
                    }
                }
            }
        }
        this.isUpdateRoomUserInfo = true;
        if (!!this.initSelfBetValue) {
            this.gameHeadSelfCtrl.goldChange(this.initSelfBetValue * -1, false);
            this.initSelfBetValue = null;
        }
    },

    // ??????ID??????????????????
    getGameHeadCtrlByUid(uid) {
        let ctrlArr = [];
        if (this.gameHeadSelfCtrl.getUid() === uid) ctrlArr.push(this.gameHeadSelfCtrl);
        if (this.gameHeadShenSuanZiCtrl.getUid() === uid) ctrlArr.push(this.gameHeadShenSuanZiCtrl);
        for (let i = 0; i < this.gameHeadRichCtrlArr.length; ++i) {
            if (this.gameHeadRichCtrlArr[i].getUid() === uid) ctrlArr.push(this.gameHeadRichCtrlArr[i]);
        }
        return ctrlArr;
    },

    // ????????????????????????
    updateChipButtonState(enableBet, selectIndex) {
        this.tempEnableBet = enableBet;
        this.UpdateJettonState = true; //????????????????????????????????????????????????

        this.curSelectedChipIndex = selectIndex;
        if (!!enableBet) {
            if (this.selfGold == -1) {
                return;
            }
            for (let i = 0; i < this.selectChipButtonArr.length; ++i) {
                let chipButton = this.selectChipButtonArr[i];
                if (this.selfGold >= this.chipNumberArr[i]) {
                    chipButton.enabled = true;
                    chipButton.node.opacity = 255;
                } else {
                    chipButton.enabled = false;
                    chipButton.node.opacity = 150;
                }
            }
            this.hideSelectedJetton();

            let selectedButton = this.selectChipButtonArr[selectIndex];
            if (selectedButton.enabled) {
                this.showSelectedJetton(selectedButton.node.getPosition());
            } else {
                if (this.selfGold > this.chipNumberArr[0]) {
                    let tempChip = this.selectChipButtonArr[0];
                    this.showSelectedJetton(tempChip.node.getPosition());
                    this.curSelectedChipIndex = 0;
                }
            }
        } else {
            for (let i = 0; i < this.selectChipButtonArr.length; ++i) {
                let chipButton = this.selectChipButtonArr[i];
                chipButton.enabled = false;
                chipButton.node.opacity = 150;
                chipButton.node.y = 0;
            }

            this.hideSelectedJetton();
            this.curSelectedChipIndex = 0;
            if (!!selectIndex) {
                this.curSelectedChipIndex = selectIndex;
            }
        }
    },

    showSelectedJetton(selectedPos) {
        if (!!this.selectedEffect) {
            this.selectedEffect.active = true;
            this.selectedEffect.position = selectedPos;
            this.selectedEffect.stopAllActions();
            let scaleAction = cc.sequence(cc.scaleTo(1, 1.1, 1.1), cc.scaleTo(1, 1, 1));
            this.repeatAction = cc.repeatForever(scaleAction);
            this.selectedEffect.runAction(this.repeatAction);
        }

    },

    hideSelectedJetton() {
        if (!!this.selectedEffect) {
            this.selectedEffect.stopAllActions();
            this.selectedEffect.active = false;
        }
    },

    //????????????????????????
    setHideOtherPlayer(isHide) {
        this.hideOtherPlayer = isHide;
    },

    //????????????
    newUserBet(uid, count, direction, rect, isTween) {
        if (count <= 0) return;
        this.cacheInitBetInfo(uid, count);
        let headCtrl = this.getGameHeadCtrlByUid(uid);
        if (headCtrl.length > 0 && isTween) {
            headCtrl[0].execBet(isTween);
            this.newExecBet(uid, Global.CCHelper.getRelativePosition(headCtrl[0].node, this.betRootNode), direction, rect, count, isTween);
            // ????????????
            for (let i = 0; i < headCtrl.length; ++i) {
                headCtrl[i].goldChange(count * -1, false);
            }
        } else {
            if (this.otherUserBetActionStartPos == null || this.otherUserBetActionStartPos == undefined) {
                this.updateOtherUserPos();
            }
            this.newExecBet(uid, this.otherUserBetActionStartPos, direction, rect, count, isTween);
        }
        if (uid === Global.Player.getPy("uid")) {
            this.selfGold -= count;
            this.updateChipButtonState(true, this.curSelectedChipIndex);
        }
        if (uid in this.userBetCountList) {
            this.userBetCountList[uid] = this.userBetCountList[uid] + count;
        } else {
            this.userBetCountList[uid] = count;
        }
    },

    newExecBet(uid, startPosition, direction, rect, count, isTween) {
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i) {
            let chipNumber = this.chipNumberArr[i];
            let temp = Math.floor(count / chipNumber);
            while (temp-- > 0) {
                count -= chipNumber;
                let endPosition = cc.v2(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
                let node = cc.instantiate(this.chipNodeArr[i]);
                node.typeIndex = i;
                node.parent = this.betRootNode;
                node.playerPos = startPosition;
                if (!!isTween) {
                    node.position = startPosition;
                    node.setScale(0.3);
                    let time = cc.v2(endPosition.x - startPosition.x, endPosition.y - startPosition.y).mag() / 2000;
                    let action = cc.sequence([cc.spawn([cc.scaleTo(time, 1), cc.moveTo(time, endPosition)]), cc.scaleTo(0.3, 0.8)]);
                    node.runAction(action);
                } else {
                    node.setScale(0.8);
                    node.position = endPosition;
                }
                node.ownUid = uid;
                node.direction = direction;
                this.chipArr.push(node);
            }
        }
        if (isTween) {
            if (count > 100) {
                AudioMgr.playSound("GameCommon/Sound/bet_big");
            } else {
                AudioMgr.playSound("GameCommon/Sound/bet_small");
            }
        }
    },

    // ????????????
    onNewGameResult(resultArr, resultType) {
        if (this.otherUserBetActionStartPos == null || this.otherUserBetActionStartPos == undefined) {
            this.updateOtherUserPos();
        }

        let self = this;
        setTimeout(function () {
            self.showOtherPlayerScoreChange(resultArr);
        }, 1000 * 2);

        this.showJettonFly(resultType);

        function showResult(data) {
            let ctrlArr = self.getGameHeadCtrlByUid(data.uid);
            if (ctrlArr.length > 0) {
                setTimeout(function () {
                    if (!cc.isValid(self)) {
                        return;
                    }
                    for (let i = 0; i < ctrlArr.length; ++i) {
                        if (data.uid === Global.Player.getPy("uid")) {} else {
                            ctrlArr[i].goldChange(self.userBetCountList[data.uid], false);
                        }
                        if (data.score > 0) {
                            let changeValue = data.score * (1 - (self.profitPercentage) / 100);
                            if (data.uid === Global.Player.getPy("uid")) {
                                ctrlArr[i].showChangeGold(changeValue);
                            } else {
                                ctrlArr[i].goldChange(changeValue, (i === 0));
                            }
                        } else {
                            if (data.uid === Global.Player.getPy("uid")) {
                                ctrlArr[i].showChangeGold(data.score);
                            } else {
                                ctrlArr[i].goldChange(data.score, (i === 0));
                            }
                        }
                    }
                }, 1000 * 2);
            }
        }

        //????????????????????????
        for (let i = 0; i < resultArr.length; ++i) {
            showResult(resultArr[i]);
        }
        // for (let i = 0; i < this.chipArr.length; ++i) {
        //     let chipNode = this.chipArr[i];
        //     if (!!chipNode.ownUid) {
        //         chipNode.runAction(cc.sequence([cc.moveTo(GOLD_BACK_TIME, this.otherUserBetActionStartPos), cc.removeSelf()]));
        //         chipNode.ownUid = null;
        //     }
        // }
        // if (this.setJettonLabel != true) {//?????????????????????????????????
        //     this.noLabelJettons = [];
        //     let len = this.chipArr.length;
        //     for (let i = 0; i < len; ++i) {
        //         this.noLabelJettons.push(this.chipArr[i]);
        //     }
        // }
        this.chipArr = [];
        // ????????????
        AudioMgr.playSound("GameCommon/Sound/win_bet");
    },

    //??????????????????
    reduceUserSelfGold(value) {
        this.gameHeadSelfCtrl.reduceGold(value);
    },

    //???????????????????????????
    resetReduceGold() {
        this.gameHeadSelfCtrl.resetReduceGold();
    },

    //??????????????????????????????
    showOtherPlayerScoreChange(resultArr) {
        let len = resultArr.length;
        let playerUid = Global.Player.getPy("uid");
        let changeScore = 0;
        for (let i = 0; i < len; ++i) {
            if (resultArr[i].uid == playerUid) {
                continue;
            }
            changeScore += resultArr[i].score;
        }
        let label = parseFloat(changeScore.toFixed(2)) + "???";
        if (changeScore > 0) {
            if (!!this.otherPlayerWinScoreLabel) {
                label = "+" + label;
                this.otherPlayerWinScoreLabel.string = label;
                this.otherPlayerWinScoreLabel.node.y = 0;
                let labelX = this.otherPlayerWinScoreLabel.node.x;
                this.otherPlayerWinScoreLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(labelX, 60)), cc.delayTime(2), cc.hide()]));
            }
        } else {
            if (!!this.otherPlayerLoseScoreLabel) {
                this.otherPlayerLoseScoreLabel.string = label;
                this.otherPlayerLoseScoreLabel.node.y = 0;
                let labelX = this.otherPlayerLoseScoreLabel.node.x;
                this.otherPlayerLoseScoreLabel.node.runAction(cc.sequence([cc.show(), cc.moveTo(0.6, cc.v2(labelX, 60)), cc.delayTime(2), cc.hide()]));
            }
        }
    },

    //??????????????????
    showJettonFly(resultType) {
        let len = this.chipArr.length;
        for (let i = 0; i < len; ++i) {
            if ((resultType & this.chipArr[i].direction) > 0) {
                let timeNumber = 1;

                this.createWinJetton(this.chipArr[i], timeNumber); //??????????????????????????????

                let actionList = [];
                actionList.push(cc.delayTime(this.flyToBank + this.delayTime0 + this.flyToBet + this.delayTime1));
                actionList.push(cc.moveTo(this.flyToPlayer, this.chipArr[i].playerPos));
                actionList.push(cc.removeSelf());
                this.chipArr[i].runAction(cc.sequence(actionList)); //??????????????????????????????????????????????????????????????????
            } else {
                let actionList = [];
                actionList.push(cc.moveTo(this.flyToBank, this.bankNode.position));
                actionList.push(cc.removeSelf());
                this.chipArr[i].runAction(cc.sequence(actionList)); //???????????????????????????????????????
            }
        }
    },

    //??????????????????
    createWinJetton(tempChip, count) {
        let typeIndex = tempChip.typeIndex;
        let uid = tempChip.ownUid;
        let direction = tempChip.direction;
        let rect = tempChip.betRect;
        let playerPos = tempChip.playerPos;
        for (let i = 0; i < count; ++i) {
            let node = cc.instantiate(this.chipNodeArr[typeIndex]);
            node.parent = this.betRootNode;
            node.position = this.bankNode.position;
            node.setScale(0.8);
            node.ownUid = uid;
            node.direction = direction;
            node.typeIndex = typeIndex;
            this.chipArr.push(node);
            let rectPos = null;
            if (!!rect) {
                rectPos = cc.v2(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
            } else {
                rectPos = tempChip.position;
            }
            let actionList = [];
            actionList.push(cc.delayTime(this.flyToBank + this.delayTime0));
            actionList.push(cc.moveTo(this.flyToBet, rectPos));
            actionList.push(cc.delayTime(this.delayTime1));
            actionList.push(cc.moveTo(this.flyToPlayer, playerPos));
            actionList.push(cc.removeSelf());
            node.runAction(cc.sequence(actionList));
        }
    },

    execBankerGainGold: function (bankerPos, rect) {
        for (let i = 0; i < this.chipArr.length; ++i) {
            let chipNode = this.chipArr[i];
            if (!chipNode) continue;
            if (!rect.contains(chipNode.position)) continue;
            chipNode.runAction(cc.sequence([cc.moveTo(GOLD_BACK_TIME, bankerPos), cc.removeSelf()]));
        }
    },

    execBankerSendGold: function (bankerPos, rect, count) {
        if (count === 0) return;
        for (let i = this.chipNumberArr.length - 1; i >= 0; --i) {
            let chipNumber = this.chipNumberArr[i];
            let temp = Math.floor(count / chipNumber);
            while (temp-- > 0) {
                count -= chipNumber;
                let endPosition = cc.v2(rect.x + Math.random() * rect.width, rect.y + Math.random() * rect.height);
                let node = cc.instantiate(this.chipNodeArr[i]);
                node.parent = this.betRootNode;
                node.position = bankerPos;
                node.setScale(0.3);
                //let time = cc.v2(endPosition.x - bankerPos.x, endPosition.y - bankerPos.y).mag()/2000;
                let action = cc.sequence([cc.spawn([cc.scaleTo(0.4, 1), cc.moveTo(0.4, endPosition)]), cc.scaleTo(0.3, 0.8)]);
                node.runAction(action);
                node.ownUid = -1;
                this.chipArr.push(node);
            }
        }
        AudioMgr.playSound("GameCommon/Sound/bet_small");
    },

});