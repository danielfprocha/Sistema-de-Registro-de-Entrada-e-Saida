exigirLogin();

const usuario = getUsuarioLogado();

async function carregarHistorico() {
  const registros = await buscarHistorico(usuario.id);
  const tbody = document.getElementById("tabela-historico").querySelector("tbody");

  // Limpa a linha de exemplo estática que estava no HTML
  tbody.innerHTML = "";

  if (registros.length === 0) {
    document.getElementById("historico-vazio").style.display = "block";
    return;
  }

  registros.reverse().forEach(r => {
    const linha = tbody.insertRow();
    linha.innerHTML = `
      <td>${r[5]}</td>
      <td>${r[6]}</td>
      <td>${r[4]}</td>
    `;
  });
}

carregarHistorico();