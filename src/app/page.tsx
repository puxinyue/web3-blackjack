"use client"
import { useEffect, useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSignMessage } from "wagmi";
import { Toaster, toast } from 'react-hot-toast';

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-300 border-t-transparent"></div>
      <p className="text-lg font-medium text-gray-700">游戏加载中...</p>
    </div>
  </div>
);

const Home = () => {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [playerHand, setPlayerHand] = useState<{rank:string,suit:string}[]>([])
  const [dealerHand, setDealerHand] = useState<{rank:string,suit:string}[]>([])
  const [isSigned, setIsSigned] = useState(false)
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()

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
    }
  }

  const handleReset = async () => {
    setLoading(true)
    try {
      const resp = await fetch(`/api?address=${address}`,{method:"GET"})
      const data = await resp.json()
      setPlayerHand(data?.playerHand)
      setDealerHand(data?.dealerHand)
      setMessage(data?.message)
      setScore(data?.score)
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async () => {
    if(!address) return
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
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen w-full max-w-6xl mx-auto px-4 py-6">
      {initLoading && <LoadingScreen />}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            padding: '8px',
            borderRadius: '8px',
          },
          error: {
            style: {
              background: '#FEE2E2',
              color: '#DC2626',
            },
          },
          success: {
            style: {
              background: '#DCFCE7',
              color: '#16A34A',
            },
          },
        }}
      />
      <div className="w-full flex justify-center mb-6">
        <ConnectButton />
      </div>
      <div className="flex-1 flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">welcome to web3 game BlackJack</h1>
        {!isSigned && address && (
          <button 
            className="bg-amber-300 hover:bg-amber-400 transition-colors rounded-md cursor-pointer px-6 py-2.5 mb-6 text-lg" 
            onClick={handleSign}
          >
            Sign with your wallet
          </button>
        )}
        <h2 className={`text-xl sm:text-2xl font-bold mb-8 ${message.includes('win') ? 'text-green-300' : 'text-amber-300'}`}>
          Score: {score} {message}
        </h2>
        
        <div className="w-full max-w-4xl mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Dealer Hand:</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {initLoading ? (
              <div className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] border border-black bg-gray-100 rounded-md animate-pulse"></div>
            ) : (
              dealerHand?.map((card,index)=>(
                <div key={index} className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] border border-black bg-white rounded-md flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
                  <p className="self-start p-2 text-base sm:text-lg">{card?.rank}</p>
                  <p className="self-center text-2xl sm:text-3xl">{card?.suit}</p>
                  <p className="self-end p-2 text-base sm:text-lg">{card?.rank}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="w-full max-w-4xl mb-8">
          <h2 className="text-xl font-semibold mb-4 text-center">Player Hand:</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {initLoading ? (
              <div className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] border border-black bg-gray-100 rounded-md animate-pulse"></div>
            ) : (
              playerHand?.map((card,index)=>(
                <div key={index} className="w-[100px] h-[140px] sm:w-[120px] sm:h-[168px] border border-black bg-white rounded-md flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
                  <p className="self-start p-2 text-base sm:text-lg">{card?.rank}</p>
                  <p className="self-center text-2xl sm:text-3xl">{card?.suit}</p>
                  <p className="self-end p-2 text-base sm:text-lg">{card?.rank}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex gap-4 justify-center">
          {message == '' && (
            <>
              <button 
                className={`min-w-[100px] bg-amber-300 hover:bg-amber-400 transition-colors px-6 py-2.5 rounded-md cursor-pointer flex items-center justify-center gap-2 text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                onClick={handleHit}
                disabled={loading || initLoading}
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {loading ? 'Loading...' : 'Hit'}
              </button>
              <button 
                className={`min-w-[100px] bg-amber-300 hover:bg-amber-400 transition-colors px-6 py-2.5 rounded-md cursor-pointer flex items-center justify-center gap-2 text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
                onClick={handleStand}
                disabled={loading || initLoading}
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {loading ? 'Loading...' : 'Stand'}
              </button>
            </>
          )}
          {message != '' && (
            <button 
              className={`min-w-[100px] bg-amber-300 hover:bg-amber-400 transition-colors px-6 py-2.5 rounded-md cursor-pointer flex items-center justify-center gap-2 text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`} 
              onClick={handleReset}
              disabled={loading || initLoading}
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {loading ? 'Loading...' : 'Reset'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Home;