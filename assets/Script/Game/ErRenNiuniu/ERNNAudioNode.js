cc.Class({
	extends: cc.Component,
	properties: {

		backMusic: cc.AudioSource,
		pourGold: cc.AudioSource,
		tick: cc.AudioSource,
	},

	start: function () {
		this.setVolume();
		//this.backMusic.loop = true;
		//this.backMusic.play();
		AudioMgr.startPlayBgMusic('ErRenNiuniu/sound/bg_music');
	},

	onDestroy: function () {
		AudioMgr.stopBgMusic();
		//this.backMusic.stop();
	},

	playNiuType: function (num) {
		// var array = [this.niu0_0, this.niu1_0, this.niu2_0, this.niu3_0, this.niu4_0,
		// 	this.niu5_0, this.niu6_0, this.niu7_0, this.niu8_0, this.niu9_0, this.niu10_0 ];
		// var audioSource = array[num];
		// audioSource.play();
	},

	playWuhuaniu: function (sex) {
		this.wuhuaniu.play();
	},

	playZhadanniu: function () {
		this.zhadanniu.play();
	},

	playWuxiaoniu: function () {
		this.wuxiaoniu.play();
	},

	playPourGold: function () {
		this.pourGold.play();
	},

	playTick: function () {
		this.tick.play();
	},

	setVolume: function () {
		var volume = AudioMgr.getSoundVolume();
		var array = [this.pourGold, this.tick];
		for (var i = 0; i < array.length; ++i) {
			array[i].volume = volume;
		}
	},
});