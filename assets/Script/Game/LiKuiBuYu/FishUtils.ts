/**
 * 生成鱼多边形的工具脚本
 */
const { ccclass, property, executeInEditMode, requireComponent } = cc._decorator;

@ccclass
@executeInEditMode
@requireComponent(cc.PolygonCollider)
export default class FishUtils extends cc.Component {

    @property({ tooltip: "打印多边形鱼的点" })
    get "打印多边形"() {
        return false;
    }
    set "打印多边形"(v) {
        let points = this.polygonCollider.points;
        let str = "[";
        let itemTemp = "cc.v2(%s, %s)"
        for (let i = 0; i < points.length; i++) {
            str += cc.js.formatStr(itemTemp, points[i].x, points[i].y);
            if (i != points.length - 1) {
                str += ", "
            }
        }
        str += "]";
        cc.log(str);
    }

    @property(cc.PolygonCollider)
    polygonCollider: cc.PolygonCollider = undefined;



}
