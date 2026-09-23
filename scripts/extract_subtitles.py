"""
extract_subtitles.py — Bíblia Vive
====================================
Extrai subtítulos de seção do PDF da Bíblia NVI e gera:
  public/bible/subtitles/nvi-pt-br.json

Assinaturas tipográficas confirmadas empiricamente:
  - SUBTÍTULO:        Arial-BoldMT | 11pt | bold=True
  - CABEÇALHO CAP:    Georgia-Bold | 14pt | bold=True  (ex: "Gênesis 1")
  - NÚMERO VERSÍCULO: Cambria      | 9.5pt | color=16711680 (vermelho)
  - NÚMERO VERSÍCULO: ArialMT      | 8pt   | color=16711680 (vermelho, inline em parágrafo)
  - TEXTO BÍBLICO:    CharisSIL    | 13.6pt

Uso:
  python scripts/extract_subtitles.py

Saída:
  public/bible/subtitles/nvi-pt-br.json
"""
import sys
import json
import re
import os

sys.stdout.reconfigure(encoding='utf-8')

try:
    import pymupdf as fitz
except ImportError:
    import fitz  # fallback

# ─── Configuração ─────────────────────────────────────────────────────────────

PDF_PATH = r"C:\Users\sorai\Desktop\Bruno\Projetos\Biblia\Biblia NVI.pdf"
OUTPUT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public", "bible", "subtitles", "nvi-pt-br.json"
)

# Assinaturas tipográficas
SUBTITLE_FONT = 'Arial-BoldMT'
SUBTITLE_SIZE = 11.0
CHAPTER_FONT = 'Georgia-Bold'
CHAPTER_SIZE = 14.0
VERSE_NUMBER_COLOR = 16711680  # vermelho (0xFF0000)
VERSE_NUMBER_FONTS = {'Cambria', 'ArialMT'}

# Mapeamento nome do livro (PDF) → slug interno do projeto
BOOK_NAME_TO_SLUG = {
    # Velho Testamento
    "Gênesis": "gn",
    "Êxodo": "ex",
    "Levítico": "lv",
    "Números": "nm",
    "Deuteronômio": "dt",
    "Josué": "js",
    "Juízes": "jd",
    "Rute": "rt",
    "1 Samuel": "1sm",
    "2 Samuel": "2sm",
    "1 Reis": "1kgs",
    "2 Reis": "2kgs",
    "1 Crônicas": "1ch",
    "2 Crônicas": "2ch",
    "Esdras": "ezr",
    "Neemias": "ne",
    "Ester": "et",
    "Jó": "job",
    "Salmos": "ps",
    "Provérbios": "prv",
    "Eclesiastes": "ec",
    "Cântico dos Cânticos": "so",
    "Cantares": "so",          # variante usada no PDF
    "Isaías": "is",
    "Jeremias": "jr",
    "Lamentações": "lm",
    "Ezequiel": "ez",
    "Daniel": "dn",
    "Oséias": "ho",
    "Oseias": "ho",            # variante usada no PDF (sem acento)
    "Joel": "jl",
    "Amós": "am",
    "Obadias": "ob",
    "Jonas": "jo",
    "Miquéias": "mi",
    "Miqueias": "mi",          # variante usada no PDF (sem acento)

    "Naum": "na",
    "Habacuque": "hk",
    "Sofonias": "zp",
    "Ageu": "hg",
    "Zacarias": "zc",
    "Malaquias": "ml",
    # Novo Testamento
    "Mateus": "mt",
    "Marcos": "mk",
    "Lucas": "lk",
    "João": "jn",
    "Atos": "act",
    "Romanos": "rm",
    "1 Coríntios": "1co",
    "2 Coríntios": "2co",
    "Gálatas": "gl",
    "Efésios": "eph",
    "Filipenses": "ph",
    "Colossenses": "cl",
    "1 Tessalonicenses": "1ts",
    "2 Tessalonicenses": "2ts",
    "1 Timóteo": "1tm",
    "2 Timóteo": "2tm",
    "Tito": "tt",
    "Filemom": "phm",
    "Hebreus": "hb",
    "Tiago": "jm",
    "1 Pedro": "1pe",
    "2 Pedro": "2pe",
    "1 João": "1jo",
    "2 João": "2jo",
    "3 João": "3jo",
    "Judas": "jud",
    "Apocalipse": "re",
}

# ─── Helpers ──────────────────────────────────────────────────────────────────

def is_verse_number(span: dict) -> bool:
    """Verifica se o span é um número de versículo (vermelho, fonte específica)."""
    color = span.get('color', 0)
    font = span.get('font', '')
    size = round(span.get('size', 0), 1)
    text = span.get('text', '').strip()

    if color != VERSE_NUMBER_COLOR:
        return False
    if not text.isdigit():
        return False
    # Aceita Cambria 9.5pt OU ArialMT 8pt (inline em parágrafo)
    if font == 'Cambria' and size == 9.5:
        return True
    if font == 'ArialMT' and size <= 9.0:
        return True
    return False


def parse_chapter_header(text: str) -> tuple[str, int] | None:
    """
    Converte 'Gênesis 1' em ('Gênesis', 1).
    Retorna None se não reconhecer.
    """
    # Tenta match de "LIVRO NÚMERO"
    match = re.match(r'^(.+?)\s+(\d+)$', text.strip())
    if not match:
        return None
    book_name = match.group(1).strip()
    chapter_num = int(match.group(2))
    return book_name, chapter_num


def extract_page_items(page) -> list[dict]:
    """Extrai todos os spans com metadados de uma página."""
    items = []
    blocks = page.get_text('dict')['blocks']
    for block in blocks:
        if block.get('type') != 0:
            continue
        for line in block.get('lines', []):
            for span in line.get('spans', []):
                text = span.get('text', '').strip()
                if not text:
                    continue
                items.append({
                    'text': text,
                    'font': span.get('font', ''),
                    'size': round(span.get('size', 0), 1),
                    'color': span.get('color', 0),
                    'flags': span.get('flags', 0),
                    'y': span.get('bbox', (0, 0, 0, 0))[1],  # coordenada Y do topo
                })
    # Ordena por posição vertical na página
    items.sort(key=lambda x: x['y'])
    return items


# ─── Extração Principal ───────────────────────────────────────────────────────

def extract_subtitles(pdf_path: str) -> dict:
    """
    Percorre todas as páginas do PDF e retorna a estrutura:
    {
      "gn": {
        "1": [{"before_verse": 1, "text": "O Princípio"}],
        ...
      },
      ...
    }
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    print(f"PDF aberto: {total_pages} páginas")

    result: dict[str, dict[str, list[dict]]] = {}

    current_book_name: str | None = None
    current_book_slug: str | None = None
    current_chapter: int | None = None

    # Estado para determinar before_verse:
    # Quando encontramos um subtítulo, registramos sua posição Y e aguardamos
    # o próximo número de versículo para definir before_verse.
    pending_subtitles: list[dict] = []  # {"text": str, "y": float}
    last_verse_number: int = 0

    for page_num in range(total_pages):
        if page_num % 100 == 0:
            print(f"  Processando página {page_num + 1}/{total_pages}...")

        page = doc[page_num]
        items = extract_page_items(page)

        for item in items:
            font = item['font']
            size = item['size']
            text = item['text']
            y = item['y']

            # ── Cabeçalho de capítulo ────────────────────────────────────────
            if font == CHAPTER_FONT and size == CHAPTER_SIZE:
                parsed = parse_chapter_header(text)
                if parsed:
                    book_name, chapter_num = parsed
                    slug = BOOK_NAME_TO_SLUG.get(book_name)
                    if slug:
                        # Fecha capítulo anterior: subtítulos pendentes sem versículo
                        # ainda pendentes recebem before_verse = last_verse_number + 1
                        # (isso não deve acontecer normalmente)
                        if pending_subtitles and current_book_slug and current_chapter:
                            for ps in pending_subtitles:
                                _add_heading(result, current_book_slug, current_chapter,
                                             last_verse_number + 1, ps['text'])
                        pending_subtitles = []
                        last_verse_number = 0

                        current_book_name = book_name
                        current_book_slug = slug
                        current_chapter = chapter_num
                    else:
                        print(f"  [AVISO] Livro não mapeado: '{book_name}' (página {page_num + 1})")

            # ── Subtítulo de seção ───────────────────────────────────────────
            elif font == SUBTITLE_FONT and size == SUBTITLE_SIZE:
                if current_book_slug and current_chapter:
                    # Adiciona à lista de pendentes — before_verse será definido
                    # pelo próximo número de versículo encontrado
                    pending_subtitles.append({'text': text, 'y': y})

            # ── Número de versículo ──────────────────────────────────────────
            elif is_verse_number(item):
                verse_num = int(text)
                if current_book_slug and current_chapter:
                    # Resolve subtítulos pendentes com este número de versículo
                    if pending_subtitles:
                        for ps in pending_subtitles:
                            _add_heading(result, current_book_slug, current_chapter,
                                         verse_num, ps['text'])
                        pending_subtitles = []
                    last_verse_number = max(last_verse_number, verse_num)

    doc.close()
    return result


def _add_heading(result: dict, book_slug: str, chapter: int, before_verse: int, text: str):
    """Adiciona um heading à estrutura de resultado."""
    if book_slug not in result:
        result[book_slug] = {}
    chapter_key = str(chapter)
    if chapter_key not in result[book_slug]:
        result[book_slug][chapter_key] = []

    # Evita duplicatas exatas
    existing = result[book_slug][chapter_key]
    if not any(h['text'] == text and h['before_verse'] == before_verse for h in existing):
        existing.append({"before_verse": before_verse, "text": text})


# ─── Verificação dos exemplos do PRD ─────────────────────────────────────────

def verify_examples(data: dict) -> bool:
    """Verifica os 5 exemplos especificados no PRD."""
    checks = [
        ("gn", "1", 1, "O Princípio"),
        ("gn", "2", 4, "A Origem da Humanidade"),
        ("mt", "1", 1, "A Genealogia de Jesus"),
        ("mt", "1", 18, "O Nascimento de Jesus Cristo"),
        ("re", "22", 1, "O Rio da Vida"),
    ]

    all_ok = True
    print("\n=== VERIFICAÇÃO DOS EXEMPLOS DO PRD ===")
    for book, chap, bv, expected_text in checks:
        headings = data.get(book, {}).get(chap, [])
        found = any(
            h['before_verse'] == bv and expected_text.lower() in h['text'].lower()
            for h in headings
        )
        status = "✓" if found else "✗"
        print(f"  {status} {book} {chap} v{bv} → '{expected_text}'")
        if not found:
            all_ok = False
            print(f"    Headings encontrados: {headings}")

    # Verifica Apocalipse 22 "Jesus Vem em Breve" (before_verse pode ser 6 ou 7)
    re22 = data.get("re", {}).get("22", [])
    jesus_heading = next((h for h in re22 if "Jesus" in h['text'] and "Breve" in h['text']), None)
    if jesus_heading:
        print(f"  ✓ re 22 → '{jesus_heading['text']}' (before_verse={jesus_heading['before_verse']})")
    else:
        print(f"  ✗ re 22 → 'Jesus Vem em Breve' NÃO encontrado")
        print(f"    Headings: {re22}")
        all_ok = False

    return all_ok


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=== Extrator de Subtítulos — Bíblia NVI ===\n")

    data = extract_subtitles(PDF_PATH)

    # Estatísticas
    total_books = len(data)
    total_chapters = sum(len(chapters) for chapters in data.values())
    total_headings = sum(
        len(headings)
        for chapters in data.values()
        for headings in chapters.values()
    )
    print(f"\nExtração concluída:")
    print(f"  Livros com subtítulos: {total_books}")
    print(f"  Capítulos com subtítulos: {total_chapters}")
    print(f"  Total de subtítulos: {total_headings}")

    # Verifica exemplos
    ok = verify_examples(data)
    if not ok:
        print("\n[ATENÇÃO] Alguns exemplos do PRD não foram encontrados.")
        print("          Verifique o mapeamento e a lógica de before_verse.")

    # Salva o JSON
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nJSON salvo em: {OUTPUT_PATH}")

    # Mostra amostra de Genesis e Mateus para inspeção rápida
    print("\n=== AMOSTRA: Gênesis (primeiros 5 capítulos) ===")
    gn = data.get("gn", {})
    for ch in sorted(gn.keys(), key=int)[:5]:
        print(f"  Gn {ch}: {gn[ch]}")

    print("\n=== AMOSTRA: Mateus capítulo 1 ===")
    mt1 = data.get("mt", {}).get("1", [])
    print(f"  Mt 1: {mt1}")

    print("\n=== AMOSTRA: Apocalipse capítulo 22 ===")
    re22 = data.get("re", {}).get("22", [])
    print(f"  Ap 22: {re22}")


if __name__ == "__main__":
    main()
