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

## Deploy no Coolify

1. Crie um Application apontando para este repositorio, branch `main`.
2. Build Pack: **Dockerfile** (ou **Docker Compose** se quiser o volume automatico).
3. Porta: `3000`.
4. Variaveis:
   - `JWT_SECRET` = frase longa e secreta
   - `NODE_ENV` = `production`
   - `PORT` = `3000`
   - `DATA_DIR` = `/app/data`
   - `DATABASE_URL` = URL interna do PostgreSQL do Coolify
   - `DATABASE_SSL` = `false` (banco interno do Coolify)
5. Persistent Storage do app (obrigatorio sem PostgreSQL):
   - Add Volume Mount
   - Destination Path: `/app/data`
   Sem isso, cada deploy apaga usuarios e clientes.
6. Healthcheck: caminho `/api/health`, porta `3000`.
7. Deixe pre/post-deployment vazios e faca o deploy.

Para usar banco no Coolify (Application atual):
1. Em Databases, crie um PostgreSQL.
2. Copie a **Internal URL**.
3. Cole em `DATABASE_URL` no app.
4. Redeploy o `pos-venda`.

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
