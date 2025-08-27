document.addEventListener('DOMContentLoaded', carregarMedicamentos);

let medicamentos = []; // Array para armazenar os dados dos medicamentos

// Função para formatar uma data de 'YYYY-MM-DD' para 'DD/MM/YYYY'
function formatarDataParaBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para formatar uma data de 'DD/MM/YYYY' para 'YYYY-MM-DD' (útil para input type="date")
function formatarDataParaISO(dataBR) {
    if (!dataBR) return '';
    const [dia, mes, ano] = dataBR.split('/');
    return `${ano}-${mes}-${dia}`;
}


// Função para carregar medicamentos do localStorage
function carregarMedicamentos() {
    const dadosSalvos = localStorage.getItem('medicamentos');
    if (dadosSalvos) {
        medicamentos = JSON.parse(dadosSalvos);
    }
    renderizarTabela();
}

// Função para salvar medicamentos no localStorage
function salvarMedicamentos() {
    localStorage.setItem('medicamentos', JSON.stringify(medicamentos));
}

// Função para renderizar a tabela com os dados atuais
function renderizarTabela() {
    const tabelaBody = document.querySelector('#tabelaMedicamentos tbody');
    tabelaBody.innerHTML = ''; // Limpa a tabela antes de renderizar novamente

    if (medicamentos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="4">Nenhum medicamento cadastrado ainda.</td></tr>';
        return;
    }

    // Ordena os medicamentos por nome para facilitar a consulta
    medicamentos.sort((a, b) => a.nome.localeCompare(b.nome));

    medicamentos.forEach((med, index) => {
        const row = tabelaBody.insertRow();
        row.insertCell(0).textContent = med.nome;

        // Ordena os preços por data (do mais antigo para o mais novo) para exibição consistente
        const precosOrdenados = [...med.precos].sort((a, b) => new Date(formatarDataParaISO(a.data)) - new Date(formatarDataParaISO(b.data)));

        const ultimoPrecoObj = precosOrdenados.length > 0 ? precosOrdenados[precosOrdenados.length - 1] : null;
        const ultimoPrecoStr = ultimoPrecoObj ? `R$ ${ultimoPrecoObj.valor.toFixed(2)} (${ultimoPrecoObj.data})` : 'N/A';
        row.insertCell(1).textContent = ultimoPrecoStr;

        const cellHistorico = row.insertCell(2);
        if (precosOrdenados.length > 1) {
            // Mostra o histórico de preços, excluindo o último que já está em "Último Preço"
            precosOrdenados.slice(0, precosOrdenados.length - 1).forEach(p => {
                const span = document.createElement('span');
                span.classList.add('preco-historico');
                span.textContent = `R$ ${p.valor.toFixed(2)} (${p.data})`;
                cellHistorico.appendChild(span);
            });
        } else {
            cellHistorico.textContent = 'Sem histórico';
        }

        const cellAcoes = row.insertCell(3);
        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = 'Excluir';
        btnExcluir.classList.add('delete-btn');
        btnExcluir.onclick = () => excluirMedicamento(index);
        cellAcoes.appendChild(btnExcluir);
    });
}

// Função para adicionar ou atualizar um medicamento
function adicionarOuAtualizarMedicamento() {
    const nomeInput = document.getElementById('medicamentoNome');
    const precoInput = document.getElementById('medicamentoPreco');
    const dataInput = document.getElementById('medicamentoData'); // Novo input de data

    const nome = nomeInput.value.trim();
    const preco = parseFloat(precoInput.value);
    const dataSelecionada = dataInput.value; // Formato YYYY-MM-DD

    // --- Validações de Entrada ---
    if (!nome) {
        alert('Por favor, insira o nome do medicamento.');
        nomeInput.focus();
        return;
    }

    if (precoInput.value !== '' && (isNaN(preco) || preco <= 0)) {
        alert('Por favor, insira um preço válido e positivo (ex: 15.50).');
        precoInput.focus();
        return;
    }

    // Determina a data a ser salva (preferência pela selecionada, senão a atual)
    let dataParaRegistro;
    if (dataSelecionada) {
        // Converte de YYYY-MM-DD (do input date) para DD/MM/YYYY (para exibição)
        dataParaRegistro = formatarDataParaBR(dataSelecionada);
    } else {
        dataParaRegistro = new Date().toLocaleDateString('pt-BR');
    }

    // Verifica se o medicamento já existe (case-insensitive)
    const medicamentoExistente = medicamentos.find(med => med.nome.toLowerCase() === nome.toLowerCase());

    if (medicamentoExistente) {
        // Se o medicamento existe
        if (precoInput.value !== '') {
            // Se um preço foi fornecido, adiciona-o ao histórico
            // Evita adicionar preços e datas duplicados se o último registro for igual
            const ultimoPrecoSalvo = medicamentoExistente.precos.length > 0 ? medicamentoExistente.precos[medicamentoExistente.precos.length - 1] : null;
            if (ultimoPrecoSalvo && ultimoPrecoSalvo.valor === preco && ultimoPrecoSalvo.data === dataParaRegistro) {
                alert(`O preço R$${preco.toFixed(2)} para ${nome} já foi registrado nesta data (${dataParaRegistro}).`);
            } else {
                medicamentoExistente.precos.push({ valor: preco, data: dataParaRegistro });
                alert(`Preço de R$${preco.toFixed(2)} (${dataParaRegistro}) adicionado para ${nome}.`);
            }
        } else {
            // Se nenhum preço foi fornecido, mas o medicamento já existe
            alert(`Medicamento "${nome}" já existe. Para atualizar, forneça um novo preço.`);
            // Opcional: focar no campo de preço se a intenção for atualizar
            precoInput.focus();
            return;
        }
    } else {
        // Se o medicamento NÃO existe
        if (precoInput.value === '') {
            // Se for um novo medicamento, o preço é obrigatório
            alert('Para adicionar um novo medicamento, por favor, insira um preço inicial.');
            precoInput.focus();
            return;
        }
        // Adiciona um novo medicamento
        medicamentos.push({
            nome: nome,
            precos: [{ valor: preco, data: dataParaRegistro }]
        });
        alert(`Medicamento "${nome}" adicionado com o preço de R$${preco.toFixed(2)} (${dataParaRegistro}).`);
    }

    salvarMedicamentos();
    renderizarTabela();

    // Limpa os campos após a operação
    nomeInput.value = '';
    precoInput.value = '';
    dataInput.value = ''; // Limpa o campo de data também
    nomeInput.focus(); // Coloca o foco no nome para facilitar nova inserção
}

// Função para excluir um medicamento
function excluirMedicamento(index) {
    if (confirm(`Tem certeza que deseja excluir "${medicamentos[index].nome}" e todo o seu histórico de preços?`)) {
        medicamentos.splice(index, 1);
        salvarMedicamentos();
        renderizarTabela();
    }
}