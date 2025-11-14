document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.site-header');
    const revealItems = Array.from(document.querySelectorAll('.reveal'));
    const stepCards = Array.from(document.querySelectorAll('.step-card'));

    const handleHeaderState = () => {
        if (!header) return;
        header.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    handleHeaderState();
    window.addEventListener('scroll', handleHeaderState, { passive: true });

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (event) => {
            const targetId = link.getAttribute('href');
            if (!targetId || targetId === '#') return;

            const target = document.querySelector(targetId);
            if (!target) return;

            event.preventDefault();
            const headerHeight = header ? header.offsetHeight : 0;
            const y = target.getBoundingClientRect().top + window.scrollY - headerHeight - 24;

            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
        });
    });

    if (revealItems.length) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            revealItems.forEach(item => item.classList.add('is-visible'));
        } else {
            const revealObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                });
            }, {
                threshold: 0.2,
                rootMargin: '0px 0px -10% 0px'
            });

            revealItems.forEach(item => revealObserver.observe(item));
        }
    }

    if (stepCards.length) {
        const setStepState = (activeIndex) => {
            stepCards.forEach((card, index) => {
                card.classList.toggle('is-active', index === activeIndex);
                card.classList.toggle('is-complete', index < activeIndex);
            });
        };

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            setStepState(stepCards.length - 1);
            return;
        }

        let ticking = false;

        const updateActiveStep = () => {
            ticking = false;
            let activeIndex = 0;
            let smallestDistance = Number.POSITIVE_INFINITY;
            const targetY = window.innerHeight * 0.45;

            stepCards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                const cardCenter = rect.top + rect.height / 2;
                const distance = Math.abs(cardCenter - targetY);
                if (distance < smallestDistance) {
                    smallestDistance = distance;
                    activeIndex = index;
                }
            });

            setStepState(activeIndex);
        };

        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(updateActiveStep);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', updateActiveStep, { passive: true });
        updateActiveStep();
    }

    const tokenInfoGrid = document.querySelector('.token-info-grid');
    if (tokenInfoGrid) {
        const tokenInfoItems = Array.from(tokenInfoGrid.querySelectorAll('.token-info'));
        if (tokenInfoItems.length) {
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            if (prefersReducedMotion) {
                tokenInfoItems.forEach(item => item.classList.add('is-active'));
            } else {
                let hasTriggered = false;

                const playSequence = () => {
                    if (hasTriggered) return;
                    hasTriggered = true;
                    let index = 0;

                    const activateNext = () => {
                        if (index >= tokenInfoItems.length) return;
                        tokenInfoItems[index].classList.add('is-active');
                        index += 1;
                        if (index < tokenInfoItems.length) {
                            window.setTimeout(activateNext, 220);
                        }
                    };

                    activateNext();
                };

                const tokenObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) return;
                        playSequence();
                        observer.unobserve(entry.target);
                    });
                }, {
                    threshold: 0.45,
                    rootMargin: '0px 0px -10% 0px'
                });

                tokenObserver.observe(tokenInfoGrid);
            }
        }
    }
});
