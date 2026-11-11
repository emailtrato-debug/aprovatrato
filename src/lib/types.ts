// Tipos compartilhados entre servidor e telas. Nada aqui deve conter dados internos do ClickUp
// (links, e-mails, ids de usuário): tudo o que está nestes tipos chega ao navegador do cliente.

export type EstadoPost = "aguardando" | "aprovado" | "ajuste" | "no-ar";

export type Midia = {
  tipo: "imagem" | "video";
  url: string;
  /** Versão leve para grades e calendário. Pode ser nula em vídeos sem capa. */
  miniatura: string | null;
  largura?: number;
  altura?: number;
};

export type Mensagem = {
  id: string;
  autor: "equipe" | "cliente";
  nome: string;
  /** ISO 8601 */
  data: string;
  texto: string;
};

export type Post = {
  id: string;
  /** Posição cronológica dentro do mês (01 = primeiro a ir ao ar). Só para posts do mês. */
  numero: number | null;
  titulo: string;
  formato: string | null;
  editoria: string | null;
  estado: EstadoPost;
  /** AAAA-MM-DD, no fuso de São Paulo */
  dataPublicacao: string;
  legenda: string;
  midias: Midia[];
  conversa: Mensagem[];
};

export type DadosMes = {
  posts: Post[];
  noAr: Post[];
};

export type ClienteResumo = {
  nome: string;
  logo: string;
};
