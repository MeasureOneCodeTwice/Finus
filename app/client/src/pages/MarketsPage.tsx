import MarketDashboardSection from "@/components/MarketDashboardSection";
import type { AuthSession } from "@/types/authTypes";

type MarketsPageProps = {
  session?: AuthSession;
};

function MarketsPage({ session }: MarketsPageProps) {
  const glowLeft = (
    <div
      className="
      fixed
      w-[28rem] h-[28rem]
      rounded-full
      opacity-25
      blur-[90px]
      pointer-events-none
      animate-[float_9s_ease-in-out_infinite]
      bg-[radial-gradient(circle,_#18cc5f_0%,_#0d4d26_70%,_transparent_100%)]
      -top-32 -left-32
    "
    />
  );

  const glowRight = (
    <div
      className="
      fixed
      w-[28rem] h-[28rem]
      rounded-full
      opacity-25
      blur-[90px]
      pointer-events-none
      animate-[float_9s_ease-in-out_infinite]
      bg-[radial-gradient(circle,_#27a552_0%,_#0f411d_65%,_transparent_100%)]
      -right-32 -bottom-32
    "
      style={{ animationDelay: "1.2s" }}
    />
  );

  return (
    <section className="relative min-h-screen bg-[#030805] px-5 py-10 md:px-10 xl:px-16">
      {glowLeft}
      {glowRight}
      <h1 className="mb-4 text-4xl font-bold">
        Markets for {session?.user.first_name ?? session?.user.name ?? "you"}
      </h1>
      <p className="max-w-3xl text-lg text-green-500">
        Search for stocks and foreign exchange instruments 
      </p>
      <MarketDashboardSection />
    </section>
  );
}

export default MarketsPage;
