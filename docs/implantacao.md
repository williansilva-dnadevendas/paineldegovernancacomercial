# Implantação — Onda 1 (passo a passo)

Tempo estimado: 30 a 40 minutos. Nenhuma etapa exige programar. Onde diz **[você]**, é uma ação sua no navegador; onde diz **[pronto]**, já está feito neste pacote.

## 1. Banco de dados (Supabase)

1. **[você]** Entre em https://supabase.com/dashboard e abra o projeto `xbcptkkaptwldluisbgo`.
2. **[você]** Menu lateral → **SQL Editor** → **New query**. Abra o arquivo `db/schema.sql`, copie todo o conteúdo, cole e clique **Run**. Deve terminar com "Success. No rows returned". Pode ser executado de novo sem problema.
3. **[você]** Nova query: cole o conteúdo do arquivo **`seed_it-one.sql`** (enviado separadamente — contém os dados da IT-One e não está no repositório) e clique **Run**. A última linha do arquivo mostra o resumo do que foi carregado.
4. **[você]** Menu **Authentication → Users → Add user → Create new user**: e-mail e senha de cada pessoa que vai usar (gerente, diretoria, você). Marque **Auto Confirm User**. Repita para cada e-mail.
5. **[você]** Os e-mails criados no passo 4 precisam estar vinculados ao cliente. O seed já vincula `willianbezerradasilva.br@gmail.com`. Para os demais, no SQL Editor:
   ```sql
   insert into public.app_users (email, client_id, name)
   select 'gerente@it-one.com.br', id, 'Nome do Gerente' from public.clients where slug = 'it-one'
   on conflict (email) do update set client_id = excluded.client_id, name = excluded.name;
   ```
   (troque o e-mail e o nome; repita para cada pessoa).
5b. **[você]** Acesso pelo link (sem usuário e senha): crie o usuário `acesso-it-one@dnadevendas.com.br` em **Authentication → Users → Add user** com uma senha longa e aleatória (essa senha é a chave do link) e **Auto Confirm**. Vincule ao cliente com o mesmo `insert into public.app_users …` do passo 5. O link de acesso fica: `https://williansilva-dnadevendas.github.io/paineldegovernancacomercial/#k=CHAVE`.
6. **[você]** Menu **Authentication → Sign In / Providers → Email**: deixe **Enable email provider** ligado e **desligue "Allow new users to sign up"** — assim ninguém cria conta sozinho; só os e-mails cadastrados por você entram.

## 2. Código (GitHub)

7. **[você]** Repositório: `williansilva-dnadevendas/paineldegovernancacomercial`. Confirme que ele está **público** (Settings → General → Danger Zone → Change visibility): o GitHub Pages gratuito exige repositório público; nenhum dado de cliente está no código.
8. **[você]** Envie todos os arquivos deste pacote para o repositório. Pelo site: **Add file → Upload files** → arraste o *conteúdo* da pasta `gc` (não a pasta em si) → **Commit changes**. Se o repositório já tiver arquivos da versão antiga (`server.mjs`, `public/`, `dist/`, `.openai/`), apague-os antes ou depois — não são mais usados. Confirme que a pasta `.github/workflows/` foi incluída (pastas iniciadas por ponto às vezes ficam ocultas no Explorer/Finder; o GitHub Desktop envia tudo).
9. **[você]** No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
10. **[você]** **Settings → Secrets and variables → Actions → New repository secret**: nome `SUPABASE_SERVICE_ROLE_KEY`, valor = a chave **secreta** do Supabase (Project Settings → API Keys → aba *Secret keys* → criar/copiar uma `sb_secret_...`; se o projeto mostrar apenas as chaves legadas, use a `service_role`). Ela só é usada pelo backup semanal e nunca aparece no site.
11. **[você]** Aba **Actions** → "Publicar site (GitHub Pages)" → **Run workflow**. Em 1 a 2 minutos a URL aparece em **Settings → Pages** (`https://williansilva-dnadevendas.github.io/paineldegovernancacomercial/`).

## 3. Validação

12. **[você]** Abra a URL, entre com seu e-mail e senha. O Dashboard deve mostrar os dados da IT-One (4 executivos, agosto/2026 como referência se você selecionar).
13. **[você]** Aba **Actions** → "Manter banco ativo" → **Run workflow** → deve terminar verde com `Resposta: "ok ..."`.
14. **[você]** Aba **Actions** → "Backup semanal do banco" → **Run workflow** → verde. No Supabase, **Storage → backups** deve ter uma pasta com a data e 12 arquivos CSV.

## 4. O que está automatizado a partir daqui

| Rotina | Quando | O que faz |
|---|---|---|
| Publicação | a cada alteração enviada ao repositório | roda os testes e publica o site |
| Keep-alive | todo dia, 06:17 (Brasília) | uma consulta leve ao banco — evita a pausa por inatividade do plano gratuito |
| Backup | toda segunda, 06:30 (Brasília) | exporta as 12 tabelas em CSV para o bucket privado `backups` |

## Novos clientes (quando chegar a hora)

Gerar o seed a partir de um `state.json` do cliente e executá-lo no SQL Editor — o mesmo site atende vários clientes, cada um vendo só os próprios dados:

```bash
node scripts/gerar-seed.mjs state-cliente.json slug-do-cliente "Nome do Cliente" email1@x.com,email2@x.com > seed_cliente.sql
```
