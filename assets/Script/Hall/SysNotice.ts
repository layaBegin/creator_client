import BaseView from "../BaseClass/BaseView";

const { ccclass, property } = cc._decorator;
@ccclass
export default class SysNotice extends BaseView {

    @property(cc.Toggle)
    TopActivityBtn: cc.Toggle = undefined
    @property(cc.Toggle)
    TopNoticeBtn: cc.Toggle = undefined
    @property(cc.Node)
    RadioBtn: cc.Node = undefined
    @property(cc.Node)
    ActivityLeftBtn: cc.Node = undefined
    @property(cc.Node)
    NoticeLeftBtn: cc.Node = undefined
    @property(cc.Node)
    RightSprite: cc.Node = undefined
    @property(cc.Node)
    RightText: cc.Node = undefined

    dataArray = undefined
    activeArray = []
    noticeArray = []

    async init(isOpacity = true) {
        if (AudioConfig._Notice) {
            this._AudioID = await AudioMgr.playSound("Common/Sound/notice");
            AudioConfig._Notice = false
        }

        if (isOpacity) {
            this.node.getChildByName('mask').opacity = 150
        } else {
            this.node.getChildByName('mask').opacity = 0
        }
        this.resetBtn()
        this.activeArray = []
        this.noticeArray = []
        //kindID  1：热门活动  2：游戏公告
        Waiting.show();
        Global.API.hall.getNoticeRequest((msg) => {
            let data = msg.msg;
            //公告排序
            data.sort((a, b) => {
                if (a.sort && b.sort) {
                    return b.sort - a.sort
                }
            })

            this.dataArray = data
            //公告数据分组
            for (let i = 0; i < data.length; i++) {
                if (data[i].kindID == 1) {
                    this.activeArray.push(data[i])
                } else if (data[i].kindID == 2) {
                    this.noticeArray.push(data[i])
                }
            }
            //活动公告按钮
            for (let i = 0; i < this.activeArray.length; i++) {
                let item = this.ActivityLeftBtn.children[i]
                if (!cc.isValid(item)) {
                    item = cc.instantiate(this.RadioBtn);
                }
                item.active = true;
                item.getComponent(cc.Toggle).checkEvents[0].customEventData = this.activeArray[i];
                item.getChildByName('text1').getComponent(cc.Label).string = this.activeArray[i].name
                item.getChildByName('checkmark').getChildByName('text2').getComponent(cc.Label).string = this.activeArray[i].name
                item.parent = this.ActivityLeftBtn
            }
            //系统公告按钮
            for (let i = 0; i < this.noticeArray.length; i++) {
                let item = this.NoticeLeftBtn.children[i]
                if (!cc.isValid(item)) {
                    item = cc.instantiate(this.RadioBtn);
                }
                item.active = true;
                item.getComponent(cc.Toggle).checkEvents[0].customEventData = this.noticeArray[i];
                item.getChildByName('text1').getComponent(cc.Label).string = this.noticeArray[i].name
                item.getChildByName('checkmark').getChildByName('text2').getComponent(cc.Label).string = this.noticeArray[i].name
                item.parent = this.NoticeLeftBtn
            }

            this.ActivityLeftBtn.children[0].getComponent(cc.Toggle).check();
            this.toggleClk(this.ActivityLeftBtn.children[0], '')
            this.TopActivityBtn.isChecked = true
            Waiting.hide();
        });
    }
    resetBtn() {
        for (let i = 0; i < this.ActivityLeftBtn.children.length; i++) {
            this.ActivityLeftBtn.children[i].active = false
        }

        for (let i = 0; i < this.NoticeLeftBtn.children.length; i++) {
            this.NoticeLeftBtn.children[i].active = false
        }
        this.RightText.active = false
        this.RightSprite.active = false
    }

    onDestroy() {
        Global.MessageCallback.removeListener('UpdateUserInfoUI', this);
    }

    onBtnClk(event, param) {
        Global.CCHelper.playPreSound();
        switch (param) {
            case 'close':
                this.close()
                break;
        }
    }
    //顶部按钮点击事件
    //  1：热门活动  2：游戏公告
    topClk(event, param) {
        Global.CCHelper.playPreSound();
        let data = event.getComponent(cc.Toggle).checkEvents[0].customEventData;
        if (this.dataArray.length == 0) {
            return
        }
        if (data == 1) {
            let node = this.ActivityLeftBtn.children[0]
            if (cc.isValid(node)) {
                node.getComponent(cc.Toggle).check();
            } else {
                this.RightText.active = false
                this.RightSprite.active = false
            }
        } else if (data == 2) {
            let node = this.NoticeLeftBtn.children[0]
            if (cc.isValid(node)) {
                node.getComponent(cc.Toggle).check();
            } else {
                this.RightText.active = false
                this.RightSprite.active = false
            }

        }
    }

    //左侧按钮点击事件
    toggleClk(event, param) {
        Global.CCHelper.playPreSound();
        let data = event.getComponent(cc.Toggle).checkEvents[0].customEventData;
        this.RightText.active = false
        this.RightSprite.active = false
        //noticeType 1:图片    2：文字
        if (data.noticeType == 1) {
            this.RightSprite.active = true;
            let sprite = this.RightSprite.getComponent(cc.Sprite)
            Global.CCHelper.updateSpriteFrame(data.content, sprite)
        } else if (data.noticeType == 2) {
            this.RightText.active = true;
            let title = this.RightText.getChildByName('titlebg').getChildByName('title').getComponent(cc.Label)
            let text = this.RightText.getChildByName('textcontent').getComponent(cc.RichText)
            title.string = data.title
            text.string = data.content
        }

    }
}