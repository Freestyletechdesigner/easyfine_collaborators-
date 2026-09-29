function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
    //load
    const body = document.getElementById('body');
    const load = document.querySelector('.load');
    const preloader = document.getElementById('preloader');

    window.addEventListener('load', () => {
        // Support both old preloader (.load) and new preloader (#preloader)
        setTimeout(() => {
            if (body) { body.style.display = 'block'; body.classList.add('loaded'); }
            if (load) load.style.display = 'none';
            if (preloader) preloader.classList.add('hide');
        }, 2200);
        
        // Track page view
        trackPageView();
    });

    // Track page view function
    async function trackPageView() {
        try {
            const response = await fetch('/api/views');
            const data = await response.json();
            
            if (data.success) {
                console.log(`Total views: ${data.views}, Unique visitors: ${data.uniqueVisitors}`);
            }
        } catch (error) {
            console.error('Error tracking page view:', error);
        }
    }

    //nav
    const nav2 = document.getElementById("nav2");
    const hamburger = document.getElementById("hamburger");
    const navX = document.getElementById('navX');

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        nav2.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    //property upload here
    const cardsContainer = document.getElementById('cardsContainer');
    const grid = cardsContainer;

    // ── Homepage shows only 4 featured properties ─────────────
    // Full browsing with infinite scroll is at /properties
    async function uploadProperty() {
        if (!grid) return;

        // Show 4 skeletons while fetching
        grid.innerHTML = Array(4).fill(`
            <div class="skeleton-card">
                <div class="skeleton skeleton-img"></div>
                <div class="skeleton-body">
                    <div class="skeleton skeleton-line" style="width:60%"></div>
                    <div class="skeleton skeleton-line" style="width:40%"></div>
                    <div class="skeleton skeleton-line" style="width:80%"></div>
                </div>
            </div>
        `).join('');

        try {
            const res  = await fetch('/api/post/property/featured');
            const data = await res.json();

            grid.innerHTML = '';

            if (data.success && data.property.length) {
                // Show only the first 4 properties as a preview
                data.property.slice(0, 4).forEach(p => {
                    grid.insertAdjacentHTML('beforeend', propertyCard(p));
                });
            } else {
                grid.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">No properties listed yet.</p>';
            }

        } catch (err) {
            console.error(err);
            grid.innerHTML = '<p style="text-align:center;padding:40px;color:#888;">Network error. Please refresh.</p>';
        }
    }

    // Stub out allPosts for any references elsewhere in logic.js
    let allPosts = [];
    let cursor   = 0;

    // initial fetch
    uploadProperty();

    // re-fetch every 1 min to pick up new/boosted posts
    setInterval(async () => {
        try {
            const res  = await fetch('/api/post/property/featured');
            const data = await res.json();
            if (data.success && data.property.length) {
                allPosts = data.property;
                cursor   = 0;
            }
        } catch (err) {}
    },  60 * 1000);

        // set the card function up 
 function  propertyCard(p) {
    const imgSrc   = p.imageNames && p.imageNames.length
        ? `/agent-loged/upload-property/${p.imageNames[0]}`
        : 'profile.png';
    const price = Number(p.price).toLocaleString();
    const date = new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const isLand     = (p.type  || '').toLowerCase() === 'land';
    const isClosed   = p.isClosed === true; // <-- Check deal closed status

    return `
        <div class="listing-card" data-title="${p.title}, ${p.type || 'Property'}" data-location="${p.location || 'N/A'}" data-price="${p.price}" data-room="${p.beds || 0} , ${p.baths || 0}" style="${isClosed ? 'opacity: 0.95;' : ''}">
            <div class="card-image">
                <img src="${imgSrc}" alt="${p.type || 'Property'}" loading="lazy" style="${isClosed ? 'filter: grayscale(80%) opacity(0.65);' : ''}">
                <span class="card-type-badge">${p.type || 'Property'}${p.title ? ', ' + p.title : ''}</span>
                ${p.category ? `<span class="card-category-badge ${p.category}">${p.category === 'shortlet' ? 'Short-let' : p.category === 'rent' ? 'For Rent' : 'For Sale'}</span>` : ''}
                <span class="card-verified-badge"><i class="fa-solid fa-circle-check"></i></span>
                ${isClosed ? `<span class="card-taken-badge">Property Taken</span>` : ''}
            </div>
            <div class="card-body">
                <div class="card-price" style="${isClosed ? 'color: #718096; text-decoration: line-through;' : ''}">₦${price}</div>
                <div class="card-location"><i class="fas fa-map-marker-alt"></i> ${p.location || 'N/A'}</div>
                <div class="card-stats">
                    ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bed"></i> ${p.beds || 0} Beds</span>`}
                    ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bath"></i> ${p.baths || 0} Baths</span>`}
                    ${isLand? `<span class="card-stat"><i class="fas fa-ruler-combined"></i> ${p.area || 0}</span>` : ''}
                </div>
                <div class="card-date"><i class="fas fa-calendar-alt"></i> Listed ${date} <i class="fas fa-eye"></i> views ${p.view || 0}</div>
            </div>
            <div class="card-footer">
                <a href="/property?id=${p._id}" class="btn-view-details">
                    View Details <i class="fas fa-arrow-right"></i>
                </a>
                <button class="btn-share-card" onclick="shareCard('${p._id}')">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `;
}

    //share link
    window.shareCard = function(id) {
        const url = `${window.location.origin}/property?id=${id}`;
        if (navigator.share) {
            navigator.share({ title: 'Check out this property on Easy Find', url })
                .catch(() => copyLink(url));
        } else {
            copyLink(url);
        }
    };
    //copy link
    function copyLink(url) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url)
                .then(() => alertBox.success('Copied', 'Property link copied to clipboard'))
                .catch(() => fallbackCopy(url));
        } else {
            fallbackCopy(url);
        }
    }

    function fallbackCopy(url) {
        const el = document.createElement('textarea');
        el.value = url;
        el.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alertBox.success('Copied', 'Property link copied to clipboard');
    }

    // scroll animation
    let sections = document.querySelectorAll('.section');

    window.addEventListener('scroll', () => {
        sections = document.querySelectorAll('.section'); // re-query to pick up dynamic cards
        sections.forEach(section => {
            const rect = section.getBoundingClientRect()
            if (rect.top < window.innerHeight - 100 && rect.bottom > 0) {
                section.classList.add('action');
            } else {
                section.classList.remove('action');
            }
        })

    });

    // scroll animation 2

    const sections2 = document.querySelectorAll('.section2');

    window.addEventListener('scroll', () => {
        sections2.forEach(section => {
            const rect = section.getBoundingClientRect()
            if (rect.top < window.innerHeight - 100 && rect.bottom > 0) {
                section.classList.add('action2');
            } else {
                section.classList.remove('action2');
            }
        })

    });

    // Load verified agents with pagination
    let agentPage       = 1;
    let agentLoading    = false;
    let agentTotalCount = 0;

    async function loadVerifiedAgents(page = 1) {
        if (agentLoading) return;
        agentLoading = true;

        const container = document.getElementById('agents-container');
        const loadMoreBtn = document.getElementById('loadMoreAgentsBtn');

        // skeletons on first load
        if (page === 1) {
            container.innerHTML = Array(4).fill(`
                <div class="agent-card skeleton-agent">
                    <div class="skeleton" style="width:100px;height:100px;border-radius:50%;margin:0 auto 12px;"></div>
                    <div class="skeleton skeleton-line" style="width:60%;margin:0 auto 8px;height:14px;"></div>
                    <div class="skeleton skeleton-line" style="width:40%;margin:0 auto;height:12px;"></div>
                </div>
            `).join('');
        }

        try {
            const res  = await fetch(`/api/agents/verified?page=${page}`);
            const data = await res.json();

            if (page === 1) container.innerHTML = '';

            if (data.success && data.agents.length > 0) {
                agentTotalCount = data.totalCount;

                for (let i = data.agents.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data.agents[i], data.agents[j]] = [data.agents[j], data.agents[i]];
                }

                data.agents.forEach(agent => {
                    const card = document.createElement('div');
                    card.className = 'agent-card section';
                    card.innerHTML = `
                        ${agent.profilePicture
                            ? `<img src="${agent.profilePicture}" loading="lazy" alt="${agent.name}" onerror="this.style.display='none'">`
                            : `<i class="fa-solid fa-user-tie" style="font-size:3rem;color:#0d7068;margin-bottom:10px;"></i>`
                        }
                        <h3>${agent.name}</h3>
                        <p><i class="fa-solid fa-circle-check" style="color:#0d7068;"></i> ${agent.stand || 'Verified Agent'}</p>
                        <a href="/agent-profile?id=${agent.id}" class="agent-btn">View Profile</a>
                    `;
                    container.appendChild(card);
                });

                // show/hide load more
                const loaded = page * 8;
                if (loadMoreBtn) {
                    loadMoreBtn.style.display = loaded < agentTotalCount ? 'block' : 'none';
                }

                // trigger scroll animation for newly added cards
                window.dispatchEvent(new Event('scroll'));
            } else if (page === 1) {
                container.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No verified agents available at the moment.</p>';
            }
        } catch (err) {
            console.error('Error loading agents:', err);
            container.innerHTML = Array(4).fill(`
                <div class="agent-card skeleton-agent">
                    <div class="skeleton" style="width:100px;height:100px;border-radius:50%;margin:0 auto 12px;"></div>
                    <div class="skeleton skeleton-line" style="width:60%;margin:0 auto 8px;height:14px;"></div>
                    <div class="skeleton skeleton-line" style="width:40%;margin:0 auto;height:12px;"></div>
                </div>
            `).join('');
            if (page === 1) {
                setTimeout(() => {
                    container.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Network error. Please refresh.</p>';
                }, 15 * 1000);
            }
        } finally {
            agentLoading = false;
        }
    }

    // Load agents when page loads
    loadVerifiedAgents(1);

    // Load More agents button
    const loadMoreAgentsBtn = document.getElementById('loadMoreAgentsBtn');
    if (loadMoreAgentsBtn) {
        loadMoreAgentsBtn.addEventListener('click', () => {
            agentPage++;
            loadVerifiedAgents(agentPage);
        });
    }


    //feedback toggle
    const clientsFB  = document.querySelector('.clients-feedback');
    const clientsBtn = document.getElementById('client-btn');
    const feedbackClose = document.getElementById('feedbackClose');
    let feedbackLoaded = false;
    let selectedRating = 5;

    loadFeedbacks();

    function openFeedback() {
        clientsFB.classList.add('feed-move');
        clientsBtn.classList.add('feed-move');
        if (!feedbackLoaded) { loadFeedbacks(); feedbackLoaded = true; }
    }
    function closeFeedback() {
        clientsFB.classList.remove('feed-move');
        clientsBtn.classList.remove('feed-move');
    }

    clientsBtn.addEventListener('click', () => {
        clientsFB.classList.contains('feed-move') ? closeFeedback() : openFeedback();
    });
    feedbackClose.addEventListener('click', closeFeedback);

    // star rating
    const stars = document.querySelectorAll('#feedbackStars i');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.v);
            stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.v) <= selectedRating));
        });
        star.addEventListener('mouseover', () => {
            stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.v) <= parseInt(star.dataset.v)));
        });
        star.addEventListener('mouseout', () => {
            stars.forEach(s => s.classList.toggle('active', parseInt(s.dataset.v) <= selectedRating));
        });
    });
    // set default 5 stars
    stars.forEach(s => s.classList.add('active'));

    // char counter
    const feedbackMsg = document.getElementById('feedbackMsg');
    feedbackMsg.addEventListener('input', () => {
        document.getElementById('feedbackCharCount').textContent = `${feedbackMsg.value.length}/300`;
    });

    // load feedbacks
    async function loadFeedbacks() {
        const list = document.getElementById('feedbackList');
        try {
            const res  = await fetch('/api/feedback');
            const data = await res.json();
            if (!data.success || !data.feedbacks.length) {
                list.innerHTML = '<div class="feedback-loading" style="color:#888;font-size:0.8rem;">No reviews yet. Be the first!</div>';
                return;
            }
            list.innerHTML = data.feedbacks.map(f => `
                <div class="clients-feed">
                    <div class="feed-name">${f.name}</div>
                    <div class="feed-stars">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</div>
                    <p>${f.message}</p>
                </div>
            `).join('');
        } catch (err) {
            list.innerHTML = '<div class="feedback-loading" style="color:#888;">Network error. Please refresh.</div>';
        }
    }

    // submit feedback
    document.getElementById('feedbackSubmit').addEventListener('click', async () => {
        const btn     = document.getElementById('feedbackSubmit');
        const name    = document.getElementById('feedbackName').value.trim();
        const message = feedbackMsg.value.trim();

        if (!message) { alertBox.warning('Empty', 'Please write something before sending.'); return; }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner spin-icon" id="fa-spinner spin-icon"></i>';

        try {
            const res  = await fetch('/api/feedback', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ name, message, rating: selectedRating })
            });
            const data = await res.json();
            if (data.success) {
                alertBox.success('Thank you!', data.message);
                feedbackMsg.value = '';
                document.getElementById('feedbackName').value = '';
                document.getElementById('feedbackCharCount').textContent = '0/300';
                feedbackLoaded = false;
                loadFeedbacks();
            } else {
                alertBox.error('Error', data.message || 'Could not send feedback');
            }
        } catch (err) {
            alertBox.error('Error', 'Network error. Please try again.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        }
    });

    //LOGIN
    const loginPage = document.querySelector('.login');
    const loginBtn = document.getElementById('login-btn');
    const cancelIcon = document.getElementById('cancel-login-icon');
    const userLog = document.getElementById('user-log');
    const loginEye = document.getElementById('login-eye');
    const signupEye = document.getElementById('signup-eye');
    const loginPassword = document.getElementById('login-password');
    const signupPassword = document.getElementById('signup-password');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const linkToSignup = document.getElementById('link-to-signup');
    const linkToLogin = document.getElementById('link-to-login');
    const logAlert = document.getElementById('log-alert');
    const logoutBtn = document.querySelector('.btn-logout');
    const loginNav = document.getElementById('login-nav-hero');
    const holdLogin = document.querySelector('.hold-login');
    const navSignin = document.querySelectorAll('.nav-sign-in')

    holdLogin.style.right = '-10rem'

    loginNav.addEventListener('click', (e) => {
        e.stopPropagation();
        holdLogin.classList.toggle('open');
    });

    // Check if user is already logged in via session cookie
    async function isAuth() {
        try {
            // for normal user
            const res = await fetch('/api/user/profile', { credentials: 'include' });
            const data = await res.json();
            // for agent
            const resAgent = await fetch('/api/agent/profile', { credentials: 'include' });
            const dataAgent = await resAgent.json();

            if (data.success) {
                loginNav.style.display = 'none';
                logoutBtn.style.display = 'flex';
                userLog.style.display = 'flex';
                navSignin.forEach(n => n.style.display = 'none');
                userLog.textContent = data.user.name[0].toUpperCase();
            } else if (dataAgent.success) {
                loginNav.style.display = 'none';
                logoutBtn.style.display = 'flex';
                userLog.style.display = 'flex';
                navSignin.forEach(n => n.style.display = 'none');
                if (dataAgent.agent.profilePicture) {
                    userLog.innerHTML = `<img src="${dataAgent.agent.profilePicture}" alt="${dataAgent.agent.name}" style="width:40px;height:40px;object-fit:cover;border-radius:50%;">`;
                    userLog.style.background = 'transparent';
                    userLog.style.right = '2.1rem';
                    userLog.style.padding = '0';
                    userLog.style.border = '3px solid #00b5bbff';
                } else {
                    userLog.textContent = dataAgent.agent.name[0].toUpperCase();
                }
                userLog.addEventListener('click', () => {
                    window.location.href = '/agent-loged'
                });
            }

        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
    isAuth();

    // Logout
    if (userLog) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch('/api/logout', { method: 'POST', credentials: 'include' });
                await fetch('/api/agent/logout', { method: 'POST', credentials: 'include' });
                userLog.style.display = 'none';
                logoutBtn.style.display = 'none';
                loginNav.style.display = 'flex';
                userLog.textContent = '';
                showLoginAlert('Logged out successfully', 'success');
            } catch (error) {
                console.error('Logout error:', error);
                showLoginAlert('Something went wrong, try again later', 'error');
            }
        });
    }

    // Password visibility toggle for login
    if (loginPassword && loginEye) {
        console.log('Login eye icon found:', loginEye);
        loginPassword.type = 'password';
        loginEye.style.display = 'inline-block';
        loginEye.addEventListener('click', () => {
            console.log('Login eye clicked');
            if (loginPassword.type === 'password') {
                loginPassword.type = 'text';
                loginEye.classList.remove('fa-eye');
                loginEye.classList.add('fa-eye-slash');
            } else {
                loginPassword.type = 'password';
                loginEye.classList.remove('fa-eye-slash');
                loginEye.classList.add('fa-eye');
            }
        });
    } else {
        console.log('Login password or eye not found:', { loginPassword, loginEye });
    }

    // Password strength validation
    function validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password)
        };
        
        const isValid = Object.values(requirements).every(req => req);
        
        return {
            isValid,
            requirements,
            message: isValid ? 'Password is strong' : 'Password does not meet requirements'
        };
    }

    // Add password strength indicator
    function addPasswordStrengthIndicator(passwordInput, containerId) {
        const container = document.getElementById(containerId);
        if (!container || !passwordInput) return;

        // Create strength indicator
        const strengthDiv = document.createElement('div');
        strengthDiv.className = 'password-strength';
        strengthDiv.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill"></div>
            </div>
            <div class="strength-requirements">
                <div class="req" data-req="length">✗ At least 8 characters</div>
                <div class="req" data-req="uppercase">✗ One uppercase letter</div>
                <div class="req" data-req="lowercase">✗ One lowercase letter</div>
                <div class="req" data-req="number">✗ One number</div>
            </div>
        `;
        
        // Insert after the span container (parent of password input)
        const spanContainer = passwordInput.parentNode;
        spanContainer.parentNode.insertBefore(strengthDiv, spanContainer.nextSibling);

        // Add event listener
        passwordInput.addEventListener('input', () => {
            const validation = validatePasswordStrength(passwordInput.value);
            const strengthFill = strengthDiv.querySelector('.strength-fill');
            const requirements = strengthDiv.querySelectorAll('.req');
            
            // Update strength bar
            const strength = Object.values(validation.requirements).filter(Boolean).length;
            const percentage = (strength / 4) * 100;
            strengthFill.style.width = percentage + '%';
            
            // Update color based on strength
            if (percentage < 50) {
                strengthFill.style.backgroundColor = '#ff4444';
            } else if (percentage < 75) {
                strengthFill.style.backgroundColor = '#ffaa00';
            } else {
                strengthFill.style.backgroundColor = '#00aa00';
            }
            
            // Update requirements
            requirements.forEach(req => {
                const reqType = req.dataset.req;
                if (validation.requirements[reqType]) {
                    req.innerHTML = req.innerHTML.replace('✗', '✓');
                    req.style.color = '#00aa00';
                } else {
                    req.innerHTML = req.innerHTML.replace('✓', '✗');
                    req.style.color = '#ff4444';
                }
            });
            
            // Show/hide based on focus and content
            if (passwordInput.value.length > 0) {
                strengthDiv.style.display = 'block';
            } else {
                strengthDiv.style.display = 'none';
            }
        });

        // Hide on blur if password is strong
        passwordInput.addEventListener('blur', () => {
            const validation = validatePasswordStrength(passwordInput.value);
            if (validation.isValid) {
                setTimeout(() => {
                    strengthDiv.style.display = 'none';
                }, 2000);
            }
        });

        // Show on focus
        passwordInput.addEventListener('focus', () => {
            if (passwordInput.value.length > 0) {
                strengthDiv.style.display = 'block';
            }
        });
    }

    // Initialize password strength indicators
    if (signupPassword) {
        addPasswordStrengthIndicator(signupPassword, 'signup-form');
    }
    if (signupPassword && signupEye) {
        console.log('Signup eye icon found:', signupEye);
        signupPassword.type = 'password';
        signupEye.style.display = 'inline-block'; // Force display
        signupEye.addEventListener('click', () => {
            console.log('Signup eye clicked');
            if (signupPassword.type === 'password') {
                signupPassword.type = 'text';
                signupEye.classList.remove('fa-eye');
                signupEye.classList.add('fa-eye-slash');
            } else {
                signupPassword.type = 'password';
                signupEye.classList.remove('fa-eye-slash');
                signupEye.classList.add('fa-eye');
            }
        });
    } else {
        console.log('Signup password or eye not found:', { signupPassword, signupEye });
    }

    // Form switching
    if (linkToSignup) {
        linkToSignup.addEventListener('click', () => {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
            loginPage.querySelector('h1').textContent = 'Create Account';
        });
    }

    if (linkToLogin) {
        linkToLogin.addEventListener('click', () => {
            signupForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
            loginPage.querySelector('h1').textContent = 'Welcome Back';
        });
    }

    // Show/hide login modal
    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            loginPage.classList.toggle('log');
        });
    }
    if (cancelIcon) {
        cancelIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            loginPage.classList.toggle('log');
        });
    }

    // Close login modal when clicking outside
    window.addEventListener('click', (e) => {
        if (loginPage && !loginPage.contains(e.target) && !loginBtn.contains(e.target)) {
            loginPage.classList.remove('log');
        }
        // close hold-login if clicking outside
        if (!holdLogin.contains(e.target) && !loginNav.contains(e.target)) {
            holdLogin.classList.remove('open');
        }
        //close nav2 logic
        if (!hamburger.contains(e.target)) {
            hamburger.classList.remove('active');
            nav2.classList.remove('active');
        }
    });

    // Show alert function
    function showLoginAlert(message, type = 'info') {
        if (logAlert) {
            logAlert.textContent = message;
            logAlert.className = `show ${type}`;
            setTimeout(() => {
                logAlert.classList.remove('show');
            }, 3000);
        }
    }

// 1. GLOBAL GOOGLE SIGN-IN INITIALIZATION
function initGoogleSignIn() {
    const googleBtnContainer = document.getElementById('googleBtn');
    if (googleBtnContainer && typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: "764343023876-b1958h76nsded9q6letkmr05alihc5v1.apps.googleusercontent.com",
            callback: handleGoogleCredentialResponse,
            use_fedcm_for_prompt: false // Smooth bypass for localhost port environments
        });

        google.accounts.id.renderButton(
            googleBtnContainer,
            { theme: "outline", size: "large", width: "290", text: "signin_with" }
        );
    }
}

// 2. GOOGLE OAUTH CALLBACK PATHWAY
async function handleGoogleCredentialResponse(googleResponse) {
    const submitBtn = loginForm ? loginForm.querySelector('input[type="submit"]') : null;
    let originalText = '';

    if (submitBtn) {
        originalText = submitBtn.value;
        submitBtn.classList.add('loading');
        submitBtn.value = 'Signing In with Google...';
        submitBtn.disabled = true;
    }

    try {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                googleToken: googleResponse.credential
            })
        });

        const data = await res.json();

        if (!data.success) {
            showLoginAlert('User not found, Register.', 'error');
            return;
        }

        // If success: true
        handleUnifiedLoginResponse(data);

    } catch (err) {
        console.error("Google login error", err);
        showLoginAlert('An error occurred. Please try again.', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.value = originalText;
            submitBtn.disabled = false;
        }
    }
}

// 3. CENTRALIZED DATA AND UI ROUTER
function handleUnifiedLoginResponse(data) {
    if (data.success) {
        showLoginAlert('Login successful!', 'success');
        
        // Check if admin or regular user
        if (data.admin) {
            // Admin routing structure
            setTimeout(() => { window.location.href = '/admin'; }, 1000);
        } else if (data.user) {
            // Regular user DOM state upgrades
            userLog.textContent = data.user.name[0];
            loginNav.style.display = 'none';
            holdLogin.style.right = '-10rem';
            userLog.style.display = 'flex';
            logoutBtn.style.display = 'flex';
            loginPage.classList.remove('log');
            if (loginForm) loginForm.reset();
        }
    } else {
        showLoginAlert(data.message || 'Login failed', 'error');
    }
}

// 4. STANDARD SUBMIT LISTENER MODIFICATION
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('input[type="submit"]');
        const originalText = submitBtn.value;
        
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.value = 'Signing In...';
        submitBtn.disabled = true;

        const formData = new FormData(loginForm);
        
        // Debug: Log form data
        console.log('=== LOGIN FORM SUBMISSION ===');
        console.log('Email:', formData.get('email'));
        console.log('Password:', formData.get('password') ? '***' : 'MISSING');

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });
            
            const data = await res.json();
            // Pass response directly to the unified processor
            handleUnifiedLoginResponse(data);
            
        } catch (err) {
            console.error("Login error", err);
            showLoginAlert('Login failed. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.value = originalText;
            submitBtn.disabled = false;
        }
    });
}

    //signup
    // Signup form submission (updated)
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const submitBtn = signupForm.querySelector('input[type="submit"]');
            const originalText = submitBtn.value;
            
            // Get form data
            const formData = new FormData(signupForm);
            const signupData = {
                name: formData.get('name'),
                email: formData.get('email'),
                number: formData.get('number'),
                password: formData.get('password')
            };

            // Validate password strength on client side
            const passwordValidation = validatePasswordStrength(signupData.password);
            if (!passwordValidation.isValid) {
                showLoginAlert('Password does not meet security requirements', 'error');
                return;
            }
            
            // Show loading state
            submitBtn.classList.add('loading');
            submitBtn.value = 'Creating Account...';
            submitBtn.disabled = true;

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(signupData)
                });

                const data = await response.json();

                if (data.success) {
                    showLoginAlert(`Account created successfully! Welcome ${signupData.name}!`, 'success');
                                        
                    // Hide login button and show user name
                    loginNav.style.display = 'none';
                    holdLogin.style.right = '-10rem'
                    userLog.style.display = 'flex';
                    userLog.textContent = signupData.name[0];
                    logoutBtn.style.display = 'flex';
                    
                    // Close login modal
                    loginPage.classList.remove('log');
                    
                    // Reset form
                    signupForm.reset();
                } else {
                    showLoginAlert(data.message, 'error');
                }
            } catch (err) {
                console.error("Signup error", err);
                showLoginAlert('Signup failed. Please try again.', 'error');
            } finally {
                // Reset button state
                submitBtn.classList.remove('loading');
                submitBtn.value = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Legacy signup handler (keep for compatibility)
    const signUp = document.getElementById('signup-form');
    if (signUp && signUp !== signupForm) {
        signUp.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(signUp);
            const signupData = {
                name: formData.get('name'),
                email: formData.get('email'),
                number: formData.get('number'),
                password: formData.get('password')
            };

            // Validate password strength
            const passwordValidation = validatePasswordStrength(signupData.password);
            if (!passwordValidation.isValid) {
                showLoginAlert('Password does not meet security requirements', 'error');
                return;
            }

            try {
                const res = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(signupData)
                });

                const data = await res.json();

                if (data.success) {
                    showLoginAlert(`Account created! Welcome ${signupData.name}!`, 'success');
                                        
                    // Hide login button and show user name
                    loginNav.style.display = 'none';
                    holdLogin.style.right = '-10rem'
                    userLog.style.display = 'flex';
                    userLog.textContent = signupData.name[0];
                    logoutBtn.style.display = 'flex';
                    
                    // Close login modal
                    loginPage.classList.remove('log');
                    
                    // Reset form
                    signUp.reset();
                } else {
                    showLoginAlert(data.message, 'error');
                }
            } catch (error) {
                console.error('Signup error:', error);
                showLoginAlert('Signup failed. Please try again.', 'error');
            }
        });
    }


    //hold login nav
    window.addEventListener('click', (e) => {
        if (!loginNav.contains(e.target)) {
            if (holdLogin.style.right === '1.8rem') {
                holdLogin.style.right = '-10rem'
            }
        }
    })

    const waLink = document.querySelector('.wa-link');
    waLink.addEventListener('click', () => {
        const waURL = 'https://wa.me/2347035932876?text=Hello Easy Find'
        window.open(waURL, '_blank')
    });

    
    // Global tracking state for notifications
    let toastQuery = [];
    let isToastActive = false;
    // Real-time Property Upload Notifications
    const showPropertyToast = (p) => {
        let container = document.getElementById('realtime-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'realtime-toast-container';
            document.body.appendChild(container);
            
            // styles moved to public/style.css
        }

        const toast = document.createElement('div');
        toast.className = 'property-toast';
        
        const imgSrc = p.imageNames && p.imageNames.length
            ? `/agent-loged/upload-property/${p.imageNames[0]}`
            : 'profile.png';
            
        toast.innerHTML = `
            <img class="toast-img" src="${imgSrc}" alt="${p.type || 'Property'}">
            <div class="toast-body">
                <div class="toast-badge">New Listing Posted!</div>
                <h4 class="toast-title">${p.title || 'New Property'}</h4>
                <p class="toast-loc"><i class="fas fa-map-marker-alt"></i> ${p.location || 'N/A'}</p>
                <p class="toast-price">₦${Number(p.price).toLocaleString()}</p>
            </div>
            <button class="toast-close">&times;</button>
            <div class="toast-progress"></div>
        `;

        toast.addEventListener('click', (e) => {
            if (!e.target.classList.contains('toast-close')) {
                window.location.href = `/property?id=${p._id}`;
            }
        });

        const closeToast = () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
                isToastActive = false;
                processNextToast();
            }, 500);
        };
        
        toast.querySelector('.toast-close').addEventListener('click', (e) => {
            e.stopPropagation();
            closeToast();
        });

        container.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 50);
        setTimeout(closeToast, 6000);
    };

    // Check if there are more notifications waiting in line
    const processNextToast = () => {
        if (toastQuery.length > 0 && !isToastActive) {
            isToastActive = true;
            const next = toastQuery.shift();
            showPropertyToast(next);
        }
    };

    const initWebSocket = () => {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const socketUrl = `${wsProtocol}${window.location.host}`;
        let socket = new WebSocket(socketUrl);

        socket.addEventListener('open', () => {
            console.log('Real-time notification socket connected');
        });

        socket.addEventListener('message', (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'NEW_PROPERTY') {
                    const p = data.property;
                    
                    // 1. Show premium notification toast
                    toastQuery.push(p)
                    processNextToast()
                    
                    // 2. Prepend the card dynamically to the main listings container
                    const cardsContainer = document.getElementById('cardsContainer');
                    if (cardsContainer && typeof propertyCard === 'function') {
                        const temp = document.createElement('div');
                        temp.innerHTML = propertyCard(p);
                        const newCard = temp.firstElementChild;
                        
                        // Add transition classes for high-end feel
                        newCard.classList.add('action'); 
                        
                        // Prepend
                        cardsContainer.insertBefore(newCard, cardsContainer.firstChild);
                        
                        // Keep cache pool synced so pagination doesn't break
                        if (typeof allPosts !== 'undefined' && Array.isArray(allPosts)) {
                            allPosts.unshift(p);
                        }
                    }
                }
            } catch (err) {
                console.error('Error handling WebSocket message:', err);
            }
        });

        socket.addEventListener('close', () => {
            console.log('WebSocket disconnected. Reconnecting in 5 seconds...');
            setTimeout(() => {
                initWebSocket();
            }, 5000);
        });
    };

    initWebSocket();

    // Agent search 
    const agentSearchInput = document.getElementById('agent-search-input');
    const searchAgentList = document.getElementById('search-agent-list');
    // Agent dropdown search
    async function fetchAndRenderAgents(query) {
        try {
            const res  = await fetch(`/api/search/agent?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (!data.success) return;
            renderAgents(data.agents);
        } catch (err) {
            console.error('Search agent error:', err);
        }
    }

    function renderAgents(agents) {
        if (agents.length === 0) {
            searchAgentList.innerHTML = '<div class="agent-search-empty">No agents found</div>';
            searchAgentList.style.display = 'block';
            return;
        }
        searchAgentList.innerHTML = agents.map(a => `
            <a href="/agent-profile?id=${a._id}" class="agent-search-item">
                <div class="agent-search-avatar">
                    ${a.profilePicture
                        ? `<img src="${a.profilePicture}" alt="${a.name}">`
                        : `<span>${a.name ? a.name[0].toUpperCase() : '?'}</span>`
                    }
                </div>
                <div class="agent-search-info">
                    <p class="agent-search-name">${a.name}</p>
                    <p class="agent-search-stand">${a.stand && a.stand.toLowerCase() === 'verified agent' ? '<i class="fa-solid fa-circle-check"></i> ' + a.stand : ''}</p>
                </div>
            </a>
        `).join('');
        searchAgentList.style.display = 'block';
    }
    // debounced handler
    const handleSearch = debounce((value) => {
        if (!value) {
            searchAgentList.style.display = 'none';
            return;
        }
        fetchAndRenderAgents(value);
    }, 400);

    // Agent search 
    function initSearch() {
        if (!agentSearchInput) return;

        agentSearchInput.addEventListener('input', (e) => {
            
            const value = e.target.value.trim().toLowerCase(); 
            handleSearch(value);
        });

        document.addEventListener('click', (e) => {
            if (!agentSearchInput.contains(e.target) && !searchAgentList.contains(e.target)) {
                searchAgentList.style.display = 'none';
            }
        });
    }

    // Call once on DOM ready
    initSearch();