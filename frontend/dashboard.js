const API_BASE_URL = "http://127.0.0.1:8000";
const userId = localStorage.getItem('user_id'); 
const userRole = localStorage.getItem('user_role');
const token = localStorage.getItem('access_token');

// Block access if not authenticated
if (!token || !userId) {
    window.location.href = "index.html";
}

// Show specific sections based on role
if (userRole === 'Student') {
    document.getElementById('jobBoardSection').classList.remove('hidden');
    document.getElementById('studentTrackerSection').classList.remove('hidden'); 
    document.getElementById('alumniDiscoverySection').classList.remove('hidden'); 
    fetchStudentTracker(); 
    
    // Auto-populate the alumni discovery engine on page load!
    performAlumniSearch(); 
    
} else if (userRole === 'Alumni') {
    document.getElementById('alumniSection').classList.remove('hidden');
    document.getElementById('jobBoardSection').classList.remove('hidden');
    document.getElementById('alumniInboxSection').classList.remove('hidden');
    fetchAlumniInbox(); 
} else if (userRole === 'Admin') {
    document.getElementById('jobBoardSection').classList.remove('hidden');
}

// Fetch Core Data on Load
fetchLeaderboard();
fetchJobBoard();

// --- UNIVERSAL ALUMNI DISCOVERY LOGIC ---
async function performAlumniSearch() {
    const container = document.getElementById('alumniResultsContainer');
    const queryStr = document.getElementById('universalSearch').value.trim();

    container.innerHTML = '<div class="col-12 text-center text-muted"><div class="spinner-border spinner-border-sm me-2"></div>Searching network...</div>';
    
    const queryParams = new URLSearchParams();
    if (queryStr) {
        queryParams.append('q', queryStr);
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/alumni/search?${queryParams.toString()}`);
        const data = await res.json();
        
        container.innerHTML = '';
        if (!data.ranked_results || data.ranked_results.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center text-muted py-4">
                    <i class="bi bi-search d-block fs-2 mb-2 text-light"></i>
                    No alumni found matching "${queryStr}".
                </div>`;
            return;
        }

        // Render beautiful connection cards
        data.ranked_results.forEach(alum => {
            const initial = alum.name ? alum.name.charAt(0).toUpperCase() : 'A';
            
            container.innerHTML += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card p-4 shadow-sm border-0 h-100 text-center" style="border-radius: 1rem; background: #ffffff;">
                        <div class="rounded-circle bg-info bg-opacity-10 text-info d-inline-flex align-items-center justify-content-center mx-auto mb-3" style="width: 60px; height: 60px; font-size: 1.5rem; font-weight: 700;">
                            ${initial}
                        </div>
                        <h6 class="fw-bold mb-1">${alum.name} <i class="bi bi-patch-check-fill text-primary" title="Verified Alumni"></i></h6>
                        <p class="small text-muted mb-3">${alum.role} @ <span class="fw-semibold text-dark">${alum.company}</span></p>
                        
                        <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                            <div class="text-start">
                                <span class="d-block text-muted" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Match Score</span>
                                <span class="badge bg-info text-dark shadow-sm mt-1">${alum.algorithmic_match_score}</span>
                            </div>
                            <div class="text-end">
                                <span class="d-block text-muted" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Contribution</span>
                                <span class="small fw-bold text-success mt-1 d-block">${alum.contribution_points} pts</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        container.innerHTML = `<div class="col-12 text-center text-danger py-3">Search failed: ${e.message}</div>`;
    }
}

// --- LEADERBOARD LOGIC ---
async function fetchLeaderboard() {
    const container = document.getElementById('leaderboardContainer');
    try {
        const res = await fetch(`${API_BASE_URL}/alumni/leaderboard`);
        const leaders = await res.json();
        
        if (leaders.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No contributors yet. Be the first to post a referral!</td></tr>';
            return;
        }
        
        container.innerHTML = ''; 
        leaders.forEach((alumni, index) => {
            let rankMedal = `<strong>#${index + 1}</strong>`;
            if (index === 0) rankMedal = '🥇 1st';
            if (index === 1) rankMedal = '🥈 2nd';
            if (index === 2) rankMedal = '🥉 3rd';

            container.innerHTML += `
                <tr>
                    <td>${rankMedal}</td>
                    <td class="fw-bold text-dark">
                        ${alumni.full_name} <i class="bi bi-patch-check-fill text-primary" title="Verified Alumni"></i>
                    </td>
                    <td class="text-muted small">${alumni.department}</td>
                    <td>${alumni.referrals}</td>
                    <td><span class="badge bg-success shadow-sm px-3 py-2">${alumni.points} pts</span></td>
                </tr>
            `;
        });
    } catch (e) { 
        container.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Failed to load leaderboard.</td></tr>'; 
    }
}

// --- STUDENT TRACKER LOGIC ---
async function fetchStudentTracker() {
    const container = document.getElementById('studentTrackerContainer');
    try {
        const res = await fetch(`${API_BASE_URL}/referrals/my-requests`, {
            headers: { 'x-user-id': userId }
        });
        const requests = await res.json();
        
        if (requests.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">You have not requested any referrals yet.</td></tr>';
            return;
        }
        
        container.innerHTML = '';
        requests.forEach(req => {
            const dateStr = new Date(req.created_at).toLocaleDateString();
            
            let statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`;
            if (req.status === 'Approved') {
                statusBadge = `<span class="badge bg-success">Approved!</span>`;
            }

            container.innerHTML += `
                <tr>
                    <td class="text-muted small">${dateStr}</td>
                    <td class="fw-bold text-dark">${req.company}</td>
                    <td class="text-primary fw-semibold">${req.role}</td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });
    } catch (e) {
        container.innerHTML = '<tr><td colspan="4" class="text-center text-danger py-3">Failed to load requests.</td></tr>';
    }
}

// --- ALUMNI INBOX LOGIC ---
async function fetchAlumniInbox() {
    const container = document.getElementById('inboxContainer');
    try {
        const res = await fetch(`${API_BASE_URL}/referrals/inbox`, {
            headers: { 'x-user-id': userId }
        });
        const requests = await res.json();
        
        if (requests.length === 0) {
            container.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Your inbox is clear. No pending requests.</td></tr>';
            return;
        }
        
        container.innerHTML = '';
        requests.forEach(req => {
            const dateStr = new Date(req.created_at).toLocaleDateString();
            container.innerHTML += `
                <tr>
                    <td class="text-muted small">${dateStr}</td>
                    <td class="fw-bold text-dark"><i class="bi bi-person-fill"></i> ${req.student_name}</td>
                    <td class="text-primary fw-semibold">${req.job_company} <br> <span class="text-muted small">${req.job_role}</span></td>
                    <td class="fst-italic small text-muted">"${req.message}"</td>
                    <td>
                        <button class="btn btn-success btn-sm fw-bold shadow-sm" onclick="approveReferral('${req.id}')">
                            Approve (+50 pts)
                        </button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        container.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Failed to load inbox.</td></tr>';
    }
}

// --- APPROVE REFERRAL LOGIC ---
async function approveReferral(requestId) {
    if (!confirm("Are you sure you want to approve this referral? You will earn +50 points!")) return;

    try {
        const res = await fetch(`${API_BASE_URL}/referrals/approve/${requestId}`, {
            method: 'POST',
            headers: { 'x-user-id': userId }
        });

        if (res.ok) {
            alert("Referral Approved! Check your new rank on the leaderboard.");
            fetchAlumniInbox(); 
            fetchLeaderboard(); 
        } else {
            const errData = await res.json();
            throw new Error(errData.detail || "Failed to approve.");
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// --- JOB BOARD LOGIC ---
async function fetchJobBoard() {
    const container = document.getElementById('jobBoardContainer');
    try {
        const res = await fetch(`${API_BASE_URL}/jobs/board`);
        const jobs = await res.json();
        
        if (jobs.length === 0) {
            container.innerHTML = '<div class="col-12"><p class="text-muted">No referrals available at the moment.</p></div>';
            return;
        }
        
        container.innerHTML = ''; 
        
        jobs.forEach(job => {
            const skillsHtml = (job.required_skills || []).map(s => `<span class="badge bg-secondary me-1">${s}</span>`).join('');
            
            let actionButtons = `<a href="${job.application_link}" target="_blank" class="btn btn-outline-dark btn-sm">View Job</a>`;
            
            if (userRole === 'Student') {
                actionButtons += `<button class="btn btn-primary btn-sm ms-2" onclick="requestReferral('${job.id}', '${job.posted_by}')">Request Referral</button>`;
            }

            container.innerHTML += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card border p-3 h-100 shadow-sm">
                        <h5 class="fw-bold">${job.company}</h5>
                        <p class="text-primary fw-semibold">${job.role}</p>
                        <p class="small text-muted mb-2">Posted by: <strong>${job.alumni_name || 'Alumni'} <i class="bi bi-patch-check-fill text-primary" title="Verified Alumni"></i></strong></p>
                        ${job.eligibility ? `<p class="small text-muted mb-2"><i class="bi bi-person-check"></i> ${job.eligibility}</p>` : ''}
                        <div class="mb-3">${skillsHtml}</div>
                        <div class="mt-auto d-flex justify-content-start">
                            ${actionButtons}
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) { 
        container.innerHTML = '<div class="col-12"><p class="text-danger">Failed to load the job board.</p></div>'; 
    }
}

// --- REQUEST REFERRAL LOGIC ---
async function requestReferral(jobId, alumniId) {
    if (!confirm("Are you sure you want to request a referral for this job?")) return;

    try {
        const payload = { job_id: jobId, alumni_id: alumniId };

        const res = await fetch(`${API_BASE_URL}/referrals/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Referral requested successfully! The Alumni will be notified.");
            fetchStudentTracker(); 
        } else {
            const errData = await res.json();
            throw new Error(errData.detail || "Failed to request referral.");
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
}

// --- POST JOB LOGIC (ALUMNI) ---
const postJobForm = document.getElementById('postJobForm');
if (postJobForm) {
    postJobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('alumniAlert');
        const submitBtn = postJobForm.querySelector('button[type="submit"]');
        
        submitBtn.textContent = 'Posting...';
        submitBtn.disabled = true;
        
        const skillsRaw = document.getElementById('skills').value;
        const skillsArray = skillsRaw ? skillsRaw.split(',').map(s => s.trim()) : [];

        const payload = {
            company: document.getElementById('company').value.trim(),
            role: document.getElementById('role').value.trim(),
            eligibility: document.getElementById('eligibility').value.trim() || null,
            required_skills: skillsArray,
            application_link: document.getElementById('link').value.trim()
        };

        try {
            const res = await fetch(`${API_BASE_URL}/jobs/post`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-user-id': userId 
                },
                body: JSON.stringify(payload)
            });
            
            if (res.ok) {
                alertBox.textContent = "Referral opportunity posted successfully!";
                alertBox.className = "alert alert-success";
                postJobForm.reset();
                fetchJobBoard(); 
            } else {
                const errData = await res.json();
                throw new Error(errData.detail || "Failed to post.");
            }
        } catch (e) {
            alertBox.textContent = e.message;
            alertBox.className = "alert alert-danger";
        } finally {
            alertBox.classList.remove('d-none');
            submitBtn.textContent = 'Post Referral to Board';
            submitBtn.disabled = false;
        }
    });
}

// --- LOGOUT LOGIC ---
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = "index.html";
});