import type { Metadata } from "next";
import { Fira_Code } from "next/font/google";
import { Toaster } from "sonner";
import { WalletProvider } from "@/context/wallet-context";
import "./globals.css";

// One monospace family for everything — body, headlines, and labels alike.
// Neither other Stellar project in this account uses mono for display type;
// here it's the whole typographic identity, not just a label accent.
const firaCode = Fira_Code({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_URL = "https://runway.app";
const DESCRIPTION =
  "Runway turns an unpaid invoice into cash today. A funder advances most of its value now; the debtor settles in full, on-chain, whenever they actually pay.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Runway — Get paid on your invoices today, not in 60 days",
    template: "%s · Runway",
  },
  description: DESCRIPTION,
  keywords: [
    "invoice financing",
    "receivables financing",
    "invoice factoring",
    "Stellar",
    "Soroban",
    "working capital",
    "small business",
  ],
  openGraph: {
    title: "Runway — Get paid on your invoices today, not in 60 days",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Runway",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Runway — Get paid on your invoices today, not in 60 days",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${firaCode.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col overflow-x-hidden bg-background text-foreground">
        <WalletProvider>{children}</WalletProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "flex items-start gap-3 w-full border border-border-strong bg-card p-4 text-sm text-foreground shadow-lg",
              title: "font-medium",
              description: "text-muted",
              actionButton: "bg-foreground text-background px-2.5 py-1 text-xs",
              cancelButton: "border border-border-strong px-2.5 py-1 text-xs",
            },
          }}
        />
      </body>
    </html>
  );
}
