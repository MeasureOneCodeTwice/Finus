import { PORT } from "@/port.ts";
import { onExit } from "@/hooks.ts";
import { buildCorsConfig } from "@/corsUtil.ts";
import { Request, Response, NextFunction } from 'express'
import express from "express";
import type { Pool } from "mysql2/promise";
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

