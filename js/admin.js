exigirLogin();

const usuario = getUsuarioLogado();

// Redireciona se não for admin
if (usuario.cargo !== "admin") {
  window.location.href = "historico.html";
}

async function carregarTodos() {
  const registros = await buscarTodos();
  const tbody = document.getElementById("tabela-admin").querySelector("tbody");

  // Limpa a linha de exemplo estática que estava no HTML
  tbody.innerHTML = "";

  if (registros.length === 0) {
    document.getElementById("admin-vazio").style.display = "block";
    return;
  }

  registros.reverse().forEach(r => {
    const linha = tbody.insertRow();
    linha.innerHTML = `
      <td>${r[2]}</td>
      <td>${r[4]}</td>
      <td>${r[5]}</td>
      <td>${r[6]}</td>
      <td>${r[3]}</td>
    `;
  });
}

carregarTodos();