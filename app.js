// Configuração de Data de Hoje do Sistema
const SYSTEM_TODAY = '2026-06-04';

// Estado Global da Aplicação
let state = {
    products: [],
    transactions: [],
    installments: [],
    currentTab: 'dashboard',
    activeRankTab: 'revenue'
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
    document.getElementById('current-date-span').innerText = formatDate(SYSTEM_TODAY);
    document.getElementById('trans-date').value = SYSTEM_TODAY;
    
    const storedProducts = localStorage.getItem('financeiq_products');
    const storedTransactions = localStorage.getItem('financeiq_transactions');
    const storedInstallments = localStorage.getItem('financeiq_installments');

    if (storedProducts && storedTransactions && storedInstallments) {
        state.products = JSON.parse(storedProducts);
        state.transactions = JSON.parse(storedTransactions);
        state.installments = JSON.parse(storedInstallments);
    } else {
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
        
        saveStateToLocalStorage();
    }
}

// --- PERSISTÊNCIA ---
function saveStateToLocalStorage() {
    localStorage.setItem('financeiq_products', JSON.stringify(state.products));
    localStorage.setItem('financeiq_transactions', JSON.stringify(state.transactions));
    localStorage.setItem('financeiq_installments', JSON.stringify(state.installments));
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
    
    const date = new Date(year, month, day);
    date.setMonth(date.getMonth() + months);
    
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
            installments: state.installments
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `financesiq_backup_${Date.now()}.json`);
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
                <strong>Parcela ${inst.numeroParcela}/${trans.numParcelas}</strong><br>
                <small class="text-muted">Vencimento: ${formatDate(inst.dataVencimento)}</small>
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
