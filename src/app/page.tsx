"use client"
import { useEffect, useState } from "react";


const Home = () => {
  const [message, setMessage] = useState('')
  const [score, setScore] = useState(0)
  const [playerHand, setPlayerHand] = useState<{rank:string,suit:string}[]>([])
  const [dealerHand, setDealerHand] = useState<{rank:string,suit:string}[]>([])

  
   const initGame = async () =>{
     const resp =  await fetch('/api',{method:"GET"})
     const data = await resp.json()
     console.log(data)
     setPlayerHand(data?.playerHand)
     setDealerHand(data?.dealerHand)
     setMessage(data?.message)
     setScore(data?.score)
   }

   const handleHit = async () => {
    const resp = await fetch('/api',{method:"POST",body:JSON.stringify({action:"hit"})})
    const data = await resp.json()
    console.log(data)
    setPlayerHand(data?.playerHand)
    setDealerHand(data?.dealerHand)
    setMessage(data?.message)
    setScore(data?.score)
   }

   const handleStand = async () => {
    const resp = await fetch('/api',{method:"POST",body:JSON.stringify({action:"stand"})})
    const data = await resp.json()
    console.log(data)
    setPlayerHand(data?.playerHand)
    setDealerHand(data?.dealerHand)
    setMessage(data?.message)
    setScore(data?.score)
   }

   const handleReset = async () => {
    const resp = await fetch('/api',{method:"GET"})
    const data = await resp.json()
    setPlayerHand(data?.playerHand)
    setDealerHand(data?.dealerHand)
    setMessage(data?.message)
    setScore(data?.score)
   }

  useEffect(()=>{
    initGame()
  },[])

  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen">
      <h1 className="text-3xl bold">welcome to web3 game BlackJack</h1>
      <h2 className={`text-2xl bold ${message.includes('win') ? 'text-green-300' : 'text-amber-300'}`}>Score: {score} {message}</h2>
      <div>
          <h2>Dealer Hand:</h2>
           <div className="flex gap-2">
            {dealerHand.map((card,index)=>(
              <div key={index} className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between">
                <p className="self-start p-2 text-lg">{card?.rank}</p>
                <p className="self-center text-3xl">{card?.suit}</p>
                <p className="self-end p-2 text-lg">{card?.rank}</p>
              </div>
            ))}
           </div>
      </div>
       <div>
          <h2>Player Hand:</h2>
           <div className="flex gap-2">
           {playerHand.map((card,index)=>(
              <div key={index} className="w-32 h-42 border-1 border-black bg-white rounded-md flex flex-col justify-between">
                <p className="self-start p-2 text-lg">{card?.rank}</p>
                <p className="self-center text-3xl">{card?.suit}</p>
                <p className="self-end p-2 text-lg">{card?.rank}</p>
              </div>
            ))}
          </div>
      </div>
      <div className="flex gap-2">
        {message == '' && (
          <>
            <button className="bg-amber-300 p-2 rounded-md cursor-pointer" onClick={handleHit} >Hit</button>
            <button className="bg-amber-300 p-2 rounded-md cursor-pointer" onClick={handleStand} >Stand</button>
          </>
        )}
        {message != '' && (
          <button className="bg-amber-300 p-2 rounded-md cursor-pointer" onClick={handleReset} >Reset</button>
        )}
      </div>
    </div>
  )
}

export default Home;