document.addEventListener('DOMContentLoaded', carregarMedicamentos);

let medicamentos = []; // Array para armazenar os dados dos medicamentos

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

    medicamentos.forEach((med, index) => {
        const row = tabelaBody.insertRow();
        row.insertCell(0).textContent = med.nome;

        const ultimoPreco = med.precos.length > 0 ? med.precos[med.precos.length - 1].valor.toFixed(2) + ' (' + med.precos[med.precos.length - 1].data + ')' : 'N/A';
        row.insertCell(1).textContent = ultimoPreco;

        const cellHistorico = row.insertCell(2);
        if (med.precos.length > 1) {
            // Mostra o histórico de preços, excluindo o último que já está em "Último Preço"
            med.precos.slice(0, med.precos.length - 1).forEach(p => {
                const span = document.createElement('span');
                span.classList.add('preco-historico');
                span.textContent = `${p.valor.toFixed(2)} (${p.data})`;
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

    const nome = nomeInput.value.trim();
    const preco = parseFloat(precoInput.value);

    if (!nome) {
        alert('Por favor, insira o nome do medicamento.');
        return;
    }

    if (precoInput.value !== '' && isNaN(preco) || preco <= 0) {
        alert('Por favor, insira um preço válido e positivo.');
        return;
    }

    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Verifica se o medicamento já existe
    const medicamentoExistente = medicamentos.find(med => med.nome.toLowerCase() === nome.toLowerCase());

    if (medicamentoExistente) {
        // Se o medicamento existe e um preço foi fornecido, adiciona o novo preço
        if (precoInput.value !== '') {
            medicamentoExistente.precos.push({ valor: preco, data: dataAtual });
            alert(`Preço de R$${preco.toFixed(2)} adicionado para ${nome}.`);
        } else {
            alert(`Medicamento "${nome}" já existe. Para atualizar, forneça um novo preço.`);
        }
    } else {
        // Se o medicamento não existe, cria um novo
        if (precoInput.value === '') {
            alert('Para adicionar um novo medicamento, por favor, insira um preço inicial.');
            return;
        }
        medicamentos.push({
            nome: nome,
            precos: [{ valor: preco, data: dataAtual }]
        });
        alert(`Medicamento "${nome}" adicionado com o preço de R$${preco.toFixed(2)}.`);
    }

    salvarMedicamentos();
    renderizarTabela();

    // Limpa os campos
    nomeInput.value = '';
    precoInput.value = '';
}

// Função para excluir um medicamento
function excluirMedicamento(index) {
    if (confirm(`Tem certeza que deseja excluir "${medicamentos[index].nome}"?`)) {
        medicamentos.splice(index, 1);
        salvarMedicamentos();
        renderizarTabela();
    }
}