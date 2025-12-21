import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import "../globals.css";
import LeftSidebar from "@/components/shared/LeftSidebar";
import Bottombar from "@/components/shared/Bottombar";
import RightSidebar from "@/components/shared/RightSidebar";
import Topbar from "@/components/shared/Topbar";
import LoadingIndicator from "@/components/shared/LoadingIndicator";

const inter = Inter({ subsets: ["latin"] });
const dancingScript = Dancing_Script({ subsets: ["latin"], variable: '--font-dancing' });

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Crypto Heaven",
  description: "Designed specially for crypto airdrops",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorBackground: '#101012',
          colorText: '#EFEFEF',
          colorTextSecondary: '#7C7C8D',
          colorPrimary: '#877EFF',
          colorInputBackground: '#1F1F22',
          colorInputText: '#EFEFEF',
        },
        elements: {
          card: 'bg-dark-2',
          formButtonPrimary: 'bg-primary-500 hover:bg-primary-500 text-light-1',
          formFieldInput: 'bg-dark-3 text-light-1',
          headerTitle: 'text-light-1',
          headerSubtitle: 'text-light-2',
          socialButtonsBlockButton: 'bg-dark-3 text-light-1 border-dark-4 hover:bg-dark-4',
          socialButtonsBlockButtonText: 'text-light-1',
          dividerLine: 'bg-dark-4',
          dividerText: 'text-light-3',
          formFieldLabel: 'text-light-2',
          identityPreviewText: 'text-light-1',
          identityPreviewEditButton: 'text-light-2',
          formFieldInputShowPasswordButton: 'text-light-2',
          formHeaderTitle: 'text-light-1',
          formHeaderSubtitle: 'text-light-2',
          formResendCodeLink: 'text-primary-500',
          otpCodeFieldInput: 'bg-dark-3 text-light-1',
          formFieldAction: 'text-light-2',
          footerActionLink: 'text-primary-500',
          footerActionText: 'text-light-2',
          profileSectionTitleText: 'text-light-1',
          profileSectionContent: 'text-light-2',
          accordionTriggerButton: 'text-light-1 hover:bg-dark-3',
          accordionContent: 'text-light-2',
          navbar: 'bg-dark-2',
          navbarButton: 'text-light-1 hover:bg-dark-3',
          navbarButtonIcon: 'text-light-2',
          pageScrollBox: 'bg-dark-1',
          page: 'bg-dark-1',
          badge: 'bg-dark-3 text-light-1',
          buttonArrowIcon: 'text-light-2',
          activeDevice: 'text-light-1',
          avatarImageActionsUpload: 'text-light-1',
          fileDropAreaBox: 'bg-dark-3',
          fileDropAreaIcon: 'text-light-2',
          fileDropAreaButtonPrimary: 'text-light-1',
          fileDropAreaHint: 'text-light-2',
        },
      }}
    >
      <html lang='en'>
        <body className={`${inter.className} ${dancingScript.variable}`}>
          <LoadingIndicator />
          <Topbar />

          <main className='flex flex-row'>
            <LeftSidebar />
            <section className='main-container'>
              <div className='w-full max-w-4xl'>{children}</div>
            </section>
            {/* @ts-ignore */}
            <RightSidebar />
          </main>

          <Bottombar />
        </body>
      </html>
    </ClerkProvider>
  );
}
