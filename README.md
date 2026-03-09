# Sistema de Pos-venda (WhatsApp)

Sistema web simples para criar e enviar mensagens de pos-venda via WhatsApp, com validacao, edicao da mensagem, historico local e login com API.

## Como executar

1. Abra a pasta do projeto no VS Code.
2. Instale as dependencias:
   ```bash
   npm install
   ```
3. Verifique o arquivo `.env` e troque o valor de `JWT_SECRET` por uma frase longa.
4. Inicie o servidor:
   ```bash
   npm start
   ```
5. Acesse no navegador:
   ```
   http://localhost:3000/login.html
   ```

## Funcionalidades

- Campo nome e telefone com mascara brasileira.
- Mensagem pronta editavel antes do envio.
- Botao para copiar mensagem.
- Envio abre o WhatsApp com a mensagem preenchida.
- Historico recente salvo no `localStorage`.
- Login com API e token JWT.

## Observacoes

- O envio abre o WhatsApp Web ou o app instalado.
- O historico fica salvo no navegador usado.
