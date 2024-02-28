# Secrets Project

Created by Damian Kryzia

This small project lets users submit their secrets and view them only if they are authenticated.

## Features
- User authentication (register/login)
- OAuth 2.0 Authentication (register/login with Google)
- Database encryption
- Browser session

### Technologies used
- Frontend: EJS (HTML), CSS
- Backend: Node.js, Express.js, Express Session Passport.js, bcrypt, PostgreSQL
  
## Starting the application
- Make sure that Node.js and PostgreSQL are installed on your computer.
- Navigate to the app directory in VS Code or any other editor.
- Open a new terminal and navigate to the app directory.
- Run the ```npm install``` command to install dependencies.
- Create a new database in PostgreSQL. It can be named whatever you want.
- Create a new table in your database by running the following query:
  ```
  CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(100)
  )
  ```
- Create a .env file in the main project directory. It should include your database credentials as follows:
  ```
  SESSION_SECRET='any secret word'
  DB_USERNAME='your database username'
  DB_HOST='localhost'
  DB_NAME='the newly created database's name'
  DB_PASSWORD='your database password'
  DB_PORT='the port on which your database is running'
  ```
  
- Now everything is ready to use the application. Run the ```npm start``` command and open ```localhost:3000``` in your browser.
  If you wish to use a different port to run the application, open the ```index.js``` file in the main directory and change ```const port = 3000;``` to the port      that you'd like to use.

## Using registration and login with Google
- Go to the Google Cloud platform and create a new application. Call it 'secrets'.
- Set up a new web client for OAuth 2.0
- After setting up the web client, in the navigation menu go to "API & Services -> Credentials" and click on your web client.
- Copy your application's Client ID as well as the Client Secret.
- In your .env file, add two new entries as follows:
  ```
  GOOGLE_CLIENT_ID='your client id'
  GOOGLE_CLIENT_SECRET='your client secret'
  ```
- Now, registration and login with Google should work properly.

