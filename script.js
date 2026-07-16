// ==================== DADOS ====================
let membrosCadastrados = [];
let resultados = [];

// ==================== INICIALIZAR ====================
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    mostrarSemana();
    atualizarListaCadastrados();
});

function mostrarSemana() {
    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay() + 1);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    
    const formato = { day: '2-digit', month: '2-digit' };
    document.getElementById('semanaAtual').textContent = 
        `Semana: ${inicioSemana.toLocaleDateString('pt-BR', formato)} - ${fimSemana.toLocaleDateString('pt-BR', formato)}`;
}

// ==================== SALVAR/CARREGAR ====================
function salvarDados() {
    localStorage.setItem('saerMembros', JSON.stringify(membrosCadastrados));
}

function carregarDados() {
    const dados = localStorage.getItem('saerMembros');
    if (dados) {
        membrosCadastrados = JSON.parse(dados);
    }
}

// ==================== OBTER META POR PATENTE ====================
function getMetaPorPatente(patente) {
    switch(patente) {
        case 'comando': return 0;
        case 'admin': return 0;
        case 'elite': return 2;
        case 'anjo_negro': return 1;
        case 'core': return 0.5;    
        default: return 2;
    }
}

function getNomePatente(patente) {
    switch(patente) {
        case 'comando': return '👑 Comando';
        case 'admin': return '⚙️ Administrador';
        case 'elite': return '⭐ Elite';
        case 'anjo_negro': return '🪽 Anjo Negro';
        case 'core': return '🦅 CORE';
        default: return patente;
    }
}

function getClassePatente(patente) {
    switch(patente) {
        case 'comando': return 'patente-comando';
        case 'admin': return 'patente-admin';
        case 'elite': return 'patente-elite';
        case 'anjo_negro': return 'patente-anjo';
        case 'core': return 'patente-core';
        default: return '';
    }
}

// ==================== CADASTRAR MEMBRO ====================
function cadastrarMembro() {
    const nome = document.getElementById('cadNome').value.trim();
    const id = document.getElementById('cadID').value.trim();
    const patente = document.getElementById('cadPatente').value;
    
    if (!nome || !id) {
        mostrarToast('Preencha nome e ID!', 'erro');
        return;
    }
    
    const idLimpo = id.replace('@', '').trim();
    
    const existe = membrosCadastrados.find(m => {
        const mIdLimpo = m.id.replace('@', '').trim();
        return mIdLimpo === idLimpo;
    });
    
    if (existe) {
        mostrarToast('Este ID já está cadastrado!', 'erro');
        return;
    }
    
    membrosCadastrados.push({ nome, id, patente });
    salvarDados();
    atualizarListaCadastrados();
    
    document.getElementById('cadNome').value = '';
    document.getElementById('cadID').value = '';
    
    mostrarToast(`${nome} cadastrado como ${getNomePatente(patente)}!`, 'sucesso');
}

// ==================== REMOVER MEMBRO ====================
function removerMembro(index) {
    const nome = membrosCadastrados[index].nome;
    if (confirm(`Remover ${nome}?`)) {
        membrosCadastrados.splice(index, 1);
        salvarDados();
        atualizarListaCadastrados();
        processarHoras();
        mostrarToast(`${nome} removido.`, 'sucesso');
    }
}

// ==================== ATUALIZAR LISTA ====================
function atualizarListaCadastrados() {
    const container = document.getElementById('listaCadastrados');
    
    if (membrosCadastrados.length === 0) {
        container.innerHTML = '<p style="color:#666;">Nenhum membro cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = membrosCadastrados.map((m, i) => {
        const classe = getClassePatente(m.patente);
        const nomePatente = getNomePatente(m.patente);
        
        return `
            <span class="membro-tag">
                <span class="nome">${m.nome}</span>
                <span class="id">${m.id}</span>
                <span class="patente-tag ${classe}">${nomePatente}</span>
                <button class="btn-remover-membro" onclick="removerMembro(${i})" title="Remover">✕</button>
            </span>
        `;
    }).join('');
}

// ==================== PROCESSAR HORAS ====================
function processarHoras() {
    const texto = document.getElementById('entradaHoras').value.trim();
    
    if (!texto) {
        mostrarToast('Cole o ranking com as horas primeiro!', 'erro');
        return;
    }
    
    const linhas = texto.split('\n').filter(l => l.trim());
    const dadosProcessados = [];
    
    linhas.forEach((linha) => {
        // Extrair ID (número de 15-20 dígitos)
        const idMatch = linha.match(/(\d{15,20})/);
        const id = idMatch ? idMatch[1] : '';
        
        // Extrair horas no formato Xh:Xmin:Xs
        const horasMatch = linha.match(/(\d+)h:(\d+)min:(\d+)s/);
        
        if (horasMatch && id) {
            const horas = parseInt(horasMatch[1]);
            const minutos = parseInt(horasMatch[2]);
            const segundos = parseInt(horasMatch[3]);
            const horasTotais = horas + (minutos / 60) + (segundos / 3600);
            
            // Extrair nome - tudo entre o @[ e o primeiro |
            const nomeMatch = linha.match(/@\[.*?\]\s*(.+?)\s*\|/);
            let nome = '';
            
            if (nomeMatch) {
                nome = nomeMatch[1].trim();
                nome = nome.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
                nome = nome.replace(/[^\w\sÀ-ÿ]/g, '').trim();
            }
            
            if (nome) {
                dadosProcessados.push({
                    nome,
                    id,
                    horas: horasTotais,
                    horasStr: `${horas}h:${minutos}min:${segundos}s`
                });
            }
        }
    });
    
    if (dadosProcessados.length === 0) {
        mostrarToast('Nenhum dado encontrado. Verifique o formato.', 'erro');
        return;
    }
    
    // Cruzar com membros cadastrados
    resultados = [];
    const idsProcessados = new Set();
    
    dadosProcessados.forEach(dado => {
        const membroCadastrado = membrosCadastrados.find(m => {
            const mIdLimpo = m.id.replace(/\D/g, '');
            return mIdLimpo === dado.id;
        });
        
        let patente = 'anjo_negro';
        let cadastrado = false;
        
        if (membroCadastrado) {
            patente = membroCadastrado.patente;
            cadastrado = true;
        } else {
            const porNome = membrosCadastrados.find(m =>
                m.nome.toLowerCase().includes(dado.nome.toLowerCase())
            );
            if (porNome) {
                patente = porNome.patente;
                cadastrado = true;
            }
        }
        
        const meta = getMetaPorPatente(patente);
        
        let status;
        if (meta === 0) {
            status = 'isento';
        } else if (dado.horas >= meta) {
            status = 'batido';
        } else {
            status = 'pendente';
        }
        
        const faltam = meta === 0 ? 0 : Math.max(0, meta - dado.horas);
        
        resultados.push({
            ...dado,
            patente,
            meta,
            status,
            faltam,
            cadastrado
        });
        
        idsProcessados.add(dado.id);
        idsProcessados.add(dado.nome.toLowerCase());
    });
    
    // Membros cadastrados que não apareceram
    membrosCadastrados.forEach(m => {
        const mIdLimpo = m.id.replace(/\D/g, '');
        const jaProcessado = idsProcessados.has(mIdLimpo) ||
                            idsProcessados.has(m.nome.toLowerCase());
        
        if (!jaProcessado) {
            const meta = getMetaPorPatente(m.patente);
            resultados.push({
                nome: m.nome,
                id: m.id,
                horas: 0,
                horasStr: '0h:0min:0s',
                patente: m.patente,
                meta,
                status: meta === 0 ? 'isento' : 'nao_registrado',
                faltam: meta,
                cadastrado: true
            });
        }
    });
    
    // Ordenar
    resultados.sort((a, b) => {
        const ordem = { 'isento': 0, 'batido': 1, 'pendente': 2, 'nao_registrado': 3 };
        if (ordem[a.status] !== ordem[b.status]) return ordem[a.status] - ordem[b.status];
        return b.horas - a.horas;
    });
    
    atualizarTabela();
    atualizarResumo();
    mostrarToast(`${resultados.length} membros processados!`, 'sucesso');
}

// ==================== ATUALIZAR TABELA ====================
function atualizarTabela() {
    const tbody = document.getElementById('tabelaMembros');
    
    if (resultados.length === 0) {
        tbody.innerHTML = '<tr class="vazio"><td colspan="7">Cole o ranking e clique em Processar.</td></tr>';
        return;
    }
    
    tbody.innerHTML = resultados.map(r => {
        const nomePatente = getNomePatente(r.patente);
        
        let statusHTML = '';
        let metaTexto = '';
        
        if (r.status === 'isento') {
            statusHTML = '<span style="color:#888;font-weight:bold;">⬜ Isento</span>';
            metaTexto = 'Isento';
        } else if (r.status === 'batido') {
            statusHTML = '<span class="status-batido">✅ Meta Batida</span>';
            metaTexto = `${r.meta}h`;
        } else if (r.status === 'pendente') {
            statusHTML = '<span class="status-pendente">❌ Pendente</span>';
            metaTexto = `${r.meta}h`;
        } else {
            statusHTML = '<span class="status-nao-registrado">⚠️ Não Registrado</span>';
            metaTexto = `${r.meta}h`;
        }
        
        const faltamFormatadas = (r.status === 'batido' || r.status === 'isento') ? '-' : formatarHoras(r.faltam);
        const naoCadastrado = !r.cadastrado ? ' <span style="color:#ffa500;font-size:10px;">(não cadastrado)</span>' : '';
        
        return `
            <tr>
                <td><strong>${r.nome}</strong>${naoCadastrado}</td>
                <td style="font-size:12px;color:#888;">${r.id}</td>
                <td>${nomePatente}</td>
                <td><strong>${metaTexto}</strong></td>
                <td>${r.horasStr}</td>
                <td>${statusHTML}</td>
                <td>${faltamFormatadas}</td>
            </tr>
        `;
    }).join('');
}

// ==================== ATUALIZAR RESUMO ====================
function atualizarResumo() {
    document.getElementById('totalMembros').textContent = resultados.length;
    document.getElementById('metaBatida').textContent = resultados.filter(r => r.status === 'batido').length;
    document.getElementById('metaPendente').textContent = resultados.filter(r => r.status === 'pendente').length;
    document.getElementById('naoRegistrado').textContent = resultados.filter(r => r.status === 'nao_registrado').length;
}

// ==================== FORMATAR HORAS ====================
function formatarHoras(horas) {
    const h = Math.floor(horas);
    const m = Math.round((horas - h) * 60);
    if (m === 0) return `${h}:00`;
    return `${h}:${m.toString().padStart(2, '0')}`;
}

// ==================== TOAST ====================
function mostrarToast(msg, tipo) {
    const antigo = document.querySelector('.toast');
    if (antigo) antigo.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==================== ATALHO ====================
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        processarHoras();
    }
});