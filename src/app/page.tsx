"use client"
import { useState } from "react";


const Home = () => {
  const [message, setMessage] = useState('')
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const suits = [ "♥️","♠️", "♣️", "♦️"]
  const initDeck = ranks?.map((rank)=>suits?.map((suit)=>({"rank":rank,"suit":suit}))).flat(Infinity)
  return (
    <div className="flex flex-col gap-2 items-center justify-center h-screen">
      <h1 className="text-3xl bold">welcome to web3 game BlackJack</h1>
      <h2 className="text-2xl bold">message: {message}</h2>
      <div>
          <h2>Dealer:</h2>
           <div className="flex gap-2">
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
           </div>
      </div>
       <div>
          <h2>Player:</h2>
           <div className="flex gap-2">
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
            <div className="w-32 h-42 border-1 border-black bg-white rounded-md"></div>
          </div>
      </div>
      <div className="flex gap-2">
        <button className="bg-amber-300 p-2 rounded-md cursor-pointer">Hit</button>
        <button className="bg-amber-300 p-2 rounded-md cursor-pointer">Stand</button>
        <button className="bg-amber-300 p-2 rounded-md cursor-pointer">Reset</button>
      </div>
    </div>
  )
}

export default Home;