// save the score into the database
// get and put score with tables in database
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const TABLE_NAME = 'black_jack_score';

const client = new DynamoDBClient({ 
    region: "us-east-1", 
    credentials: {
        accessKeyId: process.env.AWS_USER_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_USER_ACCESS_KEY || ""
    }
})
const docClient = DynamoDBDocumentClient.from(client)

interface DynamoItem {
    player: string;
    score: number
}

async function putItem(item: DynamoItem) {
    try {
        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        })
        await docClient.send(command)
    } catch (error) {
        throw new Error("Error putting item in DynamoDB: " + error)
    }
}
async function getItem(player: string) {
    try {
        const command = new GetCommand({
            TableName: TABLE_NAME,
            Key: {
                player
            }
        })
        const resposne = await docClient.send(command)
        return resposne.Item as DynamoItem || null
    } catch (error) {
        throw new Error("Error getting item from DynamoDB: " + error)
    }
}



// 当游戏开始给player和dealer随机各发两张牌
// 当player和dealer各发两张牌后，如果player和dealer的点数相等，则平局
// 当player的点数大于21点，则玩家爆牌，游戏结束，dealer赢
// 当dealer的点数大于21点，则dealer爆牌，游戏结束，player赢
// 当player和dealer的点数都小于21点，则比较点数大小，点数大的赢
// 当player和dealer的点数都等于21点，则平局
//当player的点数等于21点，则玩家赢
//当dealer的点数等于21点，则dealer赢
//当player的点数小于21点，则玩家继续发牌或停止发牌

import { verifyMessage } from "viem";
import { getUserScore, updateUserScore } from "./service";
import jwt from 'jsonwebtoken'
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
    score: number,
} = {
    playerHand: [],
    dealerHand: [],
    message: '',
    deck: initDeck,
    score: 0
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


export async function GET(req:Request) {
    const {searchParams} = new URL(req.url)
    const address = searchParams.get('address')
    if(!address) return new Response(JSON.stringify({message:"Address is required"}), { status: 400 });
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
    try {
         const data = await getItem(address)
        // const score = await getUserScore(address)
        if(!data){
            gameState.score = 0
        }else{
            gameState.score = data.score
        }
        
    } catch (error) {
        return new Response(JSON.stringify({message:"Failed to get user score"}), { status: 500 });
    }
    return new Response(JSON.stringify({
        playerHand: gameState.playerHand,
        dealerHand: [gameState.dealerHand[0],{rank:'?',suit:'?'}],
        message: gameState.message,
        score: gameState.score
    }), { status: 200 });
}

export async function POST(req:Request) {
    const body = await req.json();
    const {action,address} = body;

    if(action === 'auth'){
        const {message,signature} = body;
        const verified = await verifyMessage({address,message,signature})
        if(!verified){
            return new Response(JSON.stringify({message:"Invalid signature"}), { status: 400 });
        }
        const token = jwt.sign({address},process.env.JWT_SECRET as string,{expiresIn:'1h'})
        return new Response(JSON.stringify({message:"Success",token}), { status: 200 });
    }

    const token = req.headers.get('Authorization')?.split(' ')[1]
    if(!token) {
        return new Response(JSON.stringify({
            message:"请先登录"
        }), { 
            status: 401 
        });
    }

    // 添加 try-catch 处理 JWT 验证错误
    try {
        const decoded = jwt.verify(token,process.env.JWT_SECRET as string) as {address:string}
        if(address !== decoded?.address) {
            return new Response(JSON.stringify({
                message:"地址不匹配，请重新登录"
            }), { 
                status: 401 
            });
        }
    } catch (error) {
        // 处理不同类型的 JWT 错误
        if(error instanceof jwt.TokenExpiredError) {
            return new Response(JSON.stringify({
                message:"登录已过期，请重新登录"
            }), { 
                status: 401 
            });
        }
        if(error instanceof jwt.JsonWebTokenError) {
            return new Response(JSON.stringify({
                message:"无效的登录信息，请重新登录"
            }), { 
                status: 401 
            });
        }
        // 其他未知错误
        return new Response(JSON.stringify({
            message:"验证失败，请重新登录"
        }), { 
            status: 401 
        });
    }


    if(action === 'hit'){
        const [playerCards,remainingDeck] = getRandomCard(gameState.deck,1);
        gameState.playerHand.push(...playerCards);
        gameState.deck = remainingDeck;
        gameState.message = ''
       const playerHandValue = calculateScore(gameState.playerHand);
       if(playerHandValue > 21){
        gameState.message = 'Bust! Player lose'
        gameState.score -= 100
       }else if(playerHandValue === 21){
        gameState.message = 'Player BlackJack! Player win'
        gameState.score += 100
       }
    }else if(action === 'stand'){
        const [dealerCards,newDeck] = getRandomCard(gameState.deck,1);
        gameState.dealerHand.push(...dealerCards);
        gameState.deck = newDeck;
        while(calculateScore(gameState.dealerHand) < 17){
            const [dealerCards,newDeck] = getRandomCard(gameState.deck,1);
            gameState.dealerHand.push(...dealerCards);
            gameState.deck = newDeck;
        }
        const dealerHandValue = calculateScore(gameState.dealerHand);
        if(dealerHandValue > 21){
            gameState.message = 'Dealer Bust! Player win'
            gameState.score += 100
        }else if(dealerHandValue === 21){
            gameState.message = 'Dealer BlackJack! Player lose'
            gameState.score -= 100
        }else{
            const playerHandValue = calculateScore(gameState.playerHand);
            if(playerHandValue > dealerHandValue){
                gameState.message = 'Player win'
                gameState.score += 100
            }else if(playerHandValue < dealerHandValue){
                gameState.message = 'Player lose'
                gameState.score -= 100
            }else{
                // 平局
                gameState.message = 'Draw'
            }
        }
    }else {
        return new Response(JSON.stringify({message:"Invalid action"}), { status: 400 });
    }
    try {
        await putItem({player:address,score:gameState.score})
        // await updateUserScore(address,gameState.score)
    } catch (error) {
        return new Response(JSON.stringify({message:"Failed to update user score"}), { status: 500 });
    }
    
    return new Response(JSON.stringify({
        playerHand: gameState.playerHand,
        dealerHand: gameState.message == '' ? [gameState.dealerHand[0],{rank:'?',suit:'?'}] : gameState.dealerHand,
        message: gameState.message,
        score: gameState.score
    }), { status: 200 });
}


const calculateScore = (hand:Card[]) => {
    // 计算手牌的点数
    let score = 0;
    let aceCount = 0;
    for(const card of hand){
        if(card.rank === 'A'){
            // A可以当作1或者11来计算
            score += 11
            aceCount++
        }else if(['J','Q','K'].includes(card.rank)){
            score += 10;
        }else{
            score += parseInt(card.rank);
        }
    }
    // 计算A的点数
   while(score > 21 && aceCount > 0){
    score -= 10;
    aceCount--;
   }
    return score;
}


