const path = require("path");
const express = require("express");
var bodyParser = require("body-parser");
const app = express();

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

exports.app = app;