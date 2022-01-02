
const { ccclass, property } = cc._decorator;

@ccclass
export default class EditBoxLayout extends cc.Component {

    @property(cc.Node)
    target: cc.Node = undefined;

    editBox: cc.EditBox = undefined;

    startPosition: cc.Vec2 = undefined;

    onLoad() {
        this.editBox = this.node.getComponent(cc.EditBox);
        if (!cc.isValid(this.editBox) || !cc.isValid(this.target)) {
            return;
        }
        // 监听输入开始和输入结束(完成)
        let begin = new cc.Component.EventHandler();
        begin.target = this.node;
        begin.component = "EditBoxLayout";
        begin.handler = "onEditingDidBegan";
        this.editBox.editingDidBegan.push(begin);

        let end = new cc.Component.EventHandler();
        end.target = this.node;
        end.component = "EditBoxLayout";
        end.handler = "onEditingDidEnded";
        this.editBox.editingDidEnded.push(end);
        // 保存原始坐标
        this.startPosition = this.target.getPosition();
    }
    onEditingDidBegan() {
        if (!cc.isValid(this.target)) {
            return;
        }
        this.moveToVisibleArea();
    }

    onEditingDidEnded() {
        if (!cc.isValid(this.target)) {
            return;
        }
        this.target.setPosition(this.startPosition);

        this.target.runAction(cc.moveTo(2, this.startPosition));
    }
    moveToVisibleArea() {
        /**
         * 引擎版本 2.0.9
         * 安卓设备 软键盘会将游戏整个视图上顶 后再软键盘顶部添加一个输入横条 横条大致高度 80
         * IOS设备 软键盘不会顶起游戏视图 而是直接将软键盘盖在视图上 同样有一个横条 80
         */
        if (cc.sys.os == cc.sys.OS_ANDROID) {
            // 下移到游戏视图底部可见区域
            this.moveToBottom();
        }
        // else if (cc.sys.os == cc.sys.OS_IOS || CC_DEV) {
        else if (cc.sys.os == cc.sys.OS_IOS) {
            // 移动到游戏视图顶部可见区域
            this.moveToTop();
        }

    }

    moveToTop() {
        let spy = this.getStartPosition().y;
        let lineHeight = this.editBox.lineHeight;
        let epy;
        // ios输入框target上移只能模糊的移动到一个可视区域 除非此处可以取到软键盘高度
        if (3 * lineHeight < this.editBox.node.height) {    // 如果是多行输入的大输入框，则直接置顶
            epy = cc.winSize.height - this.editBox.node.height * (1 - this.editBox.node.anchorY) * 1 - 20;
        }
        else {
            epy = cc.winSize.height - this.editBox.node.height * (1 - this.editBox.node.anchorY) * 3;   // 顶部稍微预留些控件
        }
        let length = epy - spy;
        this.target.runAction(cc.moveBy(0.1, cc.v2(0, length)));
    }
    moveToBottom() {
        // 计算世界坐标下的终点的 y 坐标
        let epy = this.editBox.node.anchorY * this.editBox.node.height + 80 + 20; // 追加 20 像素
        // 计算世界坐标下开始点的 y 坐标
        let spy = this.getStartPosition().y;
        let length = spy - epy;

        this.target.runAction(cc.moveBy(0.1, cc.v2(0, -length)));
    }

    getStartPosition() {
        let startPosition = this.editBox.node.parent.convertToWorldSpaceAR(this.editBox.node.getPosition());
        return startPosition;
    }

    // update (dt) {}
}
