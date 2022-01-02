let BJAudio = module.exports = {};

BJAudio.DIR_URL = "Game/BlackJack/audio/";

BJAudio.playAudio = function (filePath_, loop_, volume_) {
    var filePath = BJAudio.DIR_URL + filePath_;
    var loop = loop_;
    var volume = volume_ || null;
    return AudioMgr.playSound(filePath, !!loop);
};