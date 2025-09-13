document.addEventListener('DOMContentLoaded', () => {
    carregarMedicamentos();
    document.getElementById('medicamentoNome').addEventListener('input', atualizarDatalist);
    document.getElementById('medicamentoData').addEventListener('input', formatarInputDataMMYY);
});

let medicamentos = [];
let currentSortColumn = 'nome';
let currentSortDirection = 'asc';
let editandoMedicamentoIndex = -1;

// --- Funções de Formatação de Data ---
function formatarDataMMYY(dataString) {
    if (!dataString) return '';
    const partes = dataString.split('/');
    if (partes.length === 2) {
        let mes = partes[0].padStart(2, '0');
        let ano = partes[1].padStart(2, '0');
        return `${mes}/${ano}`;
    }
    return dataString;
}

function formatarDataParaExibicao(data) {
    const meses = {
        '01': 'JAN', '02': 'FEV', '03': 'MAR', '04': 'ABR', '05': 'MAI', '06': 'JUN',
        '07': 'JUL', '08': 'AGO', '09': 'SET', '10': 'OUT', '11': 'NOV', '12': 'DEZ'
    };
    const [mes] = data.split('/');
    return meses[mes] || mes;
}

function formatarInputDataMMYY(event) {
    let input = event.target;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    } else if (value.length === 2) {
        if (event.inputType === 'deleteContentBackward') {
        } else if (!value.includes('/')) {
            value += '/';
        }
    }
    input.value = value;
}

// --- Funções de LocalStorage ---
function carregarMedicamentos() {
    const dadosSalvos = localStorage.getItem('medicamentos');
    if (dadosSalvos) {
        medicamentos = JSON.parse(dadosSalvos);
    }
    renderizarTabela();
    atualizarDatalist();
}

function salvarMedicamentos() {
    localStorage.setItem('medicamentos', JSON.stringify(medicamentos));
}

// --- Funções de Exportação/Importação JSON ---
function importarDadosJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dadosImportados = JSON.parse(e.target.result);

            // ✅ Validação básica
            if (!Array.isArray(dadosImportados)) {
                throw new Error('Formato inválido: o arquivo deve conter um array de medicamentos.');
            }

            for (const med of dadosImportados) {
                if (!med.nome || !Array.isArray(med.precos)) {
                    throw new Error('Formato inválido: cada medicamento deve ter nome e array de preços.');
                }
                for (const preco of med.precos) {
                    if (!preco.valor || !preco.data || !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(preco.data)) {
                        throw new Error('Formato inválido: preços devem ter valor e data no formato MM/AA.');
                    }
                }
            }

            // ✅ AQUI ESTÁ A MÁGICA: SOBREPÕE TUDO NA MEMÓRIA — SEM DEPENDER DO LOCALSTORAGE
            medicamentos = dadosImportados; // <-- Assume controle total

            // ✅ Renderiza imediatamente — sem esperar localStorage
            renderizarTabela();
            atualizarDatalist();

            // ✅ SÓ AGORA salva no localStorage (como backup, não como fonte)
            salvarMedicamentos();

            alert('Dados importados com sucesso!');

        } catch (error) {
            alert(`Erro ao importar arquivo: ${error.message}`);
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

function exportarDadosJSON() {
    const medicamentos = JSON.parse(localStorage.getItem('medicamentos')) || [];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(medicamentos, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "medicamentos.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("Arquivo salvo na pasta de Downloads");
}

// --- Funções de Autocompletar (Datalist) ---
function atualizarDatalist() {
    const datalist = document.getElementById('listaMedicamentos');
    datalist.innerHTML = '';

    const nomesUnicos = [...new Set(medicamentos.map(med => med.nome))];
    nomesUnicos.forEach(nome => {
        const option = document.createElement('option');
        option.value = nome;
        datalist.appendChild(option);
    });
}

// --- Funções da Tabela ---
function renderizarTabela() {
    const tabelaBody = document.querySelector('#tabelaMedicamentos tbody');
    tabelaBody.innerHTML = '';

    if (medicamentos.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="3">Nenhum medicamento cadastrado ainda.</td></tr>';
        return;
    }

    const medicamentosOrdenados = [...medicamentos].sort((a, b) => {
        let valA, valB;

        switch (currentSortColumn) {
            case 'nome':
                valA = a.nome.toLowerCase();
                valB = b.nome.toLowerCase();
                break;
            case 'ultimoPreco':
                const precoA = a.precos.length > 0 ? a.precos.slice().sort((p1, p2) => {
                    const [mA, aA] = p1.data.split('/').map(Number);
                    const [mB, aB] = p2.data.split('/').map(Number);
                    return (aA * 100 + mA) - (aB * 100 + mB);
                })[a.precos.length - 1].valor : 0;
                const precoB = b.precos.length > 0 ? b.precos.slice().sort((p1, p2) => {
                    const [mA, aA] = p1.data.split('/').map(Number);
                    const [mB, aB] = p2.data.split('/').map(Number);
                    return (aA * 100 + mA) - (aB * 100 + mB);
                })[b.precos.length - 1].valor : 0;
                valA = precoA;
                valB = precoB;
                break;
            case 'historico':
                valA = a.precos.length;
                valB = b.precos.length;
                break;
            default:
                valA = a.nome.toLowerCase();
                valB = b.nome.toLowerCase();
        }

        if (typeof valA === 'string') {
            return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
            return currentSortDirection === 'asc' ? valA - valB : valB - valA;
        }
    });

    document.querySelectorAll('#tabelaMedicamentos th').forEach(th => {
        th.classList.remove('asc', 'desc');
    });
    const activeHeader = document.querySelector(`#tabelaMedicamentos th[onclick="ordenarTabela('${currentSortColumn}')"]`);
    if (activeHeader) {
        activeHeader.classList.add(currentSortDirection);
    }

    medicamentosOrdenados.forEach((med, originalIndex) => {
        const row = tabelaBody.insertRow();
        row.insertCell(0).textContent = med.nome;

        // Preços Anteriores
        const cellHistorico = row.insertCell(1);
        const precosOrdenadosInternos = [...med.precos].sort((a, b) => {
            const [mA, aA] = a.data.split('/').map(Number);
            const [mB, aB] = b.data.split('/').map(Number);
            return (aA * 100 + mA) - (aB * 100 + mB);
        });
        if (precosOrdenadosInternos.length > 1) {
            precosOrdenadosInternos.slice(-6, -1).forEach(p => {
                const span = document.createElement('span');
                span.classList.add('preco-historico');
                let texto = `${formatarDataParaExibicao(p.data)}: R$ ${p.valor.toFixed(2)}`;
                span.textContent = texto + '   ';
                cellHistorico.appendChild(span);
            });
        } else {
            cellHistorico.textContent = 'Sem histórico';
        }

        // Último Preço + Comentário
        const ultimoPrecoObj = precosOrdenadosInternos.length > 0 ? precosOrdenadosInternos[precosOrdenadosInternos.length - 1] : null;
        const cellUltimoPreco = row.insertCell(2);
        if (ultimoPrecoObj) {
            let textoUltimo = `${formatarDataParaExibicao(ultimoPrecoObj.data)}: R$ ${ultimoPrecoObj.valor.toFixed(2)}`;
            if (ultimoPrecoObj.comentario) {
                textoUltimo += `\n💬 ${ultimoPrecoObj.comentario}`;
            }
            cellUltimoPreco.textContent = textoUltimo;
        } else {
            cellUltimoPreco.textContent = 'N/A';
        }
    });
}

function ordenarTabela(coluna) {
    if (currentSortColumn === coluna) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = coluna;
        currentSortDirection = 'asc';
    }
    renderizarTabela();
}

function adicionarOuAtualizarMedicamento() {
    const nomeInput = document.getElementById('medicamentoNome');
    const precoInput = document.getElementById('medicamentoPreco');
    const comentarioInput = document.getElementById('medicamentoComentario');
    const dataInput = document.getElementById('medicamentoData');

    const nome = nomeInput.value.trim();
    const preco = parseFloat(precoInput.value);
    const comentario = comentarioInput.value.trim();
    const dataDigitada = dataInput.value.trim();

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

    let dataParaRegistro;
    const regexMMYY = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
    if (dataDigitada) {
        if (!regexMMYY.test(dataDigitada)) {
            alert('Por favor, insira a data no formato MM/AA (ex: 10/23).');
            dataInput.focus();
            return;
        }
        dataParaRegistro = formatarDataMMYY(dataDigitada);
    } else {
        const hoje = new Date();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const ano = String(hoje.getFullYear()).slice(-2);
        dataParaRegistro = `${mes}/${ano}`;
    }

    const novoRegistro = { valor: preco, data: dataParaRegistro };
    if (comentario) {
        novoRegistro.comentario = comentario;
    }

    if (editandoMedicamentoIndex !== -1) {
        const medEditado = medicamentos[editandoMedicamentoIndex];
        if (medEditado.nome.toLowerCase() !== nome.toLowerCase()) {
            const outroMedicamentoComNome = medicamentos.find((m, idx) => 
                m.nome.toLowerCase() === nome.toLowerCase() && idx !== editandoMedicamentoIndex
            );
            if (outroMedicamentoComNome) {
                alert(`Já existe um medicamento com o nome "${nome}". Por favor, escolha um nome diferente.`);
                nomeInput.focus();
                return;
            }
        }
        medEditado.nome = nome;

        if (precoInput.value !== '') {
            const precosOrdenadosExistente = [...medEditado.precos].sort((a, b) => {
                const [mA, aA] = a.data.split('/').map(Number);
                const [mB, aB] = b.data.split('/').map(Number);
                return (aA * 100 + mA) - (aB * 100 + mB);
            });
            const ultimoPrecoSalvo = precosOrdenadosExistente.length > 0 ? precosOrdenadosExistente[precosOrdenadosExistente.length - 1] : null;

            if (ultimoPrecoSalvo && ultimoPrecoSalvo.valor === preco && ultimoPrecoSalvo.data === dataParaRegistro) {
                alert(`O preço ${dataParaRegistro}: R$${preco.toFixed(2)} é idêntico ao último registro para ${nome}.`);
            } else if (ultimoPrecoSalvo && ultimoPrecoSalvo.data === dataParaRegistro) {
                medEditado.precos[medEditado.precos.length - 1] = novoRegistro;
                alert(`Preço e comentário atualizados para ${nome}.`);
            } else {
                medEditado.precos.push(novoRegistro);
                alert(`Novo preço ${dataParaRegistro}: R$${preco.toFixed(2)} adicionado para ${nome}.`);
            }
        } else if (precoInput.value === '' && dataInput.value !== '') {
            alert(`Nome do medicamento atualizado para "${nome}". Para adicionar um novo registro de preço, preencha o campo de preço.`);
        } else {
            alert(`Nome do medicamento atualizado para "${nome}".`);
        }

        editandoMedicamentoIndex = -1;
    } else {
        const medicamentoExistente = medicamentos.find(med => med.nome.toLowerCase() === nome.toLowerCase());

        if (medicamentoExistente) {
            if (precoInput.value !== '') {
                const precosOrdenadosExistente = [...medicamentoExistente.precos].sort((a, b) => {
                    const [mA, aA] = a.data.split('/').map(Number);
                    const [mB, aB] = b.data.split('/').map(Number);
                    return (aA * 100 + mA) - (aB * 100 + mB);
                });
                const ultimoPrecoSalvo = precosOrdenadosExistente.length > 0 ? precosOrdenadosExistente[precosOrdenadosExistente.length - 1] : null;

                if (ultimoPrecoSalvo && ultimoPrecoSalvo.valor === preco && ultimoPrecoSalvo.data === dataParaRegistro) {
                    alert(`O preço ${dataParaRegistro}: R$${preco.toFixed(2)} para ${nome} já foi registrado nesta data.`);
                } else {
                    medicamentoExistente.precos.push(novoRegistro);
                    alert(`Preço ${dataParaRegistro}: R$${preco.toFixed(2)} adicionado para ${nome}.`);
                }
            } else {
                alert(`Medicamento "${nome}" já existe. Para adicionar um novo registro de preço, preencha o campo de preço.`);
                precoInput.focus();
                return;
            }
        } else {
            if (precoInput.value === '') {
                alert('Para adicionar um novo medicamento, por favor, insira um preço inicial.');
                precoInput.focus();
                return;
            }
            medicamentos.push({
                nome: nome,
                precos: [novoRegistro]
            });
            alert(`Medicamento "${nome}" adicionado com o preço ${dataParaRegistro}: R$${preco.toFixed(2)}.`);
        }
    }

    salvarMedicamentos();
    renderizarTabela();
    atualizarDatalist();

    nomeInput.value = '';
    precoInput.value = '';
    comentarioInput.value = '';
    dataInput.value = '';
    nomeInput.focus();
}

function filtrarTabela() {
    const termoBusca = document.getElementById('filtroMedicamento').value.toLowerCase();
    const linhas = document.querySelectorAll('#tabelaMedicamentos tbody tr');

    linhas.forEach(linha => {
        const nomeMedicamento = linha.cells[0].textContent.toLowerCase();
        if (nomeMedicamento.includes(termoBusca)) {
            linha.style.display = '';
        } else {
            linha.style.display = 'none';
        }
    });
}