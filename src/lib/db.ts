import { neon } from "@neondatabase/serverless";

type DatabaseStatus = {
  ok: boolean;
  label: string;
  message: string;
};

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;

function getSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = neon(databaseUrl);
  }

  return sqlClient;
}

export async function checkDatabase(): Promise<DatabaseStatus> {
  const sql = getSqlClient();

  if (!sql) {
    return {
      ok: false,
      label: "Neon pendiente",
      message: "Agrega DATABASE_URL para activar la base de datos.",
    };
  }

  try {
    const result = (await sql`select now() as current_time`) as Array<{
      current_time?: string | Date;
    }>;
    const currentTime = result[0]?.current_time;

    return {
      ok: true,
      label: "Neon conectado",
      message: `Postgres respondio correctamente${currentTime ? `: ${currentTime}` : "."}`,
    };
  } catch {
    return {
      ok: false,
      label: "Neon sin conexion",
      message: "DATABASE_URL existe, pero la consulta de prueba fallo.",
    };
  }
}
