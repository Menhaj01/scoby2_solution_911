const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt"); // package that allows us to securely encrypt user password.
const User = require("../models/User");

const salt = 10; // Salt for bcrypt's hashing algorithm

router.post("/signin", (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((userDocument) => {
      if (!userDocument) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
      const isValidPassword = bcrypt.compareSync(
        password,
        userDocument.password
      ); // Will send back a boolean if password sent in req.body doesnt
      //match userDocument's password.
      // => If it doesnt match (false) send an error message
      // => If it matchs, the email & password are valid, set the user in the session.
      if (!isValidPassword) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      req.session.currentUser = userDocument._id;
      res.redirect("/api/auth/isLoggedIn");
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

router.post("/signup", (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;
  User.findOne({ email })
    .then((userDocument) => {
      if (userDocument) {
        return res.status(400).json({ message: "Email taken" });
      }

      const hashedPassword = bcrypt.hashSync(password, salt);
      const newUser = { email, lastName, firstName, password: hashedPassword };

      User.create(newUser)
        .then((newUserDocument) => {
          req.session.currentUser = newUserDocument._id;
          res.redirect("/api/auth/isLoggedIn");
        })
        .catch((error) => {
          res.status(500).json(error);
        });
    })
    .catch((error) => {
      res.status(500).json(error);
    });
});

router.get("/isLoggedIn", (req, res, next) => {
  if (req.session.currentUser) {
    User.findById(req.session.currentUser)
      .select("-password")
      .then((userDocument) => {
        res.status(200).json(userDocument);
      })
      .catch((error) => {
        res.status(500).json(error);
      });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

router.delete("/logout", (req, res, next) => {
  if (req.session.currentUser) {
    req.session.destroy((err) => {
      if (err) res.status(500).json(err);
      res.sendStatus(204);
    });
  } else {
    res.status(400).json({ message: "no session" });
  }
});

module.exports = router;
