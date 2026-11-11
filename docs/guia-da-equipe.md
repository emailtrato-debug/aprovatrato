# AprovaTrato: guia da equipe

Este guia explica como o portal de aprovação funciona, o que cada pessoa da Trato precisa fazer no ClickUp e o que mudou no processo.

**Endereço do portal:** https://aprovetrato.netlify.app

**Página da equipe (com senha):** https://aprovetrato.netlify.app/admin

## 1. O fluxo, passo a passo

| # | Quem | O que faz | Status no ClickUp | O cliente vê? |
|---|---|---|---|---|
| 1 | Social | Cria a task na lista do cliente e marca o designer como responsável | CRIAR LAYOUT (ou o que já usamos) | Não |
| 2 | Designer | Faz o layout, comenta com o link do Dropbox e devolve a task para a social | **EM APROVAÇÃO (CLIENTE)** | **Não** (ainda não tem `#arte`) |
| 3 | Social | Faz a aprovação interna. Se estiver ruim, devolve ao designer | AJUSTE ou CRIAR LAYOUT | Não |
| 4 | Social | Estando aprovado internamente, baixa o layout e sobe na task, num comentário com **`#arte`** | EM APROVAÇÃO (CLIENTE) | **Sim**, como "Aguardando" |
| 5 | Cliente | Aprova ou pede ajuste no portal | APROVADO ou AJUSTE | Sim |
| 6a | Social | Se aprovado: agenda e publica | APROVADO, depois PUBLICADO | Aparece como "Aprovado", depois "No ar" |
| 6b | Designer | Se pediu ajuste: a task volta sozinha para ele (veja a seção 5) | AJUSTE | O cliente vê "Em ajuste" |
| 7 | Designer | Ajusta e devolve à social com o novo link do Dropbox | EM APROVAÇÃO (CLIENTE) | Continua "Em ajuste" até a social subir a arte nova |
| 8 | Social | Aprova internamente e sobe um **novo comentário `#arte`** | EM APROVAÇÃO (CLIENTE) | Volta para "Aguardando" |

**A regra mais importante:** o status EM APROVAÇÃO (CLIENTE) sozinho **não** mostra nada ao cliente. O post só aparece quando existe um comentário com `#arte` e a imagem anexada. Foi isso que separou a aprovação interna da aprovação do cliente.

## 2. O que toda task precisa ter (checklist da social)

Antes de subir a arte, confira:

1. **Está na lista do cliente**, dentro da pasta Social Media.
2. **Data de publicação** preenchida (campo da task). É ela que define em qual mês o post aparece e a data que o cliente vê. A data de vencimento da task continua sendo o prazo interno e **não** aparece no portal.
3. **Nome da task** no formato `Formato | Título`. Exemplos: `Carrossel | Melhorias AABB`, `Estático | Última semana`, `Reels | Antes de comprar`. O portal reconhece Carrossel, Estático, Reels, Story, Vídeo e Motion, e mostra o título sem o prefixo.
   - Se quiser indicar a editoria, use `Formato | Editoria | Título` (por exemplo `Carrossel | Gestão | Distrato`) ou coloque uma tag com o nome da editoria (a tag `instagram` e outras redes são ignoradas).
4. **Legenda na descrição**, depois da palavra `LEGENDA:`. Tudo que vem depois dela, inclusive as hashtags, vira a legenda que o cliente copia.
5. **Comentário com a arte**, conforme o tipo (seção 3).
6. **Status** EM APROVAÇÃO (CLIENTE).

## 3. Como subir a arte

Escreva o marcador no comentário e anexe os arquivos. O marcador pode ficar em qualquer lugar do comentário. O ClickUp coloca o nome do arquivo antes do texto, e isso não atrapalha.

### Estático (uma imagem)
Comentário com `#arte` e a imagem anexada.

### Carrossel
Comentário com `#arte` e **todas as imagens no mesmo comentário**. A ordem dos slides vem do **número no fim do nome do arquivo**:
- `Melhorias-1.png`, `Melhorias-2.png`, `Melhorias-3.png`
- `slide (1).png`, `slide (2).png`
- `01_capa.png`, `02_meio.png`, `03_final.png`

Numere **todos** os arquivos. Se um arquivo ficar sem número, ou dois tiverem o mesmo número, o portal mantém a ordem em que o ClickUp mostrou, sem tentar adivinhar. O slide de menor número é a capa do post na grade.

### Reels
Comentário com **`#reel`**, o **vídeo** e a **imagem da capa**, tudo no mesmo comentário.
- O vídeo toca no portal com a capa na abertura.
- A capa aparece na grade, com um ▶.
- O `#reel` já marca o post como Reels, mesmo que o título não diga.
- Use MP4. Vídeos `.mov` de iPhone ou arquivos muito pesados podem dar problema em alguns celulares.

### Trocar a arte
Postou errado ou o cliente pediu ajuste? Comente de novo com `#arte` (ou `#reel`). **Vale sempre o último comentário.** O comentário só vale se tiver imagem ou vídeo anexado. Esquecer de anexar não publica nada.

### Falar com o cliente pelo portal
Comente na task escrevendo `#cliente`. O texto aparece na "Conversa sobre este post" como "Equipe Trato" (a marcação some do texto). **Comentário sem `#cliente` é interno e o cliente nunca vê.**

## 4. O que o cliente vê, por status

| Status no ClickUp | O que o cliente vê |
|---|---|
| STAND-BY, GRAVAR, CRIAR COPY, EDITAR VÍDEO, CRIAR LAYOUT | Nada |
| EM APROVAÇÃO (CLIENTE) **com `#arte`** | "Aguardando", com os botões Aprovar e Pedir ajuste |
| EM APROVAÇÃO (CLIENTE) **sem `#arte`** | Nada |
| EM APROVAÇÃO (CLIENTE), mas a última arte é **mais antiga** que o último pedido de ajuste dele | "Em ajuste" (a arte velha não pode ser aprovada por engano) |
| AJUSTE (com `#arte` anterior) | "Em ajuste" |
| APROVADO | "Aprovado", sem botões |
| PUBLICADO, FINALIZADO | "No ar", esmaecido, na parte de baixo da grade (até 9, os mais recentes) |
| Qualquer status, **sem Data de publicação** | Nada |
| Qualquer post de **outro mês** | Só aparece quando o cliente troca de mês |

Por isso, se um post "não aparece", quase sempre falta o `#arte`, a data de publicação, ou o status está em outra etapa.

## 5. O que acontece quando o cliente age

**Aprovar**
- O status vai para **APROVADO**.
- No celular ou no computador, a tela muda na hora.

**Aprovar os X pendentes**
- Pede uma confirmação e aprova de uma vez o que está aguardando naquele mês.

**Pedir ajuste**
- O cliente marca **Arte**, **Legenda** e/ou **Data** e escreve o comentário (obrigatório).
- Na task aparece o comentário: `Comentário do cliente via portal · Ajuste em: Arte, Legenda`, seguido do texto dele.
- O status vai para **AJUSTE**.
- **A task volta para o designer sozinha:** o designer vira o responsável e a social sai. Os dois são marcados (@) no comentário, então os dois recebem a notificação.
- O portal descobre quem é o designer pelo **último comentário na task entre os designers cadastrados** (hoje, Higor e Luiz). Por isso, **o designer precisa deixar um comentário** (o link do Dropbox) quando devolve a task. Se ninguém dessa lista comentou, o portal só marca os responsáveis atuais e **não troca o responsável**.

**Comentar**
- O comentário entra na task como `Comentário do cliente via portal`, sem mudar o status.

## 6. O que mudou no jeito de trabalhar

| Antes | Agora |
|---|---|
| EM APROVAÇÃO (CLIENTE) significava "pronto para o cliente" | Significa "volta para a social revisar". O cliente só enxerga quando existe `#arte` |
| A arte ia por link do Figma ou do Dropbox | A arte vai **anexada num comentário** com `#arte` (o link do Dropbox continua para o designer entregar à social) |
| Formato e tema ficavam só no título | Formato vem do início do título (`Carrossel \|`, `Reels \|`...). A editoria vem de tag ou do título |
| Data de vencimento servia para tudo | **Data de publicação** (campo) manda no portal. A de vencimento é só prazo interno |
| Aprovação por WhatsApp, e-mail ou PDF | O cliente aprova direto no portal, e o ClickUp se atualiza sozinho |
| A social passava o ajuste ao designer à mão | A task volta sozinha para o designer, com os dois marcados |
| Legenda em qualquer lugar da descrição | Legenda depois de `LEGENDA:` |

**Novas convenções de comentário:** `#arte` (arte final), `#reel` (vídeo e capa), `#cliente` (mensagem para o cliente).

## 7. Quem faz o quê

- **Social (Eduarda, Alexia):** cria a task, define data de publicação e legenda, faz a aprovação interna, sobe `#arte` ou `#reel`, comenta com `#cliente` quando precisa falar com o cliente, e agenda depois do APROVADO.
- **Designer (Higor, Luiz):** faz o layout, comenta com o link do Dropbox, devolve a task para a social e, quando o cliente pede ajuste, refaz e devolve de novo.
- **Chefes (Emilie, João Pedro):** acompanham e podem entrar em qualquer task. Acesso à página `/admin`.

## 8. Página da equipe (/admin)

- Endereço: https://aprovetrato.netlify.app/admin
- Pede a senha da equipe e lista o portal de cada cliente, com **Abrir portal** (para ver como o cliente vê) e **Copiar link** (para enviar).
- **Não coloque esse endereço em nenhuma página e não envie a clientes.** Se a senha vazar, peça a troca.

## 9. Como o cliente instala como aplicativo

No celular, o portal mostra uma faixa **Instalar**.
- **Android (Chrome):** toque em Instalar e confirme.
- **iPhone (Safari):** toque em Compartilhar e depois em Adicionar à Tela de Início. Dentro do Instagram ou do WhatsApp isso não funciona: abra o link no Safari.
- O ícone se chama **AprovaTrato** e usa a logo do cliente.

Dica de mensagem para enviar o link: "Oi! Aqui está o link para você aprovar os posts do mês: [link]. Abra no celular e, se quiser, instale na tela inicial pelo botão Instalar."

## 10. Quanto tempo leva para aparecer

- Mudanças feitas **dentro do portal** (aprovar, ajustar, comentar) aparecem na hora.
- Mudanças feitas **no ClickUp** (subir `#arte`, mudar status) aparecem em alguns segundos, porque o ClickUp avisa o portal automaticamente. Se não aparecer, espere até 1 ou 2 minutos e recarregue.

## 11. Se algo não aparece, confira nesta ordem

1. O status é EM APROVAÇÃO (CLIENTE), APROVADO ou AJUSTE?
2. A **Data de publicação** está preenchida, e o cliente está olhando o mês certo (setas ao lado do mês)?
3. Existe comentário com `#arte` (ou `#reel`) **com imagem ou vídeo anexado**?
4. A task está na lista **do cliente certo**?
5. Se o cliente pediu ajuste e a arte nova já foi subida: o `#arte` novo veio **depois** do pedido de ajuste?
6. A legenda está depois de `LEGENDA:`?

Se mesmo assim não aparecer, avise quem cuida do portal.

## 12. Avisos importantes

- **Os comentários e as mudanças de status feitos pelo portal aparecem no ClickUp com o nome da Emilie**, porque o portal usa o acesso dela. O texto do comentário deixa claro que veio do cliente. Se a Emilie for a responsável de uma task, ela pode não receber a notificação do pedido de ajuste (o ClickUp não avisa a pessoa sobre a própria ação).
- **O token do ClickUp é como uma senha.** Não envie por e-mail, WhatsApp ou chat. Se vazar, apague no ClickUp (isso desliga o portal) e crie outro.
- O endereço atual tem "netlify" no nome. Se quiserem um endereço da Trato, como `aprovacao.trato.com.br`, é só criar um registro no DNS (peça ajuda).
- O plano gratuito da Netlify tem limite mensal de uso e mostra o selo "Powered by Netlify" no canto. Para 9 clientes deve sobrar, mas vale acompanhar.
- **Cliente novo ou designer novo:** peça para cadastrar. O cliente precisa da lista do ClickUp, da logo e de um link novo. O designer precisa do nome e do id do ClickUp.
- O log de cada ação (data, hora, cliente, post, ação, tipo de ajuste) fica nos registros da Netlify. Para guardar num banco gratuito, é preciso criar uma conta no Upstash.
