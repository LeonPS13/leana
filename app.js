// =================================================================================
// CONFIGURAÇÃO GLOBAL
// =================================================================================
const SUPABASE_URL = 'https://kyruwsjzyppdwlyxnlon.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aCvS33rtBCig4H5lG-cvHg_tQHIZE4j';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const columnMap = {
    nome: 'Nome do Restaurante',
    tipo_cozinha: 'Tipo de Cozinha',
    faixa_preco: 'Faixa de Preço',
    nota: 'Nota (0-10)',
    localizacao: 'Localização',
    visitado: 'Já visitou?',
    instagram: 'Instagram',
    fotos: 'fotos',
    na_fila: 'na_fila' 
};

let allRestaurants = [];

// =================================================================================
// ROTEADOR
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('login-page')) setupLoginPage();
    else if (document.body.classList.contains('app-page')) setupMainPage();
});

function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) alert('Erro: ' + error.message);
        else window.location.href = 'index.html';
    });
}

// =================================================================================
// LÓGICA DO APP
// =================================================================================
async function setupMainPage() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    const restaurantesLista = document.getElementById('restaurantes-lista');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const addRestaurantForm = document.getElementById('add-restaurant-form');

    // --- RENDERIZAÇÃO ---
    function renderCards() {
        const searchTerm = (searchInput.value || '').toLowerCase();
        const sortOption = sortSelect.value;

        let processed = [...allRestaurants].filter(res => 
            (res[columnMap.nome] || '').toLowerCase().includes(searchTerm)
        );

        // LÓGICA DE ORDENAÇÃO ATUALIZADA
        processed.sort((a, b) => {
            if (sortOption === 'alfabetica') {
                return (a[columnMap.nome] || '').localeCompare(b[columnMap.nome] || '');
            } else if (sortOption === 'visitados') {
                return (b[columnMap.visitado] ? 1 : 0) - (a[columnMap.visitado] ? 1 : 0);
            } else if (sortOption === 'fila') {
                // Coloca quem está na fila (true) antes de quem não está (false)
                return (b[columnMap.na_fila] ? 1 : 0) - (a[columnMap.na_fila] ? 1 : 0);
            }
            return 0;
        });

        restaurantesLista.innerHTML = '';
        processed.forEach(res => {
            const isNaFila = res[columnMap.na_fila] === true;
            const nomeId = res[columnMap.nome];

            const card = document.createElement('div');
            card.className = `restaurante-card ${isNaFila ? 'card-na-fila' : ''}`;
            card.dataset.id = nomeId;

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="editable" data-field="nome">${nomeId}</h3>
                    <button class="btn-delete"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="card-body">
                    <p><i class="fa-solid fa-kitchen-set"></i> <span class="editable" data-field="tipo_cozinha">${res[columnMap.tipo_cozinha] || '---'}</span></p>
                    <p><i class="fa-solid fa-star"></i> <span class="editable" data-field="nota">${res[columnMap.nota] || 'N/A'}</span></p>
                </div>
                <div class="card-footer">
                    <button class="btn-queue ${isNaFila ? 'active' : ''}">
                        <i class="fa-solid fa-list-ol"></i> ${isNaFila ? 'NA FILA' : 'POR NA FILA'}
                    </button>
                    <span class="toggle" data-field="visitado" data-value="${res[columnMap.visitado]}">
                        ${res[columnMap.visitado] ? '✅ Já Fomos' : '⏳ Pendente'}
                    </span>
                    <button class="btn-fotos"><i class="fa-solid fa-camera"></i></button>
                </div>
            `;
            restaurantesLista.appendChild(card);
        });
    }

    // --- OPERAÇÕES NO BANCO ---
    async function saveUpdate(nomeId, fieldKey, value) {
        const { error } = await supabaseClient.from('restaurantes')
            .update({ [columnMap[fieldKey]]: value })
            .eq('Nome do Restaurante', nomeId);
        if (!error) {
            const res = allRestaurants.find(r => r[columnMap.nome] === nomeId);
            if (res) res[columnMap[fieldKey]] = value;
            renderCards();
        }
    }

    async function toggleQueue(nomeId) {
        const res = allRestaurants.find(r => r[columnMap.nome] === nomeId);
        const naFilaCount = allRestaurants.filter(r => r[columnMap.na_fila] === true).length;
        if (!res[columnMap.na_fila] && naFilaCount >= 5) {
            alert('A fila já está cheia (máx 5)!');
            return;
        }
        await saveUpdate(nomeId, 'na_fila', !res[columnMap.na_fila]);
    }

    async function deleteRestaurant(nomeId) {
        if (!confirm(`Excluir "${nomeId}"?`)) return;
        const { error } = await supabaseClient.from('restaurantes').delete().eq('Nome do Restaurante', nomeId);
        if (!error) {
            allRestaurants = allRestaurants.filter(r => r[columnMap.nome] !== nomeId);
            renderCards();
        }
    }

    // --- EVENTOS ---
    restaurantesLista.addEventListener('click', (e) => {
        const card = e.target.closest('.restaurante-card');
        if (!card) return;
        const nomeId = card.dataset.id;

        if (e.target.closest('.btn-delete')) deleteRestaurant(nomeId);
        else if (e.target.closest('.btn-queue')) toggleQueue(nomeId);
        else if (e.target.classList.contains('toggle')) {
            saveUpdate(nomeId, e.target.dataset.field, e.target.dataset.value !== 'true');
        }
    });

    // --- INICIALIZAÇÃO ---
    async function fetchAll() {
        const { data, error } = await supabaseClient.from('restaurantes').select('*');
        if (!error) { allRestaurants = data || []; renderCards(); }
    }

    searchInput.oninput = renderCards;
    sortSelect.onchange = renderCards;
    fetchAll();
}
