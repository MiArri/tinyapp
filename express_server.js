const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { emailLookup, getCurrentUser, urlsForUser } = require('./helpers/helpers');

const app = express();
const PORT = 8080; // default port 8080

//using ejs template
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());


const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 63));
  }
   return result;
};

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

//register
app.get("/register", (req, res) => {
  const templateVars = {
    user: getCurrentUser(req, users) || {}
  };

  return res.render("register", templateVars);
});

//register and add a new user to global users object
app.post("/register", (req, res) => {
  const { email, password} = req.body;

  if (email === "" || password === "") {
    res.status(400).send();
    return;
  }
  if (emailLookup(email, users)) {
    res.status(400).send();
    return;
  }

  const id = generateRandomString();
  const newUser = {id, email, password};
  users[id] = newUser;
  res.cookie("user_id", id);

  return res.redirect("/urls");
 });

//login
app.get("/login", (req, res) => {
  const templateVars = {
    user: getCurrentUser(req, users) || {}
  };
  return res.render("login", templateVars);
});

//login and cookie
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = emailLookup(email, users);
  if (!user) {
    return res
      .status(403)
      .render("register", { user: {} });
  }

  if (user.password !== password) {
    return res
      .status(403)
      .render("login", { user: {} });
  }

  res.cookie("user_id", user.id);
  res.redirect('/urls');
});

//clear cookies and log out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
});

//login prompt
app.get("/login_prompt", (req, res) => {
  return res.render("login_prompt");
});

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
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login_prompt');
  }

  const templateVars = {
    urls: urlsForUser(urlDatabase, user.id),
    user
  };
  res.render("urls_index", templateVars);
});

//get a new URL
app.get("/urls/new", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login_prompt');
  }

  res.render("urls_new", { user });
});



//generate a short URL
app.post("/urls", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login_prompt');
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL,
    userId: user.id
  };
  res.redirect(`/urls/${shortURL}`);
});

//redirect to the long URL if a short one is not found, if user is not logged in, redirect to login
app.get("/u/:shortURL", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login_prompt');
  }

  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (!url) {
    return res.render("not_found", { shortURL, user });
  }

  //if the URL with the matching :id does not belong to them
  if (url.userId !== user.id) {
    return res.redirect('/url_doesnt_belong');
  }

  res.redirect(url.longURL);
});

//route to render urls_show.ejs template
app.get("/urls/:shortURL", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login_prompt');
  }

  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    return res.render("not_found", { shortURL, user });
  }

  const longURL = urlDatabase[shortURL].longURL;
  res.render("urls_show", { shortURL, longURL, user });
});


//Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login_prompt');
  }

  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//update or edit the short url
app.post("/urls/:shortURL", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login_prompt');
  }

  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) {
    res.render("not_found", { shortURL, user });
  }

  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
});

//server listens
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});