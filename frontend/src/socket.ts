import { io, Socket } from 'socket.io-client';
import { useAppStore } from './store/useAppStore';
import { getAuthToken, setAuthToken } from './api';
import { getFirebaseAuth } from './config/firebase';

// Derive socket URL the same way the REST API does
const SOCKET_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace('/api', '')
    : `http://${window.location.hostname}:5000`;

let socket: Socket | null = null;

// Rooms to re-join after reconnect (mobile browser wakeup / network switch)
const pendingRooms = new Set<string>();

/** true = event handlers already attached to this socket instance */
let listenersAttached = false;

/** Get a fresh Firebase ID token, updating localStorage so reconnects work */
async function getFreshToken(): Promise<string | null> {
    try {
        const firebaseUser = getFirebaseAuth().currentUser;
        if (!firebaseUser) return getAuthToken();
        const freshToken = await firebaseUser.getIdToken(true);
        setAuthToken(freshToken);
        return freshToken;
    } catch {
        return getAuthToken();
    }
}

/** Attach all event listeners exactly once per socket instance */
function attachListeners(s: Socket) {
    if (listenersAttached) return;
    listenersAttached = true;

    // ── Connection lifecycle ───────────────────────────────────────────────────
    s.on('connect', () => {
        console.log('🔌 Socket connected:', s.id);
        // Re-join all known conversation rooms after reconnect
        pendingRooms.forEach((roomId) => {
            s.emit('join_conversation', { conversationId: roomId });
        });
        // On reconnect, reload conversations/requests to catch anything missed offline
        const store = useAppStore.getState();
        store.loadConversations();
        store.loadPendingRequests();
    });

    s.on('connect_error', async (err) => {
        console.warn('Socket connect error:', err.message);
        if (
            err.message.includes('expired') ||
            err.message.includes('Invalid') ||
            err.message.includes('token')
        ) {
            const freshToken = await getFreshToken();
            if (freshToken && socket) {
                (socket.auth as Record<string, string>).token = freshToken;
            }
        }
    });

    // ── Messages ───────────────────────────────────────────────────────────────
    s.on('receive_message', (payload) => {
        if (payload?.message) {
            useAppStore.getState().receiveMessage(payload.message);
        }
    });

    // ── Contact requests ────────────────────────────────────────────────────────
    s.on('new_contact_request', (data) => {
        if (data?.requestId && data?.fromUser) {
            useAppStore.getState().addContactRequest({
                requestId: data.requestId,
                fromUser: data.fromUser,
                createdAt: data.createdAt || new Date().toISOString(),
            });
        }
    });

    // ── Typing indicators ───────────────────────────────────────────────────────
    s.on('typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        useAppStore.getState().setTyping(conversationId, userId, true);
    });

    s.on('stop_typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
        useAppStore.getState().setTyping(conversationId, userId, false);
    });

    // ── Presence ────────────────────────────────────────────────────────────────
    // Update isOnline directly on conversations — NO Firestore call needed
    s.on('user_status', ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
        if (!userId) return;
        // Update isOnline on all conversations where this user is a participant
        useAppStore.setState((state) => ({
            conversations: state.conversations.map((conv) => {
                const isParticipant = conv.participants?.includes(userId);
                if (!isParticipant) return conv;
                return { ...conv, isOnline };
            }),
        }));
    });
}

export const initSocket = async (): Promise<Socket | null> => {
    // Already connected — nothing to do
    if (socket?.connected) return socket;

    const token = await getFreshToken();
    if (!token) return null;

    // If socket exists but disconnected — update auth token + reconnect (reuse listener set)
    if (socket) {
        (socket.auth as Record<string, string>).token = token;
        socket.connect();
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
    });

    attachListeners(socket);

    return socket;
};

/** Join a conversation room — retries if socket not yet connected */
export const joinConversation = (conversationId: string) => {
    pendingRooms.add(conversationId);
    if (socket?.connected) {
        socket.emit('join_conversation', { conversationId });
    }
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    listenersAttached = false;
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    pendingRooms.clear();
};
