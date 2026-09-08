# Operação e problemas comuns

## Rotina

- **Acesso pelo link:** o consultor distribui um link com chave (`…/paineldegovernancacomercial/#k=CHAVE`). Quem abre entra direto, sem usuário e senha; o navegador guarda a sessão e nas próximas visitas a URL sem chave já funciona. Sem a chave, aparece a tela de login (e-mail e senha cadastrados no Supabase). Todos têm o mesmo acesso (sem níveis).
- **Trocar a chave (revogar acesso):** Supabase → Authentication → Users → usuário `acesso-it-one@dnadevendas.com.br` → redefinir senha → distribuir o novo link. Quem tinha a sessão antiga continua até o token expirar (até 1 hora) ou até sair.
- **Salvamento:** automático, por entidade, 350 ms após cada alteração. O indicador no topo mostra "Salvando…", "Salvo HH:MM" ou "Falha ao salvar".
- **Desfazer:** reverte a última alteração e grava o valor anterior no banco — funciona mesmo depois de salvo.
- **Mês de referência, ano e executivo selecionados** são preferências de cada navegador (não afetam outros usuários).

## Problemas e solução

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Login diz "E-mail ou senha incorretos" | Usuário não criado em Authentication → Users, ou senha errada | Criar o usuário (Auto Confirm) ou redefinir a senha no painel do Supabase |
| Após o login: "Seu e-mail não está vinculado a nenhum cliente" | Falta a linha em `app_users` | Executar o `insert into public.app_users …` do guia de implantação com esse e-mail |
| "Falha ao salvar" persistente | Banco pausado por inatividade (plano gratuito) ou sem internet | Supabase Dashboard → projeto → **Resume project** (1–2 min). Verificar se o keep-alive está rodando em Actions |
| Site abre mas fica em "Carregando dados…" | Mesmo caso acima, ou schema não executado | Reativar o projeto; conferir se `db/schema.sql` foi executado |
| Backup semanal falhou (Actions vermelho) | Segredo `SUPABASE_SERVICE_ROLE_KEY` ausente ou chave trocada | Recriar o segredo com a chave service_role atual |
| Apaguei algo por engano | — | Desfazer (se ainda na sessão); senão, restaurar a partir do CSV mais recente em Storage → backups (importar pelo Table Editor → Insert → Import data from CSV) |

## Custos e limites (plano gratuito)

500 MB de banco · 5 GB de tráfego/mês · 1 GB de storage · pausa após 7 dias sem atividade (o keep-alive evita).
Quando sair do provisório: Supabase Pro (US$ 25/mês) remove a pausa e adiciona backup diário automático — sem mudança no código.

## Segurança em uma frase

O site é público e a chave do banco no código é pública por desenho; quem não tem login não lê nem grava nada — a regra está no banco (políticas de acesso por cliente), não no site.
