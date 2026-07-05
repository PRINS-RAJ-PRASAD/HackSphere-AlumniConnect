/**
 * AlumniConnect AI Handler (Polished & Objectified UI Rendering Architecture)
 */

const BACKEND_URL = "http://127.0.0.1:8000";
let atsChartInstance = null; // Track chart instance to clear old graphs gracefully

/**
 * 1. AI Resume Analyzer Engine (Chart.js + Timeline Delivery)
 */
document.getElementById('resumeUploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const analyzeBtn = document.getElementById('analyzeBtn');
    const container = document.getElementById('resumeAnalysisResultContainer');
    const jobDesc = document.getElementById('jobDesc').value.trim();
    const resumeFile = document.getElementById('resumeFile').files[0];

    if (!jobDesc) {
        alert("Please paste a Job Description first.");
        return;
    }

    analyzeBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Evaluating Profile...`;
    analyzeBtn.disabled = true;
    container.classList.add('hidden');

    const formData = new FormData();
    formData.append('job_description', jobDesc);
    formData.append('resume', resumeFile);

    try {
        const response = await fetch(`${BACKEND_URL}/ai/analyze-resume`, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (!response.ok) {
            let errorMsg = data.detail || "Analysis runtime failed.";
            if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg);
            throw new Error(errorMsg);
        }

        // Clean rendering process
        container.classList.remove('hidden');
        document.getElementById('atsScoreLabel').innerText = `${data.ats_score}%`;

        // Render standard pie/doughnut gauge chart using Chart.js
        if (atsChartInstance) atsChartInstance.destroy(); // Wipe cache
        const ctx = document.getElementById('atsChart').getContext('2d');
        atsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [data.ats_score, 100 - data.ats_score],
                    backgroundColor: ['#0061ff', '#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: { cutout: '80%', plugins: { tooltip: { enabled: false } } }
        });

        // Loop and render Missing Keywords as structural badges
        const keywordsBox = document.getElementById('missingKeywordsContainer');
        keywordsBox.innerHTML = data.missing_keywords.length === 0 ? 
            `<span class="text-success small fw-bold">None! Excellent matching keywords found.</span>` : '';
        data.missing_keywords.forEach(keyword => {
            keywordsBox.innerHTML += `<span class="badge bg-danger bg-opacity-10 text-danger me-2 mb-2 p-2 px-3 border border-danger border-opacity-25 rounded-pill">${keyword}</span>`;
        });

        // Loop and build Upskilling Roadmap as an interactive timeline
        const roadmapBox = document.getElementById('roadmapContainer');
        roadmapBox.innerHTML = '';
        data.upskilling_roadmap.forEach((step, idx) => {
            roadmapBox.innerHTML += `
                <div class="roadmap-step">
                    <strong class="text-dark">Step ${idx + 1}:</strong> 
                    <span class="text-secondary d-block small">${step}</span>
                </div>`;
        });

    } catch (error) {
        alert("Resume Optimization Error: \n" + error.message);
    } finally {
        analyzeBtn.innerText = "Analyze Resume";
        analyzeBtn.disabled = false;
    }
});

/**
 * 2. Mock Interview Interface (Dynamic Structured Question Cards)
 */
/**
 * 2. Mock Interview Interface (Dynamic Structured Question Cards)
 */
async function generateInterview() {
    const btn = document.getElementById('interviewBtn');
    const container = document.getElementById('interviewResultContainer');
    const jobDesc = document.getElementById('interviewJobDesc').value.trim();
    
    // Pull data from the human-friendly input boxes
    const skillsRaw = document.getElementById('interviewSkills').value.trim();
    const experience = document.getElementById('interviewExperience').value.trim() || "Not specified";
    const interest = document.getElementById('interviewInterest').value.trim() || "Not specified";

    // Prevent crashing the backend by ensuring the Job Description isn't empty
    if (!jobDesc) {
        alert("Validation Error: Please paste a Target Job Description before generating questions.");
        return;
    }

    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Compiling Questions...`;
    btn.disabled = true;
    container.classList.add('hidden');

    try {
        // FIXED: Added the required "department" field to satisfy the FastAPI backend
        const payload = {
            job_description: jobDesc,
            profile_data: {
                department: "Computer Science", // <-- THIS FIXES THE ERROR
                skills: skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(s => s !== "") : [],
                experience: experience,
                interest: interest
            }
        };

        const response = await fetch(`${BACKEND_URL}/ai/mock-interview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        // Unwrap FastAPI 422 Validation Errors
        if (!response.ok) {
            let errorMsg = data.detail || "Interview generation failure.";
            if (typeof errorMsg === 'object') {
                errorMsg = JSON.stringify(errorMsg, null, 2); 
            }
            throw new Error(errorMsg);
        }

        container.innerHTML = '';
        container.classList.remove('hidden');
        
        // Loop and display every individual question
        data.questions.forEach((q, idx) => {
            container.innerHTML += `
                <div class="col-md-12 mb-3">
                    <div class="p-3 border rounded bg-white shadow-sm border-start border-primary border-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span class="badge bg-primary px-3 rounded-pill">Question #${idx + 1}</span>
                            <span class="small fw-semibold text-muted"><i class="bi bi-shield-check"></i> Testing: ${q.focus_area}</span>
                        </div>
                        <p class="mb-0 text-dark fw-medium fs-6">"${q.question}"</p>
                    </div>
                </div>`;
        });

    } catch (error) {
        alert("Mock Interview Compiler Error: \n" + error.message);
    } finally {
        btn.innerText = "Generate Questions";
        btn.disabled = false;
    }
}

/**
 * 3. Referral Pitch Generator (Draft Interface with Clipboard Access)
 */
async function generatePitch() {
    const btn = document.getElementById('pitchBtn');
    const container = document.getElementById('pitchResultContainer');
    
    const company = document.getElementById('pitchCompany').value.trim();
    const alumniName = document.getElementById('alumniName').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const skillsInput = document.getElementById('studentSkills').value.trim();

    if (!company || !alumniName || !studentName) {
        alert("Validation Error: Please fill in the Company, Alumni Name, and Your Name.");
        return;
    }

    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Drafting Message...`;
    btn.disabled = true;
    container.classList.add('hidden');

    try {
        const payload = {
            company: company,
            alumni_name: alumniName,
            alumni_role: "Alumni Verified Engineer", 
            student_name: studentName,
            student_skills: skillsInput ? skillsInput.split(',').map(skill => skill.trim()).filter(s => s !== "") : []
        };

        const response = await fetch(`${BACKEND_URL}/ai/referral-pitch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();

        // Unwrap FastAPI 422 Validation Errors
        if (!response.ok) {
            let errorMsg = data.detail || "Pitch engine runtime error.";
            if (typeof errorMsg === 'object') errorMsg = JSON.stringify(errorMsg, null, 2);
            throw new Error(errorMsg);
        }

        container.classList.remove('hidden');
        document.getElementById('pitchSubject').innerText = data.subject || "LinkedIn Connection Request";
        document.getElementById('pitchMessage').innerText = data.message;

    } catch (error) {
        alert("Referral Pitch Error: \n" + error.message);
    } finally {
        btn.innerText = "Generate Referral Pitch";
        btn.disabled = false;
    }
}

/**
 * Global Utility: Clipboard Integration Engine for Referral Pitch
 */
function copyPitchToClipboard() {
    const messageText = document.getElementById('pitchMessage').innerText;
    navigator.clipboard.writeText(messageText).then(() => {
        alert("Pitch copied directly to clipboard! You are ready to send it to your Alumni.");
    }).catch(err => {
        alert("Unable to copy text context: " + err);
    });
}