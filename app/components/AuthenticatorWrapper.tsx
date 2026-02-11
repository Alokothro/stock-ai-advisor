'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import type { AuthUser } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

type SignOut = () => void;

interface AuthenticatorWrapperProps {
  children: React.ReactNode | ((props: { signOut?: SignOut; user?: AuthUser }) => React.JSX.Element);
}

export default function AuthenticatorWrapper({ children }: AuthenticatorWrapperProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Only create flakes when not authenticated
    if (isAuthenticated) return;

    const createFlake = () => {
      const flake = document.createElement('div');
      flake.className = 'bronze-flake';
      flake.style.left = Math.random() * 100 + '%';
      flake.style.animationDuration = (Math.random() * 3 + 2) + 's';
      flake.style.opacity = (Math.random() * 0.5 + 0.3).toString();
      flake.style.width = (Math.random() * 8 + 4) + 'px';
      flake.style.height = flake.style.width;

      document.querySelector('.auth-background')?.appendChild(flake);

      setTimeout(() => {
        flake.remove();
      }, 5000);
    };

    const interval = setInterval(createFlake, 200);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <Authenticator>
      {({ signOut, user }) => {
        // Wrapped sign out that resets state
        const wrappedSignOut = async () => {
          setIsAuthenticated(false);
          if (signOut) {
            await signOut();
          }
        };

        // If user is authenticated, show the app
        if (user) {
          if (typeof children === 'function') {
            return children({ signOut: wrappedSignOut, user });
          }
          return <>{children}</>;
        }

        // If not authenticated, show custom landing page
        return (
          <div className="auth-background">
            <style jsx global>{`
        .auth-background {
          min-height: 100vh;
          background: #000000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        .ticker-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 80px;
          background: rgba(0, 0, 0, 0.8);
          border-bottom: 2px solid #cd7f32;
          overflow: hidden;
          z-index: 5;
          display: flex;
          align-items: center;
        }

        .ticker {
          display: flex;
          white-space: nowrap;
          animation: scroll 30s linear infinite;
        }

        .ticker-item {
          color: #cd7f32;
          font-size: 2rem;
          font-weight: bold;
          padding: 0 3rem;
          display: inline-block;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .auth-logo-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2.5rem;
          margin-top: 80px;
          position: relative;
          z-index: 10;
        }

        .auth-logo {
          width: 180px;
          height: 180px;
          object-fit: contain;
        }

        .bronze-flake {
          position: absolute;
          top: -10px;
          background: linear-gradient(135deg, #cd7f32, #b87333, #cd7f32);
          border-radius: 50%;
          pointer-events: none;
          animation: fall linear forwards;
          box-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
        }

        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
          }
        }

        [data-amplify-authenticator] {
          background: white;
          border-radius: 16px;
          padding: 2rem 2.5rem;
          box-shadow: 0 20px 60px rgba(205, 127, 50, 0.3);
          max-width: 550px;
          width: 90%;
          position: relative;
          z-index: 10;
          overflow: visible;
        }

        [data-amplify-authenticator] [data-amplify-router] {
          background: transparent;
          border: none;
          box-shadow: none;
          max-width: 100%;
          overflow: visible;
        }

        [data-amplify-authenticator] [role="tablist"] {
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 1.5rem;
          overflow: visible;
        }

        [data-amplify-authenticator] [role="tab"] {
          color: #6b7280;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.75rem 0.5rem;
          border: none;
          background: transparent;
          transition: color 0.3s ease;
          white-space: nowrap;
        }

        [data-amplify-authenticator] [role="tab"][aria-selected="true"] {
          color: #cd7f32;
          border-bottom: 3px solid #cd7f32;
        }

        [data-amplify-authenticator] [role="tab"]:hover {
          color: #b87333;
        }

        [data-amplify-authenticator] input {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          padding: 0.75rem;
          font-size: 1rem;
          transition: all 0.3s ease;
          width: 100%;
          box-sizing: border-box;
        }

        [data-amplify-authenticator] input:focus {
          border-color: #cd7f32;
          outline: none;
          box-shadow: 0 0 0 3px rgba(205, 127, 50, 0.1);
        }

        [data-amplify-authenticator] [data-amplify-form] {
          width: 100%;
        }

        [data-amplify-authenticator] [data-amplify-field] {
          width: 100%;
        }

        [data-amplify-authenticator] label {
          color: #000000;
          font-weight: 500;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        [data-amplify-authenticator] button[type="submit"] {
          background: linear-gradient(135deg, #cd7f32, #b87333);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.875rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        [data-amplify-authenticator] button[type="submit"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(205, 127, 50, 0.4);
        }

        [data-amplify-authenticator] button[data-variation="link"] {
          color: #cd7f32;
          font-weight: 500;
        }

        [data-amplify-authenticator] button[data-variation="link"]:hover {
          color: #b87333;
        }

        [data-amplify-authenticator] [role="alert"] {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          padding: 0.75rem;
        }

        [data-amplify-footer] {
          display: none;
        }
      `}</style>
          <div className="ticker-wrapper">
            <div className="ticker">
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
              <span className="ticker-item">STOCK AI ADVISOR</span>
            </div>
          </div>
          <div className="auth-logo-container">
            <img src="/logo.png" alt="Logo" className="auth-logo" />
          </div>
          {/* Render the default Authenticator form here */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            {/* This is a placeholder - the Authenticator will render its form here */}
          </div>
        </div>
        );
      }}
    </Authenticator>
  );
}
