
const {ccclass, property} = cc._decorator;

@ccclass
export default class LongButton extends cc.Component {

    holdTimeEclipse = 0;    //用来检测长按
    holdClick = false;       //用来检测点击
    doubleTimeEclipse = 0;   //用来检测双击
    hold_one_click = 0;      //用来检测单击

    onLoad () {
        this.node.on(cc.Node.EventType.TOUCH_START,function(event){
            this.holdClick = true;
            this.holdTimeEclipse = 0;
        },this);

        this.node.on(cc.Node.EventType.TOUCH_END,function(event){
            this.holdClick = false;
            if(this.holdTimeEclipse>=30)
            {
                this.btn_status('long');
            }
            else
            {
                this.btn_status('short');
            }
            //开始记录时间
            this.holdTimeEclipse=0;
        },this);
    }

    btn_status(status){
        if(status == 'short')
        {
            console.log(this.hold_one_click)
            this.hold_one_click ++;
            setTimeout(() => {
                if(this.hold_one_click == 1)
                {
                    console.log('short');
                    this.hold_one_click = 0;

                }
                else if(this.hold_one_click == 2)
                {
                    console.log('double');
                    this.hold_one_click = 0;
                }
            }, 400);

        }
        else
        {
            this.hold_one_click = 0;
            console.log(status);
        }

    }

    start () {

    }

    update (dt) {
        if(this.holdClick)
        {
            this.holdTimeEclipse++;
            if(this.holdTimeEclipse>120)//如果长按时间大于2s，则认为长按了2s
            {
                this.holdTimeEclipse=120;
            }
        }
    }


}
