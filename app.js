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
// LÓGICA DA PÁGINA DE LOGIN
// =================================================================================
function setupLoginPage() {
    // ... (código inalterado)
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
    if (!session) {
        window.location.href = 'login.html';
        return;
    }
    const restaurantesLista = document.getElementById('restaurantes-lista');
    const addRestaurantForm = document.getElementById('add-restaurant-form');
    const columnMap = {
        nome: 'Nome do Restaurante',
        tipo_cozinha: 'Tipo de Cozinha',
        faixa_preco: 'Faixa de Preço',
        nota: 'Nota (0-10)',
        localizacao: 'Localização',
        visitado: 'Já visitou?',
        instagram: 'Instagram',
        aceita_vr: 'Aceita VR'
    };

    async function saveUpdate(restaurantName, fieldKey, value) {
        const columnName = columnMap[fieldKey];
        if (!columnName) return;
        
        const { error } = await supabase.from('restaurantes')
            .update({ [columnName]: value })
            .eq('Nome do Restaurante', restaurantName);
        
        if (error) {
            console.error('Erro ao atualizar:', error);
            alert('Não foi possível salvar a alteração.');
        }
    }
    
    // OUVINTE DE EVENTOS COM A CORREÇÃO
    restaurantesLista.addEventListener('click', (event) => {
        const target = event.target;
        const card = target.closest('.restaurante-card');

        // GUARDA INTELIGENTE: Se o clique não foi dentro de um card, a função para aqui.
        if (!card) {
            return;
        }
        
        // Se a função continuou, significa que 'card' existe e podemos pegar o nome com segurança.
        const restaurantName = card.dataset.id;

        // Lógica do Toggle (agora segura)
        if (target.classList.contains('toggle')) {
            const fieldKey = target.dataset.field;
            const currentValue = target.dataset.value === 'true';
            const newValue = !currentValue;
            saveUpdate(restaurantName, fieldKey, newValue);
            target.dataset.value = newValue;
            target.textContent = newValue ? 'Já Fomos!' : 'Pendente';
            target.classList.toggle('toggle-visitado-sim');
            target.classList.toggle('toggle-visitado-nao');
        }

        // Lógica da Edição (agora segura)
        if (target.classList.contains('editable')) {
            if (target.querySelector('input')) return;
            const originalValue = target.textContent;
            const fieldKey = target.dataset.field;
            const input = document.createElement('input');
            input.type = (fieldKey === 'nota') ? 'number' : 'text';
            input.value = originalValue === 'N/A' || originalValue === 'Não informado' ? '' : originalValue;
            target.innerHTML = '';
            target.appendChild(input);
            input.focus();
            const saveAndExit = () => {
                const newValue = input.value;
                saveUpdate(restaurantName, fieldKey, newValue);
                target.innerHTML = newValue || (fieldKey === 'nota' ? 'N/A' : 'Não informado');
            };
            input.addEventListener('blur', saveAndExit);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') saveAndExit();
                else if (e.key === 'Escape') target.innerHTML = originalValue;
            });
        }
    });
    
    async function fetchAndDisplayRestaurantes() {
        // ... (código inalterado)
    }

    addRestaurantForm.addEventListener('submit', async (event) => {
       // ... (código inalterado)
    });

    document.getElementById('logout-button').addEventListener('click', async () => {
        // ... (código inalterado)
    });

    fetchAndDisplayRestaurantes();
}
