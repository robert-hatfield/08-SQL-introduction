'use strict';
// DONE: Install and require the Node postgres package 'pg' into your server.js, and ensure that it's now a new dependency in your package.json
const pg = require('pg');
const express = require('express');
// REVIEW: Require in body-parser for post requests in our server
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;
const app = express();
// DONE: Complete the connection string for the url that will connect to your local postgres database
// Windows and Linux users; You should have retained the user/pw from the pre-work for this course.
// Your url may require that it's composed of additional information including user and password7
// NOTE: Students will have varying URLs depending on their OS
const conString = 'postgres://localhost:5432';
// REVIEW: Pass the conString to pg, which creates a new client object
const client = new pg.Client(conString);
// REVIEW: Use the client object to connect to our DB.
client.connect();

// REVIEW: Install the middleware plugins so that our app is aware and can use the body-parser module
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('./public'));


// NOTE: Routes for requesting HTML resources
app.get('/', function(request, response) {
  response.sendFile('index.html', {root: '.'});
});

app.get('/new', function(request, response) {
  response.sendFile('new.html', {root: '.'});
});

// NOTE: Routes for making API calls to enact CRUD Operations on our database
app.get('/articles', function(request, response) {
  client.query(`
    CREATE TABLE IF NOT EXISTS articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      "authorUrl" VARCHAR (255),
      category VARCHAR(20),
      "publishedOn" DATE,
      body TEXT NOT NULL);`
  )
  client.query('SELECT * FROM articles', function(err, result) { // Make a request to the DB
    if (err) console.error(err);
    response.send(result.rows);
  });
});

app.post('/articles', function(request, response) {
  client.query(
    `INSERT INTO
    articles(title, author, "authorUrl", category, "publishedOn", body)
    VALUES ($1, $2, $3, $4, $5, $6);
    `, // DONE: (above) Write the SQL query to insert a new record
    [
      request.body.title,
      request.body.author,
      request.body.authorUrl,
      request.body.category,
      request.body.publishedOn,
      request.body.body
    ] // DONE: (above) Get each value from the request's body
  );
  response.send('insert complete');
});

app.put('/articles/:id', function(request, response) {
  client.query(
    `UPDATE articles SET author = $1, "authorUrl" = $2, body = $3, category = $4, "publishedOn" = $5, title = $6 WHERE article_id = $7` , // DONE: Write the SQL query to update an existing record
    [
      request.body.author,
      request.body.authorUrl,
      request.body.body,
      request.body.category,
      request.body.publishedOn,
      request.body.title,
      request.params.id
    ] // DONE: Get each value from the request's body
  );
  response.send('update complete');
});

app.delete('/articles/:id', function(request, response) {
  client.query(
    `DELETE FROM articles WHERE article_id = $1`, // DONE: Write the SQL query to delete a record
    [request.params.id]
  );
  response.send('Delete complete');
});

app.delete('/articles', function(request, response) {
  client.query(
    '' // TODO: Write the SQl query to truncate the table
  );
  response.send('Delete complete');
});

app.listen(PORT, function() {
  console.log(`Server started on port ${PORT}!`);
});
