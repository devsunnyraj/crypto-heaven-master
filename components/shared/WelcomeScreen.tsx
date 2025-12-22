"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function WelcomeScreen() {
  const { isLoaded, userId } = useAuth();
  const [show, setShow] = useState(true); // Start as true to prevent homepage flash
  const [contentReady, setContentReady] = useState(false);
  const [shouldCheck, setShouldCheck] = useState(false);

  useEffect(() => {
    // Enable checking after mount to prevent hydration error
    setShouldCheck(true);
    
    // Immediately check sessionStorage on mount
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (hasSeenWelcome) {
      setShow(false);
      setContentReady(true);
    }
  }, []);

  useEffect(() => {
    if (contentReady) {
      document.body.classList.add('content-ready');
    }
  }, [contentReady]);

  useEffect(() => {
    if (!shouldCheck) return;
    
    // Wait for Clerk to load
    if (!isLoaded) return;

    // Hide if not authenticated
    if (!userId) {
      setShow(false);
      setContentReady(true);
      return;
    }

    // Check if welcome screen was already shown in this session
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");

    if (!hasSeenWelcome) {
      setShow(true);
      sessionStorage.setItem("hasSeenWelcome", "true");

      // Show content before welcome screen starts fading (at 2.4s, just before fadeOut animation)
      const showContentTimer = setTimeout(() => {
        setContentReady(true);
      }, 2400);

      // Hide the welcome screen after animation completes
      const hideTimer = setTimeout(() => {
        setShow(false);
      }, 3000);

      return () => {
        clearTimeout(showContentTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setShow(false);
      setContentReady(true);
    }
  }, [shouldCheck, isLoaded, userId]);

  if (!show) return null;

  return (
    <>
      {show && (
        <div className="welcome-screen-overlay" style={{ display: 'flex' }}>
          <div className="container">
            <span className="text first-text [font-family:var(--font-dancing)]">Welcome to </span>
            <span className="text sec-text [font-family:var(--font-dancing)]">CryptoHeaven</span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .welcome-screen-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 99999;
          justify-content: center;
          align-items: center;
          background: linear-gradient(rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.85)),
            url('/assets/color-smoke-abstract-wallpaper-aesthetic-background-design.jpg');
          background-size: cover;
          background-position: center;
          animation: fadeOut 0.5s ease-in-out 2.5s forwards;
        }

        .welcome-screen-overlay .container {
          text-align: center;
        }

        .welcome-screen-overlay .container .text {
          position: relative;
          font-weight: 600;
          font-size: 60px;
        }

        .welcome-screen-overlay .container .text.first-text {
          color: white;
        }

        .welcome-screen-overlay .container .text.sec-text {
          background: linear-gradient(90deg, #f1c0ff, #b8c0ff, #80ffdb);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-screen-overlay .text.sec-text::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background-color: black;
          animation: animate 6s steps(12) forwards, blink 1.6s steps(15) infinite;
        }

        @keyframes blink {
          0% {
            border-left: 2px solid rgba(255, 255, 255, 1);
          }
          25% {
            border-left: 2px solid rgba(255, 255, 255, 0);
          }
          75% {
            border-left: 2px solid rgba(255, 255, 255, 1);
          }
          100% {
            border-left: 2px solid rgba(255, 255, 255, 0);
          }
        }

        @keyframes animate {
          20%, 40%, 60%, 80% {
            left: calc(100%);
          }
          100% {
            left: calc(100%);
          }
        }

        @keyframes fadeOut {
          to {
            opacity: 0;
            pointer-events: none;
          }
        }

        @media (max-width: 768px) {
          .welcome-screen-overlay .container .text {
            font-size: 40px;
          }
        }

        @media (max-width: 480px) {
          .welcome-screen-overlay .container .text {
            font-size: 30px;
          }
        }
      `}</style>
    </>
  );
}
