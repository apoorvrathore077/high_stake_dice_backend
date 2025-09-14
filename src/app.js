import express from "express";
import gameRoutes from "./routes/game.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();
app.use(express.json())

app.use('/api/game/',gameRoutes);
app.use('/api/users',userRouter);
app.get('/',(req,res) =>{
    res.send("Welcome to dice game api");
});

export default app;