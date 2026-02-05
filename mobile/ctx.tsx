import React from 'react';

const AuthContext = React.createContext({
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

export function SessionProvider(props) {
    const [session, setSession] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    return (
        <AuthContext.Provider
            value={{
                signIn: (provider) => {
                    // Perform sign-in logic here
                    // In real app, call backend /api/login
                    // For now, set session
                    setSession('mock-jwt-token');
                },
                signOut: () => {
                    setSession(null);
                },
                session,
                isLoading,
            }}>
            {props.children}
        </AuthContext.Provider>
    );
}
