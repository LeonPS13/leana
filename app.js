// =================================================================================
// 1. CONFIGURAÇÃO GLOBAL E CONEXÃO
// =================================================================================
const SB_URL = 'https://kyruwsjzyppdwlyxnlon.supabase.co';
const SB_KEY = 'sb_publishable_aCvS33rtBCig4H5lG-cvHg_tQHIZE4j';

// Instância única do Supabase
const supabaseClient = window.supabase.createClient(SB_URL, SB_KEY);

// Mapeamento de colunas (JS -> Banco de Dados)
const columnMap = {
    nome: 'Nome do Restaurante',
    tipo_cozinha: 'Tipo de Cozinha',
    faixa_preco: 'Faixa de Preço',
    nota: 'Nota (0-10)',
    localizacao: 'Localização',
    visitado: 'Já visitou?',
    instagram: 'Instagram',
    aceita_vr: 'Aceita VR',
    fotos: 'fotos',
    na_fila: 'na_fila' 
};

// Estado global da aplicação
let allRestaurants = [];

// =================================================================================
// 2. ROTEADOR
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('login-page')) {
        setupLoginPage();
    } else if (document.body.classList.contains('app-page')) {
        setupMainPage();
    }
});

// =================================================================================
// 3. LÓGICA DE LOGIN
// =================================================================================
function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            alert('Erro no login: ' + error.message);
            return;
        }
        window.location.href = 'index.html';
    });
}

// =================================================================================
// 4. LÓGICA DA PÁGINA PRINCIPAL
// =================================================================================
async function setupMainPage() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    // Seleção de elementos do DOM
    const restaurantesLista = document.getElementById('restaurantes-lista');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const addRestaurantForm = document.getElementById('add-restaurant-form');
    
    // Elementos da Galeria/Modal
    const galleryModalOverlay = document.getElementById('gallery-modal-overlay');
    const galleryModalContent = document.getElementById('gallery-modal-content');
    const uploadPhotoForm = document.getElementById('upload-photo-form');
    const photoInput = document.getElementById('photo-input');

    // --- FUNÇÕES DE INTERFACE ---

    function renderCards() {
        const searchTerm = (searchInput.value || '').toLowerCase();
        const sortOption = sortSelect.value;

        let processed = [...allRestaurants].filter(res => 
            (res[columnMap.nome] || '').toLowerCase().includes(searchTerm)
        );

        // Ordenação
        if (sortOption === 'alfabetica') {
            processed.sort((a, b) => (a[columnMap.nome] || '').localeCompare(b[columnMap.nome] || ''));
        } else if (sortOption === 'visitados') {
            processed.sort((a, b) => (b[columnMap.visitado] ? 1 : 0) - (a[columnMap.visitado] ? 1 : 0));
        }

        restaurantesLista.innerHTML = '';
        processed.forEach(res => {
            const isNaFila = res[columnMap.na_fila] === true;
            const hasPhotos = res.fotos && res.fotos.length > 0;

            const card = document.createElement('div');
            card.className = `restaurante-card ${isNaFila ? 'card-na-fila' : ''}`;
            card.dataset.id = res.id;

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="editable" data-field="nome">${res[columnMap.nome] || 'Sem nome'}</h3>
                    <button class="btn-delete" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="card-body">
                    <p><i class="fa-solid fa-kitchen-set"></i> <span class="editable" data-field="tipo_cozinha">${res[columnMap.tipo_cozinha] || '---'}</span></p>
                    <p><i class="fa-solid fa-star"></i> <span class="editable" data-field="nota">${res[columnMap.nota] || 'N/A'}</span></p>
                    <p><i class="fa-solid fa-map-marker-alt"></i> <span class="editable" data-field="localizacao">${res[columnMap.localizacao] || '---'}</span></p>
                </div>
                <div class="card-footer">
                    <button class="btn-queue ${isNaFila ? 'active' : ''}">
                        <i class="fa-solid fa-list-ol"></i> ${isNaFila ? 'NA FILA' : 'POR NA FILA'}
                    </button>
                    <span class="toggle" data-field="visitado" data-value="${res[columnMap.visitado]}">
                        ${res[columnMap.visitado] ? '✅ Já Fomos' : '⏳ Pendente'}
                    </span>
                    <button class="btn-fotos ${hasPhotos ? 'btn-fotos-active' : ''}"><i class="fa-solid fa-camera"></i></button>
                </div>
            `;
            restaurantesLista.appendChild(card);
        });
    }

    // --- AÇÕES DO BANCO DE DADOS ---

    async function toggleQueue(id) {
        const res = allRestaurants.find(r => String(r.id) === String(id));
        const naFilaCount = allRestaurants.filter(r => r[columnMap.na_fila] === true).length;

        if (!res[columnMap.na_fila] && naFilaCount >= 5) {
            alert('🚨 Máximo de 5 na fila! Resolva uma pendência antes de adicionar outra.');
            return;
        }

        const novoEstado = !res[columnMap.na_fila];
        const { error } = await supabaseClient.from('restaurantes').update({ [columnMap.na_fila]: novoEstado }).eq('id', id);

        if (!error) { res[columnMap.na_fila] = novoEstado; renderCards(); }
    }

    async function deleteRestaurant(id) {
        if (!confirm('Deseja mesmo excluir este restaurante?')) return;
        const { error } = await supabaseClient.from('restaurantes').delete().eq('id', id);
        if (!error) { allRestaurants = allRestaurants.filter(r => String(r.id) !== String(id)); renderCards(); }
    }

    async function saveUpdate(id, fieldKey, value) {
        const columnName = columnMap[fieldKey];
        const { error } = await supabaseClient.from('restaurantes').update({ [columnName]: value }).eq('id', id);
        if (!error) { 
            const res = allRestaurants.find(r => String(r.id) === String(id));
            if (res) res[columnName] = value;
            renderCards();
        }
    }

    // --- EVENTOS ---

    restaurantesLista.addEventListener('click', (e) => {
        const card = e.target.closest('.restaurante-card');
        if (!card) return;
        const id = card.dataset.id;

        if (e.target.closest('.btn-delete')) deleteRestaurant(id);
        else if (e.target.closest('.btn-queue')) toggleQueue(id);
        else if (e.target.classList.contains('toggle')) {
            const field = e.target.dataset.field;
            const current = e.target.dataset.value === 'true';
            saveUpdate(id, field, !current);
        } else if (e.target.classList.contains('editable')) {
            handleInlineEdit(e.target, id);
        }
    });

    // (As funções handleInlineEdit, abrirModalDeFotos e upload permanecem as mesmas de antes, 
    // apenas garantindo que usem 'supabaseClient' e o id correto).

    async function fetchAll() {
        const { data, error } = await supabaseClient.from('restaurantes').select('*');
        if (!error) { allRestaurants = data || []; renderCards(); }
    }

    searchInput.oninput = renderCards;
    sortSelect.onchange = renderCards;
    fetchAll();
}
