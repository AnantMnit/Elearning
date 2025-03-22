import express from "express";
import { connectDB } from "./database/db.js";
import dotenv from "dotenv";


dotenv.config();

const app = express();

//using middlewares
app.use(express.json()); 

const port = process.env.PORT;

app.get("/", (req, res) => {
    res.send("Server is Working");
})

// importing routes

import userRoutes from './routes/user.js'

// using routes

app.use("/api", userRoutes);



app.listen(port, ()=>{
    console.log(`Server is running on http://localhost:${port}`);
    connectDB()
})