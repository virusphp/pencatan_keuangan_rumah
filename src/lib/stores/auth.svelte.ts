import { browser } from '$app/environment';

type UserSession = {
    id: string;
    role: 'suami' | 'istri';
    name: string;
    theme_color?: string;
};

export function createAuthStore() {
    let session = $state<UserSession | null>(null);

    // Load from local storage on init
    if (browser) {
        const stored = localStorage.getItem('auth_session');
        if (stored) {
            try {
                session = JSON.parse(stored);
            } catch (e) {
                console.error('Failed to parse auth session');
            }
        }
    }

    function login(user: UserSession) {
        session = user;
        if (browser) {
            localStorage.setItem('auth_session', JSON.stringify(user));
        }
    }

    function logout() {
        session = null;
        if (browser) {
            localStorage.removeItem('auth_session');
        }
    }

    function update(data: Partial<UserSession>) {
        if (session) {
            session = { ...session, ...data };
            if (browser) {
                localStorage.setItem('auth_session', JSON.stringify(session));
            }
        }
    }

    return {
        get session() { return session; },
        login,
        logout,
        update,
        get isAuthenticated() { return session !== null; }
    };
}

// Global instance
export const auth = createAuthStore();
