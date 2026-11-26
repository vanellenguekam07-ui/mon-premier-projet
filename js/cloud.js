/* ═══════════════════════════════════════════════════════════════
   LV SURPRISE EVENT — Couche « cloud » (Supabase)
   ───────────────────────────────────────────────────────────────
   Rôles RÉELS : chaque requête d'écriture est vérifiée par la base
   de données elle-même (jeton de session envoyé dans l'en-tête
   x-admin-token). Le navigateur ne peut donc PAS contourner un rôle.
     • super   : tous les droits
     • manager : commandes, finances, prestataires (pas tarifs/site/comptes)
     • visiteur: lecture du site + envoi d'une commande + suivi
   Aucune dépendance externe : simples appels HTTP (fetch).
   ═══════════════════════════════════════════════════════════════ */
window.LVCloud = (function () {
    'use strict';

    const cfg = window.LV_CONFIG || {};
    const URL_BASE = String(cfg.SUPABASE_URL || '').replace(/\/+$/, '');
    const KEY = String(cfg.SUPABASE_ANON_KEY || '');
    const enabled = Boolean(URL_BASE && KEY);

    const STORE_TOKEN = 'lv_cloud_token';
    const STORE_PROFILE = 'lv_cloud_profile';
    const state = { token: '', profile: null };

    try {
        state.token = localStorage.getItem(STORE_TOKEN) || '';
        state.profile = JSON.parse(localStorage.getItem(STORE_PROFILE) || 'null');
    } catch { /* stockage indisponible */ }

    /* ─────────── outils ─────────── */
    function friendlyError(status, raw) {
        const m = String(raw || '');
        if (status === 401 || status === 403 || /row-level security|permission denied/i.test(m)) {
            return 'Action refusée par le serveur : votre rôle ne permet pas cette modification.';
        }
        if (/duplicate key/i.test(m)) return 'Cet enregistrement existe déjà côté serveur.';
        if (/failed to fetch|network/i.test(m)) return 'Connexion au serveur impossible. Vérifiez votre réseau.';
        if (/invalid input syntax/i.test(m)) return 'Données invalides envoyées au serveur.';
        return m || ('Erreur serveur (' + status + ')');
    }

    function headers(extra) {
        const h = {
            apikey: KEY,
            Authorization: 'Bearer ' + KEY,
            'Content-Type': 'application/json',
            Accept: 'application/json'
        };
        if (state.token) h['x-admin-token'] = state.token;
        return Object.assign(h, extra || {});
    }

    async function request(path, { method = 'GET', body = null, prefer = null } = {}) {
        if (!enabled) throw new Error('Cloud non configuré.');
        let res;
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 12000); // jamais de blocage infini
        try {
            res = await fetch(URL_BASE + '/rest/v1/' + path, {
                method,
                headers: headers(prefer ? { Prefer: prefer } : null),
                body: body === null || body === undefined ? undefined : JSON.stringify(body),
                signal: ctrl.signal
            });
        } catch {
            throw new Error('Connexion au serveur impossible. Vérifiez votre réseau.');
        } finally {
            clearTimeout(timer);
        }
        const text = await res.text();
        let data = null;
        if (text) { try { data = JSON.parse(text); } catch { data = text; } }
        if (!res.ok) throw new Error(friendlyError(res.status, data && (data.message || data.hint || data.error)));
        return data;
    }

    const rpc = (fn, args = {}) => request('rpc/' + fn, { method: 'POST', body: args });

    /* ─────────── session admin ─────────── */
    function setSession(token, profile) {
        state.token = token || '';
        state.profile = profile || null;
        try {
            if (token) localStorage.setItem(STORE_TOKEN, token); else localStorage.removeItem(STORE_TOKEN);
            if (profile) localStorage.setItem(STORE_PROFILE, JSON.stringify(profile)); else localStorage.removeItem(STORE_PROFILE);
        } catch { /* stockage indisponible */ }
    }

    async function login(username, password) {
        const res = await rpc('admin_login', { p_username: username, p_password: password });
        if (!res || !res.ok) return { ok: false, error: (res && res.error) || 'Identifiant ou mot de passe incorrect.' };
        const profile = {
            username: res.username, role: res.role, name: res.name,
            title: res.title, mustChangePassword: !!res.must_change_password
        };
        setSession(res.token, profile);
        return { ok: true, profile };
    }

    async function restore() {
        if (!state.token) return null;
        try {
            const res = await rpc('admin_me');
            if (!res || !res.ok) { setSession('', null); return null; }
            const profile = {
                username: res.username, role: res.role, name: res.name,
                title: res.title, mustChangePassword: !!res.must_change_password
            };
            setSession(state.token, profile);
            return profile;
        } catch { return state.profile; } // hors ligne : on garde la session locale
    }

    async function logout() {
        try { await rpc('admin_logout'); } catch { /* on nettoie quand même */ }
        setSession('', null);
    }

    const role = () => (state.profile ? state.profile.role : null);
    const canWrite = () => Boolean(state.token && state.profile && state.profile.role === 'super');
    const isAdmin = () => Boolean(state.token && state.profile);

    /* ─────────── comptes / rôles ─────────── */
    async function listUsers() { return (await rpc('admin_list_users')) || []; }
    const saveUser = (u) => rpc('admin_save_user', {
        p_username: u.username, p_password: u.password || '',
        p_role: u.role, p_name: u.name || '', p_title: u.title || ''
    });
    const deleteUser = (username) => rpc('admin_delete_user', { p_username: username });
    const changePassword = (oldPw, newPw) => rpc('admin_change_password', { p_old: oldPw, p_new: newPw });

    /* ─────────── contenus publics (catalogue, textes, réglages) ─────────── */
    async function pullContent() {
        const rows = await request('site_content?select=key,value');
        const out = {};
        (rows || []).forEach(r => { out[r.key] = r.value; });
        return out;
    }
    async function setContent(key, value) {
        await request('site_content?on_conflict=key', {
            method: 'POST',
            body: { key, value, updated_at: new Date().toISOString() },
            prefer: 'resolution=merge-duplicates,return=minimal'
        });
    }

    /* ─────────── commandes ─────────── */
    const orderToRow = (o) => ({
        id: Number(o.id), ref: o.ref, client: o.client, phone: o.phone,
        location: o.location || '', date: o.date, time: o.time || '',
        recipient: o.recipient || '', message: o.message || '', items: o.items || [],
        subtotal: Math.round(o.subtotal || 0), discount: Math.round(o.discount || 0),
        total: Math.round(o.total || 0), acompte: Math.round(o.acompte || 0),
        solde: Math.round(o.solde || 0), pay_status: o.payStatus || 'Non payé',
        status: o.status || 'En attente', has_music: !!o.hasMusic,
        musician_paid: !!o.musicianPaid, musician_cost: Math.round(o.musicianCost || 0),
        created_at: o.createdAt || new Date().toISOString()
    });
    const rowToOrder = (r) => ({
        id: Number(r.id), ref: r.ref, client: r.client, phone: r.phone,
        location: r.location || '', date: r.date, time: r.time || '',
        recipient: r.recipient || '', message: r.message || '', items: r.items || [],
        subtotal: r.subtotal, discount: r.discount, total: r.total,
        acompte: r.acompte, solde: r.solde, payStatus: r.pay_status, status: r.status,
        hasMusic: r.has_music, musicianPaid: r.musician_paid, musicianCost: r.musician_cost,
        createdAt: r.created_at
    });

    const insertOrder = (o) => request('orders', { method: 'POST', body: orderToRow(o), prefer: 'return=minimal' });
    const listOrders = async () => (await request('orders?select=*&order=created_at.desc')).map(rowToOrder);
    const patchOrder = (id, fields) => request('orders?id=eq.' + Number(id), {
        method: 'PATCH', body: fields, prefer: 'return=minimal'
    });
    const deleteOrder = (id) => request('orders?id=eq.' + Number(id), { method: 'DELETE', prefer: 'return=minimal' });
    const upsertOrders = (list) => (list && list.length)
        ? request('orders?on_conflict=id', { method: 'POST', body: list.map(orderToRow), prefer: 'resolution=merge-duplicates,return=minimal' })
        : Promise.resolve();
    const deleteOrders = (ids) => (ids && ids.length)
        ? request('orders?id=in.(' + ids.map(Number).join(',') + ')', { method: 'DELETE', prefer: 'return=minimal' })
        : Promise.resolve();
    async function trackOrder(ref, phone) {
        return rpc('track_order', { p_ref: ref, p_phone: phone });
    }

    /* ─────────── finances ─────────── */
    const txToRow = (t) => ({
        id: Number(t.id), date: t.date, type: t.type, category: t.category || 'Autre',
        label: t.label || '', amount: Math.round(t.amount || 0), ref: t.ref || null
    });
    const rowToTx = (r) => ({ id: Number(r.id), date: r.date, type: r.type, category: r.category, label: r.label, amount: r.amount, ref: r.ref });
    const listTx = async () => (await request('transactions?select=*&order=created_at.desc')).map(rowToTx);
    const insertTx = (t) => request('transactions', { method: 'POST', body: txToRow(t), prefer: 'return=minimal' });
    const deleteTx = (id) => request('transactions?id=eq.' + Number(id), { method: 'DELETE', prefer: 'return=minimal' });
    const upsertTx = (list) => (list && list.length)
        ? request('transactions?on_conflict=id', { method: 'POST', body: list.map(txToRow), prefer: 'resolution=merge-duplicates,return=minimal' })
        : Promise.resolve();

    /* ─────────── prestataires ─────────── */
    const provToRow = (p) => ({
        id: Number(p.id), name: p.name, skill: p.skill || '', phone: p.phone || '', cost: Math.round(p.cost || 0)
    });
    const rowToProv = (r) => ({ id: Number(r.id), name: r.name, skill: r.skill, phone: r.phone, cost: r.cost });
    const listProviders = async () => (await request('providers?select=*&order=created_at.desc')).map(rowToProv);
    const insertProvider = (p) => request('providers', { method: 'POST', body: provToRow(p), prefer: 'return=minimal' });
    const deleteProvider = (id) => request('providers?id=eq.' + Number(id), { method: 'DELETE', prefer: 'return=minimal' });
    const upsertProviders = (list) => (list && list.length)
        ? request('providers?on_conflict=id', { method: 'POST', body: list.map(provToRow), prefer: 'resolution=merge-duplicates,return=minimal' })
        : Promise.resolve();

    return {
        enabled, URL_BASE,
        login, logout, restore, role, canWrite, isAdmin,
        getProfile: () => state.profile,
        listUsers, saveUser, deleteUser, changePassword,
        pullContent, setContent,
        insertOrder, listOrders, patchOrder, deleteOrder, upsertOrders, deleteOrders, trackOrder,
        listTx, insertTx, deleteTx, upsertTx,
        listProviders, insertProvider, deleteProvider, upsertProviders
    };
})();
