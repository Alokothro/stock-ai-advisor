'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useEffect } from 'react';

interface AuthenticatorWrapperProps {
  children: (props: { signOut?: () => void; user?: any }) => React.ReactNode;
}

export default function AuthenticatorWrapper({ children }: AuthenticatorWrapperProps) {
  useEffect(() => {
    // Create bronze flakes falling animation
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
  }, []);

  return (
    <div className="auth-background">
      <style jsx global>{`
        .auth-background {
          min-height: 100vh;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
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
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 20px 60px rgba(205, 127, 50, 0.3);
          max-width: 500px;
          width: 90%;
          position: relative;
          z-index: 10;
        }

        [data-amplify-authenticator] [data-amplify-router] {
          background: transparent;
          border: none;
          box-shadow: none;
        }

        /* Tab styling */
        [data-amplify-authenticator] [role="tablist"] {
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 2rem;
        }

        [data-amplify-authenticator] [role="tab"] {
          color: #6b7280;
          font-weight: 600;
          font-size: 1.125rem;
          padding: 0.75rem 1.5rem;
          border: none;
          background: transparent;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: all 0.3s ease;
        }

        [data-amplify-authenticator] [role="tab"][aria-selected="true"] {
          color: #cd7f32;
          border-bottom-color: #cd7f32;
        }

        [data-amplify-authenticator] [role="tab"]:hover {
          color: #b87333;
        }

        /* Input fields */
        [data-amplify-authenticator] input {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 0.875rem 1rem;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        [data-amplify-authenticator] input:focus {
          border-color: #cd7f32;
          outline: none;
          box-shadow: 0 0 0 3px rgba(205, 127, 50, 0.1);
        }

        /* Labels */
        [data-amplify-authenticator] label {
          color: #000000;
          font-weight: 500;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        /* Buttons */
        [data-amplify-authenticator] button[type="submit"] {
          background: linear-gradient(135deg, #cd7f32, #b87333);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 0.875rem;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(205, 127, 50, 0.3);
        }

        [data-amplify-authenticator] button[type="submit"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(205, 127, 50, 0.4);
        }

        [data-amplify-authenticator] button[type="submit"]:active {
          transform: translateY(0);
        }

        /* Secondary buttons */
        [data-amplify-authenticator] button[data-variation="link"] {
          color: #cd7f32;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        [data-amplify-authenticator] button[data-variation="link"]:hover {
          color: #b87333;
        }

        /* Error messages */
        [data-amplify-authenticator] [role="alert"] {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          padding: 0.75rem;
        }

        /* Hide default Amplify branding */
        [data-amplify-footer] {
          display: none;
        }
      `}</style>
      <Authenticator>
        {children}
      </Authenticator>
    </div>
  );
}
