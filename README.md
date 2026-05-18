# Amidnd

Aplicacion Next.js con una portada estilo pergamino y una prueba de conexion server-side a Neon Postgres.

## Desarrollo

```bash
npm install
npm run dev
```

## Variables de entorno

Crea un archivo `.env.local` con:

```bash
DATABASE_URL="postgresql://..."
```

En Vercel, carga la misma variable como `DATABASE_URL` para Production, Preview y Development.
