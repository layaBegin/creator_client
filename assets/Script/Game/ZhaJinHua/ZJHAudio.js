var ZJHAudio = module.exports = {};

// ZJHAudio.DIR_URL = 'resources/ZhaJinHua/audio/';
ZJHAudio.DIR_URL = 'Game/ZhaJinHua/audio/';

ZJHAudio.randomNum = function (randomRange) {
    return Math.floor(Math.random() * 100) % randomRange;
};

ZJHAudio.play = function (filePath_, loop_, volume_) {
    // var filePath = cc.url.raw(ZJHAudio.DIR_URL + filePath_ + '.mp3');
    var filePath = ZJHAudio.DIR_URL + filePath_;
    var loop = loop_;
    var volume = volume_ || null;
    //return cc.audioEngine.play(filePath, !!loop, volume);
    return AudioMgr.playSound(filePath, !!loop);
};


//非人声音效
ZJHAudio.chip = function () {
    this.play('chip');
};

ZJHAudio.compareDian = function () {
    this.play('compare_dian');
};

ZJHAudio.compareFailure = function () {
    this.play('compare_failure');
};

ZJHAudio.compareVictory = function () {
    this.play('compare_victory');
};

ZJHAudio.faPai = function () {
    this.play('fapai');
};

ZJHAudio.foldPai = function () {
    this.play('foldpai');
};

ZJHAudio.shouJi = function () {
    this.play('shouji');
};

//人声音效
ZJHAudio.start = function () {
    var fileName = 'm_start0';
    this.play(fileName);
};
//人声音效
ZJHAudio.compare = function (sex = 0) {
    if (sex) {
        var fileName = 'm_compare0';
    } else {
        var fileName = 'w_compare0';
    }
    this.play(fileName);

};

ZJHAudio.genZhu = function (sex = 0) {
    if (sex) {
        var fileName = 'm_genzhu0';
    } else {
        var fileName = 'w_genzhu' + this.randomNum(2);
    }
    this.play(fileName);
};

ZJHAudio.giveUp = function (sex = 0) {
    if (sex) {
        var fileName = 'm_giveup0';
    } else {
        var fileName = 'w_giveup0';
    }
    this.play(fileName);
};

ZJHAudio.jiaZhu = function (sex = 0) {
    if (sex) {
        var fileName = 'm_jiazhu0';
    } else {
        var fileName = 'w_jiazhu' + this.randomNum(2);
    }
    this.play(fileName);
};

ZJHAudio.jiaZhuMax = function (sex = 0) {
    if (sex) {
        var fileName = 'm_jiazhumax0';
    } else {
        var fileName = 'w_jiazhumax' + this.randomNum(2);
    }
    this.play(fileName);
};

ZJHAudio.kanPai = function (sex = 0) {
    if (sex) {
        var fileName = 'm_kanpai0';
    } else {
        var fileName = 'w_kanpai' + this.randomNum(2);
    }
    this.play(fileName);
};

ZJHAudio.xiaZhu = function () {
    var fileName = 'w_xiazhu0';
    this.play(fileName);
};

ZJHAudio.xuePin = function () {
    this.play('w_xuepin0');
};

//背景音乐
ZJHAudio.gameBg = function () {
    return AudioMgr.startPlayBgMusic(ZJHAudio.DIR_URL + 'zjh_bg');
};