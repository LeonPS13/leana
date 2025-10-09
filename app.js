// =================================================================================
// CONFIGURAÇÃO DO SUPABASE
// =================================================================================
const SUPABASE_URL = 'https://kyruwsjzyppdwlyxnlon.supabase.co';       // Cole sua URL aqui
const SUPABASE_ANON_KEY = 'sb_publishable_aCvS33rtBCig4H5lG-cvHg_tQHIZE4j'; // Cole sua Publishable Key aqui

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
            console.error("Erro no login:", error);
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

        let processedRestaurants = allRestaurants.filter(restaurant => {
            const nome = restaurant[columnMap.nome] || '';
            return nome.toLowerCase().includes(searchTerm);
        });

        switch (sortOption) {
            case 'alfabetica':
                processedRestaurants.sort((a, b) => (a[columnMap.nome] || '').localeCompare(b[columnMap.nome] || ''));
                break;
            case 'cozinha':
                processedRestaurants.sort((a, b) => (a[columnMap.tipo_cozinha] || '').localeCompare(b[columnMap.tipo_cozinha] || ''));
                break;
            case 'visitados':
                processedRestaurants.sort((a, b) => (b[columnMap.visitado] || false) - (a[columnMap.visitado] || false));
                break;
        }

        restaurantesLista.innerHTML = '';
        if (processedRestaurants.length === 0) {
            restaurantesLista.innerHTML = '<p>Nenhum restaurante encontrado.</p>';
        } else {
            processedRestaurants.forEach(restaurante => {
                const card = document.createElement('div');
                card.classList.add('restaurante-card');
                card.dataset.id = restaurante[columnMap.nome];
                card.dataset.restaurante = JSON.stringify(restaurante);
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
                         <span class="toggle" data-field="visitado" data-value="${restaurante[columnMap.visitado]}">${restaurante[columnMap.visitado] ? 'Já Fomos!' : 'Pendente'}</span>
                         <button class="btn-fotos"><i class="fa-solid fa-camera"></i> Fotos</button>
                         <div class="actions">
                            <a href="${restaurante[columnMap.instagram] || '#'}" target="_blank" class="social-link" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
                         </div>
                    </div>`;
                restaurantesLista.appendChild(card);
            });
        }
    }

    async function saveUpdate(restaurantName, fieldKey, value) {
        const columnName = columnMap[fieldKey];
        if (!columnName) return;
        const { error } = await supabase.from('restaurantes').update({ [columnName]: value }).eq('Nome do Restaurante', restaurantName);
        if (error) {
            console.error('Erro ao atualizar:', error);
            alert('Não foi possível salvar a alteração.');
        } else {
            const restaurantToUpdate = allRestaurants.find(r => r[columnMap.nome] === restaurantName);
            if (restaurantToUpdate) {
                restaurantToUpdate[columnMap[fieldKey]] = value;
            }
            renderCards();
        }
    }
    
    restaurantesLista.addEventListener('click', (event) => {
        const card = event.target.closest('.restaurante-card');
        if (!card) return;
        
        const restaurantName = card.dataset.id;

        if (event.target.closest('.btn-fotos')) {
            abrirModalDeFotos(restaurantName);
        } else if (event.target.classList.contains('toggle')) {
            const fieldKey = event.target.dataset.field;
            const currentValue = event.target.dataset.value === 'true';
            saveUpdate(restaurantName, fieldKey, !currentValue);
        } else if (event.target.classList.contains('editable')) {
            if (event.target.querySelector('input')) return;
            const originalValue = event.target.textContent;
            const fieldKey = event.target.dataset.field;
            const input = document.createElement('input');
            input.type = (fieldKey === 'nota') ? 'number' : 'text';
            input.value = originalValue === 'N/A' || originalValue === 'Não informado' ? '' : originalValue;
            event.target.innerHTML = '';
            event.target.appendChild(input);
            input.focus();
            const saveAndExit = () => {
                const newValue = input.value;
                if(newValue !== originalValue) {
                    saveUpdate(restaurantName, fieldKey, newValue);
                } else {
                    event.target.innerHTML = originalValue;
                }
            };
            input.addEventListener('blur', saveAndExit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') saveAndExit();
                else if (e.key === 'Escape') event.target.innerHTML = originalValue;
            });
        }
    });
    
    // CORREÇÃO APLICADA AQUI 👇
    async function fetchAndDisplayRestaurantes() {
        // Busca os dados sem tentar ordenar por uma coluna que não existe
        const { data: restaurantes, error } = await supabase.from('restaurantes').select('*');
        
        if (error) {
            console.error('Erro ao buscar dados:', error); 
            restaurantesLista.innerHTML = `<p style="color: red;">Erro ao carregar os restaurantes.</p>`;
            return;
        }
        
        allRestaurants = restaurantes || [];
        renderCards();
    }

    function abrirModalDeFotos(restaurantName) {
        galleryModalContent.dataset.currentRestaurant = restaurantName;
        galleryRestaurantName.textContent = `Fotos de: ${restaurantName}`;
        uploadStatus.textContent = '';
        uploadPhotoForm.reset();
        const cardElement = document.querySelector(`.restaurante-card[data-id="${restaurantName}"]`);
        const restaurante = JSON.parse(cardElement.dataset.restaurante);
        const fotos = restaurante.fotos || [];
        galleryGrid.innerHTML = '';
        if (fotos.length > 0) {
            fotos.forEach(fotoUrl => {
                const img = document.createElement('img');
                img.src = fotoUrl;
                galleryGrid.appendChild(img);
            });
        } else {
            galleryGrid.innerHTML = '<p>Nenhuma foto adicionada ainda.</p>';
        }
        galleryModalOverlay.classList.remove('hidden');
    }

    function fecharModalDeFotos() { galleryModalOverlay.classList.add('hidden'); }

    closeGalleryModalBtn.addEventListener('click', fecharModalDeFotos);
    galleryModalOverlay.addEventListener('click', (event) => { if (event.target === galleryModalOverlay) { fecharModalDeFotos(); }});

    uploadPhotoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const restaurantName = galleryModalContent.dataset.currentRestaurant;
        const file = photoInput.files[0];
        if (!file || !restaurantName) return;
        uploadStatus.textContent = 'Enviando...';
        try {
            const filePath = `${restaurantName.replace(/ /g, '_')}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('fotos-restaurantes').upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('fotos-restaurantes').getPublicUrl(filePath);
            const newPhotoUrl = urlData.publicUrl;
            const { data: currentData, error: selectError } = await supabase.from('restaurantes').select('fotos').eq('Nome do Restaurante', restaurantName).single();
            if (selectError && selectError.code !== 'PGRST116') throw selectError; // Ignora erro se não encontrar a linha
            const existingPhotos = currentData ? currentData.fotos || [] : [];
            const updatedPhotos = [...existingPhotos, newPhotoUrl];
            const { error: updateError } = await supabase.from('restaurantes').update({ fotos: updatedPhotos }).eq('Nome do Restaurante', restaurantName);
            if (updateError) throw updateError;
            uploadStatus.textContent = 'Foto enviada com sucesso!';
            uploadPhotoForm.reset();
            await fetchAndDisplayRestaurantes();
            abrirModalDeFotos(restaurantName);
        } catch (error) {
            console.error('Erro no processo de upload:', error);
            uploadStatus.textContent = 'Falha no envio. Tente novamente.';
        }
    });

    addRestaurantForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = {
            [columnMap.nome]: document.getElementById('res-nome').value,
            [columnMap.tipo_cozinha]: document.getElementById('res-cozinha').value,
            [columnMap.faixa_preco]: document.getElementById('res-preco').value,
            [columnMap.localizacao]: document.getElementById('res-localizacao').value,
            [columnMap.instagram]: document.getElementById('res-instagram').value,
            [columnMap.aceita_vr]: document.getElementById('res-vr').checked,
        };
        const { error } = await supabase.from('restaurantes').insert(formData);
        if (error) {
            console.error('Erro ao adicionar:', error);
        } else {
            addRestaurantForm.reset();
            addRestaurantForm.parentElement.removeAttribute('open');
            fetchAndDisplayRestaurantes();
        }
    });

    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    fetchAndDisplayRestaurantes();
}
