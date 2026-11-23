// Única porta de comunicação com o Apps Script.
// Tudo é POST com corpo JSON em texto, SEM cabeçalho Content-Type
// (assim o navegador não faz preflight de CORS, que o Apps Script não responde).
// Resposta: { ok: true, ... } ou { ok: false, codigo, mensagem }.
const API_URL = "https://script.google.com/macros/s/AKfycbxGSX7Noj7uoziGJpyKPeEjXEsOa6DheHQRO4MoJMogZ4pHvtJUBEDxmOEmA-8_jYbYsQ/exec";

async function chamarApi(op, dados = {}) {
  const corpo = { op, ...dados };

  if (op !== "login") {
    const usuario = getUsuarioLogado();
    corpo.token = usuario ? usuario.token : "";
  }

  let resposta;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(corpo)
    });
    resposta = await res.json();
  } catch (erro) {
    return {
      ok: false,
      codigo: "rede",
      mensagem: "Falha de conexão com o servidor. Verifique a internet e tente novamente."
    };
  }

  if (resposta && resposta.codigo === "sessao") {
    limparSessao();
    window.location.href = "../html/login.html";
  }

  return resposta;
}
