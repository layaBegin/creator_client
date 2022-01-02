var TWModel = require('./TWModel');
let RoomProto = require('../../API/RoomProto');
let GameProto = require('./TWProto');

cc.Class({
	extends: cc.Component,
	properties: {
		nameLabel: cc.Label,
		scoreLabel: cc.Label,
		typeSprite: cc.Node,

		Label_resultScore: cc.Label,

		vipLabel: cc.Label,
		vipback: cc.Node,
	},

	onLoad: function () {
		this.nameLabel.string = '';
		this.scoreLabel.string = '';
	},

	setChairId: function (chairId) {
		this.chairId = chairId;
		let player = TWModel.getPlayerByChairId(chairId);
		if (!player) {
			this.node.active = false;
			return;
		}
		this.node.active = true;
		this.uid = player.userInfo.uid;

		this.unscheduleAllCallbacks();

		this.updateUserInfo();

		// if (((player.userStatus & RoomProto.userStatusEnum.READY) !== 0) && (TWModel.gameStatus === GameProto.GAME_STATUS_NOTSTART)){
		//     this.setReady(true);
		// }
	},

	setReady: function (isReady) {
		this.typeSprite.active = isReady;
	},

	onGameStart: function () {
		// let player_charId = TWModel.getPlayerByChairId(this.chairId);
		// player_charId.userStatus = RoomProto.userStatusEnum.PLAYING;
		//this.setReady(false);

		if (this.Label_resultScore) {
			this.Label_resultScore.node.stopAllActions();
			this.Label_resultScore.node.y = 0;
		}
	},

	updateUserInfo: function () {
		let player = TWModel.getPlayerByChairId(this.chairId);
		if (!player) return;

		if (player.userInfo.uid == Global.Player.getPy('uid')) {
			this.nameLabel.string = player.userInfo.nickname;
		} else {
			this.nameLabel.string = Global.Player.convertNickname(player.userInfo.nickname);
		}
		this.scoreLabel.string = parseFloat(player.userInfo.gold.toFixed(2)).toString();
		let headSprite = this.node.getChildByName('HeadSprite');
		Global.CCHelper.updateSpriteFrame(player.userInfo.avatar, headSprite.getComponent(cc.Sprite));

		if (!!this.vipLabel && !!this.vipback) {
			if (!!player.userInfo.vipLevel) {
				this.vipLabel.string = "v" + player.userInfo.vipLevel;
				this.vipback.string = "b";
			} else {
				this.vipLabel.active = false;
				this.vipback.active = false;
			}
		}
	},

	getDaqiangCount: function (resout) {
		var memberCount = resout.cardsArr.length;
		var daqiangArr = [];
		for (var i = 0; i < resout.daqiangArr.length; ++i) {
			daqiangArr[i] = [];
			for (var j = 0; j < resout.daqiangArr[i].length; ++j) {
				daqiangArr[i][j] = resout.daqiangArr[i][j];
			}
		}
		// 怪牌打枪数据添加
		for (var k = 0; k < daqiangArr.length; ++k) {
			if (TWModel.getMianbai(k)) {
				for (var m = 0; m < daqiangArr.length; ++m) {
					if (m !== k && !TWModel.getMianbai(m)) {
						daqiangArr[k][m] = 2;
					}
				}
			}
		}
		var count = 0;
		for (i = 0; i < daqiangArr.length; ++i) {
			for (j = 0; j < daqiangArr[i].length; ++j) {
				if (daqiangArr[i][j] > 1) {
					++count;
				}
			}
		}
		return count;
	},

	resultScoreChanged: function (score_) {
		let url, str;
		if (score_ > 0) {
			url = "GameCommon/fnt_win_score";
			str = "+" + parseFloat(score_.toFixed(2));
		} else {
			url = "GameCommon/fnt_lose_score";
			str = parseFloat(score_.toFixed(2));
		}

		AssetMgr.loadResSync(url, cc.Font, function (err, font) {
			if (!err && this.Label_resultScore != null) {
				if (!cc.isValid(this)) {
					return;
				}
				this.Label_resultScore.font = font;
				this.Label_resultScore.string = str;
				this.Label_resultScore.node.active = true;

				this.Label_resultScore.node.runAction(cc.sequence([cc.show(),
					cc.moveTo(0.6, cc.v2(this.Label_resultScore.node.x, 90)),
					cc.delayTime(3), cc.hide()
				]));
			}
		}.bind(this));
	}
});