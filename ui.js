/* Click n Browse - UI interactions (non-3D) */
(function () {
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const inr = n => '₹' + Math.round(n).toLocaleString('en-IN');
  const root = document.documentElement;
  const COLORS = { buy: '#3D6BFF', repair: '#2EE6A8', sell: '#FF6A1F' };

  window.CNB = { value: 0, shown: 0, model: 'iPhone 13', cond: 'Like new', life: 'buy' };

  /* ---------- loader + hero intro ---------- */
  let introDone = false;
  window.CNB.finishLoad = function () {
    if (introDone) return; introDone = true;
    $('#loader').classList.add('done');
    const tl = gsap.timeline({ delay: .15 });
    tl.fromTo('.hero-title .w', { yPercent: 115 }, { yPercent: 0, duration: .8, stagger: .12, ease: 'back.out(1.5)' })
      .fromTo('.hero-title .dot', { scale: 0 }, { scale: 1, duration: .45, stagger: .12, ease: 'back.out(3)' }, '-=.55')
      .to('.hero [data-r]', { opacity: 1, y: 0, duration: .6, stagger: .08, ease: 'back.out(1.4)' }, '-=.4');
  };
  setTimeout(() => window.CNB.finishLoad(), 3500);

  /* ---------- reveal on scroll (snappy "click" ease) ---------- */
  gsap.set('[data-r]', { opacity: 0, y: 36 });
  ScrollTrigger.batch('main section:not(.hero) [data-r]', {
    start: 'top 88%',
    onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: .7, stagger: .08, ease: 'back.out(1.4)', overwrite: true })
  });

  /* ---------- accent colour + life indicator follow the story ---------- */
  const lives = $('.lives');
  function setLife(life) {
    const key = COLORS[life] ? life : 'buy';
    root.style.setProperty('--accent', COLORS[key]);
    root.style.setProperty('--on-accent', key === 'repair' ? '#04110c' : '#fff');
    window.CNB.life = key;
    $$('.lives li').forEach(li => li.classList.toggle('on', li.dataset.life === life));
  }
  $$('[data-life]').forEach(sec => {
    if (sec.tagName !== 'SECTION') return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 55%',
      onToggle: s => { if (s.isActive) setLife(sec.dataset.life === 'loop' ? 'sell' : sec.dataset.life); }
    });
  });
  ScrollTrigger.create({
    trigger: '#buy', start: 'top 60%', endTrigger: '#sell', end: 'bottom 60%',
    onUpdate: s => { $('#livesFill').style.height = (s.progress * 100) + '%'; },
    onToggle: s => lives.classList.toggle('show', s.isActive)
  });

  /* ---------- click ripple: the brand is a click ---------- */
  addEventListener('pointerdown', e => {
    const r = document.createElement('span');
    r.className = 'ripple'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
    document.body.appendChild(r); setTimeout(() => r.remove(), 650);
  }, { passive: true });

  /* ---------- EMI ---------- */
  const emiPrice = $('#emiPrice'); let months = 12;
  function emi() {
    const p = +emiPrice.value;
    $('#emiPriceLabel').textContent = inr(p);
    $('#emiOut').textContent = inr(p / months) + ' / month';
  }
  emiPrice.addEventListener('input', emi);
  $$('#emiMonths button').forEach(b => b.addEventListener('click', () => {
    $$('#emiMonths button').forEach(x => x.classList.remove('on')); b.classList.add('on');
    months = +b.dataset.m; emi();
  }));
  emi();

  /* ---------- generic chip groups ---------- */
  function chipGroup(el, cb) {
    $$('button', el).forEach(b => b.addEventListener('click', () => {
      $$('button', el).forEach(x => x.classList.remove('on')); b.classList.add('on');
      gsap.fromTo(b, { scale: .9 }, { scale: 1, duration: .4, ease: 'back.out(3)' });
      cb && cb(b);
    }));
  }

  /* ---------- repair booking ---------- */
  const price = { Mobile: 1499, Laptop: 2499, TV: 1999, AC: 1299, Fridge: 1199 };
  function book() {
    const g = n => $(`[data-group="${n}"] .on`).textContent;
    $('#bookSum').textContent = `${g('device')} / ${g('issue')} / ${g('slot')}`;
    $('#bookEst').textContent = 'from ' + inr(price[g('device')] || 999);
  }
  $$('.book .chips').forEach(c => chipGroup(c, book));

  /* ---------- repair tracking steps follow the scroll ---------- */
  const steps = $$('#steps li');
  ScrollTrigger.create({
    trigger: '#repair', start: 'top 40%', end: 'bottom 70%',
    onUpdate: s => { const n = Math.floor(s.progress * (steps.length + 1)); steps.forEach((li, i) => li.classList.toggle('done', i < n)); }
  });

  /* ---------- sell valuation (also drives the 3D phone screen) ---------- */
  const vOut = $('#vOut');
  function valuate(scan = true) {
    const m = $('#vModel .on'), c = $('#vCond .on');
    let v = +m.dataset.b * +c.dataset.f;
    if (!$('#vBox').checked) v *= .97;
    if (!$('#vChg').checked) v *= .98;
    if ($('#vBill').checked) v *= 1.03;
    v = Math.round(v / 100) * 100;
    window.CNB.value = v; window.CNB.model = m.textContent; window.CNB.cond = c.textContent;
    gsap.to(window.CNB, { shown: v, duration: .9, ease: 'power3.out', onUpdate: () => { vOut.textContent = inr(window.CNB.shown); } });
    if (scan) { const o = vOut.parentElement; o.classList.remove('scan'); void o.offsetWidth; o.classList.add('scan'); }
  }
  chipGroup($('#vModel'), () => valuate());
  chipGroup($('#vCond'), () => valuate());
  $$('.toggles input').forEach(i => i.addEventListener('change', () => valuate()));
  ScrollTrigger.create({ trigger: '.value', start: 'top 80%', once: true, onEnter: () => valuate() });

  /* ---------- Plus card: tilt + flip ---------- */
  const card = $('#plusCard'); let flipped = false;
  function setCard(rx = 0, ry = 0) {
    card.style.transform = `rotateX(${rx}deg) rotateY(${(flipped ? 180 : 0) + ry}deg)`;
  }
  card.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    card.style.transition = 'transform .15s';
    setCard(-y * 14, x * 18);
    card.style.setProperty('--shine', (x * 160) + '%');
  });
  card.addEventListener('pointerleave', () => { card.style.transition = ''; setCard(); });
  const flip = () => { flipped = !flipped; card.style.transition = ''; setCard(); };
  card.addEventListener('click', flip);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });

  /* ---------- coins drop into the jar ---------- */
  ScrollTrigger.create({
    trigger: '.coins', start: 'top 80%', once: true, onEnter: () => {
      const jar = $('#jar');
      for (let i = 0; i < 16; i++) {
        const c = document.createElement('span'); c.className = 'coin';
        const row = Math.floor(i / 3), col = i % 3;
        c.style.left = (8 + col * 26 + (row % 2) * 10) + 'px';
        jar.appendChild(c);
        gsap.fromTo(c, { y: -160, rotation: gsap.utils.random(-90, 90) },
          { y: 90 - row * 18, rotation: 0, duration: .7, delay: i * .09, ease: 'bounce.out' });
      }
      const o = { n: 0 };
      gsap.to(o, { n: 1240, duration: 1.8, ease: 'power2.out', onUpdate: () => { $('#coinsN').textContent = Math.round(o.n).toLocaleString('en-IN'); } });
    }
  });

  /* ---------- countdown to Sunday midnight ---------- */
  function tick() {
    const now = new Date(), end = new Date(now);
    end.setDate(now.getDate() + ((7 - now.getDay()) % 7)); end.setHours(23, 59, 59, 0);
    let s = Math.max(0, (end - now) / 1000 | 0);
    const d = s / 86400 | 0; s %= 86400; const h = s / 3600 | 0; s %= 3600; const m = s / 60 | 0; s %= 60;
    const p = n => String(n).padStart(2, '0');
    $('#countdown').textContent = `${p(d)}d : ${p(h)}h : ${p(m)}m : ${p(s)}s`;
  }
  tick(); setInterval(tick, 1000);

  /* ---------- admin dashboard ---------- */
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], vals = [42, 55, 48, 63, 71, 96, 84];
  const G = $('#barsG'), NS = 'http://www.w3.org/2000/svg';
  vals.forEach((v, i) => {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', 8 + i * 39); r.setAttribute('width', 26); r.setAttribute('rx', 5);
    r.setAttribute('y', 96); r.setAttribute('height', 0); r.dataset.v = v; if (v === 96) r.classList.add('hi');
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', 21 + i * 39); t.setAttribute('y', 108); t.setAttribute('text-anchor', 'middle'); t.textContent = days[i];
    G.appendChild(r); G.appendChild(t);
  });
  ScrollTrigger.create({
    trigger: '.dash', start: 'top 80%', once: true, onEnter: () => {
      $$('rect', G).forEach((r, i) => {
        const h = +r.dataset.v * .9;
        gsap.to(r, { attr: { y: 96 - h, height: h }, duration: .8, delay: i * .06, ease: 'back.out(1.6)' });
      });
      $$('[data-count]').forEach(el => {
        const o = { n: 0 }, pre = el.dataset.pre ? '₹' : '';
        gsap.to(o, { n: +el.dataset.count, duration: 1.6, ease: 'power2.out', onUpdate: () => { el.textContent = pre + Math.round(o.n).toLocaleString('en-IN'); } });
      });
    }
  });

  /* pause videos off-screen to save battery */
  $$('video').forEach(v => {
    ScrollTrigger.create({ trigger: v, start: 'top bottom', end: 'bottom top', onToggle: s => { s.isActive ? v.play().catch(() => {}) : v.pause(); } });
  });
})();
