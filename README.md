# Plugou Artes — Portal dos Revendedores

Portal Plugou para distribuir designs personalizados automaticamente com o logotipo de cada revendedor.

## Tecnologias
- Next.js 15.5.28 / React 19.1.9
- Supabase Auth, PostgreSQL, Storage privado e Edge Functions
- Deploy Vercel

## Fluxos
- Login restrito, sem cadastro público.
- Revendedor define sua logo em Configurações e baixa imagens PNG com marca aplicada proporcionalmente.
- Administração cadastra artes, define a área para logo, gerencia categorias, usuários e comunicados.
- Presença online aproximada por batimento de atividade (2 min).

## Configuração
1. Use Node.js 22 e execute `npm install` e `npm run dev`.
2. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` na Vercel ou `.env.local` (nunca versionar `.env.local`).
3. Banco de dados exclusivo Supabase: `yohjbsyvnaunqrbdoxsb`, com RLS, tabelas `profiles`, `categories`, `arts`, `popups`, `downloads` e três buckets privados já criados.
4. A função Supabase `plugou-admin-users` (JWT obrigatório) já está implantada, e valida permissão `admin` antes de gerenciar contas.
5. Crie sua conta Auth no Supabase e atribua `role='admin',active=true` à linha da conta em `public.profiles`, por meio do SQL Editor com acesso administrativo.
6. Não inclua segredo de serviço do Supabase neste repositório. A interface usa apenas chave publicável e RLS; operações privilegiadas de usuários rodam na Edge Function.

## Observações
- Este código corresponde à versão web publicada inicialmente na Vercel. O build verificado na Vercel não substitui testes end-to-end com contas e imagens reais.
- Proteja a implantação, configure limites de taxa e o fluxo de troca da senha temporária antes de abrir para revendedores reais.
- O repositório está público; mantenha somente código sem segredos.
- Os termos do plano Hobby da Vercel restringem o uso comercial; antes de usar a plataforma com revendedores, escolha um plano/hospedagem compatível.
