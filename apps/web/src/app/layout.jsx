import "./globals.css";
import { ThemeProvider } from "next-themes";

export const metadata = {
  title: "Team Hub",
  description: "Collaborative Team Hub",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}