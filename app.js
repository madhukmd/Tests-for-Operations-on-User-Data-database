const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeBDAndserver = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log(`Server running at http://localhost:3000`);
    });
  } catch (e) {
    console.log(`DB Error:${e.mesaage}`);
    process.exit(1);
  }
};
initializeBDAndserver();

//API 1
//senario 1 and scenario 2 and Scenario 3;
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const lengthOfPassWord = password.length;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined && lengthOfPassWord >= 5) {
    const createUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
    await db.run(createUserQuery);
    response.status(200);
    response.send(`User created successfully`);
  } else if (dbUser === undefined && lengthOfPassWord < 5) {
    response.status(400);
    response.send(`Password is too short`);
  } else {
    response.status(400);
    response.send(`User already exists`);
  }
});

//API 2
//Scenario 1 and scenario 2 and Scenario 3
app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassWordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPassWordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API 3
app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(checkUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("user not registered");
  } else {
    const validationPWD = await bcrypt.compare(oldPassword, dbUser.password);
    if (validationPWD === true) {
      const newPasswordLength = newPassword.length;
      if (newPasswordLength < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `UPDATE user SET 
        password = '${hashedNewPassword}'
        WHERE username = '${username}'`;
        await db.run(updatePasswordQuery);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send(`Invalid current password`);
    }
  }
});
module.exports = app;
