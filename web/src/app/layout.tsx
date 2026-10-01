import { Metadata, Viewport } from "next";
import "../../styles/global.css";

export const metadata: Metadata = {
  title: "Editor de video",
  description: "Sube tu grabación y sale editada con tu estilo.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
