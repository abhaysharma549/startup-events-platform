const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key (for server-side operations)
let supabase = null;

if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: {
            persistSession: false
        }
    });
} else {
    console.warn('Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Auth will not work.');
}

/**
 * Register a new user
 */
async function registerUser(email, password, username, captchaToken = '') {
    try {
        if (!supabase) {
            return { error: 'Supabase not configured', success: false };
        }
        void captchaToken;
        
        // Create user with Supabase Auth
        const { data, error } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                username
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Create user profile in custom table (optional - for storing additional info)
        const { error: profileError } = await supabase
            .from('user_profiles')
            .insert([
                {
                    user_id: data.user.id,
                    username,
                    email,
                    created_at: new Date().toISOString()
                }
            ]);

        if (profileError) {
            console.error('Profile creation error:', profileError.message);
        }

        // Return user data (without password)
        return {
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                username
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Login user
 */
async function loginUser(email, password, captchaToken = '') {
    try {
        if (!supabase) {
            return { error: 'Supabase not configured', success: false };
        }
        
        // Authenticate with Supabase
        const signInPayload = {
            email,
            password
        };
        if (captchaToken) {
            signInPayload.options = { captchaToken };
        }

        const { data, error } = await supabase.auth.signInWithPassword(signInPayload);

        if (error) {
            return { success: false, error: error.message };
        }

        // Fetch user profile for additional info
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('user_id', data.user.id)
            .single();

        return {
            success: true,
            user: {
                id: data.user.id,
                email: data.user.email,
                username: profile?.username || data.user.email
            },
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Verify a user session token
 */
async function verifyToken(token) {
    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return { valid: false, user: null };
        }

        return { valid: true, user: data.user };
    } catch (error) {
        return { valid: false, user: null };
    }
}

/**
 * Middleware to verify authentication token
 */
async function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.authToken;

    if (!token) {
        return res.status(401).json({ error: 'No authentication token provided' });
    }

    const { valid, user } = await verifyToken(token);

    if (!valid) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
}

/**
 * Logout user (invalidate token)
 */
async function logoutUser(token) {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Refresh token
 */
async function refreshToken(refreshToken) {
    try {
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    supabase,
    registerUser,
    loginUser,
    verifyToken,
    authMiddleware,
    logoutUser,
    refreshToken
};
