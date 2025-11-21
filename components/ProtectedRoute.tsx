import React from 'react';
import { isAuthenticated } from '../services/authService';

interface ProtectedRouteProps {
    children: React.ReactNode;
    onRedirectToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onRedirectToLogin }) => {
    if (!isAuthenticated()) {
        // If not authenticated, trigger redirect
        // We use useEffect or direct call? 
        // Since this is a render function, we should probably just return null and call the redirect
        // But to be safe in React, let's render nothing and call the callback in a timeout or effect if we were using router.
        // Since we are using state-based routing in App.tsx, we can just call the callback immediately if we are careful, 
        // OR we can render a "Not Authorized" state that redirects.

        // Better approach for this simple app:
        // The App.tsx logic will handle the "if not authenticated, show login" check at the top level.
        // But if we want a component:

        onRedirectToLogin();
        return null;
    }

    return <>{children}</>;
};
