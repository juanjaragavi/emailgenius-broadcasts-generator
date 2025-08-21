import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";

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
        <div className="min-h-screen bg-gradient-to-br from-lime-50 via-cyan-50 to-blue-100">
          {children}
        </div>
      </body>
    </html>
  );
}
