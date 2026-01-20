import "../styles/tailwind.css";
import "../styles/index.css";

import ThemeInitializer from "../components/ThemeInitializer";

export const metadata = {
  title: "SpeedReader",
  description: "High-velocity RSVP reading experience with customizable settings.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">
        <ThemeInitializer />
        {children}
      </body>
    </html>
  );
}
