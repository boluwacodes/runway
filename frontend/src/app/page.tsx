import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Stats } from "@/components/marketing/stats";
import { WhyStellar } from "@/components/marketing/why-stellar";
import { Faq } from "@/components/marketing/faq";
import { Cta } from "@/components/marketing/cta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Stats />
        <WhyStellar />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
