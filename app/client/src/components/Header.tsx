import { useState } from "react";
import { VscThreeBars } from "react-icons/vsc";
import { IoPersonCircleSharp } from "react-icons/io5";
import NavBar from "./NavBar";
function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <>
      {isSidebarOpen && <NavBar />}
      <header className="flex items-center justify-between p-4 pl-10 pr-10 bg-gray-800 text-white">
        <VscThreeBars
          className="text-4xl cursor-pointer"
          onClick={toggleSidebar}
        />
        <div className="flex-1">
          <h1 className="text-xl font-bold pl-30">Dashboard</h1>
        </div>
        <IoPersonCircleSharp className="rounded-full h-20 w-20 cursor-pointer" />
      </header>
    </>
  );
}

export default Header;
