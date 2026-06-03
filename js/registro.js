exigirLogin();

if (!sessionStorage.getItem("qr_validado")) {
  window.location.href = "qrcode.html";
}

const usuario = getUsuarioLogado();
document.getElementById("nome-usuario").textContent = usuario.nome;

function esconderTudo() {
  document.getElementById("erro-entrada-dupla").style.display = "none";
  document.getElementById("erro-saida-dupla").style.display = "none";
  document.getElementById("confirmacao-entrada").style.display = "none";
  document.getElementById("confirmacao-saida").style.display = "none";
  document.getElementById("feedback-entrada").style.display = "none";
  document.getElementById("feedback-saida").style.display = "none";
}

function cancelar() {
  esconderTudo();
}

async function confirmarRegistro(acao) {
  esconderTudo();

  // 1. Buscar último registro do usuário
  const ultimos = await buscarUltimoRegistro(usuario.id);
  const ultimo = ultimos.length ? ultimos[0] : null;

  // 2. Validar sequência de entrada/saída
  if (ultimo) {
    const ultimaAcao = ultimo[3]; // coluna "acao" na nova estrutura
    if (ultimaAcao === acao) {
      if (acao === "entrada") {
        document.getElementById("erro-entrada-dupla").style.display = "flex";
      } else {
        document.getElementById("erro-saida-dupla").style.display = "flex";
      }
      return;
    }
  } else if (acao === "saida") {
    document.getElementById("erro-saida-dupla").style.display = "flex";
    return;
  }

  // 3. Mostrar tela de confirmação com dados do usuário
  if (acao === "entrada") {
    document.getElementById("cargo-usuario").textContent = usuario.cargo;
    document.getElementById("nome-confirmacao").textContent = usuario.nome;
    document.getElementById("confirmacao-entrada").style.display = "block";
    return;
  } else {
    document.getElementById("cargo-usuario-saida").textContent = usuario.cargo;
    document.getElementById("nome-confirmacao-saida").textContent = usuario.nome;
    document.getElementById("confirmacao-saida").style.display = "block";
    return;
  }
}

async function salvarEConfirmar(acao) {
  esconderTudo();

  // 4. Salvar registro
  await salvarRegistro({
    usuario_id: usuario.id,
    nome: usuario.nome,
    cargo: usuario.cargo,
    acao: acao
  });

  // 5. Exibir feedback de sucesso
  const agora = new Date();
  const data = agora.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hora = agora.toLocaleTimeString("pt-BR");

  if (acao === "entrada") {
    document.getElementById("feedback-entrada-data").textContent = data;
    document.getElementById("feedback-entrada-hora").textContent = hora;
    document.getElementById("feedback-entrada").style.display = "block";
  } else {
    document.getElementById("feedback-saida-data").textContent = data;
    document.getElementById("feedback-saida-hora").textContent = hora;
    document.getElementById("feedback-saida").style.display = "block";
  }

  // 6. Limpar validação do QR após uso
  sessionStorage.removeItem("qr_validado");
}