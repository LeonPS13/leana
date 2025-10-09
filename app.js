// =================================================================================
// CONFIGURAÇÃO DO SUPABASE
// =================================================================================
const SUPABASE_URL = 'https://kyruwsjzyppdwlyxnlon.supabase.co';       // Cole sua URL aqui
const SUPABASE_ANON_KEY = 'sb_publishable_aCvS33rtBCig4H5lG-cvHg_tQHIZE4j'; // Cole sua Publishable Key aqui

// A CORREÇÃO REAL E DEFINITIVA ESTÁ APLICADA AQUI 👇
// Chamamos a função .createClient() a partir do objeto supabase (minúsculo)
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
// LÓGICA DA PÁGINA DE LOGIN (sem mudanças)
// =================================================================================
function setupLoginPage() {
    // ...
}

// =================================================================================
// LÓGICA DA PÁGINA PRINCIPAL
// =================================================================================
async function setupMainPage() {
    // ... (Código de proteção de rota e declaração de variáveis)

    // NOVO: Elementos do Modal da Galeria
    const galleryModalOverlay = document.getElementById('gallery-modal-overlay');
    const galleryModalContent = document.getElementById('gallery-modal-content');
    const galleryRestaurantName = document.getElementById('gallery-restaurant-name');
    const galleryGrid = document.getElementById('gallery-grid');
    const uploadPhotoForm = document.getElementById('upload-photo-form');
    const photoInput = document.getElementById('photo-input');
    const uploadStatus = document.getElementById('upload-status');
    const closeGalleryModalBtn = document.getElementById('close-gallery-modal-btn');
    
    // ... (código do columnMap e saveUpdate)
    
    // Ouve os cliques na lista de restaurantes
    restaurantesLista.addEventListener('click', (event) => {
        const target = event.target;
        const card = target.closest('.restaurante-card');
        if (!card) return;
        
        // NOVO: Lógica para abrir a galeria de fotos
        if (target.closest('.btn-fotos')) {
            const restaurantName = card.dataset.id;
            abrirModalDeFotos(restaurantName);
        }

        // ... (código de edição inline e toggle)
    });
    
    // ... (código da função fetchAndDisplayRestaurantes, com uma pequena alteração)

    async function fetchAndDisplayRestaurantes() {
        // ... (código da busca)
        restaurantes.forEach(restaurante => {
            // ... (código de criação do card)
            
            // ALTERAÇÃO: Adicionando o botão de fotos
            card.innerHTML = `
                <div class="card-footer">
                     <span class="toggle" ...>${...}</span>
                     <button class="btn-fotos"><i class="fa-solid fa-camera"></i> Fotos</button>
                     <div class="actions">
                        <a href="${restaurante[columnMap.instagram] || '#'}" ...><i class="fa-brands fa-instagram"></i></a>
                     </div>
                </div>`;

            // NOVO: Guardando os dados completos do restaurante no elemento do card
            card.dataset.restaurante = JSON.stringify(restaurante);

            restaurantesLista.appendChild(card);
        });
    }

    // --- NOVAS FUNÇÕES PARA GERENCIAR A GALERIA ---

    function abrirModalDeFotos(restaurantName) {
        // Guarda o nome do restaurante no modal para usar no upload
        galleryModalContent.dataset.currentRestaurant = restaurantName;
        galleryRestaurantName.textContent = `Fotos de: ${restaurantName}`;
        uploadStatus.textContent = '';
        uploadPhotoForm.reset();

        // Encontra os dados do restaurante que já guardamos no card
        const cardElement = document.querySelector(`.restaurante-card[data-id="${restaurantName}"]`);
        const restaurante = JSON.parse(cardElement.dataset.restaurante);
        const fotos = restaurante.fotos || [];

        // Preenche a galeria com as fotos existentes
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

    function fecharModalDeFotos() {
        galleryModalOverlay.classList.add('hidden');
    }

    // Lógica para fechar o modal
    closeGalleryModalBtn.addEventListener('click', fecharModalDeFotos);
    galleryModalOverlay.addEventListener('click', (event) => {
        if (event.target === galleryModalOverlay) {
            fecharModalDeFotos();
        }
    });

    // Lógica para fazer o UPLOAD da foto
    uploadPhotoForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const restaurantName = galleryModalContent.dataset.currentRestaurant;
        const file = photoInput.files[0];
        if (!file || !restaurantName) return;

        uploadStatus.textContent = 'Enviando...';

        try {
            // 1. Faz o upload do arquivo para o Supabase Storage
            const filePath = `${restaurantName}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('fotos-restaurantes')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Pega a URL pública da imagem que acabamos de enviar
            const { data: urlData } = supabase.storage
                .from('fotos-restaurantes')
                .getPublicUrl(filePath);
            
            const newPhotoUrl = urlData.publicUrl;

            // 3. Atualiza a tabela 'restaurantes' com a nova URL
            // Primeiro, pega o array de fotos atual
            const { data: currentData, error: selectError } = await supabase
                .from('restaurantes')
                .select('fotos')
                .eq('Nome do Restaurante', restaurantName)
                .single();
            
            if (selectError) throw selectError;

            const existingPhotos = currentData.fotos || [];
            const updatedPhotos = [...existingPhotos, newPhotoUrl];

            // Depois, atualiza a coluna com o novo array
            const { error: updateError } = await supabase
                .from('restaurantes')
                .update({ fotos: updatedPhotos })
                .eq('Nome do Restaurante', restaurantName);

            if (updateError) throw updateError;
            
            uploadStatus.textContent = 'Foto enviada com sucesso!';
            uploadPhotoForm.reset();
            
            // Recarrega a lista principal para atualizar os dados do card
            fetchAndDisplayRestaurantes();
            // Reabre e atualiza o modal com a nova foto
            abrirModalDeFotos(restaurantName);

        } catch (error) {
            console.error('Erro no processo de upload:', error);
            uploadStatus.textContent = 'Falha no envio. Tente novamente.';
        }
    });

    // ... (código de adicionar restaurante e logout)

    fetchAndDisplayRestaurantes();
}
