var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

function generateRandomString(){
  let vocab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split('');
  let output = "";
  for (var i = 0; i < 6; i++) {
    output += vocab[Math.floor(Math.random() * vocab.length)];
  }
  return output;
}


app.get("/", (request, response) => {
  response.send("Hello!");
});

// app.get("/urls.json", (request, response) => {
//   response.json(urlDatabase);
// });

app.get("/hello", (request, response) => {
  response.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (request, response) => {
  let templateVars = { urls: urlDatabase };
  response.render('urls_index', templateVars);
});

app.get("/urls/new", (request, response) => {
  response.render("urls_new");
});

app.get("/urls/:shortURL", (request, response) => {
  let templateVars = { shortURL: request.params.shortURL, longURL: urlDatabase};
  response.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});