 // ---------------------------------------------------------------
    // RELIABLE PAWS RECOVERY SERVICES — single-page app script
    // ---------------------------------------------------------------
    const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61594947749033';

    // ---- view (page) switching ----
    const views = document.querySelectorAll('.page-view');
    const navTriggers = document.querySelectorAll('[data-view]');

    function showView(name, scrollTarget) {
      views.forEach(v => v.classList.toggle('active', v.id === `view-${name}`));

      document.querySelectorAll('.nav-links a[data-view], .mobile-nav a[data-view]').forEach(a => {
        a.classList.toggle('current', a.dataset.view === name);
      });

      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

      if (scrollTarget) {
        // wait a tick for the view to render, then smooth-scroll to the anchor
        requestAnimationFrame(() => {
          const el = document.getElementById(scrollTarget);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
      }

      try {
        history.replaceState(null, '', `#${name}${scrollTarget ? '/' + scrollTarget : ''}`);
      } catch (err) {
        // some sandboxed/embedded preview environments block history updates — safe to ignore
      }
    }

    navTriggers.forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        showView(el.dataset.view, el.dataset.scrollTo);
        mobileNav.classList.remove('open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // load initial view from hash, if present
    (function initRoute() {
      const hash = window.location.hash.replace('#', '');
      if (!hash) return;
      const [name, target] = hash.split('/');
      if (document.getElementById(`view-${name}`)) showView(name, target);
    })();

    // ---- mobile nav toggle ----
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    hamburgerBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      hamburgerBtn.setAttribute('aria-expanded', isOpen);
    });

    // ---- home board filters ----
    const chips = document.querySelectorAll('#chipRow .chip');
    function applyBoardFilter(filter) {
      document.querySelectorAll('#boardGrid .card').forEach(card => {
        const show = filter === 'all' || card.dataset.status === filter;
        card.style.display = show ? '' : 'none';
      });
    }
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyBoardFilter(chip.dataset.filter);
      });
    });

    // ---- live relative timestamps on the board ----
    function formatAgo(ms) {
      const mins = Math.floor(ms / 60000);
      if (mins < 1) return 'JUST NOW';
      if (mins < 60) return `${mins}M AGO`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}H AGO`;
      const days = Math.floor(hours / 24);
      return `${days}D AGO`;
    }
    function updateTimestamps() {
      document.querySelectorAll('#boardGrid .card[data-time]').forEach(card => {
        const elapsed = Date.now() - Number(card.dataset.time);
        const verb = card.dataset.event === 'closed' ? 'CLOSED' : 'FILED';
        const span = card.querySelector('.time-ago');
        if (span) span.textContent = `${verb} ${formatAgo(elapsed)}`;
      });
    }
    function seedTime(id, msAgo) {
      const card = document.getElementById(id);
      if (card) card.dataset.time = Date.now() - msAgo;
    }
    seedTime('card-0252', 40 * 60000);
    seedTime('card-0247', 5 * 3600000);
    seedTime('card-0241', 24 * 3600000);
    seedTime('card-0249', 8 * 60000);
    seedTime('card-0250', 3 * 60000);
    seedTime('card-0233', 24 * 3600000);
    seedTime('card-0254', 12 * 60000);
    seedTime('card-0198', 4 * 24 * 3600000);
    updateTimestamps();
    setInterval(updateTimestamps, 30000);

    // ---- report-a-lost-pet modal ----
    const modalBackdrop = document.getElementById('modalBackdrop');
    const openModalBtns = [document.getElementById('reportBtn'), document.getElementById('reportBtnHero'), document.getElementById('reportBtnFooter')];
    const closeModalBtn = document.getElementById('modalClose');
    const reportSubmitBtn = document.getElementById('modalSubmit');
    const boardGrid = document.getElementById('boardGrid');
    let caseCounter = 255;

    function openModal() {
      modalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal() {
      modalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
    openModalBtns.forEach(btn => btn && btn.addEventListener('click', openModal));
    closeModalBtn.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', (e) => { if (e.target === modalBackdrop) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    reportSubmitBtn.addEventListener('click', () => {
      const name = document.getElementById('petName').value.trim();
      const lastSeenLocation = document.getElementById('lastSeen').value.trim();
      const description = document.getElementById('petDesc').value.trim();

      if (!name || !lastSeenLocation) {
        alert("Please fill in at least the pet's name and last seen location.");
        return;
      }

      const caseNum = caseCounter++;
      const metaText = description ? `Last seen ${lastSeenLocation} — ${description}` : `Last seen ${lastSeenLocation}`;
      const cardId = `card-new-${caseNum}`;

      const cardHTML = `
    <article class="card" data-status="active" id="${cardId}" data-event="filed">
      <span class="pin"></span>
      <div class="card-photo"><svg class="icon"><use href="#icon-paw"/></svg></div>
      <span class="tag active">Active search</span>
      <h4>${name}</h4>
      <p class="meta">${metaText}</p>
      <p class="case">CASE #0${caseNum} · <span class="time-ago"></span></p>
    </article>
  `;
      boardGrid.insertAdjacentHTML('afterbegin', cardHTML);
      seedTime(cardId, 0);
      updateTimestamps();

      chips.forEach(c => c.classList.remove('active'));
      document.querySelector('#chipRow .chip[data-filter="all"]').classList.add('active');
      applyBoardFilter('all');

      document.getElementById('petName').value = '';
      document.getElementById('lastSeen').value = '';
      document.getElementById('petDesc').value = '';

      reportSubmitBtn.textContent = 'Case filed — redirecting to payment…';
      setTimeout(() => {
        closeModal();
        reportSubmitBtn.textContent = 'Continue';
        showView('pay');
      }, 600);
    });

    // ---- adopt page: species/size filters ----
    const petCards = document.querySelectorAll('#petGrid .pet-card');
    const speciesChips = document.querySelectorAll('#speciesChips .chip');
    const sizeChips = document.querySelectorAll('#sizeChips .chip');
    const noResults = document.getElementById('noResults');
    let activeSpecies = 'all';
    let activeSize = 'all';

    function applyAdoptFilters() {
      let visibleCount = 0;
      petCards.forEach(card => {
        const speciesMatch = activeSpecies === 'all' || card.dataset.species === activeSpecies;
        const sizeMatch = activeSize === 'all' || card.dataset.size === activeSize;
        const show = speciesMatch && sizeMatch;
        card.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });
      if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    speciesChips.forEach(chip => {
      chip.addEventListener('click', () => {
        speciesChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeSpecies = chip.dataset.species;
        applyAdoptFilters();
      });
    });
    sizeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        sizeChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activeSize = chip.dataset.size;
        applyAdoptFilters();
      });
    });

    // ---- adoption application modal (reused per pet card) ----
    const adoptModalBackdrop = document.getElementById('adoptModalBackdrop');
    const adoptModalClose = document.getElementById('adoptModalClose');
    const modalPetName = document.getElementById('modalPetName');
    const applyButtons = document.querySelectorAll('.apply-btn');
    const adoptSubmitBtn = document.getElementById('adoptModalSubmit');

    function openAdoptModal(petName) {
      modalPetName.textContent = petName;
      adoptModalBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeAdoptModal() {
      adoptModalBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
    applyButtons.forEach(btn => btn.addEventListener('click', () => openAdoptModal(btn.dataset.pet)));
    adoptModalClose.addEventListener('click', closeAdoptModal);
    adoptModalBackdrop.addEventListener('click', e => { if (e.target === adoptModalBackdrop) closeAdoptModal(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAdoptModal(); });
    adoptSubmitBtn.addEventListener('click', () => {
      adoptSubmitBtn.textContent = 'Opening Facebook…';
      setTimeout(() => {
        window.open(FACEBOOK_URL, '_blank', 'noopener');
        adoptSubmitBtn.textContent = 'Continue on Facebook →';
        closeAdoptModal();
      }, 500);
    });

    // ---- pay page ----
    const freqButtons = document.querySelectorAll('#freqToggle button');
    freqButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        freqButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // ---- every "contact us / pay / continue on Facebook" trigger opens the real page ----
    document.querySelectorAll('.contact-link, .floating-donate, #payFacebookBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const original = btn.textContent;
        btn.textContent = 'Opening Facebook…';
        setTimeout(() => {
          window.open(FACEBOOK_URL, '_blank', 'noopener');
          btn.textContent = original;
        }, 500);
      });
    });