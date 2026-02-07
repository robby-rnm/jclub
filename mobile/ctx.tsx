import React from 'react';

const AuthContext = React.createContext<{
    signIn: (provider?: string, email?: string, token?: string, password?: string) => Promise<void> | null;
    signOut: () => void;
    session?: string | null;
    isLoading: boolean;
}>({
    signIn: () => null,
    signOut: () => null,
    session: null,
    isLoading: false,
});

export function useSession() {
    const value = React.useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <SessionProvider />');
        }
    }

    return value;
}

export function SessionProvider(props: React.PropsWithChildren) {
    const [session, setSession] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    return (
        <AuthContext.Provider
            value={{
                signIn: async (provider?: string, email?: string, token?: string, password?: string) => {
                    // Perform sign-in logic here
                    try {
                        const { api, setAuthToken } = require('./services/api');
                        // Use provider-specific logic
                        const isSocial = provider === 'google' || provider === 'facebook';
                        const loginToken = isSocial ? (token || 'social-dummy') : 'local-dummy';

                        const data = await api.login(provider, loginToken, email, undefined, password);
                        setAuthToken(data.token); // Sync token to API service
                        setSession(data.token);
                    } catch (e) {
                        console.error("Sign in failed", e);
                        throw e;
                    }
                },
                signOut: () => {
                    const { setAuthToken } = require('./services/api');
                    setAuthToken('');
                    setSession(null);
                },
                session,
                isLoading,
            }}>
            {props.children}
        </AuthContext.Provider>
    );
}
