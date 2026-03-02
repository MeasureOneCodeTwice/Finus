import { PORT } from "@/port.ts";
import { onExit } from "@/hooks.ts";
import { buildCorsConfig } from "@/corsUtil.ts";
import express from "express";
import type { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  user: 'root',//process.env.MYSQL_USER, // ------------------------------------ Needs fixing, finus_app gets denied access, this might be an issue of accessing the db from outside its container
  password: process.env.MYSQL_PASSWORD,
  database: process.env.DB_NAME
});



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


app.get('/charts/expenses', async (req: express.Request, res: express.Response) => {
    const period = req.query.period as string;
    const connection = await pool.getConnection();

    if (!["w", "m", "y"].includes(period)) {
        return(res.status(400).json({ error: "Invalid period. Must be 'w', 'm', or 'y'." }));
    }
    
    try {
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
                DATE_FORMAT(date, ?) as label,
                SUM(ABS(amount)) as total_expenses
            FROM finus.transaction
            WHERE amount < 0 
                AND date >= ? 
                AND date <= ?
            GROUP BY date_group, DATE_FORMAT(date, ?)
            ORDER BY date_group ASC
        `;
        
        const [rows] = await connection.query(query, [dateFormat, startDateStr, endDateStr, dateFormat]);
        
        connection.release() 
        
        //makes a complete date range even with days of no transactions
        const allLabels = generateDateRange(startDate, endDate, period);
        const dataMap = new Map();
        
        if (Array.isArray(rows)) {
            rows.forEach((row: any) => {
                dataMap.set(row.label, Number(row.total_expenses));
            });
            console.log(`Found ${rows.length} expense records`);
        }
        
        const data = allLabels.map(label => dataMap.get(label) || 0);
        
        const periodLabels = {
            'w': 'Weekly Expenses',
            'm': 'Monthly Expenses',
            'y': 'Yearly Expenses'
        };
        
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

