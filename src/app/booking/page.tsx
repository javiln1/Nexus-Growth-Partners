import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-[900px] mx-auto px-4 sm:px-8">
        {/* Header */}
        <header className="text-center py-4 sm:py-6">
          <Link href="/">
            <Image
              src="/images/logo.png"
              alt="Nexus Growth Partners"
              width={400}
              height={100}
              className="mx-auto max-w-[200px] sm:max-w-[320px] md:max-w-[400px] h-auto"
              priority
            />
          </Link>
        </header>

        {/* Hero Section */}
        <section className="text-center py-2 sm:py-4 animate-fade-in">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-tight tracking-tight">
            Book Your Call Below
          </h1>
        </section>

        {/* Cal.com Embed */}
        <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div
            id="my-cal-inline-nexus-growth-partners-strategy-session"
            className="w-full min-h-[600px] h-auto overflow-visible"
          />
        </section>
      </div>

      {/* Cal.com Script */}
      <Script
        id="cal-embed"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function (C, A, L) {
              let p = function (a, ar) { a.q.push(ar); };
              let d = C.document;
              C.Cal = C.Cal || function () {
                let cal = C.Cal;
                let ar = arguments;
                if (!cal.loaded) {
                  cal.ns = {};
                  cal.q = cal.q || [];
                  d.head.appendChild(d.createElement("script")).src = A;
                  cal.loaded = true;
                }
                if (ar[0] === L) {
                  const api = function () { p(api, arguments); };
                  const namespace = ar[1];
                  api.q = api.q || [];
                  if (typeof namespace === "string") {
                    cal.ns[namespace] = cal.ns[namespace] || api;
                    p(cal.ns[namespace], ar);
                    p(cal, ["initNamespace", namespace]);
                  } else p(cal, ar);
                  return;
                }
                p(cal, ar);
              };
            })(window, "https://app.cal.com/embed/embed.js", "init");

            Cal("init", "nexus-growth-partners-strategy-session", { origin: "https://app.cal.com" });

            Cal.ns["nexus-growth-partners-strategy-session"]("inline", {
              elementOrSelector: "#my-cal-inline-nexus-growth-partners-strategy-session",
              config: { "layout": "month_view", "theme": "dark" },
              calLink: "admin-admin-vm4be7/nexus-growth-partners-strategy-session",
            });

            Cal.ns["nexus-growth-partners-strategy-session"]("ui", {
              "theme": "dark",
              "hideEventTypeDetails": true,
              "layout": "month_view"
            });
          `,
        }}
      />
    </div>
  );
}
