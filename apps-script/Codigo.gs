/**
 * Back-end do Sistema de Registro de Entrada e Saída (piloto Hospital Público).
 * Cole este arquivo no Apps Script da planilha geral e publique como Web App
 * (Executar como: Eu | Quem tem acesso: Qualquer pessoa).
 *
 * 17 planilhas (arquivos do Google Sheets):
 *  - 1 geral (a que contém este script), com as abas:
 *      "usuarios":  id | nome | ra | senha_hash | planilha_id
 *      "registros": id | usuario_id | nome | ra | acao | data | horario   (fonte da verdade)
 *      "falhas":    registro_id | usuario_id | erro | data_hora
 *  - 15 individuais (uma por aluno), cada uma com a aba "registros" (mesmas colunas e
 *    o MESMO id do registro da geral) e a aba "resumo" (gerada na exportação).
 *
 * Cada registro é gravado primeiro na geral e depois na individual. Se a gravação
 * individual falhar, o aluno continua confirmado, o erro vai para "falhas" e
 * reconciliar() completa as individuais depois.
 *
 * Latitude, longitude e precisão NÃO são gravadas: são usadas só para validar o raio.
 *
 * CONFIGURAÇÃO INICIAL (uma vez): edite e rode configurarPropriedades(),
 * inicializarPlanilhas() e cadastrarLote() (que já cria as planilhas individuais).
 */

const FUSO = "America/Sao_Paulo";
const ABA_USUARIOS = "usuarios";
const ABA_REGISTROS = "registros";
const ABA_FALHAS = "falhas";
const ABA_RESUMO = "resumo";
const CABECALHO_REGISTROS = ["id", "usuario_id", "nome", "ra", "acao", "data", "horario"];
const SESSAO_SEGUNDOS = 6 * 60 * 60;   // limite do CacheService
const MAX_TENTATIVAS_LOGIN = 5;
const JANELA_TENTATIVAS_SEGUNDOS = 10 * 60;
const PRECISAO_MAX_M = 100;            // rejeita leituras de GPS piores que isso
const FOLGA_PRECISAO_MAX_M = 50;       // quanto da imprecisão é descontado da distância

/* ============================ ENTRADA ============================ */

function doGet() {
  return json_({ ok: true, mensagem: "API ativa." });
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    switch (dados.op) {
      case "login":     return json_(login_(dados));
      case "validarQr": return json_(validarQr_(dados));
      case "ultimo":    return json_(ultimo_(dados));
      case "historico": return json_(historico_(dados));
      case "registrar": return json_(registrar_(dados));
      default:          return json_(erro_("dados", "Operação inválida."));
    }
  } catch (err) {
    return json_(erro_("interno", "Erro interno. Tente novamente."));
  }
}

/* ============================ OPERAÇÕES ============================ */

function login_(d) {
  const ra = String(d.ra || "").trim();
  const senha = String(d.senha || "");
  if (!ra || !senha) return erro_("dados", "Preencha o RA e a senha.");

  const cache = CacheService.getScriptCache();
  const chaveTent = "tent_" + ra;
  const tentativas = Number(cache.get(chaveTent) || 0);
  if (tentativas >= MAX_TENTATIVAS_LOGIN) {
    return erro_("bloqueado", "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  const linhas = aba_(ABA_USUARIOS).getDataRange().getValues().slice(1);
  const hash = hash_(senha);
  const u = linhas.find(l => String(l[2]) === ra && String(l[3]) === hash);

  if (!u) {
    cache.put(chaveTent, String(tentativas + 1), JANELA_TENTATIVAS_SEGUNDOS);
    return erro_("credenciais", "RA ou senha incorretos.");
  }

  cache.remove(chaveTent);
  const usuario = { id: String(u[0]), nome: String(u[1]), ra: String(u[2]) };
  const token = Utilities.getUuid();
  cache.put("sessao_" + token, JSON.stringify(usuario), SESSAO_SEGUNDOS);
  return { ok: true, token: token, usuario: usuario };
}

function validarQr_(d) {
  const u = usuarioDoToken_(d.token);
  if (!u) return erro_("sessao", "Sessão expirada. Faça login novamente.");
  if (!qrConfere_(d.qr)) return erro_("qr", "QR Code inválido. Use o código do local.");
  return { ok: true };
}

function ultimo_(d) {
  const u = usuarioDoToken_(d.token);
  if (!u) return erro_("sessao", "Sessão expirada. Faça login novamente.");
  return { ok: true, ultima: ultimaAcao_(u.id) };
}

function historico_(d) {
  const u = usuarioDoToken_(d.token);
  if (!u) return erro_("sessao", "Sessão expirada. Faça login novamente.");

  const linhas = aba_(ABA_REGISTROS).getDataRange().getValues().slice(1);
  const registros = [];
  for (let i = linhas.length - 1; i >= 0 && registros.length < 10; i--) {
    const l = linhas[i];
    if (String(l[1]) === u.id) {
      registros.push({ acao: String(l[4]), data: texto_(l[5], "dd/MM/yyyy"), horario: texto_(l[6], "HH:mm:ss") });
    }
  }
  return { ok: true, registros: registros };
}

function registrar_(d) {
  const u = usuarioDoToken_(d.token);
  if (!u) return erro_("sessao", "Sessão expirada. Faça login novamente.");

  const acao = d.acao;
  if (acao !== "entrada" && acao !== "saida") return erro_("dados", "Ação inválida.");

  // 1) QR Code
  if (!qrConfere_(d.qr)) return erro_("qr", "QR Code inválido. Escaneie o código do local novamente.");

  // 2) Localização (validada aqui, nunca gravada)
  const lat = Number(d.latitude), lng = Number(d.longitude), prec = Number(d.precisao);
  if (!isFinite(lat) || !isFinite(lng) || !isFinite(prec)) {
    return erro_("localizacao", "Não foi possível validar sua localização.");
  }
  if (prec > PRECISAO_MAX_M) {
    return erro_("localizacao", "Sinal de GPS fraco. Vá para um local mais aberto e tente novamente.");
  }
  const props = PropertiesService.getScriptProperties();
  const raio = Number(props.getProperty("RAIO_METROS"));
  const dist = distanciaMetros_(lat, lng, Number(props.getProperty("LOCAL_LAT")), Number(props.getProperty("LOCAL_LNG")));
  if (dist - Math.min(prec, FOLGA_PRECISAO_MAX_M) > raio) {
    return erro_("localizacao", "Você não está no local do hospital.");
  }

  // 3) Sequência + gravação na planilha GERAL, protegidas contra requisições simultâneas
  let linha, data, horario;
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ultima = ultimaAcao_(u.id);
    if (ultima === acao || (!ultima && acao === "saida")) {
      return erro_("sequencia", acao === "entrada"
        ? "Seu último registro já foi uma Entrada."
        : "Você ainda não registrou uma Entrada.");
    }

    const agora = new Date();
    data = Utilities.formatDate(agora, FUSO, "dd/MM/yyyy");
    horario = Utilities.formatDate(agora, FUSO, "HH:mm:ss");
    linha = [Utilities.getUuid(), u.id, u.nome, u.ra, acao, data, horario];
    aba_(ABA_REGISTROS).appendRow(linha);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  // 4) Cópia na planilha INDIVIDUAL (a geral é a fonte da verdade; falha aqui não desfaz o registro)
  try {
    gravarIndividual_(u.id, linha);
  } catch (err) {
    registrarFalha_(linha[0], u.id, err);
  }

  return { ok: true, acao: acao, data: data, horario: horario };
}

/* ============================ AUXILIARES ============================ */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function erro_(codigo, mensagem) {
  return { ok: false, codigo: codigo, mensagem: mensagem };
}

function aba_(nome) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nome);
}

function usuarioDoToken_(token) {
  if (!token) return null;
  const bruto = CacheService.getScriptCache().get("sessao_" + token);
  return bruto ? JSON.parse(bruto) : null;
}

function qrConfere_(texto) {
  const esperado = PropertiesService.getScriptProperties().getProperty("QR_TEXTO");
  return !!esperado && String(texto || "") === esperado;
}

function ultimaAcao_(usuarioId) {
  const linhas = aba_(ABA_REGISTROS).getDataRange().getValues();
  for (let i = linhas.length - 1; i >= 1; i--) {
    if (String(linhas[i][1]) === usuarioId) return String(linhas[i][4]);
  }
  return null;
}

function texto_(valor, formato) {
  return valor instanceof Date ? Utilities.formatDate(valor, FUSO, formato) : String(valor);
}

function hash_(senha) {
  const sal = PropertiesService.getScriptProperties().getProperty("SAL");
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sal + senha, Utilities.Charset.UTF_8);
  return bytes.map(b => ((b < 0 ? b + 256 : b)).toString(16).padStart(2, "0")).join("");
}

function distanciaMetros_(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const rad = x => x * Math.PI / 180;
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function planilhaIdDoUsuario_(usuarioId) {
  const l = aba_(ABA_USUARIOS).getDataRange().getValues().slice(1).find(x => String(x[0]) === String(usuarioId));
  return l ? String(l[4] || "") : "";
}

function gravarIndividual_(usuarioId, linha) {
  const pid = planilhaIdDoUsuario_(usuarioId);
  if (!pid) throw new Error("Usuário sem planilha individual.");
  SpreadsheetApp.openById(pid).getSheetByName(ABA_REGISTROS).appendRow(linha);
}

function registrarFalha_(registroId, usuarioId, err) {
  try {
    aba_(ABA_FALHAS).appendRow([registroId, usuarioId, String(err), Utilities.formatDate(new Date(), FUSO, "dd/MM/yyyy HH:mm:ss")]);
  } catch (e) { /* sem como registrar; reconciliar() ainda encontra o registro faltante */ }
}

/** Linhas da geral de um usuário, no formato de texto usado nas individuais. */
function linhasDoUsuario_(geral, usuarioId) {
  return geral
    .filter(l => String(l[1]) === String(usuarioId))
    .map(l => [String(l[0]), String(l[1]), String(l[2]), String(l[3]), String(l[4]), texto_(l[5], "dd/MM/yyyy"), texto_(l[6], "HH:mm:ss")]);
}

function formatarAbaRegistros_(aba) {
  aba.getRange("D:D").setNumberFormat("@");
  aba.getRange("F:G").setNumberFormat("@");
}

function criarPlanilhaIndividual_(nome, ra) {
  const ss = SpreadsheetApp.create("Registros - " + nome + " (" + ra + ")");
  const aba = ss.getSheets()[0];
  aba.setName(ABA_REGISTROS);
  aba.getRange(1, 1, 1, CABECALHO_REGISTROS.length).setValues([CABECALHO_REGISTROS]);
  formatarAbaRegistros_(aba);
  return ss.getId();
}

/* ============================ CONFIGURAÇÃO (rodar manualmente) ============================ */

/** Edite os valores e rode UMA vez. Não coloque estes valores no GitHub. */
function configurarPropriedades() {
  PropertiesService.getScriptProperties().setProperties({
    QR_TEXTO: "TROQUE_POR_UM_TEXTO_LONGO_E_ALEATORIO",  // o mesmo texto que vai no QR Code impresso
    LOCAL_LAT: "-19.9234",                               // coordenadas reais do hospital
    LOCAL_LNG: "-43.9451",
    RAIO_METROS: "100",                                  // calibrar no local (teste-gps)
    SAL: "TROQUE_POR_OUTRO_TEXTO_ALEATORIO",
    COORDENADOR_EMAIL: ""                                // usado em compartilharComCoordenador()
  });
}

/**
 * Cria as abas da planilha geral. ATENÇÃO: apaga o conteúdo de usuarios, registros e falhas.
 * Se você já rodou a versão antiga, NÃO rode de novo: basta adicionar o cabeçalho
 * "planilha_id" na coluna E de "usuarios", criar a aba "falhas" e rodar criarPlanilhasIndividuais().
 */
function inicializarPlanilhas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const u = ss.getSheetByName(ABA_USUARIOS) || ss.insertSheet(ABA_USUARIOS);
  u.clear();
  u.getRange(1, 1, 1, 5).setValues([["id", "nome", "ra", "senha_hash", "planilha_id"]]);
  u.getRange("C:C").setNumberFormat("@");

  const r = ss.getSheetByName(ABA_REGISTROS) || ss.insertSheet(ABA_REGISTROS);
  r.clear();
  r.getRange(1, 1, 1, CABECALHO_REGISTROS.length).setValues([CABECALHO_REGISTROS]);
  formatarAbaRegistros_(r);

  const f = ss.getSheetByName(ABA_FALHAS) || ss.insertSheet(ABA_FALHAS);
  f.clear();
  f.getRange(1, 1, 1, 4).setValues([["registro_id", "usuario_id", "erro", "data_hora"]]);
}

/** Edite a lista, rode uma vez e depois apague as senhas do código. Já cria a planilha individual de cada aluno. */
function cadastrarLote() {
  const lista = [
    // { nome: "Maria Silva", ra: "12345678", senha: "senha-provisoria" },
  ];
  const aba = aba_(ABA_USUARIOS);
  const existentes = aba.getDataRange().getValues().slice(1).map(l => String(l[2]));
  lista.forEach(p => {
    if (existentes.indexOf(String(p.ra)) !== -1) return;
    const planilhaId = criarPlanilhaIndividual_(p.nome, p.ra);
    aba.appendRow([Utilities.getUuid(), p.nome, String(p.ra), hash_(p.senha), planilhaId]);
  });
}

/** Cria a planilha individual de quem ainda não tem (útil se cadastrarLote falhou no meio). */
function criarPlanilhasIndividuais() {
  const aba = aba_(ABA_USUARIOS);
  const dados = aba.getDataRange().getValues();
  for (let i = 1; i < dados.length; i++) {
    if (!dados[i][4]) {
      aba.getRange(i + 1, 5).setValue(criarPlanilhaIndividual_(dados[i][1], dados[i][2]));
    }
  }
}

/* ============================ SINCRONIZAÇÃO E EXPORTAÇÃO ============================ */

/**
 * Completa as individuais com registros que existem na geral e faltam nelas
 * (por exemplo, quando a gravação individual falhou). Pode ser rodada a qualquer momento
 * ou agendada por gatilho diário. Não altera nem apaga linhas existentes.
 */
function reconciliar() {
  const geral = aba_(ABA_REGISTROS).getDataRange().getValues().slice(1);
  const usuarios = aba_(ABA_USUARIOS).getDataRange().getValues().slice(1);
  let adicionados = 0;

  usuarios.forEach(u => {
    const pid = String(u[4] || "");
    if (!pid) return;
    const aba = SpreadsheetApp.openById(pid).getSheetByName(ABA_REGISTROS);
    const ids = new Set(aba.getDataRange().getValues().slice(1).map(l => String(l[0])));
    const faltando = linhasDoUsuario_(geral, u[0]).filter(l => !ids.has(l[0]));
    if (faltando.length) {
      aba.getRange(aba.getLastRow() + 1, 1, faltando.length, CABECALHO_REGISTROS.length)
         .setNumberFormat("@").setValues(faltando);
      adicionados += faltando.length;
    }
  });

  Logger.log("Registros adicionados às individuais: " + adicionados);
  return adicionados;
}

/**
 * Reescreve cada individual a partir da geral (inclui correções manuais feitas na geral)
 * e gera a aba "resumo" com horas por dia e marcação de entrada sem saída.
 * Rode no fim de janeiro, antes de enviar ao coordenador. Retorna os links.
 */
function exportarPorAluno() {
  const geral = aba_(ABA_REGISTROS).getDataRange().getValues().slice(1);
  const usuarios = aba_(ABA_USUARIOS).getDataRange().getValues().slice(1);
  const links = [];

  usuarios.forEach(u => {
    const pid = String(u[4] || "");
    if (!pid) return;
    const ss = SpreadsheetApp.openById(pid);
    const linhas = linhasDoUsuario_(geral, u[0]);

    const aba = ss.getSheetByName(ABA_REGISTROS);
    aba.getRange(2, 1, Math.max(aba.getMaxRows() - 1, 1), CABECALHO_REGISTROS.length).clearContent();
    if (linhas.length) aba.getRange(2, 1, linhas.length, CABECALHO_REGISTROS.length).setNumberFormat("@").setValues(linhas);

    const resumo = resumoDoUsuario_(linhas);
    const abaRes = ss.getSheetByName(ABA_RESUMO) || ss.insertSheet(ABA_RESUMO);
    abaRes.clear();
    abaRes.getRange(1, 1, 1, 3).setValues([["Dia", "Horas", "Observação"]]);
    if (resumo.length) abaRes.getRange(2, 1, resumo.length, 3).setNumberFormat("@").setValues(resumo);

    links.push([u[1], u[2], ss.getUrl()]);
  });

  Logger.log(links.map(l => l.join(" | ")).join("\n"));
  return links;
}

/** Dá acesso de leitura às 15 planilhas individuais ao e-mail em COORDENADOR_EMAIL. */
function compartilharComCoordenador() {
  const email = PropertiesService.getScriptProperties().getProperty("COORDENADOR_EMAIL");
  if (!email) throw new Error("Defina COORDENADOR_EMAIL nas Propriedades do script.");
  aba_(ABA_USUARIOS).getDataRange().getValues().slice(1).forEach(u => {
    if (u[4]) SpreadsheetApp.openById(String(u[4])).addViewer(email);
  });
}

function resumoDoUsuario_(linhas) {
  const horas = {};
  const semSaida = {};
  let aberta = null;

  linhas.forEach(l => {
    const dia = l[5];
    if (!(dia in horas)) horas[dia] = 0;
    const dt = parseDataHora_(l[5], l[6]);
    if (l[4] === "entrada") {
      if (aberta) semSaida[aberta.dia] = true;
      aberta = { dia: dia, dt: dt };
    } else if (aberta) {
      horas[aberta.dia] = (horas[aberta.dia] || 0) + (dt - aberta.dt) / 3600000;
      aberta = null;
    }
  });
  if (aberta) semSaida[aberta.dia] = true;

  return Object.keys(horas).map(dia => [
    dia,
    String(Math.round(horas[dia] * 100) / 100),
    semSaida[dia] ? "Entrada sem saída" : ""
  ]);
}

function parseDataHora_(data, horario) {
  const [d, m, a] = data.split("/").map(Number);
  const [h, mi, s] = horario.split(":").map(Number);
  return new Date(a, m - 1, d, h, mi, s || 0);
}