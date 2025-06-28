const API_URL = 'http://localhost:3000/api/profiles';
let profiles = [];
let currentEditProfile = null;
let selectedProfileEmail = null;

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const currentUserEmail = localStorage.getItem('currentUserEmail');
    console.log('Page loaded', { token: token ? 'present' : 'missing', currentUserEmail });

    if (!token || !currentUserEmail) {
        console.error('Missing token or email, redirecting to login', { token, currentUserEmail });
        window.location.href = '/index.html';
        return;
    }

    // Set user name in hero section
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = localStorage.getItem('userName') || 'User';
    } else {
        console.warn('Element #user-name not found in DOM');
    }

    // Load profiles
    await fetchAndRenderProfiles();
    await populateProfileSelect();
    const userProfile = await fetchUserProfile();
    if (userProfile) {
        console.log('User profile loaded', userProfile);
        loadManageProfile(userProfile);
        selectedProfileEmail = userProfile.email;
        const selectProfile = document.getElementById('select-profile');
        if (selectProfile) {
            selectProfile.value = userProfile.email;
        }
    } else {
        console.warn('No user profile found, user may need to create one');
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('currentUserEmail');
    window.location.href = '/index.html';
}

async function fetchAndRenderProfiles() {
    try {
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profiles');
        profiles = await response.json();
        console.log('Fetched profiles:', JSON.stringify(profiles, null, 2));
        renderSkillProfiles();
        renderLanguageProfiles();
        renderPeerProfiles();
    } catch (error) {
        console.error('Error fetching profiles:', error);
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch user profile');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

async function fetchProfileByEmail(email) {
    try {
        const response = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profile by email');
        const profiles = await response.json();
        return profiles.find(p => p.email === email) || null;
    } catch (error) {
        console.error('Error fetching profile by email:', error);
        return null;
    }
}

function showSection(sectionId, email = null) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.style.display = 'none');
    const sectionToShow = document.getElementById(sectionId);
    if (sectionToShow) sectionToShow.style.display = 'block';
    if (sectionId === 'skill-exchange-section') renderSkillProfiles();
    if (sectionId === 'language-exchange-section') renderLanguageProfiles();
    if (sectionId === 'peer-to-peer-section') renderPeerProfiles();
    if (sectionId === 'manage-profile-section') {
        selectedProfileEmail = email || localStorage.getItem('currentUserEmail') || null;
        populateProfileSelect();
        if (selectedProfileEmail) {
            const selectProfile = document.getElementById('select-profile');
            if (selectProfile) {
                selectProfile.value = selectedProfileEmail;
                loadSelectedProfile();
            }
        }
    }
}

async function populateProfileSelect() {
    const select = document.getElementById('select-profile');
    if (!select) {
        console.warn('Element #select-profile not found in DOM');
        return;
    }
    select.innerHTML = '<option value="">-- Select a Profile --</option>';
    try {
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('Failed to fetch profiles for dropdown');
        const allProfiles = await response.json();
        console.log('Populating profile select with:', allProfiles);
        allProfiles.forEach(profile => {
            if (profile.email) {
                const option = document.createElement('option');
                option.value = profile.email;
                option.textContent = `${profile.name} (${profile.email})`;
                select.appendChild(option);
            }
        });
        if (selectedProfileEmail) {
            select.value = selectedProfileEmail;
        }
    } catch (error) {
        console.error('Error populating profile select:', error);
    }
}

async function loadSelectedProfile() {
    const select = document.getElementById('select-profile');
    if (!select) {
        console.warn('Element #select-profile not found in DOM');
        return;
    }
    const email = select.value;
    if (!email) {
        console.log('No profile selected');
        return;
    }
    const profile = profiles.find(p => p.email === email) || await fetchProfileByEmail(email);
    if (profile) {
        console.log('Loading profile:', profile);
        loadManageProfile(profile);
    } else {
        console.error('Profile not found for email:', email);
        const errorMessage = document.getElementById('manage-error-message');
        if (errorMessage) {
            errorMessage.textContent = 'Profile not found.';
            errorMessage.style.display = 'block';
        }
    }
}

// Helper function to find matches between wanted and offered items
function findMatches(wanted, offered) {
    if (!wanted || !offered) {
        console.log('No match: Missing input', { wanted, offered });
        return false;
    }
    const normalizedWanted = Array.isArray(wanted)
        ? wanted.map(item => item ? item.trim().toLowerCase() : '').filter(item => item)
        : [wanted.trim().toLowerCase()].filter(item => item);
    const normalizedOffered = Array.isArray(offered)
        ? offered.map(item => item ? item.trim().toLowerCase() : '').filter(item => item)
        : [offered.trim().toLowerCase()].filter(item => item);
    const isMatch = normalizedWanted.some(w => {
        const match = normalizedOffered.includes(w);
        console.log(`Checking "${w}" in ${JSON.stringify(normalizedOffered)}: ${match}`);
        return match;
    });
    console.log('Match result:', { wanted: normalizedWanted, offered: normalizedOffered, isMatch });
    return isMatch;
}

function renderSkillProfiles() {
    const skillProfiles = document.getElementById('skill-profiles');
    if (!skillProfiles) {
        console.warn('Element #skill-profiles not found in DOM');
        return;
    }
    skillProfiles.innerHTML = '';
    const currentUser = profiles.find(p => p.email === localStorage.getItem('currentUserEmail')) || {};
    console.log('Rendering skill profiles for:', {
        email: currentUser.email || 'none',
        skillsOffered: currentUser.skillsOffered || [],
        skillsWanted: currentUser.skillsWanted || []
    });
    if (!currentUser.email) {
        console.warn('No current user profile found for matching');
        return;
    }
    profiles.forEach(profile => {
        if (profile.email === currentUser.email) return;
        const isMatch = (
            (findMatches(currentUser.skillsWanted, profile.skillsOffered) ||
             findMatches(profile.skillsWanted, currentUser.skillsOffered))
        );
        console.log(`Skill match for ${profile.email}:`, {
            isMatch,
            theirSkills: { offered: profile.skillsOffered || [], wanted: profile.skillsWanted || [] }
        });
        const card = createSkillProfileCard(profile, isMatch);
        skillProfiles.appendChild(card);
    });
    const currentUserCard = createSkillProfileCard(currentUser, false, true);
    skillProfiles.appendChild(currentUserCard);
}

function renderLanguageProfiles() {
    const languageProfiles = document.getElementById('language-profiles');
    if (!languageProfiles) {
        console.warn('Element #language-profiles not found in DOM');
        return;
    }
    languageProfiles.innerHTML = '';
    const currentUser = profiles.find(p => p.email === localStorage.getItem('currentUserEmail')) || {};
    console.log('Rendering language profiles for:', {
        email: currentUser.email || 'none',
        learningLanguages: currentUser.learningLanguages || [],
        nativeLanguage: currentUser.nativeLanguage || ''
    });
    if (!currentUser.email) {
        console.warn('No current user profile found for matching');
        return;
    }
    profiles.forEach(profile => {
        if (profile.email === currentUser.email) return;
        const isMatch = findMatches(currentUser.learningLanguages, [profile.nativeLanguage || '']);
        console.log(`Language match for ${profile.email}:`, {
            isMatch,
            theirNativeLanguage: profile.nativeLanguage || 'none'
        });
        const card = createLanguageProfileCard(profile, isMatch);
        languageProfiles.appendChild(card);
    });
    const currentUserCard = createLanguageProfileCard(currentUser, false, true);
    languageProfiles.appendChild(currentUserCard);
}

function renderPeerProfiles() {
    const peerProfiles = document.getElementById('peer-profiles');
    if (!peerProfiles) {
        console.warn('Element #peer-profiles not found in DOM');
        return;
    }
    peerProfiles.innerHTML = '';
    const currentUser = profiles.find(p => p.email === localStorage.getItem('currentUserEmail')) || {};
    console.log('Rendering peer profiles for:', {
        email: currentUser.email || 'none',
        tutoringSubjects: currentUser.tutoringSubjects || [],
        tutoringNeeds: currentUser.tutoringNeeds || []
    });
    if (!currentUser.email) {
        console.warn('No current user profile found for matching');
        return;
    }
    profiles.forEach(profile => {
        if (profile.email === currentUser.email) return;
        const isMatch = (
            (findMatches(currentUser.tutoringNeeds, profile.tutoringSubjects) ||
             findMatches(profile.tutoringNeeds, currentUser.tutoringSubjects))
        );
        console.log(`Peer match for ${profile.email}:`, {
            isMatch,
            theirTutoring: { subjects: profile.tutoringSubjects || [], needs: profile.tutoringNeeds || [] }
        });
        const card = createPeerProfileCard(profile, isMatch);
        peerProfiles.appendChild(card);
    });
    const currentUserCard = createPeerProfileCard(currentUser, false, true);
    peerProfiles.appendChild(currentUserCard);
}

function createSkillProfileCard(profile, isMatch, isCurrentUser = false) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.setAttribute('data-email', profile.email || 'unknown');
    card.setAttribute('data-match', isMatch);
    card.innerHTML = `
        ${isMatch ? '<div class="match-banner">Match</div>' : ''}
        <div class="profile-image">
            <img src="https://via.placeholder.com/150?text=Cartoon" alt="${profile.name || 'Unknown'} Profile">
        </div>
        <div class="profile-details">
            <h3>${profile.name || 'Unknown'}</h3>
            <div class="skills-section">
                <h4>Skills Offered:</h4>
                <ul class="skills-list">
                    ${(Array.isArray(profile.skillsOffered) && profile.skillsOffered.length > 0) ? profile.skillsOffered.map(skill => `<li>${skill}</li>`).join('') : '<li>None</li>'}
                </ul>
            </div>
            <div class="skills-section">
                <h4>Skills Interested In:</h4>
                <ul class="skills-list">
                    ${(Array.isArray(profile.skillsWanted) && profile.skillsWanted.length > 0) ? profile.skillsWanted.map(skill => `<li>${skill}</li>`).join('') : '<li>None</li>'}
                </ul>
            </div>
        </div>
        ${isMatch ? `<button class="view-details-btn" onclick="showContactOverlay('${profile.email || ''}', ${isMatch})">View Details</button>` : ''}
    `;
    card.onclick = (event) => {
        if (!event.target.classList.contains('view-details-btn')) {
            showSection('manage-profile-section', profile.email);
        }
    };
    return card;
}

function createLanguageProfileCard(profile, isMatch, isCurrentUser = false) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.setAttribute('data-email', profile.email || 'unknown');
    card.setAttribute('data-match', isMatch);
    card.innerHTML = `
        ${isMatch ? '<div class="match-banner">Match</div>' : ''}
        <div class="profile-image">
            <img src="https://via.placeholder.com/150?text=Cartoon" alt="${profile.name || 'Unknown'} Profile">
        </div>
        <div class="profile-details">
            <h3>${profile.name || 'Unknown'}</h3>
            <div class="skills-section">
                <h4>Languages Offered:</h4>
                <ul class="skills-list">
                    ${(profile.nativeLanguage && typeof profile.nativeLanguage === 'string') ? `<li>${profile.nativeLanguage}</li>` : '<li>None</li>'}
                </ul>
            </div>
            <div class="skills-section">
                <h4>Languages Interested In:</h4>
                <ul class="skills-list">
                    ${(Array.isArray(profile.learningLanguages) && profile.learningLanguages.length > 0) ? profile.learningLanguages.map(lang => `<li>${lang}</li>`).join('') : '<li>None</li>'}
                </ul>
            </div>
        </div>
        ${isMatch ? `<button class="view-details-btn" onclick="showContactOverlay('${profile.email || ''}', ${isMatch})">View Details</button>` : ''}
    `;
    card.onclick = (event) => {
        if (!event.target.classList.contains('view-details-btn')) {
            showSection('manage-profile-section', profile.email);
        }
    };
    return card;
}

function createPeerProfileCard(profile, isMatch, isCurrentUser = false) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.setAttribute('data-email', profile.email || 'unknown');
    card.setAttribute('data-match', isMatch);
    card.innerHTML = `
        ${isMatch ? '<div class="match-banner">Match</div>' : ''}
        <div class="profile-image">
            <img src="https://via.placeholder.com/150?text=Cartoon" alt="${profile.name || 'Unknown'} Profile">
        </div>
        <div class="profile-details">
            <h3>${profile.name || 'Unknown'}</h3>
            <div class="skills-section">
                <h4>Can Tutor:</h4>
                <ul class="skills-list">
                    ${(Array.isArray(profile.tutoringSubjects) && profile.tutoringSubjects.length > 0) ? profile.tutoringSubjects.map(subject => `<li>${subject}</li>`).join('') : '<li>None</li>'}
                </ul>
            </div>
            <div class="skills-section">
                <h4>Needs Help With:</h4>
                <ul class="skills-list">
                    ${(Array.isArray(profile.tutoringNeeds) && profile.tutoringNeeds.length > 0) ? profile.tutoringNeeds.map(skill => `<li>${skill}</li>`).join('') : '<li>None</li>'}
                </ul>
            </div>
        </div>
        ${isMatch ? `<button class="view-details-btn" onclick="showContactOverlay('${profile.email || ''}', ${isMatch})">View Details</button>` : ''}
    `;
    card.onclick = (event) => {
        if (!event.target.classList.contains('view-details-btn')) {
            showSection('manage-profile-section', profile.email);
        }
    };
    return card;
}

function showContactOverlay(email, isMatch) {
    if (!isMatch) return;
    const profile = profiles.find(p => p.email === email);
    if (!profile) {
        console.error('Profile not found for contact overlay:', email);
        return;
    }
    currentEditProfile = profile;
    document.getElementById('contact-name').textContent = `Name: ${profile.name || 'Unknown'}`;
    document.getElementById('contact-email').textContent = `Email: ${profile.email || 'Unknown'}`;
    document.getElementById('contact-number').textContent = `Contact: ${profile.contact || 'Unknown'}`;
    document.getElementById('contact-bio').textContent = `Bio: ${profile.bio || 'None'}`;
    document.getElementById('edit-name').value = profile.name || '';
    document.getElementById('edit-email').value = profile.email || '';
    document.getElementById('edit-contact').value = profile.contact || '';
    document.getElementById('edit-bio').value = profile.bio || '';
    document.getElementById('contact-view').style.display = 'block';
    document.getElementById('contact-edit').style.display = 'none';
    document.getElementById('save-btn').style.display = 'none';
    document.getElementById('contact-error').style.display = 'none';

    document.getElementById('edit-btn').style.display = profile.email === localStorage.getItem('currentUserEmail') ? 'inline-block' : 'none';
    document.getElementById('contact-overlay').style.display = 'flex';
}

async function toggleEditMode(enable) {
    if (enable) {
        const errorMessage = document.getElementById('contact-error');
        errorMessage.style.display = 'none';

        if (currentEditProfile.email !== localStorage.getItem('currentUserEmail')) {
            errorMessage.textContent = 'You can only edit your own profile.';
            errorMessage.style.display = 'block';
            return;
        }

        document.getElementById('contact-view').style.display = 'none';
        document.getElementById('contact-edit').style.display = 'block';
        document.getElementById('edit-btn').style.display = 'none';
        document.getElementById('save-btn').style.display = 'inline-block';
    } else {
        document.getElementById('contact-overlay').style.display = 'none';
        currentEditProfile = null;
    }
}

async function saveContactChanges() {
    const name = document.getElementById('edit-name').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const contact = document.getElementById('edit-contact').value.trim();
    const bio = document.getElementById('edit-bio').value.trim();
    const errorMessage = document.getElementById('contact-error');

    errorMessage.style.display = 'none';

    if (!name || !email || !contact || !bio) {
        errorMessage.textContent = 'All fields are required.';
        errorMessage.style.display = 'block';
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address.';
        errorMessage.style.display = 'block';
        return;
    }

    if (!/^\d{10}$/.test(contact)) {
        errorMessage.textContent = 'Invalid contact number. Must be exactly 10 digits.';
        errorMessage.style.display = 'block';
        return;
    }

    const currentUserEmail = localStorage.getItem('currentUserEmail');
    if (email !== currentUserEmail) {
        errorMessage.textContent = 'You can only update your profile with your login email.';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const userProfile = await fetchUserProfile();
        if (!userProfile || userProfile.email !== currentEditProfile.email) {
            errorMessage.textContent = 'Unauthorized to edit this profile.';
            errorMessage.style.display = 'block';
            return;
        }

        const response = await fetch(`${API_URL}/${userProfile._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name,
                email,
                contact,
                skillsOffered: currentEditProfile.skillsOffered || [],
                skillsWanted: currentEditProfile.skillsWanted || [],
                nativeLanguage: currentEditProfile.nativeLanguage || '',
                learningLanguages: currentEditProfile.learningLanguages || [],
                tutoringSubjects: currentEditProfile.tutoringSubjects || [],
                tutoringNeeds: currentEditProfile.tutoringNeeds || [],
                bio
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        const updatedProfile = await response.json();
        localStorage.setItem('currentUserEmail', email);
        localStorage.setItem('userName', name);

        document.getElementById('contact-name').textContent = `Name: ${name}`;
        document.getElementById('contact-email').textContent = `Email: ${email}`;
        document.getElementById('contact-number').textContent = `Contact: ${contact}`;
        document.getElementById('contact-bio').textContent = `Bio: ${bio}`;
        document.getElementById('contact-view').style.display = 'block';
        document.getElementById('contact-edit').style.display = 'none';
        document.getElementById('edit-btn').style.display = 'inline-block';
        document.getElementById('save-btn').style.display = 'none';

        await fetchAndRenderProfiles();
        await populateProfileSelect();
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

async function createProfile() {
    const name = document.getElementById('new_name').value.trim();
    const email = document.getElementById('new_email').value.trim();
    const contact = document.getElementById('new_contact').value.trim();
    const skillsOffered = document.getElementById('new_skills_offered').value.trim();
    const skillsWanted = document.getElementById('new_skills_wanted').value.trim();
    const nativeLanguage = document.getElementById('new_native_language').value.trim();
    const learningLanguages = document.getElementById('new_learning_language').value.trim();
    const tutoringSubjects = document.getElementById('new_tutoring_subjects').value.trim();
    const bio = document.getElementById('new_bio').value.trim();

    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    const currentUserEmail = localStorage.getItem('currentUserEmail');
    if (email !== currentUserEmail) {
        errorMessage.textContent = 'You can only create a profile with your login email.';
        errorMessage.style.display = 'block';
        return;
    }

    if (!name || !email || !contact || !bio) {
        errorMessage.textContent = 'Name, Email, Contact, and Bio are required fields.';
        errorMessage.style.display = 'block';
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address.';
        errorMessage.style.display = 'block';
        return;
    }

    if (!/^\d{10}$/.test(contact)) {
        errorMessage.textContent = 'Invalid contact number. Must be exactly 10 digits.';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name,
                email,
                contact,
                skillsOffered: skillsOffered.split(',').map(s => s.trim()).filter(s => s),
                skillsWanted: skillsWanted.split(',').map(s => s.trim()).filter(s => s),
                nativeLanguage,
                learningLanguages: learningLanguages.split(',').map(l => l.trim()).filter(l => l),
                tutoringSubjects: tutoringSubjects.split(',').map(s => s.trim()).filter(s => s),
                tutoringNeeds: skillsWanted.split(',').map(s => s.trim()).filter(s => s),
                bio
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        successMessage.textContent = 'Profile created successfully!';
        successMessage.style.display = 'block';

        // Manually clear form fields
        document.getElementById('new_name').value = '';
        document.getElementById('new_email').value = '';
        document.getElementById('new_contact').value = '';
        document.getElementById('new_skills_offered').value = '';
        document.getElementById('new_skills_wanted').value = '';
        document.getElementById('new_native_language').value = '';
        document.getElementById('new_learning_language').value = '';
        document.getElementById('new_tutoring_subjects').value = '';
        document.getElementById('new_bio').value = '';

        localStorage.setItem('currentUserEmail', email);
        localStorage.setItem('userName', name);
        await fetchAndRenderProfiles();
        await populateProfileSelect();
        const userProfile = await fetchUserProfile();
        if (userProfile) loadManageProfile(userProfile);
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

async function updateProfile() {
    const selectedEmail = document.getElementById('select-profile').value;
    const errorMessage = document.getElementById('manage-error-message');
    const successMessage = document.getElementById('manage-success-message');
    const currentUserEmail = localStorage.getItem('currentUserEmail');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    console.log('Attempting to update profile', { selectedEmail, currentUserEmail });

    if (!selectedEmail) {
        errorMessage.textContent = 'No profile selected.';
        errorMessage.style.display = 'block';
        console.error('No profile selected');
        return;
    }

    // Case-insensitive comparison for email
    if (selectedEmail.toLowerCase() !== currentUserEmail.toLowerCase()) {
        errorMessage.textContent = 'You can only edit your own profile.';
        errorMessage.style.display = 'block';
        console.error('Selected email does not match current user', { selectedEmail, currentUserEmail });
        return;
    }

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const skillsOffered = document.getElementById('skills_offered').value.trim();
    const skillsWanted = document.getElementById('skills_wanted').value.trim();
    const nativeLanguage = document.getElementById('native_language').value.trim();
    const learningLanguages = document.getElementById('learning_language').value.trim();
    const tutoringSubjects = document.getElementById('tutoring_subjects').value.trim();
    const bio = document.getElementById('bio').value.trim();

    if (!name || !email || !contact || !bio) {
        errorMessage.textContent = 'Name, Email, Contact, and Bio are required fields.';
        errorMessage.style.display = 'block';
        console.error('Missing required fields', { name, email, contact, bio });
        return;
    }

    // Case-insensitive comparison for email input
    if (email.toLowerCase() !== currentUserEmail.toLowerCase()) {
        errorMessage.textContent = 'You can only update your profile with your login email.';
        errorMessage.style.display = 'block';
        console.error('Attempted to change email', { attemptedEmail: email, currentUserEmail });
        return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        errorMessage.textContent = 'Please enter a valid email address.';
        errorMessage.style.display = 'block';
        console.error('Invalid email format', { email });
        return;
    }

    if (!/^\d{10}$/.test(contact)) {
        errorMessage.textContent = 'Invalid contact number. Must be exactly 10 digits.';
        errorMessage.style.display = 'block';
        console.error('Invalid contact number', { contact });
        return;
    }

    try {
        // Fetch the profile to get the _id
        const profile = profiles.find(p => p.email.toLowerCase() === selectedEmail.toLowerCase()) || await fetchProfileByEmail(selectedEmail);
        if (!profile) {
            errorMessage.textContent = 'Profile not found.';
            errorMessage.style.display = 'block';
            console.error('Profile not found for email', { selectedEmail });
            return;
        }

        console.log('Profile found', { profileId: profile._id, email: profile.email });

        const response = await fetch(`${API_URL}/${profile._id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                name,
                email,
                contact,
                skillsOffered: skillsOffered.split(',').map(s => s.trim()).filter(s => s),
                skillsWanted: skillsWanted.split(',').map(s => s.trim()).filter(s => s),
                nativeLanguage,
                learningLanguages: learningLanguages.split(',').map(l => l.trim()).filter(l => l),
                tutoringSubjects: tutoringSubjects.split(',').map(s => s.trim()).filter(s => s),
                tutoringNeeds: skillsWanted.split(',').map(s => s.trim()).filter(s => s),
                bio
            })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        console.log('Profile updated successfully', { email, name });

        successMessage.textContent = 'Profile updated successfully!';
        successMessage.style.display = 'block';
        localStorage.setItem('currentUserEmail', email);
        localStorage.setItem('userName', name);
        await fetchAndRenderProfiles();
        await populateProfileSelect();
        const updatedProfile = await fetchProfileByEmail(email);
        if (updatedProfile) {
            loadManageProfile(updatedProfile);
            console.log('Updated profile loaded', updatedProfile);
        } else {
            console.warn('Failed to reload updated profile', { email });
        }
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
        console.error('Error updating profile:', error.message);
    }
}

async function deleteProfile() {
    const selectedEmail = document.getElementById('select-profile').value;
    const errorMessage = document.getElementById('manage-error-message');
    const successMessage = document.getElementById('manage-success-message');
    const currentUserEmail = localStorage.getItem('currentUserEmail');

    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';

    if (!selectedEmail) {
        errorMessage.textContent = 'No profile selected to delete.';
        errorMessage.style.display = 'block';
        return;
    }

    if (selectedEmail !== currentUserEmail) {
        errorMessage.textContent = 'You can only delete your own profile.';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        const userProfile = await fetchUserProfile();
        if (!userProfile || userProfile.email !== selectedEmail) {
            errorMessage.textContent = 'You can only delete your own profile.';
            errorMessage.style.display = 'block';
            return;
        }

        if (!confirm(`Are you sure you want to delete your profile (${selectedEmail})? This action cannot be undone.`)) {
            return;
        }

        const response = await fetch(`${API_URL}/${userProfile._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        successMessage.textContent = 'Profile deleted successfully!';
        successMessage.style.display = 'block';
        localStorage.removeItem('currentUserEmail');
        localStorage.removeItem('userName');
        await fetchAndRenderProfiles();
        await populateProfileSelect();
        showSection('home-section');
    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.style.display = 'block';
    }
}

function loadManageProfile(profile) {
    const currentUserEmail = localStorage.getItem('currentUserEmail');
    const isOwnProfile = profile.email === currentUserEmail;
    const errorMessage = document.getElementById('manage-error-message');
    const updateButton = document.getElementById('update-profile-btn');
    const deleteButton = document.getElementById('delete-profile-btn');

    // Clear previous messages
    if (errorMessage) {
        errorMessage.style.display = 'none';
        errorMessage.textContent = '';
    }

    // Populate form fields
    const fields = [
        { id: 'name', value: profile.name || '' },
        { id: 'email', value: profile.email || '' },
        { id: 'contact', value: profile.contact || '' },
        { id: 'skills_offered', value: (profile.skillsOffered || []).join(', ') || '' },
        { id: 'skills_wanted', value: (profile.skillsWanted || []).join(', ') || '' },
        { id: 'native_language', value: profile.nativeLanguage || '' },
        { id: 'learning_language', value: (profile.learningLanguages || []).join(', ') || '' },
        { id: 'tutoring_subjects', value: (profile.tutoringSubjects || []).join(', ') || '' },
        { id: 'bio', value: profile.bio || '' }
    ];

    fields.forEach(field => {
        const element = document.getElementById(field.id);
        if (element) {
            element.value = field.value;
            element.disabled = !isOwnProfile;
        } else {
            console.warn(`Element #${field.id} not found in DOM`);
        }
    });

    // Show read-only message for non-owned profiles
    if (!isOwnProfile && errorMessage) {
        errorMessage.textContent = 'This profile is read-only. You can only edit your own profile.';
        errorMessage.style.display = 'block';
    }

    // Disable update and delete buttons for non-owned profiles
    if (updateButton) {
        updateButton.disabled = !isOwnProfile;
    }
    if (deleteButton) {
        deleteButton.disabled = !isOwnProfile;
    }
}