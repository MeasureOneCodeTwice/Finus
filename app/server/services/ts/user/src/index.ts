import { PORT } from "@/port";
import { onExit } from "@/hooks";
import { buildCorsConfig } from "@/corsUtil";
import express from "express";

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

app.get('/charts/expenses', (req: express.Request, res: express.Response) => {
    const period = req.query.period as string;
    if (!["w", "m", "y"].includes(period)) {
        res.status(400).json({ error: "Invalid period. Must be 'w', 'm', or 'y'." });
        return;
    }
    switch(period) {
      case 'w':
        return res.json({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Weekly Expenses',
            data: [125, 89, 210, 45, 167, 92, 78]
          }]
        });
      
      case 'm':
        return res.json({
          labels: ['1 Jan', '2 Jan', '3 Jan', '4 Jan', '5 Jan', '6 Jan', '7 Jan', '8 Jan', '9 Jan', '10 Jan', '11 Jan', '12 Jan',
                  '13 Jan', '14 Jan', '15 Jan', '16 Jan', '17 Jan', '18 Jan', '19 Jan', '20 Jan', '21 Jan', '22 Jan', '23 Jan', '24 Jan',
                  '25 Jan', '26 Jan', '27 Jan', '28 Jan', '29 Jan', '30 Jan', '31 Jan'
                  ],
          datasets: [{
            label: 'Monthly Expenses',
            data: [125, 89, 210, 45, 167, 92, 78, 123, 98, 134, 56, 189, 76, 143, 87, 65, 190, 120,
                  134, 98, 76, 143, 87, 65, 190, 120, 134, 98, 76, 143, 87
                  ]
          }]
        });
      
      case 'y':
        return res.json({
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Yearly Expenses',
            data: [3245, 2987, 3456, 3789, 4123, 3876, 4234, 3987, 3678, 4012, 3789, 4123]
          }]
        });
    }
});
