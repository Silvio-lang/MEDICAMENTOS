document.addEventListener('DOMContentLoaded', function() {
    const promptForm = document.getElementById('promptForm');
    const userPromptInput = document.getElementById('userPrompt');
    const fileNameInput = document.getElementById('fileName');
    const statusDiv = document.getElementById('status');
    const responseDiv = document.getElementById('response');
    const previousPromptsDiv = document.getElementById('previousPrompts');

    // Exibir os prompts anteriores assim que a página for carregada
    displayPreviousPrompts();

    promptForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const userPrompt = userPromptInput.value.trim();
        const fileName = fileNameInput.value.trim();

        if (!userPrompt || !fileName) {
            statusDiv.textContent = 'Preencha todos os campos!';
            return;
        }

        // Exibir "Processando..." ao iniciar o envio do prompt
        statusDiv.textContent = 'Processando...';

        try {
            const fileContent = await fetchFileContent(fileName);
            const responseText = await fetchPromptResponse(userPrompt, fileContent);
            responseDiv.textContent = responseText;

            // Salvar o prompt e atualizar a lista
            savePrompt(userPrompt);
            displayPreviousPrompts();

            // Remover o "Processando..." após a resposta ser exibida
            statusDiv.textContent = '';

        } catch (error) {
            statusDiv.textContent = 'Erro: ' + error.message;
        }
    });

    async function fetchFileContent(fileName) {
        const response = await fetch(fileName);
        if (!response.ok) throw new Error('Arquivo não encontrado: ' + fileName);
        return await response.text();
    }

    async function fetchPromptResponse(userPrompt, fileContent) {
//        const apiKey = await loadApiKey();
        const apiKey = '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';
        const apiUrl = `https://api.openai.com/v1/chat/completions`;

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "gpt-4", 
                messages: [
                    { role: "system", content: "Você é um assistente inteligente." },
                    { role: "user", content: `${fileContent}\n\nPergunta: ${userPrompt}` }
                ],
                max_tokens: 1000
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || 'Sem resposta válida.';
    }

    async function loadApiKey() {
        const response = await fetch('chaveOpenAI.js');
        const text = await response.text();
        const match = text.match(/const\s+minhachave\s*=\s*'([^']+)'/);
        if (!match) throw new Error('Chave da API não encontrada');
        return match[1];
    }

    // Função para salvar o prompt no localStorage
    function savePrompt(prompt) {
        let prompts = JSON.parse(localStorage.getItem('previousPrompts') || '[]');
        if (!prompts.includes(prompt)) {
            prompts = [prompt, ...prompts].slice(0, 5); // Limita a 5 itens
            localStorage.setItem('previousPrompts', JSON.stringify(prompts));
        }
    }

    // Função para exibir os prompts anteriores
    function displayPreviousPrompts() {
        const prompts = JSON.parse(localStorage.getItem('previousPrompts') || '[]');
        previousPromptsDiv.innerHTML = prompts.length > 0 
            ? `<h3>Prompts Anteriores:</h3><ul>${prompts.map(p => `<li>${p}</li>`).join('')}</ul>`
            : '<p>Nenhum prompt anterior.</p>';
    }
});
