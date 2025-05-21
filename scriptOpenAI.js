// scriptOpenAI.js

const FAKE_API_KEY = "FAKE-KEY-0000";

window.addEventListener("DOMContentLoaded", () => {
  const apiKeyInput = document.getElementById("apiKey");
  const fileNameInput = document.getElementById("fileName");
  const userPromptInput = document.getElementById("userPrompt");
  const enviarBtn = document.getElementById("enviar");
  const statusDiv = document.getElementById("status");
  const responseDiv = document.getElementById("response");
  const listaPrompts = document.getElementById("listaPrompts");

  const savedKey = localStorage.getItem("openai_api_key");
  if (savedKey) apiKeyInput.value = savedKey;

  atualizarListaPrompts();

  apiKeyInput.addEventListener("input", () => {
    localStorage.setItem("openai_api_key", apiKeyInput.value.trim());
  });

  enviarBtn.addEventListener("click", async () => {
    const apiKey = localStorage.getItem("openai_api_key");
    const fileName = fileNameInput.value.trim();
    const prompt = userPromptInput.value.trim();

    if (!apiKey || !prompt) {
      statusDiv.textContent = "Informe a chave da API e o prompt.";
      return;
    }

    statusDiv.textContent = "Enviando para a OpenAI...";
    responseDiv.textContent = "";

    try {
      const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7
        })
      });

      const data = await resposta.json();
      if (data.choices && data.choices[0]) {
        responseDiv.textContent = data.choices[0].message.content;
        statusDiv.textContent = `Resposta recebida para: ${fileName || "sem nome"}`;
        salvarPrompt(prompt);
      } else {
        responseDiv.textContent = JSON.stringify(data, null, 2);
        statusDiv.textContent = "Erro ao interpretar resposta.";
      }
    } catch (error) {
      statusDiv.textContent = `Erro: ${error.message}`;
      responseDiv.textContent = "";
    }
  });

  window.addEventListener("beforeunload", (e) => {
    const proteger = confirm("Deseja substituir sua chave real por uma falsa antes de sair?");
    if (proteger) {
      localStorage.setItem("openai_api_key", FAKE_API_KEY);
    }
  });

  function salvarPrompt(prompt) {
    let historico = JSON.parse(localStorage.getItem("historico_prompts")) || [];
    historico.unshift(prompt);
    if (historico.length > 5) historico = historico.slice(0, 5);
    localStorage.setItem("historico_prompts", JSON.stringify(historico));
    atualizarListaPrompts();
  }

  function atualizarListaPrompts() {
    const historico = JSON.parse(localStorage.getItem("historico_prompts")) || [];
    listaPrompts.innerHTML = "";
    historico.forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p;
      listaPrompts.appendChild(li);
    });
  }
});
