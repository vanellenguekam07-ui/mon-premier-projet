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
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { toast('Stockage plein ou indisponible dans ce navigateur.', 'error'); return false; } },
    del(k) { localStorage.removeItem(k); }
};

/* ── Sécurité : hachage SHA-256 salé (les mots de passe ne sont plus en clair) ── */
async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
const hashPassword = (username, password) => sha256Hex(String(username).toLowerCase() + ':' + password);
const SESSION_TTL = 2 * 60 * 60 * 1000; // session admin : 2 heures max

/* ── Téléphone Cameroun ── */
const normalizePhone = (tel) => String(tel || '').replace(/[\s.\-()]/g, '');
function isValidCmPhone(tel) {
    const n = normalizePhone(tel);
    return /^\+?237[6-9]\d{8}$/.test(n) || /^[6-9]\d{8}$/.test(n);
}
function waNumber() {
    const cfg = (window.LV_CONFIG && window.LV_CONFIG.WHATSAPP_NUMBER) || '';
    const siteWa = normalizePhone(getSite().whatsapp || '');
    const raw = cfg || siteWa || normalizePhone(getSite().phone || '');
    return raw.replace(/^\+/, '');
}
function waLink(message) {
    const num = waNumber();
    if (!num) return '#';
    return 'https://wa.me/' + num + (message ? '?text=' + encodeURIComponent(message) : '');
}

/* ── Anti-spam : captcha mathématique ── */
let captchaAnswer = null;
function newCaptcha() {
    const a = 2 + Math.floor(Math.random() * 7), b = 2 + Math.floor(Math.random() * 7);
    captchaAnswer = a + b;
    const q = $('captcha-question');
    if (q) q.textContent = `Combien font ${a} + ${b} ?`;
    const inp = $('captcha-answer');
    if (inp) inp.value = '';
}

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
/* Mots de passe par défaut UNIQUEMENT sous forme hachée (SHA-256 salé).
   ⚠️ À CHANGER immédiatement après la première connexion (onglet Équipe),
   et à supprimer du README / de tout document public. */
const DEFAULT_ADMINS = [
    {username: 'vanelle', passwordHash: 'e91bb635ed044f5dae7ce74e75049a7bb77b280c25d81bcb5b998fe01c2acd39', role: 'super', name: 'Vanelle L.', title: 'Fondatrice', mustChangePassword: true},
    {username: 'assistant', passwordHash: 'f17298ef3caa167eb9e4cc10d22ae3e1faad83a9f43fa772179027569cda1a89', role: 'manager', name: 'Boris M.', title: 'Manager événementiel', mustChangePassword: true}
];
const DEFAULT_SETTINGS = {acompte: 30, remise: 10, musicCost: 30000};

/* ─────────── ACCÈS DONNÉES ─────────── */
const getSettings = () => ({...DEFAULT_SETTINGS, ...store.get('lv_settings', {})});

/* Catalogue 100% modifiable (nom, prix, photos, descriptions) */
function getCatalog() {
    let cat = store.get('lv_catalog', null);
    if (!cat) {
        const ov = store.get('lv_prices', {});
        cat = {
            gateaux: DEFAULT_GATEAUX.map(g => ({...g, price: ov['gateau:' + g.id] ?? g.price})),
            prestations: DEFAULT_PRESTATIONS.map(p => ({...p, price: ov['presta:' + p.id] ?? p.price}))
        };
        try { store.set('lv_catalog', cat); } catch {}
    }
    return cat;
}
function saveCatalog(cat) {
    try { store.set('lv_catalog', cat); } catch { toast('Stockage plein : image trop lourde. Essayez une photo plus légère.', 'error'); return false; }
    pushContent('catalog', cat);
    return true;
}
function gateaux() { return getCatalog().gateaux; }
function prestations() { return getCatalog().prestations; }

/* Contenus du site 100% modifiables (textes, images, coordonnées) */
const DEFAULT_SITE = {
    brand: 'LV *Surprise* Event',
    promoActive: true,
    promo: "✨ Offre du moment : *-10% sur les packs Décoration + Gâteau* — Devis gratuit en 2 minutes",
    heroBadge: "🎉 N°1 des surprises d'anniversaire sur mesure",
    heroTitle: 'Des surprises *inoubliables*,\norganisées pour vous.',
    heroSubtitle: "Décoration de chambre, gâteaux personnalisés, bouquets d'argent, musiciens en direct… Composez votre événement à la carte et recevez votre devis instantané.",
    heroImage: 'images/hero.jpg',
    gateauxHero: 'images/gateau-redvelvet.jpg',
    prestaHero: 'images/decoration.jpg',
    cakeInfoTitle: '🎨 Personnalisation offerte',
    cakeInfoText: 'Message sur le gâteau, choix du parfum (vanille, chocolat, red velvet, citron, coco), décor doré ou floral — sans supplément. Tailles disponibles : 8, 12, 20 ou 30+ parts. Délai : 48h minimum, 5 jours pour les pièces montées.',
    phone: '+237 6 90 00 00 00',   // ⚠️ À REMPLIR avec le vrai numéro avant l'ouverture
    whatsapp: '',                  // Numéro WhatsApp de réception des commandes (format international, sans +)
    payment: 'MTN MoMo · Orange Money · Espèces',  // Numéros exacts à compléter dans l'admin
    email: 'contact@lv-surprise.cm', // ⚠️ À REMPLIR avec la vraie boîte email
    address: 'Douala & Yaoundé, Cameroun',
    hours: 'Lun – Sam : 8h → 20h\nDimanche : 12h → 18h',
    baseOrders: 0  // Compteur réel : ne mettre que le nombre de vraies commandes déjà réalisées
};
const getSite = () => ({...DEFAULT_SITE, ...store.get('lv_site', {})});
function saveSite(s) {
    try { store.set('lv_site', s); } catch { toast('Stockage plein : image trop lourde. Essayez une photo plus légère.', 'error'); return false; }
    pushContent('site', s);
    return true;
}
/* *mot* → mise en avant (doré/gras/italique selon l'endroit) */
function richText(s) { return esc(s ?? '').replace(/\*(.+?)\*/g, '<em>$1</em>'); }
function richLines(s) { return richText(s).replace(/\n/g, '<br>'); }

/* Upload + compression automatique des photos (pour tenir dans le stockage local) */
function processImageFile(file, cb) {
    if (!file || !file.type.startsWith('image/')) { toast('Fichier image invalide', 'error'); return; }
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            const MAX = 900;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const w = Math.max(1, Math.round(img.width * scale));
            const h = Math.max(1, Math.round(img.height * scale));
            const cv = document.createElement('canvas');
            cv.width = w; cv.height = h;
            cv.getContext('2d').drawImage(img, 0, 0, w, h);
            cb(cv.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => toast("Impossible de lire cette image", 'error');
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
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
    if (Date.now() - (s.at || 0) > SESSION_TTL) { store.del('lv_session'); return null; } // session expirée
    if (s.profile) return s.profile; // session serveur : rôle fourni par la base
    return getAdmins().find(a => a.username === s.username) || null;
};
const cloudOn = () => Boolean(window.LVCloud && LVCloud.enabled);
/* Écrit côté serveur (uniquement si le rôle connecté y a droit) */
function pushContent(key, value) {
    if (!cloudOn() || !LVCloud.canWrite()) return;
    LVCloud.setContent(key, value).catch(e => toast('Synchro serveur : ' + e.message, 'error'));
}
/* Récupère le contenu publié côté serveur (visible par TOUS les visiteurs) */
async function syncPublicContent() {
    if (!cloudOn()) return false;
    try {
        const c = await LVCloud.pullContent();
        if (c.settings) store.set('lv_settings', {...DEFAULT_SETTINGS, ...c.settings});
        if (c.catalog && (Array.isArray(c.catalog.gateaux) || Array.isArray(c.catalog.prestations))) store.set('lv_catalog', c.catalog);
        if (c.site) store.set('lv_site', {...DEFAULT_SITE, ...c.site});
        return true;
    } catch (e) {
        console.warn('Sync contenu :', e.message);
        return false;
    }
}
/* Migration : anciens mots de passe en clair → hachés (une seule fois) */
async function migrateAdminPasswords() {
    const admins = store.get('lv_admins', null);
    if (!admins) return;
    let changed = false;
    for (const a of admins) {
        if (a.password && !a.passwordHash) {
            a.passwordHash = await hashPassword(a.username, a.password);
            delete a.password;
            a.mustChangePassword = true;
            changed = true;
        }
    }
    if (changed) saveAdmins(admins);
}
const isSuper = () => currentAdmin()?.role === 'super';

/* ─────────── NAVIGATION CLIENT ─────────── */
function showView(name) {
    document.querySelectorAll('#client-app .view').forEach(v => v.classList.add('hidden'));
    $('view-' + name).classList.remove('hidden');
    document.querySelectorAll('.main-nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === name));
    $('main-nav').classList.remove('open');
    if (name === 'booking') { renderCart(); newCaptcha(); }
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
        {img: 'images/decoration.jpg', name: 'Décoration & Espace photo', desc: 'Chambres romantiques et décors photo dès ' + fmt(Math.min(...prestations().map(x => x.price))), go: 'prestations'},
        {img: 'images/bouquet-argent.jpg', name: 'Cadeaux surprises', desc: 'Bouquets d\'argent & paniers gourmands', go: 'prestations'},
        {img: 'images/musique.jpg', name: 'Animation musicale', desc: 'Musiciens en direct pour le jour J', go: 'prestations'}
    ];
    $('home-categories').innerHTML = cats.map(c => `
        <div class="category-card" onclick="showView('${c.go}')">
            <div class="thumb" style="background-image:url('${c.img}')"><span class="price-tag">Voir les tarifs →</span></div>
            <div class="body"><h3>${c.name}</h3><p>${c.desc}</p><span class="link">Découvrir →</span></div>
        </div>`).join('');
    const s = getSettings();
    const deco = findItem('prestation', 'deco'), g1 = findItem('gateau', 'g1'), bouquet = findItem('prestation', 'bouquet');
    if (deco && g1 && bouquet) $('pack-price').textContent = fmt(Math.round((deco.price + g1.price + bouquet.price) * (1 - s.remise / 100)));
    const realCount = Number(getSite().baseOrders) + getOrders().filter(o => o.status !== 'Annulée').length;
    $('stat-orders').textContent = realCount > 0 ? realCount + '+' : '0';
}

/* Applique les contenus personnalisés (textes, images, coordonnées) */
function renderSiteContent() {
    const s = getSite();
    const promoBar = $('promo-bar');
    if (promoBar) {
        promoBar.classList.toggle('hidden', !s.promoActive);
        $('promo-text').innerHTML = richText(s.promo);
    }
    document.querySelectorAll('.js-brand').forEach(el => el.innerHTML = richText(s.brand));
    $('hero-badge').textContent = s.heroBadge;
    $('hero-title').innerHTML = richLines(s.heroTitle);
    $('hero-subtitle').textContent = s.heroSubtitle;
    $('home-hero-bg').style.backgroundImage = `url('${s.heroImage}')`;
    $('gateaux-hero').style.backgroundImage = `url('${s.gateauxHero}')`;
    $('prestations-hero').style.backgroundImage = `url('${s.prestaHero}')`;
    $('cake-info-title').textContent = s.cakeInfoTitle;
    $('cake-info-text').textContent = s.cakeInfoText;
    const telHref = 'tel:' + normalizePhone(s.phone);
    $('footer-contact').innerHTML =
        `📍 ${esc(s.address)}<br>` +
        `📞 <a href="${telHref}">${esc(s.phone)}</a><br>` +
        `✉️ <a href="mailto:${esc(s.email)}">${esc(s.email)}</a><br>` +
        `💬 <a href="${waLink('Bonjour LV Surprise Event, je souhaite un devis 🎁')}" target="_blank" rel="noopener">WhatsApp</a>`;
    $('footer-hours').innerHTML = `${richLines(s.hours)}<br><br><span class="badge-open">● Disponible 7j/7 sur WhatsApp</span>`;
    const sp = $('summary-payment'); if (sp) sp.textContent = '💳 ' + (s.payment || 'MTN MoMo · Orange Money · Espèces');
    const waFloat = $('wa-float');
    if (waFloat) waFloat.href = waLink('Bonjour LV Surprise Event, je souhaite un devis 🎁');
    const lp = $('legal-phone'); if (lp) lp.textContent = s.phone;
    const le = $('legal-email'); if (le) le.textContent = s.email;
    renderContact(s);
}
function renderContact(s) {
    const box = $('contact-panel');
    if (!box) return;
    s = s || getSite();
    box.innerHTML = `
        <div class="order-detail-grid">
            <div class="od"><small>Téléphone / WhatsApp</small><a href="tel:${normalizePhone(s.phone)}">${esc(s.phone)}</a></div>
            <div class="od"><small>Email</small><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div>
            <div class="od"><small>Zone d'intervention</small>${esc(s.address)}</div>
            <div class="od"><small>Horaires</small>${richLines(s.hours)}</div>
        </div>
        <div class="contact-actions">
            <a class="btn btn-primary" href="${waLink('Bonjour LV Surprise Event, je souhaite un devis 🎁')}" target="_blank" rel="noopener">💬 Écrire sur WhatsApp</a>
            <a class="btn btn-outline" href="tel:${normalizePhone(s.phone)}">📞 Appeler</a>
            <a class="btn btn-outline" href="mailto:${esc(s.email)}">✉️ Envoyer un email</a>
        </div>
        <p class="muted" style="margin-top:14px">Paiements acceptés : ${esc(s.payment || 'MTN MoMo · Orange Money · Espèces')}. Acompte de ${getSettings().acompte} % à la réservation, solde le jour J.</p>`;
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
                <img src="${c.img}" alt="${esc(c.name)}" loading="lazy" decoding="async">
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
    // 6 chiffres : évite les doublons entre plusieurs appareils (contrainte unique en base)
    do { ref = `LV-${year}-${Math.floor(100000 + Math.random() * 900000)}`; }
    while (getOrders().some(o => o.ref === ref));
    return ref;
}
function copyOrderSummary(ref) {
    const o = getOrders().find(x => x.ref === ref);
    if (!o) return;
    const txt = `Commande ${o.ref} — ${o.client} (${o.phone})\nÉvénement : ${fmtDate(o.date)} à ${o.time} — ${o.location}\nBénéficiaire : ${o.recipient}\nPrestations : ${o.items.map(it => it.name + ' x' + it.qty).join(', ')}\nTotal : ${fmt(o.total)} · Acompte : ${fmt(o.acompte)}`;
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(
        () => toast('Récapitulatif copié 📋', 'success'),
        () => { prompt('Copiez votre récapitulatif :', txt); });
}
function submitOrder(e) {
    e.preventDefault();
    const btn = $('submit-order-btn');
    if (btn && btn.disabled) return false; // anti-double envoi
    // Anti-spam : honeypot + captcha
    if (($('website') && $('website').value) || captchaAnswer === null || Number($('captcha-answer').value) !== captchaAnswer) {
        toast('Vérification anti-spam incorrecte. Réessayez.', 'error'); newCaptcha(); return false;
    }
    if (!$('cgv-accept') || !$('cgv-accept').checked) { toast('Veuillez accepter les conditions générales pour continuer.', 'error'); return false; }
    const cart = getCart();
    if (!cart.length) { toast('Ajoutez au moins une prestation à votre devis', 'error'); return false; }
    if (!isValidCmPhone($('client_phone').value)) { toast('Numéro de téléphone invalide. Format attendu : 6XX XX XX XX (Cameroun).', 'error'); $('client_phone').focus(); return false; }
    const dateVal = $('date').value;
    if (!dateVal || dateVal < todayISO()) { toast('La date de l\u2019événement doit être aujourd\u2019hui ou dans le futur.', 'error'); return false; }
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
    if (btn) btn.disabled = true;
    const orders = getOrders(); orders.push(order); saveOrders(orders);
    if (cloudOn()) {
        LVCloud.insertOrder(order)
            .then(() => toast('Commande transmise à la boutique ✓', 'success'))
            .catch(err => toast('⚠️ Commande gardée sur cet appareil — envoyez-la sur WhatsApp. (' + err.message + ')', 'error'));
    }
    saveCart([]); renderCart(); renderCatalogs();
    $('surprise-form').reset();
    $('order-confirmation').classList.remove('hidden');
    const waMsg = `Bonjour LV Surprise Event 🎁\nNouvelle réservation ${order.ref}\nClient : ${order.client} (${order.phone})\nÉvénement : ${fmtDate(order.date)} à ${order.time} — ${order.location}\nBénéficiaire : ${order.recipient}\nPrestations : ${order.items.map(it => it.name + ' x' + it.qty).join(', ')}\nTotal : ${fmt(order.total)} (acompte ${fmt(order.acompte)})${order.message ? '\nMessage : ' + order.message : ''}`;
    const siteNow = getSite();
    $('order-confirmation').innerHTML = `
        <div class="confirm-box">
            <div class="big">🎉</div>
            <h3>Réservation reçue, ${esc(order.client.split(' ')[0])} !</h3>
            <p>Confirmez votre réservation sur WhatsApp pour que nous validions les détails et l'acompte de <strong>${fmt(order.acompte)}</strong>.</p>
            <div class="confirm-ref">${order.ref}</div>
            <p class="muted">Conservez cette référence pour suivre votre commande.<br>Total estimé : <strong>${fmt(order.total)}</strong> · Événement le ${fmtDate(order.date)} à ${esc(order.time)}</p>
            <div class="payment-box">💳 <strong>Pour payer l'acompte :</strong> ${esc(siteNow.payment || 'MTN MoMo · Orange Money · Espèces')} — indiquez la référence <strong>${order.ref}</strong> lors du paiement, puis envoyez la capture sur WhatsApp.</div>
            <div class="confirm-actions">
                <a class="btn btn-primary" href="${waLink(waMsg)}" target="_blank" rel="noopener">💬 Confirmer sur WhatsApp</a>
                <button class="btn btn-outline" onclick="copyOrderSummary('${order.ref}')">📋 Copier le récapitulatif</button>
                <button class="btn btn-outline" onclick="showView('tracking');$('tracking-input').value='${order.ref}';$('tracking-phone').value='${esc(order.phone)}';trackOrder()">Suivre ma commande →</button>
                <button class="btn btn-outline" onclick="$('order-confirmation').classList.add('hidden')">Fermer</button>
            </div>
        </div>`;
    if (btn) { btn.disabled = false; }
    newCaptcha();
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
async function trackOrder() {
    const refQ = $('tracking-input').value.trim().toLowerCase().replace(/\s/g, '');
    const phoneQ = normalizePhone($('tracking-phone') ? $('tracking-phone').value : '');
    const box = $('tracking-result');
    if (!refQ || !phoneQ) {
        box.innerHTML = '<div class="alert warn">🔒 Indiquez la <strong>référence</strong> (ex : LV-2026-123456) <strong>et</strong> le <strong>téléphone</strong> utilisés lors de la réservation.</div>';
        return;
    }
    let order = null;
    if (cloudOn()) {
        box.innerHTML = '<div class="alert">⏳ Recherche de votre commande…</div>';
        try {
            const res = await LVCloud.trackOrder(refQ, phoneQ);
            if (res && res.ok) order = res.order;
        } catch (err) {
            box.innerHTML = '<div class="alert warn">⚠️ Connexion au serveur momentanément impossible. Réessayez dans un instant ou écrivez-nous sur WhatsApp.</div>';
            return;
        }
    } else {
        order = getOrders().find(o =>
            o.ref.toLowerCase().replace(/\s/g, '') === refQ &&
            normalizePhone(o.phone).replace(/^\+?237/, '').endsWith(phoneQ.replace(/^\+?237/, '')));
    }
    if (!order) {
        box.innerHTML = `<div class="alert warn">🔍 Aucune commande ne correspond à cette référence et ce téléphone. Vérifiez vos informations ou contactez-nous sur WhatsApp.</div>`;
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
async function doLogin(e) {
    e.preventDefault();
    const lockMsg = $('login-lock-msg');
    if (lockMsg) lockMsg.classList.add('hidden');
    const attempts = store.get('lv_login_attempts', {count: 0, lockedUntil: 0});
    if (Date.now() < (attempts.lockedUntil || 0)) {
        const sec = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
        if (lockMsg) { lockMsg.textContent = `⛔ Trop de tentatives. Réessayez dans ${sec} s.`; lockMsg.classList.remove('hidden'); }
        return false;
    }
    const u = $('login-user').value.trim().toLowerCase();
    const pw = $('login-pass').value;
    /* Mode cloud : la base de données vérifie le mot de passe et le rôle (bcrypt) */
    if (cloudOn()) {
        let res;
        try { res = await LVCloud.login(u, pw); }
        catch (err) {
            $('login-error').textContent = '⛔ ' + err.message;
            $('login-error').classList.remove('hidden');
            return false;
        }
        if (!res.ok) {
            $('login-error').textContent = (res.error || 'Identifiant ou mot de passe incorrect.');
            $('login-error').classList.remove('hidden');
            $('login-pass').value = '';
            return false;
        }
        store.set('lv_login_attempts', {count: 0, lockedUntil: 0});
        store.set('lv_session', {username: res.profile.username, profile: res.profile, at: Date.now()});
        $('login-pass').value = '';
        closeLogin();
        await refreshAdminData(true);
        enterAdmin();
        toast(`Bienvenue ${res.profile.name} ${res.profile.role === 'super' ? '👑' : '🧑‍💼'}`, 'success');
        if (res.profile.mustChangePassword) {
            toast('⚠️ Changez votre mot de passe provisoire (onglet Administrateurs).', 'error');
            setTimeout(() => showAdmin('team'), 700);
        }
        return false;
    }
    const admin = getAdmins().find(a => a.username.toLowerCase() === u);
    let ok = false;
    if (admin) {
        if (admin.passwordHash) ok = (await hashPassword(admin.username, pw)) === admin.passwordHash;
        else if (admin.password) ok = admin.password === pw; // ancien format, migré juste après
    }
    if (!admin || !ok) {
        attempts.count = (attempts.count || 0) + 1;
        if (attempts.count >= 5) { attempts.lockedUntil = Date.now() + 60000; attempts.count = 0; }
        store.set('lv_login_attempts', attempts);
        $('login-error').classList.remove('hidden');
        $('login-pass').value = '';
        return false;
    }
    store.set('lv_login_attempts', {count: 0, lockedUntil: 0});
    // Migration transparente ancien → hashé
    if (admin.password && !admin.passwordHash) {
        const admins = getAdmins();
        const rec = admins.find(a => a.username === admin.username);
        rec.passwordHash = await hashPassword(rec.username, pw);
        delete rec.password; rec.mustChangePassword = true;
        saveAdmins(admins);
    }
    store.set('lv_session', {username: admin.username, at: Date.now()});
    $('login-pass').value = '';
    closeLogin(); enterAdmin();
    toast(`Bienvenue ${admin.name} 👑`, 'success');
    if (admin.mustChangePassword) {
        toast('⚠️ Pensez à changer votre mot de passe (onglet Équipe) avant l\u2019ouverture.', 'error');
        setTimeout(() => showAdmin('team'), 600);
    }
    return false;
}
function logout() {
    store.del('lv_session');
    if (cloudOn()) { LVCloud.logout().catch(() => {}); }
    exitAdmin();
    toast('Déconnecté. À bientôt !');
}
let lastAdminRefresh = 0;
async function refreshAdminData(force = false) {
    if (!cloudOn() || !LVCloud.isAdmin()) return false;
    if (!force && Date.now() - lastAdminRefresh < 4000) return true;
    try {
        const [orders, tx, provs] = await Promise.all([LVCloud.listOrders(), LVCloud.listTx(), LVCloud.listProviders()]);
        store.set('lv_orders', orders);
        store.set('lv_tx', tx);
        store.set('lv_providers', provs);
        lastAdminRefresh = Date.now();
        return true;
    } catch (e) {
        toast('Synchro serveur : ' + e.message, 'error');
        return false;
    }
}
function currentAdminView() {
    const v = document.querySelector('#admin-app .admin-view:not(.hidden)');
    return v ? v.id.replace('admin-', '') : 'dashboard';
}
function renderCloudBadge() {
    const el = $('cloud-status');
    if (!el) return;
    if (!cloudOn()) {
        el.className = 'cloud-badge local';
        el.innerHTML = '💾 Mode local';
        el.title = "Données stockées uniquement dans ce navigateur (Supabase non configuré).";
        return;
    }
    el.className = 'cloud-badge on';
    el.innerHTML = '🟢 Synchronisé';
    el.title = 'Commandes, tarifs et contenus enregistrés sur le serveur : visibles sur tous vos appareils.';
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
    renderCloudBadge();
    showAdmin('dashboard');
    window.scrollTo(0, 0);
    refreshAdminData().then(ok => { if (ok) { renderDashboard(); renderCloudBadge(); } });
}
function exitAdmin() {
    $('admin-app').classList.add('hidden');
    $('client-app').classList.remove('hidden');
    $('site-header').classList.remove('hidden');
    $('site-footer').classList.remove('hidden');
    const promo = $('promo-bar');
    if (promo) promo.classList.remove('hidden');
    renderCatalogs(); renderCart(); renderSiteContent();
}
function applyPermissions() {
    const super_ = isSuper();
    document.querySelector('[data-admin="pricing"]').innerHTML = super_ ? '🏷️ Tarifs & catalogue' : '🏷️ Tarifs & catalogue 🔒';
    document.querySelector('[data-admin="site"]').innerHTML = super_ ? '🌐 Contenu du site' : '🌐 Contenu du site 🔒';
}
function showAdmin(name) {
    if (name === 'pricing' && !isSuper()) {
        toast('Tarifs en lecture seule — modification réservée au Super Admin 🔒');
    }
    if (name === 'site' && !isSuper()) {
        toast('Contenu en lecture seule — modification réservée au Super Admin 🔒');
    }
    document.querySelectorAll('.admin-view').forEach(v => v.classList.add('hidden'));
    $('admin-' + name).classList.remove('hidden');
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.toggle('active', b.dataset.admin === name));
    $('admin-sidebar').classList.remove('open');
    const titles = {dashboard: 'Tableau de bord', orders: 'Commandes', finance: 'Gestion financière', providers: 'Prestataires', pricing: 'Tarifs & catalogue', site: 'Contenu du site', team: 'Administrateurs', guide: 'Guide d\u2019utilisation'};
    $('admin-title').textContent = titles[name];
    if (name === 'dashboard') renderDashboard();
    if (name === 'orders') renderAdminOrders();
    if (name === 'finance') renderFinance();
    if (name === 'providers') renderProviders();
    if (name === 'pricing') renderPricing();
    if (name === 'site') renderSiteForm();
    if (name === 'team') renderTeam();
    if (name === 'guide') renderGuide();
}

/* ═══════════ ADMIN : GUIDE + PREMIERS PAS + MODE DÉMO ═══════════ */
function isDemoActive() {
    return getOrders().some(o => DEMO_CLIENTS.includes(o.client));
}
function renderGuide() {
    // Le contenu du guide est dans index.html (statique) ; ici on rafraîchit juste l'état démo.
    const b = $('demo-banner');
    if (b) b.innerHTML = isDemoActive()
        ? '<div class="demo-banner">🧪 <span><strong>MODE DÉMO actif :</strong> des données fictives sont visibles. Purgez-les avant l\u2019ouverture commerciale.</span><button class="btn btn-danger btn-sm" onclick="purgeDemoData()">Purger maintenant</button></div>'
        : '';
}
const OB_ITEMS = [
    {id: 'pw', label: 'Changer les mots de passe par défaut (onglet Équipe)'},
    {id: 'wa', label: 'Renseigner le vrai numéro WhatsApp + les numéros MoMo (onglet Contenu du site)'},
    {id: 'prices', label: 'Vérifier les prix et photos du catalogue (onglet Tarifs)'},
    {id: 'test', label: 'Tester une commande complète de bout en bout (mode démo)'},
    {id: 'backup', label: 'Exporter une première sauvegarde (onglet Équipe)'}
];
function renderOnboarding() {
    const box = $('onboarding-box');
    if (!box) return;
    if (store.get('lv_onboarding_hidden', false)) { box.innerHTML = ''; return; }
    const done = store.get('lv_onboarding', {});
    const remaining = OB_ITEMS.filter(i => !done[i.id]).length;
    box.innerHTML = `
        <div class="onboarding">
            <h3>🚀 Premiers pas — ${remaining} étape(s) restante(s)</h3>
            <p class="muted">Cochez au fur et à mesure. Tout est détaillé dans l'onglet 📖 Guide.</p>
            <ul class="ob-list">
                ${OB_ITEMS.map(i => `<li><label><input type="checkbox" ${done[i.id] ? 'checked' : ''} onchange="toggleOnboarding('${i.id}', this.checked)"><span class="${done[i.id] ? 'done' : ''}">${i.label}</span></label></li>`).join('')}
            </ul>
            <div class="ob-foot">
                <button class="btn btn-outline btn-sm" onclick="showAdmin('guide')">📖 Ouvrir le guide</button>
                <button class="btn btn-outline btn-sm" onclick="hideOnboarding()">Masquer définitivement</button>
            </div>
        </div>`;
}
function toggleOnboarding(id, checked) {
    const done = store.get('lv_onboarding', {});
    done[id] = checked;
    store.set('lv_onboarding', done);
    renderOnboarding();
}
function hideOnboarding() { store.set('lv_onboarding_hidden', true); renderOnboarding(); }

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
    renderGuide(); renderOnboarding();
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
    if (cloudOn()) LVCloud.patchOrder(id, {status: o.status}).catch(e => toast('Synchro : ' + e.message, 'error'));
    toast('Statut : ' + o.status, 'success');
    openOrderModal(id); renderAdminOrders();
}
function recordPayment(id, kind) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    const tx = getTx();
    let newTx = null;
    if (kind === 'acompte' && o.payStatus === 'Non payé') {
        o.payStatus = 'Acompte versé';
        if (o.status === 'En attente') o.status = 'Confirmée';
        newTx = {id: Date.now(), date: todayISO(), type: 'recette', category: 'Acompte', label: `Acompte ${o.ref} — ${o.client}`, amount: o.acompte, ref: o.ref};
        toast('Acompte encaissé ✓', 'success');
    } else if (kind === 'solde' && o.payStatus === 'Acompte versé') {
        o.payStatus = 'Soldé';
        newTx = {id: Date.now(), date: todayISO(), type: 'recette', category: 'Solde', label: `Solde ${o.ref} — ${o.client}`, amount: o.solde, ref: o.ref};
        toast('Commande soldée ✓', 'success');
    }
    if (newTx) tx.push(newTx);
    saveTx(tx); saveOrders(orders);
    if (cloudOn() && newTx) {
        Promise.all([
            LVCloud.patchOrder(id, {pay_status: o.payStatus, status: o.status}),
            LVCloud.insertTx(newTx)
        ]).catch(e => toast('Synchro : ' + e.message, 'error'));
    }
    openOrderModal(id); renderAdminOrders();
}
function payMusician(id) {
    const orders = getOrders();
    const o = orders.find(x => x.id === id);
    o.musicianPaid = true;
    saveOrders(orders);
    const tx = getTx();
    const newTx = {id: Date.now(), date: todayISO(), type: 'depense', category: 'Paiement prestataire', label: `Musiciens — ${o.ref}`, amount: o.musicianCost, ref: o.ref};
    tx.push(newTx);
    saveTx(tx);
    if (cloudOn()) {
        Promise.all([LVCloud.patchOrder(id, {musician_paid: true}), LVCloud.insertTx(newTx)])
            .catch(e => toast('Synchro : ' + e.message, 'error'));
    }
    toast('Musiciens payés 🎷', 'success');
    if (!$('order-modal').classList.contains('hidden')) openOrderModal(id);
    renderAdminOrders();
    if (!$('admin-providers').classList.contains('hidden')) renderProviders();
}
function deleteOrder(id) {
    if (!isSuper()) { toast('Suppression réservée au Super Admin 🔒', 'error'); return; }
    if (!confirm('Supprimer définitivement cette commande ?')) return;
    saveOrders(getOrders().filter(o => o.id !== id));
    if (cloudOn()) LVCloud.deleteOrder(id).catch(e => toast('Synchro : ' + e.message, 'error'));
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
                <h1 style="margin:0;font-size:26px">🎁 ${esc(getSite().brand.replace(/\*/g, ''))}</h1>
                <p style="margin:4px 0;font-size:13px">${esc(getSite().address)} · ${esc(getSite().phone)} · ${esc(getSite().email)}</p>
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
    const newTx = {
        id: Date.now(), date: $('tx-date').value || todayISO(),
        type: $('tx-type').value, category: $('tx-category').value,
        label: $('tx-label').value.trim(), amount: Number($('tx-amount').value)
    };
    tx.push(newTx);
    saveTx(tx);
    if (cloudOn()) LVCloud.insertTx(newTx).catch(e => toast('Synchro : ' + e.message, 'error'));
    $('tx-label').value = ''; $('tx-amount').value = '';
    renderFinance();
    toast('Opération enregistrée ✓', 'success');
    return false;
}
function deleteTx(id) {
    if (!isSuper()) { toast('Suppression réservée au Super Admin 🔒', 'error'); return; }
    if (!confirm('Supprimer cette opération ?')) return;
    saveTx(getTx().filter(t => t.id !== id));
    if (cloudOn()) LVCloud.deleteTx(id).catch(e => toast('Synchro : ' + e.message, 'error'));
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
    const newProv = {id: Date.now(), name: $('prov-name').value.trim(), skill: $('prov-skill').value.trim(), phone: $('prov-phone').value.trim(), cost: Number($('prov-cost').value) || 0};
    provs.push(newProv);
    saveProviders(provs);
    if (cloudOn()) LVCloud.insertProvider(newProv).catch(e => toast('Synchro : ' + e.message, 'error'));
    $('provider-form').reset(); $('prov-cost').value = getSettings().musicCost;
    toggleProviderForm(); renderProviders();
    toast('Prestataire ajouté ✓', 'success');
    return false;
}
function deleteProvider(id) {
    if (!isSuper()) { toast('Suppression réservée au Super Admin 🔒', 'error'); return; }
    if (!confirm('Retirer ce prestataire ?')) return;
    saveProviders(getProviders().filter(p => p.id !== id));
    if (cloudOn()) LVCloud.deleteProvider(id).catch(e => toast('Synchro : ' + e.message, 'error'));
    renderProviders();
}

/* ═══════════ ADMIN : CATALOGUE (tout modifiable) ═══════════ */
function renderPricing() {
    const super_ = isSuper();
    const lock = super_ ? '' : '<div class="perm-note">🔒 Modification réservée au <strong>Super Admin</strong> (lecture seule).</div>';
    $('pricing-gateaux').innerHTML = lock + (gateaux().map(g => catalogEditorCard('gateau', g, !super_)).join('') || '<p class="muted">Aucun gâteau. Ajoutez-en un !</p>');
    $('pricing-prestations').innerHTML = prestations().map(p => catalogEditorCard('prestation', p, !super_)).join('') || '<p class="muted">Aucune prestation. Ajoutez-en une !</p>';
    $('btn-add-gateau').classList.toggle('hidden', !super_);
    $('btn-add-presta').classList.toggle('hidden', !super_);
    $('setting-acompte').value = getSettings().acompte;
    $('setting-remise').value = getSettings().remise;
    $('setting-music').value = getSettings().musicCost;
    document.querySelector('#admin-pricing .panel:last-child').classList.toggle('locked', !super_);
}
function catalogEditorCard(kind, it, ro) {
    const dis = ro ? 'disabled' : '';
    const f = (k) => `f-${kind}-${it.id}-${k}`;
    return `
    <div class="editor-card">
        <div class="editor-img">
            <img src="${it.img}" alt="${esc(it.name)}">
            ${ro ? '' : `
            <div class="editor-img-actions">
                <label class="btn-mini">📤 Uploader<input type="file" accept="image/*" class="hidden" onchange="uploadItemImage('${kind}','${it.id}',this)"></label>
                <button class="btn-mini" onclick="setItemImageUrl('${kind}','${it.id}')">🔗 URL</button>
                <button class="btn-mini" onclick="resetItemImage('${kind}','${it.id}')">↩ Défaut</button>
            </div>`}
        </div>
        <div class="editor-fields">
            <div class="form-row">
                <div class="form-group"><label>Nom</label><input id="${f('name')}" value="${esc(it.name)}" ${dis}></div>
                <div class="form-group"><label>Prix affiché (FCFA)</label><input id="${f('price')}" type="number" min="0" step="500" value="${it.price}" ${dis}></div>
            </div>
            <div class="form-row">
                <div class="form-group"><label>Badge <small class="muted">(vide = aucun)</small></label><input id="${f('badge')}" value="${esc(it.badge || '')}" placeholder="Ex : Best-seller, Nouveau…" ${dis}></div>
                <div class="form-group"><label>Couleur du badge</label><select id="${f('rose')}" ${dis}><option value="">Doré</option><option value="1" ${it.rose ? 'selected' : ''}>Rose</option></select></div>
            </div>
            <div class="form-group"><label>Description</label><textarea id="${f('desc')}" rows="2" ${dis}>${esc(it.desc)}</textarea></div>
            <div class="form-group"><label>Détails / inclus <small class="muted">(encadré ✔ côté client)</small></label><input id="${f('includes')}" value="${esc(it.includes || '')}" ${dis}></div>
            ${ro ? '' : `<div class="row-actions">
                <button class="btn-mini pay" onclick="saveCatalogItem('${kind}','${it.id}')">💾 Enregistrer</button>
                <button class="btn-mini danger" onclick="deleteCatalogItem('${kind}','${it.id}')">🗑 Supprimer du site</button>
            </div>`}
        </div>
    </div>`;
}
function saveCatalogItem(kind, id) {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    const cat = getCatalog();
    const it = (kind === 'gateau' ? cat.gateaux : cat.prestations).find(x => x.id === id);
    if (!it) return;
    const v = (k) => $('f-' + kind + '-' + id + '-' + k).value;
    it.name = v('name').trim() || it.name;
    it.price = Math.max(0, Number(v('price')) || 0);
    it.badge = v('badge').trim();
    it.rose = v('rose') === '1';
    it.desc = v('desc').trim();
    it.includes = v('includes').trim();
    if (saveCatalog(cat)) { renderCatalogs(); toast('« ' + it.name + ' » mis à jour ✓', 'success'); }
}
function uploadItemImage(kind, id, input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    processImageFile(file, (dataUrl) => {
        const cat = getCatalog();
        const it = (kind === 'gateau' ? cat.gateaux : cat.prestations).find(x => x.id === id);
        if (!it) return;
        it.img = dataUrl;
        if (saveCatalog(cat)) { renderCatalogs(); renderPricing(); toast('Photo mise à jour ✓', 'success'); }
    });
}
function setItemImageUrl(kind, id) {
    const url = prompt("Collez l'adresse (URL) de l'image :");
    if (!url || !url.trim()) return;
    const cat = getCatalog();
    const it = (kind === 'gateau' ? cat.gateaux : cat.prestations).find(x => x.id === id);
    if (!it) return;
    it.img = url.trim();
    if (saveCatalog(cat)) { renderCatalogs(); renderPricing(); toast('Photo mise à jour ✓', 'success'); }
}
function resetItemImage(kind, id) {
    const def = (kind === 'gateau' ? DEFAULT_GATEAUX : DEFAULT_PRESTATIONS).find(x => x.id === id);
    if (!def) { toast('Pas d\'image par défaut pour cet élément', 'error'); return; }
    const cat = getCatalog();
    const it = (kind === 'gateau' ? cat.gateaux : cat.prestations).find(x => x.id === id);
    if (!it) return;
    it.img = def.img;
    if (saveCatalog(cat)) { renderCatalogs(); renderPricing(); toast('Image par défaut restaurée ✓', 'success'); }
}
function addCatalogItem(kind) {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    const cat = getCatalog();
    const item = {
        id: 'c' + Date.now(),
        name: kind === 'gateau' ? 'Nouveau gâteau' : 'Nouvelle prestation',
        price: 20000,
        img: kind === 'gateau' ? 'images/gateau-vanille.jpg' : 'images/panier.jpg',
        badge: 'Nouveau', rose: false,
        desc: 'Décrivez ici votre création…',
        includes: 'Détails et options inclus…'
    };
    (kind === 'gateau' ? cat.gateaux : cat.prestations).push(item);
    if (saveCatalog(cat)) { renderCatalogs(); renderPricing(); toast('Élément ajouté — complétez ses infos puis 💾 ✓', 'success'); }
}
function deleteCatalogItem(kind, id) {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    if (!confirm("Supprimer cet élément du site ? (les anciennes commandes sont conservées)")) return;
    const cat = getCatalog();
    if (kind === 'gateau') cat.gateaux = cat.gateaux.filter(x => x.id !== id);
    else cat.prestations = cat.prestations.filter(x => x.id !== id);
    if (saveCatalog(cat)) { renderCatalogs(); renderPricing(); toast('Élément supprimé du site'); }
}
function saveSettings() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    const newSettings = {
        acompte: Math.min(100, Math.max(0, Number($('setting-acompte').value) || 30)),
        remise: Math.min(50, Math.max(0, Number($('setting-remise').value) || 0)),
        musicCost: Math.max(0, Number($('setting-music').value) || 0)
    };
    store.set('lv_settings', newSettings);
    pushContent('settings', newSettings);
    renderCatalogs();
    toast('Paramètres enregistrés ✓', 'success');
}

/* ═══════════ ADMIN : CONTENU DU SITE ═══════════ */
function renderSiteForm() {
    const s = getSite();
    const ro = !isSuper();
    $('site-lock-note').classList.toggle('hidden', isSuper());
    document.querySelectorAll('#admin-site .site-field').forEach(el => el.disabled = ro);
    document.querySelectorAll('#admin-site .site-img-actions').forEach(el => el.classList.toggle('hidden', ro));
    $('site-save-btn').classList.toggle('hidden', ro);
    $('site-reset-btn').classList.toggle('hidden', ro);
    $('site-brand').value = s.brand;
    $('site-promo-active').checked = !!s.promoActive;
    $('site-promo').value = s.promo;
    $('site-hero-badge').value = s.heroBadge;
    $('site-hero-title').value = s.heroTitle;
    $('site-hero-subtitle').value = s.heroSubtitle;
    $('site-cake-title').value = s.cakeInfoTitle;
    $('site-cake-text').value = s.cakeInfoText;
    $('site-phone').value = s.phone;
    $('site-whatsapp').value = s.whatsapp || '';
    $('site-payment').value = s.payment || '';
    $('site-email').value = s.email;
    $('site-address').value = s.address;
    $('site-hours').value = s.hours;
    $('site-base').value = s.baseOrders;
    $('site-hero-preview').src = s.heroImage;
    $('site-gateaux-preview').src = s.gateauxHero;
    $('site-presta-preview').src = s.prestaHero;
}
function saveSiteForm() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    const s = getSite();
    s.brand = $('site-brand').value.trim() || s.brand;
    s.promoActive = $('site-promo-active').checked;
    s.promo = $('site-promo').value.trim();
    s.heroBadge = $('site-hero-badge').value.trim();
    s.heroTitle = $('site-hero-title').value.trim();
    s.heroSubtitle = $('site-hero-subtitle').value.trim();
    s.cakeInfoTitle = $('site-cake-title').value.trim();
    s.cakeInfoText = $('site-cake-text').value.trim();
    s.phone = $('site-phone').value.trim();
    s.whatsapp = normalizePhone($('site-whatsapp').value);
    s.payment = $('site-payment').value.trim();
    s.email = $('site-email').value.trim();
    s.address = $('site-address').value.trim();
    s.hours = $('site-hours').value.trim();
    s.baseOrders = Math.max(0, Number($('site-base').value) || 0);
    if (saveSite(s)) { renderSiteContent(); renderCatalogs(); toast('Contenu du site mis à jour ✓', 'success'); }
}
function uploadSiteImage(key, input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    processImageFile(file, (dataUrl) => {
        const s = getSite();
        s[key] = dataUrl;
        if (saveSite(s)) { renderSiteContent(); renderSiteForm(); toast('Image mise à jour ✓', 'success'); }
    });
}
function setSiteImageUrl(key) {
    const url = prompt("Collez l'adresse (URL) de l'image :");
    if (!url || !url.trim()) return;
    const s = getSite();
    s[key] = url.trim();
    if (saveSite(s)) { renderSiteContent(); renderSiteForm(); toast('Image mise à jour ✓', 'success'); }
}
function resetSiteImage(key) {
    const s = getSite();
    s[key] = DEFAULT_SITE[key];
    if (saveSite(s)) { renderSiteContent(); renderSiteForm(); toast('Image par défaut restaurée ✓', 'success'); }
}
function resetAllContent() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    if (!confirm('Tout restaurer : catalogue, photos, textes, tarifs et coordonnées par défaut ?')) return;
    store.del('lv_catalog'); store.del('lv_site'); store.del('lv_prices');
    pushContent('catalog', getCatalog());
    pushContent('site', getSite());
    renderCatalogs(); renderSiteContent(); renderPricing(); renderSiteForm();
    toast('Contenu restauré par défaut ✓', 'success');
}

/* ═══════════ ADMIN : ÉQUIPE ═══════════ */
async function renderTeam() {
    let admins = getAdmins();
    if (cloudOn() && LVCloud.isAdmin()) {
        try { admins = await LVCloud.listUsers(); } catch (e) { toast('Comptes : ' + e.message, 'error'); }
    }
    const perms = {
        super: ['✔ Tableau de bord & statistiques', '✔ Commandes (créer, modifier, supprimer)', '✔ Finances (ajouter, supprimer, exports)', '✔ Prestataires & paiements', '✔ Catalogue : prix, photos, textes, ajout/suppression', '✔ Contenu du site : hero, bannières, coordonnées', '✔ Gestion des comptes'],
        manager: ['✔ Tableau de bord & statistiques', '✔ Commandes (créer, modifier)', '✔ Finances (ajouter, exports)', '✔ Prestataires & paiements', '✖ Catalogue, photos & tarifs (lecture seule)', '✖ Contenu du site (lecture seule)', '✖ Gestion des comptes']
    };
    $('team-grid').innerHTML = admins.map(a => `
        <div class="team-card">
            <span class="admin-avatar">${esc(a.name.charAt(0))}</span>
            <h4>${esc(a.name)}</h4>
            <div class="role ${a.role}">${a.role === 'super' ? '👑 SUPER ADMIN' : '🧑‍💼 MANAGER'}</div>
            <div><code>${esc(a.username)}</code> · <small class="muted">${esc(a.title)}</small></div>
            <ul>${perms[a.role].map(p => `<li>${p}</li>`).join('')}</ul>
            ${currentAdmin().username === a.username ? '<p style="margin-top:10px"><span class="badge badge-info">C\'est vous</span></p>' : ''}
            ${isSuper() && currentAdmin().username !== a.username ? `<p style="margin-top:10px"><button class="btn-mini danger" onclick="removeTeamMember('${esc(a.username)}')">🗑 Retirer ce compte</button></p>` : ''}
        </div>`).join('');
    const manage = $('team-manage');
    if (manage) manage.classList.toggle('hidden', !isSuper());
}
async function saveTeamMember(e) {
    e.preventDefault();
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return false; }
    const username = $('tm-user').value.trim().toLowerCase();
    const name = $('tm-name').value.trim();
    const title = $('tm-title').value.trim();
    const role = $('tm-role').value;
    const pw = $('tm-pass').value;
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) { toast('Identifiant invalide : 3 à 30 caractères, sans espace.', 'error'); return false; }
    if (!name) { toast('Indiquez le nom affiché.', 'error'); return false; }
    if (pw && pw.length < 10) { toast('Mot de passe : 10 caractères minimum.', 'error'); return false; }
    if (cloudOn()) {
        try {
            const res = await LVCloud.saveUser({username, password: pw, role, name, title});
            if (!res || !res.ok) { toast((res && res.error) || 'Échec de l\u2019enregistrement.', 'error'); return false; }
        } catch (err) { toast('Comptes : ' + err.message, 'error'); return false; }
        $('team-form').reset();
        renderTeam();
        toast('Compte enregistré côté serveur ✓', 'success');
        return false;
    }
    const admins = getAdmins();
    const rec = admins.find(a => a.username === username);
    const hash = pw ? await hashPassword(username, pw) : null;
    if (rec) {
        rec.role = role; rec.name = name; rec.title = title;
        if (hash) { rec.passwordHash = hash; rec.mustChangePassword = true; }
    } else {
        if (!pw) { toast('Un mot de passe est requis pour un nouveau compte.', 'error'); return false; }
        admins.push({username, passwordHash: hash, role, name, title, mustChangePassword: true});
    }
    saveAdmins(admins);
    $('team-form').reset();
    renderTeam();
    toast('Compte enregistré ✓', 'success');
    return false;
}
async function removeTeamMember(username) {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    if (!confirm('Retirer définitivement le compte « ' + username + ' » ?')) return;
    if (cloudOn()) {
        try {
            const res = await LVCloud.deleteUser(username);
            if (!res || !res.ok) { toast((res && res.error) || 'Suppression refusée.', 'error'); return; }
        } catch (err) { toast('Comptes : ' + err.message, 'error'); return; }
    } else {
        saveAdmins(getAdmins().filter(a => a.username !== username));
    }
    renderTeam();
    toast('Compte retiré', 'success');
}
async function changePassword(e) {
    e.preventDefault();
    if (cloudOn()) {
        if ($('pw-new').value !== $('pw-confirm').value) { toast('Les nouveaux mots de passe ne correspondent pas', 'error'); return false; }
        if ($('pw-new').value.length < 10) { toast('Mot de passe trop court : 10 caractères minimum.', 'error'); return false; }
        try {
            const res = await LVCloud.changePassword($('pw-old').value, $('pw-new').value);
            if (!res || !res.ok) { toast((res && res.error) || 'Échec', 'error'); return false; }
        } catch (err) { toast('Mot de passe : ' + err.message, 'error'); return false; }
        const sess = store.get('lv_session', null);
        if (sess && sess.profile) { sess.profile.mustChangePassword = false; store.set('lv_session', sess); }
        $('pw-old').value = $('pw-new').value = $('pw-confirm').value = '';
        toast('Mot de passe mis à jour ✓ (enregistré sur le serveur)', 'success');
        renderTeam();
        return false;
    }
    const admins = getAdmins();
    const me = currentAdmin();
    const record = admins.find(a => a.username === me.username);
    const oldHash = record.passwordHash || (record.password ? await hashPassword(record.username, record.password) : '');
    if ((await hashPassword(record.username, $('pw-old').value)) !== oldHash) { toast('Mot de passe actuel incorrect', 'error'); return false; }
    if ($('pw-new').value !== $('pw-confirm').value) { toast('Les nouveaux mots de passe ne correspondent pas', 'error'); return false; }
    if ($('pw-new').value.length < 10) { toast('Mot de passe trop court : 10 caractères minimum.', 'error'); return false; }
    record.passwordHash = await hashPassword(record.username, $('pw-new').value);
    delete record.password;
    record.mustChangePassword = false;
    saveAdmins(admins);
    $('pw-old').value = $('pw-new').value = $('pw-confirm').value = '';
    toast('Mot de passe mis à jour ✓', 'success');
    return false;
}
function resetDemoData() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    if (!confirm('Charger des données de TEST ? Vos données actuelles seront remplacées. Pensez à purger avant l\u2019ouverture.')) return;
    store.del('lv_seeded');
    seedDemo(true);
    if (cloudOn()) {
        Promise.all([LVCloud.upsertOrders(getOrders()), LVCloud.upsertTx(getTx())])
            .catch(e => toast('Synchro : ' + e.message, 'error'));
    }
    renderDashboard();
    toast('Données de test chargées (à purger avant l\u2019ouverture)', 'success');
}
const DEMO_CLIENTS = ['Marc D.', 'Aïcha B.', 'Kevin N.', 'Larissa T.', 'Junior E.', 'Sandrine K.', 'Frank O.', 'Nadia S.'];
function purgeDemoData() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    if (!confirm('Supprimer toutes les commandes de démonstration et leurs transactions liées ?')) return;
    const orders = getOrders();
    const demoRefs = new Set(orders.filter(o => DEMO_CLIENTS.includes(o.client)).map(o => o.ref));
    const demoIds = orders.filter(o => DEMO_CLIENTS.includes(o.client)).map(o => o.id);
    saveOrders(orders.filter(o => !demoRefs.has(o.ref)));
    saveTx(getTx().filter(t => !t.ref || !demoRefs.has(t.ref)));
    if (cloudOn() && demoIds.length) LVCloud.deleteOrders(demoIds).catch(e => toast('Synchro : ' + e.message, 'error'));
    store.del('lv_seeded');
    renderDashboard(); renderAdminOrders(); renderFinance();
    toast(`Données de démonstration purgées (${demoRefs.size} commande(s) retirée(s)) ✓`, 'success');
}
function exportBackup() {
    if (!isSuper()) { toast('Réservé au Super Admin 🔒', 'error'); return; }
    const backup = {
        app: 'LV Surprise Event', version: 2, exportedAt: new Date().toISOString(),
        orders: getOrders(), tx: getTx(), providers: getProviders(),
        catalog: getCatalog(), site: getSite(), settings: getSettings()
        // Les comptes admin (hashés) ne sont PAS exportés par sécurité.
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'}));
    a.download = 'lv-backup-' + todayISO() + '.json';
    a.click();
    toast('Sauvegarde téléchargée ⬇ Conservez-la en lieu sûr.', 'success');
}
function importBackup(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file || !isSuper()) return;
    if (!confirm('Importer cette sauvegarde ? Vos données actuelles seront remplacées.')) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const b = JSON.parse(reader.result);
            if (!b || b.app !== 'LV Surprise Event') throw new Error('format');
            if (Array.isArray(b.orders)) saveOrders(b.orders);
            if (Array.isArray(b.tx)) saveTx(b.tx);
            if (Array.isArray(b.providers)) saveProviders(b.providers);
            if (b.catalog) store.set('lv_catalog', b.catalog);
            if (b.site) store.set('lv_site', b.site);
            if (b.settings) store.set('lv_settings', b.settings);
            store.set('lv_seeded', true);
            if (cloudOn() && LVCloud.canWrite()) {
                Promise.all([
                    LVCloud.setContent('catalog', getCatalog()),
                    LVCloud.setContent('site', getSite()),
                    LVCloud.setContent('settings', getSettings())
                ]).catch(e => toast('Synchro : ' + e.message, 'error'));
            }
            if (cloudOn()) {
                Promise.all([LVCloud.upsertOrders(getOrders()), LVCloud.upsertTx(getTx()), LVCloud.upsertProviders(getProviders())])
                    .catch(e => toast('Synchro : ' + e.message, 'error'));
            }
            renderCatalogs(); renderSiteContent(); renderDashboard();
            toast('Sauvegarde importée ✓', 'success');
        } catch { toast('Fichier de sauvegarde invalide.', 'error'); }
    };
    reader.readAsText(file);
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
document.addEventListener('DOMContentLoaded', async () => {
    await migrateAdminPasswords(); // mots de passe en clair → hashés
    migrateOldOrders();
    if (currentAdmin()) renderCloudBadge();
    // ⚠️ Plus de données de démonstration automatiques : le site démarre vide.
    // Les données de test se chargent uniquement via l'admin (Zone dangereuse).
    renderCatalogs();
    renderCart();
    renderSiteContent();
    updateCartBadge();
    newCaptcha();
    const dateInput = $('date');
    if (dateInput) { dateInput.min = todayISO(); dateInput.max = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10); }
    document.querySelectorAll('.modal-overlay').forEach(m =>
        m.addEventListener('click', (e) => { if (e.target === m) m.classList.add('hidden'); }));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    });
    window.addEventListener('resize', () => {
        if (!$('admin-app').classList.contains('hidden') && !$('admin-dashboard').classList.contains('hidden')) renderDashboard();
    });

    /* ── Synchro serveur en arrière-plan (le site s'affiche sans attendre) ── */
    if (cloudOn()) {
        syncPublicContent().then(ok => {
            if (!ok) return;
            renderCatalogs(); renderCart(); renderSiteContent();
            toast('Tarifs et contenus à jour ✓', 'success');
        });
        LVCloud.restore().then(prof => {
            if (prof) store.set('lv_session', {username: prof.username, profile: prof, at: Date.now()});
            if (currentAdmin()) renderCloudBadge();
        });
    }
});
