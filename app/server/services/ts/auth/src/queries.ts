import type { UserWithPassword } from "./types";
export async function getUserByEmail(
  email: string,
  pool,
): Promise<UserWithPassword> {
  const [rows] = await pool.execute<UserWithPassword[]>(
    `
      SELECT
        a.id,
        a.username,
        a.email,
        a.first_name,
        a.last_name,
        a.age,
        c.pw_hash
      FROM finusAccount a
      JOIN credentials c ON c.finus_account_id = a.id
      WHERE a.email = ?
      LIMIT 1
    `,
    [email],
  );

  if (rows.length === 0) {
    throw new Error("User not found");
  }

  rows[0].pw_hash = rows[0].pw_hash.toString();
  return rows[0];
}

export async function accountWithEmailExists(
  email: string,
  pool,
): Promise<boolean> {
  return await pool
    .execute(`SELECT COUNT(*) as count FROM finusAccount WHERE email = ?`, [
      email,
    ])
    .then((x) => {
      return x[0][0].count > 0;
    });
}

export async function createUser(user: UserWithPassword, pool): void {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [accountInsert] = await connection.execute(
      `
        INSERT INTO finusAccount (username, email, first_name, last_name, age)
        VALUES (?, ?, ?, ?, ?)
     `,
      [user.username, user.email, user.first_name, user.last_name, user.age],
    );

    console.log("Executed insert into finus account");

    await connection.execute(
      `
        INSERT INTO credentials (finus_account_id, pw_hash)
        VALUES (?, ?)
     `,
      [accountInsert.insertId, user.pw_hash],
    );

    console.log("User created with ID:", accountInsert.insertId);

    await connection.commit();
    connection.release();
  } catch (error) {
    await connection.rollback();
    connection?.release();

    console.error(error);
    //eslint-disable-next-line preserve-caught-error
    throw new Error("Could not create account");
  }
}
