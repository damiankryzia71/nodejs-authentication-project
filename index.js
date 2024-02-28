import express from "express";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import GoogleStrategy from "passport-google-oauth20";
import "dotenv/config";

const app = express();
const port = 3000;
const saltRounds = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24
  }
}));
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
  user: process.env.DB_USERNAME,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});
await db.connect();

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
  }
  else {
    res.redirect("/home");
  }
});

app.get("/home", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) {
    const result = await db.query("SELECT secret FROM users WHERE email = $1", [req.user.email]);
    const secret = result.rows[0].secret;
    if (secret) {
      res.render("secrets.ejs", { secret: secret });
    }
    else {
      res.render("secrets.ejs", { secret: "You should submit a secret!" });
    }
  }
  else {
    res.redirect("/login");
  }
});

app.get("/auth/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

app.get("/auth/google/secrets", passport.authenticate("google", {
  successRedirect: "/secrets",
  failureRedirect: "/login"
}));

app.get("/logout", (req, res) => {
  req.logout((error) => {
    console.log(error);
    res.redirect("/");
  });
});

app.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  }
  else {
    res.redirect("/login");
  }
});

app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;

  try {
    const checkDuplicate = await db.query("SELECT email FROM users WHERE email = $1", [email]);
    if (checkDuplicate.rows.length > 0) {
      res.send("Email already registered. Try logging in.");
    }
    else {
      //Password hashing
      const hash = await bcrypt.hash(password, saltRounds);
      const result = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [email, hash]);
      const user = result.rows[0];
      req.login(user, (error) => {
        console.log(error);
        res.redirect("/secrets");
      });
    }
  }
  catch (error) {
    console.log(error.message);
    res.status(500).send("500: Internal Server Error");
  }
});

app.post("/login", passport.authenticate("local", {
  successRedirect: "/secrets",
  failureRedirect: "/login"
}));

app.post("/submit", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      await db.query("UPDATE users SET secret = $1 WHERE email = $2", [req.body.secret, req.user.email]);
      res.redirect("/secrets");
    }
    catch (error) {
      res.status(500).send(error.message);
    }
  }
  else {
    res.redirect("/login");
  }
});

passport.use(new LocalStrategy(async (username, password, cb) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [username]);
    if (result.rows.length > 0) {
      const user = result.rows[0];
      const hash = user.password;
      try {
        const match = await bcrypt.compare(password, hash);
        if (match) {
          return cb(null, user);
        }
        else {
          return cb(null, false);
        }
      }
      catch (error) {
        return cb(error);
      }
    }
    else {
      return cb("User not found.");
    }
  }
  catch (error) {
    console.log(error.message);
    return cb(error);
  }
}));

//Login with Google
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `http://localhost:${port}/auth/google/secrets`
  },
  async (accessToken, refreshToken, profile, cb) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [profile.emails[0].value]);
      if (result.rows.length === 0) {
        const newUser = await db.query("INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *", [profile.emails[0].value, "google"]);
        return cb(null, newUser.rows[0]);
      }
      else {
        const user = result.rows[0];
        return cb(null, user);
      }
    }
    catch (error) {
      console.log(error.message);
      return cb(error)
    }
  }
));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
