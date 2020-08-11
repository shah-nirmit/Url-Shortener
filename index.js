const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

app.use(helmet());
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.static("./public"));

app.get("/", (req, res) => {
  res.json({
    message: "naughty.sh - Short Urls for you ",
  });
});

// app.post("/url/:id", (req, res) => {
//   //todo:get a short url by id
// });

// app.get("/:id", (req, res) => {
//   //todo:redirect to the url
// });

// app.post("/url", (req, res) => {
//   //todo:create a short url
// });

const port = process.env.port || 1337;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
