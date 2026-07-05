import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Define target interfaces matching StrongsEntry
export interface EnrichedStrongsEntry {
  number: string;
  word: string;
  translit: string;
  definition: string;
  definition_pt?: string;
  definition_es?: string;
  occurrences?: number;
  usage_tags?: string[];
  usage_tags_pt?: string[];
  usage_tags_es?: string[];
  root?: string;
  word_group?: string;
  word_group_pt?: string;
  word_group_es?: string;
  bdb_short?: string;
  bdb_short_pt?: string;
  bdb_short_es?: string;
}

// ─── Dicionário curado: word_group → PT-BR ───────────────────────────────────
// Chaves em minúsculas, exatamente como vêm do LexicalIndex.xml
const WORD_GROUP_PT: Record<string, string> = {
  "abhor": "Abominar", "abide": "Permanecer", "abolish": "Abolir",
  "accept": "Aceitar", "accuse": "Acusar", "acquire": "Adquirir",
  "act": "Agir", "add": "Adicionar", "administer": "Administrar",
  "adorn": "Adornar", "afflict": "Afligir", "agree": "Concordar",
  "alarm": "Alarmar", "allow": "Permitir", "amaze": "Maravilhar",
  "anoint": "Ungir", "answer": "Responder", "appear": "Aparecer",
  "appoint": "Designar", "approach": "Aproximar-se", "arise": "Levantar-se",
  "arrange in order": "Arranjar em ordem", "ask": "Perguntar",
  "assemble": "Reunir", "assign": "Atribuir", "associate with": "Associar-se",
  "attack": "Atacar", "attend to": "Atender", "awake": "Despertar",
  "bear": "Carregar / Suportar", "bear fruit": "Dar fruto",
  "bear tidings": "Anunciar", "beat": "Golpear", "beautify": "Embelezar",
  "become": "Tornar-se", "become faint": "Desmaiar",
  "beguile": "Seduzir / Enganar", "behold": "Contemplar",
  "bend": "Dobrar", "bend down": "Inclinar-se",
  "bestow upon": "Conceder", "bind": "Ligar / Prender",
  "bind around": "Envolver", "bite": "Morder", "blaze up": "Irromper em chamas",
  "blossom": "Florescer", "blow": "Soprar", "boil": "Ferver",
  "bore": "Perfurar", "bow": "Curvar", "bow down": "Prostrar-se",
  "break": "Quebrar", "break through": "Irromper", "breathe": "Respirar",
  "bruise": "Machucar", "build": "Construir", "burn": "Queimar",
  "bury": "Enterrar", "buy": "Comprar", "call": "Chamar",
  "capture": "Capturar", "carve": "Esculpir", "cease": "Cessar",
  "change": "Mudar", "choose": "Escolher", "circumcise": "Circuncidar",
  "cleave": "Fender / Aderir", "cling": "Apegar-se",
  "collect": "Coletar", "come": "Vir", "come down": "Descer",
  "come in": "Entrar", "come near": "Aproximar-se",
  "come to an end": "Chegar ao fim", "come up": "Subir",
  "commit adultery": "Cometer adultério", "complete": "Completar",
  "conceal": "Esconder", "consider": "Considerar",
  "count": "Contar", "cover": "Cobrir", "crush": "Esmagar",
  "cry": "Clamar", "cry aloud": "Clamar alto", "cry out": "Exclamar",
  "curse": "Amaldiçoar", "cut": "Cortar", "cut off": "Cortar fora",
  "day": "Dia", "deceive": "Enganar", "declare": "Declarar",
  "dedicate": "Dedicar", "defile": "Contaminar",
  "delight in": "Deleitar-se em", "deliver": "Livrar / Entregar",
  "depart": "Partir", "desire": "Desejar", "despise": "Desprezar",
  "destroy": "Destruir", "die": "Morrer", "dig": "Cavar",
  "discern": "Discernir", "discipline": "Disciplinar",
  "divide": "Dividir", "do": "Fazer", "draw": "Tirar / Atrair",
  "draw out": "Extrair", "dream": "Sonhar", "drink": "Beber",
  "drive": "Guiar", "drive out": "Expulsar", "dwell": "Habitar",
  "eat": "Comer", "end": "Terminar", "engrave": "Gravar",
  "err": "Errar", "escape": "Escapar", "establish": "Estabelecer",
  "exalt": "Exaltar", "examine": "Examinar", "exult": "Exultar",
  "fall": "Cair", "fall upon": "Cair sobre", "fashion": "Moldar",
  "fear": "Temer", "feed": "Alimentar", "fight": "Lutar",
  "flee": "Fugir", "flow": "Fluir", "fly": "Voar",
  "forget": "Esquecer", "forgive": "Perdoar", "form": "Formar",
  "gather": "Reunir", "gather together": "Ajuntar", "get": "Obter",
  "give": "Dar", "glorify": "Glorificar", "go": "Ir",
  "go about": "Ir ao redor", "go around": "Cercar",
  "go astray": "Desviar-se", "go down": "Descer",
  "go free": "Partir em liberdade", "go in": "Entrar",
  "go out": "Sair", "go straight": "Ir em frente",
  "go through": "Passar por", "go to ruin": "Arruinar-se",
  "go up": "Subir", "grasp": "Agarrar", "groan": "Gemer",
  "grow": "Crescer", "grow fat": "Engordar", "grow great": "Tornar-se grande",
  "grow strong": "Fortalecer-se", "grow up": "Crescer",
  "handle": "Lidar", "hang": "Pendurar", "hasten": "Apressar-se",
  "hate": "Odiar", "heal": "Curar", "heap up": "Acumular",
  "hear": "Ouvir", "heart": "Coração", "help": "Ajudar",
  "hide": "Esconder", "hold": "Segurar", "honour": "Honrar",
  "hunt": "Caçar", "inquire": "Perguntar / Buscar",
  "judge": "Julgar", "keep": "Guardar", "kill": "Matar",
  "kindle": "Acender", "kiss": "Beijar", "kneel": "Ajoelhar-se",
  "know": "Conhecer", "labour": "Trabalhar", "laugh": "Rir",
  "lay": "Pôr", "lead": "Guiar", "learn": "Aprender",
  "leave": "Deixar", "lend": "Emprestar", "lie": "Mentir",
  "lie down": "Deitar-se", "lie in wait": "Espreitar",
  "lift": "Levantar", "lift up": "Erguer", "live": "Viver",
  "look": "Olhar", "look out": "Vigiar", "love": "Amar",
  "make": "Fazer", "make music": "Fazer música", "marry": "Casar-se",
  "measure": "Medir", "meet": "Encontrar", "minister": "Servir",
  "mix": "Misturar", "mourn": "Lamentar", "move": "Mover",
  "multiply": "Multiplicar", "murder": "Assassinar",
  "number": "Numerar", "open": "Abrir", "oppress": "Oprimir",
  "pass over": "Passar / Páscoa", "pay reverence to": "Reverenciar",
  "perish": "Perecer", "pierce": "Traspassar", "place": "Colocar",
  "plant": "Plantar", "plunder": "Saquear", "pollute": "Poluir",
  "pour": "Derramar", "pour out": "Derramar fora", "pray": "Orar",
  "press": "Pressionar", "purify": "Purificar", "pursue": "Perseguir",
  "put": "Colocar", "rain": "Chover", "ransom": "Resgatar",
  "reap": "Colher", "rebel": "Rebelar-se", "rebellion": "Rebelião",
  "rebuke": "Repreender", "receive": "Receber", "redeem": "Remir",
  "refuse": "Recusar", "regard": "Considerar", "reject": "Rejeitar",
  "rejoice": "Regozijar-se", "remain": "Permanecer",
  "remain over": "Sobrar", "remember": "Lembrar", "renew": "Renovar",
  "repeat": "Repetir", "reproach": "Reprovar", "rest": "Descansar",
  "restrain": "Restringir", "retreat": "Recuar", "return": "Retornar",
  "reveal": "Revelar", "rise": "Levantar-se", "rise up": "Erguer-se",
  "roar": "Rugir", "roll": "Rolar", "rule": "Governar",
  "run": "Correr", "sacrifice": "Sacrificar",
  "slaughter for sacrifice": "Imolar", "say": "Dizer",
  "scatter": "Espalhar", "search": "Buscar", "see": "Ver",
  "seek": "Buscar", "seek refuge": "Buscar refúgio", "seize": "Apreender",
  "sell": "Vender", "send": "Enviar", "separate": "Separar",
  "set": "Colocar / Estabelecer", "settle down": "Estabelecer-se",
  "shake": "Sacudir", "shine": "Brilhar", "shine out": "Resplandecer",
  "sin": "Pecar", "sit": "Sentar-se", "slay": "Matar",
  "sleep": "Dormir", "speak": "Falar", "speak rashly": "Falar precipitadamente",
  "spread": "Espalhar", "spread out": "Estender",
  "steal": "Roubar", "strike": "Golpear", "strip": "Despir",
  "strive": "Contender", "stumble": "Tropeçar", "subdue": "Subjugar",
  "suffer": "Sofrer", "support": "Sustentar", "surround": "Cercar",
  "swallow": "Engolir", "swear": "Jurar", "sweep away": "Varrer",
  "take": "Tomar", "take captive": "Levar cativo",
  "take possession of": "Tomar posse", "take refuge": "Buscar refúgio",
  "taste": "Provar", "tear": "Rasgar", "tear apart": "Despedaçar",
  "tell": "Contar", "test": "Testar / Provar", "think": "Pensar",
  "throw": "Lançar", "throw down": "Derrubar", "tie": "Amarrar",
  "touch": "Tocar", "train up": "Treinar / Educar",
  "trample": "Pisar / Calcar", "tremble": "Tremer", "trust": "Confiar",
  "turn": "Virar", "turn about": "Voltar-se", "turn aside": "Desviar",
  "turn away": "Afastar-se", "turn back": "Retornar",
  "uncover": "Descobrir", "utter": "Pronunciar", "vow": "Fazer voto",
  "wail": "Lamentar / Gemer", "wait": "Esperar",
  "wait for": "Aguardar", "wander": "Vagar", "wash": "Lavar",
  "waste away": "Definhar", "watch": "Vigiar", "weep": "Chorar",
  "whet": "Afiar", "work": "Trabalhar", "write": "Escrever",
  // Stative verbs (be + adj)
  "be bright": "Ser brilhante", "be burnt": "Ser queimado",
  "be clean": "Ser limpo", "be cold": "Ser frio",
  "be complete": "Ser completo", "be dark": "Ser escuro",
  "be deep": "Ser profundo", "be desolate": "Ser desolado",
  "be dry": "Ser seco", "be empty": "Ser vazio",
  "be evil": "Ser mau", "be faint": "Desmaiar",
  "be far": "Ser distante", "be fat": "Ser gordo",
  "be firm": "Ser firme", "be foolish": "Ser tolo",
  "be free": "Ser livre", "be full": "Ser cheio",
  "be good": "Ser bom", "be guilty": "Ser culpado",
  "be hard": "Ser duro", "be heavy": "Ser pesado",
  "be high": "Ser alto", "be holy": "Ser santo",
  "be hot": "Ser quente", "be humble": "Ser humilde",
  "be hungry": "Ter fome", "be ill": "Estar doente",
  "be in pain": "Estar em dor", "be kindled": "Ser aceso",
  "be light": "Ser leve / brilhante", "be like": "Ser semelhante",
  "be long": "Ser longo", "be low": "Ser baixo",
  "be mad": "Ser louco", "be many": "Ser muitos",
  "be much": "Ser muito", "be naked": "Ser nu",
  "be pleasant": "Ser agradável", "be pleased with": "Ser agradado",
  "be precious": "Ser precioso", "be quiet": "Ser quieto",
  "be ready": "Estar pronto", "be red": "Ser vermelho",
  "be rich": "Ser rico", "be separate": "Ser separado",
  "be separated": "Ser separado", "be sharp": "Ser afiado",
  "be sick": "Estar doente", "be silent": "Ser silencioso",
  "be small": "Ser pequeno", "be smooth": "Ser liso",
  "be soft": "Ser suave", "be sorry": "Arrepender-se",
  "be strong": "Ser forte", "be sweet": "Ser doce",
  "be thirsty": "Ter sede", "be unclean": "Ser impuro",
  "be vast": "Ser vasto", "be warm": "Ser quente",
  "be weak": "Ser fraco", "be weary": "Ser cansado",
  "be white": "Ser branco", "be wide": "Ser largo",
  "be wise": "Ser sábio", "be wroth": "Ser irado",
  "be strong": "Ser forte", "be stubborn": "Ser obstinado",
};


// ─── Dicionário curado: usage_tag → PT-BR (base do lexiconTranslator) ─────────
const USAGE_TAG_PT: Record<string, string> = {
  "father": "pai", "chief": "chefe", "patrimony": "patrimônio",
  "principal": "principal", "greenness": "verdor", "fruit": "fruto",
  "destroy": "destruir", "perish": "perecer", "destruction": "destruição",
  "lost": "perdido", "angels": "anjos", "great": "grande",
  "judges": "juízes", "mighty": "poderoso", "rulers": "governantes",
  "God": "Deus", "gods": "deuses", "beginning": "início",
  "heaven": "céu", "earth": "terra", "light": "luz",
  "darkness": "trevas", "day": "dia", "night": "noite",
  "evening": "tarde", "morning": "manhã", "water": "água",
  "sea": "mar", "dry": "seco", "land": "terra", "grass": "erva",
  "seed": "semente", "tree": "árvore", "star": "estrela",
  "stars": "estrelas", "man": "homem", "woman": "mulher",
  "life": "vida", "breath": "fôlego", "soul": "alma",
  "spirit": "espírito", "heart": "coração", "voice": "voz",
  "covenant": "aliança", "word": "palavra", "command": "mandamento",
  "statute": "estatuto", "judgment": "juízo", "law": "lei",
  "peace": "paz", "grace": "graça", "mercy": "misericórdia",
  "love": "amor", "truth": "verdade", "holy": "santo",
  "holiness": "santidade", "sanctuary": "santuário", "altar": "altar",
  "priest": "sacerdote", "sacrifice": "sacrifício", "sin": "pecado",
  "iniquity": "iniquidade", "transgression": "transgressão",
  "clean": "limpo", "unclean": "impuro", "pure": "puro",
  "gold": "ouro", "silver": "prata", "stone": "pedra",
  "house": "casa", "temple": "templo", "city": "cidade",
  "gate": "porta", "wall": "muro", "king": "rei",
  "prince": "príncipe", "queen": "rainha", "kingdom": "reino",
  "throne": "trono", "nation": "nação", "people": "povo",
  "wilderness": "deserto", "mountain": "monte", "hill": "colina",
  "valley": "vale", "river": "rio", "fountain": "fonte",
  "well": "poço", "bread": "pão", "wine": "vinho",
  "oil": "azeite", "milk": "leite", "honey": "mel",
  "flesh": "carne", "bone": "osso", "blood": "sangue",
  "remember": "lembrar", "mention": "mencionar", "be male": "macho",
  "recount": "recontar", "record": "registrar",
  "earnestly": "sinceramente", "be mindful": "estar atento",
  "burn": "queimar", "above": "acima", "according to": "conforme",
  "after": "depois", "against": "contra", "over": "sobre",
  "upon": "sobre", "in": "em", "on": "em / sobre",
  "from": "de", "with": "com", "by": "por", "to": "para",
  "for": "para", "at": "em", "before": "diante de",
  "behind": "atrás", "under": "sob", "between": "entre",
  "beside": "ao lado de", "through": "através de",
  "around": "ao redor", "among": "entre",
  "bless": "abençoar", "praise": "louvar", "worship": "adorar",
  "pray": "orar", "sing": "cantar", "give thanks": "dar graças",
  "seek": "buscar", "trust": "confiar", "fear": "temer",
  "love": "amar", "hate": "odiar", "hope": "esperar",
  "glory": "glória", "power": "poder", "strength": "força",
  "righteousness": "justiça", "salvation": "salvação",
  "redemption": "redenção", "forgiveness": "perdão",
  "judgment": "julgamento", "wrath": "ira", "anger": "ira",
  "compassion": "compaixão", "kindness": "bondade",
  "faithfulness": "fidelidade", "wisdom": "sabedoria",
  "understanding": "entendimento", "knowledge": "conhecimento",
};


interface LexicalIndexEntry {
  id: string;
  lemma: string;
  def?: string;
  strong?: string;
  bdb?: string;
  etymType?: 'main' | 'sub';
  etymRoot?: string;
  etymTarget?: string;
}

// Resolve __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const PROJECT_ROOT = path.resolve(__dirname, '..');
const XML_DIR = path.join(PROJECT_ROOT, 'scripts', 'data', 'openscriptures');
const CURRENT_HEBREW_JSON_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'strongs_hebrew.json');
const OUTPUT_HEBREW_JSON_PATH = path.join(PROJECT_ROOT, 'public', 'data', 'strongs_hebrew_os.json');

// Normalizes usage tags
export function normalizeUsageTags(rawUsage: string): string[] {
  if (!rawUsage) return [];
  // Remove "Compare..." or "See..." notes
  const cleanRaw = rawUsage.replace(/\b(Compare|See)\b.*/gi, '');
  const tokens = cleanRaw.split(/[,;]/);
  const tags: string[] = [];
  
  for (let token of tokens) {
    token = token.trim();
    // Remove symbols and punctuation
    token = token.replace(/[×†√‡]/g, '').trim();
    // Remove parts in parentheses (e.g. "(fore-) father(-less)" -> " father" -> "father")
    token = token.replace(/\([^)]*\)/g, '').trim();
    // Remove trailing period or punctuation
    token = token.replace(/[.\s]+$/, '').trim();
    
    if (!token) continue;
    if (token.length > 40) continue;
    if (!tags.includes(token)) {
      tags.push(token);
    }
  }
  return tags.slice(0, 8);
}

// Clean text helper for BDB definitions
export function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '') // strip tags
    .replace(/[†√‡]/g, '') // remove symbols
    .replace(/\s+/g, ' ') // collapse spacing
    .trim();
}

// Traduções curadas e teológicas do BDB para português
const BDB_CURATED_PT: Record<string, string> = {
  "H1": "pai, antepassado, chefe de clã",
  "H2142": "Qal: lembrar, recordar, trazer à mente; Hifil: fazer lembrar, declarar, mencionar",
  "H430": "plural de majestade: Deus supremo, o Deus de Israel; plural comum: deuses, seres divinos, juízes",
  "H7225": "início, começo, primeira parte, primícias",
  "H1254": "Qal: criar, dar início (atividade exclusiva de Deus)",
  "H8064": "céus, firmamento, habitação visível e invisível de Deus",
  "H776": "terra, solo, território, país",
  "H215": "Qal: brilhar, iluminar; Hifil: dar luz, clarear, acender",
  "H2822": "trevas, escuridão, ausência de luz, obscuridade",
  "H3117": "dia (período de luz), dia de 24 horas, tempo, período determinado",
  "H3915": "noite, período de escuridão",
  "H1242": "manhã, início do dia, amanhecer",
  "H6153": "tarde, anoitecer, pôr do sol"
};

// Traduções curadas e teológicas do BDB para espanhol
const BDB_CURATED_ES: Record<string, string> = {
  "H1": "padre, antepasado, jefe de clan",
  "H2142": "Qal: recordar, traer a la mente; Hifil: hacer recordar, declarar, mencionar",
  "H430": "plural de majestad: Dios supremo, el Dios de Israel; plural común: dioses, seres divinos, jueces",
  "H7225": "inicio, comienzo, primera parte, primicias",
  "H1254": "Qal: crear, dar inicio (actividad exclusiva de Dios)",
  "H8064": "cielos, firmamento, morada de Dios",
  "H776": "tierra, suelo, territorio, país",
  "H215": "Qal: brillar, iluminar; Hifil: dar luz, alumbrar",
  "H2822": "tinieblas, oscuridad, ausencia de luz",
  "H3117": "día, tiempo, período determinado",
  "H3915": "noche, período de oscuridad",
  "H1242": "mañana, amanecer",
  "H6153": "tarde, anochecer"
};

// Parse LexicalIndex.xml
export function parseLexicalIndex(xmlPath: string): Map<string, LexicalIndexEntry> {
  console.log(`Parsing ${xmlPath}...`);
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const blocks = xml.split('</entry>');
  const map = new Map<string, LexicalIndexEntry>();
  
  for (const block of blocks) {
    const startIdx = block.indexOf('<entry ');
    if (startIdx === -1) continue;
    const content = block.substring(startIdx);
    
    const idMatch = content.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];
    
    const wMatch = content.match(/<w[^>]*>([\s\S]*?)<\/w>/);
    const lemma = wMatch ? cleanText(wMatch[1]) : '';
    
    const defMatch = content.match(/<def>([^<]+)<\/def>/);
    const def = defMatch ? cleanText(defMatch[1]) : undefined;
    
    const strongMatch = content.match(/strong="(\d+)"/);
    const strong = strongMatch ? 'H' + strongMatch[1] : undefined;
    
    const bdbMatch = content.match(/bdb="([^"]+)"/);
    const bdb = bdbMatch ? bdbMatch[1] : undefined;
    
    let etymType: 'main' | 'sub' | undefined;
    let etymRoot: string | undefined;
    let etymTarget: string | undefined;
    
    const etymMatch = content.match(/<etym[^>]*>([\s\S]*?)<\/etym>/);
    if (etymMatch) {
      const etymBlock = etymMatch[0];
      const typeMatch = etymBlock.match(/type="([^"]+)"/);
      if (typeMatch) {
        etymType = typeMatch[1] as 'main' | 'sub';
      }
      
      const rootMatch = etymBlock.match(/root="([^"]+)"/);
      if (rootMatch) {
        etymRoot = rootMatch[1];
      }
      
      etymTarget = cleanText(etymMatch[1]);
    }
    
    map.set(id, {
      id,
      lemma,
      def,
      strong,
      bdb,
      etymType,
      etymRoot,
      etymTarget
    });
  }
  
  return map;
}

// Parse BrownDriverBriggs.xml and index entries by ID
export function parseBdbEntries(xmlPath: string): Map<string, string> {
  console.log(`Parsing BDB entries from ${xmlPath}...`);
  const xml = fs.readFileSync(xmlPath, 'utf8');
  const blocks = xml.split('</entry>');
  const map = new Map<string, string>();
  
  for (const block of blocks) {
    const startIdx = block.indexOf('<entry ');
    if (startIdx === -1) continue;
    const content = block.substring(startIdx);
    
    const idMatch = content.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const id = idMatch[1];
    map.set(id, content);
  }
  
  return map;
}

// Extract clean bdb_short from BDB entry content
export function extractBdbShort(entryContent: string): string | undefined {
  if (!entryContent) return undefined;
  
  // Try to find the first sense tag with meaningful text
  let senseText = '';
  const senseMatches = entryContent.match(/<sense[^>]*>([\s\S]*?)<\/sense>/g);
  
  if (senseMatches) {
    for (const senseBlock of senseMatches) {
      // Clean and see if there's substantial text
      const cleaned = cleanText(senseBlock);
      if (cleaned.length > 5) {
        senseText = cleaned;
        break;
      }
    }
  }
  
  // Fallback to the whole entry content cleaned
  let rawText = senseText || cleanText(entryContent);
  if (!rawText) return undefined;
  
  // Clean text and enforce limits
  let shortText = cleanText(rawText);
  if (shortText.length > 400) {
    shortText = shortText.substring(0, 397);
    const lastSpace = shortText.lastIndexOf(' ');
    if (lastSpace > 100) {
      shortText = shortText.substring(0, lastSpace);
    }
    shortText += '…';
  }
  
  return shortText || undefined;
}

function main() {
  console.log('--- Starting Hebrew Lexicon Enrichment Pipeline ---');

  // 1. Read existing translation source (strongs_hebrew.json)
  let existingTranslations: Record<string, { definition_pt?: string; definition_es?: string }> = {};
  if (fs.existsSync(CURRENT_HEBREW_JSON_PATH)) {
    console.log(`Loading existing translations from ${CURRENT_HEBREW_JSON_PATH}...`);
    try {
      const rawJson = fs.readFileSync(CURRENT_HEBREW_JSON_PATH, 'utf8');
      const data = JSON.parse(rawJson);
      for (const [key, value] of Object.entries(data)) {
        const val = value as any;
        existingTranslations[key] = {
          definition_pt: val.definition_pt,
          definition_es: val.definition_es
        };
      }
      console.log(`Loaded translations for ${Object.keys(existingTranslations).length} entries.`);
    } catch (err) {
      console.warn('Could not read existing translations JSON, proceeding without merge:', err);
    }
  } else {
    console.warn(`Existing translations file not found at ${CURRENT_HEBREW_JSON_PATH}.`);
  }

  // 2. Parse HebrewStrong.xml
  const hebrewStrongPath = path.join(XML_DIR, 'HebrewStrong.xml');
  if (!fs.existsSync(hebrewStrongPath)) {
    console.error(`Error: HebrewStrong.xml not found at ${hebrewStrongPath}`);
    process.exit(1);
  }

  console.log(`Reading ${hebrewStrongPath}...`);
  const hebrewStrongXml = fs.readFileSync(hebrewStrongPath, 'utf8');

  // Parse entries by splitting on </entry>
  console.log('Parsing entries from HebrewStrong.xml...');
  const entryBlocks = hebrewStrongXml.split('</entry>');
  const lexicon: Record<string, EnrichedStrongsEntry> = {};

  for (const block of entryBlocks) {
    const startIdx = block.indexOf('<entry ');
    if (startIdx === -1) continue;
    const entryContent = block.substring(startIdx);
    
    // Extract ID (e.g. id="H1")
    const idMatch = entryContent.match(/id="([^"]+)"/);
    if (!idMatch) continue;
    const strongId = idMatch[1];
    
    // Extract word (<w ...>WORD</w>)
    const wMatch = entryContent.match(/<w[^>]*>([\s\S]*?)<\/w>/);
    const word = wMatch ? cleanText(wMatch[1]) : '';
    
    // Extract translit/xlit (xlit="...")
    const xlitMatch = entryContent.match(/xlit="([^"]+)"/);
    const translit = xlitMatch ? xlitMatch[1] : '';

    // Extract definition (<meaning> or fallback to <usage>)
    let definition = '';
    const meaningMatch = entryContent.match(/<meaning>([\s\S]*?)<\/meaning>/);
    if (meaningMatch) {
      definition = cleanText(meaningMatch[1]);
    } else {
      const usageMatch = entryContent.match(/<usage>([\s\S]*?)<\/usage>/);
      if (usageMatch) {
        definition = cleanText(usageMatch[1]);
      }
    }

    // Extract usage tags
    let usageTags: string[] = [];
    const usageMatchForTags = entryContent.match(/<usage>([\s\S]*?)<\/usage>/);
    if (usageMatchForTags) {
      usageTags = normalizeUsageTags(usageMatchForTags[1]);
    }

    // Initialize entry with base values
    const entry: EnrichedStrongsEntry = {
      number: strongId,
      word,
      translit,
      definition,
      usage_tags: usageTags.length > 0 ? usageTags : undefined
    };

    // Merge translations if exists
    if (existingTranslations[strongId]) {
      if (existingTranslations[strongId].definition_pt) {
        entry.definition_pt = existingTranslations[strongId].definition_pt;
      }
      if (existingTranslations[strongId].definition_es) {
        entry.definition_es = existingTranslations[strongId].definition_es;
      }
    }

    lexicon[strongId] = entry;
  }
  console.log(`Parsed ${Object.keys(lexicon).length} base entries from HebrewStrong.xml.`);

  // 3. Load and parse LexicalIndex.xml for root and word_group
  const lexicalIndexPath = path.join(XML_DIR, 'LexicalIndex.xml');
  let indexMap = new Map<string, LexicalIndexEntry>();
  if (fs.existsSync(lexicalIndexPath)) {
    indexMap = parseLexicalIndex(lexicalIndexPath);
    
    // Map strong -> LexicalIndexEntry
    const strongToEntry = new Map<string, LexicalIndexEntry>();
    for (const idxEntry of indexMap.values()) {
      if (idxEntry.strong) {
        strongToEntry.set(idxEntry.strong, idxEntry);
      }
    }
    
    console.log('Resolving root and word_group from LexicalIndex...');
    for (const [strongId, entry] of Object.entries(lexicon)) {
      const idxEntry = strongToEntry.get(strongId);
      if (!idxEntry) continue;
      
      let resolvedRoot: string | undefined;
      let resolvedWordGroup: string | undefined;
      
      if (idxEntry.etymType === 'sub' && idxEntry.etymTarget) {
        const parent = indexMap.get(idxEntry.etymTarget);
        if (parent) {
          resolvedRoot = parent.etymRoot || parent.lemma;
          resolvedWordGroup = parent.def;
        }
      } else if (idxEntry.etymType === 'main') {
        resolvedRoot = idxEntry.etymRoot || idxEntry.lemma;
        resolvedWordGroup = idxEntry.def;
      }
      
      if (resolvedRoot) {
        entry.root = resolvedRoot;
      }
      if (resolvedWordGroup) {
        entry.word_group = resolvedWordGroup;
      }
    }
  } else {
    console.warn(`LexicalIndex.xml not found at ${lexicalIndexPath}, skipping root & word_group resolution.`);
  }

  // 4. Load and parse BrownDriverBriggs.xml for bdb_short
  const bdbPath = path.join(XML_DIR, 'BrownDriverBriggs.xml');
  if (fs.existsSync(bdbPath) && indexMap.size > 0) {
    const bdbEntries = parseBdbEntries(bdbPath);
    
    // Map strong -> bdbId using LexicalIndex
    const strongToBdbId = new Map<string, string>();
    for (const idxEntry of indexMap.values()) {
      if (idxEntry.strong && idxEntry.bdb) {
        strongToBdbId.set(idxEntry.strong, idxEntry.bdb);
      }
    }
    
    console.log('Resolving bdb_short from BrownDriverBriggs...');
    let resolvedCount = 0;
    for (const [strongId, entry] of Object.entries(lexicon)) {
      const bdbId = strongToBdbId.get(strongId);
      if (!bdbId) continue;
      
      const bdbContent = bdbEntries.get(bdbId);
      if (bdbContent) {
        const bdbShort = extractBdbShort(bdbContent);
        if (bdbShort) {
          entry.bdb_short = bdbShort;
          resolvedCount++;
        }
      }
    }
    console.log(`Resolved bdb_short for ${resolvedCount} entries.`);
  } else {
    console.warn(`BrownDriverBriggs.xml not found or LexicalIndex empty, skipping bdb_short resolution.`);
  }

  // 5. Localize fields to PT-BR
  console.log('Generating PT-BR localized fields (word_group_pt, usage_tags_pt, bdb_short_pt)...');
  let localizedCount = 0;
  for (const [strongId, entry] of Object.entries(lexicon)) {
    // word_group_pt
    if (entry.word_group && WORD_GROUP_PT[entry.word_group]) {
      entry.word_group_pt = WORD_GROUP_PT[entry.word_group];
    }

    // usage_tags_pt — translate tags where mapped, fall back to original tag otherwise
    if (entry.usage_tags && entry.usage_tags.length > 0) {
      entry.usage_tags_pt = entry.usage_tags.map((t: string) => USAGE_TAG_PT[t] || t);
    }

    // bdb_short_pt / bdb_short_es — only use hand-curated translations to ensure correct biblical syntax and avoid redundancy
    if (BDB_CURATED_PT[strongId]) {
      entry.bdb_short_pt = BDB_CURATED_PT[strongId];
      localizedCount++;
    }
    if (BDB_CURATED_ES[strongId]) {
      entry.bdb_short_es = BDB_CURATED_ES[strongId];
    }
  }
  console.log(`Generated bdb_short_pt for ${localizedCount} entries.`);

  // 6. Write output JSON file
  console.log(`Writing output JSON to ${OUTPUT_HEBREW_JSON_PATH}...`);
  fs.writeFileSync(OUTPUT_HEBREW_JSON_PATH, JSON.stringify(lexicon, null, 2), 'utf8');
  console.log('--- Pipeline Step Complete Successfully ---');
}

// Run main
main();
