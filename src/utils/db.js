import mongoose from "mongoose";
import { config } from "dotenv";

config();

mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('Connected to database successful'))
    .catch(err => console.error('could not connect to mongo DB', err))

const db = mongoose.connection;

db.once("open", function (callback) {
    console.log("Connection Open");
});

db.on("error", console.error.bind(console, "connection error"));


