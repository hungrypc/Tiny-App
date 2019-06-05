var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/urls", (request, response) => {
  let templateVars = {
    urls: urlDatabase,
    username: request.cookies["username"],
  };
  response.render('urls_index', templateVars);
});

app.get("/urls/new", (request, response) => {
  let templateVars = {
    username: request.cookies["username"],
  };
  response.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (request, response) => {
  let templateVars = {
    shortURL: request.params.shortURL,
    longURL: urlDatabase,
    username: request.cookies["username"],
  };

  if (urlDatabase[request.params.shortURL]) {
    response.render("urls_show", templateVars);
  } else {
    response.redirect('/urls');
  }
});

app.post("/urls", (request, response) => {
  let longUrl = request.body.longURL;
  let shortUrl = generateRandomString();
  urlDatabase[shortUrl] = longUrl;
  response.redirect(`urls/${shortUrl}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  if (longURL) {
    res.redirect(longURL);
  } else {
    response.redirect('/urls');
  }
});

app.post('/urls/:shortURL/delete', (request, response) => {
  delete urlDatabase[request.params.shortURL];
  response.redirect('/urls');
});

app.post("/urls/:shortURL", (request, response) => {
  const newUrl = request.body.newURL;
  const shortU = request.params.shortURL;
  if (newUrl) {
    urlDatabase[shortU] = newUrl;
  }
  response.redirect(`/urls/${shortU}`);
});

app.post('/login', (request, response) => {
  response.cookie('username', request.body.username);
  response.redirect('/urls');
});

app.post('/logout', (request, response) => {
  response.clearCookie('username');
  response.redirect('/urls');
});


// catchall
app.get("*", (request, response) => {
  response.redirect("/urls/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});