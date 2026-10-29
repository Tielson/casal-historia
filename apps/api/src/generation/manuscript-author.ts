import {
  BOOK_PAGE_COUNT,
  DIALOGUE_LINE_MAX_WORDS,
  DIALOGUE_MAX_LINES,
  PAGE_WORDS,
  STORY_DIRECTION_KEY,
  STORY_QUESTIONS,
  STORY_WORD_MAX,
  STORY_WORD_MIN,
  STYLES,
  manuscriptSchema,
  questionLabel,
  storyBibleSchema,
  type Manuscript,
  type StoryBible,
} from '@entre-nos/shared';
import { textFits } from '../production/pdf-layout';
import { assessManuscript, assessStory } from './book-quality';
import { type AuthorInput } from './local-author';

/** One call to the text model: system prompt and user message in, raw text out. */
export type Complete = (system: string, user: string) => Promise<string>;

const MODES = `Modos:
- real: só fatos informados. Sem casamento, filhos, viagem ou lugar que não estejam nas respostas. Pode dar corpo ao que foi contado com sentidos, gestos e falas plausíveis daquela cena.
- inspired: pode criar diálogo, gesto, lugar, situação e atmosfera em volta das lembranças. Diga no texto que a história é inspirada neles. Não invente fato biográfico novo.
- adventure: história fictícia declarada, protagonizada pelo casal, com perigo, humor e romance. Sem conteúdo sexual. O mundo escolhido em "aventura" é o gênero da trama. O que cada um tem de melhor vira o papel e a habilidade dele na aventura, e é isso que salva o outro em algum momento.
- As respostas chegam com a pergunta que o casal respondeu. Use a pergunta para entender o que cada resposta é.
- Se houver "detalhe", é algo só do casal (apelido, música, mania). Ele precisa ganhar significado numa cena, não só ser citado.
- Se vier "rumo", é o casal dizendo como quer que a história se desenvolva. Ele manda no enredo: siga a ordem dos acontecimentos, os momentos e o final que ele pede, e trate o que ele conta como fato informado em qualquer modo. Transforme o rumo em cenas; não cole o texto dele.`;

export const STORY_SYSTEM = `Você é a autora de um livro ilustrado de casal em português do Brasil.
Nesta etapa você escreve a história inteira, como um conto. Ela será dividida em páginas ilustradas depois, por outra etapa.
Trabalhe nesta ordem, em silêncio: interprete as respostas e o rumo, escolha um único fio narrativo, escreva o conto, revise repetição, clichê e tom.
Devolva apenas JSON válido, sem markdown, neste formato:
{
  "storyMode": "real" | "inspired" | "adventure",
  "title": "título próprio da capa, até 6 palavras",
  "thread": "o fio, em uma ou duas frases",
  "interpretation": {
    "characters": ["nome", "nome"],
    "facts": ["fatos realmente informados"],
    "traits": ["traços"],
    "expandable": ["o que o modo permite criar"]
  },
  "story": "o conto completo, em parágrafos separados por \\n\\n",
  "cast": [{"name": "nome", "look": "traços físicos estáveis para a ilustração: cabelo, pele, olhos, porte, marcas, jeito de vestir"}],
  "phases": [{"id": "curto-sem-espaco", "label": "ex.: adolescência", "age": "ex.: 15 a 16 anos", "looks": {"nome": "como essa pessoa estava nessa fase"}}]
}
Regras do conto:
- Entre ${STORY_WORD_MIN} e ${STORY_WORD_MAX} palavras, em 8 a 12 parágrafos.
- É uma história de acontecimentos: cada parágrafo faz algo acontecer (alguém chega, conversa, espera, envia, reconhece, decide). Um parágrafo que só reflete não existe.
- Cada parágrafo muda alguma coisa em relação ao anterior: lugar, momento, quem sabe o quê, o que um sente pelo outro.
- No máximo uma reflexão sobre o tempo no conto inteiro. Nada de "o tempo guardou", "o destino", "no tempo certo" repetidos.
- Narre em terceira pessoa, no passado, com uma narradora próxima e afetuosa que chama o casal pelos nomes.
- Ancore as cenas em sentidos (som, cheiro, luz, temperatura, toque) e mostre o sentimento no gesto, não em adjetivos. Falas curtas entre travessões quando ajudarem.
- Prefira o específico ao bonito. Evite "algo especial", "de alguma forma", "mágico", "conexão única", "como se o universo".
- Se a história atravessa fases da vida (ex.: se conheceram adolescentes e se reencontraram adultos), registre cada fase em "phases", com a idade aproximada e a aparência de cada um naquela época. Cenas na adolescência são saudáveis e sem contato romântico.
- Se eles se falam à distância (mensagens, redes, ligação), conte isso como distância: cada um no seu lugar.
- Os nomes em "cast" e nas chaves de "looks" são exatamente os nomes do casal.

${MODES}`;

export const STORYBOARD_SYSTEM = `Você é a diretora de um livro ilustrado de casal em português do Brasil.
Você recebe o conto completo, o elenco e as fases da vida. Divida o conto em exatamente ${BOOK_PAGE_COUNT} páginas, cada uma uma cena ilustrada em página inteira, em retrato 3:4.
A ilustração ocupa a página até as bordas. O texto é aplicado depois pela diagramação sobre uma área calma da própria cena (céu, parede, mesa, luz), que você escolhe em "textZone".
Devolva apenas JSON válido, sem markdown, neste formato:
{
  "pages": [
    {
      "index": 1,
      "role": "cover" | "story" | "closing",
      "layout": "scene" | "dialogue" | "impact",
      "text": "texto da página, sem título",
      "dialogue": ["— fala curta", "— resposta"],
      "beat": {
        "event": "o que acontece nesta página",
        "change": "o que mudou em relação à página anterior",
        "next": "por que a próxima página vem depois desta",
        "imageOnly": "o que a imagem mostra que o texto não precisa dizer"
      },
      "visual": {
        "phase": "id de uma fase de phases",
        "staging": "together" | "apart" | "solo_a" | "solo_b" | "detail",
        "wardrobe": "roupa e acessórios de cada um nesta cena",
        "location": "lugar concreto",
        "time": "hora e luz",
        "action": "o que cada um está fazendo, com corpo e posição",
        "expression": "expressão no rosto",
        "shot": "wide" | "medium" | "close" | "detail",
        "textZone": "top" | "bottom" | "left" | "right",
        "linkToNext": "elemento visual que liga esta cena à próxima"
      }
    }
  ]
}
Estrutura:
- Página 1 é a capa (role "cover"): "text" traz os nomes e a ocasião, até ${PAGE_WORDS.cover.max} palavras, sem repetir o título. A imagem apresenta o casal no mundo do livro.
- Páginas 2 a ${BOOK_PAGE_COUNT - 1} contam o conto em ordem (role "story").
- Página ${BOOK_PAGE_COUNT} encerra (role "closing"): retoma uma imagem do começo, transformada, e traz a dedicatória se houver. Entre ${PAGE_WORDS.closing.min} e ${PAGE_WORDS.closing.max} palavras.
Regras de cada página:
- Cada página é um acontecimento ou enquadramento novo que faz a história avançar. Duas páginas seguidas nunca mostram a mesma cena. "beat" responde às quatro perguntas de verdade.
- Sem título. A primeira frase apresenta a cena.
- layout "scene": ${PAGE_WORDS.scene.min} a ${PAGE_WORDS.scene.max} palavras. É o formato principal.
- layout "dialogue": ${PAGE_WORDS.dialogue.min} a ${PAGE_WORDS.dialogue.max} palavras de narração mais 1 a ${DIALOGUE_MAX_LINES} falas em "dialogue", cada uma com até ${DIALOGUE_LINE_MAX_WORDS} palavras, começando com travessão. Use em aproximação ou descoberta. Só este layout tem "dialogue".
- layout "impact": uma frase de ${PAGE_WORDS.impact.min} a ${PAGE_WORDS.impact.max} palavras, numa virada importante.
- Use pelo menos uma página "impact" e uma "dialogue".
- Corte reflexões repetidas: o texto mostra ação, sensação e fala. No máximo uma reflexão sobre o tempo no livro inteiro.
- Não repita frases do conto em duas páginas e não cole as respostas.
Roteiro visual:
- "phase" diz a idade e a aparência dos dois naquela cena. Adolescentes aparecem como adolescentes, sem contato romântico.
- "staging": "together" quando os dois estão no mesmo lugar; "apart" quando cada um está no seu ambiente (ex.: conversa por mensagem); "solo_a" só o primeiro nome do elenco; "solo_b" só o segundo; "detail" um objeto ou gesto em close (celular, mãos, bilhete). Conversa à distância nunca é "together".
- Varie o enquadramento: "wide" para apresentar um lugar, "medium" para conversa, "close" para emoção, "detail" para objeto ou gesto. Use pelo menos três tipos e evite retratos posados: mostre os dois vivendo a cena (chegando, conversando, esperando, reconhecendo).
- Duas páginas seguidas mudam pelo menos duas coisas entre lugar, enquadramento, quem aparece e momento.
- "textZone" é a área sem rostos nem objetos importantes onde o texto entra. Escolha conforme a composição e varie: nunca três páginas seguidas na mesma zona.
- "linkToNext" amarra as cenas: por exemplo, uma página termina com ele olhando um perfil no celular e a seguinte mostra ela recebendo a mensagem.
- A imagem não terá letras: mensagens na tela aparecem como bolhas sem texto legível.`;

export async function writeManuscriptWith(input: AuthorInput, complete: Complete): Promise<Manuscript> {
  const bible = await askUntilApproved({
    complete,
    system: STORY_SYSTEM,
    user: storyPrompt(input),
    parse: (raw) => storyBibleSchema.parse(extractJson(raw)),
    critique: (value) => critiqueStory(value, input),
  });
  return askUntilApproved({
    complete,
    system: STORYBOARD_SYSTEM,
    user: storyboardPrompt(input, bible),
    parse: (raw) => {
      const { pages } = extractJson(raw) as { pages?: unknown };
      return manuscriptSchema.parse({ ...bible, version: 2, pages });
    },
    critique: (value) => critiqueBook(value, input),
  });
}

/** Asks once, and once more with the reasons the first answer was refused. */
async function askUntilApproved<T>(input: {
  complete: Complete;
  system: string;
  user: string;
  parse: (raw: string) => T;
  critique: (value: T) => string[];
}): Promise<T> {
  const attempt = async (user: string) => {
    try {
      const value = input.parse(await input.complete(input.system, user));
      return { value, reasons: input.critique(value) };
    } catch (err) {
      return { value: null, reasons: [err instanceof Error ? err.message : 'JSON inválido.'] };
    }
  };
  const first = await attempt(input.user);
  if (first.value && !first.reasons.length) return first.value;

  const second = await attempt(
    `${input.user}\n\nA versão anterior foi recusada:\n${first.reasons.join('\n')}\n\nReescreva o JSON inteiro, corrigindo só esses problemas, sem colar as respostas.`,
  );
  if (!second.value) throw new Error('A história voltou incompleta e não foi aprovada.');
  if (second.reasons.length) {
    throw new Error(`A história não passou na revisão: ${second.reasons.join(' ')}`);
  }
  return second.value;
}

function critiqueStory(bible: StoryBible, input: AuthorInput): string[] {
  const reasons = [...assessStory({ story: bible.story, thread: bible.thread, answers: input.answers }).reasons];
  const names = [input.nameA, input.nameB].map((name) => name.trim().toLowerCase());
  for (const name of names) {
    if (!bible.cast.some((member) => member.name.trim().toLowerCase() === name)) {
      reasons.push(`Falta ${name} em "cast", com o nome exato.`);
    }
  }
  return reasons;
}

function critiqueBook(manuscript: Manuscript, input: AuthorInput): string[] {
  return [
    ...assessManuscript({
      pages: manuscript.pages,
      answers: input.answers,
      storyMode: input.storyMode,
      thread: manuscript.thread,
      phases: manuscript.phases,
    }).reasons,
    ...manuscript.pages
      .filter((page) => !textFits(page))
      .map((page) => `O texto da página ${page.index} não cabe na zona ${page.visual.textZone}; encurte.`),
  ];
}

function storyPrompt(input: AuthorInput): string {
  const { [STORY_DIRECTION_KEY]: rumo, ...answers } = input.answers;
  const asked = STORY_QUESTIONS[input.storyMode];
  const names = { nameA: input.nameA, nameB: input.nameB };
  const respostas = Object.entries(answers)
    .filter(([, answer]) => answer?.trim())
    .map(([id, answer]) => {
      const question = asked.find((item) => item.id === id);
      return {
        campo: id,
        pergunta: question ? questionLabel(question.label, names) : id,
        resposta: answer.trim(),
      };
    });
  return JSON.stringify(
    {
      storyMode: input.storyMode,
      names: [input.nameA, input.nameB],
      occasion: input.occasion,
      startDate: input.startDate,
      dedication: input.dedication,
      estilo: STYLES.find((style) => style.id === input.styleId)?.name,
      respostas,
      rumo: rumo?.trim() || undefined,
    },
    null,
    2,
  );
}

function storyboardPrompt(input: AuthorInput, bible: StoryBible): string {
  return JSON.stringify(
    {
      storyMode: bible.storyMode,
      title: bible.title,
      thread: bible.thread,
      names: { primeiro: input.nameA, segundo: input.nameB },
      occasion: input.occasion,
      dedication: input.dedication,
      estilo: STYLES.find((style) => style.id === input.styleId)?.name,
      story: bible.story,
      cast: bible.cast,
      phases: bible.phases,
    },
    null,
    2,
  );
}

function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('A resposta não trouxe JSON.');
  return JSON.parse(raw.slice(start, end + 1));
}
