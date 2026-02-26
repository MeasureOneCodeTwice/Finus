import { Sidebar } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import {  CgHome } from "react-icons/cg";
import { FaTimes } from "react-icons/fa";
import { SIDEBAR_WIDTH } from "@/utils/constants";
type NavigationBarProps = {
  isOpen: boolean;
  onClose: () => void;
};
function NavBar({ isOpen, onClose }: NavigationBarProps) {
  const location = useLocation();

  if (!isOpen) return null;

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: <CgHome /> },

  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[rgba(2,6,23,0.22)] z-[39]"
        onClick={onClose}
        aria-hidden="true"
      />

      <Sidebar
        width={`${SIDEBAR_WIDTH}px`}
        rootStyles={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 40,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid rgba(15,23,42,0.08)",
          background: "rgba(255,255,255,0.96)",
          boxShadow: "0 14px 40px rgba(2,6,23,0.10)",
        }}
        className="!bg-transparent"
      >
        <div className="flex flex-col h-full bg-[rgba(255,255,255,0.96)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-2.5 px-3 py-[14px] border-b border-[rgba(15,23,42,0.06)] bg-[rgba(248,250,252,0.85)]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-[36px] h-[36px] rounded-[12px] bg-slate-900 text-white grid place-items-center font-black shrink-0">
                U
              </div>

              <div>
                <div className="text-[15px] font-black text-slate-900 leading-tight">
                  Navigation
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  User Portal
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Close navigation"
              title="Close navigation"
              type="button"
              className="
                w-[38px] h-[38px]
                rounded-[20px]
                border border-[rgba(15,23,42,0.10)]
                bg-white
                shadow-[0_1px_0_rgba(2,6,23,0.04)]
                shrink-0
                leading-none
                p-0
                flex items-center justify-center
                shrink-0
                hover:bg-slate-50
              "
            ><span><FaTimes className="text-[18px]"/></span>
            </button>
          </div>

          {/* Nav links */}
          <div className="grid gap-1.5 p-2.5 content-start">
            {navItems.map((item) => {
              const active = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[14px]
                    font-bold no-underline border transition
                    ${
                      active
                        ? "text-slate-900 bg-[rgba(248,250,252,0.95)] border-[rgba(15,23,42,0.08)] shadow-[0_6px_18px_rgba(2,6,23,0.04)]"
                        : "text-slate-700 border-transparent hover:bg-slate-50"
                    }
                  `}
                >
                  <span
                    className={`
                      w-[18px] h-[18px] grid place-items-center text-lg shrink-0
                      ${active ? "text-red-600" : "text-slate-500"}
                    `}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </Sidebar>
    </>
  );
}

export default NavBar;