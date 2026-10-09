// Configuração de Data de Hoje do Sistema
const SYSTEM_TODAY = '2026-10-08';

// --- CAMADA DE PERSISTÊNCIA OFFLINE-FIRST (INDEXEDDB + LOCALSTORAGE FALLBACK) ---
class DBManager {
    static dbName = 'FinancesIQ_DB';
    static dbVersion = 2;
    static db = null;

    static async init() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                console.warn('IndexedDB não suportado neste navegador. Usando localStorage como fallback.');
                resolve(false);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('wallets')) db.createObjectStore('wallets', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('transactions')) db.createObjectStore('transactions', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('installments')) db.createObjectStore('installments', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('attachments')) db.createObjectStore('attachments', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(true);
            };

            request.onerror = (err) => {
                console.warn('Erro ao abrir IndexedDB, usando LocalStorage fallback:', err);
                resolve(false);
            };
        });
    }

    static async saveData(storeName, dataArray) {
        if (!this.db) return false;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                store.clear();
                dataArray.forEach(item => store.put(item));
                tx.oncomplete = () => resolve(true);
                tx.onerror = () => resolve(false);
            } catch (err) {
                console.warn(`Erro ao salvar no IndexedDB (${storeName}):`, err);
                resolve(false);
            }
        });
    }

    static async loadData(storeName) {
        if (!this.db) return null;
        return new Promise((resolve) => {
            try {
                const tx = this.db.transaction(storeName, 'readonly');
                const store = tx.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(null);
            } catch (err) {
                resolve(null);
            }
        });
    }
}

// --- SEED DATA INICIAL ---
const seedWallets = [
    { id: 'w-1', nome: 'Caixa Principal', icone: 'fa-wallet', cor: '#00f2fe' },
    { id: 'w-2', nome: 'Caixa Loja/Empresa', icone: 'fa-store', cor: '#10b981' },
    { id: 'w-3', nome: 'Caixa Pessoal', icone: 'fa-user', cor: '#8b5cf6' }
];

const seedProducts = [
    { id: 'p1', nome: 'Notebook Gamer Pro', precoCusto: 3200.00 },
    { id: 'p2', nome: 'Teclado Mecânico RGB', precoCusto: 180.00 },
    { id: 'p3', nome: 'Monitor Ultrawide 34', precoCusto: 1500.00 },
    { id: 'p4', nome: 'Mouse Sem Fio 16K', precoCusto: 120.00 }
];

const seedTransactions = [
    {
        id: 't1',
        caixaId: 'w-1',
        data: '2026-10-02',
        descricao: 'Venda de Notebook Gamer Pro',
        valorTotal: 5200.00,
        tipo: 'entrada',
        categoria: 'Venda de Mercadoria',
        produtoId: 'p1',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pago',
        metodoPagamento: 'pix',
        observacao: 'Cliente Henrique Silva'
    },
    {
        id: 't2',
        caixaId: 'w-1',
        data: '2026-10-04',
        descricao: 'Luz Escritório Central',
        valorTotal: 250.00,
        tipo: 'saida',
        categoria: 'Luz/Energia',
        produtoId: '',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pago',
        metodoPagamento: 'dinheiro',
        observacao: 'Conta mês 09'
    },
    {
        id: 't3',
        caixaId: 'w-2',
        data: '2026-10-01',
        descricao: 'Venda de 2x Monitores 34',
        valorTotal: 2400.00,
        tipo: 'entrada',
        categoria: 'Venda de Mercadoria',
        produtoId: 'p3',
        tipoPagamento: 'parcelado',
        numParcelas: 3,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'cartao',
        observacao: 'Empresa Tech Corp'
    },
    {
        id: 't4',
        caixaId: 'w-2',
        data: '2026-09-10',
        descricao: 'Compra de Lote Mouses 16K',
        valorTotal: 3000.00,
        tipo: 'saida',
        categoria: 'Fornecedor de Estoque',
        produtoId: 'p4',
        tipoPagamento: 'parcelado',
        numParcelas: 6,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'cartao',
        observacao: 'Distribuidora LogTech'
    },
    {
        id: 't5',
        caixaId: 'w-1',
        data: '2026-10-15',
        descricao: 'Venda Teclado Mecânico RGB',
        valorTotal: 350.00,
        tipo: 'entrada',
        categoria: 'Venda de Mercadoria',
        produtoId: 'p2',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'pix',
        observacao: 'Balcão da Loja'
    },
    {
        id: 't6',
        caixaId: 'w-3',
        data: '2026-10-08',
        descricao: 'Assinatura Software SaaS',
        valorTotal: 150.00,
        tipo: 'saida',
        categoria: 'Internet/SaaS',
        produtoId: '',
        tipoPagamento: 'avista',
        numParcelas: 1,
        recorrencia: 'mensal',
        status: 'pendente',
        metodoPagamento: 'pix',
        observacao: 'Renovação Mensal'
    }
];

// --- ESTADO GLOBAL DA APLICAÇÃO ---
let state = {
    wallets: [],
    currentWalletId: 'w-1', // 'all' para visão consolidada de todos os caixas
    products: [],
    transactions: [],
    installments: [],
    attachments: {}, // Map: transId -> { dataUrl, fileName, fileType }
    filters: {
        search: '',
        period: 'todos',
        startDate: '',
        endDate: '',
        type: 'todos',
        status: 'todos',
        method: 'todos',
        category: 'todos',
        sort: 'date-desc'
    },
    currentTab: 'dashboard',
    activeRankTab: 'revenue',
    passcode: null
};

// Variáveis Globais de Estado de Edição e Modal
let editingTransactionId = null;
let editingWalletId = null;
let currentViewingReceiptTransId = null;
let currentPendingAttachmentData = null;
let enteredPin = '';

// Instâncias Globais Chart.js
let flowChartInstance = null;
let categoryChartInstance = null;

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', async () => {
    registerServiceWorker();
    await initAppStore();
    setupEventListeners();
    updateUI();
});

function registerServiceWorker() {
    if ('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado:', reg.scope))
            .catch(err => console.warn('Erro ao registrar Service Worker:', err));
    }
}

async function initAppStore() {
    document.getElementById('current-date-span').innerText = formatDate(SYSTEM_TODAY);
    document.getElementById('trans-date').value = SYSTEM_TODAY;
    
    // Tenta inicializar IndexedDB
    const isIndexedDBAvailable = await DBManager.init();

    let loadedWallets = null;
    let loadedProducts = null;
    let loadedTransactions = null;
    let loadedInstallments = null;
    let loadedAttachments = null;

    if (isIndexedDBAvailable) {
        loadedWallets = await DBManager.loadData('wallets');
        loadedProducts = await DBManager.loadData('products');
        loadedTransactions = await DBManager.loadData('transactions');
        loadedInstallments = await DBManager.loadData('installments');
        const attList = await DBManager.loadData('attachments');
        if (attList) {
            loadedAttachments = {};
            attList.forEach(item => loadedAttachments[item.id] = item);
        }
    }

    // Fallback para LocalStorage se IndexedDB estiver vazio
    if (!loadedWallets || loadedWallets.length === 0) {
        const storedWallets = localStorage.getItem('financeiq_wallets');
        loadedWallets = storedWallets ? JSON.parse(storedWallets) : seedWallets;
    }

    if (!loadedProducts || loadedProducts.length === 0) {
        const storedProducts = localStorage.getItem('financeiq_products');
        loadedProducts = storedProducts ? JSON.parse(storedProducts) : seedProducts;
    }

    if (!loadedTransactions || loadedTransactions.length === 0) {
        const storedTransactions = localStorage.getItem('financeiq_transactions');
        loadedTransactions = storedTransactions ? JSON.parse(storedTransactions) : seedTransactions;
    }

    if (!loadedInstallments || loadedInstallments.length === 0) {
        const storedInstallments = localStorage.getItem('financeiq_installments');
        if (storedInstallments) {
            loadedInstallments = JSON.parse(storedInstallments);
        } else {
            loadedInstallments = [];
            loadedTransactions.forEach(trans => {
                const generated = generateInstallments(trans);
                if (trans.id === 't3') {
                    generated[0].status = 'pago';
                    generated[1].status = 'pendente';
                } else if (trans.id === 't4') {
                    generated[0].status = 'pago';
                    generated[1].status = 'pago';
                }
                loadedInstallments.push(...generated);
            });
        }
    }

    if (!loadedAttachments) {
        const storedAttachments = localStorage.getItem('financeiq_attachments');
        loadedAttachments = storedAttachments ? JSON.parse(storedAttachments) : {};
    }

    state.wallets = loadedWallets;
    state.products = loadedProducts;
    state.transactions = loadedTransactions;
    state.installments = loadedInstallments;
    state.attachments = loadedAttachments;

    const storedPasscode = localStorage.getItem('financeiq_passcode');
    if (storedPasscode) {
        state.passcode = storedPasscode;
        document.getElementById('lock-screen').style.display = 'flex';
        resetLockScreenUI();
    } else {
        state.passcode = null;
        document.getElementById('lock-screen').style.display = 'none';
    }

    saveStateToStorage();
    populateMonthlyReportPeriodSelector();
    populateWalletSelects();
    updateWalletBarUI();
}

// Persistência síncrona/assíncrona unificada
function saveStateToStorage() {
    localStorage.setItem('financeiq_wallets', JSON.stringify(state.wallets));
    localStorage.setItem('financeiq_products', JSON.stringify(state.products));
    localStorage.setItem('financeiq_transactions', JSON.stringify(state.transactions));
    localStorage.setItem('financeiq_installments', JSON.stringify(state.installments));
    localStorage.setItem('financeiq_attachments', JSON.stringify(state.attachments));
    localStorage.setItem('financeiq_passcode', state.passcode || '');

    // Sync IndexedDB em background
    if (DBManager.db) {
        DBManager.saveData('wallets', state.wallets);
        DBManager.saveData('products', state.products);
        DBManager.saveData('transactions', state.transactions);
        DBManager.saveData('installments', state.installments);
        
        const attArray = Object.keys(state.attachments).map(key => ({ id: key, ...state.attachments[key] }));
        DBManager.saveData('attachments', attArray);
    }
}

// --- FORMATADORES & AUXILIARES DE DATA ---
function formatDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
    const val = Number(value) || 0;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

function addMonths(dateStr, months) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, 1);
    date.setMonth(date.getMonth() + months);
    
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const targetDay = Math.min(day, lastDayOfMonth);
    date.setDate(targetDay);
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd}`;
}

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

// --- GERENCIAMENTO DE CAIXAS (MULTI-WALLET SYSTEM) ---
function updateWalletBarUI() {
    const activeWalletNameEl = document.getElementById('active-wallet-name');
    const activeWalletIconEl = document.getElementById('active-wallet-icon');
    const activeWalletDotEl = document.getElementById('active-wallet-dot');
    const dashboardSubtitleEl = document.getElementById('dashboard-wallet-subtitle');

    if (state.currentWalletId === 'all') {
        activeWalletNameEl.innerText = 'Todos os Caixas';
        activeWalletIconEl.className = 'fa-solid fa-layer-group wallet-btn-icon';
        activeWalletDotEl.style.backgroundColor = '#00f2fe';
        dashboardSubtitleEl.innerText = 'Exibindo contexto: Visão Consolidada (Todos os Caixas)';
    } else {
        const w = state.wallets.find(item => item.id === state.currentWalletId) || state.wallets[0];
        if (w) {
            activeWalletNameEl.innerText = w.nome;
            activeWalletIconEl.className = `fa-solid ${w.icone || 'fa-wallet'} wallet-btn-icon`;
            activeWalletDotEl.style.backgroundColor = w.cor || '#00f2fe';
            dashboardSubtitleEl.innerText = `Exibindo contexto: ${w.nome}`;
        }
    }
    renderWalletDropdownItems();
}

function renderWalletDropdownItems() {
    const listContainer = document.getElementById('wallet-dropdown-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    // Opção "Todos os Caixas" (Consolidado)
    const allDiv = document.createElement('div');
    allDiv.className = `wallet-dropdown-item ${state.currentWalletId === 'all' ? 'active' : ''}`;
    allDiv.innerHTML = `
        <div class="wallet-item-left">
            <span class="wallet-color-dot" style="background-color: #00f2fe;"></span>
            <i class="fa-solid fa-layer-group text-primary" style="font-size: 13px;"></i>
            <span class="wallet-item-title">Todos os Caixas</span>
        </div>
        <span class="wallet-item-balance">${formatCurrency(calculateWalletBalance('all'))}</span>
    `;
    allDiv.addEventListener('click', () => {
        state.currentWalletId = 'all';
        updateWalletBarUI();
        closeWalletDropdown();
        updateUI();
    });
    listContainer.appendChild(allDiv);

    // Caixas Individuais
    state.wallets.forEach(w => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `wallet-dropdown-item ${state.currentWalletId === w.id ? 'active' : ''}`;
        const bal = calculateWalletBalance(w.id);

        itemDiv.innerHTML = `
            <div class="wallet-item-left">
                <span class="wallet-color-dot" style="background-color: ${w.cor || '#00f2fe'};"></span>
                <i class="fa-solid ${w.icone || 'fa-wallet'}" style="color: ${w.cor || 'var(--text-primary)'}; font-size: 13px;"></i>
                <span class="wallet-item-title">${w.nome}</span>
            </div>
            <span class="wallet-item-balance ${bal >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(bal)}</span>
        `;
        itemDiv.addEventListener('click', () => {
            state.currentWalletId = w.id;
            updateWalletBarUI();
            closeWalletDropdown();
            updateUI();
        });
        listContainer.appendChild(itemDiv);
    });
}

function calculateWalletBalance(walletId) {
    let balance = 0;
    state.installments.forEach(inst => {
        const trans = state.transactions.find(t => t.id === inst.transacaoId);
        if (!trans) return;

        if (walletId !== 'all' && (trans.caixaId || 'w-1') !== walletId) return;

        if (inst.status === 'pago' && inst.dataVencimento <= SYSTEM_TODAY) {
            balance += trans.tipo === 'entrada' ? inst.valor : -inst.valor;
        }
    });
    return balance;
}

function closeWalletDropdown() {
    const menu = document.getElementById('wallet-dropdown-menu');
    if (menu) menu.style.display = 'none';
}

function populateWalletSelects() {
    const transWalletSelect = document.getElementById('trans-wallet');
    if (!transWalletSelect) return;

    transWalletSelect.innerHTML = '';
    state.wallets.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w.id;
        opt.innerText = w.nome;
        transWalletSelect.appendChild(opt);
    });

    if (state.currentWalletId !== 'all') {
        transWalletSelect.value = state.currentWalletId;
    } else if (state.wallets.length > 0) {
        transWalletSelect.value = state.wallets[0].id;
    }
}

function renderWalletManagerList() {
    const container = document.getElementById('wallets-list-container');
    if (!container) return;
    container.innerHTML = '';

    state.wallets.forEach(w => {
        const transCount = state.transactions.filter(t => (t.caixaId || 'w-1') === w.id).length;

        const row = document.createElement('div');
        row.className = 'wallet-item-row';
        row.innerHTML = `
            <div class="wallet-item-row-left">
                <div class="wallet-icon-box" style="background-color: ${w.cor || '#00f2fe'};">
                    <i class="fa-solid ${w.icone || 'fa-wallet'}"></i>
                </div>
                <div>
                    <strong style="font-size: 13px; display: block;">${w.nome}</strong>
                    <span style="font-size: 11px; color: var(--text-secondary);">${transCount} lançamentos vinculados</span>
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button class="btn-action" title="Editar Caixa" onclick="editWallet('${w.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-action delete" title="Excluir Caixa" onclick="deleteWallet('${w.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        container.appendChild(row);
    });
}

window.editWallet = function(walletId) {
    const w = state.wallets.find(item => item.id === walletId);
    if (!w) return;

    editingWalletId = w.id;
    document.getElementById('wallet-form-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Caixa';
    document.getElementById('wallet-name').value = w.nome;
    document.getElementById('wallet-icon').value = w.icone || 'fa-wallet';
    document.getElementById('wallet-color').value = w.cor || '#00f2fe';
    document.getElementById('btn-cancel-wallet-edit').style.display = 'block';
};

window.deleteWallet = function(walletId) {
    const w = state.wallets.find(item => item.id === walletId);
    if (!w) return;

    // TRAVA DE SEGURANÇA: Bloqueia exclusão direta de caixas com histórico de lançamentos
    const transCount = state.transactions.filter(t => (t.caixaId || 'w-1') === walletId).length;
    if (transCount > 0) {
        alert(`🔒 Trava de Segurança:\nO caixa "${w.nome}" possui ${transCount} lançamentos vinculados a ele.\nPara não perder dados históricos acidentalmente, você precisa excluir ou reassociar os lançamentos deste caixa antes de removê-lo.`);
        return;
    }

    if (state.wallets.length <= 1) {
        alert('Você deve manter pelo menos 1 caixa ativo na aplicação.');
        return;
    }

    if (confirm(`Deseja realmente excluir o caixa "${w.nome}"?`)) {
        state.wallets = state.wallets.filter(item => item.id !== walletId);
        if (state.currentWalletId === walletId) {
            state.currentWalletId = state.wallets[0].id;
        }
        saveStateToStorage();
        populateWalletSelects();
        updateWalletBarUI();
        renderWalletManagerList();
        updateUI();
    }
};

// --- FILTROS AVANÇADOS E BUSCA EM TEMPO REAL ---
function getFilteredTransactions() {
    return state.transactions.filter(t => {
        // 1. Contexto de Caixa (Multi-Wallet)
        if (state.currentWalletId !== 'all') {
            const caixa = t.caixaId || 'w-1';
            if (caixa !== state.currentWalletId) return false;
        }

        // 2. Pesquisa Textual (Real-time text search)
        if (state.filters.search) {
            const query = state.filters.search.toLowerCase().trim();
            const descMatch = (t.descricao || '').toLowerCase().includes(query);
            const obsMatch = (t.observacao || '').toLowerCase().includes(query);
            const catMatch = (t.categoria || '').toLowerCase().includes(query);
            const methodMatch = (t.metodoPagamento || '').toLowerCase().includes(query);
            if (!descMatch && !obsMatch && !catMatch && !methodMatch) return false;
        }

        // 3. Tipo (Entrada/Saída)
        if (state.filters.type !== 'todos' && t.tipo !== state.filters.type) return false;

        // 4. Status (Efetivado/Previsto)
        if (state.filters.status !== 'todos' && t.status !== state.filters.status) return false;

        // 5. Meio de Pagamento
        if (state.filters.method !== 'todos' && (t.metodoPagamento || 'pix') !== state.filters.method) return false;

        // 6. Categoria
        if (state.filters.category !== 'todos' && t.categoria !== state.filters.category) return false;

        // 7. Filtro de Período
        if (!isDateMatchingPeriodFilters(t.data)) return false;

        return true;
    }).sort((a, b) => {
        // 8. Ordenação Dinâmica
        const sort = state.filters.sort;
        if (sort === 'date-desc') return b.data.localeCompare(a.data);
        if (sort === 'date-asc') return a.data.localeCompare(b.data);
        if (sort === 'val-desc') return b.valorTotal - a.valorTotal;
        if (sort === 'val-asc') return a.valorTotal - b.valorTotal;
        if (sort === 'alpha-asc') return a.descricao.localeCompare(b.descricao);
        return 0;
    });
}

function isDateMatchingPeriodFilters(dateStr) {
    const period = state.filters.period;

    if (period === 'todos') return true;

    if (period === 'hoje') {
        return dateStr === SYSTEM_TODAY;
    }

    if (period === 'semana') {
        const transDate = new Date(dateStr + 'T12:00:00');
        const today = new Date(SYSTEM_TODAY + 'T12:00:00');
        const dayOfWeek = today.getDay();
        const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), diffToMonday, 0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return transDate >= startOfWeek && transDate <= endOfWeek;
    }

    if (period === 'mes') {
        return dateStr.substring(0, 7) === SYSTEM_TODAY.substring(0, 7);
    }

    if (period === 'mes-passado') {
        const today = new Date(SYSTEM_TODAY + 'T12:00:00');
        today.setMonth(today.getMonth() - 1);
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        return dateStr.substring(0, 7) === `${yyyy}-${mm}`;
    }

    if (period === 'ano') {
        return dateStr.substring(0, 4) === SYSTEM_TODAY.substring(0, 4);
    }

    if (period === 'custom') {
        if (state.filters.startDate && dateStr < state.filters.startDate) return false;
        if (state.filters.endDate && dateStr > state.filters.endDate) return false;
        return true;
    }

    return true;
}

function renderFilterChips() {
    const container = document.getElementById('chips-list');
    const bar = document.getElementById('active-chips-bar');
    const badge = document.getElementById('filter-count-badge');
    if (!container || !bar) return;

    container.innerHTML = '';
    let activeCount = 0;

    const addChip = (key, label, valueText, resetFn) => {
        activeCount++;
        const chip = document.createElement('div');
        chip.className = 'chip-item';
        chip.innerHTML = `
            <span>${label}: <strong>${valueText}</strong></span>
            <button class="chip-remove-btn" title="Remover"><i class="fa-solid fa-xmark"></i></button>
        `;
        chip.querySelector('.chip-remove-btn').addEventListener('click', resetFn);
        container.appendChild(chip);
    };

    if (state.filters.search) {
        addChip('search', 'Busca', `"${state.filters.search}"`, () => {
            state.filters.search = '';
            document.getElementById('filter-search').value = '';
            document.getElementById('btn-clear-search').style.display = 'none';
            updateUI();
        });
    }

    if (state.filters.period !== 'todos') {
        const mapLabel = { hoje: 'Hoje', semana: 'Esta Semana', mes: 'Este Mês', 'mes-passado': 'Mês Passado', ano: 'Este Ano', custom: 'Personalizado' };
        addChip('period', 'Período', mapLabel[state.filters.period] || state.filters.period, () => {
            state.filters.period = 'todos';
            document.getElementById('filter-period').value = 'todos';
            document.getElementById('filter-custom-dates').style.display = 'none';
            updateUI();
        });
    }

    if (state.filters.type !== 'todos') {
        addChip('type', 'Tipo', state.filters.type === 'entrada' ? 'Entradas' : 'Saídas', () => {
            state.filters.type = 'todos';
            document.getElementById('filter-type').value = 'todos';
            updateUI();
        });
    }

    if (state.filters.status !== 'todos') {
        addChip('status', 'Status', state.filters.status === 'pago' ? 'Efetivado' : 'Previsto', () => {
            state.filters.status = 'todos';
            document.getElementById('filter-status').value = 'todos';
            updateUI();
        });
    }

    if (state.filters.method !== 'todos') {
        addChip('method', 'Meio', state.filters.method.toUpperCase(), () => {
            state.filters.method = 'todos';
            document.getElementById('filter-method').value = 'todos';
            updateUI();
        });
    }

    if (state.filters.category !== 'todos') {
        addChip('category', 'Categoria', state.filters.category, () => {
            state.filters.category = 'todos';
            document.getElementById('filter-cat').value = 'todos';
            updateUI();
        });
    }

    if (activeCount > 0) {
        bar.style.display = 'flex';
        badge.style.display = 'flex';
        badge.innerText = activeCount;
    } else {
        bar.style.display = 'none';
        badge.style.display = 'none';
    }
}

// --- DRE SIMPLIFICADO (DEMONSTRATIVO DE RESULTADO) ---
function renderDREStatement() {
    const container = document.getElementById('dre-table-container');
    const select = document.getElementById('monthly-select-period');
    const periodBadge = document.getElementById('dre-period-badge');

    if (!container || !select) return;
    const selectedMonth = select.value;
    periodBadge.innerText = select.options[select.selectedIndex]?.text || 'Mês Atual';

    // Lançamentos do mês selecionado respeitando o contexto de caixa ativo
    let grossRevenue = 0;
    let variableCosts = 0;
    let fixedCosts = 0;

    const breakdownVar = {};
    const breakdownFix = {};

    state.installments.forEach(inst => {
        const trans = state.transactions.find(t => t.id === inst.transacaoId);
        if (!trans) return;

        // Contexto Multi-Caixa
        if (state.currentWalletId !== 'all' && (trans.caixaId || 'w-1') !== state.currentWalletId) return;

        // Período Mensal
        if (!inst.dataVencimento.startsWith(selectedMonth)) return;

        const val = inst.valor;
        if (trans.tipo === 'entrada') {
            grossRevenue += val;
        } else {
            const cat = trans.categoria || 'Outros';
            if (cat === 'Fornecedor de Estoque' || cat === 'Impostos/Taxas') {
                variableCosts += val;
                breakdownVar[cat] = (breakdownVar[cat] || 0) + val;
            } else {
                fixedCosts += val;
                breakdownFix[cat] = (breakdownFix[cat] || 0) + val;
            }
        }
    });

    const contributionMargin = grossRevenue - variableCosts;
    const netResult = contributionMargin - fixedCosts;

    const pct = (val) => grossRevenue > 0 ? ((val / grossRevenue) * 100).toFixed(1) + '%' : '0.0%';

    container.innerHTML = `
        <div class="dre-row header-gross">
            <span>(+) Receita Bruta Total</span>
            <span class="dre-val text-green">${formatCurrency(grossRevenue)} <span class="dre-pct">(100%)</span></span>
        </div>

        <div class="dre-row header-variable">
            <span>(-) Custos e Despesas Variáveis</span>
            <span class="dre-val text-red">- ${formatCurrency(variableCosts)} <span class="dre-pct">(${pct(variableCosts)})</span></span>
        </div>
        ${Object.keys(breakdownVar).map(cat => `
            <div class="dre-row sub-item">
                <span>↳ ${cat}</span>
                <span>- ${formatCurrency(breakdownVar[cat])}</span>
            </div>
        `).join('')}

        <div class="dre-row total-margin">
            <span>(=) Margem de Contribuição</span>
            <span class="dre-val ${contributionMargin >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(contributionMargin)} <span class="dre-pct">(${pct(contributionMargin)})</span></span>
        </div>

        <div class="dre-row header-fixed">
            <span>(-) Custos e Despesas Fixas</span>
            <span class="dre-val text-orange">- ${formatCurrency(fixedCosts)} <span class="dre-pct">(${pct(fixedCosts)})</span></span>
        </div>
        ${Object.keys(breakdownFix).map(cat => `
            <div class="dre-row sub-item">
                <span>↳ ${cat}</span>
                <span>- ${formatCurrency(breakdownFix[cat])}</span>
            </div>
        `).join('')}

        <div class="dre-row total-net ${netResult >= 0 ? '' : 'loss'}">
            <span>(=) Resultado Líquido Operacional</span>
            <span class="dre-val ${netResult >= 0 ? 'text-green' : 'text-red'}">${formatCurrency(netResult)} <span class="dre-pct">(${pct(netResult)})</span></span>
        </div>
    `;
}

// --- EXPORTAÇÃO SEGURO CSV / EXCEL COM UTF-8 BOM ---
function exportTransactionsToCSV(customList = null, filename = 'extrato_financeiro.csv') {
    const list = customList || getFilteredTransactions();
    if (list.length === 0) {
        alert('Nenhum lançamento para exportar.');
        return;
    }

    // Cabeçalho CSV formatado para Excel Brasil
    let csv = '\uFEFFData;Caixa;Descrição;Categoria;Tipo;Valor (R$);Meio de Pagamento;Status;Observação\n';

    list.forEach(t => {
        const w = state.wallets.find(item => item.id === (t.caixaId || 'w-1'));
        const caixaNome = w ? w.nome : 'Caixa Principal';
        const valFormated = t.valorTotal.toFixed(2).replace('.', ',');
        const desc = (t.descricao || '').replace(/;/g, ',');
        const obs = (t.observacao || '').replace(/;/g, ',');

        csv += `${formatDate(t.data)};"${caixaNome}";"${desc}";"${t.categoria}";"${t.tipo.toUpperCase()}";${valFormated};"${(t.metodoPagamento || 'pix').toUpperCase()}";"${t.status === 'pago' ? 'EFETIVADO' : 'PREVISTO'}";"${obs}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// --- EVENTOS E LISTENERS DO SISTEMA ---
function setupEventListeners() {
    // Bottom Navigation Bar
    document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Seletor de Caixa (Dropdown Bar)
    const btnWalletSelector = document.getElementById('btn-wallet-selector');
    const walletDropdownMenu = document.getElementById('wallet-dropdown-menu');

    btnWalletSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = walletDropdownMenu.style.display === 'block';
        walletDropdownMenu.style.display = isOpen ? 'none' : 'block';
    });

    document.addEventListener('click', () => {
        closeWalletDropdown();
    });

    // Modal Gerenciador de Caixas
    const walletModal = document.getElementById('wallet-modal');
    document.getElementById('btn-manage-wallets').addEventListener('click', () => {
        editingWalletId = null;
        document.getElementById('wallet-form').reset();
        document.getElementById('wallet-form-title').innerHTML = '<i class="fa-solid fa-plus"></i> Criar Novo Caixa';
        document.getElementById('btn-cancel-wallet-edit').style.display = 'none';
        renderWalletManagerList();
        walletModal.style.display = 'flex';
    });

    document.getElementById('close-wallet-modal-btn').addEventListener('click', () => {
        walletModal.style.display = 'none';
    });

    document.getElementById('btn-cancel-wallet-edit').addEventListener('click', () => {
        editingWalletId = null;
        document.getElementById('wallet-form').reset();
        document.getElementById('wallet-form-title').innerHTML = '<i class="fa-solid fa-plus"></i> Criar Novo Caixa';
        document.getElementById('btn-cancel-wallet-edit').style.display = 'none';
    });

    document.getElementById('wallet-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('wallet-name').value;
        const icone = document.getElementById('wallet-icon').value;
        const cor = document.getElementById('wallet-color').value;

        if (editingWalletId) {
            const idx = state.wallets.findIndex(w => w.id === editingWalletId);
            if (idx !== -1) {
                state.wallets[idx] = { ...state.wallets[idx], nome, icone, cor };
            }
            editingWalletId = null;
        } else {
            const newW = {
                id: 'w-' + Date.now(),
                nome,
                icone,
                cor
            };
            state.wallets.push(newW);
        }

        saveStateToStorage();
        populateWalletSelects();
        updateWalletBarUI();
        renderWalletManagerList();
        updateUI();

        document.getElementById('wallet-form').reset();
        document.getElementById('btn-cancel-wallet-edit').style.display = 'none';
    });

    // Pesquisa Textual e Painel de Filtros Avançados
    const filterSearchInput = document.getElementById('filter-search');
    const btnClearSearch = document.getElementById('btn-clear-search');
    const btnToggleFilters = document.getElementById('btn-toggle-filters');
    const advancedFilterPanel = document.getElementById('advanced-filter-panel');

    filterSearchInput.addEventListener('input', (e) => {
        state.filters.search = e.target.value;
        btnClearSearch.style.display = e.target.value ? 'block' : 'none';
        updateUI();
    });

    btnClearSearch.addEventListener('click', () => {
        filterSearchInput.value = '';
        state.filters.search = '';
        btnClearSearch.style.display = 'none';
        updateUI();
    });

    btnToggleFilters.addEventListener('click', () => {
        const isOpen = advancedFilterPanel.style.display === 'block';
        advancedFilterPanel.style.display = isOpen ? 'none' : 'block';
        btnToggleFilters.classList.toggle('active', !isOpen);
    });

    document.getElementById('btn-reset-all-filters').addEventListener('click', () => {
        state.filters = {
            search: '',
            period: 'todos',
            startDate: '',
            endDate: '',
            type: 'todos',
            status: 'todos',
            method: 'todos',
            category: 'todos',
            sort: 'date-desc'
        };
        filterSearchInput.value = '';
        btnClearSearch.style.display = 'none';
        document.getElementById('filter-period').value = 'todos';
        document.getElementById('filter-type').value = 'todos';
        document.getElementById('filter-status').value = 'todos';
        document.getElementById('filter-method').value = 'todos';
        document.getElementById('filter-cat').value = 'todos';
        document.getElementById('filter-sort').value = 'date-desc';
        document.getElementById('filter-custom-dates').style.display = 'none';
        updateUI();
    });

    document.getElementById('filter-period').addEventListener('change', (e) => {
        state.filters.period = e.target.value;
        document.getElementById('filter-custom-dates').style.display = e.target.value === 'custom' ? 'flex' : 'none';
        updateUI();
    });

    document.getElementById('filter-type').addEventListener('change', (e) => { state.filters.type = e.target.value; updateUI(); });
    document.getElementById('filter-status').addEventListener('change', (e) => { state.filters.status = e.target.value; updateUI(); });
    document.getElementById('filter-method').addEventListener('change', (e) => { state.filters.method = e.target.value; updateUI(); });
    document.getElementById('filter-cat').addEventListener('change', (e) => { state.filters.category = e.target.value; updateUI(); });
    document.getElementById('filter-sort').addEventListener('change', (e) => { state.filters.sort = e.target.value; updateUI(); });

    document.getElementById('filter-start-date').addEventListener('change', (e) => { state.filters.startDate = e.target.value; updateUI(); });
    document.getElementById('filter-end-date').addEventListener('change', (e) => { state.filters.endDate = e.target.value; updateUI(); });

    // Abas de Ranking de Produtos
    document.querySelectorAll('.rank-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rank-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeRankTab = btn.getAttribute('data-rank');
            renderProductRanking();
        });
    });

    // Form de Transação - Campo de Anexo (Upload em Base64)
    const attachmentInput = document.getElementById('trans-attachment');
    const attachmentPreview = document.getElementById('trans-attachment-preview');

    attachmentInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) {
            currentPendingAttachmentData = null;
            attachmentPreview.style.display = 'none';
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            currentPendingAttachmentData = {
                dataUrl: evt.target.result,
                fileName: file.name,
                fileType: file.type
            };

            attachmentPreview.style.display = 'block';
            if (file.type.startsWith('image/')) {
                attachmentPreview.innerHTML = `<img src="${evt.target.result}" alt="Preview"><br><small style="font-size:10px; color:var(--text-secondary);">${file.name}</small>`;
            } else {
                attachmentPreview.innerHTML = `<i class="fa-solid fa-file-pdf text-red" style="font-size:24px;"></i><br><small style="font-size:10px; color:var(--text-secondary);">${file.name}</small>`;
            }
        };
        reader.readAsDataURL(file);
    });

    // Condicional de Parcelas no Modal de Transação
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

    // Abrir/Fechar Modal de Cadastro
    const transModal = document.getElementById('transaction-modal');
    document.getElementById('open-transaction-modal-btn').addEventListener('click', () => {
        editingTransactionId = null;
        currentPendingAttachmentData = null;
        document.getElementById('modal-title-text').innerHTML = '<i class="fa-solid fa-circle-plus"></i> Nova Movimentação';
        document.getElementById('transaction-form').reset();
        document.getElementById('trans-date').value = SYSTEM_TODAY;
        document.getElementById('installments-group').style.display = 'none';
        attachmentPreview.style.display = 'none';
        populateWalletSelects();
        transModal.style.display = 'flex';
    });

    document.getElementById('close-transaction-modal-btn').addEventListener('click', () => {
        editingTransactionId = null;
        transModal.style.display = 'none';
    });

    // Submissão do Form de Transação
    document.getElementById('transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const caixaId = document.getElementById('trans-wallet').value;
        const desc = document.getElementById('trans-desc').value;
        const val = parseFloat(document.getElementById('trans-val').value);
        const date = document.getElementById('trans-date').value;
        const type = document.getElementById('trans-type').value;
        const cat = document.getElementById('trans-cat').value;
        const obs = document.getElementById('trans-notes').value;
        const prodId = document.getElementById('trans-product').value;
        const method = document.getElementById('trans-method').value;
        const payType = document.getElementById('trans-payment').value;
        const numParc = payType === 'parcelado' ? parseInt(document.getElementById('trans-installments').value) : 1;
        const status = document.getElementById('trans-status').value;

        if (editingTransactionId) {
            const idx = state.transactions.findIndex(t => t.id === editingTransactionId);
            if (idx !== -1) {
                state.transactions[idx] = {
                    ...state.transactions[idx],
                    caixaId,
                    data: date,
                    descricao: desc,
                    valorTotal: val,
                    tipo: type,
                    categoria: cat,
                    observacao: obs,
                    produtoId: prodId,
                    metodoPagamento: method,
                    tipoPagamento: payType,
                    numParcelas: numParc,
                    status: status
                };

                if (currentPendingAttachmentData) {
                    state.attachments[editingTransactionId] = currentPendingAttachmentData;
                }

                state.installments = state.installments.filter(i => i.transacaoId !== editingTransactionId);
                const newInstallments = generateInstallments(state.transactions[idx]);
                state.installments.push(...newInstallments);
            }
            editingTransactionId = null;
        } else {
            const newId = 't-' + Date.now();
            const newTrans = {
                id: newId,
                caixaId,
                data: date,
                descricao: desc,
                valorTotal: val,
                tipo: type,
                categoria: cat,
                observacao: obs,
                produtoId: prodId,
                metodoPagamento: method,
                tipoPagamento: payType,
                numParcelas: numParc,
                recorrencia: 'mensal',
                status: status
            };

            if (currentPendingAttachmentData) {
                state.attachments[newId] = currentPendingAttachmentData;
            }

            const newInstallments = generateInstallments(newTrans);
            state.transactions.unshift(newTrans);
            state.installments.push(...newInstallments);
        }

        saveStateToStorage();
        updateUI();

        document.getElementById('transaction-form').reset();
        document.getElementById('trans-date').value = SYSTEM_TODAY;
        document.getElementById('installments-group').style.display = 'none';
        attachmentPreview.style.display = 'none';
        currentPendingAttachmentData = null;
        transModal.style.display = 'none';
    });

    // Submissão de Produto
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

        saveStateToStorage();
        updateUI();
        document.getElementById('product-form').reset();
    });

    // Exportação CSV
    document.getElementById('btn-export-transactions-csv').addEventListener('click', () => {
        exportTransactionsToCSV(getFilteredTransactions(), `extrato_financesiq_${Date.now()}.csv`);
    });

    document.getElementById('btn-export-monthly-csv').addEventListener('click', () => {
        const select = document.getElementById('monthly-select-period');
        const monthVal = select ? select.value : SYSTEM_TODAY.substring(0, 7);
        const filtered = state.transactions.filter(t => t.data.startsWith(monthVal));
        exportTransactionsToCSV(filtered, `fechamento_mensal_${monthVal}.csv`);
    });

    // Fechar Bottom Sheet de parcelas
    const sheet = document.getElementById('installments-detail-card');
    const backdrop = document.getElementById('bottom-sheet-backdrop');
    const closeSheet = () => { sheet.style.display = 'none'; backdrop.style.display = 'none'; };
    document.getElementById('btn-close-sheet').addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    // Modal Visualizador de Comprovantes
    const receiptModal = document.getElementById('receipt-viewer-modal');
    document.getElementById('close-receipt-modal-btn').addEventListener('click', () => {
        receiptModal.style.display = 'none';
    });

    document.getElementById('btn-remove-receipt').addEventListener('click', () => {
        if (currentViewingReceiptTransId && state.attachments[currentViewingReceiptTransId]) {
            if (confirm('Remover o comprovante anexado a este lançamento?')) {
                delete state.attachments[currentViewingReceiptTransId];
                saveStateToStorage();
                receiptModal.style.display = 'none';
                updateUI();
            }
        }
    });

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

    // Backup JSON
    document.getElementById('btn-export-backup').addEventListener('click', () => {
        const backupData = {
            wallets: state.wallets,
            products: state.products,
            transactions: state.transactions,
            installments: state.installments,
            attachments: state.attachments
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `financesiq_full_backup_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });

    const fileInput = document.getElementById('import-file-input');
    document.getElementById('btn-import-backup').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const imported = JSON.parse(evt.target.result);
                if (imported.products && imported.transactions && imported.installments) {
                    state.wallets = imported.wallets || seedWallets;
                    state.products = imported.products;
                    state.transactions = imported.transactions;
                    state.installments = imported.installments;
                    state.attachments = imported.attachments || {};
                    saveStateToStorage();
                    populateWalletSelects();
                    updateWalletBarUI();
                    updateUI();
                    alert('Backup restaurado com sucesso!');
                } else {
                    alert('Arquivo de backup inválido.');
                }
            } catch (err) {
                alert('Erro ao ler arquivo: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    document.getElementById('btn-reset-db').addEventListener('click', () => {
        if (confirm('Tem certeza de que deseja resetar o banco de dados? Seus lançamentos personalizados serão restaurados para os valores padrão.')) {
            resetDatabase();
        }
    });

    document.getElementById('btn-print-report').addEventListener('click', () => window.print());
    document.getElementById('monthly-select-period').addEventListener('change', () => renderMonthlyReport());

    // Teclado Lock Screen PIN
    document.querySelectorAll('.pin-key[data-val]').forEach(key => {
        key.addEventListener('click', () => {
            const val = key.getAttribute('data-val');
            if (enteredPin.length < 4) {
                enteredPin += val;
                updatePinDots();
                if (enteredPin.length === 4) {
                    setTimeout(() => {
                        if (enteredPin === state.passcode) {
                            const lockIcon = document.querySelector('.lock-icon');
                            const unlockIcon = document.querySelector('.unlock-icon');
                            if (lockIcon && unlockIcon) {
                                lockIcon.style.display = 'none';
                                unlockIcon.style.display = 'block';
                                unlockIcon.classList.add('unlock-animation');
                            }
                            setTimeout(() => {
                                const lockScreen = document.getElementById('lock-screen');
                                lockScreen.classList.add('slide-up');
                                setTimeout(() => {
                                    lockScreen.style.display = 'none';
                                    lockScreen.classList.remove('slide-up');
                                    resetLockScreenUI();
                                }, 400);
                            }, 300);
                        } else {
                            const dotsContainer = document.querySelector('.pin-dots');
                            const dots = document.querySelectorAll('.pin-dot');
                            dotsContainer.classList.add('shake');
                            dots.forEach(d => d.classList.add('error'));
                            setTimeout(() => {
                                dotsContainer.classList.remove('shake');
                                dots.forEach(d => d.classList.remove('error'));
                                enteredPin = '';
                                updatePinDots();
                            }, 500);
                        }
                    }, 100);
                }
            }
        });
    });

    document.getElementById('pin-clear').addEventListener('click', () => { enteredPin = ''; updatePinDots(); });
    document.getElementById('pin-backspace').addEventListener('click', () => { if (enteredPin.length > 0) { enteredPin = enteredPin.slice(0, -1); updatePinDots(); } });

    // PIN Modal Setup
    const pinModal = document.getElementById('pin-modal');
    document.getElementById('btn-config-pin').addEventListener('click', () => {
        document.getElementById('pin-current').value = '';
        document.getElementById('pin-new').value = '';
        document.getElementById('pin-confirm').value = '';

        if (state.passcode) {
            document.getElementById('pin-current-group').style.display = 'block';
            document.getElementById('btn-disable-pin').style.display = 'block';
            document.getElementById('pin-new-label').innerText = 'Novo PIN (4 dígitos)';
            document.getElementById('pin-modal-desc').innerText = 'Para alterar ou desativar a sua segurança, confirme as informações abaixo.';
        } else {
            document.getElementById('pin-current-group').style.display = 'none';
            document.getElementById('btn-disable-pin').style.display = 'none';
            document.getElementById('pin-new-label').innerText = 'Cadastrar PIN (4 dígitos)';
            document.getElementById('pin-modal-desc').innerText = 'Cadastre um PIN numérico de 4 dígitos para proteger o acesso aos seus dados financeiros neste dispositivo.';
        }
        pinModal.style.display = 'flex';
    });

    document.getElementById('close-pin-modal-btn').addEventListener('click', () => pinModal.style.display = 'none');

    document.getElementById('btn-save-pin').addEventListener('click', () => {
        const currentPinInput = document.getElementById('pin-current').value;
        const newPinInput = document.getElementById('pin-new').value;
        const confirmPinInput = document.getElementById('pin-confirm').value;

        if (state.passcode && currentPinInput !== state.passcode) {
            alert('O PIN atual digitado está incorreto.');
            return;
        }

        if (newPinInput.length !== 4 || isNaN(newPinInput)) {
            alert('O novo PIN deve conter exatamente 4 números.');
            return;
        }

        if (newPinInput !== confirmPinInput) {
            alert('A confirmação do PIN não confere com o novo PIN digitado.');
            return;
        }

        state.passcode = newPinInput;
        saveStateToStorage();
        pinModal.style.display = 'none';
        alert('PIN de segurança salvo com sucesso!');
    });

    document.getElementById('btn-disable-pin').addEventListener('click', () => {
        const currentPinInput = document.getElementById('pin-current').value;
        if (currentPinInput !== state.passcode) {
            alert('Digite o PIN atual correto para desativar a segurança.');
            return;
        }
        if (confirm('Tem certeza de que deseja remover a proteção por PIN?')) {
            state.passcode = null;
            saveStateToStorage();
            pinModal.style.display = 'none';
            alert('Proteção por PIN desativada com sucesso.');
        }
    });
}

function switchTab(tabId) {
    state.currentTab = tabId;
    document.querySelectorAll('.bottom-nav .nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.getAttribute('id') === tabId);
    });

    if (tabId === 'dashboard') {
        renderDashboardCharts();
    } else if (tabId === 'pricing') {
        calculatePriceMarkup();
    }
}

// --- RENDERIZAÇÃO DA UI GERAL ---
function updateUI() {
    renderMetricCards();
    renderDashboardCharts();
    renderProductRanking();
    renderTransactionsListMobile();
    renderProductsListMobile();
    populateSelects();
    renderFilterSummary();
    renderFilterChips();
    renderMonthlyReport();
    renderDREStatement();
    renderCategoryChart();
}

// 1. Métricas Globais ou por Caixa
function renderMetricCards() {
    let actualBalance = 0;
    let projectedBalance = 0;
    let toPay = 0;
    let toReceive = 0;

    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;

        // Multi-Wallet filter
        if (state.currentWalletId !== 'all' && (trans.caixaId || 'w-1') !== state.currentWalletId) return;

        const val = install.valor;
        const isEntrada = trans.tipo === 'entrada';
        const isPaid = install.status === 'pago';
        const isPastOrToday = install.dataVencimento <= SYSTEM_TODAY;

        if (isPaid && isPastOrToday) {
            actualBalance += isEntrada ? val : -val;
        }

        projectedBalance += isEntrada ? val : -val;

        if (!isPaid) {
            if (isEntrada) toReceive += val;
            else toPay += val;
        }
    });

    document.getElementById('metric-actual-balance').innerText = formatCurrency(actualBalance);
    document.getElementById('metric-projected-balance').innerText = formatCurrency(projectedBalance);
    document.getElementById('metric-to-receive').innerText = formatCurrency(toReceive);
    document.getElementById('metric-to-pay').innerText = formatCurrency(toPay);
}

// 2. Resumo de Lançamentos Filtrados
function renderFilterSummary() {
    const filteredTrans = getFilteredTransactions();
    const filteredIds = new Set(filteredTrans.map(t => t.id));

    let entriesTotal = 0;
    let entriesPaid = 0;
    let exitsTotal = 0;
    let exitsPaid = 0;

    state.installments.forEach(install => {
        if (!filteredIds.has(install.transacaoId)) return;
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;

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

    document.getElementById('filtered-count-label').innerText = `${filteredTrans.length} lançamentos`;

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
    balanceEl.className = balance >= 0 ? 'text-green' : 'text-red';
}

// 3. Gráficos de Fluxo (Chart.js)
function renderDashboardCharts() {
    const ctx = document.getElementById('flowChart').getContext('2d');
    const monthlyData = {};
    const monthsToShow = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];

    monthsToShow.forEach(m => monthlyData[m] = { entradas: 0, saidas: 0 });

    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;

        if (state.currentWalletId !== 'all' && (trans.caixaId || 'w-1') !== state.currentWalletId) return;

        const monthKey = install.dataVencimento.substring(0, 7);
        if (monthlyData[monthKey] !== undefined) {
            if (trans.tipo === 'entrada') monthlyData[monthKey].entradas += install.valor;
            else monthlyData[monthKey].saidas += install.valor;
        }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const entradas = [];
    const saidas = [];
    const acum = [];
    let runningBalance = 0;

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

    if (flowChartInstance) flowChartInstance.destroy();

    flowChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: monthLabels,
            datasets: [
                { label: 'Entradas', data: entradas, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderColor: '#10b981', borderWidth: 1, borderRadius: 4 },
                { label: 'Saídas', data: saidas, backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: '#ef4444', borderWidth: 1, borderRadius: 4 },
                { label: 'Saldo Acum.', data: acum, type: 'line', borderColor: '#00f2fe', backgroundColor: 'rgba(0, 242, 254, 0.05)', borderWidth: 2.5, fill: true, tension: 0.3, pointBackgroundColor: '#00f2fe' }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top', labels: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } } } },
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 10 } } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.04)' }, ticks: { color: '#9ca3af', font: { family: 'Outfit', size: 9 }, callback: value => 'R$ ' + value.toLocaleString('pt-BR') } }
            }
        }
    });
}

// 4. Ranking de Produtos
function getProductPerformance() {
    const performance = {};
    state.products.forEach(p => {
        performance[p.id] = { id: p.id, nome: p.nome, precoCusto: p.precoCusto, qtdVendas: 0, faturamento: 0 };
    });

    state.transactions.forEach(t => {
        if (state.currentWalletId !== 'all' && (t.caixaId || 'w-1') !== state.currentWalletId) return;

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

    if (state.activeRankTab === 'revenue') performance.sort((a, b) => b.faturamento - a.faturamento);
    else performance.sort((a, b) => b.qtdVendas - a.qtdVendas);

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
        const displayVal = state.activeRankTab === 'revenue' ? formatCurrency(item.faturamento) : `${item.qtdVendas} un`;
        const subVal = state.activeRankTab === 'revenue' ? `${item.qtdVendas} un` : formatCurrency(item.faturamento);

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

// 5. Renderização de Lançamentos em Cards
function renderTransactionsListMobile() {
    const container = document.getElementById('transactions-list-mobile');
    container.innerHTML = '';

    const filteredTrans = getFilteredTransactions();

    if (filteredTrans.length === 0) {
        container.innerHTML = `<p class="text-center text-muted py-4">Nenhum lançamento encontrado para os filtros selecionados.</p>`;
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
                ? `<span class="status-badge paid"><i class="fa-solid fa-check"></i> Efetivado</span>`
                : `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Previsto</span>`;
        } else {
            if (totalPaid === totalInst) {
                statusBadge = `<span class="status-badge paid"><i class="fa-solid fa-check"></i> Efetivado (${totalPaid}/${totalInst})</span>`;
            } else if (totalPaid === 0) {
                statusBadge = `<span class="status-badge pending"><i class="fa-solid fa-clock"></i> Previsto (${totalInst}x)</span>`;
            } else {
                statusBadge = `<span class="status-badge pending"><i class="fa-solid fa-arrows-spin"></i> Parcial (${totalPaid}/${totalInst})</span>`;
            }
        }

        const walletObj = state.wallets.find(w => w.id === (t.caixaId || 'w-1'));
        const walletBadge = walletObj ? `<span class="wallet-badge-pill" style="background-color:${walletObj.cor || '#00f2fe'}"><i class="fa-solid ${walletObj.icone || 'fa-wallet'}"></i> ${walletObj.nome}</span>` : '';
        const attachmentBadge = state.attachments[t.id] ? `<span class="attachment-badge" onclick="viewReceipt('${t.id}')"><i class="fa-solid fa-paperclip"></i> Anexo</span>` : '';

        const card = document.createElement('div');
        card.className = 'transaction-card-mobile';
        card.innerHTML = `
            <div class="card-top">
                <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                    ${walletBadge}
                    <span class="cat-badge">${t.categoria}</span>
                    <span class="cat-badge method-badge" style="background: rgba(0, 242, 254, 0.08); border-color: rgba(0, 242, 254, 0.2); color: var(--color-primary); font-weight: 600;">${(t.metodoPagamento || 'pix').toUpperCase()}</span>
                    ${attachmentBadge}
                </div>
                <span class="card-date">${formatDate(t.data)}</span>
            </div>
            <div class="card-middle">
                <div>
                    <span class="card-title" style="display: block;">${t.descricao}</span>
                    ${t.observacao ? `<small style="font-size:11px; color:var(--text-muted);">${t.observacao}</small>` : ''}
                </div>
                <span class="card-value ${t.tipo === 'entrada' ? 'type-in' : 'type-out'}">
                    ${t.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(t.valorTotal)}
                </span>
            </div>
            <div class="card-bottom">
                ${statusBadge}
                <div class="card-actions">
                    <button class="btn-action" title="Editar Lançamento" onclick="editTransaction('${t.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-action" title="Ver Parcelas" onclick="showInstallmentsDrawer('${t.id}')"><i class="fa-solid fa-eye"></i></button>
                    <button class="btn-action delete" title="Excluir Lançamento" onclick="deleteTransaction('${t.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Visualizador de Comprovantes
window.viewReceipt = function(transId) {
    const att = state.attachments[transId];
    if (!att) return;

    currentViewingReceiptTransId = transId;
    const displayArea = document.getElementById('receipt-display-area');
    const downloadBtn = document.getElementById('btn-download-receipt');

    downloadBtn.href = att.dataUrl;
    downloadBtn.download = att.fileName || `comprovante_${transId}`;

    if (att.fileType && att.fileType.startsWith('image/')) {
        displayArea.innerHTML = `<img src="${att.dataUrl}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">`;
    } else {
        displayArea.innerHTML = `<iframe src="${att.dataUrl}" style="width: 100%; height: 350px; border: none; border-radius: 8px;"></iframe>`;
    }

    document.getElementById('receipt-viewer-modal').style.display = 'flex';
};

// Gaveta de Parcelas (Bottom Sheet)
window.showInstallmentsDrawer = function(transId) {
    const trans = state.transactions.find(t => t.id === transId);
    if (!trans) return;

    document.getElementById('detail-trans-name').innerText = trans.descricao;
    const listContainer = document.getElementById('installments-list-mobile');
    listContainer.innerHTML = '';

    const transInstallments = state.installments.filter(inst => inst.transacaoId === transId).sort((a, b) => a.numeroParcela - b.numeroParcela);

    transInstallments.forEach(inst => {
        const isPaid = inst.status === 'pago';
        const actionBtn = isPaid
            ? `<button class="btn-action" title="Marcar como Previsto" onclick="toggleInstallmentStatus('${inst.id}')"><i class="fa-solid fa-clock text-orange"></i></button>`
            : `<button class="btn-action toggle-paid" title="Marcar como Efetivado" onclick="toggleInstallmentStatus('${inst.id}')"><i class="fa-solid fa-circle-check text-green"></i></button>`;

        const item = document.createElement('div');
        item.className = 'installment-item-mobile';
        item.innerHTML = `
            <div>
                <strong>Parcela ${inst.numeroParcela}/${trans.numParcelas}</strong>
                <div style="display: flex; align-items: center; gap: 4px; margin-top: 4px;">
                    <span style="font-size: 11px; color: var(--text-secondary);">Venc:</span>
                    <input type="date" value="${inst.dataVencimento}" onchange="changeInstallmentDate('${inst.id}', this.value)" style="background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 11px; padding: 2px 6px; border-radius: 4px; outline: none; width: 115px;" />
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="font-semibold">${formatCurrency(inst.valor)}</span>
                <span class="status-badge ${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Efetivado' : 'Previsto'}</span>
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
    saveStateToStorage();
    updateUI();
    showInstallmentsDrawer(install.transacaoId);
};

window.changeInstallmentDate = function(instId, newDate) {
    if (!newDate) return;
    const install = state.installments.find(i => i.id === instId);
    if (!install) return;

    install.dataVencimento = newDate;
    saveStateToStorage();
    updateUI();
    showInstallmentsDrawer(install.transacaoId);
};

window.deleteTransaction = function(transId) {
    if (!confirm('Deseja realmente excluir este lançamento financeiro?')) return;

    state.transactions = state.transactions.filter(t => t.id !== transId);
    state.installments = state.installments.filter(i => i.transacaoId !== transId);
    delete state.attachments[transId];

    document.getElementById('bottom-sheet-backdrop').style.display = 'none';
    document.getElementById('installments-detail-card').style.display = 'none';

    saveStateToStorage();
    updateUI();
};

window.editTransaction = function(transId) {
    const trans = state.transactions.find(t => t.id === transId);
    if (!trans) return;

    editingTransactionId = trans.id;
    document.getElementById('modal-title-text').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Lançamento';

    populateWalletSelects();
    document.getElementById('trans-wallet').value = trans.caixaId || 'w-1';
    document.getElementById('trans-desc').value = trans.descricao;
    document.getElementById('trans-val').value = trans.valorTotal;
    document.getElementById('trans-date').value = trans.data;
    document.getElementById('trans-type').value = trans.tipo;
    document.getElementById('trans-cat').value = trans.categoria;
    document.getElementById('trans-notes').value = trans.observacao || '';
    document.getElementById('trans-product').value = trans.produtoId || '';
    document.getElementById('trans-method').value = trans.metodoPagamento || 'pix';
    document.getElementById('trans-payment').value = trans.tipoPagamento;

    const installmentsGroup = document.getElementById('installments-group');
    if (trans.tipoPagamento === 'parcelado') {
        installmentsGroup.style.display = 'block';
        document.getElementById('trans-installments').value = trans.numParcelas;
    } else {
        installmentsGroup.style.display = 'none';
    }

    document.getElementById('trans-status').value = trans.status;
    const attachmentPreview = document.getElementById('trans-attachment-preview');

    if (state.attachments[transId]) {
        const att = state.attachments[transId];
        attachmentPreview.style.display = 'block';
        if (att.fileType && att.fileType.startsWith('image/')) {
            attachmentPreview.innerHTML = `<img src="${att.dataUrl}" alt="Preview"><br><small style="font-size:10px; color:var(--text-secondary);">${att.fileName}</small>`;
        } else {
            attachmentPreview.innerHTML = `<i class="fa-solid fa-file-pdf text-red" style="font-size:24px;"></i><br><small style="font-size:10px; color:var(--text-secondary);">${att.fileName}</small>`;
        }
    } else {
        attachmentPreview.style.display = 'none';
    }

    document.getElementById('transaction-modal').style.display = 'flex';
};

// 6. Lista de Produtos
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
                <button class="btn-action delete" title="Excluir" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="card-top" style="justify-content: flex-start; gap: 16px;">
                <div><small class="text-muted" style="display:block;">Preço Custo</small><strong>${formatCurrency(p.precoCusto)}</strong></div>
                <div><small class="text-muted" style="display:block;">Vendas</small><strong>${p.qtdVendas} un</strong></div>
                <div style="margin-left: auto; text-align: right;"><small class="text-muted" style="display:block;">Faturamento Total</small><strong class="text-green">${formatCurrency(p.faturamento)}</strong></div>
            </div>
        `;
        container.appendChild(card);
    });
}

window.deleteProduct = function(productId) {
    if (!confirm('Excluir este produto?')) return;
    state.products = state.products.filter(p => p.id !== productId);
    state.transactions.forEach(t => { if (t.produtoId === productId) t.produtoId = ''; });
    saveStateToStorage();
    updateUI();
};

function populateSelects() {
    const transProductSelect = document.getElementById('trans-product');
    const calcProductSelect = document.getElementById('calc-select-product');

    if (!transProductSelect || !calcProductSelect) return;

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

// 7. Precificação Inteligente
function calculatePriceMarkup() {
    const cost = parseFloat(document.getElementById('calc-cost').value) || 0;
    const fixed = parseFloat(document.getElementById('calc-fixed-costs').value) || 0;
    const taxes = parseFloat(document.getElementById('calc-taxes').value) || 0;
    const margin = parseFloat(document.getElementById('calc-margin').value) || 0;

    const percentageSum = fixed + taxes + margin;
    const idealPriceEl = document.getElementById('calc-ideal-price');
    const markupFactorEl = document.getElementById('calc-markup-factor');

    if (percentageSum >= 100) {
        idealPriceEl.innerText = 'Inválido';
        markupFactorEl.innerText = 'Soma % >= 100%';
        return;
    }

    const factorMarkup = 100 / (100 - percentageSum);
    const idealPrice = cost * factorMarkup;

    idealPriceEl.innerText = formatCurrency(idealPrice);
    markupFactorEl.innerText = factorMarkup.toFixed(2) + 'x';

    document.getElementById('breakdown-cost').innerText = `${formatCurrency(cost)} (${((cost/idealPrice)*100).toFixed(1)}%)`;
    document.getElementById('breakdown-fixed').innerText = `${formatCurrency(idealPrice * (fixed/100))} (${fixed.toFixed(1)}%)`;
    document.getElementById('breakdown-taxes').innerText = `${formatCurrency(idealPrice * (taxes/100))} (${taxes.toFixed(1)}%)`;
    document.getElementById('breakdown-profit').innerText = `${formatCurrency(idealPrice * (margin/100))} (${margin.toFixed(1)}%)`;
}

// 8. Relatório Mensal & Categorias
function populateMonthlyReportPeriodSelector() {
    const select = document.getElementById('monthly-select-period');
    if (!select) return;
    select.innerHTML = '';

    const monthsNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const currentYear = parseInt(SYSTEM_TODAY.substring(0, 4)) || 2026;
    const currentMonthStr = SYSTEM_TODAY.substring(0, 7);

    for (let m = 0; m < 12; m++) {
        const option = document.createElement('option');
        const monthVal = String(m + 1).padStart(2, '0');
        const valueStr = `${currentYear}-${monthVal}`;
        option.value = valueStr;
        option.innerText = `${monthsNames[m]} de ${currentYear}`;
        if (valueStr === currentMonthStr) option.selected = true;
        select.appendChild(option);
    }
}

function resetDatabase() {
    localStorage.clear();
    if (DBManager.db) {
        indexedDB.deleteDatabase(DBManager.dbName);
    }
    state.wallets = [...seedWallets];
    state.products = [...seedProducts];
    state.transactions = [...seedTransactions];
    state.installments = [];
    state.attachments = {};

    state.transactions.forEach(trans => {
        const generated = generateInstallments(trans);
        if (trans.id === 't3') {
            generated[0].status = 'pago';
            generated[1].status = 'pendente';
        } else if (trans.id === 't4') {
            generated[0].status = 'pago';
            generated[1].status = 'pago';
        }
        state.installments.push(...generated);
    });

    saveStateToStorage();
    switchTab('dashboard');
    populateMonthlyReportPeriodSelector();
    populateWalletSelects();
    updateWalletBarUI();
    updateUI();
    alert('Banco de dados resetado com sucesso!');
}

function renderCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const select = document.getElementById('monthly-select-period');
    const selectedMonth = select ? select.value : SYSTEM_TODAY.substring(0, 7);

    const categoryTotals = {};
    state.installments.forEach(install => {
        const trans = state.transactions.find(t => t.id === install.transacaoId);
        if (!trans) return;

        if (state.currentWalletId !== 'all' && (trans.caixaId || 'w-1') !== state.currentWalletId) return;

        if (trans.tipo === 'saida' && install.dataVencimento.startsWith(selectedMonth)) {
            const cat = trans.categoria || 'Outros';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + install.valor;
        }
    });

    const categories = Object.keys(categoryTotals);
    const totals = Object.values(categoryTotals);

    if (categories.length === 0) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Nenhuma Despesa'], datasets: [{ data: [1], backgroundColor: ['rgba(255, 255, 255, 0.05)'], borderColor: ['rgba(255, 255, 255, 0.1)'], borderWidth: 1 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#6b7280', font: { family: 'Outfit', size: 10 } } }, tooltip: { enabled: false } } }
        });
        return;
    }

    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#6366f1'];
    if (categoryChartInstance) categoryChartInstance.destroy();

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: categories, datasets: [{ data: totals, backgroundColor: colors.slice(0, categories.length), borderColor: '#111827', borderWidth: 2 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#9ca3af', font: { family: 'Outfit', size: 10 }, boxWidth: 12, padding: 10 } },
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
        const trans = state.transactions.find(t => t.id === inst.transacaoId);
        if (!trans) return false;

        if (state.currentWalletId !== 'all' && (trans.caixaId || 'w-1') !== state.currentWalletId) return false;

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
            ? `<button class="btn-action" title="Marcar como Previsto" onclick="toggleMonthlyInstallmentStatus('${inst.id}')"><i class="fa-solid fa-clock text-orange"></i></button>`
            : `<button class="btn-action toggle-paid" title="Marcar como Efetivado" onclick="toggleMonthlyInstallmentStatus('${inst.id}')"><i class="fa-solid fa-circle-check text-green"></i></button>`;

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

        if (isEntrada) entriesListContainer.appendChild(itemEl);
        else exitsListContainer.appendChild(itemEl);
    });

    if (exitsListContainer.children.length === 0) exitsListContainer.innerHTML = '<p class="text-center text-muted py-3">Sem despesas registradas.</p>';
    if (entriesListContainer.children.length === 0) entriesListContainer.innerHTML = '<p class="text-center text-muted py-3">Sem receitas registradas.</p>';

    document.getElementById('monthly-total-exits').innerText = formatCurrency(exitsTotal);
    document.getElementById('monthly-detail-exits').innerText = `${formatCurrency(exitsPaid)} Pago / ${formatCurrency(exitsTotal - exitsPaid)} Pend.`;

    document.getElementById('monthly-total-entries').innerText = formatCurrency(entriesTotal);
    document.getElementById('monthly-detail-entries').innerText = `${formatCurrency(entriesPaid)} Rec. / ${formatCurrency(entriesTotal - entriesPaid)} Pend.`;
}

window.toggleMonthlyInstallmentStatus = function(instId) {
    const install = state.installments.find(i => i.id === instId);
    if (!install) return;
    install.status = install.status === 'pago' ? 'pendente' : 'pago';
    saveStateToStorage();
    updateUI();
};

function updatePinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((dot, idx) => {
        if (idx < enteredPin.length) dot.classList.add('filled');
        else dot.classList.remove('filled');
    });
}

function resetLockScreenUI() {
    enteredPin = '';
    updatePinDots();
    const lockIcon = document.querySelector('.lock-icon');
    const unlockIcon = document.querySelector('.unlock-icon');
    if (lockIcon && unlockIcon) {
        lockIcon.style.display = 'block';
        unlockIcon.style.display = 'none';
        lockIcon.className = 'fa-solid fa-lock lock-icon lock-pulse';
        unlockIcon.className = 'fa-solid fa-lock-open unlock-icon';
    }
}
