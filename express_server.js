const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: "session",
  keys: ["key1", "key2"],
  maxAge: 24 * 60 * 60 * 1000
}));

/* ----------------------------------------------------------------------------------- */

const urlDatabase = {};

const users = {
  "userRandomID" : {},
  "user2RandomID": {}
};

const urlINFO = {
  "testid": {
    date: "7/JUN/2019",
    hits: 0,
  },
};

function generateRandomString(){
  let vocab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
  let output = "";
  for (let i = 0; i < 6; i++) {
    output += vocab[Math.floor(Math.random() * vocab.length)];
  }
  return output;
}

function getDate() {
  let date = new Date();
  return date.toDateString();
}

function updateHit(url) {
  let x = urlINFO[url].hits;
  let newHit = x + 1;
  urlINFO[url].hits = newHit;
}

/* ----------------------------------------------------------------------------------- */

app.get("/", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];

  if (user) {
      const templateVars = {
      urls: user.db,
      user: user,
      };
    response.render("urls_index", templateVars);
  } else {
    response.render("urls_login", {});
  }
});


// CREATE NEW URL
app.get("/urls/new", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user: user,
  };
  if (user) {
    response.render("urls_new", templateVars);
  } else {
    response.redirect("/");
  }

});

app.post("/urls/new", (request, response) => {
  let longUrl = request.body.longURL;
  let shortUrl = generateRandomString();
  const user_id = request.session.user_id;
  const user = users[user_id];
  const currentDate = getDate();
  let infoObj = {
    date: currentDate,
    hits: 0,
  };
  if (longUrl && user) {
    user.db[shortUrl] = longUrl;
    urlINFO[shortUrl] = infoObj
    response.redirect(`/urls/${ shortUrl }`);
  } else {
    response.status(400).send("No URL entered.");
  }
});


// INDEX PAGE
app.get("/urls", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];

  if (user) {
      const templateVars = {
      urls: user.db,
      user: user,
      info: urlINFO
      };
    response.render("urls_index", templateVars);
  } else {
    response.status(400).send("Please log in to use TinyURL.");
  }
});


// LOGIN / LOGOUT
app.get("/login", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user: user,
  };
  if (user) {
    response.redirect("/urls");
  } else {
    response.render("urls_login", templateVars);
  }
});

app.post("/logout", (request, response) => {
  request.session.user_id = null;
  response.redirect("/");
});

app.post("/login", (request, response) => {
  const login = request.body.email;
  const pw = request.body.password;
  let currentUser;
  for (let key in users) {
    let user = users[key];
    if (user.email === login && bcrypt.compareSync(pw, user.password)) {
      currentUser = user.id;
    }
  }
  if (currentUser) {
    request.session.user_id = currentUser;
    response.redirect("/urls");
  } else {
    response.status(400).send("Invalid login.");
  }
});


// REGISTER PAGE
app.get("/urls/register", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user: user,
  };
  if (user) {
    response.redirect("/urls");
  } else {
    response.render("urls_register", templateVars);
  }
});

app.post("/urls/register", (request, response) => {
  const userEmail = request.body.email;
  const userPassword = request.body.password;
  const user_id = generateRandomString();
  const hashedPw = bcrypt.hashSync(userPassword, 10);
  const userObj = {
    id: user_id,
    email: userEmail,
    password: hashedPw,
    db: {},
  };
  for (let key in users) {
    if (users[key].email == userEmail) {
      response.status(400).send("Email already registered.");
      break;
    } else if (!userPassword) {
      response.status(400).send("No password entered.");
      break;
    } else if (!userEmail) {
      response.status(400).send("No email entered.");
      break;
    }
  }
  request.session.user_id = user_id;
  users[user_id] = userObj;
  response.redirect("/urls");
});


// TINY URL PAGE
app.get("/urls/:shortURL", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  if (user) {
    let templateVars = {
      shortURL: request.params.shortURL,
      longURL: user.db,
      user: user,
      info: urlINFO,
    }
    if (user.db[request.params.shortURL]) {
      response.render("urls_show", templateVars);
    }
  };
  response.status(400).send("Unable to view TinyURL page.");
});

app.post("/urls/:shortURL", (request, response) => {
  const newUrl = request.body.newURL;
  const shortU = request.params.shortURL;
  const user_id = request.session.user_id;
  const user = users[user_id];
  if (newUrl) {
    user.db[shortU] = newUrl;
  }
  response.redirect(`/urls/${shortU}`);
});


// GO TO LINK
app.get("/u/:shortURL", (request, response) => {
  const shortURL = request.params.shortURL;
  const user_id = request.session.user_id;
  const user = users[user_id];
  let longURL;
  for (let key in users) {
    let u = users[key];
    for (let link in u) {
      let database = u.db
      const shortLinks = Object.keys(database);
      const longLinks = Object.values(database);
      for (let item in shortLinks) {
        if (shortURL == shortLinks[item]) {
          let index = shortLinks.indexOf(shortURL);
          longURL = longLinks[index];
        }
      };
    };
  };
  if (longURL) {
    updateHit(shortURL.toString());
    response.redirect(longURL);
  } else {
    response.status(400).send("TinyURL does not exist.");
  }
});


// DELETE URL
app.post("/urls/:shortURL/delete", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  delete user.db[request.params.shortURL];
  response.redirect("/urls");
});


// CATCHALL
app.get("*", (request, response) => {
  response.redirect("/");
});

/* ----------------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});