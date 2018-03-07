"use strict";
// system
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;
// server startup
app.use(morgan('combined'));
app.use(express.static('server/assets'));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'server/pages/index.html')));
app.listen(PORT, () => console.log(`lichessapps server listening on ${PORT}`));
