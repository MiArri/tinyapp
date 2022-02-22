const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
//using ejs template
app.set("view engine", "ejs");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 63));
  }
   return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//home page
app.get("/", (req, res) => {
  res.send("Hello!");
});

//get data from json(urlDatabase)
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//new route handler for "/urls"
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

//hello page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//get a new URL
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

//generate a short URL
app.post("/urls", (req, res) => {
  const longUrl = req.body.longURL
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = longUrl;
  res.redirect(`/urls/${shortURL}`);
});
//redirect to the long URL if a short one is not found
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  if(!longURL) {
    res.render("not_found", { shortURL });
  } else {
    res.redirect(longURL);
  }
});

//route to render urls_show.ejs template
app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];

  if(!longURL) {
    res.render("not_found", { shortURL });
  } else {
    res.render("urls_show", { shortURL, longURL });
  }
});

//Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
})

//update the shortened url
app.post("/urls/:id", (req, res) => {
  const URLId = req.params.id;
  const newURL = req.body.newURL;
  urlDatabase[URLId] = newURL;
  res.redirect("/urls");
})

//server listens
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});