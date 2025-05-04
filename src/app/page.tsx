
"use client"
import { useEffect, useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from "wagmi";
import { Toaster, toast } from 'react-hot-toast';
import { createPublicClient, createWalletClient, custom } from 'viem'
import { avalancheFuji } from "viem/chains";

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50">
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-xl shadow-2xl border border-amber-500/30 flex flex-col items-center gap-5">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-amber-500 border-t-transparent"></div>
      <p className="text-xl font-medium text-amber-400">游戏加载中...</p>
    </div>
  </div>
);

const Home = () => {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(false)
  const [score, setScore] = useState(0)
  const [playerHand, setPlayerHand] = useState<{rank:string,suit:string}[]>([])
  const [dealerHand, setDealerHand] = useState<{rank:string,suit:string}[]>([])
  const [isSigned, setIsSigned] = useState(false)
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [publicClient, setPublicClient] = useState<any>(null)
  const [walletClient, setWalletClient] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // 验证 JWT 是否有效
  const verifyJWT = async () => {
    if (!address) return false

    try {
      const resp = await fetch(`/api?address=${address}`, { method: 'GET'})
      if (resp.status === 200) {
        setIsSigned(true)
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  const handleSendTx = async () => {
    //contract address
    setActionLoading('nft')
    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
      //abi
      console.log(process.env.NEXT_PUBLIC_CONTRACT_ABI)

      const contractAbi = [
        {
          "inputs": [
            { "internalType": "string[]", "name": "args", "type": "string[]" },
            { "internalType": "address", "name": "player", "type": "address" }
          ],
          "name": "sendRequest",
          "outputs": [
            { "internalType": "bytes32", "name": "", "type": "bytes32" }
          ],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
      //publicClient => 模拟发送交易
      await publicClient.simulateContract({
        address:contractAddress,
        abi:contractAbi,
        functionName:"sendRequest",
        args:[[address],address],
        account:address
      })
      //walletClent => 实际发送
      const txHash = await walletClient.writeContract({
        to:contractAddress,
        abi:contractAbi,
        functionName:"sendRequest",
        args:[[address],address],
        account:address
      })
      console.log("Contract hash ==>", txHash)
      toast.success('NFT请求已发送!')
    } catch (error) {
      console.error(error)
      toast.error('NFT请求失败，请重试')
    } finally {
      setActionLoading(null)
    }
  }

  const initGame = async () => {
    if (!address) return
    setInitLoading(true)
    try {
      const resp = await fetch(`/api?address=${address}`,{method:"GET"})
      const data = await resp.json()
      console.log(data)
      setPlayerHand(data?.playerHand)
      setDealerHand(data?.dealerHand)
      setMessage(data?.message)
      setScore(data?.score)
      if(typeof window !== "undefined"&&window.ethereum){
         const publicClient = createPublicClient({
           chain:avalancheFuji,
           transport: custom(window.ethereum)
         })
         const walletClient = createWalletClient({
          chain:avalancheFuji,
          transport: custom(window.ethereum)
        })
        setPublicClient(publicClient)
        setWalletClient(walletClient)
      }else{
        console.log('ethereum is not available')
      }
    } finally {
      setInitLoading(false)
    }
  }

  // 在地址改变或组件加载时检查 JWT
  useEffect(() => {
    console.log(address)
    if (address) {
      verifyJWT().then(isValid => {
        console.log(isValid)
        if (isValid) {
          initGame()
        }
      })
    }
  }, [address])

  const handleHit = async () => {
    console.log(address,isSigned)
    if (!address) {
      toast.error('请先连接钱包')
      return
    }
    if (!isSigned) {
      toast.error('请先签名')
      return
    }
    setLoading(true)
    setActionLoading('hit')
    try {
      const resp = await fetch(`/api`,{method:"POST",
        body:JSON.stringify({action:"hit",address}),
        headers:{
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      })

      if(resp.status == 401){
        localStorage.removeItem('jwt');
        setIsSigned(false);
        toast.error('登录已过期，请重新登录');
      }else{
        const data = await resp?.json()
        console.log(data)
        setPlayerHand(data?.playerHand)
        setDealerHand(data?.dealerHand)
        setMessage(data?.message)
        setScore(data?.score)
      }
      
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleStand = async () => {
    if (!address) {
      toast.error('请先连接钱包')
      return
    }
    if (!isSigned) {
      toast.error('请先签名')
      return
    }
    setLoading(true)
    setActionLoading('stand')
    try {
      const resp = await fetch('/api',{method:"POST",
        body:JSON.stringify({action:"stand",address}),
        headers:{
          Authorization: `Bearer ${localStorage.getItem('jwt')}`
        }
      })
      if(resp.status == 401){
        localStorage.removeItem('jwt');
        setIsSigned(false);
        toast.error('登录已过期，请重新登录');
      }else{
        const data = await resp?.json()
        console.log(data)
        setPlayerHand(data?.playerHand)
        setDealerHand(data?.dealerHand)
        setMessage(data?.message)
        setScore(data?.score)
      }
      
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleReset = async () => {
    setLoading(true)
    setActionLoading('reset')
    try {
      const resp = await fetch(`/api?address=${address}`,{method:"GET"})
      const data = await resp.json()
      setPlayerHand(data?.playerHand)
      setDealerHand(data?.dealerHand)
      setMessage(data?.message)
      setScore(data?.score)
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleSign = async () => {
    if(!address) return
    setActionLoading('sign')
    try {
      const signMessage = `welcome to web3 game BlackJack, ${new Date().toLocaleString()}`
      const signature = await signMessageAsync({message:signMessage})
      const resp = await fetch('/api',{method:"POST",body:JSON.stringify({
        action:"auth",
        address,
        message:signMessage,
        signature
      })})
      if(resp?.status == 200){
         setIsSigned(true)
         initGame()
         const data = await resp.json()
         localStorage.setItem('jwt',data?.token)
         toast.success('签名成功！')
      }
    } catch (error) {
       toast.error('签名失败，请重试')
    } finally {
      setActionLoading(null)
    }
  }

  const getSuitColor = (suit: string) => {
    if (suit === "♥" || suit === "♦") return "text-red-500";
    return "text-black";
  };

  return (
    <div className="flex flex-col items-center min-h-screen w-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {initLoading && <LoadingScreen />}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            padding: '12px',
            borderRadius: '8px',
            fontWeight: '500',
          },
          error: {
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
            },
            icon: '❌',
          },
          success: {
            style: {
              background: '#DCFCE7',
              color: '#16A34A',
              border: '1px solid #BBF7D0',
            },
            icon: '✅',
          },
        }}
      />

      {/* Header Section */}
      <div className="w-full max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-yellow-500 drop-shadow-lg">
            Web3 BlackJack
          </h1>
          <ConnectButton />
        </div>

        {/* Score and Message */}
        <div className="flex justify-center items-center mb-6">
          <div className="bg-gray-800/60 backdrop-blur-sm p-3 rounded-xl border border-amber-500/30 shadow-lg">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Score: <span className="text-amber-400">{score}</span>
              {message && (
                <span className={`ml-3 ${message.includes('win') ? 'text-green-400' : message.includes('lose') ? 'text-red-400' : 'text-amber-300'}`}>
                  {message}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* NFT Button */}
        {score > 1000 && (
          <div className="flex justify-center mb-6">
            <button 
              className={`relative overflow-hidden bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:from-amber-700 active:to-yellow-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`} 
              onClick={handleSendTx}
              disabled={actionLoading === 'nft'}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {actionLoading === 'nft' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>处理中...</span>
                  </>
                ) : (
                  <>🏆 领取 NFT 奖励</>
                )}
              </span>
            </button>
          </div>
        )}

        {/* Sign Button */}
        {!isSigned && address && (
          <div className="flex justify-center mb-8">
            <button 
              className={`relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 active:from-purple-800 active:to-blue-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`} 
              onClick={handleSign}
              disabled={actionLoading === 'sign'}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {actionLoading === 'sign' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>签名中...</span>
                  </>
                ) : (
                  <>✍️ 使用钱包签名</>
                )}
              </span>
            </button>
          </div>
        )}

        {/* Dealer Cards */}
        <div className="w-full max-w-4xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-amber-300 border-b border-gray-700 pb-2">庄家手牌</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {initLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] bg-gray-800/60 rounded-lg animate-pulse border border-gray-700"></div>
              ))
            ) : dealerHand?.length === 0 ? (
              <div className="text-gray-400 italic">等待发牌...</div>
            ) : (
              dealerHand?.map((card, index) => (
                <div 
                  key={index} 
                  className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] bg-white rounded-lg flex flex-col justify-between p-2 shadow-md shadow-black/30 hover:shadow-lg hover:shadow-amber-900/20 transition-all duration-200 transform hover:-translate-y-1"
                >
                  <p className={`self-start font-bold text-base sm:text-lg ${getSuitColor(card?.suit)}`}>{card?.rank}</p>
                  <p className={`self-center text-3xl sm:text-4xl ${getSuitColor(card?.suit)}`}>{card?.suit}</p>
                  <p className={`self-end font-bold text-base sm:text-lg ${getSuitColor(card?.suit)}`}>{card?.rank}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Player Cards */}
        <div className="w-full max-w-4xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center text-green-300 border-b border-gray-700 pb-2">玩家手牌</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {initLoading ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] bg-gray-800/60 rounded-lg animate-pulse border border-gray-700"></div>
              ))
            ) : playerHand?.length === 0 ? (
              <div className="text-gray-400 italic">等待发牌...</div>
            ) : (
              playerHand?.map((card, index) => (
                <div 
                  key={index} 
                  className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] bg-white rounded-lg flex flex-col justify-between p-2 shadow-md shadow-black/30 hover:shadow-lg hover:shadow-green-900/20 transition-all duration-200 transform hover:-translate-y-1"
                >
                  <p className={`self-start font-bold text-base sm:text-lg ${getSuitColor(card?.suit)}`}>{card?.rank}</p>
                  <p className={`self-center text-3xl sm:text-4xl ${getSuitColor(card?.suit)}`}>{card?.suit}</p>
                  <p className={`self-end font-bold text-base sm:text-lg ${getSuitColor(card?.suit)}`}>{card?.rank}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap justify-center">
          {message === '' && (
            <>
              <button 
                className={`min-w-[120px] relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 active:from-green-700 active:to-emerald-800 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`} 
                onClick={handleHit}
                disabled={loading || initLoading || actionLoading !== null}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {actionLoading === 'hit' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>要牌中...</span>
                    </>
                  ) : (
                    <>要牌</>
                  )}
                </span>
              </button>
              
              <button 
                className={`min-w-[120px] relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 active:from-blue-700 active:to-indigo-800 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`} 
                onClick={handleStand}
                disabled={loading || initLoading || actionLoading !== null}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {actionLoading === 'stand' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>停牌中...</span>
                    </>
                  ) : (
                    <>停牌</>
                  )}
                </span>
              </button>
            </>
          )}
          
          {message !== '' && (
            <button 
              className={`min-w-[120px] relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:from-amber-700 active:to-orange-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed`} 
              onClick={handleReset}
              disabled={loading || initLoading || actionLoading !== null}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {actionLoading === 'reset' ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>重置中...</span>
                  </>
                ) : (
                  <>再来一局</>
                )}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home;