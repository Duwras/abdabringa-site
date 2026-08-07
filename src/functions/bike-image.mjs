import { getStore } from '@netlify/blobs';

/* Feltöltött készletkép kiszolgálása.
   A netlify.toml a /api/bike-image/:id címről irányít ide,
   az azonosítót az ?id= paraméterben kapjuk.

   Az azonosító UUID és sosem kerül újrahasznosításra, ezért a
   válasz korlátlanul cache-elhető.

   FIGYELEM: ez a fájl a forrás — lásd src/functions/bikes.mjs. */

const STORE_NAME = 'bringazol-keszlet';
const IMG_PREFIX = 'img/';

export default async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return new Response('Not found', { status: 404 });

  const store = getStore(STORE_NAME);
  const entry = await store.getWithMetadata(IMG_PREFIX + id, { type: 'stream' });
  if (!entry) return new Response('Not found', { status: 404 });

  return new Response(entry.data, {
    headers: {
      'content-type': entry.metadata?.type || 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable'
    }
  });
};
