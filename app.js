// =================================================================================
// 1. CONFIGURAÇÃO GLOBAL
// =================================================================================
const SUPABASE_URL = 'https://kyruwsjzyppdwlyxnlon.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aCvS33rtBCig4H5lG-cvHg_tQHIZE4j';

// Usamos supabaseClient para evitar conflitos com a biblioteca global
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapeamento exato das colunas do seu banco de dados
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

// Estado global para armazenar os dados e evitar buscas repetidas
let allRestaurants = [];

// =================================================================================
// 2. ROTEADOR DE PÁGINAS
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('login-page')) {
        setupLoginPage();
    } else if (document.body.classList.contains('app-page')) {
        setupMainPage();
    }
});

// =================================================================================
// 3. PÁGINA DE LOGIN
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
// 4. PÁGINA PRINCIPAL (APP)
// =================================================================================
async function setupMainPage() {
    // Proteção de Rota: Se não estiver logado, volta pro login
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    // Seleção de Elementos do DOM
    const restaurantesLista = document.getElementById('restaurantes-lista');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const addRestaurantForm = document.getElementById('add-restaurant-form');
    
    // Elementos do Modal de Galeria
    const galleryModalOverlay = document.getElementById('gallery-modal-overlay');
    const galleryGrid = document.getElementById('gallery-grid');
    const galleryRestaurantName = document.getElementById('gallery-restaurant-name');
    const uploadPhotoForm = document.getElementById('upload-photo-form');
    const photoInput = document.getElementById('photo-input');
    const uploadStatus = document.getElementById('upload-status');

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

    function renderCards() {
        const searchTerm = (searchInput.value || '').toLowerCase();
        const sortOption = sortSelect.value;

        // Filtro de busca
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
            const nomePK = res[columnMap.nome]; // Nossa Chave Primária

            const card = document.createElement('div');
            card.className = `restaurante-card ${isNaFila ? 'card-na-fila' : ''}`;
            card.dataset.id = nomePK; // Salva o nome para referência nos cliques

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="editable" data-field="nome">${nomePK || 'Sem nome'}</h3>
                    <button class="btn-delete" title="Excluir Restaurante"><i class="fa-solid fa-trash"></i></button>
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

    // --- FUNÇÕES DE LÓGICA E BANCO ---

    async function toggleQueue(nomeId) {
        const res = allRestaurants.find(r => r[columnMap.nome] === nomeId);
        if (!res) return;

        const countNaFila = allRestaurants.filter(r => r[columnMap.na_fila] === true).length;

        if (!res[columnMap.na_fila] && countNaFila >= 5) {
            alert('🚨 Já temos 5 restaurantes na fila! Escolha um desses antes de adicionar mais.');
            return;
        }

        const novoEstado = !res[columnMap.na_fila];
        const { error } = await supabaseClient.from('restaurantes')
            .update({ [columnMap.na_fila]: novoEstado })
            .eq('Nome do Restaurante', nomeId);

        if (!error) {
            res[columnMap.na_fila] = novoEstado;
            renderCards();
        }
    }

    async function deleteRestaurant(nomeId) {
        if (!confirm(`Deseja mesmo remover "${nomeId}" da lista?`)) return;

        const { error } = await supabaseClient.from('restaurantes')
            .delete()
            .eq('Nome do Restaurante', nomeId);

        if (!error) {
            allRestaurants = allRestaurants.filter(r => r[columnMap.nome] !== nomeId);
            renderCards();
        } else {
            alert('Erro ao excluir do banco.');
        }
    }

    async function saveUpdate(nomeId, fieldKey, value) {
        const columnName = columnMap[fieldKey];
        const { error } = await supabaseClient.from('restaurantes')
            .update({ [columnName]: value })
            .eq('Nome do Restaurante', nomeId);

        if (!error) {
            const res = allRestaurants.find(r => r[columnMap.nome] === nomeId);
            if (res) res[columnName] = value;
            renderCards();
        }
    }

    // --- EVENTOS (DELEGAÇÃO DE CLIQUE) ---
    // 
    restaurantesLista.addEventListener('click', (e) => {
        const card = e.target.closest('.restaurante-card');
        if (!card) return;
        const nomeId = card.dataset.id;

        if (e.target.closest('.btn-delete')) {
            deleteRestaurant(nomeId);
        } else if (e.target.closest('.btn-queue')) {
            toggleQueue(nomeId);
        } else if (e.target.classList.contains('toggle')) {
            const field = e.target.dataset.field;
            const current = e.target.dataset.value === 'true';
            saveUpdate(nomeId, field, !current);
        } else if (e.target.classList.contains('editable')) {
            handleInlineEdit(e.target, nomeId);
        } else if (e.target.closest('.btn-fotos')) {
            abrirModalDeFotos(nomeId);
        }
    });

    // --- EDIÇÃO INLINE ---
    function handleInlineEdit(element, nomeId) {
        if (element.querySelector('input')) return;
        const field = element.dataset.field;
        const originalValue = element.textContent;
        const input = document.createElement('input');
        
        input.type = field === 'nota' ? 'number' : 'text';
        if (field === 'nota') { input.min = 0; input.max = 10; input.step = 0.5; }
        
        input.value = (originalValue === 'N/A' || originalValue === '---') ? '' : originalValue;
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();

        const finish = () => {
            let val = input.value;
            if (field === 'nota') {
                val = val === '' ? null : Math.min(10, Math.max(0, parseFloat(val)));
            }
            if (String(val) !== originalValue) {
                saveUpdate(nomeId, field, val);
            } else {
                element.innerHTML = originalValue;
            }
        };

        input.onblur = finish;
        input.onkeydown = (e) => { 
            if (e.key === 'Enter') finish(); 
            if (e.key === 'Escape') element.innerHTML = originalValue; 
        };
    }

    // --- INICIALIZAÇÃO ---
    async function fetchAll() {
        const { data, error } = await supabaseClient.from('restaurantes').select('*');
        if (!error) {
            allRestaurants = data || [];
            renderCards();
        }
    }

    searchInput.oninput = renderCards;
    sortSelect.onchange = renderCards;
    fetchAll();
}
