exigirLogin();

if (!sessionStorage.getItem("qr_texto")) {
  window.location.href = "qrcode.html";
}

const usuario = getUsuarioLogado() || { nome: "", ra: "" };
document.getElementById("nome-usuario").textContent = usuario.nome;

let salvando = false;

function esconderTudo() {
  document.getElementById("erro-entrada-dupla").style.display = "none";
  document.getElementById("erro-saida-dupla").style.display = "none";
  document.getElementById("erro-geral").style.display = "none";
  document.getElementById("confirmacao-entrada").style.display = "none";
  document.getElementById("confirmacao-saida").style.display = "none";
  document.getElementById("feedback-entrada").style.display = "none";
  document.getElementById("feedback-saida").style.display = "none";
  definirStatus("");
}

function definirStatus(texto) {
  document.getElementById("msg-status").textContent = texto;
}

function mostrarErroGeral(mensagem) {
  const el = document.getElementById("erro-geral");
  el.textContent = "⚠️ " + mensagem;
  el.style.display = "block";
}

function definirBotoesConfirmacao(desabilitado) {
  document.querySelectorAll(".btn-confirmar, .btn-cancelar").forEach((b) => {
    b.disabled = desabilitado;
  });
}

function cancelar() {
  if (salvando) return;
  esconderTudo();
}

// Passo 1: consulta a última ação (só para UX; o servidor valida de novo ao salvar)
async function confirmarRegistro(acao) {
  if (salvando) return;
  esconderTudo();

  const r = await chamarApi("ultimo");
  if (!r || !r.ok) {
    mostrarErroGeral((r && r.mensagem) || "Não foi possível consultar seu último registro.");
    return;
  }

  const ultima = r.ultima; // "entrada" | "saida" | null

  if (acao === "entrada" && ultima === "entrada") {
    document.getElementById("erro-entrada-dupla").style.display = "flex";
    return;
  }
  if (acao === "saida" && ultima !== "entrada") {
    document.getElementById("erro-saida-dupla").style.display = "flex";
    return;
  }

  if (acao === "entrada") {
    document.getElementById("ra-usuario").textContent = "RA: " + usuario.ra;
    document.getElementById("nome-confirmacao").textContent = usuario.nome;
    document.getElementById("confirmacao-entrada").style.display = "block";
  } else {
    document.getElementById("ra-usuario-saida").textContent = "RA: " + usuario.ra;
    document.getElementById("nome-confirmacao-saida").textContent = usuario.nome;
    document.getElementById("confirmacao-saida").style.display = "block";
  }
}

// Passo 2: localização + envio. Só mostra "Confirmada" depois do ok do servidor.
async function salvarEConfirmar(acao) {
  if (salvando) return;
  salvando = true;
  definirBotoesConfirmacao(true);
  document.getElementById("erro-geral").style.display = "none";

  try {
    definirStatus("Obtendo sua localização...");
    const gps = await capturarLocalizacao();
    if (!gps.ok) {
      definirStatus("");
      mostrarErroGeral(gps.mensagem);
      return;
    }

    definirStatus("Registrando...");
    const r = await chamarApi("registrar", {
      acao: acao,
      qr: sessionStorage.getItem("qr_texto"),
      latitude: gps.latitude,
      longitude: gps.longitude,
      precisao: gps.precisao
    });
    definirStatus("");

    if (!r || !r.ok) {
      if (r && r.codigo === "qr") {
        sessionStorage.removeItem("qr_texto");
        mostrarErroGeral((r.mensagem || "QR Code inválido.") + " Você será levado de volta à leitura do QR Code.");
        setTimeout(() => { window.location.href = "qrcode.html"; }, 2500);
      } else {
        mostrarErroGeral((r && r.mensagem) || "Não foi possível registrar. Tente novamente.");
      }
      return;
    }

    // Sucesso: data e hora vêm do servidor
    esconderTudo();
    if (acao === "entrada") {
      document.getElementById("feedback-entrada-data").textContent = r.data;
      document.getElementById("feedback-entrada-hora").textContent = r.horario;
      document.getElementById("feedback-entrada").style.display = "block";
    } else {
      document.getElementById("feedback-saida-data").textContent = r.data;
      document.getElementById("feedback-saida-hora").textContent = r.horario;
      document.getElementById("feedback-saida").style.display = "block";
    }

    // O próximo registro exige ler o QR Code de novo
    sessionStorage.removeItem("qr_texto");
  } finally {
    salvando = false;
    definirBotoesConfirmacao(false);
  }
}
