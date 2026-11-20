# Sistema de Registro de Entrada e Saída

Sistema web de registro de entrada e saída, desenvolvido como projeto acadêmico (A3) por alunos de Sistemas de Informação do UniBH para a Clínica Veterinária UniBH. Na etapa atual funciona como **piloto no Hospital Público** (dez/2026 e jan/2027), com alunos de projetos de extensão de medicina veterinária. Os dados ficam em planilhas do Google Sheets.

---

## Fluxo do sistema

1. **Login** com RA e senha (provisória, definida no cadastro em lote).
2. **QR Code**: o aluno lê o QR Code do local. O texto é conferido no servidor.
3. **Entrada ou Saída**: o aluno escolhe a ação e vê uma tela de confirmação com nome e RA.
4. **Localização**: ao confirmar, o navegador captura o GPS e o servidor confere se o aluno está dentro do raio do local.
5. **Registro**: o servidor valida QR, localização e sequência (entrada só depois de saída e vice-versa), grava e devolve data e hora. A tela só mostra "Confirmada" depois dessa resposta.
6. O próximo registro exige ler o QR Code de novo.
7. **Histórico**: os 10 registros mais recentes do aluno.

Latitude, longitude e precisão **não são salvas**; servem apenas para validar o raio.

---

## Tecnologias

- HTML, CSS e JavaScript puro (sem framework e sem build)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) 2.3.8 (arquivo local em `assets/vendor/`)
- Google Apps Script (API) e Google Sheets (banco de dados)

---

## Estrutura de pastas

```
/
├── index.html                  # redireciona para html/login.html
├── apps-script/Codigo.gs       # cópia versionada do back-end (colar no Apps Script)
├── assets/
│   └── vendor/html5-qrcode-2.3.8.min.js
├── css/    global.css, login.css, qrcode.css, registro.css, historico.css
├── html/   login.html, qrcode.html, registro.html, historico.html
└── js/     config.js, api.js, auth.js, gps.js, qrcode.js, registro.js, historico.js
```

Ordem dos scripts nas páginas: `config.js` → `api.js` → `auth.js` → (`gps.js`) → script da página.

---

## Configuração

1. **Back-end**: cole `apps-script/Codigo.gs` no Apps Script da planilha geral, configure as Propriedades do script (`QR_TEXTO`, `LOCAL_LAT`, `LOCAL_LNG`, `RAIO_METROS`, `SAL`, `COORDENADOR_EMAIL`) e publique como Web App (executar como "Eu", acesso "Qualquer pessoa"). A cada mudança no script, publique uma **nova versão da implantação**.
2. **Front-end**: em `js/config.js`, ajuste `API_URL` (URL do Web App) e `LOCAL_NOME`.
3. **QR Code**: gere o QR com o texto definido em `QR_TEXTO`. **Não versione** o QR definitivo.
4. **Hospedagem**: use HTTPS (GitHub Pages, Cloudflare Pages ou Netlify). Câmera e GPS só funcionam em HTTPS (ou em `localhost`).

> Testes locais: o Live Server em `http://127.0.0.1:5500` funciona no computador. No celular, o endereço `http://192.168.x.x` **não libera a câmera**; teste pela página publicada em HTTPS.

---

## Equipe

Projeto desenvolvido por alunos do curso de Sistemas de Informação — UniBH.

- Daniel Fernandes Peres da Rocha
- Gustavo Ferreira França de Abreu
- Gustavo Teixeira Rocha Araújo
- João Vitor Fonseca Matos
