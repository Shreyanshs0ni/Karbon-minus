import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LeafBorder } from "@/components/LeafBorder";
import { ToastifyHost } from "@/components/ToastifyHost";
import { ProjectProvider } from "@/context/ProjectContext";
import { ThemeProvider } from "@/context/ThemeContext";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Embodied Carbon Negotiator",
  description:
    "Procurement decision support for embodied carbon and cost in Indian construction.",
  icons: {
    icon: [{ url: "/Logo.png", type: "image/png" }],
    apple: [{ url: "/Logo.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <Script id="landing-dark" strategy="beforeInteractive">
          {`try{var p=window.location.pathname;if(p==="/"||p==="")document.documentElement.classList.add("dark");}catch(e){}`}
        </Script>
        <div
          aria-hidden
          className="app-background-gradient pointer-events-none fixed inset-0 -z-10 rotate-180"
        />
        <LeafBorder />
        <ClerkProvider>
          <ThemeProvider>
            <ToastifyHost />
            <ProjectProvider>
              <div className="relative z-10 min-h-screen">{children}</div>
            </ProjectProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
