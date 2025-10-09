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
    
    restaurantesLista.addEventListener('click', (event) => {
        const target = event.target;
        const card = target.closest('.restaurante-card');

        // Guarda inteligente: Se o clique não foi dentro de um card, a função para aqui.
        if (!card) {
            return;
        }
        
        const restaurantName = card.dataset.id;

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
    
    // ESTA FUNÇÃO ESTAVA FALTANDO NO CÓDIGO ANTERIOR
    async function fetchAndDisplayRestaurantes() {
        const { data: restaurantes, error } = await supabase.from('restaurantes').select('*');
        if (error) {
            console.error('Erro ao buscar dados:', error); 
            restaurantesLista.innerHTML = `<p style="color: red;">Erro ao carregar os restaurantes. Verifique o console (F12) para detalhes.</p>`;
            return;
        }
        restaurantesLista.innerHTML = '';
        restaurantes.forEach(restaurante => {
            const card = document.createElement('div');
            card.classList.add('restaurante-card');
            card.dataset.id = restaurante['Nome do Restaurante'];
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
                     <div class="actions">
                        <a href="${restaurante[columnMap.instagram] || '#'}" target="_blank" class="social-link" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
                     </div>
                </div>`;
            restaurantesLista.appendChild(card);
        });
    }

    // ESTE OUVINTE DE EVENTO TAMBÉM ESTAVA FALTANDO
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

    // E ESTE OUVINTE DE LOGOUT TAMBÉM ESTAVA FALTANDO
    document.getElementById('logout-button').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    });

    // A chamada inicial para carregar os dados
    fetchAndDisplayRestaurantes();
}
