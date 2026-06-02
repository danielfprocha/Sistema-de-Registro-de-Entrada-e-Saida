exigirLogin();

if (!sessionStorage.getItem("qr_validado")) {
  window.location.href = "qrcode.html";
}