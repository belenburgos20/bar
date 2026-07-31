/**
 * Genera las versiones optimizadas del fondo y del logo.
 *
 * Correr con:  npm run images
 *
 * Toma los originales de src/assets/originals/ y escribe AVIF + WebP
 * en src/assets/. Solo hay que volver a correrlo si cambia una imagen.
 */
import sharp from 'sharp';
import { mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const IN = join(root, 'src/assets/originals');
const OUT = join(root, 'src/assets');

/** Anchos del fondo. No se agranda nunca: si el original es más chico, se saltea. */
const BACKGROUND_WIDTHS = [800, 1376, 1920, 2560];

/** El logo se muestra a 120px de lado, así que 2x y 3x alcanzan de sobra. */
const LOGO_WIDTHS = [240, 360];

async function emit(input, name, width, meta) {
  if (width > meta.width) return []; // nunca agrandar: se vería borroso

  const base = sharp(input).resize({ width, withoutEnlargement: true });
  const targets = [
    { ext: 'avif', opts: { quality: 55, effort: 6 } },
    { ext: 'webp', opts: { quality: 78 } },
  ];

  return Promise.all(
    targets.map(async ({ ext, opts }) => {
      const file = join(OUT, `${name}-${width}.${ext}`);
      await base.clone()[ext](opts).toFile(file);
      const { size } = await stat(file);
      return { file: `${name}-${width}.${ext}`, kb: Math.round(size / 1024) };
    }),
  );
}

async function run() {
  await mkdir(OUT, { recursive: true });

  const jobs = [
    { file: 'fondo.png', name: 'fondo', widths: BACKGROUND_WIDTHS },
    { file: 'logo-ey.png', name: 'logo-ey', widths: LOGO_WIDTHS },
  ];

  const present = await readdir(IN);

  for (const { file, name, widths } of jobs) {
    if (!present.includes(file)) {
      console.warn(`  ! falta ${file} en src/assets/originals/ — se saltea`);
      continue;
    }

    const input = join(IN, file);
    const meta = await sharp(input).metadata();
    const original = Math.round((await stat(input)).size / 1024);
    console.log(`\n${file}  ${meta.width}x${meta.height}  ${original} KB`);

    const results = (await Promise.all(widths.map((w) => emit(input, name, w, meta)))).flat();

    for (const { file: out, kb } of results) console.log(`  -> ${out}  ${kb} KB`);

    const skipped = widths.filter((w) => w > meta.width);
    if (skipped.length) {
      console.log(`  (omitidos ${skipped.join(', ')}px: el original mide ${meta.width}px de ancho)`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
