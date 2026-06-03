exigirLogin();

const CODIGO_VALIDO = "CLINICA_VETERINARIA_UNIBH_2025";

function iniciarLeitor() {
  const leitor = new Html5Qrcode("qr-reader");

  leitor.start(
    { facingMode: "environment" }, // câmera traseira do celular
    { fps: 10, qrbox: 250 },
    (textoLido) => {
      if (textoLido === CODIGO_VALIDO) {
        leitor.stop();
        sessionStorage.setItem("qr_validado", "true");
        window.location.href = "registro.html";
      } else {
        document.getElementById("msg-erro-qr").textContent = "QR Code inválido. Use o código da clínica.";
        document.getElementById("msg-erro-qr").style.display = "block";
      }
    },
    (erro) => { /* ignorar erros de leitura contínua */ }
  ).catch(() => {
    // Câmera não acessível — mostrar mensagem de erro
    document.getElementById("msg-erro-qr").style.display = "block";
  });
}

iniciarLeitor();