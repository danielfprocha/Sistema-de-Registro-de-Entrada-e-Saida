exigirLogin();

function criarCard(registro) {
  const tipo = registro.acao === "entrada" ? "entrada" : "saida";
  const icone = tipo === "entrada" ? "▶" : "■";
  const label = tipo === "entrada" ? "Entrada" : "Saída";

  const card = document.createElement("div");
  card.className = "registro-card " + tipo;

  const info = document.createElement("div");
  info.className = "registro-card-info";

  const data = document.createElement("span");
  data.className = "registro-data";
  data.textContent = registro.data;

  const hora = document.createElement("span");
  hora.className = "registro-hora";
  hora.textContent = registro.horario;

  info.append(data, hora);

  const badge = document.createElement("span");
  badge.className = "registro-badge " + tipo;
  badge.textContent = icone + " " + label;

  card.append(info, badge);
  return card;
}

async function carregarHistorico() {
  const r = await chamarApi("historico");
  const lista = document.getElementById("lista-registros");

  if (!r || !r.ok) {
    const erro = document.getElementById("erro-geral");
    erro.textContent = "⚠️ " + ((r && r.mensagem) || "Não foi possível carregar o histórico.");
    erro.style.display = "block";
    return;
  }

  if (!r.registros || r.registros.length === 0) {
    document.getElementById("historico-vazio").style.display = "block";
    return;
  }

  // O servidor já devolve os 10 mais recentes, do mais novo ao mais antigo
  r.registros.forEach((registro) => lista.appendChild(criarCard(registro)));
}

carregarHistorico();
