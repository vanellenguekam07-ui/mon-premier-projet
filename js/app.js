/* ═══════════════════════════════════════════
   LV SURPRISE EVENT — Application Pro
   Client : catalogue, devis, réservation, suivi
   Admin  : dashboard, commandes, finances, prestataires, tarifs, équipe
   ═══════════════════════════════════════════ */
'use strict';

/* ─────────── OUTILS ─────────── */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n) => Number(n || 0).toLocaleString('fr-FR').replace(/,/g, ' ') + ' FCFA';
const fmtShort = (n) => {
    n = Number(n || 0);
    if (Math.abs(n) >= 1000000) return (n / 1000000).toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' M';
    if (Math.abs(n) >= 1000) return (n / 1000).toLocaleString('fr-FR', {maximumFractionDigits: 1}) + ' k';
    return String(n);
};
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso.length <= 10 ? iso + 'T12:00:00' : iso);
    return d.toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
};
function toast(msg, type = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = (type === 'success' ? '✅ ' : type === 'error' ? '⛔ ' : 'ℹ️ ') + esc(msg);
    $('toast-wrap').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3200);
}
const store = {
    get(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch { return fb; } },
    set(k, v) { localStorage.setItem(k, JSON.stringify(v)); },
    del(k) { localStorage.removeItem(k); }
};

/* ─────────── CATALOGUE PAR DÉFAUT ─────────── */
const DEFAULT_GATEAUX = [
    {id: 'g1', name: 'Vanille-Fraise Royale', price: 25000, img: 'images/gateau-vanille.jpg', badge: 'Best-seller',
     desc: 'Génoise vanille bourbon, crème légère et fraises fraîches, finition dorée.',
     includes: '8–10 parts · Message personnalisé offert · Parfum au choix'},
    {id: 'g2', name: 'Chocolat Prestige', price: 30000, img: 'images/gateau-chocolat.jpg', badge: '',
     desc: 'Triple couche chocolat belge, ganache brillante, truffes et éclats de feuille d\'or.',
     includes: '10–12 parts · Message offert · Option cœur coulant'},
    {id: 'g3', name: 'Red Velvet Célébration', price: 35000, img: 'images/gateau-redvelvet.jpg', badge: 'Populaire', rose: true,
     desc: 'Le préféré des anniversaires : moelleux red velvet, cream cheese, framboises.',
     includes: '12–15 parts · Topper « Happy Birthday » doré offert'},
    {id: 'g4', name: 'Pièce Montée Prestige', price: 80000, img: 'images/gateau-mariage.jpg', badge: 'Mariage & baptême',
     desc: 'Pièce montée 3 étages pour vos grands événements : mariage, baptême, 50 ans.',
     includes: '30+ parts · Fleurs en sucre · Essayage & maquette offerts'}
];
const DEFAULT_PRESTATIONS = [
    {id: 'deco', name: 'Décoration de chambre', price: 35000, img: 'images/decoration.jpg', badge: 'Top vente',
     desc: 'Chambre transformée en cocon romantique : pétales, ballons, lumières.',
     includes: 'Ballons hélium · Pétales de roses · Guirlandes LED · Installation incluse'},
    {id: 'photo', name: 'Espace photo personnalisé', price: 40000, img: 'images/espace-photo.jpg', badge: '',
     desc: 'Un décor photo aux couleurs de la star du jour, prénom géant et accessoires.',
     includes: 'Arche de ballons · Rideau sequins · Néon prénom · Accessoires fun'},
    {id: 'bouquet', name: 'Bouquet d\'argent', price: 15000, img: 'images/bouquet-argent.jpg', badge: 'Original', rose: true,
     desc: 'Billets pliés en fleurs, présentation luxe. Le cadeau qui fait sensation.',
     includes: 'Confection + emballage premium · Montant des billets en supplément'},
    {id: 'panier', name: 'Panier surprise gourmand', price: 20000, img: 'images/panier.jpg', badge: '',
     desc: 'Chocolats, douceurs, bougie et petite peluche dans un panier habillé d\'or.',
     includes: 'Assortiment premium · Carte message · Livraison offerte'},
    {id: 'musique', name: 'Musiciens en direct', price: 50000, img: 'images/musique.jpg', badge: 'Live',
     desc: 'Saxophoniste, guitariste ou duo pour une arrivée surprise en musique.',
     includes: '1h de live · Sonorisation · Playlist dédicacée'}
];
const DEFAULT_ADMINS = [
    {username: 'vanelle', password: 'vanelle2026', role: 'super', name: 'Vanelle L.', title: 'Fondatrice'},
    {username: 'assistant', password: 'assistant2026', role: 'manager', name: 'Boris M.', title: 'Manager événementiel'}
];
const DEFAULT_SETTINGS = {acompte: 30, remise: 10, musicCost: 30000};

/* ─────────── ACCÈS DONNÉES ─────────── */
const getPrices = () => store.get('lv_prices', {});
const getSettings = () => ({...DEFAULT_SETTINGS, ...store.get('lv_settings', {})});
function gateaux() {
    const ov = getPrices();
    return DEFAULT_GATEAUX.map(g => ({...g, price: ov['gateau:' + g.id] ?? g.price}));
}
function prestations() {
    const ov = getPrices();
    return DEFAULT_PRESTATIONS.map(p => ({...p, price: ov['presta:' + p.id] ?? p.price}));
}
const findItem = (kind, id) => (kind === 'gateau' ? gateaux() : prestations()).find(x => x.id === id);
const getOrders = () => store.get('lv_orders', []);
const saveOrders = (o) => store.set('lv_orders', o);
const getTx = () => store.get('lv_tx', []);
const saveTx = (t) => store.set('lv_tx', t);
const getAdmins = () => { const a = store.get('lv_admins', null); return a || JSON.parse(JSON.stringify(DEFAULT_ADMINS)); };
const saveAdmins = (a) => store.set('lv_admins', a);
const getProviders = () => store.get('lv_providers', []);
const saveProviders = (p) => store.set('lv_providers', p);
const currentAdmin = () => {
    const s = store.get('lv_session', null);
    if (!s) return null;
    return getAdmins().find(a => a.username === s.username) || null;
};
const isSuper = () => currentAdmin()?.role === 'super';

/* ─────────── NAVIGATION CLIENT ─────────── */
function showView(name) {
    document.querySelectorAll('#client-app .view').forEach(v => v.classList.add('hidden'));
    $('view-' + name).classList.remove('hidden');
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
    $('main-nav').classList.remove('open');
    if (name === 'booking') renderCart();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

/* ─────────── RENDU CATALOGUE ─────────── */
function productCard(item, kind) {
    const inCart = getCart().some(c => c.kind === kind && c.id === item.id);
    return `
    <div class="product-card">
        <div class="thumb" style="background-image:url('${item.img}')">${item.badge ? `<span class="badge-float${item.rose ? ' rose' : ''}">${esc(item.badge)}</span>` : ''}</div>
        <div class="body">
            <h3>${esc(item.name)}</h3>
            <p class="desc">${esc(item.desc)}</p>
            <div class="includes">✔ ${esc(item.includes)}</div>
            <div class="foot">
                <div class="price">${fmt(item.price)}<small>Tarif tout inclus</small></div>
                <button class="btn ${inCart ? 'btn-outline' : 'btn-primary'} btn-sm" onclick="toggleCart('${kind}','${item.id}')">${inCart ? '✓ Ajouté' : '+ Ajouter'}</button>
            </div>
        </div>
    </div>`;
}
function renderCatalogs() {
    $('cakes-grid').innerHTML = gateaux().map(g => productCard(g, 'gateau')).join('');
    $('services-grid').innerHTML = prestations().map(p => productCard(p, 'prestation')).join('');
    const cats = [
        {img: 'images/gateau-redvelvet.jpg', name: 'Nos Gâteaux', desc: '4 créations artisanales personnalisables, dès ' + fmt(Math.min(...gateaux().map(g => g.price))), go: 'gateaux'},
        {img: 'images/decoration.jpg', name: 'Décoration & Espace photo', desc: 'Chambres romantiques et décors photo dès ' + fmt(35000), go: 'prestations'},
        {img: 'images/bouquet-argent.jpg', name: 'Cadeaux surprises', desc: 'Bouquets d\'argent & paniers gourmands', go: 'prestations'},
        {img: 'images/musique.jpg', name: 'Animation musicale', desc: 'Musiciens en direct pour le jour J', go: 'prestations'}
    ];
    $('home-categories').innerHTML = cats.map(c => `
        <div class="category-card" onclick="showView('${c.go}')">
            <div class="thumb" style="background-image:url('${c.img}')"><span class="price-tag">Voir les tarifs →</span></div>
            <div class="body"><h3>${c.name}</h3><p>${c.desc}</p><span class="link">Découvrir →</span></div>
        </div>`).join('');
    const s = getSettings();
    $('pack-price').textContent = fmt(Math.round((findItem('prestation', 'deco').price + findItem('gateau', 'g1').price + findItem('prestation', 'bouquet').price) * (1 - s.remise / 100)));
    $('stat-orders').textContent = (240 + getOrders().filter(o => o.status !== 'Annulée').length) + '+';
}

/* ─────────── PANIER / DEVIS ─────────── */
const getCart = () => store.get('lv_cart', []);
const saveCart = (c) => { store.set('lv_cart', c); updateCartBadge(); };
function updateCartBadge() {
    $('cart-count').textContent = getCart().reduce((n, c) => n + c.qty, 0);
}
function toggleCart(kind, id) {
    let cart = getCart();
    if (cart.some(c => c.kind === kind && c.id === id)) {
        cart = cart.filter(c => !(c.kind === kind && c.id === id));
        toast('Retiré du devis');
    } else {
        const item = findItem(kind, id);
        cart.push({kind, id, name: item.name, price: item.price, img: item.img, qty: 1});
        toast(item.name + ' ajouté au devis ✓', 'success');
    }
    saveCart(cart);
    renderCatalogs();
    if (!$('view-booking').classList.contains('hidden')) renderCart();
}
function addPackRomance() {
    const s = getSettings();
    const pack = [
        {kind: 'prestation', id: 'deco'},
        {kind: 'gateau', id: 'g1'},
        {kind: 'prestation', id: 'bouquet'}
    ];
    let cart = getCart();
    pack.forEach(p => {
        if (!cart.some(c => c.kind === p.kind && c.id === p.id)) {
            const item = findItem(p.kind, p.id);
            cart.push({kind: p.kind, id: p.id, name: item.name, price: item.price, img: item.img, qty: 1});
        }
    });
    saveCart(cart); renderCatalogs();
    toast(`Pack Romance ajouté — remise ${s.remise}% appliquée 💘`, 'success');
    showView('booking');
}
function cartQty(kind, id, d) {
    let cart = getCart();
    const line = cart.find(c => c.kind === kind && c.id === id);
    if (!line) return;
    line.qty += d;
    if (line.qty <= 0) cart = cart.filter(c => c !== line);
    saveCart(cart); renderCart(); renderCatalogs();
}
function cartRemove(kind, id) {
    saveCart(getCart().filter(c => !(c.kind === kind && c.id === id)));
    renderCart(); renderCatalogs();
}
function cartTotals() {
    const cart = getCart();
    const s = getSettings();
    const subtotal = cart.reduce((t, c) => t + c.price * c.qty, 0);
    const hasDeco = cart.some(c => c.id === 'deco');
    const hasGateau = cart.some(c => c.kind === 'gateau');
    const discount = (hasDeco && hasGateau) ? Math.round(subtotal * s.remise / 100) : 0;
    const total = subtotal - discount;
    const acompte = Math.round(total * s.acompte / 100);
    return {subtotal, discount, total, acompte, solde: total - acompte};
}
function renderCart() {
    const cart = getCart();
    const box = $('cart-items');
    if (!cart.length) {
        box.innerHTML = `<div class="cart-empty">🧾 Votre devis est vide.<br>Ajoutez un gâteau ou des prestations depuis le catalogue.</div>`;
    } else {
        box.innerHTML = cart.map(c => `
            <div class="cart-item">
                <img src="${c.img}" alt="${esc(c.name)}">
                <div class="info"><strong>${esc(c.name)}</strong><small>${c.kind === 'gateau' ? '🎂 Gâteau' : '✨ Prestation'} · ${fmt(c.price)}</small></div>
                <div class="qty"><button onclick="cartQty('${c.kind}','${c.id}',-1)">−</button><strong>${c.qty}</strong><button onclick="cartQty('${c.kind}','${c.id}',1)">+</button></div>
                <button class="rm" onclick="cartRemove('${c.kind}','${c.id}')" title="Retirer">🗑</button>
            </div>`).join('');
    }
    $('booking-summary').innerHTML = cart.length
        ? cart.map(c => `<div class="srow"><span>${esc(c.name)} ×${c.qty}</span><strong>${fmt(c.price * c.qty)}</strong></div>`).join('')
        : '<span class="muted">Aucune sélection pour le moment.</span>';
    const t = cartTotals();
    $('summary-subtotal').textContent = fmt(t.subtotal);
    $('summary-discount-row').classList.toggle('hidden', !t.discount);
    $('summary-discount').textContent = '−' + fmt(t.discount);
    $('summary-total').textContent = fmt(t.total);
    $('summary-acompte').textContent = fmt(t.acompte);
    $('summary-solde').textContent = fmt(t.solde);
}

/* ─────────── COMMANDE ─────────── */
function genRef() {
    const year = new Date().getFullYear();
    let ref;
    do { ref = `LV-${year}-${Math.floor(1000 + Math.random() * 9000)}`; }
    while (getOrders().some(o => o.ref === ref));
    return ref;
}
function submitOrder(e) {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) { toast('Ajoutez au moins une prestation à votre devis', 'error'); return false; }
    const t = cartTotals();
    const s = getSettings();
    const order = {
        id: Date.now(),
        ref: genRef(),
        client: $('client_name').value.trim(),
        phone: $('client_phone').value.trim(),
        location: $('location').value.trim(),
        date: $('date').value,
        time: $('time').value,
        recipient: $('recipient').value.trim(),
        message: $('message').value.trim(),
        items: cart.map(c => ({kind: c.kind, id: c.id, name: c.name, price: c.price, qty: c.qty})),
        subtotal: t.subtotal, discount: t.discount, total: t.total,
        acompte: t.acompte, solde: t.solde,
        payStatus: 'Non payé', status: 'En attente',
        hasMusic: cart.some(c => c.id === 'musique'),
        musicianPaid: false, musicianCost: s.musicCost,
        createdAt: new Date().toISOString()
    };
    const orders = getOrders(); orders.push(order); saveOrders(orders);
    saveCart([]); renderCart(); renderCatalogs();
    $('surprise-form').reset();
    $('order-confirmation').classList.remove('hidden');
    $('order-confirmation').innerHTML = `
        <div class="confirm-box">
            <div class="big">🎉</div>
            <h3>Réservation reçue, ${esc(order.client.split(' ')[0])} !</h3>
            <p>Notre équipe vous recontactera très vite pour valider les détails et l'acompte de <strong>${fmt(order.acompte)}</strong>.</p>
            <div class="confirm-ref">${order.ref}</div>
            <p class="muted">Conservez cette référence pour suivre votre commande.<br>Total estimé : <strong>${fmt(order.total)}</strong> · Événement le ${fmtDate(order.date)} à ${esc(order.time)}</p>
            <div class="modal-actions" style="justify-content:center">
                <button class="btn btn-primary" onclick="showView('tracking');$('tracking-input').value='${order.ref}';trackOrder()">Suivre ma commande →</button>
                <button class="btn btn-outline" onclick="$('order-confirmation').classList.add('hidden')">Fermer</button>
            </div>
        </div>`;
    $('order-confirmation').scrollIntoView({behavior: 'smooth'});
    toast('Commande ' + order.ref + ' enregistrée 🎉', 'success');
    return false;
}

/* ─────────── SUIVI CLIENT ─────────── */
function statusBadge(st) {
    const map = {'En attente': 'badge-wait', 'Confirmée': 'badge-info', 'Livrée': 'badge-ok', 'Annulée': 'badge-cancel'};
    return `<span class="badge ${map[st] || 'badge-none'}">${esc(st)}</span>`;
}
function payBadge(p) {
    const map = {'Non payé': 'badge-none', 'Acompte versé': 'badge-wait', 'Soldé': 'badge-paid'};
    return `<span class="badge ${map[p] || 'badge-none'}">${esc(p)}</span>`;
}
function trackOrder() {
    const q = $('tracking-input').value.trim().toLowerCase().replace(/\s/g, '');
    const box = $('tracking-result');
    if (!q) { box.innerHTML = ''; return; }
    const order = getOrders().find(o =>
        o.ref.toLowerCase().replace(/\s/g, '') === q ||
        o.phone.replace(/[\s.]/g, '').endsWith(q.replace(/[\s.]/g, '')) && q.length >= 6);
    if (!order) {
        box.innerHTML = `<div class="alert warn">🔍 Aucune commande trouvée avec « ${esc($('tracking-input').value)} ». Vérifiez la référence ou contactez-nous.</div>`;
        return;
    }
    const steps = ['En attente', 'Confirmée', 'Livrée'];
    const idx = order.status === 'Annulée' ? -1 : steps.indexOf(order.status);
    box.innerHTML = `
        <div class="panel-head" style="margin-top:10px"><h3>Commande ${order.ref}</h3><div>${statusBadge(order.status)} ${payBadge(order.payStatus)}</div></div>
        <div class="order-detail-grid">
            <div class="od"><small>Client</small>${esc(order.client)} · ${esc(order.phone)}</div>
            <div class="od"><small>Bénéficiaire</small>${esc(order.recipient)}</div>
            <div class="od"><small>Lieu</small>${esc(order.location)}</div>
            <div class="od"><small>Date</small>${fmtDate(order.date)} à ${esc(order.time || '—')}</div>
        </div>
        <div class="timeline">
            ${steps.map((s, i) => `
                <div class="tstep ${i < idx || (i === idx && i === 2) ? 'done' : i === idx ? 'now' : ''}">
                    <div class="dot">${i < idx || (i === idx && i === 2) ? '✓' : i + 1}</div>
                    <div><h4>${['Réservation reçue', 'Surprise confirmée', 'Jour J — surprise livrée'][i]}</h4>
                    <p>${['Nous préparons votre devis', 'Acompte validé, équipe mobilisée', 'Profitez du moment 🎉'][i]}</p></div>
                </div>`).join('')}
        </div>
        ${order.status === 'Annulée' ? '<div class="alert warn">Cette commande a été annulée. Contactez-nous pour la réactiver.</div>' : ''}
        <div class="srow" style="display:flex;justify-content:space-between;border-top:1.5px dashed var(--line);padding-top:12px">
            <span>${order.items.map(it => esc(it.name) + ' ×' + it.qty).join(' · ')}</span><strong>${fmt(order.total)}</strong>
        </div>
        <p class="muted" style="margin-top:10px">Acompte (${fmt(order.acompte)}) · Solde restant : <strong>${order.payStatus === 'Soldé' ? fmt(0) : order.payStatus === 'Acompte versé' ? fmt(order.solde) : fmt(order.total)}</strong></p>`;
}

/* ═══════════ ADMIN : AUTH ═══════════ */
function openLogin() {
    if (currentAdmin()) { enterAdmin(); return; }
    $('login-modal').classList.remove('hidden');
    $('login-error').classList.add('hidden');
    setTimeout(() => $('login-user').focus(), 100);
}
function closeLogin() { $('login-modal').classList.add('hidden'); }
function doLogin(e) {
    e.preventDefault();
    const u = $('login-user').value.trim().toLowerCase();
    const p = $('login-pass').value;
    const admin = getAdmins().find(a => a.username.toLowerCase() === u && a.password === p);
    if (!admin) { $('login-error').classList.remove('hidden'); return false; }
    store.set('lv_session', {username: admin.username, at: Date.now()});
    closeLogin(); enterAdmin();
    toast(`Bienvenue ${admin.name} 👑`, 'success');
    return false;
}
function logout() {
    store.del('lv_session');
    exitAdmin();
    toast('Déconnecté. À bientôt !');
}
function enterAdmin() {
    $('client-app').classList.add('hidden');
    $('site-header').classList.add('hidden');
    $('site-footer').classList.add('hidden');
    const promo = $('promo-bar');
    if (promo) promo.classList.add('hidden');
    $('admin-app').classList.remove('hidden');
    const a = currentAdmin();
    $('admin-name').textContent = a.name;
    $('admin-role').textContent = a.role === 'super' ? '👑 Super Admin' : '🧑‍💼 Manager';
    $('admin-avatar').textContent = a.name.charAt(0).toUpperCase();
    $('admin-date').textContent = new Date().toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'});
    applyPermissions();
    showAdmin('dashboard');
    window.scrollTo(0, 0);
}
function exitAdmin() {
    $('admin-app').classList.add('hidden');
    $('client-app').classList.remove('hidden');
    $('site-header').classList.remove('hidden');
    $('site-footer').classList.remove('hidden');
    const promo = $('promo-bar');
    if (promo) promo.classList.remove('hidden');
    renderCatalogs(); renderCart();
}
function applyPermissions() {
    const super_ = isSuper();
    document.querySelector('[data-admin="pricing"]').innerHTML = super_ ? '🏷️ Tarifs & catalogue' : '🏷️ Tarifs & catalogue 🔒';
}
function showAdmin(name) {
    if (name === 'pricing' && !isSuper()) {
        toast('Tarifs en lecture seule — modification réservée au Super Admin 🔒');
    }
    document.querySelectorAll('.admin-view').forEach(v => v.classList.add('hidden'));
    $('admin-' + name).classList.remove('hidden');
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.toggle('active', b.dataset.admin === name));
    $('admin-sidebar').classList.remove('open');
    const titles = {dashboard: 'Tableau de bord', orders: 'Commandes', finance: 'Gestion financière', providers: 'Prestataires', pricing: 'Tarifs & catalogue', team: 'Administrateurs'};
    $('admin-title').textContent = titles[name];
    if (name === 'dashboard') renderDashboard();
    if (name === 'orders') renderAdminOrders();
    if (name === 'finance') renderFinance();
    if (name === 'providers') renderProviders();
    if (name === 'pricing') renderPricing();
    if (name === 'team') renderTeam();
}
function showAdminLocked(name) {
    toast('Réservé au Super Admin 🔒', 'error');
}

/* ═══════════ ADMIN : DASHBOARD ═══════════ */
function stats() {
    const orders = getOrders().filter(o => o.status !== 'Annulée');
    const tx = getTx();
    const ca = orders.reduce((t, o) => t + o.total, 0);
    const recettes = tx.filter(t => t.type === 'recette').reduce((t, x) => t + x.amount, 0);
    const depenses = tx.filter(t => t.type === 'depense').reduce((t, x) => t + x.amount, 0);
    const benef = recettes - depenses;
    return {
        ca, recettes, depenses, benef,
        marge: recettes ? Math.round(benef / recettes * 100) : 0,
        count: orders.length,
        panier: orders.length ? Math.round(ca / orders.length) : 0,
        reste: Math.max(0, ca - recettes),
        pending: getOrders().filter(o => o.status === 'En attente').length,
        musicDue: getOrders().filter(o => o.hasMusic && !o.musicianPaid && o.status !== 'Annulée'),
        all: getOrders()
    };
}
function renderDashboard() {
    const s = stats();
    $('kpi-ca').textContent = fmt(s.ca);
    $('kpi-ca-sub').textContent = s.count + ' commande(s) · hors annulées';
    $('kpi-encaisse').textContent = fmt(s.recettes);
    $('kpi-encaisse-sub').textContent = 'Acomptes + soldes reçus';
    $('kpi-benef').textContent = fmt(s.benef);
    $('kpi-benef-sub').textContent = 'Marge nette : ' + s.marge + '%';
    $('kpi-orders').textContent = s.all.length;
    $('kpi-orders-sub').textContent = s.pending + ' en attente de validation';
    $('kpi-panier').textContent = fmt(s.panier);
    $('kpi-panier-sub').textContent = 'Par commande';
    $('kpi-reste').textContent = fmt(s.reste);
    $('kpi-reste-sub').textContent = 'Soldes à encaisser';
    $('nav-orders-badge').textContent = s.pending || '';

    const alerts = [];
    if (s.pending) alerts.push(`<div class="alert warn">⏳ <strong>${s.pending} commande(s) en attente</strong> de validation dans l'onglet Commandes.</div>`);
    if (s.musicDue.length) alerts.push(`<div class="alert info">🎷 <strong>${s.musicDue.length} prestation(s) musicien</strong> à payer (${fmt(s.musicDue.reduce((t, o) => t + o.musicianCost, 0))}).</div>`);
    if (s.benef > 0 && s.marge >= 20) alerts.push(`<div class="alert ok">📈 Excellent : marge nette de <strong>${s.marge}%</strong>. Continuez ainsi !</div>`);
    if (!alerts.length) alerts.push('<div class="alert ok">✅ Tout est à jour. Aucune action urgente.</div>');
    $('admin-alerts').innerHTML = alerts.join('');

    // CA 6 derniers mois
    const months = [], values = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
        const key = d.getFullYear() + '-' + d.getMonth();
        months.push(d.toLocaleDateString('fr-FR', {month: 'short'}));
        values.push(getOrders().filter(o => {
            const od = new Date(o.createdAt);
            return o.status !== 'Annulée' && od.getFullYear() + '-' + od.getMonth() === key;
        }).reduce((t, o) => t + o.total, 0));
    }
    drawBars($('chart-ca'), months, values);

    // Mix prestations
    const mix = {};
    getOrders().filter(o => o.status !== 'Annulée').forEach(o =>
        o.items.forEach(it => { mix[it.name] = (mix[it.name] || 0) + it.price * it.qty; }));
    const entries = Object.entries(mix).sort((a, b) => b[1] - a[1]).slice(0, 6);
    drawDonut($('chart-mix'), entries);
    const colors = chartColors();
    $('chart-mix-legend').innerHTML = entries.map((e, i) =>
        `<span><i style="background:${colors[i % colors.length]}"></i>${esc(e[0])} — ${fmt(e[1])}</span>`).join('') || '<span class="muted">Aucune donnée</span>';

    const recent = [...getOrders()].sort((a, b) => b.id - a.id).slice(0, 5);
    $('recent-orders-body').innerHTML = recent.length ? recent.map(o => `
        <tr><td><strong>${o.ref}</strong></td><td>${esc(o.client)}</td><td>${fmtDate(o.date)}</td>
        <td><strong>${fmt(o.total)}</strong></td><td>${statusBadge(o.status)}</td></tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center">Aucune commande.</td></tr>';
}
function chartColors() { return ['#c9a24b', '#d6336c', '#2a1b2e', '#1d9e6c', '#5b8def', '#e0784a', '#8a63c9']; }
function setupCanvas(cv) {
    const dpr = window.devicePixelRatio || 1;
    const w = cv.clientWidth || 400, h = parseInt(cv.getAttribute('height')) || 220;
    cv.width = w * dpr; cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    return {ctx, w, h};
}
function drawBars(cv, labels, values) {
    const {ctx, w, h} = setupCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const max = Math.max(...values, 1);
    const padL = 46, padB = 26, padT = 18;
    const cw = (w - padL - 10) / values.length;
    ctx.font = '10px Outfit, sans-serif';
    for (let g = 0; g <= 4; g++) {
        const y = padT + (h - padB - padT) * g / 4;
        ctx.strokeStyle = '#eee4d4'; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - 6, y); ctx.stroke();
        ctx.fillStyle = '#8a7d8a';
        ctx.fillText(fmtShort(max * (4 - g) / 4), 4, y + 3);
    }
    values.forEach((v, i) => {
        const bh = (h - padB - padT) * v / max;
        const x = padL + cw * i + cw * 0.2, y = h - padB - bh;
        const grad = ctx.createLinearGradient(0, y, 0, h - padB);
        grad.addColorStop(0, '#d6336c'); grad.addColorStop(1, '#c9a24b');
        ctx.fillStyle = grad;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(x, Math.max(y, padT), cw * 0.6, Math.max(bh, 3), 5);
            ctx.fill();
        } else {
            ctx.fillRect(x, Math.max(y, padT), cw * 0.6, Math.max(bh, 3));
        }
        if (v > 0) { ctx.fillStyle = '#2a1b2e'; ctx.font = 'bold 10px Outfit'; ctx.fillText(fmtShort(v), x - 2, Math.max(y, padT) - 5); ctx.font = '10px Outfit, sans-serif'; }
        ctx.fillStyle = '#8a7d8a';
        ctx.fillText(labels[i], x, h - 10);
    });
}
function drawDonut(cv, entries) {
    const {ctx, w, h} = setupCanvas(cv);
    ctx.clearRect(0, 0, w, h);
    const total = entries.reduce((t, e) => t + e[1], 0);
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 14;
    if (!total) {
        ctx.fillStyle = '#eadfd2'; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
        ctx.fillStyle = '#8a7d8a'; ctx.font = '13px Outfit'; ctx.textAlign = 'center';
        ctx.fillText('Aucune donnée', cx, cy + 5); ctx.textAlign = 'left';
        return;
    }
    const colors = chartColors();
    let a = -Math.PI / 2;
    entries.forEach((e, i) => {
        const a2 = a + (e[1] / total) * Math.PI * 2;
        ctx.fillStyle = colors[i % colors.length];
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a, a2); ctx.closePath(); ctx.fill();
        a = a2;
    });
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.58, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#2a1b2e'; ctx.font = 'bold 15px Playfair Display, serif'; ctx.textAlign = 'center';
    ctx.fillText(fmtShort(total), cx, cy + 2);
    ctx.font = '10px Outfit'; ctx.fillStyle = '#8a7d8a';
    ctx.fillText('FCFA', cx, cy + 16); ctx.textAlign = 'left';
}

/* ═══════════ ADMIN : COMMANDES ═══════════ */
function renderAdminOrders() {
    const q = ($('orders-search').value || '').toLowerCase();
    const fs = $('orders-filter-status').value, fp = $('orders-filter-pay').value;
    let orders = [...getOrders()].sort((a, b) => b.id - a.id);
    if (q) orders = orders.filter(o => (o.ref + o.client + o.phone + o.location + o.recipient).toLowerCase().includes(q));
    if (fs) orders = orders.filter(o => o.status === fs);
    if (fp) orders = orders.filter(o => o.payStatus === fp);
    $('nav-orders-badge').textContent = getOrders().filter(o => o.status === 'En attente').length || '';
    if (!orders.length) {
        $('admin-orders-list').innerHTML = '<tr><td colspan="8" style="text-align:center">Aucune commande trouvée.</td></tr>';
        return;
    }
    $('admin-orders-list').innerHTML = orders.map(o => `
        <tr>
            <td><strong>${o.ref}</strong><br><small class="muted">${fmtDate(o.createdAt)}</small></td>
            <td><strong>${esc(o.client)}</strong><br><small>${esc(o.phone)}</small></td>
            <td>${fmtDate(o.date)}<br><small>${esc(o.time || '')} · ${esc(o.location).slice(0, 24)}</small></td>
            <td><small>${o.items.map(it => '• ' + esc(it.name) + ' ×' + it.qty).join('<br>')}</small></td>
            <td><strong>${fmt(o.total)}</strong>${o.discount ? `<br><small style="color:var(--green)">−${fmt(o.discount)}</small>` : ''}</td>
            <td>${payBadge(o.payStatus)}</td>
            <td>${statusBadge(o.status)}</td>
            <td><div class="row-actions">
                <button class="btn-mini" onclick="openOrderModal(${o.id})">👁 Gérer</button>
                <button class="btn-mini" onclick="printInvoice(${o.id})">🖨</button>
            </div></td>
        </tr>`).join('');
}
function openOrderModal(id) {
    const o = getOrders().find(x => x.id === id);
    if (!o) return;
    const restant = o.payStatus === 'Soldé' ? 0 : o.payStatus === 'Acompte versé' ? o.solde : o.total;
    $('order-modal-content').innerHTML = `
        <h2>Commande ${o.ref}</h2>
        <p class="muted">Créée le ${fmtDate(o.createdAt)} · ${statusBadge(o.status)} ${payBadge(o.payStatus)}</p>
        <div class="order-detail-grid">
            <div class="od"><small>Client</small>${esc(o.client)}<br>${esc(o.phone)}</div>
            <div class="od"><small>Bénéficiaire</small>${esc(o.recipient)}</div>
            <div class="od"><small>Lieu</small>${esc(o.location)}</div>
            <div class="od"><small>Date & heure</small>${fmtDate(o.date)} à ${esc(o.time || '—')}</div>
        </div>
        <div class="table-wrap"><table class="table" style="min-width:0">
            <thead><tr><th>Prestation</th><th>Prix</th><th>Qté</th><th>Total</th></tr></thead>
            <tbody>${o.items.map(it => `<tr><td>${esc(it.name)}</td><td>${fmt(it.price)}</td><td>×${it.qty}</td><td><strong>${fmt(it.price * it.qty)}</strong></td></tr>`).join('')}</tbody>
        </table></div>
        <div class="summary-lines">
            <div class="summary-line"><span>Sous-total</span><strong>${fmt(o.subtotal)}</strong></div>
            ${o.discount ? `<div class="summary-line discount"><span>Remise pack</span><strong>−${fmt(o.discount)}</strong></div>` : ''}
            <div class="summary-line total"><span>Total</span><strong>${fmt(o.total)}</strong></div>
            <div class="summary-line"><span>Acompte (${getSettings().acompte}%)</span><strong>${fmt(o.acompte)}</strong></div>
            <div class="summary-line"><span>Reste dû</span><strong>${fmt(restant)}</strong></div>
        </div>
        ${o.message ? `<p style="margin-top:12px;font-size:.88rem"><strong>💬 Message client :</strong> ${esc(o.message)}</p>` : ''}
        ${o.hasMusic ? `<p style="margin-top:8px;font-size:.88rem">🎷 Musicien : ${o.musicianPaid ? '<span class="badge badge-paid">Payé (' + fmt(o.musicianCost) + ')</span>' : '<span class="badge badge-wait">À payer (' + fmt(o.musicianCost) + ')</span>'}</p>` : ''}
        <div class="modal-actions">
            <select id="modal-status" class="btn-mini" style="padding:9px">
                ${['En attente', 'Confirmée', 'Livrée', 'Annulée'].map(s => `<option ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <button class="btn-mini" onclick="updateOrderStatus(${o.id})">✔ Appliquer statut</button>
            ${o.payStatus === 'Non payé' ? `<button class="btn-mini pay" onclick="recordPayment(${o.id},'acompte')">💰 Encaisser acompte (${fmt(o.acompte)})</button>` : ''}
            ${o.payStatus === 'Acompte versé' ? `<button class="btn-mini pay" onclick="recordPayment(${o.id},'solde')">💰 Encaisser solde (${fmt(o.solde)})</button>` : ''}
            ${o.hasMusic && !o.musicianPaid ? `<button class="btn-mini" onclick="payMusician(${o.id})">🎷 Payer musiciens (${fmt(o.musicianCost)})</button>` : ''}
            <button class="btn-mini" onclick="printInvoice(${o.id})">🖨 Facture</button>
            ${isSuper() ? `<button class="btn-mini danger" onclick="deleteOrder(${o.id})">🗑 Supprimer</button>` : ''}
        </div>`;
    $('order-modal').classList.remove('hidden');
}
function closeOrderModal() { $('order-modal').classList.add('hidden'); }
function updateOrderStatus(id) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    o.status = $('modal-status').value;
    saveOrders(orders);
    toast('Statut : ' + o.status, 'success');
    openOrderModal(id); renderAdminOrders();
}
function recordPayment(id, kind) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    const tx = getTx();
    if (kind === 'acompte' && o.payStatus === 'Non payé') {
        o.payStatus = 'Acompte versé';
        if (o.status === 'En attente') o.status = 'Confirmée';
        tx.push({id: Date.now(), date: todayISO(), type: 'recette', category: 'Acompte', label: `Acompte ${o.ref} — ${o.client}`, amount: o.acompte, ref: o.ref});
        toast('Acompte encaissé ✓', 'success');
    } else if (kind === 'solde' && o.payStatus === 'Acompte versé') {
        o.payStatus = 'Soldé';
        tx.push({id: Date.now(), date: todayISO(), type: 'recette', category: 'Solde', label: `Solde ${o.ref} — ${o.client}`, amount: o.solde, ref: o.ref});
        toast('Commande soldée ✓', 'success');
    }
    saveTx(tx); saveOrders(orders);
    openOrderModal(id); renderAdminOrders();
}
function payMusician(id) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    o.musicianPaid = true;
    saveOrders(orders);
    const tx = getTx();
    tx.push({id: Date.now(), date: todayISO(), type: 'depense', category: 'Paiement prestataire', label: `Musiciens — ${o.ref}`, amount: o.musicianCost, ref: o.ref});
    saveTx(tx);
    toast('Musiciens payés 🎷', 'success');
    if (!$('order-modal').classList.contains('hidden')) openOrderModal(id);
    renderAdminOrders();
    if (!$('admin-providers').classList.contains('hidden')) renderProviders();
}
function deleteOrder(id) {
    if (!isSuper()) { toast('Suppression réservée au Super Admin 🔒', 'error'); return; }
    if (!confirm('Supprimer définitivement cette commande ?')) return;
    saveOrders(getOrders().filter(o => o.id !== id));
    closeOrderModal(); renderAdminOrders();
    toast('Commande supprimée');
}
function exportOrdersCSV() {
    const rows = [['Ref', 'Client', 'Téléphone', 'Lieu', 'Date', 'Prestations', 'Total', 'Paiement', 'Statut']];
    getOrders().forEach(o => rows.push([o.ref, o.client, o.phone, o.location, o.date, o.items.map(i => i.name + ' x' + i.qty).join(' | '), o.total, o.payStatus, o.status]));
    downloadCSV(rows, 'lv-commandes.csv');
}
function downloadCSV(rows, filename) {
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], {type: 'text/csv'}));
    a.download = filename;
    a.click();
    toast('Export téléchargé ⬇', 'success');
}
function printInvoice(id) {
    const o = getOrders().find(x => x.id === id);
    if (!o) return;
    let area = $('print-area');
    if (!area) { area = document.createElement('div'); area.id = 'print-area'; document.body.appendChild(area); }
    area.innerHTML = `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#222">
            <div style="text-align:center;border-bottom:3px solid #c9a24b;padding-bottom:14px;margin-bottom:20px">
                <h1 style="margin:0;font-size:26px">🎁 LV Surprise Event</h1>
                <p style="margin:4px 0;font-size:13px">Douala & Yaoundé · +237 6 90 00 00 00 · contact@lv-surprise.cm</p>
                <h2 style="margin:10px 0 0">FACTURE ${o.ref}</h2>
            </div>
            <p><strong>Client :</strong> ${esc(o.client)} (${esc(o.phone)})<br>
            <strong>Lieu :</strong> ${esc(o.location)}<br>
            <strong>Événement :</strong> ${fmtDate(o.date)} à ${esc(o.time || '—')} · Bénéficiaire : ${esc(o.recipient)}</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr style="background:#2a1b2e;color:#fff"><th style="padding:10px;text-align:left">Prestation</th><th>Qté</th><th style="text-align:right;padding-right:10px">Montant</th></tr>
                ${o.items.map(it => `<tr style="border-bottom:1px solid #ddd"><td style="padding:9px">${esc(it.name)}</td><td style="text-align:center">×${it.qty}</td><td style="text-align:right">${fmt(it.price * it.qty)}</td></tr>`).join('')}
            </table>
            <p style="text-align:right">Sous-total : ${fmt(o.subtotal)}${o.discount ? `<br>Remise : −${fmt(o.discount)}` : ''}<br>
            <strong style="font-size:18px">TOTAL : ${fmt(o.total)}</strong><br>
            Acompte : ${fmt(o.acompte)} · Statut paiement : ${esc(o.payStatus)}</p>
            <p style="font-size:12px;color:#666;margin-top:24px">Merci de votre confiance 💛 — Acompte de ${getSettings().acompte}% à la réservation, solde le jour J.</p>
        </div>`;
    setTimeout(() => window.print(), 150);
}

/* ═══════════ ADMIN : FINANCES ═══════════ */
function renderFinance() {
    const tx = [...getTx()].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const rec = tx.filter(t => t.type === 'recette').reduce((t, x) => t + x.amount, 0);
    const dep = tx.filter(t => t.type === 'depense').reduce((t, x) => t + x.amount, 0);
    $('fin-recettes').textContent = fmt(rec);
    $('fin-depenses').textContent = fmt(dep);
    $('fin-benef').textContent = fmt(rec - dep);
    $('fin-marge').textContent = (rec ? Math.round((rec - dep) / rec * 100) : 0) + '%';
    $('tx-date').value = $('tx-date').value || todayISO();
    $('finance-list').innerHTML = tx.length ? tx.map(t => `
        <tr>
            <td style="white-space:nowrap">${fmtDate(t.date)}</td>
            <td><strong>${esc(t.label)}</strong>${t.ref ? `<br><small class="muted">${t.ref}</small>` : ''}</td>
            <td><small>${esc(t.category)}</small></td>
            <td class="${t.type === 'recette' ? 'tx-in' : 'tx-out'}">${t.type === 'recette' ? '+' : '−'}${fmt(t.amount)}</td>
            <td>${isSuper() ? `<button class="btn-mini danger" onclick="deleteTx(${t.id})">✕</button>` : ''}</td>
        </tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center">Aucune opération.</td></tr>';
}
function addTransaction(e) {
    e.preventDefault();
    const tx = getTx();
    tx.push({
        id: Date.now(), date: $('tx-date').value || todayISO(),
        type: $('tx-type').value, category: $('tx-category').value,
        label: $('tx-label').value.trim(), amount: Number($('tx-amount').value)
    });
    saveTx(tx);
    $('tx-label').value = ''; $('tx-amount').value = '';
    renderFinance();
    toast('Opération enregistrée ✓', 'success');
    return false;
}
function deleteTx(id) {
    if (!isSuper()) { toast('Suppression réservée au Super Admin 🔒', 'error'); return; }
    if (!confirm('Supprimer cette opération ?')) return;
    saveTx(getTx().filter(t => t.id !== id));
    renderFinance();
}
function exportFinanceCSV() {
    const rows = [['Date', 'Type', 'Catégorie', 'Libellé', 'Montant']];
    getTx().forEach(t => rows.push([t.date, t.type, t.category, t.label, t.amount]));
    downloadCSV(rows, 'lv-finances.csv');
}

/* ═══════════ ADMIN : PRESTATAIRES ═══════════ */
function renderProviders() {
    const provs = getProviders();
    const orders = getOrders();
    $('prov-count').textContent = provs.length;
    const musicOrders = orders.filter(o => o.hasMusic && o.status !== 'Annulée');
    $('prov-paid').textContent = fmt(musicOrders.filter(o => o.musicianPaid).reduce((t, o) => t + o.musicianCost, 0));
    $('prov-due').textContent = fmt(musicOrders.filter(o => !o.musicianPaid).reduce((t, o) => t + o.musicianCost, 0));
    $('providers-list').innerHTML = provs.length ? provs.map(p => {
        const missions = orders.filter(o => o.hasMusic && o.status !== 'Annulée').length;
        return `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(p.skill)}</td><td>${esc(p.phone || '—')}</td>
        <td><strong>${fmt(p.cost)}</strong></td><td>${missions} mission(s) musique</td>
        <td>${isSuper() ? `<button class="btn-mini danger" onclick="deleteProvider(${p.id})">✕</button>` : ''}</td></tr>`;
    }).join('') : '<tr><td colspan="6" style="text-align:center">Aucun prestataire enregistré.</td></tr>';
    $('music-payments-list').innerHTML = musicOrders.length ? [...musicOrders].sort((a, b) => b.id - a.id).map(o => `
        <tr><td><strong>${o.ref}</strong></td><td>${esc(o.client)}</td><td>${fmtDate(o.date)}</td>
        <td><strong>${fmt(o.musicianCost)}</strong></td>
        <td>${o.musicianPaid ? '<span class="badge badge-paid">Payé</span>' : '<span class="badge badge-wait">À payer</span>'}</td>
        <td>${o.musicianPaid ? '' : `<button class="btn-mini pay" onclick="payMusician(${o.id})">Payer</button>`}</td></tr>`).join('')
        : '<tr><td colspan="6" style="text-align:center">Aucune animation musicale commandée.</td></tr>';
}
function toggleProviderForm() { $('provider-form').classList.toggle('hidden'); }
function addProvider(e) {
    e.preventDefault();
    const provs = getProviders();
    provs.push({id: Date.now(), name: $('prov-name').value.trim(), skill: $('prov-skill').value.trim(), phone: $('prov-phone').value.trim(), cost: Number($('prov-cost').value) || 0});
    saveProviders(provs);
    $('provider-form').reset(); $('prov-cost').value = getSettings().musicCost;
    toggleProviderForm(); renderProviders();
    toast('Prestataire ajouté ✓', 'success');
    return false;
}
function deleteProvider(id) {
    if (!isSuper()) { toast('Suppression réservée au Super Admin 🔒', 'error'); return; }
    if (!confirm('Retirer ce prestataire ?')) return;
    saveProviders(getProviders().filter(p => p.id !== id));
    renderProviders();
}

/* ═══════════ ADMIN : TARIFS ═══════════ */
function renderPricing() {
    const super_ = isSuper();
    if (!super_) {
        $('pricing-gateaux').innerHTML = '<div class="perm-note">🔒 Modification des tarifs réservée au <strong>Super Admin</strong>. Tarifs actuels affichés en lecture seule.</div>' + pricingRows(gateaux(), 'gateau', true);
        $('pricing-prestations').innerHTML = pricingRows(prestations(), 'prestation', true);
        $('setting-acompte').value = getSettings().acompte;
        $('setting-remise').value = getSettings().remise;
        $('setting-music').value = getSettings().musicCost;
        document.querySelector('#admin-pricing .panel:last-child').classList.add('locked');
        return;
    }
    document.querySelector('#admin-pricing .panel:last-child').classList.remove('locked');
    $('pricing-gateaux').innerHTML = pricingRows(gateaux(), 'gateau', false);
    $('pricing-prestations').innerHTML = pricingRows(prestations(), 'prestation', false);
    $('setting-acompte').value = getSettings().acompte;
    $('setting-remise').value = getSettings().remise;
    $('setting-music').value = getSettings().musicCost;
}
function pricingRows(list, kind, readonly) {
    return list.map(it => `
        <div class="pricing-row">
            <img src="${it.img}" alt="">
            <div><strong>${esc(it.name)}</strong><small>${esc(it.desc)}</small></div>
            <div style="display:flex;gap:8px;align-items:center">
                <input type="number" id="price-${kind}-${it.id}" value="${it.price}" min="0" step="500" ${readonly ? 'disabled' : ''}>
                ${readonly ? '' : `<button class="btn-mini" onclick="savePrice('${kind}','${it.id}')">💾</button>`}
            </div>
        </div>`).join('');
}
function savePrice(kind, id) {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    const v = Number($(`price-${kind}-${id}`).value);
    if (v < 0) return;
    const prices = getPrices();
    prices[(kind === 'gateau' ? 'gateau:' : 'presta:') + id] = v;
    store.set('lv_prices', prices);
    renderCatalogs();
    toast('Tarif mis à jour ✓', 'success');
}
function saveSettings() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    store.set('lv_settings', {
        acompte: Math.min(100, Math.max(0, Number($('setting-acompte').value) || 30)),
        remise: Math.min(50, Math.max(0, Number($('setting-remise').value) || 0)),
        musicCost: Math.max(0, Number($('setting-music').value) || 0)
    });
    renderCatalogs();
    toast('Paramètres enregistrés ✓', 'success');
}

/* ═══════════ ADMIN : ÉQUIPE ═══════════ */
function renderTeam() {
    const admins = getAdmins();
    const perms = {
        super: ['✔ Tableau de bord & statistiques', '✔ Commandes (créer, modifier, supprimer)', '✔ Finances (ajouter, supprimer, exports)', '✔ Prestataires & paiements', '✔ Tarifs & paramètres', '✔ Gestion des comptes'],
        manager: ['✔ Tableau de bord & statistiques', '✔ Commandes (créer, modifier)', '✔ Finances (ajouter, exports)', '✔ Prestataires & paiements', '✖ Tarifs & paramètres', '✖ Gestion des comptes']
    };
    $('team-grid').innerHTML = admins.map(a => `
        <div class="team-card">
            <span class="admin-avatar">${esc(a.name.charAt(0))}</span>
            <h4>${esc(a.name)}</h4>
            <div class="role ${a.role}">${a.role === 'super' ? '👑 SUPER ADMIN' : '🧑‍💼 MANAGER'}</div>
            <div><code>${esc(a.username)}</code> · <small class="muted">${esc(a.title)}</small></div>
            <ul>${perms[a.role].map(p => `<li>${p}</li>`).join('')}</ul>
            ${currentAdmin().username === a.username ? '<p style="margin-top:10px"><span class="badge badge-info">C\'est vous</span></p>' : ''}
        </div>`).join('');
}
function changePassword(e) {
    e.preventDefault();
    const admins = getAdmins();
    const me = currentAdmin();
    const record = admins.find(a => a.username === me.username);
    if (record.password !== $('pw-old').value) { toast('Mot de passe actuel incorrect', 'error'); return false; }
    if ($('pw-new').value !== $('pw-confirm').value) { toast('Les nouveaux mots de passe ne correspondent pas', 'error'); return false; }
    record.password = $('pw-new').value;
    saveAdmins(admins);
    $('pw-old').value = $('pw-new').value = $('pw-confirm').value = '';
    toast('Mot de passe mis à jour ✓', 'success');
    return false;
}
function resetDemoData() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    if (!confirm('Réinitialiser avec de nouvelles données de démonstration ? Vos données actuelles seront remplacées.')) return;
    store.del('lv_seeded');
    seedDemo(true);
    renderDashboard();
    toast('Données de démo réinitialisées ✓', 'success');
}

/* ═══════════ DONNÉES DE DÉMO + MIGRATION ═══════════ */
function migrateOldOrders() {
    // Ancien format (avant refonte) → nouveau format
    const orders = store.get('lv_orders', []);
    if (!orders.length || orders[0].ref) return;
    const catalog = [...DEFAULT_GATEAUX, ...DEFAULT_PRESTATIONS];
    const migrated = orders.map((o, i) => {
        const items = (o.services || []).map(name => {
            const found = catalog.find(c => c.name === name);
            return {kind: found && found.id.startsWith('g') ? 'gateau' : 'prestation', id: found?.id || 'x', name, price: found?.price || 0, qty: 1};
        });
        const total = parseInt(String(o.total).replace(/\D/g, '')) || items.reduce((t, it) => t + it.price, 0);
        return {
            id: o.id || (Date.now() + i), ref: `LV-2026-${1000 + i}`,
            client: o.client || 'Client', phone: '—', location: o.location || '—',
            date: (o.date || '').slice(0, 10) || todayISO(), time: '16:00',
            recipient: o.recipient || '—', message: '',
            items, subtotal: total, discount: 0, total,
            acompte: Math.round(total * 0.3), solde: total - Math.round(total * 0.3),
            payStatus: 'Non payé', status: 'En attente',
            hasMusic: !!o.hasMusic, musicianPaid: !!o.musicianPaid, musicianCost: 30000,
            createdAt: new Date().toISOString()
        };
    });
    saveOrders(migrated);
}
function seedDemo(force = false) {
    if (store.get('lv_seeded', false) && !force) return;
    if (getOrders().length && !force) { store.set('lv_seeded', true); return; }

    const G = Object.fromEntries(DEFAULT_GATEAUX.map(g => [g.id, g]));
    const P = Object.fromEntries(DEFAULT_PRESTATIONS.map(p => [p.id, p]));
    const mk = (id, kind) => {
        const it = kind === 'gateau' ? G[id] : P[id];
        return {kind, id, name: it.name, price: it.price, qty: 1};
    };
    const monthsAgo = (m, day) => {
        const d = new Date(); d.setMonth(d.getMonth() - m); d.setDate(Math.min(day, 28));
        return d.toISOString();
    };
    const dayISO = (m, day) => {
        const d = new Date(); d.setMonth(d.getMonth() - m); d.setDate(Math.min(day, 28));
        return d.toISOString().slice(0, 10);
    };
    const s = getSettings();
    const demo = [
        {client: 'Marc D.', phone: '6 90 12 34 56', location: 'Akwa, Douala', recipient: 'Épouse', items: [mk('deco', 'prestation'), mk('g1', 'gateau'), mk('bouquet', 'prestation')], m: 5, d: 14, st: 'Livrée', pay: 'Soldé'},
        {client: 'Aïcha B.', phone: '6 91 22 33 44', location: 'Bastos, Yaoundé', recipient: 'Elle-même (30 ans)', items: [mk('photo', 'prestation'), mk('g3', 'gateau'), mk('musique', 'prestation')], m: 4, d: 8, st: 'Livrée', pay: 'Soldé', musicPaid: true},
        {client: 'Kevin N.', phone: '6 92 45 67 89', location: 'Bonanjo, Douala', recipient: 'Fiancée', items: [mk('deco', 'prestation'), mk('bouquet', 'prestation')], m: 4, d: 21, st: 'Livrée', pay: 'Soldé'},
        {client: 'Larissa T.', phone: '6 93 11 22 33', location: 'Nkolbisson, Yaoundé', recipient: 'Maman (50 ans)', items: [mk('g4', 'gateau'), mk('musique', 'prestation'), mk('panier', 'prestation')], m: 3, d: 5, st: 'Livrée', pay: 'Soldé', musicPaid: true},
        {client: 'Junior E.', phone: '6 94 55 66 77', location: 'Deïdo, Douala', recipient: 'Petite amie', items: [mk('deco', 'prestation'), mk('g2', 'gateau')], m: 2, d: 17, st: 'Confirmée', pay: 'Acompte versé'},
        {client: 'Sandrine K.', phone: '6 95 78 90 12', location: 'Mvan, Yaoundé', recipient: 'Fille (10 ans)', items: [mk('photo', 'prestation'), mk('g1', 'gateau'), mk('panier', 'prestation')], m: 1, d: 9, st: 'Confirmée', pay: 'Acompte versé'},
        {client: 'Frank O.', phone: '6 96 34 56 78', location: 'Kotto, Douala', recipient: 'Épouse', items: [mk('deco', 'prestation'), mk('g3', 'gateau'), mk('musique', 'prestation')], m: 0, d: 20, st: 'En attente', pay: 'Non payé'},
        {client: 'Nadia S.', phone: '6 97 89 01 23', location: 'Odza, Yaoundé', recipient: 'Sœur', items: [mk('bouquet', 'prestation'), mk('panier', 'prestation')], m: 0, d: 25, st: 'En attente', pay: 'Non payé'}
    ];
    const orders = demo.map((d, i) => {
        const subtotal = d.items.reduce((t, it) => t + it.price * it.qty, 0);
        const hasDeco = d.items.some(it => it.id === 'deco');
        const hasGateau = d.items.some(it => it.kind === 'gateau');
        const discount = (hasDeco && hasGateau) ? Math.round(subtotal * s.remise / 100) : 0;
        const total = subtotal - discount;
        const acompte = Math.round(total * s.acompte / 100);
        const created = monthsAgo(d.m, d.d);
        return {
            id: Date.now() - (demo.length - i) * 86400000 * 9,
            ref: `LV-${new Date().getFullYear()}-${2410 + i}`,
            client: d.client, phone: d.phone, location: d.location,
            date: dayISO(Math.max(0, d.m - 0), d.d), time: '16:00',
            recipient: d.recipient, message: '',
            items: d.items, subtotal, discount, total, acompte, solde: total - acompte,
            payStatus: d.pay, status: d.st,
            hasMusic: d.items.some(it => it.id === 'musique'),
            musicianPaid: !!d.musicPaid, musicianCost: s.musicCost,
            createdAt: created
        };
    });
    saveOrders(orders);

    // Transactions liées aux paiements
    const tx = [];
    let tid = Date.now() - 1000000;
    orders.forEach(o => {
        if (o.payStatus === 'Acompte versé' || o.payStatus === 'Soldé')
            tx.push({id: tid++, date: o.createdAt.slice(0, 10), type: 'recette', category: 'Acompte', label: `Acompte ${o.ref} — ${o.client}`, amount: o.acompte, ref: o.ref});
        if (o.payStatus === 'Soldé')
            tx.push({id: tid++, date: o.createdAt.slice(0, 10), type: 'recette', category: 'Solde', label: `Solde ${o.ref} — ${o.client}`, amount: o.solde, ref: o.ref});
        if (o.musicianPaid)
            tx.push({id: tid++, date: o.createdAt.slice(0, 10), type: 'depense', category: 'Paiement prestataire', label: `Musiciens — ${o.ref}`, amount: o.musicianCost, ref: o.ref});
    });
    const depenses = [
        ['Achat matières / déco', 'Ballons, rubans & pétales (stock)', 45000, 5],
        ['Transport / livraison', 'Carburant livraisons du mois', 25000, 4],
        ['Achat matières / déco', 'Ingrédients pâtisserie', 60000, 3],
        ['Publicité', 'Sponsoring Facebook / TikTok', 30000, 2],
        ['Transport / livraison', 'Location camionnette jour J', 20000, 1],
        ['Achat matières / déco', 'Guirlandes LED & arche ballons', 35000, 0]
    ];
    depenses.forEach(d => tx.push({id: tid++, date: dayISO(d[3], 3), type: 'depense', category: d[0], label: d[1], amount: d[2]}));
    saveTx(tx);

    if (!getProviders().length || force) {
        saveProviders([
            {id: tid + 1, name: 'Saxo John', skill: 'Saxophoniste', phone: '6 90 55 44 33', cost: 30000},
            {id: tid + 2, name: 'Duo Melody', skill: 'Guitare & voix', phone: '6 91 66 77 88', cost: 45000}
        ]);
    }
    if (!store.get('lv_admins', null) || force) saveAdmins(JSON.parse(JSON.stringify(DEFAULT_ADMINS)));
    store.set('lv_seeded', true);
}

/* ═══════════ INIT ═══════════ */
document.addEventListener('DOMContentLoaded', () => {
    migrateOldOrders();
    seedDemo();
    renderCatalogs();
    renderCart();
    const dateInput = $('date');
    if (dateInput) dateInput.min = todayISO();
    document.querySelectorAll('.modal-overlay').forEach(m =>
        m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); }));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    });
    window.addEventListener('resize', () => {
        if (!$('admin-app').classList.contains('hidden') && !$('admin-dashboard').classList.contains('hidden')) renderDashboard();
    });
});
