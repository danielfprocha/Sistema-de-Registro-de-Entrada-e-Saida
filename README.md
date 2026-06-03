Sistema de Registro de Entrada e Saida
Sistema usado para registrar a entrada e saída de funcionários de uma clínica veterinária

# Nome do Projeto

Descrição

## Demonstração

## Funcionalidades

## Tecnologias Utilizadas

## Arquitetura

## Como Executar

## Variáveis de Ambiente

## Estrutura do Projeto

## Testes

## Melhorias Futuras

## Autor


# Sistema de Registro de Entrada e Saída

Sistema web para registro de ponto de funcionários (estagiários, recepcionistas e zeladores) da clínica veterinária do Centro Universitário UniBH, desenvolvido como projeto acadêmico (A3) da própria universidade, por alunos do curso de Sistemas de Informação. Permite que funcionários registrem entrada e saída via leitura de QR Code, além de acessar o próprio histórico de registros. Esses dados ficam registros em planilhas no Google Sheets, que podem ser acessados pelos administrados do sistema.

---

## Funcionalidades

- Login com autenticação via Google Sheets
- Leitura de QR Code para validar presença física na clínica
- Registro de entrada e saída com validação de sequência
- Histórico individual de registros por funcionário

---

## Tecnologias utilizadas

- HTML, CSS e JavaScript puro (sem frameworks)
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) — leitura de QR Code via câmera
- Google Sheets — banco de dados
- Google Apps Script — API back-end (via Web App)

---

## Estrutura de pastas

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

## Como executar

1. Clone o repositório:
   ```bash
   git clone https://github.com/danielfprocha/Sistema-de-Registro-de-Entrada-e-Saida.git
   ```

2. Abra a pasta no VS Code e inicie o **Live Server** clicando em **Go Live** no canto inferior direito.

3. O sistema abre em `http://127.0.0.1:5500` e redireciona automaticamente para o login.

> Para testar a leitura de QR Code, acesse pelo celular usando o IP da sua rede local:
> `http://192.168.x.x:5500/html/qrcode.html`

---

## Configuração da API

A URL do Google Apps Script está definida no arquivo `js/api.js`:

```javascript
const API_URL = "https://script.google.com/macros/s/.../exec";
```

Para configurar em outro ambiente, substitua pela URL gerada ao implantar o Apps Script como Web App.

---

## Fluxo do sistema

O funcionamento do sistema ocorre da seguinte forma:

    1. O usuário chega à clínica e escaneia o QR Code disponível na entrada do local utilizando a câmera de seu celular.
    2. O QR Code redireciona automaticamente o usuário para o site da aplicação de registro de ponto.
    3. Ao acessar o sistema, o usuário realiza o login informando suas credenciais (como nome e senha).
    4. Após o login, o sistema solicita a confirmação da leitura do QR Code para validar que o usuário está fisicamente no local.
    5. Após o registro, o sistema exibe duas opções na tela para o usuário: “Entrada” e “Saída”
    6. Depois de clicar em algum deles, o usuário recebe uma mensagem pedindo a confirmação:
        - Para “Entrada”: aparece um botão “Confirmar Entrada”
        - Para “Saída”: aparece um botão “Confirmar Saída”
    7. Para o sistema confirmar a ação, ele verifica o último registro do usuário
        - Se a ação for “Entrada”, o sistema confirma apenas se o último registro for “Saída”
        - Se a ação for “Saída”, o sistema confirma apenas se o último registro for “Entrada”
        - Caso a ação seja a mesma do último registro, o sistema exibe uma mensagem de “O seu último registro já foi uma ‘Entrada’”, ou “O seu último registro já foi uma ‘Saída’”, e o fluxo principal termina. E então, há duas possibilidades: 
            -> O usuário estava entrando e clicou em “Saída”, ou estava saindo e clicou em “Entrada”, acidentalmente. Nesse caso, deve apenas refazer a operação selecionando a opção correta.
            -> O usuário esqueceu (ou por algum motivo não cadastrou) o último registro, ou seja, está tentando entrar sem ter registrado a última vez que saiu da clínica, ou está tentando sair sem ter registrado sua entrada. Nesse caso, deve pedir ao administrador do sistema que resolva o problema manualmente no Google Sheets.
    8. Somente após a confirmação, o sistema captura automaticamente:
        - Data
        - Horário
    9. Após a confirmação e a captura dos dados, o sistema exibe para o usuário:
        - “Entrada Confirmada” ou “Saída Confirmada”
        - Data e horário da entrada ou saída
    10. Finalizando todo o processo, o usuário pode acessar seu histórico de registros na plataforma.

---

## Equipe

Projeto desenvolvido por alunos do curso de Sistemas de Informação — UniBH.

- Daniel Fernandes Peres da Rocha
- Gustavo Ferreira França de Abreu
- Gustavo Teixeira Rocha Araújo
- 