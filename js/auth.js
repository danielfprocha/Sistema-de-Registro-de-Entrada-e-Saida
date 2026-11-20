async function login(ra, senha) {
  const r = await chamarApi("login", { ra, senha });

  if (!r || !r.ok) {
    return { sucesso: false, mensagem: (r && r.mensagem) || "Não foi possível entrar. Tente novamente." };
  }

  const usuario = { ...r.usuario, token: r.token };
  localStorage.setItem("usuario", JSON.stringify(usuario));
  return { sucesso: true, usuario };
}

function getUsuarioLogado() {
  try {
    const dados = localStorage.getItem("usuario");
    return dados ? JSON.parse(dados) : null;
  } catch (e) {
    return null;
  }
}

function limparSessao() {
  localStorage.removeItem("usuario");
  sessionStorage.removeItem("qr_texto");
}

function logout() {
  limparSessao();
  window.location.href = "../html/login.html";
}

function exigirLogin() {
  const usuario = getUsuarioLogado();
  if (!usuario || !usuario.token) {
    window.location.href = "../html/login.html";
  }
}
