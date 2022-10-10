const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "public")));

exports.app = app;
