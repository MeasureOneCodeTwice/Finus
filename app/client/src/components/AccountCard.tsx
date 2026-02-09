function AccountCard(props: any) {
  const { title, amount, backgroundColor } = props;
  return (
    <div className={`flex-1 bg-[${backgroundColor}] px-4 py-5 rounded-lg shadow-2xl`}>
      <h2 className="text-xl text-white font-bold mb-4">{title}</h2>
      <p className="text-3xl text-white font-semibold">{amount}</p>
    </div>
  )
}

export default AccountCard