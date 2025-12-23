import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <header className="py-4 sm:py-6 relative">
          <Link
            href="/login"
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-white text-black font-semibold text-sm px-4 py-2 rounded hover:bg-gray-100 hover:-translate-y-0.5 transition-all"
          >
            Client Login
          </Link>
          <Image
            src="/images/logo.png"
            alt="Nexus Growth Partners"
            width={320}
            height={80}
            className="mx-auto max-w-[200px] sm:max-w-[280px] md:max-w-[320px] h-auto"
            priority
          />
        </header>

        {/* Hero Section */}
        <section className="text-center py-2 sm:py-4 animate-fade-in">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-white leading-tight tracking-tight mb-2">
            How to Turn Your Course or Mentorship into a Real Education Business
            that CONSISTENTLY Brings in 6 Figures EVERY MONTH
          </h1>
        </section>

        {/* Video Section */}
        <section className="mb-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative w-full max-w-[800px] mx-auto rounded-lg overflow-hidden shadow-2xl border border-white/10">
            <div
              id="wistia-player-container"
              className="aspect-video bg-black"
              dangerouslySetInnerHTML={{
                __html: `<wistia-player media-id="jxb7a4az5k" aspect="1.7777777777777777"></wistia-player>`,
              }}
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center py-4 sm:py-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <Link
            href="/booking"
            className="inline-block bg-white text-black font-semibold text-base sm:text-lg px-8 sm:px-10 py-4 rounded hover:bg-gray-100 hover:-translate-y-0.5 transition-all w-full sm:w-auto"
          >
            Book a Call
          </Link>
        </section>
      </div>

      {/* Wistia Scripts */}
      <Script
        src="https://fast.wistia.com/player.js"
        strategy="lazyOnload"
      />
      <Script
        src="https://fast.wistia.com/embed/jxb7a4az5k.js"
        strategy="lazyOnload"
      />
    </div>
  );
}
