// Supabase Frontend Authentication Client
// This provides client-side authentication handling with Supabase

const AUTH_TOKEN_KEY = 'startup-events-auth-token';
const REFRESH_TOKEN_KEY = 'startup-events-refresh-token';
const USER_KEY = 'startup-events-user';

function normalizeAuthErrorMessage(message) {
    if (!message) return 'Authentication failed';

    const lower = String(message).toLowerCase();
    if (lower.includes('captcha')) {
        return 'Captcha verification failed. In Supabase, disable Auth Bot Protection or configure captcha correctly.';
    }

    return message;
}

/**
 * Authentication utilities for frontend
 */
const AuthClient = window.AuthClient = {
    /**
     * Register a new user
     */
    async signup(email, password, username, captchaToken = '') {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    username,
                    captchaToken
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(normalizeAuthErrorMessage(data.error || 'Signup failed'));
            }

            // Store user info (not tokens for security)
            this.setUser(data.user);

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: normalizeAuthErrorMessage(error.message) };
        }
    },

    /**
     * Login user
     */
    async login(email, password, captchaToken = '') {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, captchaToken })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(normalizeAuthErrorMessage(data.error || 'Login failed'));
            }

            // Store tokens and user info
            if (data.session) {
                this.setTokens(data.session.access_token, data.session.refresh_token);
                this.setUser(data.user);
            }

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: normalizeAuthErrorMessage(error.message) };
        }
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            const token = this.getToken();

            // Call logout endpoint
            if (token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }).catch(() => {}); // Ignore errors for logout
            }

            // Clear local storage
            this.clearAuth();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            this.clearAuth(); // Still clear on error
            return { success: false, error: error.message };
        }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    },

    /**
     * Get current user
     */
    getUser() {
        const userJson = localStorage.getItem(USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    },

    /**
     * Get auth token
     */
    getToken() {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    },

    /**
     * Get refresh token
     */
    getRefreshToken() {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    /**
     * Set auth tokens
     */
    setTokens(accessToken, refreshToken) {
        localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    },

    /**
     * Set user data
     */
    setUser(user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    /**
     * Clear all auth data
     */
    clearAuth() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    /**
     * Verify token is still valid
     */
    async verifyToken() {
        try {
            const token = this.getToken();
            if (!token) return false;

            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                return true;
            } else if (response.status === 401) {
                // Try to refresh token
                return await this.refreshToken();
            }

            return false;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    },

    /**
     * Refresh the access token
     */
    async refreshToken() {
        try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) return false;

            const response = await fetch('/api/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                this.setTokens(data.access_token, data.refresh_token || refreshToken);
                return true;
            }

            this.clearAuth();
            return false;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearAuth();
            return false;
        }
    },

    /**
     * Get authorization headers for API calls
     */
    getAuthHeaders() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};

// Auto-verify token on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (AuthClient.isAuthenticated()) {
            const isValid = await AuthClient.verifyToken();
            if (!isValid) {
                console.warn('Token is invalid or expired');
                AuthClient.clearAuth();
                // Redirect to login if needed
                if (window.location.pathname !== '/login.html' && window.location.pathname !== '/') {
                    window.location.href = '/login.html';
                }
            }
        }
    } catch (error) {
        console.error('Auto-verify error:', error);
    }
});
