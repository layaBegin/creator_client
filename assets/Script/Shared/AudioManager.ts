
export class AudioManager {
    currentBgMusic = -1;
    currentSound = -1;
    isMusicEnabled = true;
    isSoundEnabled = true;

    musicVolume = 1; //音乐音量
    soundVolume = 1; //音效音量

    commonSoundPath = {
        clickButtonSound: 'Hall/Sound/button'
    };

    soundArr = []

    commonSound = {
        clickButton: null
    };

    constructor() {
        this.init()
    }

    //0为静音，1为开启声音
    init() {
        //初始化音乐和音效的音量
        if (cc.sys.localStorage.getItem('MusicVolume') === null) {
            cc.sys.localStorage.setItem('MusicVolume', this.musicVolume);
            cc.sys.localStorage.setItem('SoundVolume', this.soundVolume);
        } else {
            this.musicVolume = parseFloat(cc.sys.localStorage.getItem('MusicVolume'));
            this.soundVolume = parseFloat(cc.sys.localStorage.getItem('SoundVolume'));
        }
    }

    startPlayBgMusic(url, cb?) {
        this.stopBgMusic();
        AssetMgr.loadResSync(url, null, null, (err, clip: cc.AudioClip) => {
            if (!!err) {
                cc.log('startPlayBgMusic failed');
            } else {
                this.currentBgMusic = cc.audioEngine.play(clip, true, this.isMusicEnabled ? this.musicVolume : 0);
                if (!this.isMusicEnabled) {
                    cc.audioEngine.pause(this.currentBgMusic);
                }
            }
            if (!!cb) cb(err);
        });
    }

    stopBgMusic() {
        if (this.currentBgMusic === null || this.currentBgMusic < 0) return;
        cc.audioEngine.stop(this.currentBgMusic);
        this.currentBgMusic = -1;
    }

    async playSound(url, loop = false) {
        if (!url || !this.isSoundEnabled) return;
        if (loop !== true) loop = false;
        let clip = await AssetMgr.loadResSync(url, cc.AudioClip);
        this.currentSound = cc.audioEngine.play(clip, loop, this.soundVolume);
        return this.currentSound
    }

    stopSoundPeriod(url) {
        if (this.soundArr[url]) {
            cc.audioEngine.stop(this.soundArr[url]);
            this.soundArr[url] = null;
        }
    }
    playSoundPeriod = function (url, loop) {
        if (!url || this.soundArr[url]) return;
        if (loop !== true) loop = false;
        AssetMgr.loadResSync(url, null, null, (err, clip: cc.AudioClip) => {
            if (!!err) {
                console.error('playSound failed:' + url);
            } else {
                this.soundArr[url] = cc.audioEngine.play(clip, loop, this.soundVolume);
            }
        });
    };

    stopSound(currentSound) {
        if (currentSound === null || currentSound < 0) return;
        cc.audioEngine.stop(currentSound);
        this.currentSound = -1
    }

    playCommonSoundClickButton() {
        if (!this.isSoundEnabled) return;
        if (this.commonSound.clickButton !== null) {
            cc.audioEngine.play(this.commonSound.clickButton, false, this.soundVolume);
        } else {
            AssetMgr.loadResSync(this.commonSoundPath.clickButtonSound, null, null, (err, clip) => {
                if (!!err) {
                    cc.log("playCommonSoundClickButton failed");
                } else {
                    this.commonSound.clickButton = clip;
                    cc.audioEngine.play(this.commonSound.clickButton, false, this.soundVolume);
                }
            });
        }
    };

    getMusicEnabled() {
        return this.isMusicEnabled;
    }

    //Sound 1为开，0为关
    setSoundOn() {
        cc.sys.localStorage.setItem('Sound', 1);
        this.isSoundEnabled = true;
    }

    setSoundOff() {
        cc.sys.localStorage.setItem('Sound', 0);
        this.isSoundEnabled = false;
    }

    getSoundEnabled() {
        return this.isSoundEnabled;
    };
    //设置音乐
    setMusicVolume(volume) {
        this.musicVolume = parseFloat(volume.toFixed(1));
        if (this.musicVolume === parseFloat(cc.sys.localStorage.getItem('MusicVolume'))) {

        } else {
            cc.sys.localStorage.setItem('MusicVolume', this.musicVolume);
        }

        if (this.currentBgMusic >= 0) {
            cc.audioEngine.setVolume(this.currentBgMusic, this.musicVolume);
        }
    };

    getMusicVolume() {
        return this.musicVolume;
    }
    //音效
    setSoundVolume(volume) {
        this.soundVolume = parseFloat(volume.toFixed(1));
        if (this.soundVolume === parseFloat(cc.sys.localStorage.getItem('SoundVolume'))) {

        } else {
            cc.sys.localStorage.setItem('SoundVolume', this.soundVolume);
        }
    };

    getSoundVolume() {
        return this.soundVolume;
    };
}
