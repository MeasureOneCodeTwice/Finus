import mysql from "mysql2/promise";

const connectionParams = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
};

export const getConnectionPool = () =>
  mysql.createPool({
    ...connectionParams,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

export type DatabaseStatus = "unhealthy" | "ok";
export const getDatabaseStatus = async (): Promise<DatabaseStatus> => {
  let status: DatabaseStatus;

  try {
    const connection = await mysql.createConnection({
      ...connectionParams,
      connectTimeout: 1000,
    });
    connection.connect();
    connection.end();

    status = "ok";
  } catch (e) {
    console.error(e.code);
    status = "unhealthy";
  }

  return status;
};
