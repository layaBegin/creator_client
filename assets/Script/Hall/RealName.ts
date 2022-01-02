import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;

@ccclass
export default class RealName extends BaseView {

    @property(cc.EditBox)
    editRealName: cc.EditBox = undefined

    type = undefined

    init(type) {
        //1 绑定支付宝 2 绑定银行卡
        this.type = type

    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'closeRealName':
                this.close();
                break;
            case 'bindRealName':
                let realName = /^[\u4e00-\u9fa5]{1,6}$/.test(this.editRealName.string)
                if (!realName) {
                    Tip.makeText('请输入正确的姓名！');
                    return;
                }
                API.hall.bindRealNameRequest(this.editRealName.string, function () {
                    Confirm.show('绑定成功！', () => {
                        this.close();
                        if (this.type == 1) {
                            ViewMgr.pushToScene({ key: "openBindView", data: "zfb" });
                        } else if (this.type == 2) {
                            ViewMgr.pushToScene({ key: "openBindView", data: "bankCard" });
                        }

                    });

                }.bind(this));
                break;
        }
    }
}

