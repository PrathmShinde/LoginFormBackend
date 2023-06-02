import express from "express";
// import fs from "fs";
import mongoose, { mongo } from "mongoose";
import path from "path";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const PORT = 5200;

const app = express();

//database connection(express + mongodb)
mongoose
  .connect("mongodb://127.0.0.1:27017", {
    dbName: "backend",
  })
  .then(() => console.log("Database Connected"))
  .catch(() => console.log("Not connected"));

//Creating db Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

//create model (Calling/Create a collection)
const User = mongoose.model("User", userSchema);

// using middlewares
app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//setting up view engine
app.set("view engine", "ejs");

app.listen(PORT, () => {
  console.log("Server is Working");
});

//-------------------------------------------------------------------------------------------------

//JWT login-logout

const isAuthenticated = async (req, res, next) => {
  // const { token } = req.cookies;
  const token = req.cookies.token;
  // console.log(token);

  if (token) {
    const decoded = jwt.verify(token, "wwfgdtdhyjehtj");

    req.user = await User.findById(decoded._id);

    next();
  } else {
    res.redirect("/login");
  }
};

app.get("/", isAuthenticated, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register");
});
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  let user = await User.findOne({ email });

  if (!user) return res.redirect("/register");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch)
    return res.render("login", { email, message: "Inncorrect Password" });

  const token = jwt.sign({ _id: user._id }, "wwfgdtdhyjehtj");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

//register route
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login"); //if user already present in db then go to login page else create new user below
  }

  // password encryption
  const hashedPassword = await bcrypt.hash(password, 10);

  user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ _id: user._id }, "wwfgdtdhyjehtj");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 60 * 1000),
  });
  res.redirect("/");
});

//logout route

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/login");
});
