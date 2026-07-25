import { Icon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";

const comparisonRows = [
  ["Stored data", "Protected", "Protected", "Protected"],
  ["Transmitted data", "Protected", "Protected", "Protected"],
  ["Data being processed", "Exposed", "Exposed", "Protected"],
  ["Individual submissions", "Readable", "Readable", "Confidential"],
  ["Approved result", "Visible", "Visible", "Visible"],
] as const;

const noxCapabilities = [
  {
    title: "Protected execution",
    text: "Decision logic runs inside a confidential execution environment.",
    icon: "cpu" as const,
  },
  {
    title: "Controlled disclosure",
    text: "Only the result approved by the campaign policy is returned.",
    icon: "eye" as const,
  },
  {
    title: "Verifiable process",
    text: "The result can include evidence that the protected computation completed.",
    icon: "search-check" as const,
  },
] as const;

export function NoxSection() {
  return (
    <section className="py-20" id="nox">
      <div className="grid items-start gap-14 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <SectionHeading
            description="Ordinary encryption protects information while it is stored or moving. Confidential computation also protects it while the system is actively using it."
            eyebrow="Powered by iExec Nox"
            title="The system can compute without seeing."
          />

          <div className="mt-10 border-y border-black/[0.06] dark:border-white/[0.06]">
            {noxCapabilities.map((item, index) => (
              <div
                className="grid grid-cols-[48px_1fr] gap-4 border-b border-black/[0.06] py-5 last:border-b-0 dark:border-white/[0.06]"
                key={item.title}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-black/[0.08] text-zinc-500 dark:border-white/[0.08]">
                  <Icon name={item.icon} size={17} />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-[12px] font-bold tracking-[0.1em] text-zinc-950 uppercase dark:text-white">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-zinc-400">
                      NOX / 0{index + 1}
                    </span>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-zinc-500">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-sm border border-black/[0.06] bg-[#EBE8E1] dark:border-white/[0.06] dark:bg-[#111]">
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4 dark:border-white/[0.06]">
            <div>
              <p className="text-[12px] font-bold tracking-[0.12em] text-zinc-950 uppercase dark:text-white">
                Confidentiality boundary matrix
              </p>
              <p className="mt-1 text-[10px] tracking-[0.1em] text-zinc-500 uppercase">
                Runtime protection comparison
              </p>
            </div>
            <span className="flex items-center gap-2 text-[10px] font-bold tracking-[0.1em] text-emerald-500 uppercase">
              <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
              Nox active
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[620px]">
              <div className="grid grid-cols-[1.3fr_repeat(3,0.8fr)] border-b border-black/[0.06] bg-black/[0.02] dark:border-white/[0.06] dark:bg-white/[0.02]">
                {["PROTECTION", "TRADITIONAL", "ENCRYPTED APP", "CONCLAVE"].map(
                  (heading) => (
                    <div
                      className="px-4 py-4 text-[10px] font-bold tracking-[0.1em] text-zinc-500 uppercase"
                      key={heading}
                    >
                      {heading}
                    </div>
                  ),
                )}
              </div>
              {comparisonRows.map((row) => (
                <div
                  className="grid grid-cols-[1.3fr_repeat(3,0.8fr)] border-b border-black/[0.06] last:border-b-0 dark:border-white/[0.06]"
                  key={row[0]}
                >
                  {row.map((cell, cellIndex) => {
                    const protectedByConclave = cellIndex === 3;
                    const exposed = cell === "Exposed" || cell === "Readable";

                    return (
                      <div
                        className={
                          protectedByConclave
                            ? "flex min-h-14 items-center bg-emerald-500/[0.05] px-4 text-[11px] font-bold text-emerald-600 uppercase dark:text-emerald-400"
                            : cellIndex === 0
                              ? "flex min-h-14 items-center px-4 text-[11px] font-bold text-zinc-700 uppercase dark:text-zinc-300"
                              : exposed
                                ? "flex min-h-14 items-center px-4 text-[11px] text-rose-500 uppercase"
                                : "flex min-h-14 items-center px-4 text-[11px] text-zinc-500 uppercase"
                        }
                        key={`${row[0]}-${cellIndex}`}
                      >
                        {protectedByConclave ? (
                          <span className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 bg-emerald-500" />
                            {cell}
                          </span>
                        ) : (
                          cell
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 border-t border-black/[0.06] bg-emerald-500/[0.04] px-5 py-4 dark:border-white/[0.06]">
            <Icon className="text-emerald-500" name="shield" size={16} />
            <p className="text-[11px] leading-5 text-zinc-500">
              Nox extends confidentiality to the moment sensitive inputs are
              combined and evaluated.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
