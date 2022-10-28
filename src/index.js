const express = require('express');
const cors = require('cors');
const parser = require("body-parser");
const testRouter = require('./routes');
const env = require('dotenv');

const server = express();
env.config();

server.use(cors());
server.use(parser.json());
server.use(express.urlencoded({ extended: false }));
server.use(process.env.API_PATH, testRouter);

server.listen(process.env.API_PORT, () => {
    console.log(`Server is up, at port: ${process.env.API_PORT}`);
});