import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import type { Transaction } from "../types/Transaction.ts";
interface TransactionRow extends RowDataPacket, Transaction {}

export async function getAllTransactionsQuery(
  pool: Pool,
  userId: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*, u.first_name, u.last_name
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    JOIN finus.profile p ON pfa.profile_id = p.id
    JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
    JOIN finus.finusAccount u ON uap.account_id = u.id
    WHERE u.id = ?
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [userId]);
  return rows;
}

export async function getTransactionAccountNames(
  pool: Pool,
  financialAccountIds: number[],
): Promise<Record<number, string>> {
  if (financialAccountIds.length === 0) {
    return {};
  }
  const query = `SELECT id, name FROM finus.financialAccount WHERE id IN (${financialAccountIds.join(", ")});`;

  const [rows] = await pool.query(query);
  const accountIdToNameMap: Record<number, string> = {};
  for (const row of rows as RowDataPacket[]) {
    accountIdToNameMap[row.id] = row.name;
  }
  return accountIdToNameMap;
}

export async function findTransactionsBy(
  db: Pool,
  financialAccountId: string,
): Promise<Transaction[]> {
  const query = `
    SELECT * FROM finus.transaction t
    WHERE t.financialAccount_id = ?
    ORDER BY t.date DESC
  `;

  const [rows] = await db.execute<Transaction[]>(query, [financialAccountId]);
  return rows;
}

export async function getDateCategoryTransactionsQuery(
  pool: Pool,
  profileId: number,
  category: string,
  from: Date,
  to: Date,
): Promise<Transaction[]> {
  //convert dates to MySQL format
  const fromStr = from.toISOString().slice(0, 19).replace("T", " ");
  const toStr = to.toISOString().slice(0, 19).replace("T", " ");

  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ? 
      AND t.date >= ? 
      AND t.date <= ?
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [
    profileId,
    category,
    fromStr,
    toStr,
  ]);
  return rows;
}

export async function getProfileCategoryTransactionsQuery(
  pool: Pool,
  profileId: number,
  category: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ?
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [profileId, category]);
  return rows;
}

//returns all savings and expenses for a specific transaciton category
export async function getProfileCategorySavingsQuery(
  pool: Pool,
  profileId: number,
  category: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ?
      AND t.amount > 0
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [profileId, category]);
  return rows;
}

//get only expenses (negative amounts) for a category
export async function getProfileCategoryExpensesQuery(
  pool: Pool,
  profileId: number,
  category: string,
): Promise<Transaction[]> {
  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE pfa.profile_id = ? 
      AND t.category = ?
      AND t.amount < 0
    ORDER BY t.date DESC
  `;

  const [rows] = await pool.query<Transaction[]>(query, [profileId, category]);
  return rows;
}

//creates a single transaction
export async function createTransactionQuery(
  pool: Pool,
  financialAccountId: number,
  amount: number,
  category: string,
  date: Date,
  sender: string,
  recipient: string,
  description: string,
): Promise<boolean> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      `INSERT INTO finus.transaction (financialAccount_id, amount, category, date, sender, recipient, description) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        financialAccountId,
        amount,
        category,
        date,
        sender,
        recipient,
        description,
      ],
    );

    if ((result as ResultSetHeader).affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteTransactionQuery(
  pool: Pool,
  transactionId: number,
  profileId: number,
): Promise<boolean> {
  const query = `
    DELETE t
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE t.id = ? AND pfa.profile_id = ?
  `;

  const [result] = await pool.query<ResultSetHeader>(query, [
    transactionId,
    profileId,
  ]);
  return result.affectedRows > 0;
}

export async function getTransactionById(
  pool: Pool,
  transactionId: number,
  profileId: number,
): Promise<Transaction | undefined> {
  const query = `
    SELECT t.*
    FROM finus.transaction t
    JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
    JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
    WHERE t.id = ? AND pfa.profile_id = ?
  `;

  const [rows] = await pool.query<TransactionRow[]>(query, [
    transactionId,
    profileId,
  ]);
  return rows[0];
}

export async function updateTransactionQuery(
  pool: Pool,
  transactionId: number,
  profileId: number, //for verification that the user owns this transaction via account
  updates: Partial<Transaction>,
): Promise<Transaction | undefined> {
  //verify the transaction belongs to the user's profile
  const existing = await getTransactionById(pool, transactionId, profileId);
  if (!existing) return undefined;

  //define allowed fields for transaction updates
  const allowedFields = [
    "amount",
    "category",
    "description",
    "sender",
    "recipient",
    "date",
    "financialAccount_id",
  ];

  const setClauses: string[] = [];
  const values: unknown[] = [];

  //build update query dynamically since some fields may not be provided
  for (const field of allowedFields) {
    if (updates[field as keyof Transaction] !== undefined) {
      setClauses.push(`${field} = ?`);
      values.push(updates[field as keyof Transaction]);
    }
  }

  //if no fields to update, return the existing transaction
  if (setClauses.length === 0) {
    return existing;
  }

  values.push(transactionId);

  await pool.query(
    `UPDATE finus.transaction SET ${setClauses.join(", ")} WHERE id = ?`,
    values,
  );

  //fetch the updated transaction
  const [updated] = await pool.query<TransactionRow[]>(
    `SELECT * FROM finus.transaction WHERE id = ?`,
    [transactionId],
  );

  return updated[0];
}

export async function createTransaction(
  pool: Pool,
  financialAccountId: number,
  transactionData: Transaction,
): Promise<Transaction | undefined> {
  const { amount, category, description, sender, recipient, date } =
    transactionData;

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO finus.transaction 
     (financialAccount_id, amount, category, description, sender, recipient, date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      financialAccountId,
      amount,
      category,
      description,
      sender,
      recipient,
      date,
    ],
  );

  const [newTransaction] = await pool.query<TransactionRow[]>(
    `SELECT * FROM finus.transaction WHERE id = ?`,
    [result.insertId],
  );

  return newTransaction[0];
}
