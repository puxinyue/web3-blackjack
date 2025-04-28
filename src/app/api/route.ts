// 当游戏开始给player和dealer随机各发两张牌
// 当player和dealer各发两张牌后，如果player和dealer的点数相等，则平局
// 当player的点数大于21点，则玩家爆牌，游戏结束，dealer赢
// 当dealer的点数大于21点，则dealer爆牌，游戏结束，player赢
// 当player和dealer的点数都小于21点，则比较点数大小，点数大的赢
// 当player和dealer的点数都等于21点，则平局
//当player的点数等于21点，则玩家赢
//当dealer的点数等于21点，则dealer赢
//当player的点数小于21点，则玩家继续发牌或停止发牌

interface Card {
    rank: string;
    suit: string;
}
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const suits = [ "♥️","♠️", "♣️", "♦️"]
  const initDeck = ranks?.map((rank)=>suits?.map((suit)=>({"rank":rank,"suit":suit}))).flat(Infinity) as {rank:string,suit:string}[]

const  gameState:{
    playerHand:Card[],
    dealerHand: Card[],
    message: string,
    deck: Card[],
} = {
    playerHand: [],
    dealerHand: [],
    message: '',
    deck: initDeck
 }

const getRandomCard = (deck: Card[],count:number) => {
    const randomIndexSet = new Set<number>();
    while(randomIndexSet.size < count){
        const randomIndex = Math.floor(Math.random() * deck.length);
        randomIndexSet.add(randomIndex);
    }
    //随机的牌
    const randomCards = deck.filter((_,index)=>randomIndexSet.has(index));
    // 从deck中删除随机选中的card
    const remainingDeck = deck.filter((_,index)=>!randomIndexSet.has(index));
    return [randomCards,remainingDeck];
}


export async function GET() {
    // 重新完的时候初始化之前的值
    gameState.playerHand = [];
    gameState.dealerHand = [];
    gameState.deck = initDeck;
    gameState.message = ''

    const [playerCards,remainingDeck] = getRandomCard(gameState.deck,2);
    const [dealerCards,newDeck] = getRandomCard(remainingDeck,2);
    gameState.playerHand = playerCards;
    gameState.dealerHand = dealerCards;
    gameState.deck = newDeck;
    gameState.message = ''
    return new Response(JSON.stringify({
        playerHand: gameState.playerHand,
        dealerHand: [gameState.dealerHand[0],{rank:'?',suit:'?'}],
        message: gameState.message
    }), { status: 200 });
}




