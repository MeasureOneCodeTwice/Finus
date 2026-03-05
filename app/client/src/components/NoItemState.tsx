type NoItemStateProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
}
export default function NoItemState({ title, description, icon }: NoItemStateProps) {
  return (
    <div className="flex flex-col items-center justify-center my-10 text-center
      p-12 rounded-[20px]
      bg-black backdrop-blur-xs backdrop-grayscale
      border border-green-500/15
      shadow-[0_0_40px_rgba(34,197,94,0.12)]
      transition-all duration-300 hover:shadow-[0_0_60px_rgba(34,197,94,0.25)]"
    >
      {/* Icon */}
      {icon && (
        <div className="mb-6 p-4 rounded-full bg-green-500/10 border border-green-500/20">
          {icon}
        </div>
      )}

      {/* Title */}
      <h2 className="text-xl font-semibold text-white mb-2">
        {title}
      </h2>

      {/* Description */}
      <p className="text-gray-400 max-w-md mb-6">
        {description}
      </p>
    </div>
  );
}