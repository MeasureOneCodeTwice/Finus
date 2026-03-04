type AccountCardProps = {
  title: string;
  amount: string;
  backgroundColor: string | "#2a2a2a";
};
function AccountCard(props: AccountCardProps) {
  const { title, amount, backgroundColor } = props;
  return (
    <div
      className={`flex-1 px-4 py-5 rounded-lg shadow-2xl hover:scale-110 transition duration-300 ease-in-out`}
      style={{ backgroundColor: backgroundColor }}
    >
      <h2 className="text-xl text-white font-bold mb-4">{title}</h2>
      <p className="text-3xl text-white font-semibold">{amount}</p>
    </div>
  );
}

export default AccountCard;
