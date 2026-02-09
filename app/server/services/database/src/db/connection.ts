// TODO: create connection and export it 
import mysql from "mysql2/promise"

export const db = mysql.createPool({
    
    //hard coded values
    host: 'database',
    port: 3306,
    user: 'root',
    password: 'a',
    database: "Finus"

});

