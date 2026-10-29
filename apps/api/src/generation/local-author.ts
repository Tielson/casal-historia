import {
  OCCASIONS,
  PAGE_WORDS,
  STORY_DIRECTION_KEY,
  manuscriptSchema,
  pageRole,
  type BookPage,
  type Manuscript,
  type PageBeat,
  type PageLayout,
  type PageVisual,
  type StoryModeId,
} from '@entre-nos/shared';
import { contentTokens, wordCount } from './book-quality';

export interface AuthorInput {
  nameA: string;
  nameB: string;
  styleId: string;
  filmFinish?: boolean;
  occasion?: string | null;
  startDate?: string | null;
  dedication?: string | null;
  answers: Record<string, string>;
  storyMode: StoryModeId;
  photoAKey?: string | null;
  photoBKey?: string | null;
  photoTogetherKey?: string | null;
}

const WEAK = new Set([
  'conhecemos',
  'aconteceu',
  'ficamos',
  'quando',
  'depois',
  'tinha',
  'foram',
  'ficou',
  'muito',
  'sempre',
  'nunca',
  'gente',
  'sobre',
  'ainda',
  'entre',
  'porque',
  'assim',
  'onde',
  'hoje',
  'ontem',
  'primeiro',
  'primeira',
  'momento',
  'especial',
  'naquele',
  'naquela',
]);

function signalOf(answer: string, fallback: string): string {
  const tokens = contentTokens(answer).filter((token) => !WEAK.has(token));
  const pool = tokens.length ? tokens : contentTokens(answer);
  if (!pool.length) return fallback;
  return [...pool].sort((a, b) => b.length - a.length)[0];
}

function tidy(text: string, min: number, max: number): string {
  let out = text.replace(/\s+/g, ' ').trim();
  const parts = out.split(' ');
  if (parts.length > max) {
    out = parts.slice(0, max).join(' ');
    if (!/[.!?]$/.test(out)) out += '.';
  }
  if (wordCount(out) < min) {
    throw new Error(`Texto local ficou curto (${wordCount(out)} < ${min}): ${out.slice(0, 80)}`);
  }
  return out;
}

function clip(text: string, words: number): string {
  return text.trim().split(/\s+/).slice(0, words).join(' ');
}

function bookTitle(mode: StoryModeId): string {
  if (mode === 'adventure') return 'Uma aventura nossa';
  if (mode === 'real') return 'O que vivemos';
  return 'Entre um oi e outro';
}

function occasionLine(occasion?: string | null): string {
  return OCCASIONS.find((item) => item.id === occasion)?.label ?? 'Um presente para vocês dois';
}

/** Deterministic book used without a text model: mock mode and tests. */
export function composeLocalManuscript(input: AuthorInput): Manuscript {
  const nameA = input.nameA.trim();
  const nameB = input.nameB.trim();
  const { answers } = input;
  const meet = signalOf(answers.como_conheceram ?? answers.aventura ?? '', 'encontro');
  const memory = signalOf(answers.momento_especial ?? answers.talento_a ?? '', 'festa');
  const love = signalOf(answers.o_que_ama ?? answers.talento_b ?? '', 'cuidado');
  const place = input.storyMode === 'adventure' && answers.aventura ? answers.aventura.trim() : memory;
  const youth = /adolesc|escola|colegio|colégio/i.test(answers.como_conheceram ?? '');
  const dedication = input.dedication?.trim();
  const rumo = answers[STORY_DIRECTION_KEY]?.trim().slice(0, 160);
  const detail = answers.detalhe?.trim().slice(0, 100);

  const premise =
    input.storyMode === 'real'
      ? `O fio segue apenas os fatos de ${nameA} e ${nameB}: o primeiro oi, os anos em caminhos separados e o reencontro que pôs os dois de novo na mesma rua.`
      : input.storyMode === 'adventure'
        ? `O fio é uma aventura fictícia de ${nameA} e ${nameB}. As lembranças reais são a semente, e o mundo ao redor é invenção declarada.`
        : `O fio é o tempo entre o primeiro contato e o reencontro. ${nameA} e ${nameB} se cruzam, se perdem de vista e se acham de novo por uma mensagem.`;
  const seeds = Object.entries(answers)
    .filter(([key, value]) => key !== STORY_DIRECTION_KEY && key !== 'detalhe' && value?.trim())
    .map(([, value]) => `“${clip(value, 10)}”`)
    .join(', ');
  const thread = [
    premise,
    detail ? `O detalhe só deles: “${detail}”.` : '',
    seeds ? `Sementes: ${seeds}.` : '',
    rumo ? `O rumo pedido pelo casal: “${rumo}”.` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 600);

  const declaration =
    input.storyMode === 'real'
      ? `Tudo o que segue aconteceu com ${nameA} e ${nameB}`
      : input.storyMode === 'adventure'
        ? `Esta é uma aventura inventada para ${nameA} e ${nameB}`
        : `Esta história é inspirada em ${nameA} e ${nameB}`;

  const then = youth ? 'adolescencia' : 'comeco';
  const phases = [
    {
      id: then,
      label: youth ? 'adolescência' : 'o começo',
      age: youth ? '15 a 17 anos' : 'como eram quando se conheceram',
      looks: {
        [nameA]: youth
          ? `${nameA} adolescente, rosto mais jovem, roupa de escola`
          : `${nameA} alguns anos mais jovem, roupa simples`,
        [nameB]: youth
          ? `${nameB} adolescente, rosto mais jovem, mochila nas costas`
          : `${nameB} alguns anos mais jovem, cabelo mais curto`,
      },
    },
    {
      id: 'hoje',
      label: 'hoje',
      age: 'adultos, como nas fotos',
      looks: {
        [nameA]: `${nameA} como na foto de referência`,
        [nameB]: `${nameB} como na foto de referência`,
      },
    },
  ];

  const plan: {
    layout: PageLayout;
    text: string;
    dialogue?: string[];
    beat: PageBeat;
    visual: PageVisual;
  }[] = [
    {
      layout: 'scene',
      text: `${nameA} e ${nameB}. ${occasionLine(input.occasion)}.`,
      beat: {
        event: 'O casal aparece junto no mundo do livro',
        change: 'Abre o livro e apresenta quem vai viver a história',
        next: 'A história volta ao dia em que eles se cruzaram',
        imageOnly: 'O jeito como os dois se olham',
      },
      visual: {
        phase: 'hoje',
        staging: 'together',
        wardrobe: 'roupas do dia a dia, confortáveis e coloridas',
        location: 'uma rua arborizada de bairro, com luz dourada',
        time: 'fim de tarde',
        action: `${nameA} e ${nameB} caminham juntos e um deles aponta algo adiante`,
        expression: 'sorrisos tranquilos',
        shot: 'medium',
        textZone: 'top',
        linkToNext: 'a mesma luz dourada volta na praça do primeiro encontro',
      },
    },
    {
      layout: 'scene',
      text: `${declaration}, e começa no dia em que os dois se cruzaram pela primeira vez. A semente é “${meet}”. Era fim de tarde, o ar ainda morno, e alguém ria alto do outro lado da praça enquanto ${nameB} ajeitava a mochila no ombro e ${nameA} fingia procurar alguém.`,
      beat: {
        event: `${nameA} vê ${nameB} pela primeira vez na praça`,
        change: 'Volta ao começo, antes de existir qualquer história',
        next: 'Um dos dois cria coragem para falar',
        imageOnly: 'A praça cheia, com os dois ainda distantes um do outro',
      },
      visual: {
        phase: then,
        staging: 'together',
        wardrobe: youth ? 'uniforme escolar, tênis gastos e mochilas' : 'roupas simples daquela época',
        location: 'praça movimentada com bancos, árvores e pipoqueiro',
        time: 'fim de tarde de verão',
        action: `${nameB} ajeita a mochila perto de um banco; ${nameA} está do outro lado, olhando de longe`,
        expression: 'curiosidade tímida',
        shot: 'wide',
        textZone: 'bottom',
        linkToNext: 'o banco da praça, onde a conversa vai acontecer',
      },
    },
    {
      layout: 'dialogue',
      text: `${nameA} parou ao lado do banco, sem saber onde pôr as mãos. ${nameB} levantou os olhos do caderno.`,
      dialogue: ['— Oi.', '— Oi. Você mora aqui perto?'],
      beat: {
        event: `${nameA} puxa a primeira conversa com ${nameB}`,
        change: 'Os dois deixam de ser desconhecidos',
        next: 'A conversa termina cedo demais',
        imageOnly: 'O caderno aberto e o nervosismo nos ombros',
      },
      visual: {
        phase: then,
        staging: 'together',
        wardrobe: youth ? 'uniforme escolar e mochilas' : 'roupas simples daquela época',
        location: 'banco de madeira sob uma árvore da praça',
        time: 'minutos depois, sol baixo',
        action: `${nameA} de pé ao lado do banco; ${nameB} sentado com um caderno no colo, olhando para cima`,
        expression: 'sorrisos sem graça',
        shot: 'medium',
        textZone: 'top',
        linkToNext: 'as duas ruas que saem da praça',
      },
    },
    {
      layout: 'impact',
      text: 'A conversa acabou ali, e cada um seguiu por uma rua diferente.',
      beat: {
        event: 'Os dois se despedem e tomam direções opostas',
        change: 'A chance fica para trás',
        next: 'Os anos passam com cada um em sua vida',
        imageOnly: 'Duas sombras compridas se afastando no chão',
      },
      visual: {
        phase: then,
        staging: 'detail',
        wardrobe: 'tênis e barras de calça vistos de perto',
        location: 'calçada de pedra na esquina onde as ruas se separam',
        time: 'pôr do sol',
        action: 'dois pares de pés caminham em direções opostas, sombras longas no chão',
        expression: 'sem rostos, só o movimento',
        shot: 'detail',
        textZone: 'left',
        linkToNext: 'as janelas acesas de duas cidades diferentes',
      },
    },
    {
      layout: 'scene',
      text: `Vieram outros endereços, outros ônibus lotados, outras músicas no fone. ${nameA} mudou de emprego duas vezes e aprendeu a cozinhar. ${nameB} trocou o corte de cabelo e a cidade. Às vezes um nome parecido numa conversa trazia de volta um rosto, e o pensamento passava rápido como vento em varal.`,
      beat: {
        event: 'Os anos passam e cada um constrói a própria vida',
        change: 'Os dois agora são adultos e vivem longe',
        next: 'Uma noite qualquer traz o nome de volta',
        imageOnly: 'Duas janelas acesas, cada uma com uma vida diferente dentro',
      },
      visual: {
        phase: 'hoje',
        staging: 'apart',
        wardrobe: `${nameA} de avental na cozinha; ${nameB} de casaco, carregando caixas de mudança`,
        location: `o apartamento de ${nameA} e, em outra cidade, o de ${nameB}`,
        time: 'anos depois, à noite',
        action: `${nameA} cozinha sozinho; ${nameB} desembala caixas numa casa nova`,
        expression: 'concentrados, cada um no seu mundo',
        shot: 'wide',
        textZone: 'right',
        linkToNext: 'a luz do celular no quarto de um deles',
      },
    },
    {
      layout: 'scene',
      text: `Numa noite qualquer, ${nameA} encontrou um perfil conhecido na tela. Era ${nameB}, com o mesmo sorriso de canto. O polegar ficou parado um bom minuto antes de escrever. A mensagem saiu curta, quase tímida, e o celular voltou para a mesa com o coração disparado.`,
      beat: {
        event: `${nameA} reconhece o perfil e manda a primeira mensagem`,
        change: 'Depois de anos, alguém dá o primeiro passo',
        next: 'A resposta chega e vira convite',
        imageOnly: 'O rosto iluminado pela tela no quarto escuro',
      },
      visual: {
        phase: 'hoje',
        staging: 'solo_a',
        wardrobe: 'camiseta velha de ficar em casa',
        location: `o quarto de ${nameA}, só com a luz do celular`,
        time: 'tarde da noite',
        action: `${nameA} sentado na cama, segurando o celular com as duas mãos`,
        expression: 'expectativa contida',
        shot: 'close',
        textZone: 'bottom',
        linkToNext: `o convite aceito leva ao ${place}`,
      },
    },
    {
      layout: 'dialogue',
      text: `A resposta virou conversa, e a conversa virou convite. No ${place}, entre música alta e copos tilintando, ${nameB} chegou rindo de alguma coisa.`,
      dialogue: ['— Você por aqui?', '— Pois é. Demorou, hein.'],
      beat: {
        event: `${nameA} e ${nameB} se reencontram pessoalmente`,
        change: 'A conversa sai da tela e ganha corpo',
        next: 'Longe do barulho, um repara no outro',
        imageOnly: 'A roda de gente em volta e os dois se achando no meio dela',
      },
      visual: {
        phase: 'hoje',
        staging: 'together',
        wardrobe: 'roupas de sair, leves para uma noite quente',
        location: `${place} cheio de gente, mesas na calçada e luzes penduradas`,
        time: 'noite de sábado',
        action: `${nameB} chega abrindo caminho entre as pessoas; ${nameA} se levanta da mesa`,
        expression: 'surpresa alegre',
        shot: 'medium',
        textZone: 'top',
        linkToNext: 'a porta lateral que dá para o lado de fora',
      },
    },
    {
      layout: 'scene',
      text: `Do lado de fora, ${nameA} prestou atenção em “${love}”. Em ${nameB}, isso aparecia no modo de escutar até o fim, de inclinar o rosto antes de discordar, de rir sem pedir plateia. Eram detalhes pequenos, e ${nameA} percebeu que estava decorando cada um sem querer.`,
      beat: {
        event: `${nameA} descobre o que mais admira em ${nameB}`,
        change: 'O reencontro vira atenção de verdade',
        next: 'A noite termina, mas ninguém quer ir embora',
        imageOnly: 'O gesto de inclinar o rosto enquanto escuta',
      },
      visual: {
        phase: 'hoje',
        staging: 'together',
        wardrobe: 'roupas de sair, um casaco leve nos ombros',
        location: 'calçada tranquila do lado de fora, encostados num muro com plantas',
        time: 'mais tarde, rua mais quieta',
        action: `${nameB} fala gesticulando; ${nameA} escuta, rosto apoiado na mão`,
        expression: 'encanto atento',
        shot: 'close',
        textZone: 'left',
        linkToNext: 'a rua comprida que leva de volta para casa',
      },
    },
    {
      layout: 'scene',
      text: `Na volta, o barulho ficou para trás e sobrou a rua comprida, de calçada molhada. Os dois caminharam devagar, sem pressa de chegar. ${nameB} contou uma história da infância, ${nameA} contou outra, e os passos foram se acertando até ninguém mais andar na frente.`,
      beat: {
        event: 'Os dois voltam a pé conversando pela rua',
        change: 'Passam a andar no mesmo ritmo',
        next: 'Chegam à porta e a despedida demora',
        imageOnly: 'Os reflexos dos postes na calçada molhada',
      },
      visual: {
        phase: 'hoje',
        staging: 'together',
        wardrobe: 'casaco dividido entre os dois',
        location: 'rua residencial comprida com postes e calçada molhada',
        time: 'madrugada',
        action: 'os dois caminham lado a lado, um contando algo e o outro rindo',
        expression: 'leveza e riso',
        shot: 'wide',
        textZone: 'bottom',
        linkToNext: 'a porta de casa iluminada no fim da rua',
      },
    },
    {
      layout: 'impact',
      text: 'Na porta, ninguém quis ser o primeiro a dizer boa-noite.',
      beat: {
        event: 'A despedida na porta se estende',
        change: 'Fica claro que aquilo não é só um reencontro',
        next: 'A vida a dois começa a ganhar rotina',
        imageOnly: 'A chave parada na fechadura, sem girar',
      },
      visual: {
        phase: 'hoje',
        staging: 'detail',
        wardrobe: 'manga do casaco e chaveiro em destaque',
        location: 'porta de madeira com luz amarela acima',
        time: 'madrugada, na despedida',
        action: 'uma mão segura a chave na fechadura sem girar',
        expression: 'hesitação doce, mostrada só nas mãos',
        shot: 'detail',
        textZone: 'top',
        linkToNext: 'a mesma porta, aberta numa manhã de domingo',
      },
    },
    {
      layout: 'scene',
      text: `Depois vieram as manhãs. ${nameA} fazendo café forte demais, ${nameB} reclamando e bebendo assim mesmo, a janela aberta e o rádio baixo. Não houve anúncio nem promessa grande: houve o hábito de voltar a se procurar, de manhã, de tarde, sempre que dava.`,
      beat: {
        event: 'O casal vive uma manhã comum juntos',
        change: 'O encontro vira cotidiano',
        next: 'Um passeio leva os dois de volta ao começo',
        imageOnly: 'Duas canecas diferentes na mesma mesa',
      },
      visual: {
        phase: 'hoje',
        staging: 'together',
        wardrobe: 'roupas de domingo, pés descalços',
        location: 'cozinha pequena com janela aberta e plantas',
        time: 'manhã de domingo',
        action: `${nameA} serve café; ${nameB} faz careta ao provar e ri`,
        expression: 'cumplicidade',
        shot: 'medium',
        textZone: 'right',
        linkToNext: 'o caminho até a praça do primeiro oi',
      },
    },
    {
      layout: 'scene',
      text: `Um dia, sem combinar, os dois passaram pela praça do primeiro oi. Sentaram no mesmo banco, agora lado a lado, e riram da timidez daquela tarde. ${dedication ? `${clip(dedication, 25)} ` : ''}O resto, vocês escrevem juntos.`,
      beat: {
        event: 'O casal volta à praça onde tudo começou',
        change: 'O lugar do primeiro oi agora é dos dois',
        next: 'O livro termina e a história continua com eles',
        imageOnly: 'O mesmo banco da página três, agora com os dois sentados',
      },
      visual: {
        phase: 'hoje',
        staging: 'together',
        wardrobe: 'roupas leves de passeio',
        location: 'a mesma praça do começo, banco de madeira sob a árvore',
        time: 'fim de tarde, luz dourada',
        action: `${nameA} e ${nameB} sentados no banco, ombro com ombro, olhando a praça`,
        expression: 'gratidão serena',
        shot: 'wide',
        textZone: 'bottom',
        linkToNext: 'fim do livro',
      },
    },
  ];

  const pages: BookPage[] = plan.map((item, offset) => {
    const index = offset + 1;
    const role = pageRole(index);
    const range = role === 'story' ? PAGE_WORDS[item.layout] : PAGE_WORDS[role];
    return {
      index,
      role,
      layout: item.layout,
      text: tidy(item.text, range.min, range.max),
      ...(item.dialogue ? { dialogue: item.dialogue } : {}),
      beat: item.beat,
      visual: item.visual,
    };
  });

  const story = [
    premise,
    ...pages.slice(1).map((page) => [page.text, ...(page.dialogue ?? [])].join(' ')),
    detail ? `Entre os dois, ficou também “${detail}”, que voltou em cada conversa.` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  return manuscriptSchema.parse({
    version: 2,
    storyMode: input.storyMode,
    title: bookTitle(input.storyMode),
    thread,
    interpretation: {
      characters: [nameA, nameB],
      facts: [
        `Começo ligado a ${meet}.`,
        `Lembrança central ligada a ${memory}.`,
        `Traço reconhecido ligado a ${love}.`,
      ],
      traits: [love, 'presença', 'reencontro'],
      expandable: input.storyMode === 'real' ? [] : ['gestos', 'diálogos curtos', 'clima da cena'],
    },
    story,
    cast: [
      { name: nameA, look: `${nameA} como nas fotos de referência` },
      { name: nameB, look: `${nameB} como nas fotos de referência` },
    ],
    phases,
    pages,
  });
}
