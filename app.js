// =================================================================================
// CONFIGURAÇÃO DO SUPABASE
// =================================================================================
const SUPABASE_URL = 'https://kyruwsjzyppdwlyxnlon.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aCvS33rtBCig4H5lG-cvHg_tQHIZE4j';

// Usamos 'supabaseClient' para evitar conflito com o objeto global da biblioteca
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =================================================================================
// ROTEADOR DE PÁGINA
// =================================================================================
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('login-page')) {
        setupLoginPage();
    } else if (document.body.classList.contains('app-page')) {
        setupMainPage();
    }
});

// =================================================================================
// LÓGICA DA PÁGINA DE LOGIN
// =================================================================================
function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            errorMessage.textContent = 'E-mail ou senha inválidos.';
            console.error("Erro no login:", error.message);
            return;
        }
        window.location.href = 'index.html';
    });
}

// =================================================================================
// LÓGICA DA PÁGINA PRINCIPAL
// =================================================================================
async function setupMainPage() {
    // 1. Verificar Sessão
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) { 
        window.location.href = 'login.html'; 
        return; 
    }

    let allRestaurants = [];

    // 2. Elementos do DOM
    const restaurantesLista = document.getElementById('restaurantes-lista');
    const addRestaurantForm = document.getElementById('add-restaurant-form');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    const galleryModalOverlay = document.getElementById('gallery-modal-overlay');
    const galleryModalContent = document.getElementById('gallery-modal-content');
    const galleryRestaurantName = document.getElementById('gallery-restaurant-name');
    const galleryGrid = document.getElementById('gallery-grid');
    const uploadPhotoForm = document.getElementById('upload-photo-form');
    const photoInput = document.getElementById('photo-input');
    const uploadStatus = document.getElementById('upload-status');
    const closeGalleryModalBtn = document.getElementById('close-gallery-modal-btn');
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

    // Mapeamento exato das colunas do seu banco
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

    // --- FUNÇÕES DE RENDERIZAÇÃO ---

            // --- FUNÇÃO PARA EXCLUIR ---
        async function deleteRestaurant(id) {
            if (!confirm('Tens a certeza que queres apagar este restaurante da lista?')) return;
        
            const { error } = await supabaseClient.from('restaurantes').delete().eq('id', id);
            
            if (error) {
                alert('Erro ao apagar: ' + error.message);
            } else {
                allRestaurants = allRestaurants.filter(r => r.id != id);
                renderCards();
            }
        }
        
        // --- FUNÇÃO PARA A FILA (MÁXIMO 5) ---
        async function toggleQueue(id) {
            const res = allRestaurants.find(r => r.id == id);
            const naFilaAtual = allRestaurants.filter(r => r[columnMap.na_fila] === true);
        
            // Se ele NÃO está na fila e tentamos adicionar
            if (!res[columnMap.na_fila] && naFilaAtual.length >= 5) {
                alert('🚨 Calma! A fila já tem 5 favoritos. Decide um desses primeiro antes de adicionar outro para não aumentar a indecisão!');
                return;
            }
        
            const novoEstado = !res[columnMap.na_fila];
            const { error } = await supabaseClient.from('restaurantes')
                .update({ [columnMap.na_fila]: novoEstado })
                .eq('id', id);
        
            if (error) {
                alert('Erro ao atualizar fila.');
            } else {
                res[columnMap.na_fila] = novoEstado;
                renderCards();
            }
        }

    function renderCards() {
        const searchTerm = (searchInput.value || '').toLowerCase();
        const sortOption = sortSelect.value;

        let processed = [...allRestaurants].filter(res => {
            const nome = res[columnMap.nome] || '';
            return nome.toLowerCase().includes(searchTerm);
        });

        // Ordenação
        if (sortOption === 'alfabetica') {
            processed.sort((a, b) => (a[columnMap.nome] || '').localeCompare(b[columnMap.nome] || ''));
        } else if (sortOption === 'cozinha') {
            processed.sort((a, b) => (a[columnMap.tipo_cozinha] || '').localeCompare(b[columnMap.tipo_cozinha] || ''));
        } else if (sortOption === 'visitados') {
            processed.sort((a, b) => (b[columnMap.visitado] === true ? 1 : 0) - (a[columnMap.visitado] === true ? 1 : 0));
        }

        restaurantesLista.innerHTML = '';
        if (processed.length === 0) {
            restaurantesLista.innerHTML = '<p>Nenhum restaurante encontrado.</p>';
            return;
        }

        processed.forEach(res => {
            const hasPhotos = res.fotos && res.fotos.length > 0;
            const card = document.createElement('div');
            // Dentro do processed.forEach(res => { ... })
            const isNaFila = res[columnMap.na_fila] === true;
            
            card.className = `restaurante-card ${isNaFila ? 'card-na-fila' : ''}`;
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="editable" data-field="nome">${res[columnMap.nome] || 'Sem nome'}</h3>
                    <button class="btn-delete" title="Excluir Restaurante"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="card-body">
                    <p><i class="fa-solid fa-kitchen-set"></i> <span class="editable" data-field="tipo_cozinha">${res[columnMap.tipo_cozinha] || '---'}</span></p>
                    <p><i class="fa-solid fa-star"></i> <span class="editable" data-field="nota">${res[columnMap.nota] || 'N/A'}</span></p>
                </div>
                <div class="card-footer">
                    <button class="btn-queue ${isNaFila ? 'active' : ''}" data-id="${res.id}">
                        <i class="fa-solid fa-list-ol"></i> ${isNaFila ? 'NA FILA' : 'POR NA FILA'}
                    </button>
                    <span class="toggle" data-field="visitado" data-value="${res[columnMap.visitado]}">
                        ${res[columnMap.visitado] ? '✅ Já Fomos' : '⏳ Pendente'}
                    </span>
                    <button class="btn-fotos ${hasPhotos ? 'btn-fotos-active' : ''}"><i class="fa-solid fa-camera"></i></button>
                </div>
            `;
            
            card.className = 'restaurante-card';
            card.dataset.id = res.id; // Importante: usar ID para updates

            card.innerHTML = `
                <div class="card-header"><h3 class="editable" data-field="nome">${res[columnMap.nome] || 'Sem nome'}</h3></div>
                <div class="card-body">
                    <p><i class="fa-solid fa-kitchen-set"></i> <span class="editable" data-field="tipo_cozinha">${res[columnMap.tipo_cozinha] || '---'}</span></p>
                    <p><i class="fa-solid fa-star"></i> <span class="editable" data-field="nota">${res[columnMap.nota] || 'N/A'}</span></p>
                    <p><i class="fa-solid fa-map-marker-alt"></i> <span class="editable" data-field="localizacao">${res[columnMap.localizacao] || '---'}</span></p>
                </div>
                <div class="card-footer">
                    <span class="toggle" data-field="visitado" data-value="${res[columnMap.visitado]}">
                        ${res[columnMap.visitado] ? '✅ Já Fomos' : '⏳ Pendente'}
                    </span>
                    <button class="btn-fotos ${hasPhotos ? 'btn-fotos-active' : ''}"><i class="fa-solid fa-camera"></i> Fotos</button>
                    <a href="${res[columnMap.instagram] || '#'}" target="_blank" class="social-link"><i class="fa-brands fa-instagram"></i></a>
                </div>
            `;
            restaurantesLista.appendChild(card);
        });
    }

    // --- FUNÇÕES DE BANCO DE DADOS ---

    async function fetchAndDisplayRestaurantes() {
        const { data, error } = await supabaseClient.from('restaurantes').select('*');
        if (error) {
            console.error('Erro ao buscar:', error);
            return;
        }
        allRestaurants = data || [];
        renderCards();
    }

    async function saveUpdate(id, fieldKey, value) {
        const columnName = columnMap[fieldKey];
        const { error } = await supabaseClient.from('restaurantes').update({ [columnName]: value }).eq('id', id);

        if (error) {
            alert('Erro ao salvar no banco.');
        } else {
            const res = allRestaurants.find(r => r.id == id);
            if (res) res[columnName] = value;
            renderCards();
        }
    }

    // --- INTERAÇÕES DO USUÁRIO ---

    restaurantesLista.addEventListener('click', (e) => {
        const card = e.target.closest('.restaurante-card');
        if (!card) return;
        const id = card.dataset.id;
        const res = allRestaurants.find(r => r.id == id);
        // 1. Botão de Apagar
        if (e.target.closest('.btn-delete')) {
            deleteRestaurant(id);
        } 
        // 2. Botão Na Fila
        else if (e.target.closest('.btn-queue')) {
            toggleQueue(id);
        }

        // 3. Botão de Fotos
        if (e.target.closest('.btn-fotos')) {
            abrirModalDeFotos(res);
        } 
        // 4. Toggle Visitado
        else if (e.target.classList.contains('toggle')) {
            const current = e.target.dataset.value === 'true';
            saveUpdate(id, 'visitado', !current);
        }
        // 5. Edição Inline
        else if (e.target.classList.contains('editable')) {
            handleInlineEdit(e.target, id);
        }
    });

    function handleInlineEdit(element, id) {
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
            if (String(val) !== originalValue) saveUpdate(id, field, val);
            else element.innerHTML = originalValue;
        };

        input.onblur = finish;
        input.onkeydown = (e) => { if (e.key === 'Enter') finish(); if (e.key === 'Escape') element.innerHTML = originalValue; };
    }

    // --- GESTÃO DE FOTOS ---

    function abrirModalDeFotos(res) {
        galleryModalContent.dataset.currentId = res.id;
        galleryRestaurantName.textContent = res[columnMap.nome];
        galleryGrid.innerHTML = '';
        
        const fotos = res.fotos || [];
        if (fotos.length === 0) {
            galleryGrid.innerHTML = '<p>Nenhuma foto ainda.</p>';
        } else {
            fotos.forEach(url => {
                const div = document.createElement('div');
                div.className = 'gallery-photo-wrapper';
                div.innerHTML = `<img src="${url}"><button class="delete-photo-btn" data-url="${url}">&times;</button>`;
                galleryGrid.appendChild(div);
            });
        }
        galleryModalOverlay.classList.remove('hidden');
    }

    uploadPhotoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = galleryModalContent.dataset.currentId;
        const file = photoInput.files[0];
        if (!file || !id) return;

        uploadStatus.textContent = 'Enviando...';
        const fileName = `${id}/${Date.now()}-${file.name}`;
        
        const { error: upError } = await supabaseClient.storage.from('fotos-restaurantes').upload(fileName, file);
        if (upError) { uploadStatus.textContent = 'Erro no upload.'; return; }

        const { data: urlData } = supabaseClient.storage.from('fotos-restaurantes').getPublicUrl(fileName);
        const res = allRestaurants.find(r => r.id == id);
        const novasFotos = [...(res.fotos || []), urlData.publicUrl];

        await supabaseClient.from('restaurantes').update({ fotos: novasFotos }).eq('id', id);
        res.fotos = novasFotos;
        abrirModalDeFotos(res);
        renderCards();
        uploadStatus.textContent = 'Foto salva!';
    });

    // Eventos de fechar Modais
    closeGalleryModalBtn.onclick = () => galleryModalOverlay.classList.add('hidden');
    lightboxCloseBtn.onclick = () => lightboxOverlay.classList.add('hidden');

    // Logout
    document.getElementById('logout-button').onclick = async () => {
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    };

    // Inicialização
    searchInput.oninput = renderCards;
    sortSelect.onchange = renderCards;
    fetchAndDisplayRestaurantes();
}
