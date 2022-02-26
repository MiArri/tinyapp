const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");

const password = "purple-monkey-dinosaur"; // found in the req.params object
const { generateRandomString, getUserByEmail, getCurrentUser, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

//using ejs template
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'cookiemonster',
  keys: ['my secret key', 'yet another secret key']
}));


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
  const { email, password } = req.body;

  if (email === "" || password === "") {
    return res.render('email_is_empty', { user: {} });
  }

  if (getUserByEmail(email, users)) {
    return res.render('email_exists', { user: {} });
  }

  //hash password
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const id = generateRandomString();
  const newUser = { id, email, password: hash };

  users[id] = newUser;
  req.session.user = id;

  return res.redirect("/urls");
});

//login
app.get("/login", (req, res) => {
  const templateVars = {
    user: getCurrentUser(req, users) || {},
    error: false
  };
  return res.render("login", templateVars);
});

//login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(403).render("register", { user: {} });
  }

  //hash password and check if the password matches
  if (bcrypt.compareSync(password, user.password)) {
    req.session.user = user.id;
    res.redirect('/urls');
  } else {
    res.status(403).render("login", { user: {}, error: true });
  }
});


//clear cookies and log out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

//login prompt
app.get("/login_prompt", (req, res) => {
  return res.render("login_prompt");
});

//home page
app.get("/", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.redirect('/login');
  }
  return res.redirect('/urls');
});

//get data from json(urlDatabase)
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});


//new route handler for "/urls"
app.get("/urls", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.render("login_prompt");
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
    return res.redirect('/login');
  }

  res.render("urls_new", { user });
});

//generate a short URL
app.post("/urls", (req, res) => {
  const user = getCurrentUser(req, users);

  //if user is not logged in
  if (!user) {
    return res.render("login_prompt");
  }

  const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL,
    userID: user.id
  };

  res.redirect(`/urls/${shortURL}`);
});

//redirect to the long URL if a short one is not found
app.get("/u/:shortURL", (req, res) => {
  //if user is not logged in, prompt to login
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
  if (url.userID !== user.id) {
    return res.render("url_doesnt_belong", { shortURL, user });
  }

  res.redirect(url.longURL);
});

//route to render urls_show.ejs template
app.get("/urls/:shortURL", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.render("login_prompt");
  }

  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (!url) {
    return res.render("not_found", { shortURL, user });
  }

  //if the URL with the matching :id does not belong to them
  if (url.userID !== user.id) {
    return res.render("url_doesnt_belong", { shortURL, user });
  }

  const longURL = url.longURL;
  return res.render("urls_show", {
    shortURL,
    longURL,
    user
  });
});


//Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = getCurrentUser(req, users);
  if (!user) {
    return res.render("login_prompt");
  }

  const shortURL = req.params.shortURL;
  const url = urlDatabase[shortURL];
  if (!url) {
    return res.render("not_found", { shortURL, user });
  }

  //if the URL with the matching :id does not belong to them
  if (url.userID !== user.id) {
    return res.render("url_doesnt_belong", { shortURL, user });
  }

  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//update or edit the short url
app.post("/urls/:id", (req, res) => {
  const user = getCurrentUser(req, users);
  //if a user is not logged in
  if (!user) {
    return res.render("login_prompt");
  }

  const shortURL = req.params.id;
  const url = urlDatabase[shortURL];
  if (!urlDatabase[shortURL]) {
    return res.render("not_found", { shortURL, user });
  }

  //if the URL with the matching :id does not belong to them
  if (url.userID !== user.id) {
    return res.render("url_doesnt_belong", { shortURL, user });
  }

  const newURL = req.body.newURL;
  urlDatabase[shortURL].longURL = newURL;
  res.redirect("/urls");
});

//server listens
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});