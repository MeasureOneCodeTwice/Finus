import { PORT } from "@/port.ts";
import { onExit } from "@/hooks.ts";
import { buildCorsConfig } from "@/corsUtil.ts";
import { Request, Response, NextFunction } from 'express'
import express from "express";
import type { Pool, RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import jwt from 'jsonwebtoken'

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME
});

const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
app.use(express.json());
app.use(buildCorsConfig());

const server = app.listen(PORT, () => {
    console.log(`User Service running on port ${PORT}`);
});
onExit(async () => await server.close());

//test endpoint
app.get("/health", (req: express.Request, res: express.Response) => {
    res.send("ok");
});


interface Transaction extends RowDataPacket {
    id: number;
    financialAccount_id: string;
    amount: number;
    category: string;
    description: string;
    sender: string;
    recipient: string;
    date: string;
}


//authenticaion of JWT - returns user id
export const authenticateJWT = (req: Request) => {
    const authHeader = req.headers.authorization;
    //console.log(req.headers);
    if (!authHeader) {
        throw new Error('Authorization header missing');
    }
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
        throw new Error('Invalid authorization header format');
    }
    const token = parts[1];

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const userId = decoded.sub
    //console.log("user id: " + userId);
    if (!userId) {
        throw new Error('User ID not found in token');
    }

    return userId
};


app.get('/charts/expenses', async (req: express.Request, res: express.Response) => {
    
    
    
    try {
        const userId = authenticateJWT(req);
        // console.log("User authenticated with ID:", userId);
        const period = req.query.period as string;
        const connection = await pool.getConnection();

        if (!["w", "m", "y"].includes(period)) {
        return(res.status(400).json({ error: "Invalid period. Must be 'w', 'm', or 'y'." }));
    }
        const endDate = new Date();
        let startDate = new Date();
        let dateFormat: string = '%Y-%m-%d';
        let groupBy: string;
        let selectFormat: string;
        
        switch(period) {
            case 'w':
                startDate.setDate(endDate.getDate() - 7);
                dateFormat = '%Y-%m-%d';
                groupBy = 'DAY';
                selectFormat = 'DATE(date)';
                break;
            case 'm':
                startDate.setDate(endDate.getDate() - 30);
                dateFormat = '%Y-%m-%d';
                groupBy = 'DAY';
                selectFormat = 'DATE(date)';
                break;
            case 'y':
                startDate.setDate(endDate.getDate() - 365);
                dateFormat = '%Y-%m';
                groupBy = 'MONTH';
                selectFormat = 'DATE_FORMAT(date, "%Y-%m-01")'; //first day of month for grouping
                break;
            default:
                return(res.status(400).json({ error: "Invalid period. Must be 'w', 'm', or 'y'." }));
        }
        
        const startDateStr = startDate.toISOString().slice(0, 10); // YYYY-MM-DD
        const endDateStr = endDate.toISOString().slice(0, 10);
        
        //grabs all transactions that are less than 0 in amount 
        const query = `
            SELECT 
                ${selectFormat} as date_group,
                DATE_FORMAT(t.date, ?) as label,
                SUM(ABS(t.amount)) as total_expenses
            FROM finus.transaction t
            JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
            JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
            JOIN finus.profile p ON pfa.profile_id = p.id
            JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
            JOIN finus.finusAccount u ON uap.account_id = u.id
            WHERE t.amount < 0 
                AND u.id = ?
                AND t.date >= ? 
                AND t.date <= ?
            GROUP BY date_group, DATE_FORMAT(t.date, ?)
            ORDER BY date_group ASC
        `;
        
        const [rows] = await connection.query(query, [dateFormat, userId,startDateStr, endDateStr, dateFormat]);
        
        connection.release() 
        
        //makes a complete date range even with days of no transactions
        const allLabels = generateDateRange(startDate, endDate, period);
        const dataMap = new Map();
        
        if (Array.isArray(rows)) {
            rows.forEach((row: any) => {
                dataMap.set(row.label, Number(row.total_expenses));
            });
            //console.log(`Found ${rows.length} expense records`);
        }
        
        const data = allLabels.map(label => dataMap.get(label) || 0);
        
        const periodLabels = {
            'w': 'Weekly Expenses',
            'm': 'Monthly Expenses',
            'y': 'Yearly Expenses'
        };
        //console.log("Found data:", data);
        res.json({
            labels: allLabels,
            datasets: [{
                label: periodLabels[period as keyof typeof periodLabels],
                data
            }]
        });
        
    } catch (error) {
        console.error('Error fetching expenses chart data:', error);
        res.status(500).json({ error: 'Failed to fetch expenses chart data' });
    }
});

//this gets all transactions for now - can be capped to a certain amount in the future when any user reaches over 100k transactions
app.get('/table/trasactions', async (req: express.Request, res: express.Response) => {
    try {
        console.log("Fetching transactions...");
        const userId = authenticateJWT(req);
        const connection = await pool.getConnection();
        const query = `
            SELECT *
            FROM finus.transaction t
            JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
            JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
            JOIN finus.profile p ON pfa.profile_id = p.id
            JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
            JOIN finus.finusAccount u ON uap.account_id = u.id
            WHERE u.id = ?
            ORDER BY t.date DESC
        `;
        
        const [rows] = await connection.query<Transaction[]>(query, [userId]);
        connection.release();
        const dataMap = new Map();

        //get first and last names of the user associated with the first transaction
        let first_name = rows[0]? rows[0].first_name: "";
        let last_name = rows[0]? rows[0].last_name: "";

        if (Array.isArray(rows)) {
            rows.forEach((row: any) => {
                if(!row.sender){//these cases really only appear because of the populator script
                    row.sender = first_name + " " + last_name;
                }
                if (!row.recipient){
                    row.recipient = first_name + " " + last_name;
                }
                console.log(row);
            });
        }
        res.json(rows);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});


//gets the following totals as massively aggregated values:
// total balance - combined sum of all account balances
// current income - YTD sum of all positive transactions
// average expenses - YTD average of all negative transactions
// current debt - sum of all credit_card accounts of subtype 'loan'
// total savings - sum of all savings accounts
app.get('/table/snapshot', authenticateJWT, async (req: express.Request, res: express.Response) => {
    let connection;
    try {
        const userId = authenticateJWT(req);
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        connection = await pool.getConnection();

        const today = new Date();
        const ytdStart = new Date(today.getFullYear(), 0, 1);
        const ytdStartStr = ytdStart.toISOString().slice(0, 10);
        const todayStr = today.toISOString().slice(0, 10);
        const monthsPassed = today.getMonth() + 1;

        //single massive query to get all the data - this is apparently more efficient than multiple queries
        const [results] = await connection.query(`
            SELECT 
                -- Total Balance
                (SELECT COALESCE(SUM(fa.balance), 0)
                 FROM finus.financialAccount fa
                 JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
                 JOIN finus.profile p ON pfa.profile_id = p.id
                 JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
                 WHERE uap.account_id = ?) as total_balance,
                
                -- Current Income (YTD)
                (SELECT COALESCE(SUM(t.amount), 0)
                 FROM finus.transaction t
                 JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
                 JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
                 JOIN finus.profile p ON pfa.profile_id = p.id
                 JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
                 WHERE uap.account_id = ? 
                     AND t.amount > 0 
                     AND t.date BETWEEN ? AND ?) as current_income,
                
                -- Total Expenses (YTD)
                (SELECT COALESCE(SUM(ABS(t.amount)), 0)
                 FROM finus.transaction t
                 JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
                 JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
                 JOIN finus.profile p ON pfa.profile_id = p.id
                 JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
                 WHERE uap.account_id = ? 
                     AND t.amount < 0 
                     AND t.date BETWEEN ? AND ?) as total_expenses,
                
                -- Transaction Count (for averaging)
                (SELECT COUNT(*)
                 FROM finus.transaction t
                 JOIN finus.financialAccount fa ON t.financialAccount_id = fa.id
                 JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
                 JOIN finus.profile p ON pfa.profile_id = p.id
                 JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
                 WHERE uap.account_id = ? 
                     AND t.amount < 0 
                     AND t.date BETWEEN ? AND ?) as transaction_count,
                
                -- Current Debt (credit_card with loan subtype)
                (SELECT COALESCE(SUM(fa.balance), 0)
                 FROM finus.financialAccount fa
                 JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
                 JOIN finus.profile p ON pfa.profile_id = p.id
                 JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
                 WHERE uap.account_id = ? 
                     AND fa.type = 'credit_card' 
                     AND fa.subtype = 'loan') as current_debt,
                
                -- Total Savings
                (SELECT COALESCE(SUM(fa.balance), 0)
                 FROM finus.financialAccount fa
                 JOIN finus.profile_financialAccount pfa ON fa.id = pfa.financialAccount_id
                 JOIN finus.profile p ON pfa.profile_id = p.id
                 JOIN finus.finusAccount_profile uap ON p.id = uap.profile_id
                 WHERE uap.account_id = ? 
                     AND fa.type = 'savings') as total_savings
        `, [
            userId, userId, ytdStartStr, todayStr,  // for total_balance and current_income
            userId, ytdStartStr, todayStr,          // for total_expenses
            userId, ytdStartStr, todayStr,          // for transaction_count
            userId,                                 // for current_debt
            userId                                  // for total_savings
        ]);

        connection.release();

        const data = (results as any[])[0];
        const avgMonthlyExpenses = monthsPassed > 0 ? data.total_expenses / monthsPassed : 0;

        const response = {
            totalBalance: data.total_balance || 0,
            currentIncome: data.current_income || 0,
            averageExpenses: Math.round(avgMonthlyExpenses * 100) / 100,
            currentDebt: data.current_debt || 0,
            totalSavings: data.total_savings || 0
        };

        res.json(response);

    } catch (error) {
        console.error('Error fetching snapshot data:', error);
        if (connection) {
            connection.release();
        }
        res.status(500).json({ error: 'Failed to fetch snapshot data' });
    }
});



//helper method for making a complete date range
function generateDateRange(start: Date, end: Date, period: string): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    
    while (current <= endDate) {
        if (period === 'y') {
            //monthly labels for year period
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            dates.push(`${year}-${month}`);
            current.setMonth(current.getMonth() + 1);
        } else {
            //day-basis labels for everything else - week and month
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            const day = String(current.getDate()).padStart(2, '0');
            dates.push(`${year}-${month}-${day}`);
            current.setDate(current.getDate() + 1);
        }
    }
    
    return dates;
}

