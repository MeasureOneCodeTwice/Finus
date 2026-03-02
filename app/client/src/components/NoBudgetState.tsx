import { Wallet } from "lucide-react";
export default function NoBudgetState() {
  return (
    <div className="flex flex-col items-center justify-center my-10 text-center
      p-12 rounded-[20px]
      bg-black backdrop-blur-xs backdrop-grayscale
      border border-green-500/15
      shadow-[0_0_40px_rgba(34,197,94,0.12)]
      transition-all duration-300 hover:shadow-[0_0_60px_rgba(34,197,94,0.25)]"
    >
      {/* Icon */}
      <div className="mb-6 p-4 rounded-full bg-green-500/10 border border-green-500/20">
        <Wallet className="w-10 h-10 text-green-400" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-white mb-2">
        No Budget Available
      </h2>

      {/* Description */}
      <p className="text-gray-400 max-w-md mb-6">
        You currently have no budget to be reported. 
        Create a budget to start tracking your expenses and savings.
      </p>
    </div>
  );
}