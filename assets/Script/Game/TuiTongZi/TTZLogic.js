var logic = module.exports;
var gameProto = require('./TTZProto');

logic.CARDS_COUNT				= 40;			// 所有牌张数
logic.CARDS_BUREAU_COUNT		= 8;			// 每局牌张数


/* 获取牌 */
logic.getCards= function() {
	var cards = [];
	var i, ran1, ran2, tmp;
	for(i = 0; i < this.CARDS_COUNT; ++i) { 
		cards[i] = i; 
	}
	for(i = 0; i < 100; ++i) {	/* 洗牌 */
		ran1 = Math.floor(Math.random()*this.CARDS_COUNT);
		ran2 = Math.floor(Math.random()*this.CARDS_COUNT);
		tmp = cards[ran1];
		cards[ran1] = cards[ran2];
		cards[ran2] = tmp;
	}
	return cards;
};

// 获取第n局的牌
logic.getCardsArrByBureau = function(cards, bureau) {
	var cardsArr = [[], [], [], []];
	var begPos = (bureau-1)*8;
	var i;
	for(i = 0; i < 8; ++i) {
		cardsArr[Math.floor(i/2)][i%2] = cards[begPos+i];
	}
	return cardsArr;
};

// 获取牌的点数
logic.getCardNumber = function(cardId) {
	if(cardId % 10 === 0) {
		return 0.5;
	}
	return cardId%10;
};

// 判断是否是豹子
logic.verifyCardsIsBaozi = function(cardArr) {
	return (cardArr[0]%10 === cardArr[1]%10);
};
// 判断是否是天宝
logic.verifyCardsIsTianbao = function(cardArr) {
	if (cardArr[0]%10 === cardArr[1]%10 && cardArr[0]%10 === 0)
		return true;
	return  false;
};
// 判断是否是2 8 杠
logic.verifyCardsIs28Gang = function(cardArr) {
	if ((this.getCardNumber(cardArr[0]%10)=== 2 && this.getCardNumber(cardArr[1]%10)=== 8) ||(this.getCardNumber(cardArr[0]%10)=== 8 && this.getCardNumber(cardArr[1]%10)=== 2))
		return true;
	return  false;
};


//设置牌型
logic.setCardType = function (chooseNode, cardArr) {
	// var nameArr = ['Baozi', 'Count', 'Dot', 'Ban'];

	let type = chooseNode.getChildByName("type");
	type.active = false;
	let typeSprite = type.getComponent(cc.Sprite);

	if(this.verifyCardsIsTianbao(cardArr)) {
		Global.CCHelper.updateSpriteFrame("TuiTongZi/cardType/tianbao",typeSprite,function () {
			typeSprite.node.active =true;
		});
	}
	else if(this.verifyCardsIsBaozi(cardArr)) {
		let sUrl = "TuiTongZi/cardType/"+this.getCardNumber(cardArr[0])+"bao";
		Global.CCHelper.updateSpriteFrame(sUrl,typeSprite,function () {
			typeSprite.node.active =true;
		});
	}
	else if(this.verifyCardsIs28Gang(cardArr)) {
		let sUrl = "TuiTongZi/cardType/28gang";
		Global.CCHelper.updateSpriteFrame(sUrl,typeSprite,function () {
			typeSprite.node.active =true;
		});
	}
	else {
		var count = this.getCardNumber(cardArr[0])+this.getCardNumber(cardArr[1]);
		var st = "1dian";
		if (count%1 > 0){
			st = Math.floor(count%10)+ "dianban";
		}
		else {
			if (count % 10 === 0) {
				st = "bieshi"
			}else{
				st  = Math.floor(count%10)+"dian";
			}
		}
		let sUrl = "TuiTongZi/cardType/" + st;
		Global.CCHelper.updateSpriteFrame(sUrl,typeSprite,function () {
			typeSprite.node.active =true;
		});
	}
},

// 比较牌的大小	cardArr1>cardArr2-> 返回1
logic.compareCards = function(cardArr1, cardArr2) {
	var isBao1 = this.verifyCardsIsBaozi(cardArr1); 
	var isBao2 = this.verifyCardsIsBaozi(cardArr2);
	var count1_0 = this.getCardNumber(cardArr1[0]);
	var count1_1 = this.getCardNumber(cardArr1[1]);
	var count2_0 = this.getCardNumber(cardArr2[0]);
	var count2_1 = this.getCardNumber(cardArr2[1]);
	if(isBao1 && !isBao2) {
		return 1;
	}
	if(!isBao1 && isBao2) {
		return -1;
	}
	if(isBao1 && isBao2){
		if(count1_0 === count2_0) {
			return 0;
		} 
		if(count1_0 === 0.5) {
			return 1;
		}
		if(count2_0 === 0.5) {
			return -1;
		} 
		return (count1_0 > count2_0)? 1:-1;
	} 
	var num1 = (count1_0+count1_1)%10;
	var num2 = (count2_0+count2_1)%10;
	if(num1 === num2) {
		count1_0 = (count1_0 > count1_1)? count1_0:count1_1;
		count2_0 = (count2_0 > count2_1)? count2_0:count2_1;
		if(count1_0 === count2_0) {
			return 0;
		} 
		return (count1_0 > count2_0)? 1:-1;
	} 
	return (num1 > num2)? 1:-1;
};

// 计算结果
logic.getResout = function(cardsArr, pourPool) {
	var bankerWin = 0;
	var usersWin = {};
	var winArr = [];
	var sortArr = [gameProto.TIANMEN, gameProto.ZHONGMEN, gameProto.DIMEN];
	var i, j, dir, flag;
	for(i = 0; i < 3; ++i) {
		dir = sortArr[i];
		flag = this.compareCards(cardsArr[gameProto.ZHUANGJIA], cardsArr[dir]);
		if(flag === 0) { flag = 1; }
		winArr.push((flag === 1)? true : false);
		for(j = 0; j < pourPool[dir].length; ++j) {
			bankerWin += flag*pourPool[dir][j].pourGold;
			if(usersWin[pourPool[dir][j].uid]) {
				usersWin[pourPool[dir][j].uid] -= flag*pourPool[dir][j].pourGold;
			} else {
				usersWin[pourPool[dir][j].uid] = -flag*pourPool[dir][j].pourGold;
			}
		}
	}
	return {
		cardsArr: cardsArr,
		winArr: winArr,
		bankerWin: bankerWin,
		usersWin: usersWin
	};
};


