const API_BASE_URL = "http://127.0.0.1:8000";
const nitjsrRegex = /^(\d{4})UG(CM|CS|EC|PI|EE|ME|CE|MM)(\d{3})@nitjsr\.ac\.in$/i;

function showAlert(elementId, message, isSuccess = false) {
    const alertEl = document.getElementById(elementId);
    alertEl.textContent = message;
    alertEl.className = `alert ${isSuccess ? 'alert-success' : 'alert-danger'} mt-3`;
    alertEl.classList.remove('d-none');
}

// --- LOGIN LOGIC ---
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!nitjsrRegex.test(email)) return showAlert('loginAlert', "Use official NIT JSR email.");
    
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Authenticating...'; 
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });
        
        let data;
        try {
            data = await res.json();
        } catch (parseErr) {
            throw new Error("Server error. Check FastAPI terminal.");
        }

        if (res.ok && data.user) {
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user_role', data.user.role);
            localStorage.setItem('user_id', data.user.id); // FIXED: Added missing ID
            window.location.href = "dashboard.html";
        } else {
            showAlert('loginAlert', data.detail || 'Invalid credentials.');
        }
    } catch (err) { 
        showAlert('loginAlert', err.message || 'Network error. Is the server running?'); 
    } finally { 
        btn.textContent = 'Sign In'; 
        btn.disabled = false; 
    }
});

// --- REGISTER LOGIC ---
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
    const password = document.getElementById('regPassword').value;
    const match = email.match(nitjsrRegex);
    
    if (!match) return showAlert('registerAlert', "Invalid NIT JSR email.");
    
    const deptMap = { 'CM':'Engineering and Computational Mechanics', 'CS':'Computer Science', 'EC':'Electronics and Communication', 'PI':'Production Engineering', 'EE':'Electrical Engineering', 'ME':'Mechanical Engineering', 'CE':'Civil Engineering', 'MM':'Metallurgy and Materials Engineering' };
    const deptName = deptMap[match[2].toUpperCase()];
    const gradYear = parseInt(match[1]) + 4;

    const btn = document.getElementById('registerBtn');
    btn.textContent = 'Verifying ID...'; btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: fullName,
                email: email, 
                password: password,
                department: deptName, 
                graduation_year: gradYear
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showAlert('registerAlert', `Verified as ${deptName}! Switching to Login...`, true);
            document.getElementById('registerForm').reset();
            setTimeout(() => document.getElementById('login-tab').click(), 2000);
        } else {
            showAlert('registerAlert', data.detail || "Registration failed.");
        }
    } catch (err) { 
        showAlert('registerAlert', 'Network error. Is the server running?'); 
    } finally { 
        btn.textContent = 'Create Account'; 
        btn.disabled = false; 
    }
});

// --- FORGOT PASSWORD LOGIC ---
document.getElementById('forgotPasswordBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    if (!nitjsrRegex.test(email)) return showAlert('loginAlert', "Enter email first.");
    showAlert('loginAlert', "Sending link...", true);
    try {
        await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });
        showAlert('loginAlert', "Reset link sent!", true);
    } catch (err) {
        showAlert('loginAlert', "Network error.");
    }
});