const { useState, useEffect, useRef } = React;

const LoginApp = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [captchaSiteKey, setCaptchaSiteKey] = useState('');
    const [captchaToken, setCaptchaToken] = useState('');
    const [isTurnstileReady, setIsTurnstileReady] = useState(!!window.turnstile);
    const captchaContainerRef = useRef(null);
    const turnstileWidgetIdRef = useRef(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: ''
    });

    useEffect(() => {
        // If already logged in, redirect to main page
        if (window.AuthClient && window.AuthClient.isAuthenticated()) {
            window.location.href = '/index.html';
        }
    }, []);

    useEffect(() => {
        const loadAuthConfig = async () => {
            try {
                const response = await fetch('/api/auth/config');
                const data = await response.json();
                const siteKey = data?.captcha?.siteKey || '';
                setCaptchaSiteKey(siteKey);
            } catch (error) {
                console.warn('Failed to load auth config:', error);
            }
        };

        loadAuthConfig();
    }, []);

    useEffect(() => {
        if (window.turnstile) {
            setIsTurnstileReady(true);
            return;
        }

        const poll = setInterval(() => {
            if (window.turnstile) {
                setIsTurnstileReady(true);
                clearInterval(poll);
            }
        }, 250);

        return () => clearInterval(poll);
    }, []);

    useEffect(() => {
        if (!captchaSiteKey || !captchaContainerRef.current || !window.turnstile || !isTurnstileReady) return;

        if (turnstileWidgetIdRef.current) {
            try {
                window.turnstile.remove(turnstileWidgetIdRef.current);
            } catch (error) {
                console.warn('Failed to remove Turnstile widget:', error);
            }
            turnstileWidgetIdRef.current = null;
        }

        const widgetId = window.turnstile.render(captchaContainerRef.current, {
            sitekey: captchaSiteKey,
            theme: 'dark',
            callback: (token) => {
                setCaptchaToken(token);
            },
            'expired-callback': () => {
                setCaptchaToken('');
            },
            'error-callback': () => {
                setCaptchaToken('');
            }
        });

        turnstileWidgetIdRef.current = widgetId;
    }, [captchaSiteKey, isLoginMode, isTurnstileReady]);

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const toggleMode = (e) => {
        e.preventDefault();
        setIsLoginMode(!isLoginMode);
        setErrorMsg('');
        setSuccessMsg('');
        setCaptchaToken('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setSuccessMsg('');
        
        if (!window.AuthClient) {
            setErrorMsg('Authentication client not found.');
            return;
        }

        const { email, password, confirmPassword, username } = formData;

        if (!email || !password) {
            setErrorMsg('Email and password are required');
            return;
        }

        if (!email.includes('@')) {
            setErrorMsg('Invalid email format');
            return;
        }

        if (captchaSiteKey && !captchaToken) {
            setErrorMsg('Please complete captcha verification');
            return;
        }

        if (!isLoginMode) {
            if (!confirmPassword || !username) {
                setErrorMsg('All fields are required');
                return;
            }
            if (password.length < 6) {
                setErrorMsg('Password must be at least 6 characters');
                return;
            }
            if (password !== confirmPassword) {
                setErrorMsg('Passwords do not match');
                return;
            }
            if (username.length < 2) {
                setErrorMsg('Username must be at least 2 characters');
                return;
            }
        }

        setIsLoading(true);

        try {
            let result;
            if (isLoginMode) {
                result = await window.AuthClient.login(email, password, captchaToken);
            } else {
                result = await window.AuthClient.signup(email, password, username, captchaToken);
            }

            if (result.success) {
                if (!isLoginMode) {
                    const loginAfterSignup = await window.AuthClient.login(email, password, captchaToken);
                    if (loginAfterSignup.success) {
                        setSuccessMsg(`Welcome, ${username}! Redirecting...`);
                        setTimeout(() => {
                            window.location.href = '/index.html';
                        }, 800);
                    } else {
                        setErrorMsg(loginAfterSignup.error || 'Account created, but auto-login failed. Please sign in.');
                        setIsLoginMode(true);
                        setIsLoading(false);
                    }
                } else {
                    window.location.href = '/index.html';
                }
            } else {
                setErrorMsg(result.error || (isLoginMode ? 'Login failed' : 'Signup failed'));
                if (captchaSiteKey && window.turnstile && turnstileWidgetIdRef.current) {
                    window.turnstile.reset(turnstileWidgetIdRef.current);
                    setCaptchaToken('');
                }
                setIsLoading(false);
            }
        } catch (err) {
            setErrorMsg('An unexpected error occurred. Please try again.');
            if (captchaSiteKey && window.turnstile && turnstileWidgetIdRef.current) {
                window.turnstile.reset(turnstileWidgetIdRef.current);
                setCaptchaToken('');
            }
            setIsLoading(false);
        }
    };

    const containerStyle = {
        background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 50%, #16213e 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        fontFamily: "'Inter', sans-serif"
    };

    const cardStyle = {
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(157, 78, 221, 0.3)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(157, 78, 221, 0.2)',
        transition: 'all 0.4s ease'
    };

    const headerSpanStyle = {
        background: 'linear-gradient(135deg, #9d4edd 0%, #00f5d4 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    };

    const inputStyle = {
        width: '100%',
        padding: '0.875rem 1rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: '#f8fafc',
        fontSize: '1rem',
        fontFamily: 'inherit',
        marginBottom: '1.5rem',
        boxSizing: 'border-box'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '0.6rem',
        color: '#f8fafc',
        fontWeight: '600',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const btnStyle = {
        width: '100%',
        padding: '1rem',
        background: 'linear-gradient(135deg, #9d4edd 0%, #00f5d4 100%)',
        color: '#0f0f1e',
        border: 'none',
        borderRadius: '10px',
        fontSize: '1.1rem',
        fontWeight: '700',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        opacity: isLoading ? 0.7 : 1,
        transition: 'all 0.3s ease',
        boxShadow: '0 10px 25px rgba(0, 245, 212, 0.3)'
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem', color: '#f8fafc', fontFamily: "'Outfit', sans-serif" }}>
                        Startup<span style={headerSpanStyle}>Events</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                        {isLoginMode ? 'Sign in to your account' : 'Create a new account'}
                    </p>
                </div>

                {errorMsg && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                        {errorMsg}
                    </div>
                )}

                {successMsg && (
                    <div style={{ padding: '1rem', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '8px', color: '#86efac', fontSize: '0.9rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: isLoginMode ? 'none' : 'block' }}>
                        <label style={labelStyle}>Username</label>
                        <input 
                            type="text" 
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            style={inputStyle} 
                            placeholder="Choose a username" 
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Email</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            style={inputStyle} 
                            placeholder="your@email.com" 
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Password</label>
                        <input 
                            type="password" 
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            style={inputStyle} 
                            placeholder={isLoginMode ? "Enter your password" : "At least 6 characters"} 
                        />
                    </div>

                    <div style={{ display: isLoginMode ? 'none' : 'block' }}>
                        <label style={labelStyle}>Confirm Password</label>
                        <input 
                            type="password" 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            style={inputStyle} 
                            placeholder="Confirm your password" 
                        />
                    </div>

                    {captchaSiteKey && (
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <div ref={captchaContainerRef}></div>
                        </div>
                    )}

                    <button type="submit" style={btnStyle} disabled={isLoading} 
                        onMouseOver={(e) => { if(!isLoading) e.target.style.transform = 'translateY(-2px)' }} 
                        onMouseOut={(e) => { if(!isLoading) e.target.style.transform = 'translateY(0)' }}>
                        {isLoading ? (isLoginMode ? 'Signing in...' : 'Creating Account...') : (isLoginMode ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '2rem', color: '#94a3b8', fontSize: '0.9rem' }}>
                    <span>{isLoginMode ? "Don't have an account? " : "Already have an account? "}</span>
                    <a onClick={toggleMode} style={{ color: '#00f5d4', textDecoration: 'none', fontWeight: '600', cursor: 'pointer', transition: 'color 0.3s' }}>
                        {isLoginMode ? 'Sign up' : 'Sign in'}
                    </a>
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LoginApp />);
