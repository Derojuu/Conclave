import { ConclaveConsole } from "@/components/sections/conclave-console";

export function HeroSection() {
  return (
    <section
      className="relative flex flex-col items-center overflow-hidden py-12 sm:py-16"
      id="top"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="relative z-10 w-full max-w-[1280px]">
        <ConclaveConsole />
      </div>
    </section>
  );
}
