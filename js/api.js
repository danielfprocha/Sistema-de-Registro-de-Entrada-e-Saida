// Única porta de comunicação com o Apps Script.
// Tudo é POST com corpo JSON em texto, SEM cabeçalho Content-Type
// (assim o navegador não faz preflight de CORS, que o Apps Script não responde).
// Resposta: { ok: true, ... } ou { ok: false, codigo, mensagem }.

async function chamarApi(op, dados = {}) {
  const corpo = { op, ...dados };

  if (op !== "login") {
    const usuario = getUsuarioLogado();
    corpo.token = usuario ? usuario.token : "";
  }

  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), 30000);

  let resposta;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(corpo),
      signal: controle.signal
    });
    resposta = await res.json();
  } catch (erro) {
    console.error("Erro na chamada à API:", erro);
    return {
      ok: false,
      codigo: "rede",
      mensagem: erro.name === "AbortError"
        ? "O servidor demorou demais para responder. Tente novamente."
        : "Falha de conexão com o servidor. Verifique a internet e tente novamente."
    };
  } finally {
    clearTimeout(timer);
  }

  if (resposta && resposta.codigo === "sessao") {
    limparSessao();
    window.location.href = "../html/login.html";
  }

  return resposta;
}