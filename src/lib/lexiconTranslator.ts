// Mapeamento de termos comuns de tags do inglês para português e espanhol
const USAGE_TAG_TRANSLATIONS_PT: Record<string, string> = {
  "father": "pai",
  "chief": "chefe",
  "patrimony": "patrimônio",
  "principal": "principal",
  "greenness": "verdor",
  "fruit": "fruto",
  "destroy": "destruir",
  "perish": "perecer",
  "perishing": "perecendo",
  "destruction": "destruição",
  "lost": "perdido",
  "angels": "anjos",
  "great": "grande",
  "judges": "juízes",
  "mighty": "poderoso",
  "exceeding": "excessivo",
  "rulers": "governantes",
  "God": "Deus",
  "gods": "deuses",
  "beginning": "início",
  "heaven": "céu",
  "earth": "terra",
  "light": "luz",
  "darkness": "trevas",
  "day": "dia",
  "night": "noite",
  "evening": "tarde",
  "morning": "manhã",
  "water": "água",
  "sea": "mar",
  "dry": "seco",
  "land": "terra",
  "grass": "erva",
  "seed": "semente",
  "tree": "árvore",
  "star": "estrela",
  "stars": "estrelas",
  "man": "homem",
  "woman": "mulher",
  "life": "vida",
  "breath": "fôlego",
  "soul": "alma",
  "spirit": "espírito",
  "heart": "coração",
  "voice": "voz",
  "covenant": "aliança",
  "word": "palavra",
  "command": "mandamento",
  "statute": "estatuto",
  "judgment": "juízo",
  "law": "lei",
  "peace": "paz",
  "grace": "graça",
  "mercy": "misericórdia",
  "love": "amor",
  "truth": "verdade",
  "holy": "santo",
  "holiness": "santidade",
  "sanctuary": "santuário",
  "altar": "altar",
  "priest": "sacerdote",
  "sacrifice": "sacrifício",
  "offering": "ofrenda",
  "sin": "pecado",
  "iniquity": "iniquidade",
  "transgression": "transgressão",
  "clean": "limpo",
  "unclean": "impuro",
  "pure": "puro",
  "gold": "ouro",
  "silver": "prata",
  "brass": "bronze",
  "stone": "pedra",
  "house": "casa",
  "temple": "templo",
  "city": "cidade",
  "gate": "porta",
  "wall": "muro",
  "king": "rei",
  "prince": "príncipe",
  "queen": "rainha",
  "kingdom": "reino",
  "throne": "trono",
  "nation": "nação",
  "people": "povo",
  "wilderness": "deserto",
  "mountain": "monte",
  "hill": "colina",
  "valley": "vale",
  "river": "rio",
  "stream": "corrente",
  "fountain": "fonte",
  "well": "poço",
  "bread": "pão",
  "wine": "vinho",
  "oil": "azeite",
  "milk": "leite",
  "honey": "mel",
  "flesh": "carne",
  "bone": "osso",
  "blood": "sangue",
  "remember": "lembrar",
  "mention": "mencionar",
  "be male": "macho",
  "recount": "recontar",
  "record": "registrar",
  "earnestly": "sinceramente",
  "be mindful": "estar atento",
  "burn": "queimar"
};

const USAGE_TAG_TRANSLATIONS_ES: Record<string, string> = {
  "father": "padre",
  "chief": "jefe",
  "patrimony": "patrimonio",
  "principal": "principal",
  "greenness": "verdor",
  "fruit": "fruto",
  "destroy": "destruir",
  "perish": "perecer",
  "perishing": "pereciendo",
  "destruction": "destrucción",
  "lost": "perdido",
  "angels": "ángeles",
  "great": "grande",
  "judges": "jueces",
  "mighty": "poderoso",
  "exceeding": "excesivo",
  "rulers": "gobernantes",
  "God": "Dios",
  "gods": "dioses",
  "beginning": "principio",
  "heaven": "cielo",
  "earth": "tierra",
  "light": "luz",
  "darkness": "tinieblas",
  "day": "día",
  "night": "noche",
  "evening": "tarde",
  "morning": "mañana",
  "water": "agua",
  "sea": "mar",
  "dry": "seco",
  "land": "tierra",
  "grass": "hierba",
  "seed": "semilla",
  "tree": "árbol",
  "star": "estrella",
  "stars": "estrellas",
  "man": "hombre",
  "woman": "mujer",
  "life": "vida",
  "breath": "aliento",
  "soul": "alma",
  "spirit": "espíritu",
  "heart": "corazón",
  "voice": "voz",
  "covenant": "pacto",
  "word": "palabra",
  "command": "mandamiento",
  "statute": "estatuto",
  "judgment": "juicio",
  "law": "ley",
  "peace": "paz",
  "grace": "gracia",
  "mercy": "misericordia",
  "love": "amor",
  "truth": "verdad",
  "holy": "santo",
  "holiness": "santidad",
  "sanctuary": "santuario",
  "altar": "altar",
  "priest": "sacerdote",
  "sacrifice": "sacrificio",
  "offering": "ofrenda",
  "sin": "pecado",
  "iniquity": "iniquidad",
  "transgression": "transgresión",
  "clean": "limpio",
  "unclean": "impuro",
  "pure": "puro",
  "gold": "oro",
  "silver": "plata",
  "brass": "bronce",
  "stone": "piedra",
  "house": "casa",
  "temple": "templo",
  "city": "ciudad",
  "gate": "puerta",
  "wall": "muro",
  "king": "rey",
  "prince": "príncipe",
  "queen": "reina",
  "kingdom": "reino",
  "throne": "trono",
  "nation": "nación",
  "people": "pueblo",
  "wilderness": "desierto",
  "mountain": "monte",
  "hill": "colina",
  "valley": "valle",
  "river": "río",
  "stream": "corriente",
  "fountain": "fuente",
  "well": "pozo",
  "bread": "pan",
  "wine": "vino",
  "oil": "aceite",
  "milk": "leche",
  "honey": "miel",
  "flesh": "carne",
  "bone": "hueso",
  "blood": "sangre",
  "remember": "recordar",
  "mention": "mencionar",
  "be male": "macho",
  "recount": "recontar",
  "record": "registrar",
  "earnestly": "sinceramente",
  "be mindful": "estar atento",
  "burn": "quemar"
};

// Traduções curadas para resumos BDB específicos
const BDB_CURATED_TRANSLATIONS_PT: Record<string, string> = {
  "H1": "chefe de família, clã ou casa paterna",
  "H430": "plural. governantes, juízes, seja como representantes divinos em lugares sagrados ou como reflexo da majestade e poder divinos",
  "H7225": "início, primeira parte, tempo primário",
  "H2142": "lembrar, recordar, trazer à mente, geralmente afetando o sentimento ou pensamento atual"
};

const BDB_CURATED_TRANSLATIONS_ES: Record<string, string> = {
  "H1": "jefe de familia, clan o casa paterna",
  "H430": "plural. gobernantes, jueces, ya sea como representantes divinos en lugares sagrados o como reflejo de la majestad y poder divinos",
  "H7225": "inicio, primera parte, tiempo primario",
  "H2142": "recordar, traer a la mente, generalmente afectando el sentimiento o pensamiento actual"
};

/**
 * Traduz uma tag de uso para o idioma especificado de forma segura.
 * Se não houver tradução, mantém a tag original.
 */
export function translateUsageTag(tag: string, locale: string): string {
  if (!tag) return "";
  const cleanTag = tag.trim();
  const lang = String(locale).toLowerCase();
  
  if (lang.startsWith("pt")) {
    return USAGE_TAG_TRANSLATIONS_PT[cleanTag] || cleanTag;
  }
  if (lang.startsWith("es")) {
    return USAGE_TAG_TRANSLATIONS_ES[cleanTag] || cleanTag;
  }
  return cleanTag;
}

/**
 * Retorna o resumo do BDB traduzido se disponível.
 * Se não, retorna o texto original em inglês indicando com isOriginal: true.
 */
export function getTranslatedBdb(
  strongsNumber: string,
  englishText: string,
  locale: string
): { text: string; isOriginal: boolean } {
  const lang = String(locale).toLowerCase();
  
  if (lang.startsWith("pt")) {
    const curated = BDB_CURATED_TRANSLATIONS_PT[strongsNumber];
    if (curated) {
      return { text: curated, isOriginal: false };
    }
  } else if (lang.startsWith("es")) {
    const curated = BDB_CURATED_TRANSLATIONS_ES[strongsNumber];
    if (curated) {
      return { text: curated, isOriginal: false };
    }
  }
  
  // Caso o idioma seja inglês ou não haja tradução curada disponível,
  // retorna o texto original em inglês.
  return { 
    text: englishText || "", 
    isOriginal: !lang.startsWith("en") && !!englishText 
  };
}
