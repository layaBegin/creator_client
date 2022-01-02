let SOUND_ROOT = "Game/DeZhouPoker/Sound/";
import DZProto = require("./DZProto");

let opNames = ["", "jiazhu", "genzhu", "guopai", "qipai", "allin"];
export class ZDAudio {

    playBGM(url?: string) {
        url = SOUND_ROOT + (url ? url : "zdBGM");
        return AudioMgr.startPlayBgMusic(url, null);
    }

    play(url: string, isLoop: boolean = false) {
        url = SOUND_ROOT + url;

        return AudioMgr.playSound(url, isLoop);
    }
    //
    playOperate(opType: 0 | 1 | 2 | 3 | 4 | 5, sex: number) {
        let url = "operate/";
        let opName = opNames[opType];
        url += opName;
        if (sex != undefined) {
            url += "_" + sex;
        }
        this.play(url, false);
        if (opType == DZProto.operationType.ALL_IN) {       //  ALLIN 追加音效
            this.playAllinEff();
        }
    }

    playFapai() {
        this.play("fapai");
    }

    playLose() {
        this.play("lose");
    }
    playWin() {
        this.play("win");
    }

    playStart() {
        this.play("start");
    }

    playAllinEff() {
        this.play("allinEff");
    }

    playWinGold() {
        this.play("winGold");
    }

    getSexByChairID(chairID: number) {

    }

}
