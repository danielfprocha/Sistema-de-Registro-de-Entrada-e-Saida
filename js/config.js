// ===== Configuração do front-end =====
// Só coloque aqui o que pode ser público.
// Texto do QR, coordenadas do hospital e raio ficam no Apps Script (Propriedades do script).

// URL do Web App do Apps Script (termina em /exec).
// Atualize sempre que criar uma NOVA implantação.
const API_URL = "https://script.google.com/macros/s/AKfycbyRi6jSOvntsZVAdJ4J4yOTTe8PO8HghxasIMQgSOoX4-HdffDHx4toP1SOAtcXM-HKSw/exec";

// Nome do local exibido nas telas (elementos com o atributo data-local)
const LOCAL_NOME = "Hospital Público";

// Parâmetros da leitura de GPS (gps.js)
const TEMPO_LEITURA_MS = 10000; // quanto tempo tentar melhorar a precisão
const PRECISAO_MAX_M = 100;     // acima disso a leitura é rejeitada (o servidor confere de novo)
const TIMEOUT_MS = 20000;       // tempo máximo para obter a primeira posição

document.querySelectorAll("[data-local]").forEach((el) => {
  el.textContent = LOCAL_NOME;
});
