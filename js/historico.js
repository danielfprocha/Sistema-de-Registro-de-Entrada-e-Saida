exigirLogin();

const usuario = getUsuarioLogado();

function formatarData(dataStr) {
  try {
    const d = new Date(dataStr);
    if (isNaN(d.getTime())) return dataStr;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch(e) { return dataStr; }
}

function formatarHora(horaStr) {
  try {
    const d = new Date(horaStr);
    if (isNaN(d.getTime())) return horaStr;
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch(e) { return horaStr; }
}

async function carregarHistorico() {
  const registros = await buscarHistorico(usuario.id);
  const lista = document.getElementById("lista-registros");

  if (!registros || registros.length === 0) {
    document.getElementById("historico-vazio").style.display = "block";
    return;
  }

  // Inverte e limita a 10 registros
  const ultimos = [...registros].reverse().slice(0, 10);

  ultimos.forEach(r => {
    const tipo = r[3] === 'entrada' ? 'entrada' : 'saida';
    const icone = tipo === 'entrada' ? '▶' : '■';
    const label = tipo === 'entrada' ? 'Entrada' : 'Saída';
    const data = formatarData(r[4]);
    const hora = formatarHora(r[5]);

    const card = document.createElement('div');
    card.className = `registro-card ${tipo}`;
    card.innerHTML = `
      <div class="registro-card-info">
        <span class="registro-data">${data}</span>
        <span class="registro-hora">${hora}</span>
      </div>
      <span class="registro-badge ${tipo}">${icone} ${label}</span>
    `;
    lista.appendChild(card);
  });
}

carregarHistorico();