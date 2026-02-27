import { useState, useEffect } from 'react';
import { authApi, User } from '@/lib/api/auth';
// Re-export User type so consumers don't break immediately if they imported it from here
export type { User };

export function useUser() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = () => {
        // Access token manager only on client side
        if (typeof window === 'undefined') return;

        const storedUser = authApi.getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        } else {
            setUser(null);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUser();

        // Listen for auth changes
        window.addEventListener('auth-change', fetchUser);
        return () => window.removeEventListener('auth-change', fetchUser);
    }, []);

    return { user, isLoading };
}
