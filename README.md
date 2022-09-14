# pesdb.net webscraper

this is a simple project to get player information from pesdb.net (that doesn't have an API), specifically from the 2021 version of Pro Evolution Soccer

## what it does

to run the application, from the terminal just type:

``` node app.js ```

It will then print to console which IDs it found, then the name of each player fetched.

Its inner workings are:

1. creates a folder called 'output'
2. gathers the data using asynchronous calls
3. uses the cheerio library to work with the HTML gathered
4. writes the data to a JSON file called 'players.json' in the created folder

You can edit the app.js file to gather as little as 1 page of player information or the maximum the page displays by editing the getPageNumbers function, just make it return an array of sequential numbers of your choice.

The application takes its time to run, so as not to let the server interrupt the calls. If you want all the players, it will take over 4 hours to finish.

## colaborators

the one and only Eduardo Grigolo, aka @azedo
