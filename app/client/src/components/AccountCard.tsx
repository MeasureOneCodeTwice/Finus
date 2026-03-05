type AccountCardProps = {
  title: string;
  amount: string;
  trend?: 'positive' | 'negative' | 'neutral';// for tracking performance at a glance instead of a budget
  isLoading?: boolean;
};
export default function AccountCard({ title, amount, trend, isLoading}: AccountCardProps) {
  const getAmountColor = () => {
    if (isLoading) return 'text-gray-500';
    if (trend === 'positive') return 'text-green-400';
    if (trend === 'negative') return 'text-red-400';
    if (trend === 'neutral') return 'text-white';
    
    //auto-detect from amount string
    if (amount.includes('-') || amount.startsWith('-')) return 'text-red-400';
    if (amount !== 'Loading...' && amount !== '$0' && !amount.includes('Loading')) {
      return 'text-green-400';
    }
    return 'text-white';
  };
  return (
    <div
      className="
        flex-1
        relative
        px-6 py-6
        rounded-[10px]
        bg-gradient-to-br from-[#0f1f14] to-[#0a0a0a]
        border border-green-500/20
        shadow-[0_0_30px_rgba(34,197,94,0.15)]
        backdrop-blur-xl
        transition-all duration-300 ease-in-out
        hover:scale-105
        hover:shadow-[0_0_40px_rgba(34,197,94,0.35)]
      "
    >
      {/* subtle glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-green-500/5 opacity-0 hover:opacity-100 transition duration-300" />

      <h2 className="text-sm uppercase tracking-wider text-green-400/80 font-semibold mb-3">
        {title}
      </h2>

      <p className={'text-3xl font-bold ${getAmountColor()}'}>
        {amount}
      </p>
      {isLoading && (
        <div className="w-full h-1 bg-gray-700 mt-2 rounded overflow-hidden">
          <div className="w-1/2 h-full bg-green-500/30 animate-pulse" />
        </div>
      )}
    </div>
  );
}