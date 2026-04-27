const API_URL = "https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbzGnqnvEgAoxy6Ra2cQVRIoH1DugqJcDVKvRPecaPDJA3vhW_zCHTVb6SgoqS0fKmsllQ/exec/exec";

async function fazerLogin(nome, senha) {
  const res = await fetch(`${API_URL}?tipo=login&nome=${encodeURIComponent(nome)}&senha=${encodeURIComponent(senha)}`);
  return res.json();
}

async function salvarRegistro(dados) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(dados)
  });
  return res.json();
}

async function buscarHistorico(usuario_id) {
  const res = await fetch(`${API_URL}?tipo=historico&usuario_id=${usuario_id}`);
  return res.json();
}

async function buscarTodos() {
  const res = await fetch(`${API_URL}?tipo=todos`);
  return res.json();
}

async function buscarUltimoRegistro(usuario_id) {
  const res = await fetch(`${API_URL}?tipo=ultimo&usuario_id=${usuario_id}`);
  return res.json();
}