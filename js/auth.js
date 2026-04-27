// =====================================================
// auth.js — Fase 3: Autenticação
// =====================================================

async function login(nome, senha) {
  try {
    const resultado = await fazerLogin(nome, senha);

    if (!resultado || resultado.length === 0) {
      return { sucesso: false, mensagem: "Usuário ou senha incorretos." };
    }

    const usuario = resultado[0];
    localStorage.setItem("usuario", JSON.stringify(usuario));
    return { sucesso: true, usuario };

  } catch (erro) {
    return { sucesso: false, mensagem: "Erro de conexão. Tente novamente." };
  }
}

function getUsuarioLogado() {
  const dados = localStorage.getItem("usuario");
  return dados ? JSON.parse(dados) : null;
}

function logout() {
  localStorage.removeItem("usuario");
  window.location.href = "../html/login.html";
}

function exigirLogin() {
  if (!getUsuarioLogado()) {
    window.location.href = "../html/login.html";
  }
}