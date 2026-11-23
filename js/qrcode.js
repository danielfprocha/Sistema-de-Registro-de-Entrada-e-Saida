exigirLogin();

let leitor = null;
let validando = false;

function mostrarErroQr(mensagem) {
  const el = document.getElementById("msg-erro-qr");
  el.textContent = "⚠️ " + mensagem;
  el.style.display = "block";
}

function mensagemErroCamera(erro) {
  if (!window.isSecureContext) {
    return "A câmera só funciona em página segura (HTTPS). Acesse o sistema pelo endereço https.";
  }
  const nome = erro && erro.name ? erro.name : "";
  if (nome === "NotAllowedError" || nome === "PermissionDeniedError") {
    return "Permissão da câmera negada. Libere o acesso à câmera nas configurações do navegador e recarregue a página.";
  }
  if (nome === "NotFoundError" || nome === "OverconstrainedError") {
    return "Nenhuma câmera foi encontrada neste aparelho.";
  }
  if (nome === "NotReadableError") {
    return "A câmera está em uso por outro aplicativo. Feche-o e recarregue a página.";
  }
  return "Não foi possível acessar a câmera. Verifique as permissões do navegador. (" + (erro && erro.message ? erro.message : erro) + ")";
}

async function aoLerQr(textoLido) {
  console.log("QR lido");
  if (validando) return;
  validando = true;

  const r = await chamarApi("validarQr", { qr: textoLido });
  console.log("Resposta:", r);

  if (r && r.ok) {
    sessionStorage.setItem("qr_texto", textoLido);
    try { await leitor.stop(); } catch (e) { /* ignora */ }
    window.location.href = "registro.html";
    return;
  }

  mostrarErroQr((r && r.mensagem) || "QR Code inválido.");
  // pausa curta para não validar o mesmo quadro dezenas de vezes por segundo
  setTimeout(() => { validando = false; }, 2000);
}

function iniciarLeitor() {
  if (typeof Html5Qrcode === "undefined") {
    mostrarErroQr("A biblioteca de leitura do QR Code não foi carregada. Confira se o arquivo assets/vendor/html5-qrcode-2.3.8.min.js existe.");
    return;
  }

  leitor = new Html5Qrcode("qr-reader");

  leitor.start(
    { facingMode: "environment" }, // câmera traseira do celular
    { fps: 10, qrbox: 250 },
    aoLerQr,
    () => { /* ignora erros de leitura contínua */ }
  ).catch((erro) => {
    console.error("Erro ao iniciar a câmera:", erro);
    mostrarErroQr(mensagemErroCamera(erro));
  });
}

iniciarLeitor();
