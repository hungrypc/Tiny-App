var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID" : {
    id: "userRandomID",
    email: "user@example.com",
    password: "123",
    db: {
      "b2xVn2": "http://www.lighthouselabs.ca",
      "9sm5xK": "http://www.google.com"
    }
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "456",
    db: {
      "b2xVn2": "http://www.lighthouselabs.ca",
      "9sm5xK": "http://www.google.com"
    }
  }
};

function generateRandomString(){
  let vocab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split('');
  let output = "";
  for (var i = 0; i < 6; i++) {
    output += vocab[Math.floor(Math.random() * vocab.length)];
  }
  return output;
}

// app.get("/", (request, response) => {
//   response.send("Hello!");
// });

// app.get("/urls.json", (request, response) => {
//   response.json(urlDatabase);
// });

// app.get("/hello", (request, response) => {
//   response.send("<html><body>Hello <b>World</b></body></html>\n");
// });


// HOME PAGE

app.get("/urls", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];

  if (user) {
      const templateVars = {
      urls: user.db,
      user: user,
      };
    response.render('urls_index', templateVars);
  } else {
    response.render('urls_index', {});
  }
});

// LOGIN PAGE

app.get('/login', (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user: user,
  };
  response.render('urls_login', templateVars);
});

app.post('/login', (request, response) => {
  const login = request.body.email;
  const pw = request.body.password;
  // response.cookie('user_id', request.body.user_id);
  let currentUser;
  for (var key in users) {
    var user = users[key];
    if (user.email === login && bcrypt.compareSync(pw, user.password)) {
      currentUser = user.id;
    }
  }
  if (currentUser) {
    request.session.user_id = currentUser;
    response.redirect('/urls');
  }else{
    response.status(400).send("invalid login");
  }

});

// REGISTER PAGE

app.get('/urls/register', (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  const templateVars = {
    urls: urlDatabase,
    user: user,
  };
  response.render('urls_register', templateVars);
});

app.post('/urls/register', (request, response) => {
  let userEmail = request.body.email;
  let userPassword = request.body.password;
  let user_id = generateRandomString();
  let hashedPw = bcrypt.hashSync(userPassword, 10);
  let userObj = {
    id: user_id,
    email: userEmail,
    password: hashedPw,
    db: {},
  };

  for (var key in users) {
    var user = users[key];
    if (user.email === userEmail) {
      response.status(400).send("email already registered");
      break;
    } else if (!userPassword) {
        response.status(400).send("no password entered");
        break;
    } else if (!userEmail) {
      response.status(400).send("no email entered");
      break;
    } else {
        request.session.user_id = user_id;
        users[user_id] = userObj;
        response.redirect('/urls');
        break;
    }
  }

});

// CREATE NEW URL PAGE

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
    response.redirect('urls');
  }

});

// TINY URL PAGE

app.get("/urls/:shortURL", (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  const shortie = request.params.shortURL;
  if (user) {
    let templateVars = {
    shortURL: request.params.shortURL,
    longURL: user.db,
    user: user,
  };
    if (user.db[request.params.shortURL]) {
      response.render("urls_show", templateVars);
    } else {
      response.redirect('/urls');
    }
  }
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

// CREATE NEW URL ACTION

app.post("/urls", (request, response) => {
  let longUrl = request.body.longURL;
  let shortUrl = generateRandomString();
  const user_id = request.session.user_id;
  const user = users[user_id];
  user.db[shortUrl] = longUrl;
  response.redirect(`urls/${shortUrl}`);
});

// GO TO LINK

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  let shortURLstring = shortURL.toString();
  const user_id = req.session.user_id;
  const user = users[user_id];
  let longURL;
  for (var key in users) {
    var u = users[key];
    for (var link in u) {
      let database = u.db
      const shortLinks = Object.keys(database);
      const longLinks = Object.values(database);
      for (var item in shortLinks) {
        if (shortURL == shortLinks[item]) {
          let index = shortLinks.indexOf(shortURL);
          longURL = longLinks[index];
        }
      }
    }
  };
  if (longURL) {
    res.redirect(longURL);
  } else {
    res.redirect('/urls');
  }
});

// DELETE URL ACTION

app.post('/urls/:shortURL/delete', (request, response) => {
  const user_id = request.session.user_id;
  const user = users[user_id];
  delete user.db[request.params.shortURL];
  response.redirect('/urls');
});

//


app.post('/logout', (request, response) => {
  request.session.user_id = null;
  response.redirect('/urls');
});


// catchall
app.get("*", (request, response) => {
  response.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});