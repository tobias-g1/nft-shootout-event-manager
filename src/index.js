
// Imports

import express from "express";

// App

const app = express()

// Require Env
import { config } from "dotenv";

config();

// Start Listening

const listener = app.listen(process.env.PORT || 8083, () => {
    console.log('Listening on port ' + listener.address().port);
});

import './utils/db.js'
// import './events/player.events.js';
import './events/marketplace.events.js';