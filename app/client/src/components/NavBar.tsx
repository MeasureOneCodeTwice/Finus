import { Sidebar } from "react-pro-sidebar";
import { Link, useLocation } from "react-router-dom";
import {  CgHome } from "react-icons/cg";
import { FaSignOutAlt, FaTimes } from "react-icons/fa";
import { SIDEBAR_WIDTH } from "@/utils/constants";
type NavigationBarProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
};
function NavBar({ isOpen, onClose, onLogout }: NavigationBarProps) {
  const location = useLocation();
  if (!isOpen) return null;

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: <CgHome /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[39]"
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
          background: "transparent",
        }}
        className="bg-transparent!"
      >
        <div
          className="
            flex flex-col h-full
            bg-gradient-to-b from-[#0b1510] to-[#050806]
            border-r border-green-500/15
            shadow-[0_0_40px_rgba(34,197,94,0.15)]
            backdrop-blur-xl
          "
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-green-500/10">
            <div className="flex items-center gap-3">
              <div
                className="
                  w-9 h-9 rounded-xl
                  bg-green-500/15
                  text-green-400
                  grid place-items-center
                  font-black
                  shadow-[0_0_20px_rgba(34,197,94,0.35)]
                "
              >
                U
              </div>

              <div>
                <div className="text-sm font-bold text-white leading-tight">
                  Navigation
                </div>
                <div className="text-xs text-green-400/70">
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
                w-9 h-9 rounded-full
                border border-green-500/20
                bg-black/40
                text-green-400
                grid place-items-center
                hover:bg-green-500/10
                transition
              "
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Nav links */}
          <div className="grid gap-1.5 p-3 content-start">
            {navItems.map((item) => {
              const active = location.pathname === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-xl
                    font-semibold transition-all
                    ${
                      active
                        ? "bg-green-500/15 text-white border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.25)]"
                        : "text-slate-300 hover:bg-green-500/10"
                    }
                  `}
                >
                  <span
                    className={`
                      w-5 h-5 grid place-items-center text-lg
                      ${active ? "text-green-400" : "text-slate-400"}
                    `}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Footer Sign Out */}
          <div className="mt-auto p-3 border-t border-green-500/10">
            <button
              type="button"
              onClick={onLogout}
              aria-label="Sign out"
              title="Sign out"
              className="
                w-full flex items-center gap-3
                px-4 py-2.5
                rounded-xl
                border border-red-500/30
                bg-red-500/10
                text-red-400
                font-bold
                hover:bg-red-500/20
                transition
              "
            >
              <span className="w-5 h-5 grid place-items-center">
                <FaSignOutAlt />
              </span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </Sidebar>
    </>
  );
}

export default NavBar;