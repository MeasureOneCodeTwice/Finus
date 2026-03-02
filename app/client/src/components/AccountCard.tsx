import { cn } from "@/lib/utils";

type AccountCardTone = "primary" | "success" | "warning" | "danger" | "info";

type AccountCardProps = {
  title: string;
  amount: string;
  tone?: AccountCardTone;
};

const toneStyles: Record<AccountCardTone, string> = {
  primary: "border-primary/40 bg-primary/10 text-primary",
  success: "border-emerald-400/35 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/35 bg-amber-400/10 text-amber-300",
  danger: "border-rose-400/35 bg-rose-400/10 text-rose-300",
  info: "border-sky-400/35 bg-sky-400/10 text-sky-300",
};

function AccountCard({ title, amount, tone = "primary" }: AccountCardProps) {
  return (
    <article
      className={cn(
        "rounded-lg border px-4 py-5 transition-transform duration-200 hover:-translate-y-0.5",
        toneStyles[tone],
      )}
    >
      <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-foreground/80">
        {title}
      </h2>
      <p className="mt-3 text-2xl font-bold text-foreground">{amount}</p>
    </article>
  );
}

export default AccountCard;
