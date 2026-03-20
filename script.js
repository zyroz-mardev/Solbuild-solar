document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // LEAD POPUP
    // ============================================================
    const popup      = document.getElementById('leadPopup');
    const popupClose = document.getElementById('popupClose');

    if (!sessionStorage.getItem('popupSeen')) {
        setTimeout(() => popup.classList.add('show'), 2500);
    }

    function closePopup() {
        popup.classList.remove('show');
        sessionStorage.setItem('popupSeen', '1');
    }

    popupClose.addEventListener('click', closePopup);
    popup.addEventListener('click', e => { if (e.target === popup) closePopup(); });

    window.handlePopupSubmit = function(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        btn.textContent = 'You are on the list!';
        btn.style.background = 'linear-gradient(135deg, #2D7A3A, #1a5e24)';
        btn.disabled = true;
        setTimeout(closePopup, 1800);
    };

    // ============================================================
    // CANVAS — SMOOTH SCROLLYTELLING
    // ============================================================
    const canvas = document.getElementById('scrolly-canvas');
    const ctx    = canvas.getContext('2d');
    const navbar = document.getElementById('navbar');

    const FRAME_COUNT = 192;
    const frameSrc = i => `ezgif-frame-${String(i).padStart(3, '0')}.jpg`;

    const images      = new Array(FRAME_COUNT);
    let currentFrac   = 0;
    let targetFrac    = 0;
    let rafId         = null;
    let lastDrawnIdx  = -1;

    // Init canvas
    function resizeCanvas() {
        const viewH = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        canvas.width  = window.innerWidth;
        canvas.height = viewH;
        drawFrame(currentFrac, true);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', resizeCanvas);
    }

    // Draw a frame — cover fit
    function drawFrame(fraction, force) {
        const rawIdx = fraction * (FRAME_COUNT - 1);
        const index  = Math.min(FRAME_COUNT - 1, Math.max(0, Math.round(rawIdx)));

        if (!force && index === lastDrawnIdx) return;
        lastDrawnIdx = index;

        const img = images[index];
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (img && img.complete && img.naturalWidth > 0) {
            const cw = canvas.width, ch = canvas.height;
            const ir = img.naturalWidth / img.naturalHeight;
            const cr = cw / ch;
            let dw, dh, dx, dy;

            if (cr > ir) {
                dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2;
            } else {
                dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0;
            }
            ctx.drawImage(img, dx, dy, dw, dh);
        }
    }

    // Smooth lerp animation loop — always draws every frame (fixes mobile)
    function animLoop() {
        const diff = targetFrac - currentFrac;
        if (Math.abs(diff) > 0.0001) {
            currentFrac += diff * 0.12;
        }
        drawFrame(currentFrac, true);
        requestAnimationFrame(animLoop);
    }
    animLoop();

    // Preload images — priority: first 10 frames first, then rest
    function loadImages() {
        const priority = [];
        const rest     = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
            if (i < 10) priority.push(i);
            else rest.push(i);
        }

        [...priority, ...rest].forEach(i => {
            const img = new Image();
            img.src   = frameSrc(i + 1);
            images[i] = img;
            img.onload = () => {
                if (i === 0) drawFrame(0, true);
            };
        });
    }
    loadImages();

    // ============================================================
    // SCROLL SECTIONS
    // ============================================================
    const scrollTrack = document.querySelector('.scroll-track');

    const sections = Array.from(document.querySelectorAll('.scroll-section')).map(el => ({
        el,
        start: parseFloat(el.dataset.start),
        end:   parseFloat(el.dataset.end),
    }));

    function updateSections(fraction) {
        sections.forEach((sec, idx) => {
            const { start, end, el } = sec;
            let opacity = 0, ty = 20;

            if (fraction >= start && fraction <= end) {
                const len  = end - start;
                const prog = (fraction - start) / len;
                const fade = 0.16;

                if (prog < fade) {
                    opacity = prog / fade;
                    ty = 20 * (1 - opacity);
                } else if (prog > 1 - fade) {
                    opacity = (1 - prog) / fade;
                    ty = -14 * (1 - opacity);
                } else {
                    opacity = 1; ty = 0;
                }

                if (idx === 0 && prog < fade)                        { opacity = 1; ty = 0; }
                if (idx === sections.length - 1 && prog > 1 - fade) { opacity = 1; ty = 0; }
                opacity = Math.max(0, Math.min(1, opacity));
            }

            el.style.opacity       = opacity;
            el.style.transform     = `translateY(${ty}px)`;
            el.style.pointerEvents = opacity > 0.5 ? 'auto' : 'none';
        });
    }

    // ============================================================
    // SCROLL HANDLER
    // ============================================================
    function onScroll() {
        const rect        = scrollTrack.getBoundingClientRect();
        const viewH       = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        const trackHeight = scrollTrack.offsetHeight - viewH;
        const scrolled    = -rect.top;

        targetFrac = trackHeight > 0
            ? Math.max(0, Math.min(1, scrolled / trackHeight))
            : 0;

        updateSections(targetFrac);
        navbar.classList.toggle('visible', window.scrollY > 60);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // ============================================================
    // NAVBAR HAMBURGER
    // ============================================================
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
    document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
        link.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });

    // ============================================================
    // FAQ ACCORDION
    // ============================================================
    window.toggleFaq = function(btn) {
        const item   = btn.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    };

    // ============================================================
    // QUOTE FORM
    // ============================================================
    window.handleSubmit = function(e) {
        e.preventDefault();
        const btn      = e.target.querySelector('button[type="submit"]');
        const original = btn.textContent;
        btn.textContent = 'Submitted! We will call you shortly.';
        btn.style.background = 'linear-gradient(135deg, #2D7A3A, #1a5e24)';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent      = original;
            btn.style.background = '';
            btn.disabled         = false;
            e.target.reset();
        }, 4000);
    };

    // ============================================================
    // SMOOTH ANCHOR SCROLLING
    // ============================================================
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navH = navbar.offsetHeight || 70;
                const top  = target.getBoundingClientRect().top + window.scrollY - navH;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ============================================================
    // INTERSECTION OBSERVER — card animations
    // ============================================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity   = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.usp-card, .tech-card, .solution-card, .price-card, .faq-item')
        .forEach((el, i) => {
            el.style.opacity    = '0';
            el.style.transform  = 'translateY(22px)';
            el.style.transition = `opacity 0.55s ease ${i * 0.05}s, transform 0.55s ease ${i * 0.05}s`;
            observer.observe(el);
        });

});
