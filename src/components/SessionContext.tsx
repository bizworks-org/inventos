import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { secureId, secureChoice } from '../lib/secure';

export interface User {
  id: string;
  email?: string;
  anonymousName?: string;
  isHost: boolean;
  hasCompletedPreferences: boolean;
  invitedAt: Date;
  completedPreferencesAt?: Date;
}

export interface SessionData {
  id: string;
  hostId: string;
  users: User[];
  createdAt: Date;
  destination?: string;
}

interface SessionContextType {
  session: SessionData | null;
  currentUser: User | null;
  isHost: boolean;
  createSession: () => void;
  joinSession: (sessionId: string, email?: string) => void;
  inviteUserByEmail: (email: string) => boolean;
  generateSessionLink: () => string;
  copySessionLink: () => Promise<void>;
  removeUser: (userId: string) => void;
  completePreferences: () => void;
  sendInviteEmail: (email: string, sessionLink: string) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

interface SessionProviderProps {
  readonly children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('tripPlannerSession');
    const savedUserId = localStorage.getItem('tripPlannerUserId');
    
    if (savedSession && savedUserId) {
      const sessionData: SessionData = JSON.parse(savedSession);
      const user = sessionData.users.find(u => u.id === savedUserId);
      if (user) {
        setSession(sessionData);
        setCurrentUser(user);
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('tripPlannerSession', JSON.stringify(session));
    }
  }, [session]);

  // Save current user ID whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tripPlannerUserId', currentUser.id);
    }
  }, [currentUser]);

  const generateUserId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return `user_${(crypto as any).randomUUID()}`;
    } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      return 'user_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for very old environments (may use Math.random inside secureId)
      return secureId('user_');
    }
  }, []);

  const generateSessionId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return `session_${(crypto as any).randomUUID()}`;
    } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      return 'session_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for very old environments (may use Math.random inside secureId)
      return secureId('session_');
    }
  }, []);

  const generateAnonymousName = useCallback(() => {
    const adjectives = ['Happy', 'Sunny', 'Brave', 'Clever', 'Kind', 'Swift', 'Bright', 'Cool'];
    const nouns = ['Traveler', 'Explorer', 'Adventurer', 'Wanderer', 'Tourist', 'Nomad', 'Voyager', 'Guest'];
    const adj = secureChoice(adjectives);
    const noun = secureChoice(nouns);
    return `${adj} ${noun}`;
  }, []);

  const createSession = useCallback(() => {
    const hostId = generateUserId();
    const sessionId = generateSessionId();
    
    const host: User = {
      id: hostId,
      isHost: true,
      hasCompletedPreferences: false,
      invitedAt: new Date(),
    };

    const newSession: SessionData = {
      id: sessionId,
      hostId,
      users: [host],
      createdAt: new Date(),
    };

    setSession(newSession);
    setCurrentUser(host);
  }, [generateUserId, generateSessionId]);

  const joinSession = useCallback((sessionId: string, email?: string) => {
    // In a real app, this would fetch from a backend
    // For now, we'll simulate joining an existing session
    const userId = generateUserId();
    
    const newUser: User = {
      id: userId,
      email: email,
      anonymousName: email ? undefined : generateAnonymousName(),
      isHost: false,
      hasCompletedPreferences: false,
      invitedAt: new Date(),
    };

    if (session) {
      const updatedSession = {
        ...session,
        users: [...session.users, newUser]
      };
      setSession(updatedSession);
      setCurrentUser(newUser);
    }
  }, [session, generateUserId, generateAnonymousName]);

  const sendInviteEmail = useCallback((email: string, sessionLink: string) => {
    // Simulate sending email - in a real app this would call a backend API
    console.log(`Sending invite email to: ${email}`);
    console.log(`Session link: ${sessionLink}`);
    
    // Mock email content
    const emailSubject = "You're invited to plan a trip together!";
    const emailBody = `
Hi there!

You've been invited to join a collaborative trip planning session. 

Click the link below to join and share your travel preferences:
${sessionLink}

Or visit the app and enter this session code: ${session?.id}

Let's plan an amazing trip together!
    `.trim();

    // In a real app, you would send this via an email service like SendGrid, Mailgun, etc.
    // For demonstration, we'll log it and show a toast
    console.log('Email Subject:', emailSubject);
    console.log('Email Body:', emailBody);
    
    // Simulate email sending - in a real app this would be handled by backend
  }, [session]);

  const generateSessionLink = useCallback(() => {
    if (!session) return '';
    const baseUrl = (globalThis as any).location?.origin ?? '';
    return `${baseUrl}/join/${session.id}`;
  }, [session]);

  const inviteUserByEmail = useCallback((email: string) => {
    if (!session || !currentUser?.isHost) return false;

    // Check if user already invited
    const existingUser = session.users.find(u => u.email === email);
    if (existingUser) {
      return false; // Return false to indicate failure
    }

    const sessionLink = generateSessionLink();
    
    // Add user as invited (not yet joined)
    const invitedUser: User = {
      id: generateUserId(),
      email,
      isHost: false,
      hasCompletedPreferences: false,
      invitedAt: new Date(),
    };

    const updatedSession = {
      ...session,
      users: [...session.users, invitedUser]
    };

    setSession(updatedSession);
    sendInviteEmail(email, sessionLink);
    
    return true; // Return true to indicate success
  }, [session, currentUser, generateUserId, generateSessionLink, sendInviteEmail]);

  const copySessionLink = useCallback(() => {
    const link = generateSessionLink();
    
    // Try modern clipboard API first
    if (navigator.clipboard && (globalThis as any).isSecureContext) {
      return navigator.clipboard.writeText(link);
    } else {
      // Fallback for when clipboard API is blocked
      return new Promise<void>((resolve, reject) => {
        try {
          // Create a temporary textarea element
          const textArea = document.createElement('textarea');
          textArea.value = link;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          // Use the older execCommand method (cast to any to avoid TypeScript's deprecated signature error)
          const successful = (document as any).execCommand('copy');
          textArea.remove();
          
          if (successful) {
            resolve();
          } else {
            reject(new Error('Copy command failed'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }
  }, [generateSessionLink]);

  const removeUser = useCallback((userId: string) => {
    if (!session || !currentUser?.isHost) return;

    const updatedSession = {
      ...session,
      users: session.users.filter(u => u.id !== userId)
    };

    setSession(updatedSession);
  }, [session, currentUser]);

  const completePreferences = useCallback(() => {
    if (!session || !currentUser) return;

    const updatedUser = {
      ...currentUser,
      hasCompletedPreferences: true,
      completedPreferencesAt: new Date()
    };

    const updatedSession = {
      ...session,
      users: session.users.map(u => 
        u.id === currentUser.id ? updatedUser : u
      )
    };

    setSession(updatedSession);
    setCurrentUser(updatedUser);
  }, [session, currentUser]);

  const isHost = currentUser?.isHost || false;

  const value: SessionContextType = useMemo(() => ({
    session,
    currentUser,
    isHost,
    createSession,
    joinSession,
    inviteUserByEmail,
    generateSessionLink,
    copySessionLink,
    removeUser,
    completePreferences,
    sendInviteEmail,
  }), [
    session,
    currentUser,
    isHost,
    createSession,
    joinSession,
    inviteUserByEmail,
    generateSessionLink,
    copySessionLink,
    removeUser,
    completePreferences,
    sendInviteEmail,
  ]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}