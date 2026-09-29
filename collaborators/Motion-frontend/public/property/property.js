// ── Nav ───────────────────────────────────────────────
const nav2      = document.getElementById('nav2');
const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
    nav2.classList.toggle('active');
    hamburger.classList.toggle('active');
});
window.addEventListener('click', e => {
    if (!hamburger.contains(e.target)) {
        nav2.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// ── Helpers ───────────────────────────────────────────
const $ = id => document.getElementById(id);

function getQueryId() {
    return new URLSearchParams(window.location.search).get('id');
}

// ── Comment State Tracking ────────────────────────────
let currentCommentPage = 1;
let isCommentsLoading = false;
let hasMoreComments = false;

// ── Load Property ─────────────────────────────────────
async function loadProperty() {
    const id = getQueryId();
    console.log(' Property ID from URL:', id);
    if (!id) { showError('No property ID provided.'); return; }

    // View post tracking logic
    const viewedKey = `viewed_${id}`;
    if (!localStorage.getItem(viewedKey)) {
        fetch(`/api/view/post/${id}/view`, {method: 'POST'});
        localStorage.setItem(viewedKey, '1');
    }

    try {
        const res  = await fetch(`/api/view/property/${id}`);
        const data = await res.json();
        
        if (!data.success) throw new Error('Failed to load');

        const prop = data.property;
        if (!prop) { showError('Property not found.'); return; }

        const verify = document.querySelector('.verify');
        if (verify) {
            verify.style.display = (prop.stand || '').toLowerCase() === 'verified agent' ? 'flex' : 'none';
        }

        console.log('✅ Rendering property:', prop.title);
        renderProperty(prop);
    } catch (e) {
        console.error('Error loading property:', e);
        showError('Could not load property details.');
    }
}

// ── Render ────────────────────────────────────────────
function renderProperty(p) {
    document.title = `${p.title || 'Property'} - Easy Find`;

    // Badges
    const cat = p.category || '';
    const catEl = $('badgeCategory');
    catEl.textContent = cat === 'shortlet' ? 'Short-let' : cat === 'rent' ? 'For Rent' : cat === 'sale' ? 'For Sale' : '';
    catEl.className = `badge-category ${cat}`;
    $('badgeType').textContent = p.type ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : '';

    // Title / location / date
    $('propTitle').textContent    = p.title || 'Untitled Property';
    $('propLocation').innerHTML   = `<i class="fa-solid fa-location-dot"></i> ${p.location || 'Location not specified'}`;
    $('propDate').innerHTML       = `<i class="fa-regular fa-calendar"></i> Listed ${new Date(p.date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}`;

    // Handle is closed / property taken styling
    const isClosed = p.isClosed === true;
    if (isClosed) {
        $('propPrice').style.textDecoration = 'line-through';
        $('propPrice').style.opacity = '0.7';
        
        // Update contact button state
        const contactBtn = $('btnContact');
        if (contactBtn) {
            contactBtn.innerHTML = '<i class="fa-solid fa-handshake-slash"></i> Deal Closed (Property Taken)';
            contactBtn.style.background = '#e53e3e';
            contactBtn.style.color = '#fff';
            contactBtn.style.cursor = 'not-allowed';
            contactBtn.disabled = true;
        }

        // Prepend warning banner above title block
        const titleBlock = document.querySelector('.prop-title-block');
        if (titleBlock && !titleBlock.querySelector('.taken-alert-banner')) {
            const banner = document.createElement('div');
            banner.className = 'taken-alert-banner';
            banner.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> This property is no longer active. The deal was successfully closed.`;
            titleBlock.insertBefore(banner, titleBlock.firstChild);
        }
    }

    // Property Type Adjustments
    const quickDetailsList = document.getElementById('quickDetailsList');
    const propStats = document.querySelector('.prop-stats');

    if (p.type && p.type.toLowerCase() === 'land') {
        if (quickDetailsList && quickDetailsList.children[2]) quickDetailsList.children[2].style.display = 'none';
        if (quickDetailsList && quickDetailsList.children[3]) quickDetailsList.children[3].style.display = 'none';
        if (propStats && propStats.children[0]) propStats.children[0].style.display = 'none';
        if (propStats && propStats.children[1]) propStats.children[1].style.display = 'none';
    } else {
        if (propStats && propStats.children[2]) propStats.children[2].style.display = 'none';
        if (quickDetailsList && quickDetailsList.children[4]) quickDetailsList.children[4].style.display = 'none';
    }

    // Stats
    $('statBeds').textContent  = p.beds  || '0';
    $('statBaths').textContent = p.baths || '0';
    $('statArea').textContent  = p.area  ? p.area.toLowerCase() : '--';

    // Description
    $('propDescription').textContent = p.description || 'No description provided.';

    // Features
    const featuresList = $('featuresList');
    const featureIcons = {
        'Swimming Pool': 'fa-water-ladder', 'Gym': 'fa-dumbbell', 'Parking': 'fa-square-parking',
        'Garden': 'fa-seedling', 'Balcony': 'fa-building', 'Security': 'fa-shield-halved',
        'Elevator': 'fa-elevator', 'Pet Friendly': 'fa-paw', 'Furnished': 'fa-couch',
        'Air Conditioning': 'fa-wind'
    };

    let features = [];
    if (p.features) {
        if (Array.isArray(p.features)) {
            features = p.features.filter(Boolean);
        } else if (typeof p.features === 'string') {
            features = p.features.split(',').map(f => f.trim()).filter(Boolean);
        }
    }
    if (features.length && featuresList) {
        featuresList.innerHTML = features.map(f =>
            `<div class="feature-chip"><i class="fa-solid ${featureIcons[f] || 'fa-check'}"></i> ${f}</div>`
        ).join('');
    } else if ($('featuresSection')) {
        $('featuresSection').style.display = 'none';
    }

    // Price
    const price = Number(p.price).toLocaleString();
    $('propPrice').textContent = `₦${price}`;
    $('propPriceSub').textContent = cat === 'rent' ? 'Per year' : cat === 'shortlet' ? 'Per night' : 'Asking price';

    // Quick details
    $('qdType').textContent     = p.type     ? p.type.charAt(0).toUpperCase() + p.type.slice(1) : '—';
    $('qdCategory').textContent = cat === 'shortlet' ? 'Short-let' : cat === 'rent' ? 'For Rent' : cat === 'sale' ? 'For Sale' : '—';
    $('qdBeds').textContent     = p.beds  ? `${p.beds} Bedroom${p.beds > 1 ? 's' : ''}` : '—';
    $('qdBaths').textContent    = p.baths ? `${p.baths} Bathroom${p.baths > 1 ? 's' : ''}` : '—';
    $('qdArea').textContent     = p.area  ? `${p.area.toUpperCase()}` : '—';
    $('qdLocation').textContent = p.location || '—';

    // Map Implementation
    const mapFrame   = $('mapFrame');
    const mapSection = mapFrame ? mapFrame.closest('.prop-section') : null;

    if (p.latitude && p.longitude) {
        const lat = parseFloat(p.latitude);
        const lng = parseFloat(p.longitude);

        if (mapFrame && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
            mapFrame.src = embedUrl;
            mapFrame.style.display = 'block';
        } else {
            showMapFallback(mapSection);
        }
    } else {
        showMapFallback(mapSection);
    }

    function showMapFallback(section) {
        if (!section) return;
        section.innerHTML = `
            <h2><i class="fa-solid fa-map-location-dot"></i> Location on Map</h2>
            <div style="background:#f0fdfb;border:1px dashed #0d7068;border-radius:12px;padding:28px 20px;text-align:center;">
                <i class="fa-solid fa-map-pin" style="font-size:2rem;color:#0d7068;margin-bottom:12px;display:block;"></i>
                <p style="font-weight:700;color:#333;margin-bottom:6px;">Map Pin Location Not Set</p>
                <p style="font-size:0.875rem;color:#666;line-height:1.6;">Precise map coordinates were not provided for this listing area. Contact the agent for direct route instructions.</p>
                <button onclick="const btn = document.getElementById('btnContact'); if(btn) btn.click();" style="margin-top:16px;padding:10px 24px;background:#0d7068;color:#fff;border:none;border-radius:10px;font-weight:600;cursor:pointer;font-size:0.9rem;">
                    <i class="fas fa-phone"></i> Contact Agent
                </button>
            </div>
        `;
    }

    // Images
    if (typeof renderSlider === 'function') {
        renderSlider(p.imageNames || []);
    }

    // Agent
    if (typeof loadAgent === 'function') {
        loadAgent(p.agentId);
    }

    // Related properties
    currentPropId = p._id;
    relatedPage   = 1;
    const relatedGrid = document.getElementById('relatedGrid');
    if (relatedGrid) relatedGrid.innerHTML = '';
    
    if (typeof loadRelated === 'function') {
        loadRelated(p._id, 1);
    }

    // Initial Comments Load
    loadComments(1, true);

    // Scroll animations
    if (typeof triggerScrollAnim === 'function') {
        setTimeout(triggerScrollAnim, 100);
    }
}

// ── Slider ────────────────────────────────────────────
let sliderIndex = 0;
let sliderImages = [];
let autoSlide;

function renderSlider(imageNames) {
    sliderImages = imageNames.length
        ? imageNames.map(n => `/agent-loged/upload-property/${n}`)
        : ['/icon/home icon.png'];

    const track = $('holdImg');
    track.innerHTML = sliderImages.map(src =>
        `<div class="slide">
            <img src="${src}" alt="Property image" onerror="this.src='/icon/home icon.png'">
        </div>`
    ).join('');

    updateSlides();
    startAutoSlide();
}

function updateSlides() {
    const slides = document.querySelectorAll('.slide');
    slides.forEach((slide, i) => {
        slide.classList.remove('active', 'left', 'right');
        if (i === sliderIndex) {
            slide.classList.add('active');
        } else if (i === (sliderIndex - 1 + slides.length) % slides.length) {
            slide.classList.add('left');
        } else if (i === (sliderIndex + 1) % sliderImages.length) {
            slide.classList.add('right');
        }
    });
    $('imgCounter').textContent = `${sliderIndex + 1} / ${sliderImages.length}`;
}

window.goToSlide = function(i) {
    sliderIndex = i;
    updateSlides();
};

function startAutoSlide() {
    clearInterval(autoSlide);
    autoSlide = setInterval(() => {
        if (sliderImages.length > 1) {
            sliderIndex = (sliderIndex + 1) % sliderImages.length;
            updateSlides();
        }
    }, 4000);
}

$('next').addEventListener('click', () => {
    sliderIndex = (sliderIndex + 1) % sliderImages.length;
    updateSlides();
    startAutoSlide();
});
$('back').addEventListener('click', () => {
    sliderIndex = (sliderIndex - 1 + sliderImages.length) % sliderImages.length;
    updateSlides();
    startAutoSlide();
});

// ── Agent profile viewing ─────────────────────────────
const profile = document.getElementById('agent-profile');

// ── Agent ─────────────────────────────────────────────
async function loadAgent(agentId) {
    if (!agentId) return;
    try {
        const res  = await fetch(`/api/agent/public/${agentId}`);
        const data = await res.json();
        if (!data.success) return;
        const agent = data.agent;
        if (!agent) return;
        
        const agent_name = agent.name.length > 8?
                                 agent.name.slice(0, 8) + '...' :
                                 agent.name;
        $('agentName').textContent = agent_name || 'Agent';
        $('agent-stand').textContent = agent.stand || '';

        profile.addEventListener('click', () => {
            window.location.href = `/agent-profile?id=${agent.id}`;
        });

        const Whatsapp = document.getElementById('contactWhatsapp');
        Whatsapp.addEventListener('click', (e) => {
            e.preventDefault();
            const phone = agent.phone.replace(/\D/g, '');
            const formatted = phone.startsWith('0') ? '234' + phone.slice(1) : phone;
            const postURL = window.location.href;
            const msg = encodeURIComponent(`Hi ${agent.name},\n\nI am interested in your property listing that I found here:${postURL}`);
            window.open(`https://wa.me/${formatted}?text=${msg}`, '_blank');
        });

        const EmailOpt = document.getElementById('contactEmail');
        EmailOpt.addEventListener('click', (e) => {
            e.preventDefault();
            const email = agent.email;
            const subject = encodeURIComponent('Inquiry Regarding Property Listing');
            const body = encodeURIComponent(`Hi ${agent.name},\n\nI am interested in your property listing that I found here: ${window.location.href}\n\nPlease provide me with more details.`);
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        });

        const CallOpt = document.getElementById('contactCall');
        CallOpt.addEventListener('click', (e) => {
            e.preventDefault();
            const cleanPhone = agent.phone.replace(/(?!^\+)\D/g, ''); 
            window.location.href = `tel:${cleanPhone}`;
        });

        if (agent.profilePicture) {
            $('agentAvatar').innerHTML = `<img src="${agent.profilePicture}" alt="${agent.name}">`;
        }
    } catch (_) {}
}

// ── Discussion Board Logic ────────────────────────────
async function loadComments(page = 1, isInitial = false) {
    const id = getQueryId();
    if (!id || isCommentsLoading) return;
    isCommentsLoading = true;

    const commentsList = $('commentsList');
    const loadMoreContainer = $('commentsLoadMore');

    if (isInitial) {
        currentCommentPage = 1;
        commentsList.innerHTML = '<div class="comment-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading discussion feed...</div>';
    }

    try {
        const res = await fetch(`/api/property/${id}/comments?page=${page}`);
        const data = await res.json();

        if (isInitial) commentsList.innerHTML = '';

        const spinner = commentsList.querySelector('.comment-loading');
        if (spinner) spinner.remove();

        if (data.success) {
            $('commentCount').textContent = data.totalComments || 0;

            if (data.comments && data.comments.length) {
                data.comments.forEach(c => {
                    commentsList.insertAdjacentHTML('beforeend', renderCommentRow(c));
                });
            } else if (isInitial) {
                commentsList.innerHTML = '<div class="comment-empty"><i class="fa-solid fa-comments"></i> No questions yet. Be the first to start a conversation!</div>';
            }

            hasMoreComments = data.hasMore;
            if (loadMoreContainer) {
                loadMoreContainer.style.display = hasMoreComments ? 'block' : 'none';
            }
        }
    } catch (err) {
        console.error('Error loading comments:', err);
        if (isInitial) {
            commentsList.innerHTML = '<div class="comment-error">Failed to load discussion thread.</div>';
        }
    } finally {
        isCommentsLoading = false;
    }
}

function renderCommentRow(c) {
    const date = new Date(c.createdAt).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Render nested replies
    let repliesHTML = '';
    if (c.replies && c.replies.length > 0) {
        repliesHTML = `
            <div class="comment-replies">
                ${c.replies.map(reply => {
                    const replyDate = new Date(reply.createdAt).toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                    return `
                        <div class="reply-row">
                            <div class="comment-avatar reply-avatar">
                                ${reply.name ? reply.name[0].toUpperCase() : 'A'}
                            </div>
                            <div class="comment-body">
                                <div class="comment-meta">
                                    <span class="comment-author">${reply.name || 'Anonymous'}</span>
                                    <span class="comment-time">${replyDate}</span>
                                </div>
                                <p class="comment-text">${reply.text}</p>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    return `
        <div class="comment-row-wrapper" data-id="${c._id}">
            <div class="comment-row">
                <div class="comment-avatar">
                    ${c.name ? c.name[0].toUpperCase() : 'A'}
                </div>
                <div class="comment-body">
                    <div class="comment-meta">
                        <span class="comment-author">${c.name || 'Anonymous'}</span>
                        <span class="comment-time">${date}</span>
                    </div>
                    <p class="comment-text">${c.text}</p>
                    <div class="comment-actions">
                        <button class="btn-reply-toggle" data-id="${c._id}">
                            <i class="fa-solid fa-reply"></i> Reply
                        </button>
                    </div>

                    <!-- Hidden Reply Form -->
                    <div class="reply-form-container" id="replyForm-${c._id}" style="display: none;">
                        <form class="reply-form" data-parent-id="${c._id}">
                            <div class="comment-input-row">
                                <input type="text" class="reply-name-input" placeholder="Your name (optional)" maxlength="50">
                            </div>
                            <div class="comment-input-row">
                                <textarea class="reply-text-input" placeholder="Write a reply..." maxlength="500" required rows="2"></textarea>
                            </div>
                            <div class="comment-form-footer">
                                <span class="reply-char-counter">0/500</span>
                                <div class="reply-form-actions">
                                    <button type="button" class="btn-reply-cancel" data-id="${c._id}">Cancel</button>
                                    <button type="submit" class="reply-submit-btn"><i class="fa-solid fa-paper-plane"></i> Reply</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            ${repliesHTML}
        </div>
    `;
}

// ── Contact popup ─────────────────────────────────────
$('btnContact').addEventListener('click', () => $('contactPopup').classList.add('open'));
$('popupClose').addEventListener('click', () => $('contactPopup').classList.remove('open'));
$('contactPopup').addEventListener('click', e => {
    if (e.target === $('contactPopup')) $('contactPopup').classList.remove('open');
});

// ── Share popup ───────────────────────────────────────
$('sharePop').addEventListener('click', () => $('holdPopshare').classList.add('open'));
$('cancelPop').addEventListener('click', () => $('holdPopshare').classList.remove('open'));
$('holdPopshare').addEventListener('click', e => {
    if (e.target === $('holdPopshare')) $('holdPopshare').classList.remove('open');
});

$('shareBtn').addEventListener('click', () => {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({ title: document.title, url });
    } else {
        alertBox.info('Share', 'Copy the link from your browser address bar.');
    }
});

$('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
        $('copyBtn').innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
            $('copyBtn').innerHTML = '<i class="fa-regular fa-copy"></i> Copy Link';
        }, 2000);
    });
});

// ── Scroll animation ──────────────────────────────────
function triggerScrollAnim() {
    const sections = document.querySelectorAll('.section');
    const check = () => sections.forEach(s => {
        const r = s.getBoundingClientRect();
        if (r.top < window.innerHeight - 60) s.classList.add('action');
    });
    window.addEventListener('scroll', check);
    check();
}

// ── Error ─────────────────────────────────────────────
function showError(msg) {
    document.querySelector('main').innerHTML =
        `<div style="text-align:center;padding:80px 20px;color:#555;">
            <i class="fa-solid fa-circle-exclamation" style="font-size:3rem;color:#0d7068;margin-bottom:16px;display:block;"></i>
            <p style="font-size:1.1rem;">${msg}</p>
            <a href="/" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#0d7068;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Go Home</a>
        </div>`;
}

// ── Related Properties State ────────────────────────────────
let relatedPage = 1;
let currentPropId = null;

function relatedCard(p) {
    if (!p) return '';

    const imgSrc = p.imageNames && p.imageNames.length
        ? `/agent-loged/upload-property/${encodeURIComponent(p.imageNames[0])}`
        : '/icon/home icon.png';

    const price = p.price ? Number(p.price).toLocaleString('en-NG') : 'Price on Ask';
    const date = p.date 
        ? new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
        : 'Recent';
    const isLand = String(p.type || '').toLowerCase() === 'land';
    const isVerified = (p.stand || '').toLowerCase() === 'verified agent';
    const isClosed = p.isClosed === true; 

    const cleanTitle = String(p.title || '').replace(/"/g, '&quot;');
    const cleanType = String(p.type || 'Property').replace(/"/g, '&quot;');
    const cleanLocation = String(p.location || 'N/A').replace(/"/g, '&quot;');

    return `
        <div class="related-card section action" 
             data-title="${cleanTitle}, ${cleanType}" 
             data-location="${cleanLocation}" 
             data-price="${p.price || 0}" 
             data-room="${p.beds || 0}, ${p.baths || 0}" style="${isClosed ? 'opacity: 0.95;' : ''}">
            
            <div class="related-card-img">
                <img src="${imgSrc}" alt="${cleanType}" loading="lazy" onerror="this.onerror=null; this.src='/icon/home icon.png';" style="${isClosed ? 'filter: grayscale(80%) opacity(0.65);' : ''}">
                <span class="card-type-badge">${cleanType}${p.title ? `, ${p.title}` : ''}</span>
                ${p.category ? `<span class="related-badge ${p.category}">${p.category === 'shortlet' ? 'Short-let' : p.category === 'rent' ? 'For Rent' : 'For Sale'}</span>` : ''}
                ${isVerified ? `<span class="card-verified-badge"><i class="fa-solid fa-circle-check"></i></span>` : ''}
                ${isClosed ? `<span class="card-taken-badge">Property Taken</span>` : ''}
            </div>
            
            <div class="related-card-body">
                <div class="related-price" style="${isClosed ? 'color: #718096; text-decoration: line-through;' : ''}">₦${price}</div>
                <div class="related-location"><i class="fas fa-map-marker-alt"></i> ${p.location || 'N/A'}</div>
                <div class="related-stats">
                    ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bed"></i> ${p.beds || 0} Beds</span>`}
                    ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bath"></i> ${p.baths || 0} Baths</span>`}
                    ${isLand && p.area ? `<span class="card-stat"><i class="fas fa-ruler-combined"></i> ${p.area}</span>` : ''}
                </div>
                <div class="related-date">
                    <i class="fas fa-calendar-alt"></i> Listed ${date} 
                    <span class="view-count"><i class="fas fa-eye"></i> ${p.view || 0} views</span>
                </div>
            </div>
            
            <div class="card-footer">
                <a href="/property?id=${p._id}" class="btn-view-details">
                    View Details <i class="fas fa-arrow-right"></i>
                </a>
                <button class="btn-share-card" onclick="shareCard('${p._id}')" aria-label="Share property">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        </div>
    `;
}

// ── Native Sharing Actions ───────────────────────────────────
window.shareCard = function(id) {
    if (!id) return;
    const url = `${window.location.origin}/property?id=${id}`;
    
    if (navigator.share) {
        navigator.share({ title: 'Check out this property on Easy Find', url })
            .catch((err) => {
                if(err.name !== 'AbortError') copyLink(url);
            });
    } else {
        copyLink(url);
    }
};

function copyLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url)
            .then(() => showNotification('Copied', 'Property link copied to clipboard'))
            .catch(() => fallbackCopy(url));
    } else {
        fallbackCopy(url);
    }
}

function fallbackCopy(url) {
    const el = document.createElement('textarea');
    el.value = url;
    el.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(el);
    el.select();
    try {
        document.execCommand('copy');
        showNotification('Copied', 'Property link copied to clipboard');
    } catch (err) {
        console.error('Fallback copy failed', err);
    }
    document.body.removeChild(el);
}

function showNotification(title, message) {
    if (typeof alertBox !== 'undefined' && alertBox.success) {
        alertBox.success(title, message);
    } else {
        alert(`${title}: ${message}`);
    }
}

function getSkeletonHTML() {
    return Array(4).fill(`
        <div class="skeleton-card temporary-skeleton">
            <div class="skeleton skeleton-img" style="height:200px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
            <div class="skeleton-body" style="padding:15px;">
                <div class="skeleton skeleton-line" style="width:60%; height:15px; margin-bottom:10px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
                <div class="skeleton skeleton-line" style="width:40%; height:12px; margin-bottom:10px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
                <div class="skeleton skeleton-line" style="width:80%; height:12px; background:#e0e0e0; animation: pulse 1.5s infinite ease-in-out;"></div>
            </div>
        </div>
    `).join('');
}

async function loadRelated(id, page = 1) {
    if (!id) return;
    
    const section = document.getElementById('relatedSection');
    const grid    = document.getElementById('relatedGrid');
    const moreBtn = document.getElementById('btnLoadMore'); 

    if (!section || !grid) return;

    section.style.display = 'block';
    
    if (page === 1) {
        grid.innerHTML = getSkeletonHTML();
    } else {
        grid.insertAdjacentHTML('beforeend', getSkeletonHTML());
    }

    if (moreBtn) moreBtn.style.display = 'none';

    try {
        const res  = await fetch(`/api/property/related/${id}?page=${page}`);
        const data = await res.json();

        const skeletons = grid.querySelectorAll('.temporary-skeleton');
        skeletons.forEach(sk => sk.remove());

        if (page === 1 && (!data.success || !data.related || !data.related.length)) {
            grid.innerHTML = `<div class="empty-state-container" style="padding:40px; text-align:center; width:100%;">
                <i class="fas fa-home" style="font-size: 48px; color:#ccc; margin-bottom:15px;"></i>
                <p style="color:#666;">No matching related properties found.</p>
            </div>`;
            return;
        }

        if (data.success && data.related && data.related.length) {
            data.related.forEach(p => grid.insertAdjacentHTML('beforeend', relatedCard(p)));
            grid.querySelectorAll('.section').forEach(el => el.classList.add('action'));
            if (moreBtn) {
                moreBtn.style.display = data.related.length === 8 ? 'flex' : 'none';
            }
        }
    } catch (err) {
        console.error('Related properties failed loading:', err);
        const skeletons = grid.querySelectorAll('.temporary-skeleton');
        skeletons.forEach(sk => sk.remove());
    }
}

// ── Event Handlers Setup ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const moreBtn = document.getElementById('btnLoadMore');
    if (moreBtn) {
        moreBtn.addEventListener('click', () => {
            relatedPage++;
            loadRelated(currentPropId, relatedPage);
        });
    }

    // Discussion Feed submission handler
    const commentForm = $('propertyCommentForm');
    if (commentForm) {
        const commentTextInput = $('commentTextInput');
        const commentCharCounter = $('commentCharCounter');

        commentTextInput.addEventListener('input', () => {
            commentCharCounter.textContent = `${commentTextInput.value.length}/500`;
        });

        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = getQueryId();
            if (!id) return;

            const name = $('commentNameInput').value.trim();
            const text = commentTextInput.value.trim();
            const submitBtn = $('commentSubmitBtn');
            const originalText = submitBtn.innerHTML;

            if (!text) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';

            try {
                const res = await fetch(`/api/property/${id}/comment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, text })
                });
                const data = await res.json();

                if (data.success) {
                    commentForm.reset();
                    commentCharCounter.textContent = '0/500';
                    showNotification('Comment Posted', 'Your comment has been added successfully.');
                    loadComments(1, true); // Refresh discussion feed
                } else {
                    showNotification('Error', data.message || 'Could not post comment.');
                }
            } catch (err) {
                console.error('Error submitting comment:', err);
                showNotification('Error', 'Network error. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Delegated actions for dynamic comments and replies
    const commentsList = $('commentsList');
    if (commentsList) {
        // Handle Reply Toggle and Cancel clicks
        commentsList.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.btn-reply-toggle');
            const cancelBtn = e.target.closest('.btn-reply-cancel');

            if (toggleBtn) {
                const commentId = toggleBtn.getAttribute('data-id');
                const formContainer = $(`replyForm-${commentId}`);
                if (formContainer) {
                    const isHidden = formContainer.style.display === 'none';
                    formContainer.style.display = isHidden ? 'block' : 'none';
                    if (isHidden) {
                        const txtInput = formContainer.querySelector('.reply-text-input');
                        if (txtInput) txtInput.focus();
                    }
                }
            }

            if (cancelBtn) {
                const commentId = cancelBtn.getAttribute('data-id');
                const formContainer = $(`replyForm-${commentId}`);
                if (formContainer) {
                    formContainer.style.display = 'none';
                    const form = formContainer.querySelector('form');
                    if (form) form.reset();
                }
            }
        });

        // Handle Reply character counts dynamically
        commentsList.addEventListener('input', (e) => {
            const txtInput = e.target.closest('.reply-text-input');
            if (txtInput) {
                const form = txtInput.closest('form');
                const counter = form.querySelector('.reply-char-counter');
                if (counter) {
                    counter.textContent = `${txtInput.value.length}/500`;
                }
            }
        });

        // Handle Reply form submissions dynamically
        commentsList.addEventListener('submit', async (e) => {
            const replyForm = e.target.closest('.reply-form');
            if (!replyForm) return;

            e.preventDefault();
            const id = getQueryId();
            if (!id) return;

            const parentId = replyForm.getAttribute('data-parent-id');
            const nameInput = replyForm.querySelector('.reply-name-input');
            const textInput = replyForm.querySelector('.reply-text-input');
            const submitBtn = replyForm.querySelector('.reply-submit-btn');

            const name = nameInput.value.trim();
            const text = textInput.value.trim();
            const originalText = submitBtn.innerHTML;

            if (!text) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting...';

            try {
                const res = await fetch(`/api/property/${id}/comment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, text, parentId })
                });
                const data = await res.json();

                if (data.success) {
                    replyForm.reset();
                    const formContainer = $(`replyForm-${parentId}`);
                    if (formContainer) formContainer.style.display = 'none';
                    showNotification('Reply Posted', 'Your reply has been added successfully.');
                    loadComments(1, true); // Refresh discussion feed
                } else {
                    showNotification('Error', data.message || 'Could not post reply.');
                }
            } catch (err) {
                console.error('Error submitting reply:', err);
                showNotification('Error', 'Network error. Please try again.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }

    // Comments load more trigger
    const btnLoadComments = $('btnLoadMoreComments');
    if (btnLoadComments) {
        btnLoadComments.addEventListener('click', () => {
            if (hasMoreComments) {
                currentCommentPage++;
                loadComments(currentCommentPage);
            }
        });
    }
});

// ── Init ──────────────────────────────────────────────
loadProperty();

// ── Report popup ─────────────────────────────────────
const reportPop = document.getElementById('reportPop');
if (reportPop) {
    reportPop.addEventListener('click', () => {
        const reportPopup = document.getElementById('reportPopup');
        if (reportPopup) reportPopup.classList.add('open');
    });
}

const reportPopupClose = document.getElementById('reportPopupClose');
if (reportPopupClose) {
    reportPopupClose.addEventListener('click', () => {
        const reportPopup = document.getElementById('reportPopup');
        if (reportPopup) reportPopup.classList.remove('open');
    });
}

const reportPopup = document.getElementById('reportPopup');
if (reportPopup) {
    reportPopup.addEventListener('click', e => {
        if (e.target === reportPopup) reportPopup.classList.remove('open');
    });
}

const reportForm = document.getElementById('reportForm');
if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = getQueryId();
        if (!id) return;

        const submitBtn = reportForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const payload = {
            reason: document.getElementById('reportReason').value,
            reporterName: document.getElementById('reportName').value,
            reporterEmail: document.getElementById('reportEmail').value,
            description: document.getElementById('reportDescription').value
        };

        try {
            const res = await fetch(`/api/properties/${id}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                showNotification('Success', data.message || 'Report submitted successfully.');
                reportForm.reset();
                if (reportPopup) reportPopup.classList.remove('open');
            } else {
                showNotification('Error', data.message || 'Could not submit report.');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            showNotification('Error', 'Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}