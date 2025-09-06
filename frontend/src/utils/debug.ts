// Debug utilities for authentication and API calls

// Debug levels
export enum DebugLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4
}

// Check if we're in development mode
const isDev = process.env.NODE_ENV === 'development';

// Current debug level (can be changed at runtime)
let currentLevel = isDev ? DebugLevel.DEBUG : DebugLevel.ERROR;

// Set debug level
export const setDebugLevel = (level: DebugLevel) => {
  currentLevel = level;
};

// Debug logger
export const debug = {
  error: (component: string, message: string, data?: any) => {
    if (currentLevel >= DebugLevel.ERROR) {
      console.error(`[${component}] ERROR: ${message}`, data || '');
    }
  },
  
  warn: (component: string, message: string, data?: any) => {
    if (currentLevel >= DebugLevel.WARN) {
      console.warn(`[${component}] WARN: ${message}`, data || '');
    }
  },
  
  info: (component: string, message: string, data?: any) => {
    if (currentLevel >= DebugLevel.INFO) {
      console.info(`[${component}] INFO: ${message}`, data || '');
    }
  },
  
  log: (component: string, message: string, data?: any) => {
    if (currentLevel >= DebugLevel.DEBUG) {
      console.log(`[${component}] DEBUG: ${message}`, data || '');
    }
  },
  
  // Auth specific debugging
  auth: {
    stateChange: (action: string, state: any) => {
      if (currentLevel >= DebugLevel.DEBUG) {
        console.log(`[AUTH] ${action}:`, state);
      }
    },
    
    tokenInfo: (token: string | null) => {
      if (currentLevel >= DebugLevel.DEBUG && token) {
        try {
          // Simple token expiry check (assumes JWT)
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));

          const payload = JSON.parse(jsonPayload);
          const expiry = new Date(payload.exp * 1000);
          const now = new Date();
          const timeRemaining = Math.floor((expiry.getTime() - now.getTime()) / 1000 / 60);
          
          console.log(`[AUTH] Token info:`, {
            subject: payload.sub,
            expires: expiry.toLocaleString(),
            minutesRemaining: timeRemaining,
            isExpired: now > expiry
          });
        } catch (err) {
          console.log(`[AUTH] Token is not a standard JWT or is malformed`);
        }
      }
    }
  }
};

// Export global object that can be used for debugging in browser console
if (isDev) {
  (window as any).__motionGptDebug = {
    setLevel: setDebugLevel,
    levels: DebugLevel,
    auth: {
      getState: () => {
        // Get auth state from localStorage
        try {
          const stored = localStorage.getItem('motion-gpt-auth');
          if (stored) {
            return JSON.parse(stored);
          }
          return null;
        } catch (err) {
          console.error('Failed to parse auth state:', err);
          return null;
        }
      },
      clearStorage: () => {
        localStorage.removeItem('motion-gpt-auth');
        console.log('[DEBUG] Auth storage cleared');
      }
    }
  };
}

export default debug;
