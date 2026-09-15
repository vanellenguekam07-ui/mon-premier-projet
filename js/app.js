document.addEventListener('DOMContentLoaded', () => {
    // Navigation de vues
    const btnClient = document.getElementById('btn-view-client');
    const btnAdmin = document.getElementById('btn-view-admin');
    const sectionClient = document.getElementById('section-client');
    const sectionAdmin = document.getElementById('section-admin');

    btnClient.addEventListener('click', () => {
        sectionClient.classList.remove('hidden');
        sectionAdmin.classList.add('hidden');
        btnClient.classList.add('active');
        btnAdmin.classList.remove('active');
    });

    btnAdmin.addEventListener('click', () => {
        sectionAdmin.classList.remove('hidden');
        sectionClient.classList.add('hidden');
        btnAdmin.classList.add('active');
        btnClient.classList.remove('active');
        renderAdminOrders();
    });

    // Calculateur de tarif
    const checkboxes = document.querySelectorAll('input[name="service"]');
    const totalAmountEl = document.getElementById('total-amount');
    const selectedListEl = document.getElementById('selected-list');
    const form = document.getElementById('surprise-form');

    function updateCalculations() {
        let total = 0;
        const selectedServices = [];

        checkboxes.forEach(cb => {
            if (cb.checked) {
                total += parseInt(cb.value);
                selectedServices.push(cb.getAttribute('data-name'));
            }
        });

        totalAmountEl.textContent = total.toLocaleString('fr-FR');
        
        if (selectedServices.length > 0) {
            selectedListEl.innerHTML = '<strong>Services choisis :</strong> ' + selectedServices.join(', ');
        } else {
            selectedListEl.textContent = 'Aucune option sélectionnée';
        }
    }

    checkboxes.forEach(cb => cb.addEventListener('change', updateCalculations));

    // Enregistrement de la commande
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const selectedServices = [];
        let hasMusic = false;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                selectedServices.push(cb.getAttribute('data-name'));
                if (cb.getAttribute('data-name').includes('Animation musicale')) {
                    hasMusic = true;
                }
            }
        });

        if (selectedServices.length === 0) {
            alert('Veuillez sélectionner au moins une prestation !');
            return;
        }

        const newOrder = {
            id: Date.now(),
            client: document.getElementById('client_name').value,
            location: document.getElementById('location').value,
            date: document.getElementById('date').value,
            recipient: document.getElementById('recipient').value,
            services: selectedServices,
            total: totalAmountEl.textContent,
            hasMusic: hasMusic,
            musicianPaid: false
        };

        const orders = JSON.parse(localStorage.getItem('lv_orders') || '[]');
        orders.push(newOrder);
        localStorage.setItem('lv_orders', JSON.stringify(orders));

        alert('🎉 Commande enregistrée avec succès ! Retrouvez-la dans l\'Espace Admin.');
        form.reset();
        updateCalculations();
    });

    // Affichage Admin
    function renderAdminOrders() {
        const tbody = document.getElementById('admin-orders-list');
        const orders = JSON.parse(localStorage.getItem('lv_orders') || '[]');

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Aucune commande pour le moment.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map((order, index) => {
            let musicStatus = '<span class="badge badge-none">Non requis</span>';
            if (order.hasMusic) {
                musicStatus = order.musicianPaid 
                    ? '<span class="badge badge-paid">Musiciens Payés</span>' 
                    : `<button class="btn-pay" onclick="payMusician(${order.id})">Payer Musiciens (30 000 FCFA)</button>`;
            }

            return `
                <tr>
                    <td><strong>${order.client}</strong></td>
                    <td>${order.recipient}</td>
                    <td>${order.location}</td>
                    <td>${order.date.replace('T', ' à ')}</td>
                    <td>${order.services.join('<br>• ')}</td>
                    <td><strong>${order.total} FCFA</strong></td>
                    <td>${musicStatus}</td>
                    <td><button onclick="deleteOrder(${order.id})" style="color:red; cursor:pointer; background:none; border:none;">Supprimer</button></td>
                </tr>
            `;
        }).join('');
    }

    window.payMusician = function(id) {
        const orders = JSON.parse(localStorage.getItem('lv_orders') || '[]');
        const updatedOrders = orders.map(o => o.id === id ? {...o, musicianPaid: true} : o);
        localStorage.setItem('lv_orders', JSON.stringify(updatedOrders));
        renderAdminOrders();
    };

    window.deleteOrder = function(id) {
        if (confirm('Voulez-vous supprimer cette commande ?')) {
            let orders = JSON.parse(localStorage.getItem('lv_orders') || '[]');
            orders = orders.filter(o => o.id !== id);
            localStorage.setItem('lv_orders', JSON.stringify(orders));
            renderAdminOrders();
        }
    };
});