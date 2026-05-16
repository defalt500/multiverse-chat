import { io, Socket } from 'socket.io-client';
import { useAppStore } from './store/useAppStore';
import { getAuthToken, setAuthToken } from './api';
import { getFirebaseAuth } from './config/firebase';

// Derive socket URL the same way the REST API does:
// If VITE_API_URL is set, strip /api. Otherwise use the hostname the page was served from.
// This ensures mobile devices connect to the LAN server, not localhost (the phone itself).
const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : `http://${window.location.hostname}:5000`;

let socket: Socket | null = null;

// Rooms to re-join after reconnect (mobile browser wakeup / network switch)
const pendingRooms = new Set<string>();

/** Get a fresh Firebase ID token, updating localStorage so reconnects work */
async function getFreshToken(): Promise<string | null> {
    try {
        const firebaseUser = getFirebaseAuth().currentUser;
        if (!firebaseUser) return getAuthToken();
        // forceRefresh=true ensures we get a new token even if the old one is cached
        const freshToken = await firebaseUser.getIdToken(true);
        setAuthToken(freshToken);        // persist in localStorage
        return freshToken;
    } catch {
        return getAuthToken();           // fallback to stored token
    }
}

export const initSocket = async (): Promise<Socket | null> => {
    // Already connected — nothing to do
    if (socket?.connected) return socket;

    // Get a fresh token (refreshes if Firebase user is available)
    const token = await getFreshToken();
    if (!token) return null;

    // If socket exists but disconnected — update auth token + reconnect
    if (socket) {
        (socket.auth as Record<string, string>).token = token;
        socket.connect();
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,   // keep retrying on mobile
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
    });

    socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket?.id);
        // Re-join all conversation rooms after reconnect
        pendingRooms.forEach((roomId) => {
            socket?.emit('join_conversation', { conversationId: roomId });
        });
    });

    // On connect_error (e.g. expired token) — refresh token and retry
    socket.on('connect_error', async (err) => {
        console.warn('Socket connect error:', err.message);
        if (err.message.includes('expired') || err.message.includes('Invalid') || err.message.includes('token')) {
            // Refresh the token and update socket auth before next reconnect attempt
            const freshToken = await getFreshToken();
            if (freshToken && socket) {
                (socket.auth as Record<string, string>).token = freshToken;
            }
        }
    });

    socket.on('receive_message', (payload) => {
        if (payload?.message) {
            useAppStore.getState().receiveMessage(payload.message);
        }
    });

    // Real-time contact request — receiver gets instant notification
    socket.on('new_contact_request', (data) => {
        if (data?.requestId && data?.fromUser) {
            useAppStore.getState().addContactRequest({
                requestId: data.requestId,
                fromUser: data.fromUser,
                createdAt: data.createdAt || new Date().toISOString(),
            });
        }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        useAppStore.getState().setTyping(conversationId, userId, true);
    });

    socket.on('stop_typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        useAppStore.getState().setTyping(conversationId, userId, false);
    });

    return socket;
};

/** Join a conversation room — retries if socket not yet connected */
export const joinConversation = (conversationId: string) => {
    pendingRooms.add(conversationId);
    if (socket?.connected) {
        socket.emit('join_conversation', { conversationId });
    }
    // If not connected yet, pendingRooms will be flushed on 'connect' event
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    pendingRooms.clear();
};
