import os
import re
import json
import argparse
import tempfile
import subprocess
from pathlib import Path
from typing import Iterable, Optional

from dotenv import load_dotenv

try:
    import torch
    import torchaudio
    from omnivoice import OmniVoice
except Exception:
    torch = None
    torchaudio = None
    OmniVoice = None

try:
    from supabase import create_client
except Exception:
    create_client = None

load_dotenv()


def normalize_for_tts(text: str) -> str:
    text = text.replace('\\"', '"')
    text = text.replace('“', '')
    text = text.replace('”', '')
    text = text.replace('‘', '')
    text = text.replace('’', '')
    text = text.replace('"', '')
    text = text.replace('\\', ' ')
    text = text.replace('/', ' ')
    text = text.replace('—', ', ')
    text = text.replace('–', ', ')
    text = text.replace('…', '. ')
    text = text.replace('SENHOR', 'Senhor')
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def split_into_chunks(text: str, max_chars: int = 1800) -> list[str]:
    parts = re.split(r'(?<=[\.!?;:])\s+', text)
    chunks = []
    current = []
    current_len = 0

    for part in parts:
        part = part.strip()
        if not part:
            continue

        if current_len + len(part) + 1 > max_chars and current:
            chunks.append(' '.join(current).strip())
            current = [part]
            current_len = len(part)
        else:
            current.append(part)
            current_len += len(part) + 1

    if current:
        chunks.append(' '.join(current).strip())

    return chunks


def chapter_intro(book_name: str, chapter_number: int) -> str:
    return f'{book_name}, capítulo {chapter_number}. '


def build_chapter_text(book_name: str, chapter_number: int, verses: list[str], include_intro: bool = True) -> str:
    cleaned = [normalize_for_tts(v) for v in verses if isinstance(v, str) and v.strip()]
    body = ' '.join(cleaned).strip()
    if include_intro:
        return chapter_intro(book_name, chapter_number) + body
    return body


def ffmpeg_exists() -> bool:
    try:
        subprocess.run(
            ['ffmpeg', '-version'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=True
        )
        return True
    except Exception:
        return False


def wav_to_mp3(wav_path: Path, mp3_path: Path, bitrate: str = '128k') -> None:
    subprocess.run(
        [
            'ffmpeg',
            '-y',
            '-i',
            str(wav_path),
            '-codec:a',
            'libmp3lame',
            '-b:a',
            bitrate,
            str(mp3_path)
        ],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )


def concat_wavs(input_paths: list[Path], output_path: Path) -> None:
    with tempfile.NamedTemporaryFile('w', suffix='.txt', delete=False, encoding='utf-8') as f:
        for p in input_paths:
            f.write(f"file '{str(p).replace(chr(92), '/')}'\n")
        list_file = f.name

    try:
        subprocess.run(
            [
                'ffmpeg',
                '-y',
                '-f',
                'concat',
                '-safe',
                '0',
                '-i',
                list_file,
                '-c',
                'copy',
                str(output_path)
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    finally:
        try:
            os.remove(list_file)
        except OSError:
            pass


class BibleAudioGenerator:
    def __init__(self, model_id: str, device: Optional[str] = None):
        self.model_id = model_id
        self.device = device or ('cuda:0' if torch and torch.cuda.is_available() else 'cpu')
        self.model = None

    def load(self):
        if OmniVoice is None or torch is None or torchaudio is None:
            raise RuntimeError(
                'Dependências não instaladas. Instale torch, torchaudio e omnivoice na sua venv.'
            )

        model_dtype = torch.float16 if self.device.startswith('cuda') else torch.float32
        self.model = OmniVoice.from_pretrained(
            self.model_id,
            device_map=self.device,
            dtype=model_dtype
        )
        return self

    def generate_wav(
        self,
        text: str,
        out_path: Path,
        pitch: str = 'low',
        speed: float = 0.95,
        style: str = 'clear',
        sample_rate: int = 24000
    ):
        audio = self.model.generate(
            text=text,
            pitch=pitch,
            speed=speed,
            style=style
        )
        torchaudio.save(str(out_path), audio[0].cpu(), sample_rate)


class SupabaseUploader:
    def __init__(self, url: str, key: str, bucket: str):
        if create_client is None:
            raise RuntimeError('Dependência supabase não instalada.')
        self.client = create_client(url, key)
        self.bucket = bucket

    def upload(self, storage_path: str, local_path: Path, upsert: bool = True):
        with open(local_path, 'rb') as f:
            self.client.storage.from_(self.bucket).upload(
                storage_path,
                f,
                file_options={
                    'content-type': 'audio/mpeg',
                    'upsert': str(upsert).lower()
                }
            )

    def public_url(self, storage_path: str) -> str:
        result = self.client.storage.from_(self.bucket).get_public_url(storage_path)
        if isinstance(result, dict):
            return result.get('publicUrl') or result.get('public_url') or ''
        return str(result)


def iter_bible_files(base_dir: Path) -> Iterable[Path]:
    yield from sorted(base_dir.rglob('*.json'))


def estimated_audio_minutes(text: str, words_per_minute: int = 145) -> float:
    words = len(text.split())
    return words / max(words_per_minute, 1)


def estimated_generation_minutes(audio_minutes: float, realtime_factor: float = 0.2) -> float:
    return audio_minutes / max(realtime_factor, 0.01)


def process_book(
    file_path: Path,
    generator: BibleAudioGenerator,
    out_dir: Path,
    uploader: Optional[SupabaseUploader],
    prefix: str,
    version: str,
    include_intro: bool,
    max_chars: int,
    bitrate: str,
    dry_run: bool = False
):
    data = json.loads(file_path.read_text(encoding='utf-8'))
    book_id = data['id']
    book_name = data['name']
    chapters = data['chapters']

    book_out = out_dir / version / book_id
    book_out.mkdir(parents=True, exist_ok=True)

    for chapter_number, verses in enumerate(chapters, start=1):
        final_name = f'{prefix}-{version}-{book_id}-{chapter_number}.mp3' if prefix else f'{version}-{book_id}-{chapter_number}.mp3'
        final_mp3 = book_out / final_name
        storage_path = f'{version}/{book_id}/{final_name}'

        chapter_text = build_chapter_text(
            book_name,
            chapter_number,
            verses,
            include_intro=include_intro
        )

        audio_minutes = estimated_audio_minutes(chapter_text)
        print(f'[{book_id} {chapter_number}] ~{audio_minutes:.1f} min de áudio | {len(chapter_text)} chars')

        if dry_run:
            continue

        chunks = split_into_chunks(chapter_text, max_chars=max_chars)

        temp_wavs = []
        for idx, chunk in enumerate(chunks, start=1):
            wav_path = book_out / f'tmp_{chapter_number}_{idx}.wav'
            generator.generate_wav(chunk, wav_path)
            temp_wavs.append(wav_path)

        merged_wav = book_out / f'tmp_{chapter_number}_full.wav'
        if len(temp_wavs) == 1:
            merged_wav = temp_wavs[0]
        else:
            concat_wavs(temp_wavs, merged_wav)

        wav_to_mp3(merged_wav, final_mp3, bitrate=bitrate)

        if uploader:
            uploader.upload(storage_path, final_mp3, upsert=True)
            public_url = uploader.public_url(storage_path)
            print(f'  uploaded -> {public_url}')
        else:
            print(f'  local -> {final_mp3}')

        for p in temp_wavs:
            if p.exists() and p != merged_wav:
                p.unlink()

        if merged_wav.exists() and merged_wav.name.startswith('tmp_'):
            merged_wav.unlink()


def main():
    parser = argparse.ArgumentParser(
        description='Gerar áudio da Bíblia por capítulo usando OmniVoice e enviar para Supabase.'
    )
    parser.add_argument('--base-dir', default=r'public/bible/pt-br/kja', help='Pasta com os JSONs da Bíblia')
    parser.add_argument('--version', default='kja', help='Versão bíblica')
    parser.add_argument('--prefix', default='free', help='Prefixo do nome do arquivo')
    parser.add_argument('--out-dir', default='generated_audio', help='Pasta de saída local')
    parser.add_argument('--model', default=os.getenv('OMNIVOICE_MODEL', 'k2-fsa/OmniVoice'))
    parser.add_argument('--max-chars', type=int, default=1800)
    parser.add_argument('--bitrate', default='128k')
    parser.add_argument('--include-intro', action='store_true')
    parser.add_argument('--book', default=None, help='ID de um livro específico, ex: 1sm')
    parser.add_argument('--chapter', type=int, default=None, help='Capítulo específico')
    parser.add_argument('--dry-run', action='store_true', help='Só analisa e estima, sem gerar')
    parser.add_argument('--no-upload', action='store_true', help='Não envia ao Supabase')
    args = parser.parse_args()

    if not ffmpeg_exists() and not args.dry_run:
        raise RuntimeError('FFmpeg não encontrado no PATH. Instale o FFmpeg antes de continuar.')

    base_dir = Path(args.base_dir)
    out_dir = Path(args.out_dir)
    files = list(iter_bible_files(base_dir))

    if args.book:
        files = [f for f in files if f.stem == args.book]

    if not files:
        raise FileNotFoundError(f'Nenhum arquivo JSON encontrado em {base_dir}')

    uploader = None
    if not args.no_upload:
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        bucket = os.getenv('SUPABASE_BUCKET', 'audio_cache')

        if url and key:
            uploader = SupabaseUploader(url, key, bucket)
        else:
            print('SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes; seguindo sem upload.')

    generator = None if args.dry_run else BibleAudioGenerator(args.model).load()

    for file_path in files:
        data = json.loads(file_path.read_text(encoding='utf-8'))

        if args.chapter:
            book_id = data['id']
            book_name = data['name']
            verses = data['chapters'][args.chapter - 1]

            chapter_text = build_chapter_text(
                book_name,
                args.chapter,
                verses,
                include_intro=args.include_intro
            )

            audio_minutes = estimated_audio_minutes(chapter_text)
            estimate = estimated_generation_minutes(audio_minutes, realtime_factor=0.2)

            print(f'Estimativa {book_id} {args.chapter}: áudio ~{audio_minutes:.1f} min | geração CPU ~{estimate:.1f} min')

            if not args.dry_run:
                temp_data = {
                    'id': book_id,
                    'name': book_name,
                    'chapters': [verses]
                }

                out_dir.mkdir(parents=True, exist_ok=True)
                temp_file = out_dir / f'{book_id}_chapter_{args.chapter}.json'
                temp_file.write_text(json.dumps(temp_data, ensure_ascii=False), encoding='utf-8')

                process_book(
                    temp_file,
                    generator,
                    out_dir,
                    uploader,
                    args.prefix,
                    args.version,
                    args.include_intro,
                    args.max_chars,
                    args.bitrate,
                    dry_run=False
                )

                temp_file.unlink(missing_ok=True)

            continue

        process_book(
            file_path,
            generator,
            out_dir,
            uploader,
            args.prefix,
            args.version,
            args.include_intro,
            args.max_chars,
            args.bitrate,
            dry_run=args.dry_run
        )


if __name__ == '__main__':
    main()