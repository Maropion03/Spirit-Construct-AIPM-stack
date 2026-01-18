/**
 * Authentication Module - Supabase Integration
 * Supports: Google, GitHub OAuth
 */

// Supabase Configuration
const SUPABASE_URL = 'https://rpqvpedrmalgdwzpshgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcXZwZWRybWFsZ2R3enBzaGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTU4MzAsImV4cCI6MjA4NDMzMTgzMH0.dArSCArtyiG8soYDzv8mjHFaVWd1jovuJKYrv4AreLk';

// Initialize Supabase client
let supabase = null;

function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase SDK not loaded');
        return null;
    }
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    supabase = initSupabase();
    if (!supabase) return;

    // Check for OAuth callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('access_token')) {
        await handleAuthCallback();
    } else {
        await checkSession();
    }
});

// OAuth Login Functions
async function loginWithGoogle() {
    if (!supabase) {
        alert('认证服务未初始化，请刷新页面');
        return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/login.html'
        }
    });

    if (error) {
        console.error('Google login error:', error);
        showLoginError('Google 登录失败');
    }
}

async function loginWithGithub() {
    if (!supabase) {
        alert('认证服务未初始化，请刷新页面');
        return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
            redirectTo: window.location.origin + '/login.html'
        }
    });

    if (error) {
        console.error('GitHub login error:', error);
        showLoginError('GitHub 登录失败');
    }
}

// Handle OAuth callback
async function handleAuthCallback() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Auth callback error:', error);
        showLoginError('登录失败，请重试');
        return;
    }

    if (session) {
        // Clear URL hash
        window.history.replaceState({}, document.title, window.location.pathname);
        showLoginSuccess(session.user);
    }
}

// Check existing session
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        showLoginSuccess(session.user);
        return true;
    }
    return false;
}

// Logout
async function logout() {
    if (supabase) {
        await supabase.auth.signOut();
    }
    window.location.reload();
}

// UI Helpers
function showLoginSuccess(user) {
    const loginCard = document.querySelector('.login-card');
    if (!loginCard) return;

    const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || '用户';
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    loginCard.innerHTML = `
        <div class="login-brand">
            <img src="assets/logo_dark_mode.png" alt="Spirit Construct" class="login-logo logo-dark">
            <img src="assets/logo_light_mode.png" alt="Spirit Construct" class="login-logo logo-light">
            <div class="login-brand-text">
                <span class="brand-name-zh">灵构</span>
                <span class="brand-name-en">AIPM STACK</span>
            </div>
        </div>
        <div class="login-success">
            ${avatar ? `<img src="${avatar}" alt="Avatar" class="user-avatar">` : ''}
            <p class="welcome-text">欢迎回来，${displayName}！</p>
            <a href="index.html" class="login-btn" style="text-decoration: none; display: block; text-align: center;">进入应用</a>
            <button onclick="logout()" class="logout-btn">退出登录</button>
        </div>
    `;
}

function showLoginError(message) {
    const subtitle = document.querySelector('.login-subtitle');
    if (subtitle) {
        subtitle.textContent = message;
        subtitle.style.color = '#ff4444';
    }
}

// Utility functions for other pages
function getCurrentUser() {
    if (!supabase) return null;
    return supabase.auth.getUser();
}

function isLoggedIn() {
    if (!supabase) return false;
    return supabase.auth.getSession().then(({ data }) => !!data.session);
}
