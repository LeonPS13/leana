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
    // ... código sem alteração
}

// =================================================================================
// LÓGICA DA PÁGINA PRINCIPAL
// =================================================================================
async function setupMainPage() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    let allRestaurants = [];

    const restaurantesLista = document.getElementById('restaurantes-lista');
    // ... resto dos elementos do DOM
    const galleryGrid = document.getElementById('gallery-grid');
    // NOVO: Elementos do Lightbox
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxCloseBtn = document.getElementById('lightbox-close-btn');

    const columnMap = {
        // ... código sem alteração
    };

    function renderCards() {
        // ... código sem alteração
        processedRestaurants.forEach(restaurante => {
            const card = document.createElement('div');
            card.classList.add('restaurante-card');
            card.dataset.id = restaurante[columnMap.nome];
            card.dataset.restaurante = JSON.stringify(restaurante);

            // NOVO: Verifica se o restaurante tem fotos
            const hasPhotos = restaurante.fotos && restaurante.fotos.length > 0;
            const photosButtonClass = hasPhotos ? 'btn-fotos-active' : '';

            card.innerHTML = `
                <div class="card-header">
                    </div>
                <div class="card-body">
                    </div>
                <div class="card-footer">
                     <span class="toggle" data-field="visitado" data-value="${restaurante[columnMap.visitado]}">${restaurante[columnMap.visitado] ? 'Já Fomos!' : 'Pendente'}</span>
                     <button class="btn-fotos ${photosButtonClass}"><i class="fa-solid fa-camera"></i> Fotos</button>
                     <div class="actions">
                        <a href="${restaurante[columnMap.instagram] || '#'}" target="_blank" class="social-link" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
                     </div>
                </div>`;
            restaurantesLista.appendChild(card);
        });
    }

    async function saveUpdate(restaurantName, fieldKey, value) {
        // ... código sem alteração
    }
    
    restaurantesLista.addEventListener('click', (event) => {
        // ... código sem alteração
    });
    
    async function fetchAndDisplayRestaurantes() {
        // ... código sem alteração
    }

    function abrirModalDeFotos(restaurantName) {
        // ... código sem alteração
    }

    // NOVO: Ouvinte de eventos para abrir o lightbox
    galleryGrid.addEventListener('click', (event) => {
        if (event.target.tagName === 'IMG') {
            openLightbox(event.target.src);
        }
    });

    // NOVO: Função para abrir o lightbox
    function openLightbox(imageUrl) {
        lightboxImage.src = imageUrl;
        lightboxOverlay.classList.remove('hidden');
    }

    // NOVO: Função para fechar o lightbox
    function closeLightbox() {
        lightboxOverlay.classList.add('hidden');
    }

    // NOVO: Ouvintes de eventos para fechar o lightbox
    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', (event) => {
        if (event.target === lightboxOverlay) { // Só fecha se clicar no fundo
            closeLightbox();
        }
    });

    function fecharModalDeFotos() {
        // ... código sem alteração
    }

    uploadPhotoForm.addEventListener('submit', async (event) => {
        // ... código sem alteração
    });

    // ... restante das funções e ouvintes de eventos
}
