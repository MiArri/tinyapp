const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const { emailLookup } = require('./helpers/helpers');

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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

const getCurrentUser = (req) => {
  const userId = req.cookies["user_id"];
  if (users[userId]) {
    return users[userId];
  }

  return {};
}

//register
app.get("/register", (req, res) => {
  const templateVars = {
    user: getCurrentUser(req)
  };

  return res.render("register", templateVars);
});

//reister and add a new user to global users object
 app.post("/register", (req, res) => {
  const { email, password} = req.body;
  const id = generateRandomString();
  const user = emailLookup(email, users);

  if (!email || !password) {
    return res.redirect("/register")
  };
  if (email === "" || password === "") {
    return res.status(400);
  };
  if (!emailLookup(email, users)) {
    return res.status(400);
  };
  if (user.password !== password) {
    return res.status(403);
  };
  if (user.email !== email) {
    return res.status(403);
  };
  const newUser = {id, email, password};
  users[id] = newUser;
  res.cookie("user_id", id);

  return res.redirect("/urls");
 });

//login
app.get("/login", (req, res) => {
  const templateVars = {
    user: getCurrentUser(req)
  };
  return res.render("login", templateVars);
});

//login and cookie
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = emailLookup(email, users);
  if (!user) {
    res.redirect('/register');
    return res.status(403);
  }

  if (user.password !== password) {
    res.redirect('/login');
    return res.status(403);
  }

  res.cookie("user_id", user.id);
  res.redirect('/urls');
});

//clear cookies and log out
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
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
  const templateVars = {
    urls: urlDatabase,
    user: getCurrentUser(req)
  };
  res.render("urls_index", templateVars);
});

//get a new URL
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: getCurrentUser(req)
  };
  res.render("urls_new", templateVars);
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
  const templateVars = {
    user: getCurrentUser(req)
  };

  if(!longURL) {
    res.render("not_found", { shortURL }, templateVars);
  } else {
    res.render("urls_show", { shortURL, longURL }, templateVars);
  }
});

//Delete a URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

//update the shortened url
app.post("/urls/:id", (req, res) => {
  const URLId = req.params.id;
  const newURL = req.body.newURL;
  urlDatabase[URLId] = newURL;
  res.redirect("/urls");
});

//server listens
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});