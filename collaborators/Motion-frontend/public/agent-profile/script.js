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

// ── DOM refs ──────────────────────────────────────────
const grid  = document.getElementById('profileGrid');
const empty = document.getElementById('profileEmpty');
const count = document.getElementById('listingCount');

// ── State ─────────────────────────────────────────────
const agentId = new URLSearchParams(window.location.search).get('id');
let currentPropertyPage = 1;
let isPropertyLoading   = false;

// ── Init ──────────────────────────────────────────────
if (!agentId) {
    showError('No agent ID provided.');
} else {
    loadProfile();
}

// ── Skeleton ──────────────────────────────────────────
function getSkeletonHTML() {
    return Array(4).fill(`
        <div class="skeleton-card temporary-skeleton">
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton skeleton-line" style="width:60%"></div>
                <div class="skeleton skeleton-line" style="width:40%"></div>
                <div class="skeleton skeleton-line" style="width:80%"></div>
            </div>
        </div>
    `).join('');
}

// Add this variable at the top of script.js with your other state variables
let hasMorePropertiesToScroll = true; 

async function loadProfile(isNewLoad = false) {
    if (isPropertyLoading) return;
    isPropertyLoading = true;

    if (isNewLoad) currentPropertyPage = 1;

    // Skeleton handling
    if (currentPropertyPage === 1) {
        grid.innerHTML = getSkeletonHTML();
        empty.style.display = 'none';
    } else {
        grid.insertAdjacentHTML('beforeend', `<div id="pagination-skeletons">${getSkeletonHTML()}</div>`);
    }

    try {
        const isFirstPage = currentPropertyPage === 1;

        // Fetch properties from the endpoint matching your route
        const postsRes = await fetch(`/api/get/postForPublicAgentProfile/${agentId}?page=${currentPropertyPage}`);
        const postsData = await postsRes.json();
        
        // Use the 'property' key from your backend response
        const posts = postsData.success ? (postsData.property || []) : [];

        // Fetch agent info only on first load
        if (isFirstPage) {
            const agentRes = await fetch(`/api/agent/public/${agentId}`);
            const agentData = await agentRes.json();
            if (agentData.success) {
                renderProfile(agentData.agent, postsData.totalPosts || 0, posts.reduce((sum, p) => sum + (p.view || 0), 0));
            }
        }

        // Remove skeletons
        document.getElementById('pagination-skeletons')?.remove();
        if (isFirstPage) grid.innerHTML = '';

        if (!posts.length && isFirstPage) {
            empty.style.display = 'block';
            count.textContent = '0';
        } else {
            posts.forEach(p => grid.insertAdjacentHTML('beforeend', listingCard(p)));
            count.textContent = grid.querySelectorAll('.listing-card').length;
        }

        // Update pagination state from backend response
        hasMorePropertiesToScroll = postsData.hasMore;
        if (hasMorePropertiesToScroll) {
            currentPropertyPage++;
        }
        
        triggerScrollAnim();

    } catch (e) {
        console.error('Failed to load profile:', e);
        document.getElementById('pagination-skeletons')?.remove();
    } finally {
        isPropertyLoading = false;
    }
}

// ── Optimized Scroll Listener ──────────────────────────
let scrollTimeout;
window.addEventListener('scroll', () => {
    // Clear previous timeout to ensure we don't trigger too often
    clearTimeout(scrollTimeout);
    
    scrollTimeout = setTimeout(() => {
        // Check if user is near bottom
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) {
            // Only load if not currently loading and there are more properties
            if (!isPropertyLoading && hasMorePropertiesToScroll) {
                loadProfile();
            }
        }
    }, 200); // Wait 200ms after scroll stops
});

// ── Render profile card ───────────────────────────────
function renderProfile(agent, listingCount, totalViews) {
    document.title = `${agent.name} – Easy Find`;

    const stand = (agent.stand || '').toLowerCase();
    const agentStand = stand === 'verified agent'
        ? `<i class="fa-solid fa-circle-check"></i> ${agent.stand}` : '';

    document.getElementById('agentName').textContent          = agent.name || 'Agent';
    document.getElementById('agent-stand').innerHTML          = agentStand;
    document.getElementById('statListings').textContent       = listingCount;
    document.getElementById('statViews').textContent          = totalViews.toLocaleString();

    if (agent.joinedAt) {
        document.getElementById('agentJoined').textContent =
            `Member since ${new Date(agent.joinedAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`;
    }

    if (agent.profilePicture) {
        document.getElementById('profileAvatar').innerHTML =
            `<img src="${agent.profilePicture}" alt="${agent.name}" style="cursor:zoom-in;"
                  onclick="openLightbox('${agent.profilePicture}')">`;
    }

    if (agent.bio) {
        document.getElementById('agentBio').textContent = agent.bio;
        document.getElementById('bioSection').style.display = 'block';
    }

    if (agent.phone) {
        const whatsappBtn = document.getElementById('whatsappBtn');
        const phone = agent.phone.replace(/\D/g, '');
        const formatted = phone.startsWith('0') ? '234' + phone.slice(1) : phone;
        const msg = encodeURIComponent(`Hi ${agent.name}, I found your profile on Easy Find and I'm interested in your properties.`);
        whatsappBtn.href = `https://wa.me/${formatted}?text=${msg}`;
        whatsappBtn.style.display = 'inline-flex';
    }
}

// ── Card template ─────────────────────────────────────
function listingCard(p) {
    const imgSrc   = p.imageNames?.length ? `/agent-loged/upload-property/${p.imageNames[0]}` : '/icon/home icon.png';
    const imgCount = p.imageNames ? p.imageNames.length : 0;
    const price    = Number(p.price).toLocaleString();
    const date     = new Date(p.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const isLand   = (p.type || '').toLowerCase() === 'land';
    const isVerified = (p.stand || '').toLowerCase() === 'verified agent';
    const isClosed   = p.isClosed === true; // <-- Check deal closed status

    return `
        <div class="listing-card" data-title="${p.title || ''}, ${p.type || 'Property'}"
             data-location="${p.location || 'N/A'}" data-price="${p.price || 0}"
             data-room="${p.beds || 0}, ${p.baths || 0}" style="${isClosed ? 'opacity: 0.95;' : ''}">
            <div class="card-image">
                <img src="${imgSrc}" alt="${p.type || 'Property'}" loading="lazy" onerror="this.src='/icon/home icon.png'" style="${isClosed ? 'filter: grayscale(80%) opacity(0.65);' : ''}">
                <span class="card-type-badge">${p.type || 'Property'}${p.title ? ', ' + p.title : ''}</span>
                ${p.category ? `<span class="card-category-badge ${p.category}">${p.category === 'shortlet' ? 'Short-let' : p.category === 'rent' ? 'For Rent' : 'For Sale'}</span>` : ''}
                ${isVerified ? `<span class="card-verified-badge"><i class="fa-solid fa-circle-check"></i></span>` : ''}
                ${isClosed ? `<span class="card-taken-badge">Property Taken</span>` : ''}
            </div>
            <div class="card-body">
                <div class="card-price" style="${isClosed ? 'color: #718096; text-decoration: line-through;' : ''}">₦${price}</div>
                <div class="card-location"><i class="fas fa-map-marker-alt"></i> ${p.location || 'N/A'}</div>
                <div class="card-stats">
                    ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bed"></i> ${p.beds || 0} Beds</span>`}
                    ${isLand ? '' : `<span class="card-stat"><i class="fas fa-bath"></i> ${p.baths || 0} Baths</span>`}
                    ${isLand ? `<span class="card-stat"><i class="fas fa-ruler-combined"></i> ${p.area || 0}</span>` : ''}
                </div>
                <div class="card-date"><i class="fas fa-calendar-alt"></i> Listed ${date} <i class="fas fa-eye"></i> ${p.view || 0}</div>
            </div>
            <div class="card-footer">
                <a href="/property?id=${p._id}" class="btn-view-details">View Details <i class="fas fa-arrow-right"></i></a>
                <button class="btn-share-card" onclick="shareCard('${p._id}')"><i class="fas fa-share-alt"></i></button>
            </div>
        </div>
    `;
}

// ── Share ─────────────────────────────────────────────
window.shareCard = function(id) {
    const url = `${window.location.origin}/property?id=${id}`;
    if (navigator.share) {
        navigator.share({ title: 'Check out this property on Easy Find', url }).catch(() => copyLink(url));
    } else {
        copyLink(url);
    }
};

function copyLink(url) {
    navigator.clipboard?.writeText(url)
        .then(() => alertBox.success('Copied', 'Link copied to clipboard'))
        .catch(() => {
            const el = document.createElement('textarea');
            el.value = url;
            el.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            alertBox.success('Copied', 'Link copied to clipboard');
        });
}

// ── Lightbox ──────────────────────────────────────────
function openLightbox(src) {
    const lb = document.getElementById('lightbox');
    if (!lb) return;
    document.getElementById('lightboxImg').src = src;
    lb.classList.add('open');
}

function closeLightbox() {
    document.getElementById('lightbox')?.classList.remove('open');
}

// ── Scroll animation ──────────────────────────────────
function triggerScrollAnim() {
    const sections = document.querySelectorAll('.section');
    const check = () => sections.forEach(s => {
        if (s.getBoundingClientRect().top < window.innerHeight - 60) s.classList.add('action');
    });
    window.addEventListener('scroll', check);
    check();
}

// ── Error ─────────────────────────────────────────────
function showError(msg) {
    document.querySelector('main').innerHTML = `
        <div style="text-align:center;padding:80px 20px;color:#555;">
            <i class="fa-solid fa-circle-exclamation" style="font-size:3rem;color:#0d7068;margin-bottom:16px;display:block;"></i>
            <p style="font-size:1.1rem;">${msg}</p>
            <a href="/" style="display:inline-block;margin-top:20px;padding:10px 24px;background:#0d7068;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Go Home</a>
        </div>`;
}
