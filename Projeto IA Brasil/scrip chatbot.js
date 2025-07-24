document.addEventListener("DOMContentLoaded", function() {
    // Referências aos elementos do DOM
    const btnAbrirChat = document.getElementById("btn-abrir-chat");
    const btnFecharChat = document.getElementById("btn-fechar-chat");
    const janelaChat = document.getElementById("janela-chat");
    const corpoChat = document.getElementById("corpo-chat");
    const inputChat = document.getElementById("input-chat");
    const btnEnviarChat = document.getElementById("btn-enviar-chat");
    const seletorIA = document.getElementById("seletor-ia");

    if (!seletorIA) {
        console.error("Elemento #seletor-ia não encontrado no HTML!");
    }

    // Array para guardar o histórico da conversa
    let historicoChat = [];

    // Chaves de API (ATENÇÃO: EXPOSTA PUBLICAMENTE - Risco de segurança em produção!)
    const CHAVES_API = {
        gemini: "AIzaSyDT62vPZzpH6pB45vDY2afhfCauH8Wt_Ik",
    };

    // Event listeners para abrir e fechar o chat
    btnAbrirChat.addEventListener("click", () => {
        janelaChat.classList.remove("hidden");
        btnAbrirChat.classList.add("hidden");
        // Opcional: focar no input ao abrir
        inputChat.focus();
    });

    btnFecharChat.addEventListener("click", () => {
        janelaChat.classList.add("hidden");
        btnAbrirChat.classList.remove("hidden");
    });

    // Função para enviar mensagem
    const enviarMensagem = async () => {
        const mensagemUsuario = inputChat.value.trim();
        if (mensagemUsuario === "") return; // Não envia mensagem vazia

        adicionarMensagemNaTela(mensagemUsuario, 'mensagem-usuario');
        inputChat.value = ""; // Limpa o input após enviar

        // Adiciona a mensagem do usuário ao histórico
        historicoChat.push({ role: "user", parts: [{ text: mensagemUsuario }] });

        // Exibe "Digitando..." enquanto espera a resposta da IA
        const divDigitando = adicionarMensagemNaTela('Digitando...', 'mensagem-bot digitando');
        const iaSelecionada = seletorIA.value;

        try {
            const respostaIA = await obterRespostaIA(iaSelecionada);
            divDigitando.remove(); // Remove o "Digitando..."
            adicionarMensagemNaTela(respostaIA, 'mensagem-bot'); // Adiciona a resposta da IA
            historicoChat.push({ role: "model", parts: [{ text: respostaIA }] }); // Adiciona a resposta da IA ao histórico
        } catch (error) {
            console.error("Erro ao obter resposta da IA:", error);
            divDigitando.remove();
            adicionarMensagemNaTela('Desculpe, ocorreu um erro ao processar sua solicitação.', 'mensagem-bot');
            // Remove a última mensagem do usuário do histórico para evitar reenvio com erro
            historicoChat.pop(); 
        }
    };

    // Função para adicionar mensagens na tela do chat
    function adicionarMensagemNaTela(texto, classe) {
        const divMensagem = document.createElement("div");
        divMensagem.className = classe;
        divMensagem.innerHTML = `<span>${texto}</span>`;
        corpoChat.appendChild(divMensagem);
        corpoChat.scrollTop = corpoChat.scrollHeight; // Rola para a última mensagem
        return divMensagem; // Retorna o elemento criado, útil para remover o "Digitando..."
    }

    // Função para obter resposta de acordo com o provedor de IA selecionado
    async function obterRespostaIA(provedor) {
        switch (provedor) {
            case "gemini":
                return await obterRespostaDoGemini();
            default:
                return "Provedor de IA não suportado.";
        }
    }

    // Função para obter resposta da API do Gemini
    async function obterRespostaDoGemini() {
        const apiKey = CHAVES_API.gemini;
        if (!apiKey) {
            return "Chave de API não definida.";
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: historicoChat,
            systemInstruction: {
                parts: [{
                    text: "Você é um assistente virtual amigável e prestativo. Responda às perguntas de forma clara e concisa."
                }]
            }
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            // Lança um erro se a resposta da API não for bem-sucedida
            throw new Error(`Erro na API do Gemini: ${response.statusText} (Status: ${response.status})`);
        }

        const result = await response.json();

        // Verifica se há candidatos e conteúdo na resposta
        if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
            return result.candidates[0].content.parts[0].text;
        } else {
            console.warn("Resposta da API Gemini não contém conteúdo esperado:", result);
            return "Não consegui gerar uma resposta no momento.";
        }
    }

    // Event listeners para enviar mensagem (clique no botão e tecla Enter)
    btnEnviarChat.addEventListener('click', enviarMensagem);
    inputChat.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });
});
