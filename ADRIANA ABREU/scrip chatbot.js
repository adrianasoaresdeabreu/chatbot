//logica do chatbot
        const btnAbrirChat = document.getElementById("btn-abrir-chat");
        const btnFecharChat = document.getElementById("btn-fechar-chat");
        const janelaChat = document.getElementById("janela-chat");
        const corpoChat = document.getElementById("corpo-chat");
        const inputChat = document.getElementById("input-chat");
        const btnEnviarChat = document.getElementById("btn-enviar-chat");
        const seletorIA = document.getElementById("seletor-ia");

        //atualizado: array para guardar o historico da conversa
        let historicoChat = [];
        const CHAVES_API = {
            gemini:"AIzaSyDT62vPZzpH6pB45vDY2afhfCauH8Wt_Ik",
        }; // fim da chave api

        btnAbrirChat.addEventListener("click", () => {
            janelaChat.classList.remove("hidden");
            btnAbrirChat.classList.add("hidden");
        });

        btnFecharChat.addEventListener("click", () => {
            janelaChat.classList.add("hidden");
            btnAbrirChat.classList.remove("hidden");
        });
        const enviarMensagem = async () => {
            const mensagemUsuario = inputChat.value.trim();
            if (mensagemUsuario === "") return;
            adicionarMensagemNaTela(mensagemUsuario,'mensagem-usuario');
            inputChat.value = "";
            historicoChat.push({role:"user", parts:[{text:mensagemUsuario}]});
            const divDigitando = adicionarMensagemNaTela('Digitando...','mensagem-botdigitando');
            const iaSelecionada = seletorIA.value;
            try {
                const respostaIA = await obterRespostaIA(iaSelecionada);
                adicionarMensagemNaTela(respostaIA, 'mensagem-bot');
                historicoChat.push({ role: "model", parts: [{ text: respostaIA }] });
            } catch (error) {
                console.error("Erro ao obter resposta da IA:", error);
                divDigitando.remove();
                adicionarMensagemNaTela('Desculpe, ocorreu um erro ao processar sua solicitação.', 'mensagem-bot');
                historicoChat.pop();
            }
        };
         function adicionarMensagemNaTela(texto, classe) {
            const divMensagem  = document.createElement("div");
            divMensagem.className = classe;
            divMensagem.innerHTML = `<span>${texto}</span>`;
            corpoChat.appendChild(divMensagem);
            corpoChat.scrollTop = corpoChat.scrollHeight; // rola para a ultima mensagem
            return divMensagem;
        }
        async function obterRespostaIA(provedor){
                   switch (provedor) {
            case "gemini":
                return await obterRespostaDoGemini();
                default:
                    return "Provedor de IA não suportado.";
        }
    }
        async function obterRespostaDoGemini() {
            const apiKey = CHAVES_API.gemini;
            if (!apiKey) {
                return  "Chave de API não definida.";
            }
            const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}";
            const payload = {
                contents: historicoChat,
                systemInstruction:{
                parts:[{
                    text: "Você é um assistente virtual amigável e prestativo. Responda às perguntas de forma clara e concisa."
                }]
            }
            };
            const response = await fetch(apiUrl,{
                method: "POST",
                headers: {
                    "Content-Type": "application/json"},   
                    body: JSON.stringify(payload)     
            });
         if (!response.ok) {
            throw new Error('erro na API do Gemini:${response.statusText}');
           }
           const result = await response.json();
           if (result.candidates&& result.candidates.length > 0 ){
            return result.candidates[0].content.parts[0].text;
        } else {
                return "nao consegui gerar uma resposta no momento";
            }  
        }
        btnEnviarChat.addEventListener('click', enviarMensagem);
        inputChat.addEventListener('keypress',(e) =>{
        if(e.key==='Enter')enviarMensagem();
    });