exigirLogin();

if (!sessionStorage.getItem("qr_validado")) {
  window.location.href = "qrcode.html";
}

const usuario = getUsuarioLogado();
document.getElementById("nome-usuario").textContent = usuario.nome;

async function confirmarRegistro(acao) {
  // 1. Buscar último registro do usuário
  const ultimos = await buscarUltimoRegistro(usuario.id);
  const ultimo = ultimos.length ? ultimos[0] : null;

  // 2. Validar sequência de entrada/saída
  if (ultimo) {
    const ultimaAcao = ultimo[3]; // coluna "acao" na planilha
    if (ultimaAcao === acao) {
      const msg = acao === "entrada"
        ? "Seu último registro já foi uma Entrada."
        : "Seu último registro já foi uma Saída.";
      document.getElementById("msg-status").textContent = msg;
      return;
    }
  } else if (acao === "saida") {
    document.getElementById("msg-status").textContent = "Você ainda não registrou uma Entrada.";
    return;
  }

  // 3. Salvar registro (sem latitude e longitude)
  await salvarRegistro({
    usuario_id: usuario.id,
    nome: usuario.nome,
    acao: acao
  });

  // 4. Exibir confirmação
  const agora = new Date();
  document.getElementById("msg-status").textContent =
    `${acao === "entrada" ? "Entrada" : "Saída"} confirmada às ${agora.toLocaleTimeString("pt-BR")} de ${agora.toLocaleDateString("pt-BR")}`;

  // 5. Limpar validação do QR após uso
  sessionStorage.removeItem("qr_validado");
}