import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, CheckCircle2, AlertCircle, Unlink, ExternalLink } from 'lucide-react';
import { UserItem } from '../types';
import {
  googleSignIn,
  googleSignOut,
  getGoogleAccessToken,
  initGoogleAuth,
  getCachedGoogleUser,
  isGoogleClientConfigured,
} from '../services/googleAuth';

interface GoogleCalendarBannerProps {
  currentUser: UserItem;
  onSyncComplete?: () => void;
  className?: string;
}

export const GoogleCalendarBanner: React.FC<GoogleCalendarBannerProps> = ({
  currentUser,
  onSyncComplete,
  className = '',
}) => {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connection, setConnection] = useState<{
    connected: boolean;
    email: string | null;
    calendar_id: string | null;
    sync_status: string;
    last_synced_at: string | null;
    events_synced: number;
    note?: string;
  } | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Fetch connection status from backend
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/calendar/status', {
        headers: {
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.connection) {
          setConnection(json.connection);
        }
      }
    } catch (err: any) {
      console.warn('Could not retrieve calendar status:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    initGoogleAuth();
  }, [currentUser]);

  // Connect Google Calendar with official OAuth popup
  const handleConnect = async () => {
    if (isConnecting) return;
    setIsConnecting(true);
    setFeedback(null);
    try {
      if (!isGoogleClientConfigured()) {
        throw new Error(
          'Google OAuth Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file with your OAuth Web Client ID from project "CIT Scheduling Platform".'
        );
      }

      const authResult = await googleSignIn();
      if (!authResult) {
        // User closed the popup window or cancelled
        setFeedback({
          type: 'info',
          message: 'Google authorization window was closed. Click "Connect Google Calendar" when you are ready to link.',
        });
        return;
      }

      const { user, accessToken } = authResult;

      // Register connection with backend
      const connectRes = await fetch('/api/calendar/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
        body: JSON.stringify({
          googleEmail: user.email,
          calendarId: 'primary',
          googleAccessToken: accessToken,
        }),
      });

      const connectData = await connectRes.json();
      if (!connectRes.ok || !connectData.success) {
        throw new Error(connectData.error?.message || 'Failed to link Google Calendar on server.');
      }

      setConnection(connectData.connection);
      setFeedback({
        type: 'success',
        message: `Connected Google Calendar as ${user.email}. Ready to sync.`,
      });

      // Automatically trigger initial synchronization
      await handleSync(accessToken);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('access_denied') || msg.includes('403')) {
        setFeedback({
          type: 'error',
          message: 'Access denied: Google Cloud requires adding this account to the OAuth test users list in the Google Cloud Console.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to connect Google account.',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Google Calendar
  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect your Google Calendar? Managed schedule events will remain in your calendar.')) {
      return;
    }

    try {
      await fetch('/api/calendar/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
        },
      });

      await googleSignOut();
      setConnection({
        connected: false,
        email: null,
        calendar_id: null,
        sync_status: 'disconnected',
        last_synced_at: null,
        events_synced: 0,
      });

      setFeedback({
        type: 'info',
        message: 'Google Calendar has been disconnected.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error disconnecting calendar.',
      });
    }
  };

  // Trigger synchronization
  const handleSync = async (overrideToken?: string) => {
    setIsSyncing(true);
    setFeedback(null);

    let token = overrideToken || getGoogleAccessToken();

    // If no token in memory, try re-prompting authorization
    if (!token) {
      try {
        const authResult = await googleSignIn();
        if (authResult) {
          token = authResult.accessToken;
        } else {
          setFeedback({
            type: 'info',
            message: 'Sign-in window was closed. Connect Google Calendar to enable timetable sync.',
          });
          setIsSyncing(false);
          return;
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: 'Google authorization required before sync. Please click Connect Google Calendar.',
        });
        setIsSyncing(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentUser.token || currentUser.id}`,
          'X-Google-Token': token || '',
        },
        body: JSON.stringify({
          googleAccessToken: token,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (data.error?.code === 'GOOGLE_AUTH_EXPIRED') {
          throw new Error('Google authorization expired. Please click Re-connect Calendar.');
        }
        throw new Error(data.error?.message || 'Calendar synchronization encountered an error.');
      }

      if (data.details?.errors?.length > 0 && data.events_synced === 0) {
        setFeedback({
          type: 'error',
          message: `Google sync failed: ${data.details.errors[0]?.error || 'Google Calendar error'}`,
        });
      } else {
        const pulledCount = data.details?.pulled?.personal ?? (data.personal_events?.length || 0);
        const pulledMsg = pulledCount > 0 ? ` • ${pulledCount} personal events imported` : '';
        const conflictCount = data.conflicts?.length || 0;
        const conflictMsg = conflictCount > 0 ? ` • ${conflictCount} conflict(s) flagged` : '';

        setFeedback({
          type: 'success',
          message: `Synchronized ${data.events_synced} timetable events with Google Calendar${pulledMsg}${conflictMsg}!`,
        });
      }

      await fetchStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to synchronize with Google Calendar.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = Boolean(connection?.connected);
  const connectedEmail = getCachedGoogleUser()?.email || connection?.email;

  return (
    <div className={`p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${className}`}>
      {/* Left Icon and Status */}
      <div className="flex items-start sm:items-center space-x-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Calendar className="w-5 h-5" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-900">Google Calendar Integration</span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                isConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Connected
                </>
              ) : (
                'Not Connected'
              )}
            </span>
          </div>

          <div className="text-[11px] text-slate-600 mt-0.5">
            {isConnected ? (
              <span>
                Linked to <strong>{connectedEmail || 'your Google account'}</strong>.
                {connection?.last_synced_at && (
                  <span className="ml-1 text-slate-500">
                    • Last synced {new Date(connection.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({connection.events_synced || 0} events)
                  </span>
                )}
              </span>
            ) : (
              <span>
                Connect your Google account to auto-sync approved timetable sessions to your personal Google Calendar.
                {!isGoogleClientConfigured() && (
                  <span className="block mt-0.5 text-amber-700 font-medium">
                    Note: Configure VITE_GOOGLE_CLIENT_ID in your .env file to enable OAuth sign-in.
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div
              className={`mt-2 text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center space-x-1.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-300'
                  : feedback.type === 'error'
                  ? 'bg-red-100/80 text-red-800 border border-red-300'
                  : 'bg-blue-100/80 text-blue-800 border border-blue-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              ) : feedback.type === 'error' ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 shrink-0 text-blue-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {isConnected ? (
          <>
            <button
              onClick={() => handleSync()}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Calendar'}</span>
            </button>
            <button
              onClick={handleDisconnect}
              title="Disconnect Google account"
              className="p-2 border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600 rounded-xl transition-all cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center space-x-2 cursor-pointer"
          >
            {/* Official Google 'G' icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isConnecting ? 'Connecting...' : 'Connect Google Calendar'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
