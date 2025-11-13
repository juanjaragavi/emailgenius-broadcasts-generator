import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { TopAdsNavigation } from "@/components/top-ads-navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "TopNetworks - Generador de Broadcasts de Email",
  description:
    "Generador profesional de broadcasts de email optimizados para ConvertKit y ActiveCampaign by TopNetworks",
  icons: {
    icon: [
      {
        url: "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
        sizes: "any",
      },
      {
        url: "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
    shortcut:
      "https://storage.googleapis.com/media-topfinanzas-com/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={poppins.variable}>
      <head>
        <link
          rel="icon"
          href="https://storage.googleapis.com/media-topfinanzas-com/favicon.png"
          sizes="any"
        />
        <link
          rel="icon"
          href="https://storage.googleapis.com/media-topfinanzas-com/favicon.png"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href="https://storage.googleapis.com/media-topfinanzas-com/favicon.png"
        />
      </head>
      <body className="font-sans">
        <Script
          id="topads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.topAds = window.topAds || {};

topAds.config = {
  domain: "topfinanzas.com",
  networkCode: "23062212598",
  autoStart: false,
  lazyLoad: "hard",
  refresh: {
    time: 30,
    status: "active",
    anchor: "active",
  },
  formats: {
    anchor: {
      status: "active",
      position: "bottom",
    },
    interstitial: {
      status: "active",
      include: [],
      exclude: [],
    },
    offerwall: {
      status: "active",
      logoUrl:
        "https://us.topfinanzas.com/wp-content/uploads/2024/10/LOGO-EnglishUS-COLOR.png",
      websiteName: "TopFinanzas",
      cooldown: "12",
      include: [],
      exclude: [],
    },
  },
};

(function () {
  var w = window.top,
    d = w.document,
    h = d.head || d.getElementsByTagName("head")[0];
  var s = d.createElement("script");
  s.src = "//test-topads.tbytpm.easypanel.host/topAds.min.js";
  s.type = "text/javascript";
  s.defer = true;
  s.async = true;
  s.setAttribute("data-cfasync", "false");
  h.appendChild(s);
})();`,
          }}
        />
        <TopAdsNavigation />
        <div className="min-h-screen bg-gradient-to-br from-lime-50 via-cyan-50 to-blue-100">
          {children}
        </div>
      </body>
    </html>
  );
}
