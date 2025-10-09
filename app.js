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
    // ... (código existente, sem alterações)
}

// =================================================================================
// LÓGICA DA PÁGINA PRINCIPAL (GRANDES MUDANÇAS AQUI)
// =================================================================================
async function setupMainPage() {
    // Proteção de Rota
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    // --- VARIÁVEIS DE ESTADO ---
    let allRestaurants = []; // Guarda a lista original vinda do Supabase

    // --- ELEMENTOS DO DOM ---
    const restaurantesLista = document.getElementById('restaurantes-lista');
    const addRestaurantForm = document.getElementById('add-restaurant-form');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    // ... (código do columnMap e modal da galeria)

    // --- FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ---
    function renderCards() {
        // 1. Pega os valores atuais da busca e da organização
        const searchTerm = searchInput.value.toLowerCase();
        const sortOption = sortSelect.value;

        // 2. Filtra os restaurantes com base na busca
        let filteredRestaurants = allRestaurants.filter(restaurant => {
            const nome = restaurant[columnMap.nome] || '';
            return nome.toLowerCase().includes(searchTerm);
        });

        // 3. Organiza os restaurantes filtrados
        switch (sortOption) {
            case 'alfabetica':
                filteredRestaurants.sort((a, b) => {
                    const nomeA = a[columnMap.nome] || '';
                    const nomeB = b[columnMap.nome] || '';
                    return nomeA.localeCompare(nomeB);
                });
                break;
            case 'cozinha':
                filteredRestaurants.sort((a, b) => {
                    const cozinhaA = a[columnMap.tipo_cozinha] || '';
                    const cozinhaB = b[columnMap.tipo_cozinha] || '';
                    return cozinhaA.localeCompare(cozinhaB);
                });
                break;
            case 'visitados':
                // Coloca os visitados (true) primeiro
                filteredRestaurants.sort((a, b) => {
                    const visitadoA = a[columnMap.visitado] || false;
                    const visitadoB = b[columnMap.visitado] || false;
                    return (visitadoA === visitadoB) ? 0 : visitadoA ? -1 : 1;
                });
                break;
            case 'default':
            default:
                // A ordem padrão é a que vem do Supabase (mais recentes)
                break;
        }

        // 4. Limpa a lista e desenha os novos cards
        restaurantesLista.innerHTML = '';
        if (filteredRestaurants.length === 0) {
            restaurantesLista.innerHTML = '<p>Nenhum restaurante encontrado.</p>';
        } else {
            filteredRestaurants.forEach(restaurante => {
                const card = document.createElement('div');
                card.classList.add('restaurante-card');
                card.dataset.id = restaurante[columnMap.nome];
                card.dataset.restaurante = JSON.stringify(restaurante);

                card.innerHTML = `
                    <div class="card-header"> ... </div>
                    <div class="card-body"> ... </div>
                    <div class="card-footer"> ... </div>`;
                
                restaurantesLista.appendChild(card);
            });
        }
    }

    // --- FUNÇÃO INICIAL DE BUSCA DE DADOS ---
    async function fetchAndDisplayRestaurantes() {
        const { data: restaurantes, error } = await supabase.from('restaurantes').select('*').order('created_at', { ascending: false });
        if (error) {
            console.error('Erro ao buscar dados:', error); 
            restaurantesLista.innerHTML = `<p style="color: red;">Erro ao carregar os restaurantes.</p>`;
            return;
        }
        allRestaurants = restaurantes || []; // Armazena a lista completa
        renderCards(); // Chama a função de renderização pela primeira vez
    }

    // --- OUVINTES DE EVENTOS (EVENT LISTENERS) ---
    
    // Ouve a digitação na barra de busca
    searchInput.addEventListener('input', renderCards);
    // Ouve a mudança no seletor de organização
    sortSelect.addEventListener('change', renderCards);

    // ... (código dos ouvintes de clique para editar, toggle, fotos, etc.)
    
    // ... (código das funções de abrir/fechar modal, saveUpdate, etc.)
    
    // ... (código do formulário para adicionar novo restaurante)
    
    // ... (código do botão de logout)

    // --- CARGA INICIAL ---
    fetchAndDisplayRestaurantes();
}
