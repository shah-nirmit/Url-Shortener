//import required packages
const path = require("path");
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const yup = require("yup");
const monk = require("monk");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { nanoid } = require("nanoid");

//use dotenv for local env variables
require("dotenv").config();

//connect to db and get the 'urls' database and create a index for slug to be unique
const db = monk(process.env.MONGOLAB_URI);
const urls = db.get("urls");
urls.createIndex({ slug: 1 }, { unique: true });

//initialise express app
const app = express();
app.enable("trust proxy");

//use helmet for securing the http requests by suppling various HTTP-Headers   and morgan for logging the requests easy to debug
app.use(helmet());
app.use(morgan("common"));

//to recognise the incoming response as a json request
app.use(express.json());

// serve the static files present in directory specified
app.use(express.static("./public"));

// set the path for 404 file
const notFoundPath = path.join(__dirname, "public/404.html");

//get request to redirect to specified website according to slug
app.get("/:id", async (req, res, next) => {
  const { id: slug } = req.params; //get the values from json request object
  try {
    const url = await urls.findOne({ slug }); //find the object matching the specified slug
    if (url) {
      return res.redirect(url.url);
    }
    //if not found return 404 status and respective html page
    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    return res.status(404).sendFile(notFoundPath);
  }
});

//define the table schema
const schema = yup.object().shape({
  slug: yup
    .string()
    .trim()
    .matches(/^[\w\-]+$/i),
  url: yup.string().trim().url().required(),
});

//post req to store the slug to database
app.post(
  "/url",
  slowDown({
    //slowdown the site response if multiple req made within 30s
    windowMs: 30 * 1000,
    delayAfter: 1,
    delayMs: 500,
  }),
  rateLimit({
    windowMs: 30 * 1000,
    max: 1,
  }),
  async (req, res, next) => {
    let { slug, url } = req.body;
    try {
      await schema.validate({
        //validate with table schemas
        slug,
        url,
      });
      if (url.includes("naughty.sh")) {
        throw new Error("Stop it. 🛑");
      }
      if (!slug) {
        slug = nanoid(5);
      } else {
        const existing = await urls.findOne({ slug });
        if (existing) {
          throw new Error("Slug in use. 🍔");
        }
      }
      slug = slug.toLowerCase();
      const newUrl = {
        url,
        slug,
      };
      const created = await urls.insert(newUrl);
      res.json(created);
    } catch (error) {
      next(error);
    }
  }
);

app.use((req, res, next) => {
  res.status(404).sendFile(notFoundPath);
});

app.use((error, req, res, next) => {
  if (error.status) {
    res.status(error.status);
  } else {
    res.status(500);
  }
  res.json({
    message: error.message,
    stack: process.env.NODE_ENV === "production" ? "🥞" : error.stack,
  });
});

const port = process.env.PORT || 1337;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
