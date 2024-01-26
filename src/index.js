// require("dotenv").config({ path: "./.env" });
import dotenv from "dotenv";
import connectDB  from "./db/dbConnect.js";

dotenv.config({
    path: './.env'
})

connectDB();













/*
IIFE (Immediately Invoked Function Expression)

import express from "express";
const app = express();

( async ()=> {
    try {
        dotenv.config({
            path: './.env'
        })
        const connect = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error)=> {
            console.log("ERROR:", error)
            throw error;
        })

        console.log("MongoDB Connected: ", connect.connection.host);

        app.listen(process.env.PORT, ()=>{
            console.log(`App is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR:", error);
        throw error;
    }
})()

*/
