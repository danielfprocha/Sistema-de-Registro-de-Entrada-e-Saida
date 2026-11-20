// Captura a localização com a melhor precisão possível.
// Usa watchPosition por ~TEMPO_LEITURA_MS e fica com a leitura mais precisa.
// Retorna { ok:true, latitude, longitude, precisao } ou { ok:false, mensagem }.
// As coordenadas só são enviadas ao servidor para validar o raio; não são salvas.

function capturarLocalizacao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ok: false, mensagem: "Este navegador não oferece localização." });
      return;
    }

    let melhor = null;
    let finalizado = false;
    let watchId = null;
    let tLeitura = null;
    let tLimite = null;

    function finalizar(resultado) {
      if (finalizado) return;
      finalizado = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(tLeitura);
      clearTimeout(tLimite);
      resolve(resultado);
    }

    function concluirComMelhor() {
      if (!melhor) {
        finalizar({ ok: false, mensagem: "Não foi possível obter sua localização. Vá para um local aberto e tente novamente." });
        return;
      }
      if (melhor.precisao > PRECISAO_MAX_M) {
        finalizar({
          ok: false,
          mensagem: `Localização imprecisa (${Math.round(melhor.precisao)} m). Vá para um local mais aberto e tente novamente.`
        });
        return;
      }
      finalizar({ ok: true, ...melhor });
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const leitura = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          precisao: pos.coords.accuracy
        };
        if (!melhor || leitura.precisao < melhor.precisao) melhor = leitura;
      },
      (erro) => {
        if (erro.code === 1) {
          finalizar({ ok: false, mensagem: "Permissão de localização negada. Libere o acesso à localização no navegador e tente novamente." });
        } else if (melhor) {
          concluirComMelhor();
        } else {
          finalizar({ ok: false, mensagem: "Não foi possível obter sua localização. Verifique se o GPS está ligado." });
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: TIMEOUT_MS }
    );

    // Passado o tempo de leitura, conclui se já houver uma posição;
    // se não houver, espera até o limite máximo.
    tLeitura = setTimeout(() => { if (melhor) concluirComMelhor(); }, TEMPO_LEITURA_MS);
    tLimite = setTimeout(concluirComMelhor, TIMEOUT_MS);
  });
}
