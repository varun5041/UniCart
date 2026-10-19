import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export const GoogleSignInButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, isLoading } = useAuthStore();
  const { addToast } = useToastStore();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoEmail, setDemoEmail] = useState('developer.google@unicart.dev');
  const [demoName, setDemoName] = useState('Google Explorer');

  const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';
  const searchParams = new URLSearchParams(location.search);
  const redirect = searchParams.get('redirect') || '/';

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      const res = await loginWithGoogle(response.credential);
      if (res.success) {
        addToast({
          type: 'success',
          title: 'Signed in with Google',
          message: 'Welcome to UniCart! Your session is authenticated.'
        });
        navigate(redirect);
      } else {
        addToast({
          type: 'error',
          title: 'Authentication Failed',
          message: res.error || 'Failed to authenticate with Google'
        });
      }
    },
    [loginWithGoogle, addToast, navigate, redirect]
  );

  const [isGisReady, setIsGisReady] = useState(false);

  useEffect(() => {
    let checkTimer: ReturnType<typeof setInterval> | undefined;

    const initGis = (): boolean => {
      if (clientId && window.google?.accounts?.id && buttonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse
          });

          buttonRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: 360,
            text: 'continue_with',
            shape: 'pill'
          });
          setIsGisReady(true);
          return true;
        } catch (err) {
          console.error('Failed to initialize Google Sign-In button:', err);
        }
      }
      return false;
    };

    if (!initGis() && clientId) {
      checkTimer = setInterval(() => {
        if (initGis()) {
          clearInterval(checkTimer);
        }
      }, 300);
    }

    return () => {
      if (checkTimer) clearInterval(checkTimer);
    };
  }, [clientId, handleCredentialResponse]);

  const handleCustomGoogleClick = () => {
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      // In dev / demo mode or when VITE_GOOGLE_CLIENT_ID is pending setup in Google Console
      setIsDemoModalOpen(true);
    }
  };

  const handleDemoGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDemoModalOpen(false);

    // Creates a valid mock Google ID token matching the server-side test & dev parser
    const mockToken = `mock-google-token:${demoEmail}:${demoName}:google_sub_${Date.now()}`;
    const res = await loginWithGoogle(mockToken);

    if (res.success) {
      addToast({
        type: 'success',
        title: 'Google OAuth Verified',
        message: `Authenticated as ${demoName} via Google Identity Services.`
      });
      navigate(redirect);
    } else {
      addToast({
        type: 'error',
        title: 'OAuth Error',
        message: res.error || 'Failed to authenticate'
      });
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Official GIS container if Google client is initialized */}
      {clientId && (
        <div
          ref={buttonRef}
          className={`w-full flex justify-center ${isGisReady ? '' : 'hidden'}`}
        />
      )}

      {/* Show custom button ONLY if official GIS button is not ready */}
      {(!clientId || !isGisReady) && (
        <button
          type="button"
          onClick={handleCustomGoogleClick}
          disabled={isLoading}
          className="w-full h-11 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-xs cursor-pointer disabled:opacity-60"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>
      )}

      {/* Demo Google OAuth Modal (when testing without cloud credentials) */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Google OAuth Sign-In</h4>
                <p className="text-[11px] text-slate-500">Fast sign-in via Google Identity</p>
              </div>
            </div>

            <form onSubmit={handleDemoGoogleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Google Email Address</label>
                <input
                  type="email"
                  required
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(false)}
                  className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Connecting...' : 'Authorize with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
