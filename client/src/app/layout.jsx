import ReduxProvider from "@/store/provider";
import { LanguageProvider } from "@/context/LanguageContext";
import { Toaster } from "react-hot-toast";
import { AppBootstrap } from "@/components/AppBootstrap";
import ChunkErrorReload from "@/components/ChunkErrorReload";
import GoogleTranslateDomGuard from "@/components/GoogleTranslateDomGuard";
import { GLOBAL_TOAST_OPTIONS } from "@/utils/globalToast";
import { inter, manrope, poppins } from "./fonts";
import "./globals.css";

export const metadata = {
  title: {
    default: "E-Commerce",
    template: "%s | E-Commerce",
  },
  description: "E-Commerce store",
  icons: {
    icon: [
      { url: "/vite.png", type: "image/png" },
    ],
    shortcut: "/vite.png",
    apple: "/vite.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${inter.variable} ${poppins.variable}`}
    >
      <body suppressHydrationWarning>
        <ReduxProvider>
          <LanguageProvider>
            <AppBootstrap />
            <ChunkErrorReload />
            <GoogleTranslateDomGuard />
            <Toaster
              position="top-center"
              gutter={10}
              containerStyle={{ zIndex: 130000 }}
              toastOptions={GLOBAL_TOAST_OPTIONS}
            />
            {children}
          </LanguageProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
