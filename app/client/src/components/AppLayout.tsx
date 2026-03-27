import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { IoCheckmarkCircleOutline, IoReorderThreeSharp } from "react-icons/io5";
import NavBar from "./NavBar";
import { SIDEBAR_WIDTH } from "../utils/constants";
import GoalsPanel from "./GoalsPanel";
import type { Goal } from "../types/Goals.ts";
import {
  fetchGoals,
  createGoal,
  updateGoal,
  deleteGoal,
} from "../api/GoalsAPI.ts";
import LoadingSpinner from "@/components/LoadingSpinner";

type AppLayoutProps = {
  onLogout: () => void;
};
export default function AppLayout({ onLogout }: AppLayoutProps) {
  const [isNavBarOpen, setIsNavBarOpen] = useState(false);
  const [isGoalsPanelOpen, setIsGoalsPanelOpen] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const data = await fetchGoals();
      setGoals(data);
    } catch (error) {
      console.error("Failed to load goals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGoal = async () => {
    // need a modal or a form for this placeholder
    const newGoal: Partial<Goal> = {
      type: "reduce_spending",
      name: "New Goal",
      category: "Unknown",
      target: 100,
      current_amount: 0,
      period: "m",
    };

    try {
      const created = await createGoal(newGoal);
      setGoals([...goals, created]);
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  const handleEditGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const updated = await updateGoal(goalId, updates);
      // console.log("Updated goal:", updated);
      setGoals(goals.map((g) => (g.id === goalId ? updated : g)));
    } catch (error) {
      console.error("Failed to update goal:", error);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      setGoals(goals.filter((g) => g.id !== goalId));
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const handleOpenPanel = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setIsGoalsPanelOpen(true);
  };

  const handleClosePanel = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsGoalsPanelOpen(false);
    }, 200); //200ms delay before the goals panel closes
  };

  function toggleSidebar() {
    setIsNavBarOpen((prev) => !prev);
  }

  return (
    <div className="relative min-h-screen bg-[#f6f7fb]">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open navigation"
        title="Open navigation"
        disabled={isNavBarOpen}
        className={`${isNavBarOpen ? "invisible" : ""} 
            fixed top-[14px] left-[14px] z-50
            w-[45px] h-[45px]
            rounded-[14px]
            border border-[rgba(15,23,42,0.10)]
            bg-[rgba(24,255,63,0.92)]
            backdrop-blur-md
            shadow-[0_10px_24px_rgba(2,6,23,0.10)]
            cursor-pointer
            place-items-center
            color-[#0f172a]
            p-0 leading-none
          `}
      >
        <IoReorderThreeSharp
          className="
              text-[26px]
              block
              leading-none
              translate-y-px
            "
        />
      </button>
      <button
        type="button"
        aria-label="Open Goals"
        title="Open Goals"
        disabled={isNavBarOpen}
        className={`${isNavBarOpen ? "invisible" : ""} 
            fixed top-[14px] left-[73px] z-50
            w-[45px] h-[45px]
            rounded-[14px]
            border border-[rgba(15,23,42,0.10)]
            bg-[rgba(24,255,63,0.92)]
            backdrop-blur-md
            shadow-[0_10px_24px_rgba(2,6,23,0.10)]
            cursor-pointer
            place-items-center
            color-[#0f172a]
            p-0 leading-none
          `}
        onMouseEnter={handleOpenPanel}
        onMouseLeave={handleClosePanel}
      >
        <IoCheckmarkCircleOutline
          className="
              text-[26px]
              block
              leading-none
              translate-y-px
            "
        />
      </button>
      <div
        onMouseEnter={handleOpenPanel}
        onMouseLeave={handleClosePanel}
        className={`
            fixed top-[14px] left-[104px] z-40
            w-[320px] max-h-[80vh]
            bg-black/95 backdrop-blur-lg
            border border-green-500/20
            rounded-[14px]
            shadow-[0_0_40px_rgba(34,197,94,0.15)]
            transition duration-300 ease-in-out
            overflow-hidden
            ${
              isGoalsPanelOpen
                ? "opacity-100 translate-x-4 pointer-events-auto"
                : "opacity-0 translate-x-0 pointer-events-none"
            }
          `}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <GoalsPanel
            goals={goals}
            onAddGoal={handleAddGoal}
            onEditGoal={handleEditGoal}
            onDeleteGoal={handleDeleteGoal}
            maxGoals={5}
          />
        )}
      </div>

      {isNavBarOpen && (
        <NavBar
          isOpen={isNavBarOpen}
          onClose={() => setIsNavBarOpen(false)}
          onLogout={onLogout}
        />
      )}

      <div
        className="min-h-screen bg-[#1d1d1d] transition-[margin-left] duration-100 ease-in-out"
        style={{ marginLeft: isNavBarOpen ? `${SIDEBAR_WIDTH}px` : "0px" }}
      >
        <Outlet />
      </div>
    </div>
  );
}
