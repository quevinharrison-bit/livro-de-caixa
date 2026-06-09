// Configuração de Data de Hoje do Sistema
const SYSTEM_TODAY = '2026-06-04';

// Estado Global da Aplicação
let state = {
    products: [],
    transactions: [],
    installments: [],
    currentTab: 'dashboard',
    activeRankTab: 'revenue',
    profiles: [],
    currentProfile: 'default'
};

// ID da transação em modo de edição (null se for nova transação)
let editingTransactionId = null;

// --- DADOS INICIAIS (SEED DATA) ---
const seedProducts = [
    { id: 'p1', nome: 'Notebook Gamer Pro', precoCusto: 3200.00 },
    { id: 'p2', nome: 'Teclado Mecânico RGB', precoCusto: 180.00 },
    { id: 'p3', nome: 'Monitor Ultrawide 34', precoCusto: 1500.00 },
    { id: 'p4', nome: 'Mouse Sem Fio 16K', precoCusto: 120.00 }
];

const seedTransactions = [
    {
        id: 't1',
        data: '2026-05-10',
        descricao: 'Venda de Notebook Gamer Pro',
        valorTotal: 5200.00,
        tipo: 'entrada',
        categoria: 'Venda de Mercadoria',
        produtoId: 'p1',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pago',
        metodoPagamento: 'pix'
    },
    {
        id: 't2',
        data: '2026-05-15',
        descricao: 'Luz Escritório',
        valorTotal: 250.00,
        tipo: 'saida',
        categoria: 'Luz/Energia',
        produtoId: '',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pago',
        metodoPagamento: 'dinheiro'
    },
    {
        id: 't3',
        data: '2026-05-01',
        descricao: 'Venda de 2x Monitores 34',
        valorTotal: 2400.00,
        tipo: 'entrada',
        categoria: 'Venda de Mercadoria',
        produtoId: 'p3',
        tipoPagamento: 'parcelado',
        numParcelas: 3,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'cartao'
    },
    {
        id: 't4',
        data: '2026-04-10',
        descricao: 'Compra de Lote Mouses 16K',
        valorTotal: 3000.00,
        tipo: 'saida',
        categoria: 'Fornecedor de Estoque',
        produtoId: 'p4',
        tipoPagamento: 'parcelado',
        numParcelas: 6,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'cartao'
    },
    {
        id: 't5',
        data: '2026-06-15',
        descricao: 'Venda Teclado Mecânico',
        valorTotal: 350.00,
        tipo: 'entrada',
        categoria: 'Venda de Mercadoria',
        produtoId: 'p2',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'pix'
    },
    {
        id: 't6',
        data: '2026-06-08',
        descricao: 'Serviço de Nuvem SaaS',
        valorTotal: 150.00,
        tipo: 'saida',
        categoria: 'Internet/SaaS',
        produtoId: '',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'pix'
    }
];

// Instância Global do Gráfico Chart.js
let flowChartInstance = null;
let categoryChartInstance = null;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    registerServiceWorker();
    initApp();
    setupEventListeners();
    updateUI();
});

// Registrar PWA Service Worker para offline no Android
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso:', reg.scope))
            .catch(err => console.warn('Erro ao registrar Service Worker:', err));
    }
}

function initApp() {
    const savedPin = localStorage.getItem('financeiq_lock_pin');
    const hasPin = !!savedPin;

    document.getElementById('current-date-span').innerText = formatDate(SYSTEM_TODAY);
    document.getElementById('trans-date').value = SYSTEM_TODAY;
    
    const storedProfiles = localStorage.getItem('financeiq_profiles');
    const storedActiveProfile = localStorage.getItem('financeiq_active_profile');
    
    if (storedProfiles) {
        state.profiles = JSON.parse(storedProfiles);
    } else {
        state.profiles = [{ id: 'default', name: 'Fluxo Padrão' }];
        localStorage.setItem('financeiq_profiles', JSON.stringify(state.profiles));
    }
    
    if (storedActiveProfile && state.profiles.some(p => p.id === storedActiveProfile)) {
        state.currentProfile = storedActiveProfile;
    } else {
        state.currentProfile = 'default';
        localStorage.setItem('financeiq_active_profile', 'default');
    }
    
    loadProfileData(state.currentProfile);
    initSecurityPinToggle(hasPin);
    
    if (hasPin) {
        document.getElementById('lock-screen').style.display = 'flex';
        setupPinLockKeyboard(savedPin);
    } else {
        document.getElementById('lock-screen').style.display = 'none';
    }
}

// --- PERSISTÊNCIA ---
function saveStateToLocalStorage() {
    const profileId = state.currentProfile || 'default';
    localStorage.setItem(`financeiq_products_${profileId}`, JSON.stringify(state.products));
    localStorage.setItem(`financeiq_transactions_${profileId}`, JSON.stringify(state.transactions));
    localStorage.setItem(`financeiq_installments_${profileId}`, JSON.stringify(state.installments));
    localStorage.setItem('financeiq_profiles', JSON.stringify(state.profiles));
    localStorage.setItem('financeiq_active_profile', profileId);
}

// --- DATA & FORMATADORES ---
function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function addMonths(dateStr, months) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    // Evita transbordamento criando o objeto no dia 1
    const date = new Date(year, month, 1);
    date.setMonth(date.getMonth() + months);
    
    // Limita o dia ao máximo permitido no mês de destino (ex: 31/05 + 1 mês = 30/06)
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(day, lastDayOfMonth);
    date.setDate(targetDay);
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
}

// --- PARCELAMENTO ---
function generateInstallments(transaction) {
    const list = [];
    const num = parseInt(transaction.numParcelas) || 1;
    const valParcela = parseFloat((transaction.valorTotal / num).toFixed(2));
    
    for (let i = 0; i < num; i++) {
        const dueDate = i === 0 ? transaction.data : addMonths(transaction.data, i);
        
        let valorFinal = valParcela;
        if (i === num - 1) {
            const somaAnteriores = valParcela * (num - 1);
            valorFinal = parseFloat((transaction.valorTotal - somaAnteriores).toFixed(2));
        }

        list.push({
            id: `${transaction.id}-p${i + 1}`,
            transacaoId: transaction.id,
            numeroParcela: i + 1,
            dataVencimento: dueDate,
            valor: valorFinal,
            status: transaction.status
        });
    }
    return list;
}

// --- EVENTOS ---
function setupEventListeners() {
    // Bottom Bar (Navegação Mobile)
    document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Abas de Ranking
    document.querySelectorAll('.rank-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeRankTab = btn.getAttribute('data-rank');
            renderProductRanking();
        });
    });

    // Campo condicional de parcelamento no form de transação
    document.getElementById('trans-payment').addEventListener('change', (e) => {
        const installmentsGroup = document.getElementById('installments-group');
        const statusSelect = document.getElementById('trans-status');
        
        if (e.target.value === 'parcelado') {
            installmentsGroup.style.display = 'block';
            statusSelect.value = 'pendente';
        } else {
            installmentsGroup.style.display = 'none';
        }
    });

    // Abrir/Fechar Modal de Cadastro no Android (FAB)
    const modal = document.getElementById('transaction-modal');
    document.getElementById('open-transaction-modal-btn').addEventListener('click', () => {
        editingTransactionId = null;
        document.getElementById('modal-title-text').innerHTML = '<i class="fa-solid fa-circle-plus"></i> Nova Movimentação';
        document.getElementById('transaction-form').reset();
        document.getElementById('trans-date').value = SYSTEM_TODAY;
        document.getElementById('installments-group').style.display = 'none';
        modal.style.display = 'flex';
    });
    
    document.getElementById('close-transaction-modal-btn').addEventListener('click', () => {
        editingTransactionId = null;
        modal.style.display = 'none';
    });

    // Submissão de Transação
    document.getElementById('transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const desc = document.getElementById('trans-desc').value;
        const val = parseFloat(document.getElementById('trans-val').value);
        const date = document.getElementById('trans-date').value;
        const type = document.getElementById('trans-type').value;
        const cat = document.getElementById('trans-cat').value;
        const prodId = document.getElementById('trans-product').value;
        const method = document.getElementById('trans-method').value;
        const payType = document.getElementById('trans-payment').value;
        const numParc = payType === 'parcelado' ? parseInt(document.getElementById('trans-installments').value) : 1;
        const status = document.getElementById('trans-status').value;

        if (editingTransactionId) {
            // Modo Edição: Atualiza os campos da transação selecionada
            const idx = state.transactions.findIndex(t => t.id === editingTransactionId);
            if (idx !== -1) {
                state.transactions[idx] = {
                    ...state.transactions[idx],
                    data: date,
                    descricao: desc,
                    valorTotal: val,
                    tipo: type,
                    categoria: cat,
                    produtoId: prodId,
                    metodoPagamento: method,
                    tipoPagamento: payType,
                    numParcelas: numParc,
                    status: status
                };

                // Regenerar as parcelas associadas à transação editada
                state.installments = state.installments.filter(i => i.transacaoId !== editingTransactionId);
                const newInstallments = generateInstallments(state.transactions[idx]);
                state.installments.push(...newInstallments);
            }
            editingTransactionId = null;
            document.getElementById('modal-title-text').innerHTML = '<i class="fa-solid fa-circle-plus"></i> Nova Movimentação';
        } else {
            // Modo Criação: Insere novo lançamento
            const newTrans = {
                id: 't-' + Date.now(),
                data: date,
                descricao: desc,
                valorTotal: val,
                tipo: type,
                categoria: cat,
                produtoId: prodId,
                metodoPagamento: method,
                tipoPagamento: payType,
                numParcelas: numParc,
                recorrencia: 'mensal',
                status: status
            };

            const newInstallments = generateInstallments(newTrans);
            state.transactions.unshift(newTrans);
            state.installments.push(...newInstallments);
        }
        
        saveStateToLocalStorage();
        updateUI();
        
        // Reset e Fechamento do Modal
        document.getElementById('transaction-form').reset();
        document.getElementById('trans-date').value = SYSTEM_TODAY;
        document.getElementById('installments-group').style.display = 'none';
        modal.style.display = 'none';
    });

    // Submissão de Mercadoria
    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('prod-name').value;
        const cost = parseFloat(document.getElementById('prod-cost').value);

        const newProd = {
            id: 'p-' + Date.now(),
            nome: name,
            precoCusto: cost
        };

        state.products.unshift(newProd);
        
        saveStateToLocalStorage();
        updateUI();
        
        document.getElementById('product-form').reset();
    });

    // Fechar Bottom Sheet de parcelas
    const sheet = document.getElementById('installments-detail-card');
    const backdrop = document.getElementById('bottom-sheet-backdrop');
    
    const closeSheet = () => {
        sheet.style.display = 'none';
        backdrop.style.display = 'none';
    };

    document.getElementById('btn-close-sheet').addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    // Filtro de Transações
    document.getElementById('filter-type').addEventListener('change', () => {
        updateUI();
    });

    const filterPeriod = document.getElementById('filter-period');
    const filterCustomDates = document.getElementById('filter-custom-dates');
    
    filterPeriod.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            filterCustomDates.style.display = 'flex';
        } else {
            filterCustomDates.style.display = 'none';
        }
        updateUI();
    });

    document.getElementById('filter-start-date').addEventListener('change', updateUI);
    document.getElementById('filter-end-date').addEventListener('change', updateUI);

    // Precificação Inteligente reativa
    document.getElementById('calc-margin').addEventListener('input', (e) => {
        document.getElementById('calc-margin-val').innerText = parseFloat(e.target.value).toFixed(1) + '%';
        calculatePriceMarkup();
    });
    
    document.getElementById('calc-cost').addEventListener('input', calculatePriceMarkup);
    document.getElementById('calc-fixed-costs').addEventListener('input', calculatePriceMarkup);
    document.getElementById('calc-taxes').addEventListener('input', calculatePriceMarkup);
    
    document.getElementById('calc-select-product').addEventListener('change', (e) => {
        const prodId = e.target.value;
        if (prodId) {
            const prod = state.products.find(p => p.id === prodId);
            if (prod) {
                document.getElementById('calc-cost').value = prod.precoCusto;
                calculatePriceMarkup();
            }
        }
    });

    // --- SISTEMA DE IMPORTAÇÃO E EXPORTAÇÃO DE BACKUP ---
    document.getElementById('btn-export-backup').addEventListener('click', () => {
        const backupData = {
            products: state.products,
            transactions: state.transactions,
            installments: state.installments,
            profileName: state.profiles.find(p => p.id === state.currentProfile)?.name || 'Fluxo'
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `financesiq_${state.currentProfile}_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-backup').addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                if (imported.products && imported.transactions && imported.installments) {
                    state.products = imported.products;
                    state.transactions = imported.transactions;
                    state.installments = imported.installments;
                    saveStateToLocalStorage();
                    updateUI();
                    alert('Backup importado com sucesso! Seus dados foram restaurados.');
                } else {
                    alert('Arquivo de backup inválido. Verifique o arquivo selecionado.');
                }
            } catch (err) {
                alert('Erro ao ler arquivo de backup: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    // Botão de reset de dados
    document.getElementById('btn-reset-db').addEventListener('click', () => {
        if (confirm('Tem certeza de que deseja resetar todo o banco de dados deste fluxo para os valores padrão? Todos os seus lançamentos personalizados dele serão apagados.')) {
            resetDatabase();
        }
    });

    // Botão de imprimir PDF
    document.getElementById('btn-print-report').addEventListener('click', () => {
        window.print();
    });

    // Seletor de período mensal
    document.getElementById('monthly-select-period').addEventListener('change', () => {
        renderMonthlyReport();
    });

    // --- SELETOR DE PERFIL DE FLUXO ---
    document.getElementById('header-profile-select').addEventListener('change', (e) => {
        switchProfile(e.target.value);
    });

    // Modais e criação de novos perfis
    const profileModal = document.getElementById('profile-modal');
    document.getElementById('btn-manage-profiles').addEventListener('click', () => {
        populateProfileSelectors();
        profileModal.style.display = 'flex';
    });
    
    document.getElementById('close-profile-modal-btn').addEventListener('click', () => {
        profileModal.style.display = 'none';
    });
    
    document.getElementById('create-profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newNameInput = document.getElementById('new-profile-name');
        const name = newNameInput.value.trim();
        if (name) {
            createNewProfile(name);
            newNameInput.value = '';
            profileModal.style.display = 'none';
        }
    });

    // --- CONTROLES DE SEGURANÇA E PIN ---
    const pinToggle = document.getElementById('settings-pin-toggle');
    const pinOptions = document.getElementById('settings-pin-options');
    
    if (pinToggle) {
        pinToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                const pin = prompt('Defina um PIN numérico de 4 dígitos para acesso:');
                if (pin && /^\d{4}$/.test(pin)) {
                    localStorage.setItem('financeiq_lock_pin', pin);
                    pinOptions.style.display = 'flex';
                    alert('Bloqueio por PIN ativado com sucesso!');
                } else {
                    alert('PIN inválido! Deve conter exatamente 4 dígitos numéricos.');
                    e.target.checked = false;
                }
            } else {
                const confirmDisable = confirm('Deseja desativar a senha de acesso por PIN?');
                if (confirmDisable) {
                    localStorage.removeItem('financeiq_lock_pin');
                    pinOptions.style.display = 'none';
                    alert('Bloqueio por PIN desativado.');
                } else {
                    e.target.checked = true;
                }
            }
        });
    }
    
    const btnChangePin = document.getElementById('btn-change-pin');
    if (btnChangePin) {
        btnChangePin.addEventListener('click', () => {
            const currentSaved = localStorage.getItem('financeiq_lock_pin');
            const oldPin = prompt('Digite o seu PIN atual:');
            if (oldPin !== currentSaved) {
                alert('PIN atual incorreto!');
                return;
            }
            
            const newPin = prompt('Digite o seu NOVO PIN de 4 dígitos:');
            if (newPin && /^\d{4}$/.test(newPin)) {
                localStorage.setItem('financeiq_lock_pin', newPin);
                alert('PIN alterado com sucesso!');
            } else {
                alert('PIN inválido! Deve conter exatamente 4 dígitos numéricos.');
            }
        });
    }

function switchTab(tabId) {
    state.currentTab = tabId;
    
    document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.getAttribute('id') === tabId) {
            pane.classList.add('active');
        } else {
            pane.classList.remove('active');
        }
    });

    if (tabId === 'dashboard') {
        renderDashboardCharts();
    } else if (tabId === 'pricing') {
        calculatePriceMarkup();
    }
}

// --- RENDERIZAÇÃO DA UI ---
function updateUI() {
    renderMetricCards();
    renderDashboardCharts();
    renderProductRanking();
    renderTransactionsListMobile();
    renderProductsListMobile();
    populateSelects();
    renderFilterSummary(); // Atualiza o resumo de fluxo do período filtrado
    renderMonthlyReport();
    renderCategoryChart();
    populateProfileSelectors();
}

// Função auxiliar para verificar se uma data corresponde aos filtros de período ativos
function isDateMatchingPeriodFilters(dateStr) {
    const periodFilter = document.getElementById('filter-period').value;
    const startDateVal = document.getElementById('filter-start-date').value;
    const endDateVal = document.getElementById('filter-end-date').value;

    if (periodFilter === 'todos') {
        return true;
    } else if (periodFilter === 'semana') {
        const transDate = new Date(dateStr + 'T12:00:00');
        const today = new Date(SYSTEM_TODAY + 'T12:00:00');
        const dayOfWeek = today.getDay(); // 0: Dom, 1: Seg, ..., 6: Sab
        
        // Segunda-feira como início da semana (Regra padrão brasileira)
        const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diffToMonday, 0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return transDate >= startOfWeek && transDate <= endOfWeek;
    } else if (periodFilter === 'mes') {
        return dateStr.substring(0, 7) === SYSTEM_TODAY.substring(0, 7);
    } else if (periodFilter === 'mes-passado') {
        const today = new Date(SYSTEM_TODAY + 'T12:00:00');
        today.setMonth(today.getMonth() - 1);
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const lastMonthKey = `${yyyy}-${mm}`;
        return dateStr.substring(0, 7) === lastMonthKey;
    } else if (periodFilter === 'custom') {
        if (startDateVal && dateStr < startDateVal) return false;
        if (endDateVal && dateStr > endDateVal) return false;
        return true;
    }
    return true;
}

// 1. Cards de Métricas Gerais (Dashboard)
function renderMetricCards() {
    let actualBalance = 0;
    let projectedBalance = 0;
    let toPay = 0;
    let toReceive = 0;

    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;

        const val = install.valor;
        const isEntrada = trans.tipo === 'entrada';
        const isPaid = install.status === 'pago';
        const isPastOrToday = install.dataVencimento <= SYSTEM_TODAY;

        if (isPaid && isPastOrToday) {
            actualBalance += isEntrada ? val : -val;
        }

        projectedBalance += isEntrada ? val : -val;

        if (!isPaid) {
            if (isEntrada) {
                toReceive += val;
            } else {
                toPay += val;
            }
        }
    });

    document.getElementById('metric-actual-balance').innerText = formatCurrency(actualBalance);
    document.getElementById('metric-projected-balance').innerText = formatCurrency(projectedBalance);
    document.getElementById('metric-to-receive').innerText = formatCurrency(toReceive);
    document.getElementById('metric-to-pay').innerText = formatCurrency(toPay);
}

// Novo Módulo: Resumo de Cálculos do Período Filtrado na Aba de Lançamentos
function renderFilterSummary() {
    const periodFilter = document.getElementById('filter-period').value;
    const typeFilter = document.getElementById('filter-type').value;
    
    let entriesTotal = 0;
    let entriesPaid = 0;
    let exitsTotal = 0;
    let exitsPaid = 0;

    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;

        // Filtro por Tipo
        const typeMatches = typeFilter === 'todos' || trans.tipo === typeFilter;
        if (!typeMatches) return;

        // Filtro por Período (baseado na data de vencimento da parcela)
        if (!isDateMatchingPeriodFilters(install.dataVencimento)) return;

        const val = install.valor;
        const isEntrada = trans.tipo === 'entrada';
        const isPaid = install.status === 'pago';

        if (isEntrada) {
            entriesTotal += val;
            if (isPaid) entriesPaid += val;
        } else {
            exitsTotal += val;
            if (isPaid) exitsPaid += val;
        }
    });

    const entriesPending = entriesTotal - entriesPaid;
    const exitsPending = exitsTotal - exitsPaid;
    const balance = entriesTotal - exitsTotal;

    // Atualizar elementos na aba de Lançamentos
    document.getElementById('sum-filter-entries').innerHTML = `
        ${formatCurrency(entriesTotal)}
        <br><span style="font-size:9px; font-weight:normal; color:var(--text-secondary);">
            ${formatCurrency(entriesPaid)} Rec. / ${formatCurrency(entriesPending)} Pend.
        </span>
    `;
    
    document.getElementById('sum-filter-exits').innerHTML = `
        ${formatCurrency(exitsTotal)}
        <br><span style="font-size:9px; font-weight:normal; color:var(--text-secondary);">
            ${formatCurrency(exitsPaid)} Pago / ${formatCurrency(exitsPending)} Pend.
        </span>
    `;

    const balanceEl = document.getElementById('sum-filter-balance');
    balanceEl.innerText = formatCurrency(balance);
    if (balance >= 0) {
        balanceEl.className = 'text-green';
    } else {
        balanceEl.className = 'text-red';
    }
}

// 2. Gráfico Mensal (Chart.js)
function renderDashboardCharts() {
    const ctx = document.getElementById('flowChart').getContext('2d');
    const monthlyData = {};
    const monthsToShow = [
        '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'
    ];
    
    monthsToShow.forEach(m => {
        monthlyData[m] = { entradas: 0, saidas: 0 };
    });

    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;

        const monthKey = install.dataVencimento.substring(0, 7);
        if (monthlyData[monthKey] !== undefined) {
            if (trans.tipo === 'entrada') {
                monthlyData[monthKey].entradas += install.valor;
            } else {
                monthlyData[monthKey].saidas += install.valor;
            }
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const entradas = [];
    const saidas = [];
    const acum = [];
    let runningBalance = 0;

    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;
        const monthKey = install.dataVencimento.substring(0, 7);
        if (monthKey < sortedMonths[0]) {
            runningBalance += trans.tipo === 'entrada' ? install.valor : -install.valor;
        }
    });

    sortedMonths.forEach(m => {
        const ent = monthlyData[m].entradas;
        const sai = monthlyData[m].saidas;
        entradas.push(ent);
        saidas.push(sai);
        runningBalance += (ent - sai);
        acum.push(runningBalance);
    });

    const monthLabels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        const monthsNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `${monthsNames[parseInt(month) - 1]}/${year.substring(2)}`;
    });

    if (flowChartInstance) {
        flowChartInstance.destroy();
    }

    flowChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                {
                    label: 'Entradas',
                    data: entradas,
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Saídas',
                    data: saidas,
                    backgroundColor: 'rgba(239, 68, 68, 0.7)',
                    borderColor: '#ef4444',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Saldo Acum.',
                    data: acum,
                    type: 'line',
                    borderColor: '#00f2fe',
                    backgroundColor: 'rgba(0, 242, 254, 0.05)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#00f2fe'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: {
                        color: '#9ca3af',
                        font: { family: 'Outfit', size: 9 },
                        callback: value => 'R$ ' + value.toLocaleString('pt-BR')
                    }
                }
            }
        }
    });
}

// 3. Performance de Mercadorias (Ranking de Vendas)
function getProductPerformance() {
    const performance = {};

    state.products.forEach(p => {
        performance[p.id] = {
            id: p.id,
            nome: p.nome,
            precoCusto: p.precoCusto,
            qtdVendas: 0,
            faturamento: 0
        };
    });

    state.transactions.forEach(t => {
        if (t.tipo === 'entrada' && t.produtoId && performance[t.produtoId]) {
            performance[t.produtoId].qtdVendas += 1;
            performance[t.produtoId].faturamento += t.valorTotal;
        }
    });

    return Object.values(performance);
}

function renderProductRanking() {
    const listContainer = document.getElementById('ranking-list-items');
    const bestProductName = document.getElementById('best-product-name');
    const performance = getProductPerformance();
    
    if (state.activeRankTab === 'revenue') {
        performance.sort((a, b) => b.faturamento - a.faturamento);
    } else {
        performance.sort((a, b) => b.qtdVendas - a.qtdVendas);
    }

    if (performance.length > 0 && (performance[0].faturamento > 0 || performance[0].qtdVendas > 0)) {
        bestProductName.innerText = performance[0].nome;
    } else {
        bestProductName.innerText = 'Nenhuma venda';
    }

    listContainer.innerHTML = '';
    
    if (performance.length === 0) {
        listContainer.innerHTML = '<p class="text-muted text-center py-4">Sem dados.</p>';
        return;
    }

    performance.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'ranking-item';

        const displayVal = state.activeRankTab === 'revenue' 
            ? formatCurrency(item.faturamento) 
            : `${item.qtdVendas} un`;

        const subVal = state.activeRankTab === 'revenue'
            ? `${item.qtdVendas} un`
            : formatCurrency(item.faturamento);

        div.innerHTML = `
            <div class="ranking-item-left">
                <div class="ranking-number">${index + 1}</div>
                <div class="ranking-item-name">${item.nome}</div>
            </div>
            <div class="ranking-item-right">
                <div class="ranking-val">${displayVal}</div>
                <div class="ranking-sub">${subVal}</div>
            </div>
        `;
        listContainer.appendChild(div);
    });
}

// 4. Lista de Transações Mobile (Estilo Cards)
function renderTransactionsListMobile() {
    const container = document.getElementById('transactions-list-mobile');
    const typeFilter = document.getElementById('filter-type').value;

    container.innerHTML = '';

    const filteredTrans = state.transactions.filter(t => {
        // Filtro por Tipo
        const typeMatches = typeFilter === 'todos' || t.tipo === typeFilter;
        if (!typeMatches) return false;
        
        // Filtro por Período
        return isDateMatchingPeriodFilters(t.data);
    });

    if (filteredTrans.length === 0) {
        container.innerHTML = `<p class="text-center text-muted py-4">Nenhuma transação cadastrada.</p>`;
        return;
    }

    filteredTrans.forEach(t => {
        const transInstallments = state.installments.filter(inst => inst.transacaoId === t.id);
        const totalPaid = transInstallments.filter(inst => inst.status === 'pago').length;
        const totalInst = transInstallments.length;
        
        let statusBadge = '';
        if (t.tipoPagamento === 'avista') {
            const p = transInstallments[0];
            statusBadge = p && p.status === 'pago' 
                ? `<span class="status-badge paid"><i class="fa-solid fa-check"></i> Pago</span>`
                : `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pendente</span>`;
        } else {
            if (totalPaid === totalInst) {
                statusBadge = `<span class="status-badge paid"><i class="fa-solid fa-check"></i> Pago (${totalPaid}/${totalInst})</span>`;
            } else if (totalPaid === 0) {
                statusBadge = `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Pendente (${totalInst}x)</span>`;
            } else {
                statusBadge = `<span class="status-badge pending"><i class="fa-solid fa-arrows-spin"></i> Parcial (${totalPaid}/${totalInst})</span>`;
            }
        }

        const card = document.createElement('div');
        card.className = 'transaction-card-mobile';
        card.innerHTML = `
            <div class="card-top">
                <div>
                    <span class="cat-badge">${t.categoria}</span>
                    <span class="cat-badge method-badge" style="background: rgba(0, 242, 254, 0.08); border-color: rgba(0, 242, 254, 0.2); color: var(--color-primary); font-weight: 600;">${(t.metodoPagamento || 'pix').toUpperCase()}</span>
                </div>
                <span class="card-date">${formatDate(t.data)}</span>
            </div>
            <div class="card-middle">
                <span class="card-title">${t.descricao}</span>
                <span class="card-value ${t.tipo === 'entrada' ? 'type-in' : 'type-out'}">
                    ${t.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(t.valorTotal)}
                </span>
            </div>
            <div class="card-bottom">
                ${statusBadge}
                <div class="card-actions">
                    <button class="btn-action" title="Editar" onclick="editTransaction('${t.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-action" title="Ver Parcelas" onclick="showInstallmentsDrawer('${t.id}')">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="btn-action delete" title="Excluir" onclick="deleteTransaction('${t.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Exibir Gaveta de Parcelas Mobile (Bottom Sheet)
window.showInstallmentsDrawer = function(transId) {
    const trans = state.transactions.find(t => t.id === transId);
    if (!trans) return;

    document.getElementById('detail-trans-name').innerText = trans.descricao;
    const listContainer = document.getElementById('installments-list-mobile');
    listContainer.innerHTML = '';

    const transInstallments = state.installments.filter(inst => inst.transacaoId === transId)
        .sort((a, b) => a.numeroParcela - b.numeroParcela);

    transInstallments.forEach(inst => {
        const isPaid = inst.status === 'pago';
        
        const actionBtn = isPaid 
            ? `<button class="btn-action" title="Pendente" onclick="toggleInstallmentStatus('${inst.id}')"><i class="fa-solid fa-clock text-orange"></i></button>`
            : `<button class="btn-action toggle-paid" title="Pago" onclick="toggleInstallmentStatus('${inst.id}')"><i class="fa-solid fa-circle-check text-green"></i></button>`;

        const item = document.createElement('div');
        item.className = 'installment-item-mobile';
        item.innerHTML = `
            <div>
                <strong>Parcela ${inst.numeroParcela}/${trans.numParcelas}</strong>
                <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                    <span style="font-size: 11px; color: var(--text-secondary);">Venc:</span>
                    <input type="date" value="${inst.dataVencimento}" onchange="changeInstallmentDate('${inst.id}', this.value)" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 11px; padding: 2px 6px; border-radius: 4px; font-family: inherit; outline: none; width: 115px;" />
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="font-semibold">${formatCurrency(inst.valor)}</span>
                <span class="status-badge ${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Receb.' : 'Pend.'}</span>
                ${actionBtn}
            </div>
        `;
        listContainer.appendChild(item);
    });

    document.getElementById('bottom-sheet-backdrop').style.display = 'block';
    document.getElementById('installments-detail-card').style.display = 'flex';
};

window.toggleInstallmentStatus = function(instId) {
    const install = state.installments.find(i => i.id === instId);
    if (!install) return;

    install.status = install.status === 'pago' ? 'pendente' : 'pago';
    
    saveStateToLocalStorage();
    updateUI();
    showInstallmentsDrawer(install.transacaoId);
};

window.changeInstallmentDate = function(instId, newDate) {
    if (!newDate) return;
    const install = state.installments.find(i => i.id === instId);
    if (!install) return;
    
    install.dataVencimento = newDate;
    saveStateToLocalStorage();
    updateUI();
    showInstallmentsDrawer(install.transacaoId);
};

window.deleteTransaction = function(transId) {
    if (!confirm('Deseja excluir esta movimentação?')) return;

    state.transactions = state.transactions.filter(t => t.id !== transId);
    state.installments = state.installments.filter(i => i.transacaoId !== transId);

    document.getElementById('bottom-sheet-backdrop').style.display = 'none';
    document.getElementById('installments-detail-card').style.display = 'none';

    saveStateToLocalStorage();
    updateUI();
};

window.editTransaction = function(transId) {
    const trans = state.transactions.find(t => t.id === transId);
    if (!trans) return;

    editingTransactionId = trans.id;

    // Ajustar título do modal
    document.getElementById('modal-title-text').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Lançamento';

    // Preencher campos do modal
    document.getElementById('trans-desc').value = trans.descricao;
    document.getElementById('trans-val').value = trans.valorTotal;
    document.getElementById('trans-date').value = trans.data;
    document.getElementById('trans-type').value = trans.tipo;
    document.getElementById('trans-cat').value = trans.categoria;
    document.getElementById('trans-product').value = trans.produtoId || '';
    document.getElementById('trans-method').value = trans.metodoPagamento || 'pix';
    document.getElementById('trans-payment').value = trans.tipoPagamento;
    
    // Controle condicional de exibição do grupo de parcelas
    const installmentsGroup = document.getElementById('installments-group');
    if (trans.tipoPagamento === 'parcelado') {
        installmentsGroup.style.display = 'block';
        document.getElementById('trans-installments').value = trans.numParcelas;
    } else {
        installmentsGroup.style.display = 'none';
    }
    
    document.getElementById('trans-status').value = trans.status;

    // Abrir o modal preenchido
    document.getElementById('transaction-modal').style.display = 'flex';
};

// 5. Lista de Produtos Mobile (Estilo Cards)
function renderProductsListMobile() {
    const container = document.getElementById('products-list-mobile');
    container.innerHTML = '';

    const performance = getProductPerformance();

    if (state.products.length === 0) {
        container.innerHTML = `<p class="text-center text-muted py-4">Nenhuma mercadoria cadastrada.</p>`;
        return;
    }

    performance.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card-mobile';
        card.innerHTML = `
            <div class="card-middle" style="margin-bottom: 4px;">
                <span class="card-title">${p.nome}</span>
                <button class="btn-action delete" title="Excluir" onclick="deleteProduct('${p.id}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="card-top" style="justify-content: flex-start; gap: 16px;">
                <div>
                    <small class="text-muted" style="display:block;">Custo unitário</small>
                    <strong>${formatCurrency(p.precoCusto)}</strong>
                </div>
                <div>
                    <small class="text-muted" style="display:block;">Vendas</small>
                    <strong>${p.qtdVendas} un</strong>
                </div>
                <div style="margin-left: auto; text-align: right;">
                    <small class="text-muted" style="display:block;">Total Faturado</small>
                    <strong class="text-green">${formatCurrency(p.faturamento)}</strong>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.deleteProduct = function(productId) {
    if (!confirm('Excluir este produto?')) return;

    state.products = state.products.filter(p => p.id !== productId);
    state.transactions.forEach(t => {
        if (t.produtoId === productId) t.produtoId = '';
    });

    saveStateToLocalStorage();
    updateUI();
};

// 6. Preencher Drops
function populateSelects() {
    const transProductSelect = document.getElementById('trans-product');
    const calcProductSelect = document.getElementById('calc-select-product');

    const prevTransVal = transProductSelect.value;
    const prevCalcVal = calcProductSelect.value;

    transProductSelect.innerHTML = '<option value="">Nenhum produto associado</option>';
    calcProductSelect.innerHTML = '<option value="">-- Selecione para carregar custo --</option>';

    state.products.forEach(p => {
        const opt1 = document.createElement('option');
        opt1.value = p.id;
        opt1.innerText = p.nome;
        transProductSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = p.id;
        opt2.innerText = `${p.nome} (${formatCurrency(p.precoCusto)})`;
        calcProductSelect.appendChild(opt2);
    });

    transProductSelect.value = prevTransVal;
    calcProductSelect.value = prevCalcVal;
}

// --- CALCULO MARKUP ---
function calculatePriceMarkup() {
    const costInput = document.getElementById('calc-cost');
    const fixedCostsInput = document.getElementById('calc-fixed-costs');
    const taxesInput = document.getElementById('calc-taxes');
    const marginInput = document.getElementById('calc-margin');

    const cost = parseFloat(costInput.value) || 0;
    const fixed = parseFloat(fixedCostsInput.value) || 0;
    const taxes = parseFloat(taxesInput.value) || 0;
    const margin = parseFloat(marginInput.value) || 0;

    const percentageSum = fixed + taxes + margin;

    const idealPriceEl = document.getElementById('calc-ideal-price');
    const markupFactorEl = document.getElementById('calc-markup-factor');
    
    const bdCost = document.getElementById('breakdown-cost');
    const bdFixed = document.getElementById('breakdown-fixed');
    const bdTaxes = document.getElementById('breakdown-taxes');
    const bdProfit = document.getElementById('breakdown-profit');

    if (percentageSum >= 100) {
        idealPriceEl.innerText = 'Inválido';
        markupFactorEl.innerText = 'Soma % >= 100%';
        bdCost.innerText = `${formatCurrency(cost)} (Custo Base)`;
        bdFixed.innerText = 'Ajuste taxas';
        bdTaxes.innerText = 'Ajuste taxas';
        bdProfit.innerText = 'Ajuste taxas';
        return;
    }

    const factorMarkup = 100 / (100 - percentageSum);
    const idealPrice = cost * factorMarkup;

    idealPriceEl.innerText = formatCurrency(idealPrice);
    markupFactorEl.innerText = factorMarkup.toFixed(2) + 'x';

    const valFixed = idealPrice * (fixed / 100);
    const valTaxes = idealPrice * (taxes / 100);
    const valProfit = idealPrice * (margin / 100);

    bdCost.innerText = `${formatCurrency(cost)} (${((cost/idealPrice)*100).toFixed(1)}%)`;
    bdFixed.innerText = `${formatCurrency(valFixed)} (${fixed.toFixed(1)}%)`;
    bdTaxes.innerText = `${formatCurrency(valTaxes)} (${taxes.toFixed(1)}%)`;
    bdProfit.innerText = `${formatCurrency(valProfit)} (${margin.toFixed(1)}%)`;
}

// --- CONTROLES DE FECHAMENTO MENSAL E CATEGORIAS ---

function populateMonthlyReportPeriodSelector() {
    const select = document.getElementById('monthly-select-period');
    if (!select) return;
    select.innerHTML = '';
    
    const monthsNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const currentYear = parseInt(SYSTEM_TODAY.substring(0, 4)) || 2026;
    const currentMonthStr = SYSTEM_TODAY.substring(0, 7); // "2026-06"
    
    for (let m = 0; m < 12; m++) {
        const option = document.createElement('option');
        const monthVal = String(m + 1).padStart(2, '0');
        const valueStr = `${currentYear}-${monthVal}`;
        option.value = valueStr;
        option.innerText = `${monthsNames[m]} de ${currentYear}`;
        
        if (valueStr === currentMonthStr) {
            option.selected = true;
        }
        select.appendChild(option);
    }
}

function resetDatabase() {
    const profileId = state.currentProfile || 'default';
    localStorage.removeItem(`financeiq_products_${profileId}`);
    localStorage.removeItem(`financeiq_transactions_${profileId}`);
    localStorage.removeItem(`financeiq_installments_${profileId}`);
    
    loadProfileData(profileId);
    
    // Voltar para a aba principal (dashboard)
    switchTab('dashboard');
    
    updateUI();
    alert('Banco de dados deste fluxo resetado com sucesso!');
}

function renderCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const currentMonthStr = SYSTEM_TODAY.substring(0, 7);
    
    const categoryTotals = {};
    
    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;
        
        if (trans.tipo === 'saida' && install.dataVencimento.startsWith(currentMonthStr)) {
            const cat = trans.categoria || 'Outros';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + install.valor;
        }
    });
    
    const categories = Object.keys(categoryTotals);
    const totals = Object.values(categoryTotals);
    
    if (categories.length === 0) {
        if (categoryChartInstance) {
            categoryChartInstance.destroy();
            categoryChartInstance = null;
        }
        
        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Nenhuma Despesa'],
                datasets: [{
                    data: [1],
                    backgroundColor: ['rgba(255, 255, 255, 0.05)'],
                    borderColor: ['rgba(255, 255, 255, 0.1)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#6b7280', font: { family: 'Outfit', size: 10 } }
                    },
                    tooltip: { enabled: false }
                }
            }
        });
        return;
    }
    
    const colors = [
        '#ef4444',
        '#f59e0b',
        '#3b82f6',
        '#ec4899',
        '#8b5cf6',
        '#06b6d4',
        '#10b981',
        '#6366f1'
    ];
    
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }
    
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: totals,
                backgroundColor: colors.slice(0, categories.length),
                borderColor: '#111827',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        font: { family: 'Outfit', size: 10 },
                        boxWidth: 12,
                        padding: 10
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((val / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(val)} (${percent}%)`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

function renderMonthlyReport() {
    const select = document.getElementById('monthly-select-period');
    if (!select) return;
    const selectedMonth = select.value;
    
    let exitsTotal = 0;
    let exitsPaid = 0;
    let entriesTotal = 0;
    let entriesPaid = 0;
    
    const exitsListContainer = document.getElementById('monthly-exits-list');
    const entriesListContainer = document.getElementById('monthly-entries-list');
    
    if (!exitsListContainer || !entriesListContainer) return;
    
    exitsListContainer.innerHTML = '';
    entriesListContainer.innerHTML = '';
    
    const selectedInstallments = state.installments.filter(inst => {
        return inst.dataVencimento.startsWith(selectedMonth);
    });
    
    if (selectedInstallments.length === 0) {
        exitsListContainer.innerHTML = '<p class="text-center text-muted py-4">Nenhuma despesa neste período.</p>';
        entriesListContainer.innerHTML = '<p class="text-center text-muted py-4">Nenhuma receita neste período.</p>';
        
        document.getElementById('monthly-total-exits').innerText = formatCurrency(0);
        document.getElementById('monthly-detail-exits').innerText = 'R$ 0,00 Pago / R$ 0,00 Pend.';
        document.getElementById('monthly-total-entries').innerText = formatCurrency(0);
        document.getElementById('monthly-detail-entries').innerText = 'R$ 0,00 Rec. / R$ 0,00 Pend.';
        return;
    }
    
    selectedInstallments.forEach(inst => {
        const trans = state.transactions.find(t => t.id === inst.transacaoId);
        if (!trans) return;
        
        const isEntrada = trans.tipo === 'entrada';
        const isPaid = inst.status === 'pago';
        const val = inst.valor;
        
        if (isEntrada) {
            entriesTotal += val;
            if (isPaid) entriesPaid += val;
        } else {
            exitsTotal += val;
            if (isPaid) exitsPaid += val;
        }
        
        const itemEl = document.createElement('div');
        itemEl.className = 'installment-item-mobile';
        itemEl.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px; margin-bottom: 8px;';
        
        const labelParcela = trans.numParcelas > 1 ? ` (Parc. ${inst.numeroParcela}/${trans.numParcelas})` : '';
        const paymentMethodLabel = (trans.metodoPagamento || 'pix').toUpperCase();
        
        const actionBtn = isPaid 
            ? `<button class="btn-action" title="Marcar como Pendente" onclick="toggleMonthlyInstallmentStatus('${inst.id}')"><i class="fa-solid fa-clock text-orange"></i></button>`
            : `<button class="btn-action toggle-paid" title="Marcar como Pago" onclick="toggleMonthlyInstallmentStatus('${inst.id}')"><i class="fa-solid fa-circle-check text-green"></i></button>`;
            
        itemEl.innerHTML = `
            <div>
                <strong>${trans.descricao}${labelParcela}</strong>
                <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">
                    Venc: ${formatDate(inst.dataVencimento)} | Categoria: ${trans.categoria} | <span style="color: var(--color-primary); font-weight:600;">${paymentMethodLabel}</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
                <span class="${isEntrada ? 'type-in' : 'type-out'}" style="font-weight: 700;">
                    ${isEntrada ? '+' : '-'} ${formatCurrency(val)}
                </span>
                <span class="status-badge ${isPaid ? 'paid' : 'pending'}" style="font-size: 9px; padding: 2px 6px;">
                    ${isPaid ? (isEntrada ? 'Recebido' : 'Pago') : 'Pendente'}
                </span>
                ${actionBtn}
            </div>
        `;
        
        if (isEntrada) {
            entriesListContainer.appendChild(itemEl);
        } else {
            exitsListContainer.appendChild(itemEl);
        }
    });
    
    if (exitsListContainer.children.length === 0) {
        exitsListContainer.innerHTML = '<p class="text-center text-muted py-3">Sem despesas registradas.</p>';
    }
    if (entriesListContainer.children.length === 0) {
        entriesListContainer.innerHTML = '<p class="text-center text-muted py-3">Sem receitas registradas.</p>';
    }
    
    document.getElementById('monthly-total-exits').innerText = formatCurrency(exitsTotal);
    document.getElementById('monthly-detail-exits').innerText = `${formatCurrency(exitsPaid)} Pago / ${formatCurrency(exitsTotal - exitsPaid)} Pend.`;
    
    document.getElementById('monthly-total-entries').innerText = formatCurrency(entriesTotal);
    document.getElementById('monthly-detail-entries').innerText = `${formatCurrency(entriesPaid)} Rec. / ${formatCurrency(entriesTotal - entriesPaid)} Pend.`;
}

window.toggleMonthlyInstallmentStatus = function(instId) {
    const install = state.installments.find(i => i.id === instId);
    if (!install) return;

    install.status = install.status === 'pago' ? 'pendente' : 'pago';
    
    saveStateToLocalStorage();
    updateUI();
};

// --- CONTROLES DE MÚLTIPLOS FLUXOS E SEGURANÇA POR PIN ---

function loadProfileData(profileId) {
    const storedProducts = localStorage.getItem(`financeiq_products_${profileId}`);
    const storedTransactions = localStorage.getItem(`financeiq_transactions_${profileId}`);
    const storedInstallments = localStorage.getItem(`financeiq_installments_${profileId}`);

    if (storedProducts && storedTransactions && storedInstallments) {
        state.products = JSON.parse(storedProducts);
        state.transactions = JSON.parse(storedTransactions);
        state.installments = JSON.parse(storedInstallments);
    } else {
        if (profileId === 'default') {
            state.products = seedProducts;
            state.transactions = seedTransactions;
            state.installments = [];
            
            state.transactions.forEach(trans => {
                const generated = generateInstallments(trans);
                
                if (trans.id === 't3') {
                    generated[0].status = 'pago';
                    generated[1].status = 'pago'; 
                    generated[2].status = 'pendente';
                } else if (trans.id === 't4') {
                    generated[0].status = 'pago';
                    generated[1].status = 'pago';
                    generated[2].status = 'pendente';
                    generated[3].status = 'pendente';
                    generated[4].status = 'pendente';
                    generated[5].status = 'pendente';
                }
                
                state.installments.push(...generated);
            });
        } else {
            state.products = [];
            state.transactions = [];
            state.installments = [];
        }
        
        saveStateToLocalStorage();
    }
    
    populateMonthlyReportPeriodSelector();
}

function populateProfileSelectors() {
    const headerSelect = document.getElementById('header-profile-select');
    const modalListContainer = document.getElementById('profiles-list-container');
    
    if (headerSelect) {
        headerSelect.innerHTML = '';
        state.profiles.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id;
            opt.innerText = p.name;
            if (p.id === state.currentProfile) {
                opt.selected = true;
            }
            headerSelect.appendChild(opt);
        });
    }
    
    if (modalListContainer) {
        modalListContainer.innerHTML = '';
        state.profiles.forEach(p => {
            const row = document.createElement('div');
            row.className = 'profile-item-row';
            
            const deleteBtn = p.id === 'default'
                ? ''
                : `<button class="btn-action delete" title="Excluir" onclick="deleteProfile('${p.id}')"><i class="fa-solid fa-trash"></i></button>`;
                
            row.innerHTML = `
                <span class="profile-item-name">${p.name}</span>
                <div class="profile-item-actions">
                    ${deleteBtn}
                </div>
            `;
            modalListContainer.appendChild(row);
        });
    }
}

window.switchProfile = function(profileId) {
    if (!state.profiles.some(p => p.id === profileId)) return;
    state.currentProfile = profileId;
    localStorage.setItem('financeiq_active_profile', profileId);
    
    loadProfileData(profileId);
    updateUI();
};

function createNewProfile(name) {
    const id = 'p-' + Date.now();
    state.profiles.push({ id, name });
    saveStateToLocalStorage();
    populateProfileSelectors();
    switchProfile(id);
    alert(`Novo fluxo "${name}" criado e ativo!`);
}

window.deleteProfile = function(profileId) {
    if (profileId === 'default') return;
    if (!confirm('Tem certeza de que deseja excluir este fluxo? Todos os lançamentos e produtos deste perfil serão permanentemente apagados.')) return;
    
    state.profiles = state.profiles.filter(p => p.id !== profileId);
    
    localStorage.removeItem(`financeiq_products_${profileId}`);
    localStorage.removeItem(`financeiq_transactions_${profileId}`);
    localStorage.removeItem(`financeiq_installments_${profileId}`);
    
    if (state.currentProfile === profileId) {
        state.currentProfile = 'default';
        localStorage.setItem('financeiq_active_profile', 'default');
    }
    
    saveStateToLocalStorage();
    loadProfileData(state.currentProfile);
    populateProfileSelectors();
    updateUI();
};

let currentPinAttempt = '';

function setupPinLockKeyboard(savedPin) {
    currentPinAttempt = '';
    updatePinDots();
    
    const statusText = document.getElementById('lock-status-text');
    statusText.innerText = 'Digite seu PIN de acesso';
    statusText.style.color = 'var(--text-secondary)';
    
    const keypad = document.querySelector('.pin-keypad');
    const newKeypad = keypad.cloneNode(true);
    keypad.parentNode.replaceChild(newKeypad, keypad);
    
    newKeypad.querySelectorAll('.pin-btn[data-val]').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.getAttribute('data-val');
            if (currentPinAttempt.length < 4) {
                currentPinAttempt += val;
                updatePinDots();
                
                if (currentPinAttempt.length === 4) {
                    setTimeout(() => {
                        if (currentPinAttempt === savedPin) {
                            document.getElementById('lock-screen').style.display = 'none';
                        } else {
                            shakePinDots();
                            statusText.innerText = 'PIN incorreto. Tente novamente.';
                            statusText.style.color = 'var(--color-red)';
                            currentPinAttempt = '';
                            setTimeout(() => {
                                updatePinDots();
                            }, 500);
                        }
                    }, 150);
                }
            }
        });
    });
    
    newKeypad.querySelector('#btn-pin-delete').addEventListener('click', () => {
        if (currentPinAttempt.length > 0) {
            currentPinAttempt = currentPinAttempt.slice(0, -1);
            updatePinDots();
        }
    });
}

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-display .pin-dot');
    dots.forEach((dot, index) => {
        if (index < currentPinAttempt.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
        dot.classList.remove('error');
    });
}

function shakePinDots() {
    const dots = document.querySelectorAll('.pin-display .pin-dot');
    dots.forEach(dot => {
        dot.classList.add('error');
    });
}

function initSecurityPinToggle(hasPin) {
    const toggle = document.getElementById('settings-pin-toggle');
    const optionsDiv = document.getElementById('settings-pin-options');
    
    if (toggle) {
        toggle.checked = hasPin;
        optionsDiv.style.display = hasPin ? 'flex' : 'none';
    }
}
