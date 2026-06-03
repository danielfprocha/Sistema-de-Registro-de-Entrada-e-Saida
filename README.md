# 🐾 Sistema de Registro de Entrada e Saída

Sistema web para registro de ponto de funcionários (estagiários, recepcionistas e zeladores) da clínica veterinária do Centro Universitário UniBH, desenvolvido como projeto acadêmico (A3) da própria universidade, por alunos do curso de Sistemas de Informação. Permite que funcionários registrem entrada e saída via leitura de QR Code, além de acessar o próprio histórico de registros. Esses dados ficam registrados em planilhas no Google Sheets, que podem ser acessados pelos administradores do sistema.

---

## ✅ Funcionalidades

- 🔐 Login com autenticação via Google Sheets
- 📷 Leitura de QR Code para validar presença física na clínica
- 🔄 Registro de entrada e saída com validação de sequência
- 📋 Histórico individual de registros por funcionário

---

## 🛠️ Tecnologias utilizadas

- HTML, CSS e JavaScript puro (sem frameworks)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) — leitura de QR Code via câmera
- Google Sheets — banco de dados
- Google Apps Script — API back-end (via Web App)

---

## 📁 Estrutura de pastas

```
Sistema-de-Registro-de-Entrada-e-Saida/
│
├── index.html               # Redireciona para a tela de login
│
├── html/
│   ├── login.html           # Tela de login
│   ├── qrcode.html          # Leitura do QR Code
│   ├── registro.html        # Confirmação de entrada/saída
│   ├── historico.html       # Histórico do funcionário
│
├── css/
│   ├── global.css           # Variáveis, reset e estilos base
│   ├── login.css
│   ├── qrcode.css
│   ├── registro.css
│   ├── historico.css
│
├── js/
│   ├── api.js               # Comunicação com o Google Apps Script
│   ├── auth.js              # Login, sessão (localStorage) e proteção de páginas
│   ├── qrcode.js            # Integração com html5-qrcode
│   ├── registro.js          # Lógica de entrada/saída
│   ├── historico.js         # Histórico do funcionário
│
└── assets/
    └── qrcode-clinica.png   # QR Code da clínica para impressão
```

---

## ▶️ Como executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/danielfprocha/Sistema-de-Registro-de-Entrada-e-Saida.git
   ```

2. Abra a pasta no VS Code e inicie o **Live Server** clicando em **Go Live** no canto inferior direito.

3. O sistema abre em `http://127.0.0.1:5500` e redireciona automaticamente para o login.

> 📱 Para testar a leitura de QR Code, acesse pelo celular usando o IP da sua rede local:
> `http://192.168.x.x:5500/html/qrcode.html`

---

## ⚙️ Configuração da API

A URL do Google Apps Script está definida no arquivo `js/api.js`:

```javascript
const API_URL = "https://script.google.com/macros/s/AKfycbx2NSi_IjNX-hKF20vYZEcwCTXsjFPr2ZRLgfArhmbTjhSx2RVSCX2wL-vfF7jAmkD5xQ/exec";
```

Para configurar em outro ambiente, substitua pela URL gerada ao implantar o Apps Script como Web App.

---

## 🔄 Fluxo do sistema

O funcionamento do sistema ocorre da seguinte forma:

1. 📍 O usuário chega à clínica e escaneia o QR Code disponível na entrada do local utilizando a câmera de seu celular.
2. 🌐 O QR Code redireciona automaticamente o usuário para o site da aplicação de registro de ponto.
3. 🔐 Ao acessar o sistema, o usuário realiza o login informando suas credenciais (nome e senha).
4. ✅ Após o login, o sistema solicita a confirmação da leitura do QR Code para validar que o usuário está fisicamente no local.
5. 🖥️ Após o registro, o sistema exibe duas opções na tela: **"Entrada"** e **"Saída"**.
6. 💬 Depois de clicar em uma delas, o usuário recebe uma mensagem pedindo confirmação:
   - Para **"Entrada"**: aparece um botão **"Confirmar Entrada"**
   - Para **"Saída"**: aparece um botão **"Confirmar Saída"**
7. 🔍 Para confirmar a ação, o sistema verifica o último registro do usuário:
   - Se a ação for **"Entrada"**, o sistema confirma apenas se o último registro for **"Saída"**
   - Se a ação for **"Saída"**, o sistema confirma apenas se o último registro for **"Entrada"**
   - ⚠️ Caso a ação seja igual ao último registro, o sistema exibe uma mensagem de erro. Nesse caso:
     - O usuário pode ter clicado na opção errada — basta selecionar a opção correta
     - O usuário pode ter esquecido de registrar o ponto anterior — nesse caso, deve solicitar ao administrador que corrija manualmente no Google Sheets
8. 📅 Somente após a confirmação, o sistema captura automaticamente a **data** e o **horário**.
9. 🎉 O sistema exibe para o usuário a confirmação com **"Entrada Confirmada"** ou **"Saída Confirmada"**, junto com a data e horário.
10. 📋 Finalizando o processo, o usuário pode acessar seu **histórico de registros** na plataforma.

---

## 👥 Equipe

Projeto desenvolvido por alunos do curso de Sistemas de Informação — UniBH.

- Daniel Fernandes Peres da Rocha
- Gustavo Ferreira França de Abreu
- Gustavo Teixeira Rocha Araújo
- João Vitor Fonseca Matos