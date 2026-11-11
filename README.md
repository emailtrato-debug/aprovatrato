# Portal de aprovação de conteúdo · Trato

Cada cliente abre um link só dele, vê os posts do mês, aprova ou pede ajuste, e tudo aparece no ClickUp.
Feito com Next.js, TypeScript e Tailwind, publicado na Cloudflare (código no GitHub). O token do ClickUp fica só no servidor.

## Como o portal lê o ClickUp

Cada post é uma task, dentro de `TRATO › Social Media › [lista do cliente]`.

| O que o cliente vê | De onde vem |
|---|---|
| Entra no portal | Status **EM APROVAÇÃO (CLIENTE)** (selo "Aguardando"), **APROVADO** ("Aprovado"), **AJUSTE** ("Em ajuste") |
| Aparece só no feed, com selo "No ar" | **PUBLICADO** e **FINALIZADO** (até 9, os mais recentes) |
| Invisível | STAND-BY, GRAVAR, CRIAR COPY, EDITAR VÍDEO, CRIAR LAYOUT |
| Mês do post | Campo **Data de publicação**. Task sem esse campo **não aparece** |
| Título | Nome da task, sem o prefixo de formato |
| Formato | Início do título (`Carrossel \|`, `Estático \|`, `Reels \|`, `Story \|`...) ou uma tag com esse nome |
| Editoria | Tag (menos `instagram`, `facebook` etc.) ou a 2ª parte de um título `Formato \| Editoria \| Título` |
| Legenda | Tudo que vem depois de `LEGENDA:` na descrição |
| Arte | Imagens ou vídeo do **último comentário que tem `#arte` escrito (em qualquer lugar)** (na ordem em que foram anexados) |
| Conversa | Comentários que têm `#cliente` escrito (viram "Equipe Trato") e os comentários feitos pelo portal |

## Fluxo da equipe e quando o cliente enxerga um post

1. A social cria a task e coloca o designer como responsável.
2. O designer devolve com status **EM APROVAÇÃO (CLIENTE)** e o link do Dropbox, e deixa a social como responsável. **Neste momento o cliente NÃO vê nada**: o portal só mostra um post que tem comentário com `#arte`.
3. A social faz a aprovação interna. Se aprovado, baixa o layout e comenta na task com `#arte` e as imagens (ou o vídeo) anexadas, na ordem dos slides. Só então o post aparece para o cliente.
4. O cliente aprova (status vira APROVADO) ou pede ajuste. No ajuste o status vira AJUSTE, o comentário entra na task, e **a task volta para o designer**: ele vira o responsável no lugar da social, e os dois são marcados (@). O designer é quem, entre as pessoas de `src/lib/equipe.ts`, comentou por último na task (o comentário com o link do Dropbox). Se ninguém dessa lista comentou, o portal só marca os responsáveis atuais e registra no log "designer não identificado".
5. Depois do ajuste, o designer devolve em EM APROVAÇÃO (CLIENTE) com o link. **O cliente continua vendo "Em ajuste"** até a social subir um novo comentário `#arte` (a arte antiga é anterior ao pedido de ajuste, então não pode ser aprovada).

Regras que valem sempre:
- Sem `#arte` o post é invisível, em qualquer status. Uma reprovação interna antes do `#arte` nunca aparece para o cliente.
- Também precisam estar preenchidos: **Data de publicação** e `LEGENDA:` na descrição.
- **Ordem dos slides do carrossel:** vem do número no fim do nome do arquivo (`Melhorias-1.png`, `Melhorias-2.png`, `slide (3).png`, `03_final.png`). Se algum arquivo não tiver número, ou os números se repetirem, o portal mantém a ordem em que o ClickUp entregou, sem tentar adivinhar.
- **Reels:** comente com `#reel` e anexe o vídeo e a imagem da capa no mesmo comentário (também vale `#arte` com vídeo). O `#reel` já marca o post como Reels. O vídeo aparece no player, com a capa como imagem de abertura e como miniatura na grade (com um ▶). Sem capa, a grade mostra o primeiro quadro do vídeo. 
- O comentário `#arte` só vale se tiver imagem ou vídeo anexado.
- Postar outro `#arte` substitui a arte anterior.
- Designer novo ou que saiu da equipe: edite `src/lib/equipe.ts` (nome e id do ClickUp) e publique de novo.
- Para escrever ao cliente pela conversa do post, comente com `#cliente`.

O que o cliente faz no portal e o que acontece no ClickUp:
- **Aprovar**: status vai para APROVADO.
- **Pedir ajuste**: o cliente marca Arte, Legenda e/ou Data e escreve o comentário (obrigatório). O comentário entra na task como `Comentário do cliente via portal · Ajuste em: Arte, Legenda` seguido do texto, e o status vai para AJUSTE.
- **Comentar**: entra na task como `Comentário do cliente via portal`, sem mudar o status.
- **Aprovar os X pendentes**: aprova, depois de confirmação, tudo que está em EM APROVAÇÃO (CLIENTE) naquele mês.

Antes de mudar qualquer status, o servidor confere se o nome existe na lista. Se não existir, o cliente vê uma mensagem amigável e o erro vai para o log.

## Rodar no seu computador

Precisa do Node 20.9 ou mais novo. Neste Mac ele está em `~/.local/node/bin`.

```bash
cd ~/Documents/portal-aprovacao-trato
export PATH=$HOME/.local/node/bin:$PATH   # só se o comando node não for encontrado
npm install
cp .env.example .env.local                # depois preencha o token (próxima seção)
npm run dev
```

Abra `http://localhost:3000/c/trato-fe56yh` (link da Trato) ou `http://localhost:3000/demo?n=14` (dados de mentira, para ver o layout com 3, 5 ou 14 posts).

## Configurar o token do ClickUp

1. ClickUp › seu avatar › Configurações › Apps › **Criar token**. Dê o nome "Portal de aprovação".
2. A conta do token precisa enxergar a pasta Social Media com permissão para editar.
3. Coloque no `.env.local`, na linha `CLICKUP_API_TOKEN=` (sem aspas, sem espaço). **Nunca** envie por e-mail, WhatsApp ou chat.
4. Se o token vazar, apague-o no ClickUp (isso desliga o portal) e crie outro.

## Cadastrar, conferir e remover clientes

Os clientes ficam em `src/lib/clients.ts`. Use os comandos (eles leem o `.env.local`):

```bash
npm run clientes                                   # lista, confere cada lista no ClickUp e mostra os links
npm run clientes -- novo "Nome" 901327000000 logo.png   # cadastra (id da lista está na URL do ClickUp)
npm run clientes -- remover nome-ou-slug           # remove
```

- A logo vai em `public/logos/` (quadrada, de preferência 480x480). Ela aparece dentro de um círculo.
- O link é `https://aprovetrato.netlify.app/c/<nome>-<6 caracteres aleatórios>`. Para trocar o link de um cliente (se vazar), remova e cadastre de novo.
- Depois de cadastrar ou remover, faça um novo deploy.

## Conferir antes de liberar

```bash
npm run build && npm start -- -p 3100
node --env-file=.env.local scripts/etapa4-isolamento.mjs http://localhost:3100
```

O teste confere que cada cliente só enxerga a própria lista, que links inválidos dão "não encontrado", que o token não aparece no HTML e que um link não consegue aprovar, ajustar ou comentar post de outro cliente. Ele usa a task de teste da lista da Trato (`TASK_DE_TESTE`) e demora uns 3 minutos, de propósito: o ClickUp aceita cerca de 100 chamadas por minuto.

## Deploy na Netlify (plano gratuito)

O portal está publicado em **https://aprovetrato.netlify.app** (projeto `aprovetrato`, equipe "Trato Design"). Escolhemos a Netlify porque o plano gratuito da Vercel não permite uso comercial.

**Publicar uma nova versão** (depois de qualquer mudança, inclusive cadastrar ou remover cliente):

```bash
cd ~/Documents/portal-aprovacao-trato
export PATH=$HOME/.local/node/bin:$PATH
npx netlify-cli deploy --build --prod --context production
```

Na primeira vez em outro computador: `npx netlify-cli login` e `npx netlify-cli link` (escolha `aprovetrato`).

**Variáveis de ambiente** (Netlify › projeto › Project configuration › Environment variables, ou pelo terminal):
- `CLICKUP_API_TOKEN` (obrigatória, já cadastrada como segredo)
- `CLICKUP_WEBHOOK_SECRET` (passo do webhook, abaixo)
- `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (opcional, log em banco)
- Não defina `HABILITAR_DEMO`.

Para cadastrar um valor sem digitá-lo na tela:
```bash
npx netlify-cli env:set NOME "valor" --secret --context production deploy-preview branch-deploy
```
Depois de mudar variáveis é preciso publicar de novo.

**Visibilidade:** o projeto precisa estar **Public** (Project configuration › General › Visitor access). Se estiver Private, ninguém abre os links dos clientes.

**Log das ações:** cada ação aparece nos logs de função da Netlify (projeto › Logs › Functions), com data, hora, cliente, post, ação e tipo de ajuste. Para guardar também num banco gratuito, crie um Redis em upstash.com, cadastre as duas variáveis do Upstash e publique de novo: cada ação vira uma linha na lista `portal:acoes`.

**Webhook (atualização na hora):** com o portal no ar, rode
`npm run webhook -- criar https://aprovetrato.com.br` (ou o endereço da Netlify).
O segredo vai para `.env.production.local`; cadastre-o como `CLICKUP_WEBHOOK_SECRET` na Netlify e publique de novo. `npm run webhook -- listar` mostra se o ClickUp está entregando. Sem webhook o portal continua certo, mas uma mudança feita direto no ClickUp leva até 90 segundos para aparecer.

**Endereço:** por enquanto os links usam `https://aprovetrato.netlify.app/c/<slug>` (sem custo e sem configurar DNS). Para trocar por um endereço próprio, por exemplo `aprovacao.trato.com.br`: Netlify › projeto › Domain management › Add a domain; no DNS do `trato.com.br` crie um `CNAME` de `aprovacao` para `aprovetrato.netlify.app`; depois recrie o webhook (`npm run webhook -- apagar <id>` e `criar` com o endereço novo) e atualize `PORTAL_URL`. O HTTPS é automático e gratuito.

## Instalar como aplicativo (iPhone e Android)

No celular aparece uma faixa "Instalar" no topo da página de cada cliente. O ícone que fica na tela inicial é a logo do cliente e abre direto a página dele.
- **Android (Chrome):** o botão abre o aviso de instalação do próprio Chrome. Se não abrir, a faixa mostra o passo a passo (menu ⋮ › Instalar app).
- **iPhone (Safari):** a Apple não permite botão automático. A faixa mostra o caminho: Compartilhar › Adicionar à Tela de Início. Dentro do Instagram ou do WhatsApp isso não funciona, e a faixa orienta abrir o link no Safari.
- Quem já abriu pelo ícone não vê a faixa. Quem toca no ✕ só volta a ver depois de 7 dias.
- Ao cadastrar um cliente novo, rode `npm run icones` (gera os ícones de 180, 192 e 512 px a partir da logo) antes de publicar.

## Como o portal fica atualizado

- Lista de posts: cache de 30 s. Comentários (arte e conversa): 90 s; posts já publicados: 30 min.
- Toda ação do cliente limpa o cache na hora e a tela atualiza sem recarregar.
- Com o webhook ligado, qualquer mudança no ClickUp limpa o cache em segundos.
- O ClickUp aceita cerca de 100 chamadas por minuto por token. Os caches existem por causa disso.

## Página da equipe (/admin)

`https://aprovetrato.netlify.app/admin` pede uma senha e lista o portal de cada cliente, com botões para abrir e copiar o link. Não há link para ela em nenhuma outra página. A senha fica na variável `ADMIN_SENHA` da Netlify (e `ADMIN_CHAVE` assina a sessão, que dura 7 dias neste navegador). Para trocar a senha: `npx netlify-cli env:set ADMIN_SENHA "nova-senha" --secret --context production deploy-preview branch-deploy` e publicar de novo. Se alguma das duas variáveis faltar, a página não deixa ninguém entrar.

## Segurança

- O token fica só em variável de ambiente, no servidor. Nada dele vai para o navegador.
- O link do cliente é a única chave: nome + 6 caracteres aleatórios. A página tem `noindex`.
- Toda ação confere, no servidor, o link, a lista da task e o status atual. Um link nunca mexe em post de outro cliente.
- O webhook só aceita chamadas com assinatura válida.
- Textos do cliente são limitados a 2.000 caracteres. Cada link aceita 60 ações por minuto.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| "Não conseguimos carregar seus posts" | Veja os logs de função da Netlify. Costuma ser token inválido ou limite do ClickUp. Rode `npm run clientes` para testar o token. |
| Post não aparece | Confira status (EM APROVAÇÃO, APROVADO, AJUSTE...), **Data de publicação** preenchida e o mês certo na barra do topo |
| Post sem arte | Falta comentário começando com `#arte` com as imagens anexadas |
| "Não encontramos o passo APROVADO..." | A lista do cliente não tem esse status. Crie no ClickUp com o nome exato |
| Mudança no ClickUp demora a aparecer | Ligue o webhook (seção Deploy) ou espere até 90 s |

## Pastas

```
src/app/c/[slug]/      página do cliente e ações (aprovar, ajustar, comentar)
src/app/api/           webhook do ClickUp
src/components/        telas (feed, calendário, detalhe, gaveta de ajuste)
src/lib/               clientes, leitura do ClickUp, regras dos posts, log
scripts/               comandos (clientes, webhook, fontes, testes)
public/logos/          logos dos clientes
src/fonts/             RF Dewi em woff2
```


## Deploy na Cloudflare (substitui a Netlify)

O código fica no GitHub e a Cloudflare publica a cada push na branch `main`, usando o adaptador OpenNext (`open-next.config.ts` + `wrangler.jsonc`).

1. Criar os dois KV (cache): `npx wrangler kv namespace create NEXT_INC_CACHE_KV` e `npx wrangler kv namespace create NEXT_TAG_CACHE_KV`; cole os ids em `wrangler.jsonc`.
2. Cloudflare › Workers & Pages › Create › Import a repository (GitHub). Build command: `npx opennextjs-cloudflare build`; deploy command: `npx opennextjs-cloudflare deploy`.
3. Variáveis (Settings › Variables and Secrets, como Secret): `CLICKUP_API_TOKEN`, `ADMIN_CHAVE`, `ADMIN_SENHA`, `CLICKUP_WEBHOOK_SECRET` (e as do Upstash, se usar).
4. Depois de ter o endereço novo, recrie o webhook: `npm run webhook -- criar <url>` e defina `PORTAL_URL`.

Teste local do build da Cloudflare: `npm run preview`.
