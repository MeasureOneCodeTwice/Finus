import React from 'react'
import { VscThreeBars } from "react-icons/vsc";
import { IoPersonCircleSharp } from "react-icons/io5";
function Header() {
  return (
    <header className='flex items-center justify-between p-4 pl-10 pr-10 bg-gray-800 text-white'>
      <VscThreeBars className='text-4xl cursor-pointer' />
      <div className='flex-1'>
        <h1 className='text-xl font-bold pl-30'>Dashboard</h1>
      </div>
      {/*<nav className='flex space-x-4'>
        <a href='#' className='hover:text-gray-300'>Home</a>
        <a href='#' className='hover:text-gray-300'>About</a>
        <a href='#' className='hover:text-gray-300'>Contact</a>
      </nav>*/}
      <IoPersonCircleSharp className='rounded-full h-20 w-20 cursor-pointer' />
    </header>
  )
}

export default Header