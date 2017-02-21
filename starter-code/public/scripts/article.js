'use strict';

function Article (opts) {
  // REVIEW: Convert property assignment to a new pattern. Now, ALL properties of `opts` will be
  // assigned as properies of the newly created article object. We'll talk more about forEach() soon!
  // We need to do this so that our Article objects, created from DB records, will have all of the DB columns as properties (i.e. article_id, author_id...)
  Object.keys(opts).forEach(function(e) {
    this[e] = opts[e]
  }, this);
}

Article.all = [];

// ++++++++++++++++++++++++++++++++++++++

// REVIEW: We will be writing documentation today for the methods in this file that handles Model layer of our application. As an example, here is documentation for Article.prototype.toHtml(). You will provide documentation for the other methods in this file in the same structure as the following example. In addition, where there are TODO comment lines inside of the method, describe what the following code is doing (down to the next TODO) and change the TODO into a DONE when finished.

/**
 * OVERVIEW of Article.prototype.toHtml():
 * - A method on each instance that converts raw article data into HTML
 * - Inputs: nothing passed in; called on an instance of Article (this)
 * - Outputs: HTML of a rendered article template
 */
Article.prototype.toHtml = function() {
  // DONE: Retrieves the  article template from the DOM and passes the template as an argument to the Handlebars compile() method, with the resulting function being stored into a variable called 'template'.
  var template = Handlebars.compile($('#article-template').text());

  // DONE: Creates a property called 'daysAgo' on an Article instance and assigns to it the number value of the days between today and the date of article publication
  this.daysAgo = parseInt((new Date() - new Date(this.publishedOn))/60/60/24/1000);

  // DONE: Creates a property called 'publishStatus' that will hold one of two possible values: if the article has been published (as indicated by the check box in the form in new.html), it will be the number of days since publication as calculated in the prior line; if the article has not been published and is still a draft, it will set the value of 'publishStatus' to the string '(draft)'
  this.publishStatus = this.publishedOn ? `published ${this.daysAgo} days ago` : '(draft)';

  // DONE: Assigns into this.body the output of calling marked() on this.body, which converts any Markdown formatted text into HTML, and allows existing HTML to pass through unchanged
  this.body = marked(this.body);

// DONE: Output of this method: the instance of Article is passed through the template() function to convert the raw data, whether from a data file or from the input form, into the article template HTML
  return template(this);
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.loadAll():
 * - A method on the Article constructor (not instantiated on constructed articles) that populates the Article.all array with a reverse chronological list of article objects.
 * - Inputs: 'rows', an array of article records; called by Article.fetchAll on line 79.
 * - Outputs: an array of article objects, stored in Article.all
 */
Article.loadAll = function(rows) {
  // DONE: Sort is a built in mutator method of JS arrays, which sorts the elements in place. The anonymous function that is here passed as an argument is the definition of the sort order. The function subtracts the publication date of article A from the publication date of article B. If this returns a negative number (A was published after B), then A will be listed before B in the array. If A was published before B (a positive number is returned), then B will be listed before A. If they were published on the same date, the difference returned will be zero, and their respective order will not be changed. The end result of invoking this method will be that 'rows' (an array of records returned by the SQL query passed as an argument in line 79) will be sorted in reverse chronological order.
  rows.sort(function(a,b) {
    return (new Date(b.publishedOn)) - (new Date(a.publishedOn));
  });

  // DONE: the forEach method will iterate over the length of the 'rows' array. Each DB row object ('ele') is passed into the Article constructor as an argument. The constructor (on lines 3-10) uses the key/value pairs of the received row object to assign properties to each instance of the article object. The resulting instance is then added to the array 'Article.all', which was declared on line 12.
  rows.forEach(function(ele) {
    Article.all.push(new Article(ele));
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.fetchAll():
 * - Describe what the method does
 * - Inputs: A reference to 'articleView.initIndexPage' is passed in as 'callback'; called by line 87 of index.html. Therefore, Article.fetchAll is the FIRST function invoked when the page is loaded.
 * - Outputs: An array of article objects, constructed from data in 'hackerIpsum.json' or the 'articles' table of the SQL DB, is stored in 'Article.all'. Then HTML article objects are created, appended to the DOM, and event listeners added for user interaction with the page.
 */
Article.fetchAll = function(callback) {
  // DONE: Line 73 requests any & all records from the 'articles' table of the SQL DB. This is a jQuery AJAX call using a GET HTTP request over port 5432.
  $.get('/articles')
  // DONE: After requesting articles from the DB and a response is returned, this checks to see if any are returned.
  .then(
    function(results) {
      if (results.length) { // If records exist in the DB
        // DONE: If DB records were returned, pass the resulting array to the 'loadAll' method (defined at line 50) as an argument. They will be sorted in reverse chronological order and added to the "Article.all" array. Then, using "callback()" invoke 'article.initIndexPage' to generate HTML articles, render them to the DOM, and set up the category/author filters, and event handlers for interacting with the page.
        Article.loadAll(results);
        callback();
      } else { // if NO records exist in the DB
        // DONE: If there are no records the DB, create DB records from hackeripsum.json, then reattempt 'fetchAll'. This uses the .getJSON method of jQuery (an AJAX function) to send a GET HTTP request to the server. In this case, it's read from a native .json file. Once a response is received, each "raw" object in the JSON collection is passed into the Article constructor. The resulting constructed article objects are then inserted into the DB.
        $.getJSON('./data/hackerIpsum.json')
        .then(function(rawData) {
          rawData.forEach(function(item) {
            let article = new Article(item);
            article.insertRecord(); // Add each record to the DB
          })
        })
        // DONE: After the DB has been populated, the 'fetchAll' method is invoked again, passing the same  'articleView.initIndexPage' as an argument. INFO: This means the 'fetchAll' method calls itself. Line 82 of index.html and line 92 (below) appear to be the only places where 'fetchAll' is invoked.
        .then(function() {
          Article.fetchAll(callback);
        })
        // DONE: If the jQuery XMLHttpRequest object returned by $.getJSON contains an error, then log the error to the console. QUESTION: It's not clear to me what the structure of this "jqXHR" object is; how is the value of 'err' determined?
        .catch(function(err) {
          console.error(err);
        });
      }
    }
  )
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.truncateTable():
 * - This method asks server.js to remove all records from the 'articles' table. When complete, it logs the response from the server ('Delete complete') to the console, and then executes the callback method passed to 'Article.truncateTable', if one was sent when it was invoked.
 * - Inputs: An optional callback function may be passed as its argument. This method is not currently invoked, though, in our started code.
 * - Outputs: Sends an ajax request to server.js to delete all records in the 'articles' table. It will also log a text string response to the console, and may invoke a callback function, if one was received.
 */
Article.truncateTable = function(callback) {
  // DONE: Sends an ajax request to server.js using the REST HTTP 'DELETE' method. All records in the 'articles' table will be deleted. (The table itself & its schema remain intact.).
  $.ajax({
    url: '/articles',
    method: 'DELETE',
  })
  // DONE: The HTTP response from server.js ('data') is logged to the console. In this case, 'data' contains the string "'Delete complete'". If a callback function was passed to .truncateTable, it is then executed.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of '.insertRecord' method
 * - Describe what the method does
 * - Inputs: Called by each constructed article object on line 87, within 'Article.fetchAll'. This will occur if no records exist in the 'article' table of the DB. INFO: The insertRecord method has allows for a parameter, but none is provided in this version of the code. The rest of the function will execute nonetheless. Line 140 will be false, so no callback occurs.
 * - Outputs: identify any outputs and their destination
 */
Article.prototype.insertRecord = function(callback) {
  // DONE: Creates records in the 'articles' table of the SQL database, using the POST HTTP request. It is called by each article object after it is constructed from the data contained in 'hackeripsum.json' on line 87.
  $.post('/articles', {author: this.author, authorUrl: this.authorUrl, body: this.body, category: this.category, publishedOn: this.publishedOn, title: this.title})
  // DONE: Log the response from server.js (should be a string of 'insert complete') to the console. Then execute the callback function, if one was provided. None of the code in the starter is passing a callback to insertRecord at this time.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  })
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.deleteRecord
 * - This method is available to all instances of the Article class of objects. It deletes from the database the record of the article ('this') that calls the method.
 * - Inputs: An optional argument, a callback function or method. No sources in the starter code; deleteRecord is not invoked anywhere in the project files at this time.
 * - Outputs: When invoked, this method will send an HTTP request to server.js, with a URL record for the server to delete. It will then log the server response to the console, and execute a callback function/method, if one was provided.
 */
Article.prototype.deleteRecord = function(callback) {
  // DONE: this sends an ajax request with the 'DELETE' method to server.js, referencing the URL of whichever article instance calls deleteRecord.
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'DELETE'
  })
  // DONE: this logs the response from the server to the console, then execute the callback function, if one was provided.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};

// ++++++++++++++++++++++++++++++++++++++

// DONE
/**
 * OVERVIEW of Article.prototype.updateRecord
 * - This method is available to all instances of objects created by the Article constructor. It asks the server to create a update the record in the DB for the article that calls it.
 * - Inputs: This receives an optional callback function as a parameter. This method is not invoked in the starter code at this time.
 * - Outputs: An ajax request sent to server.js, using the PUT method, containing the key/value pairs of the article object that calls it. It will also log the server's response to the console, and invoke a callback function, if one was given.
 */
Article.prototype.updateRecord = function(callback) {
  // DONE: this sends an ajax request, using the PUT method, to server.js to create ('PUT') a new record in the 'articles' table of the DB. In the request is an object literal with the key/value pairs of the article object that calls the 'updateRecord' method.
  $.ajax({
    url: `/articles/${this.article_id}`,
    method: 'PUT',
    data: {  // DONE: this is an object literal with the key/value pairs of the article object that calls this method
      author: this.author,
      authorUrl: this.authorUrl,
      body: this.body,
      category: this.category,
      publishedOn: this.publishedOn,
      title: this.title
    }
  })
  // DONE: This logs the response from the server to the console, and then invokes the callback function received by 'updateRecord', if one was provided.
  .then(function(data) {
    console.log(data);
    if (callback) callback();
  });
};
