import express from 'express'

const app = express()

const port = 5000;

app.get("/", (req, res) => {
    res.send("Server is Working");
})

app.listen(port, ()=>{
    console.log(`Server is running on https://localhost:${port}`);
})