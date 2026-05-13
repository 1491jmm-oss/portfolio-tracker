import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CurrencyProvider } from "@/components/currency-provider";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portfolio Tracker",
  description: "Dashboard local de seguimiento de inversiones",
};

const themeInitScript = `
try {
  var theme = localStorage.getItem("portfolio-tracker-theme") || "system";
  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  var resolved = theme === "system" ? (systemDark ? "dark" : "light") : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
} catch (error) {
  document.documentElement.classList.add("dark");
  document.documentElement.dataset.theme = "dark";
}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <CurrencyProvider>{children}</CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
