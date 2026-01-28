// =================================================================================
// 1. CONFIGURAÇÃO E ESTADO GLOBAL
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
// 2. ROTEADOR
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
// 3. LÓGICA PRINCIPAL (APP)
// =================================================================================
async function setupMainPage() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    const restaurantesLista = document.getElementById('restaurantes-lista');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    // --- RENDERIZAÇÃO DOS CARDS ---
    function renderCards() {
        const searchTerm = (searchInput.value || '').toLowerCase();
        const sortOption = sortSelect.value;

        let processed = [...allRestaurants].filter(res => 
            (res[columnMap.nome] || '').toLowerCase().includes(searchTerm)
        );

        // Lógica de Ordenação
        processed.sort((a, b) => {
            if (sortOption === 'alfabetica') return (a[columnMap.nome] || '').localeCompare(b[columnMap.nome] || '');
            if (sortOption === 'visitados') return (b[columnMap.visitado] ? 1 : 0) - (a[columnMap.visitado] ? 1 : 0);
            if (sortOption === 'fila') return (b[columnMap.na_fila] ? 1 : 0) - (a[columnMap.na_fila] ? 1 : 0);
            return 0;
        });

        restaurantesLista.innerHTML = '';
        processed.forEach(res => {
            const isNaFila = res[columnMap.na_fila] === true;
            const nomePK = res[columnMap.nome];
            
            // Tratamento da Nota
            const notaOriginal = res[columnMap.nota];
            const notaExibicao = (notaOriginal === null || notaOriginal === '') ? 'Sem Avaliação' : notaOriginal;

            const card = document.createElement('div');
            card.className = `restaurante-card ${isNaFila ? 'card-na-fila' : ''}`;
            card.dataset.id = nomePK;

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="editable" data-field="nome">${nomePK}</h3>
                    <button class="btn-delete" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="card-body">
                    <p><i class="fa-solid fa-kitchen-set"></i> <span class="editable" data-field="tipo_cozinha">${res[columnMap.tipo_cozinha] || '---'}</span></p>
                    <p><i class="fa-solid fa-star"></i> <span class="editable" data-field="nota">${notaExibicao}</span></p>
                    <p><i class="fa-solid fa-map-marker-alt"></i> <span class="editable" data-field="localizacao">${res[columnMap.localizacao] || 'Endereço não informado'}</span></p>
                </div>
                <div class="card-footer">
                    <button class="btn-queue ${isNaFila ? 'active' : ''}">
                        <i class="fa-solid fa-list-ol"></i> ${isNaFila ? 'NA FILA' : 'POR NA FILA'}
                    </button>
                    <span class="toggle" data-field="visitado" data-value="${res[columnMap.visitado]}">
                        ${res[columnMap.visitado] ? '✅ Já Fomos' : '⏳ Pendente'}
                    </span>
                    <div class="actions">
                        <button class="btn-fotos" title="Fotos"><i class="fa-solid fa-camera"></i></button>
                        <a href="${res[columnMap.instagram] || '#'}" target="_blank" class="social-link" title="Instagram">
                            <i class="fa-brands fa-instagram"></i>
                        </a>
                    </div>
                </div>
            `;
            restaurantesLista.appendChild(card);
        });
    }

    // --- FUNÇÕES DE BANCO ---
    async function saveUpdate(nomePK, fieldKey, value) {
        const { error } = await supabaseClient.from('restaurantes')
            .update({ [columnMap[fieldKey]]: value })
            .eq('Nome do Restaurante', nomePK);
        if (!error) {
            const res = allRestaurants.find(r => r[columnMap.nome] === nomePK);
            if (res) res[columnMap[fieldKey]] = value;
            renderCards();
        } else {
            alert("Erro ao atualizar banco.");
        }
    }

    async function toggleQueue(nomePK) {
        const res = allRestaurants.find(r => r[columnMap.nome] === nomePK);
        const naFilaCount = allRestaurants.filter(r => r[columnMap.na_fila] === true).length;
        if (!res[columnMap.na_fila] && naFilaCount >= 5) {
            alert('A fila já tem 5 favoritos! Resolva um antes de adicionar outro.');
            return;
        }
        await saveUpdate(nomePK, 'na_fila', !res[columnMap.na_fila]);
    }

    async function deleteRestaurant(nomePK) {
        if (!confirm(`Excluir definitivamente "${nomePK}"?`)) return;
        const { error } = await supabaseClient.from('restaurantes').delete().eq('Nome do Restaurante', nomePK);
        if (!error) {
            allRestaurants = allRestaurants.filter(r => r[columnMap.nome] !== nomePK);
            renderCards();
        }
    }

    // --- EDIÇÃO INLINE ---
    function handleInlineEdit(element, nomePK) {
        if (element.querySelector('input')) return;
        const field = element.dataset.field;
        const originalValue = element.textContent;
        const input = document.createElement('input');
        
        input.type = field === 'nota' ? 'number' : 'text';
        if (field === 'nota') { input.min = 0; input.max = 10; input.step = 0.5; }
        
        // Limpa o input se for um valor padrão de "vazio"
        const isPlaceholder = ['Sem Avaliação', '---', 'Endereço não informado'].includes(originalValue);
        input.value = isPlaceholder ? '' : originalValue;
        
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();

        const finish = () => {
            let val = input.value;
            if (field === 'nota') val = val === '' ? null : Math.min(10, Math.max(0, parseFloat(val)));
            
            if (String(val) !== originalValue) saveUpdate(nomePK, field, val);
            else renderCards(); 
        };

        input.onblur = finish;
        input.onkeydown = (e) => { if (e.key === 'Enter') finish(); if (e.key === 'Escape') renderCards(); };
    }

    // --- EVENTOS ---
    restaurantesLista.addEventListener('click', (e) => {
        const card = e.target.closest('.restaurante-card');
        if (!card) return;
        const nomePK = card.dataset.id;

        if (e.target.closest('.btn-delete')) deleteRestaurant(nomePK);
        else if (e.target.closest('.btn-queue')) toggleQueue(nomePK);
        else if (e.target.classList.contains('toggle')) {
            const field = e.target.dataset.field;
            const current = e.target.dataset.value === 'true';
            saveUpdate(nomePK, field, !current);
        } else if (e.target.classList.contains('editable')) {
            handleInlineEdit(e.target, nomePK);
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
