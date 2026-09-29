document.addEventListener('DOMContentLoaded', () => {


    // ── Scroll animation ──────────────────────────────────
    const animObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('action'); });
    }, { threshold: 0.1 });

    document.querySelectorAll('.section, .section2').forEach(el => animObserver.observe(el));

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

    // ── Load verified agents ──────────────────────────────
    let agentPage       = 1;
    let agentLoading    = false;
    let agentTotalCount = 0;

    async function loadVerifiedAgents(page = 1) {
        if (agentLoading) return;
        agentLoading = true;

        const container   = document.getElementById('agents-container');
        const loadMoreBtn = document.getElementById('loadMoreAgentsBtn');
        if (!container) return;

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

                // shuffle within batch
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
                            : `<i class="fa-solid fa-user-tie" id="avatar"></i>`
                        }
                        <h3>${agent.name}</h3>
                        <p><i class="fa-solid fa-circle-check" style="color:#0d7068;"></i> ${agent.stand || 'Verified Agent'}</p>
                        <a href="/agent-profile?id=${agent.id}" class="agent-btn">View Profile</a>
                    `;
                    container.appendChild(card);
                    animObserver.observe(card); // animate newly added cards
                });

                if (loadMoreBtn) {
                    loadMoreBtn.style.display = (page * 8) < agentTotalCount ? 'block' : 'none';
                }
            } else if (page === 1) {
                container.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No verified agents available at the moment.</p>';
            }
        } catch (err) {
            console.error('Error loading agents:', err);
            if (page === 1) {
                container.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">Network error. Please refresh.</p>';
            }
        } finally {
            agentLoading = false;
        }
    }

    loadVerifiedAgents(1);

    const loadMoreBtn = document.getElementById('loadMoreAgentsBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            agentPage++;
            loadVerifiedAgents(agentPage);
        });
    }

    // scroll animation count
    // scroll animation count
    const initScrollCounters = () => {
        const counters = [
            { selector: '.anime-count1', target: 88, suffix: '%' },
            { selector: '.anime-count2', target: 98, suffix: '%' },
            { selector: '.anime-count3', target: 83, suffix: '%' }
        ];

        const animateCount = (el, target, suffix, duration = 2000) => {
            let startTime = null;
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

            const updateCount = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutCubic(progress);
                const currentValue = Math.floor(easedProgress * target);

                el.textContent = `${currentValue}${suffix}`;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    el.textContent = `${target}${suffix}`;
                }
            };

            requestAnimationFrame(updateCount);
        };

        // Reset all counters to 0% initially
        const counterData = [];
        counters.forEach(({ selector, target, suffix }) => {
            const el = document.querySelector(selector);
            if (el) {
                el.textContent = `0${suffix}`;
                counterData.push({ el, target, suffix });
            }
        });

        if (!counterData.length) return;

        // Use IntersectionObserver for high performance trigger on scroll
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const targetEl = entry.target;
                        const data = counterData.find(d => d.el === targetEl);
                        if (data) {
                            animateCount(targetEl, data.target, data.suffix, 2000); // 2 seconds duration
                        }
                        obs.unobserve(targetEl);
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            });

            counterData.forEach(data => observer.observe(data.el));
        } else {
            // Fallback: Animate immediately if IntersectionObserver is not supported
            counterData.forEach(data => {
                animateCount(data.el, data.target, data.suffix, 2000);
            });
        }
    };

    // Initialize the scroll counters
    initScrollCounters();

});
