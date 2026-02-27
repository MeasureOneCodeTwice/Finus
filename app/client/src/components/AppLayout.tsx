import { useState } from "react";
import { Outlet } from "react-router-dom";
import { IoReorderThreeSharp } from "react-icons/io5";
import NavBar from "./NavBar";
import { SIDEBAR_WIDTH } from "../utils/constants";
type AppLayoutProps = {
  onLogout : () => void;
};
export default function AppLayout({ onLogout }: AppLayoutProps) {
  const [isNavBarOpen, setIsNavBarOpen] = useState(false);

  function toggleSidebar() {
    setIsNavBarOpen((prev) => !prev);
  }

  return (
    <div className="relative min-h-screen bg-[#f6f7fb]">
      {!isNavBarOpen && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open navigation"
          title="Open navigation"
          className="
            fixed top-[14px] left-[14px] z-50
            w-[46px] h-[46px]
            rounded-[14px]
            border border-[rgba(15,23,42,0.10)]
            bg-[rgba(255,255,255,0.92)]
            backdrop-blur-md
            shadow-[0_10px_24px_rgba(2,6,23,0.10)]
            cursor-pointer
            place-items-center
            color-[#0f172a]
            p-0 leading-none
          "        
        >
          <IoReorderThreeSharp
            className="
              text-[26px]
              block
              leading-none
              translate-y-[1px]
            "
          />
        </button>
      )}

      {isNavBarOpen && (
        <NavBar
          isOpen={isNavBarOpen}
          onClose={() => setIsNavBarOpen(false)}
          onLogout={onLogout}
        />
      )}

      <div
        className="min-h-screen bg-[#f6f7fb] transition-[margin-left] duration-250 ease-in-out"
        style={{
          marginLeft: isNavBarOpen ? `${SIDEBAR_WIDTH}px` : "0px",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}