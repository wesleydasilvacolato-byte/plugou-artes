# Implantação e testes — Plugou Artes

## Integrações
- Repositório: `wesleydasilvacolato-byte/plugou-artes` (branch `main`).
- Aplicação Next.js: projeto Vercel `plugou-artes`.
- Supabase: projeto `yohjbsyvnaunqrbdoxsb`.
- Variáveis públicas obrigatórias na Vercel: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Nunca** versionar chaves secretas, senhas, tokens de usuário ou arquivos `.env.local`.

## Primeiro acesso administrativo
1. Acesse o painel de Authentication → Users do projeto Supabase Plugou Artes.
2. Crie o usuário administrativo com e-mail e senha forte, sem compartilhar a senha.
3. Depois da criação, conceda `role = 'admin'` e `active = true` ao seu registro em `public.profiles`, pelo editor SQL autenticado ou pelo serviço de provisionamento autorizado.
4. Faça login no portal e verifique a visão administrativa.

## Verificação antes de disponibilizar aos revendedores
- Testar autenticação e bloqueio de usuário inativo.
- Publicar uma arte de teste e configurar a posição do logotipo.
- Cadastrar revendedor de teste e validar acesso restrito.
- Enviar o logotipo do revendedor e baixar o PNG personalizado.
- Verificar categorias, comunicados e métricas.
- Confirmar proteção de dados, limite de upload e políticas RLS.

## Uso da hospedagem
A implantação atual é um ambiente de testes. Confirme um plano de hospedagem compatível com atividade comercial antes de usar em operação de revenda.

## Deploy contínuo
Commits na branch `main` poderão gerar implantações pela integração GitHub–Vercel configurada no painel. Confirme o status e logs de cada build na Vercel.
