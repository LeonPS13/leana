// =================================================================================
// CONFIGURAÇÃO DO SUPABASE
// =================================================================================
if (typeof supabase === 'undefined') {
    const SUPABASE_URL = 'https://kyruwsjzyppdwlyxnlon.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_aCvS33rtBCig4H5lG-cvHg_tQHIZE4j';
    
    // Note que aqui não usamos 'const' novamente se a variável for global
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

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

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('password-input').value;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
            errorMessage.textContent = 'E-mail ou senha inválidos.';
            return;
        }
        window.location.href = 'index.html';
    });
}

// =================================================================================
// LÓGICA DA PÁGINA PRINCIPAL
// =================================================================================
async function setupMainPage() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    let allRestaurants = [];

    // Elementos do DOM
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
        fotos: 'fotos'
    };

    function renderCards() {
        const searchTerm = searchInput.value.toLowerCase();
        const sortOption = sortSelect.value;

        let processedRestaurants = [...allRestaurants].filter(restaurant => {
            const nome = restaurant[columnMap.nome] || '';
            return nome.toLowerCase().includes(searchTerm);
        });

        // Ordenação
        processedRestaurants.sort((a, b) => {
            if (sortOption === 'alfabetica') {
                return (a[columnMap.nome] || '').localeCompare(b[columnMap.nome] || '');
            } else if (sortOption === 'cozinha') {
                return (a[columnMap.tipo_cozinha] || '').localeCompare(b[columnMap.tipo_cozinha] || '');
            } else if (sortOption === 'visitados') {
                return (b[columnMap.visitado] ? 1 : 0) - (a[columnMap.visitado] ? 1 : 0);
            }
            return 0;
        });

        restaurantesLista.innerHTML = '';
        if (processedRestaurants.length === 0) {
            restaurantesLista.innerHTML = '<p>Nenhum restaurante encontrado.</p>';
            return;
        }

        processedRestaurants.forEach(restaurante => {
            const card = document.createElement('div');
            card.classList.add('restaurante-card');
            // IMPORTANTE: Usamos o ID real do banco para referenciar o card
            card.dataset.id = restaurante.id; 
            
            const hasPhotos = restaurante.fotos && restaurante.fotos.length > 0;
            const photosButtonClass = hasPhotos ? 'btn-fotos-active' : '';

            card.innerHTML = `
                <div class="card-header">
                    <h3 class="editable" data-field="nome">${restaurante[columnMap.nome] || 'Nome não definido'}</h3>
                </div>
                <div class="card-body">
                    <p><i class="fa-solid fa-kitchen-set"></i> <span class="editable" data-field="tipo_cozinha">${restaurante[columnMap.tipo_cozinha] || 'Não informado'}</span></p>
                    <p><i class="fa-solid fa-dollar-sign"></i> <span class="editable" data-field="faixa_preco">${restaurante[columnMap.faixa_preco] || 'Não informado'}</span></p>
                    <p><i class="fa-solid fa-star"></i> <span class="editable" data-field="nota">${restaurante[columnMap.nota] || 'N/A'}</span></p>
                    <p><i class="fa-solid fa-map-marker-alt"></i> <span class="editable" data-field="localizacao">${restaurante[columnMap.localizacao] || 'Não informado'}</span></p>
                </div>
                <div class="card-footer">
                     <span class="toggle" data-field="visitado" data-value="${restaurante[columnMap.visitado]}">
                        ${restaurante[columnMap.visitado] ? 'Já Fomos!' : 'Pendente'}
                     </span>
                     <button class="btn-fotos ${photosButtonClass}"><i class="fa-solid fa-camera"></i> Fotos</button>
                     <div class="actions">
                        <a href="${restaurante[columnMap.instagram] || '#'}" target="_blank" class="social-link"><i class="fa-brands fa-instagram"></i></a>
                     </div>
                </div>`;
            restaurantesLista.appendChild(card);
        });
    }

    async function saveUpdate(id, fieldKey, value) {
        const columnName = columnMap[fieldKey];
        const { error } = await supabase.from('restaurantes').update({ [columnName]: value }).eq('id', id);

        if (error) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao salvar. Verifique sua conexão.');
        } else {
            // Atualiza o estado local para evitar novo fetch
            const index = allRestaurants.findIndex(r => r.id == id);
            if (index !== -1) allRestaurants[index][columnName] = value;
            renderCards();
        }
    }

    // Event Delegation para cliques nos cards
    restaurantesLista.addEventListener('click', (event) => {
        const card = event.target.closest('.restaurante-card');
        if (!card) return;
        const id = card.dataset.id;
        const restaurante = allRestaurants.find(r => r.id == id);

        if (event.target.closest('.btn-fotos')) {
            abrirModalDeFotos(restaurante);
        } else if (event.target.classList.contains('toggle')) {
            const fieldKey = event.target.dataset.field;
            const currentValue = event.target.dataset.value === 'true';
            saveUpdate(id, fieldKey, !currentValue);
        } else if (event.target.classList.contains('editable')) {
            handleInlineEdit(event.target, id, restaurante);
        }
    });

    function handleInlineEdit(element, id, restaurante) {
        if (element.querySelector('input')) return;

        const originalValue = element.textContent;
        const fieldKey = element.dataset.field;
        const input = document.createElement('input');
        
        input.type = (fieldKey === 'nota') ? 'number' : 'text';
        if (fieldKey === 'nota') {
            input.min = 0; input.max = 10; input.step = 0.5;
        }

        input.value = (originalValue === 'N/A' || originalValue === 'Não informado') ? '' : originalValue;
        element.innerHTML = '';
        element.appendChild(input);
        input.focus();

        const saveAndExit = () => {
            let newValue = input.value;

            if (fieldKey === 'nota') {
                const numeric = parseFloat(newValue);
                if (isNaN(numeric) || newValue.trim() === '') newValue = null;
                else newValue = Math.min(10, Math.max(0, numeric));
            }

            if (String(newValue) !== originalValue) {
                saveUpdate(id, fieldKey, newValue);
            } else {
                element.innerHTML = originalValue;
            }
        };

        input.addEventListener('blur', saveAndExit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') saveAndExit();
            if (e.key === 'Escape') element.innerHTML = originalValue;
        });
    }

    async function fetchAndDisplayRestaurantes() {
        const { data, error } = await supabase.from('restaurantes').select('*');
        if (error) {
            restaurantesLista.innerHTML = `<p style="color: red;">Erro ao carregar dados.</p>`;
            return;
        }
        allRestaurants = data || [];
        renderCards();
    }

    function abrirModalDeFotos(restaurante) {
        galleryModalContent.dataset.currentId = restaurante.id;
        galleryRestaurantName.textContent = restaurante[columnMap.nome];
        uploadStatus.textContent = '';
        uploadPhotoForm.reset();
        
        const fotos = restaurante.fotos || [];
        galleryGrid.innerHTML = fotos.length ? '' : '<p>Nenhuma foto adicionada.</p>';
        
        fotos.forEach(fotoUrl => {
            const wrapper = document.createElement('div');
            wrapper.className = 'gallery-photo-wrapper';
            wrapper.innerHTML = `
                <img src="${fotoUrl}">
                <button class="delete-photo-btn" data-url="${fotoUrl}"><i class="fa-solid fa-trash"></i></button>
            `;
            galleryGrid.appendChild(wrapper);
        });
        galleryModalOverlay.classList.remove('hidden');
    }

    // Lógica de Deletar Foto
    galleryGrid.addEventListener('click', async (event) => {
        const deleteBtn = event.target.closest('.delete-photo-btn');
        if (deleteBtn) {
            const urlToDelete = deleteBtn.dataset.url;
            const id = galleryModalContent.dataset.currentId;
            if (!confirm('Deletar esta foto?')) return;

            try {
                // Extrai o caminho do arquivo da URL do Supabase
                const filePath = urlToDelete.split('/public/fotos-restaurantes/')[1];
                await supabase.storage.from('fotos-restaurantes').remove([filePath]);

                const res = allRestaurants.find(r => r.id == id);
                const updatedPhotos = res.fotos.filter(u => u !== urlToDelete);
                
                await supabase.from('restaurantes').update({ fotos: updatedPhotos }).eq('id', id);
                res.fotos = updatedPhotos;
                
                deleteBtn.parentElement.remove();
                renderCards();
            } catch (err) {
                alert('Erro ao deletar foto.');
            }
        } else if (event.target.tagName === 'IMG') {
            openLightbox(event.target.src);
        }
    });

    // Upload de Foto
    uploadPhotoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = galleryModalContent.dataset.currentId;
        const file = photoInput.files[0];
        if (!file || !id) return;

        uploadStatus.textContent = 'Enviando...';
        try {
            const res = allRestaurants.find(r => r.id == id);
            const fileName = `${id}/${Date.now()}-${file.name}`;
            
            const { error: upError } = await supabase.storage.from('fotos-restaurantes').upload(fileName, file);
            if (upError) throw upError;

            const { data: urlData } = supabase.storage.from('fotos-restaurantes').getPublicUrl(fileName);
            const updatedPhotos = [...(res.fotos || []), urlData.publicUrl];

            await supabase.from('restaurantes').update({ fotos: updatedPhotos }).eq('id', id);
            res.fotos = updatedPhotos;

            abrirModalDeFotos(res); // Recarrega o modal
            renderCards();
            uploadStatus.textContent = 'Sucesso!';
        } catch (err) {
            uploadStatus.textContent = 'Erro no upload.';
        }
    });

    // Adicionar Novo Restaurante (Usando FormData para ser mais rápido)
    addRestaurantForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addRestaurantForm);
        
        const payload = {
            [columnMap.nome]: formData.get('res-nome'),
            [columnMap.tipo_cozinha]: formData.get('res-cozinha'),
            [columnMap.faixa_preco]: formData.get('res-preco'),
            [columnMap.localizacao]: formData.get('res-localizacao'),
            [columnMap.instagram]: formData.get('res-instagram'),
            [columnMap.aceita_vr]: !!formData.get('res-vr')
        };

        const { error } = await supabase.from('restaurantes').insert(payload);
        if (!error) {
            addRestaurantForm.reset();
            addRestaurantForm.parentElement.removeAttribute('open');
            fetchAndDisplayRestaurantes();
        }
    });

    // Funções de UI Auxiliares
    function fecharModalDeFotos() { galleryModalOverlay.classList.add('hidden'); }
    function openLightbox(url) { lightboxImage.src = url; lightboxOverlay.classList.remove('hidden'); }
    function closeLightbox() { lightboxOverlay.classList.add('hidden'); }

    closeGalleryModalBtn.addEventListener('click', fecharModalDeFotos);
    lightboxCloseBtn.addEventListener('click', closeLightbox);
    
    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    searchInput.addEventListener('input', renderCards);
    sortSelect.addEventListener('change', renderCards);

    fetchAndDisplayRestaurantes();
}
