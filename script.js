document.addEventListener('DOMContentLoaded', () => {
    // 1. Sidebar Tab Navigation Router
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    function navigateToSection(sectionId) {
        sections.forEach(sec => sec.classList.remove('active'));
        navItems.forEach(item => item.classList.remove('active'));

        const targetSection = document.getElementById(sectionId);
        const targetNavItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);

        if (targetSection) targetSection.classList.add('active');
        if (targetNavItem) targetNavItem.classList.add('active');
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.getAttribute('data-section');
            navigateToSection(sectionId);
            window.location.hash = sectionId;
        });
    });

    // Check hash on load
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        navigateToSection(hash);
    }

    // 2. Instant Search Filter
    const searchInput = document.getElementById('api-search');
    const apiCards = document.querySelectorAll('.api-card');

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        apiCards.forEach(card => {
            const methodName = card.querySelector('.api-method')?.textContent.toLowerCase() || '';
            const desc = card.querySelector('.api-desc')?.textContent.toLowerCase() || '';
            
            if (methodName.includes(query) || desc.includes(query)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        // Auto-switch to relevant category section if all matches are in it
        if (query.length > 2) {
            // Find sections containing visible cards
            sections.forEach(sec => {
                if (sec.id === 'overview' || sec.id === 'playground') return;
                const visibleCards = sec.querySelectorAll('.api-card[style="display: block;"]');
                if (visibleCards.length > 0 && !sec.classList.contains('active')) {
                    navigateToSection(sec.id);
                }
            });
        }
    });

});
