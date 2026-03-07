type NoTransactionReportProps = {
  icon: React.ReactElement;
  title: string;
  description: string;
};
function NoTransactionReport(props: NoTransactionReportProps) {
  const { icon, title, description } = props;
  return (
    <div className="flex flex-col items-center justify-center my-10 text-center p-12">
      {/* Icon */}
      <div className="mb-6 p-4 rounded-full bg-green-500/10 border border-green-500/20">
        {icon}
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>

      {/* Description */}
      <p className="text-gray-400 max-w-md mb-6">{description}</p>
    </div>
  );
}

export default NoTransactionReport;
