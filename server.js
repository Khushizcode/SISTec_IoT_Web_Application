const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

const dataPath = path.join(__dirname, "data");

if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath);
}

const db = new sqlite3.Database(
    path.join(dataPath, "database.db")
);

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            email TEXT,
            password TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature TEXT,
            humidity TEXT,
            time TEXT,
            date TEXT
        )
    `);

});

function getIndianTime() {

    const now = new Date();

    const optionsTime = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    };

    const optionsDate = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    };

    const time = now.toLocaleTimeString("en-IN", optionsTime);
    const date = now.toLocaleDateString("en-IN", optionsDate);

    return { time, date };
}

app.post("/register", (req, res) => {

    const { name, email, password } = req.body;

    db.run(
        "INSERT INTO users(name,email,password) VALUES(?,?,?)",
        [name, email, password],
        (err) => {

            if (err) {
                return res.send("Error");
            }

            res.redirect("/index.html");
        }
    );
});

app.post("/login", (req, res) => {

    const { email, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE email=? AND password=?",
        [email, password],
        (err, row) => {

            if (row) {
                res.redirect(`/dashboard.html?name=${row.name}`);
            } else {
                res.send("Invalid Credentials");
            }
        }
    );
});

app.get("/api/save", (req, res) => {

    const temp = req.query.temp;
    const hum = req.query.hum;

    const { time, date } = getIndianTime();

    db.run(
        "INSERT INTO records(temperature,humidity,time,date) VALUES(?,?,?,?)",
        [temp, hum, time, date]
    );

    res.send("DATA SAVED");
});

app.get("/api/latest", (req, res) => {

    db.get(
        "SELECT * FROM records ORDER BY id DESC LIMIT 1",
        [],
        (err, row) => {

            res.json(row);
        }
    );
});

app.get("/api/all", (req, res) => {

    db.all(
        "SELECT * FROM records ORDER BY id DESC",
        [],
        (err, rows) => {

            res.json(rows);
        }
    );
});

app.get("/delete/:id", (req, res) => {

    db.run(
        "DELETE FROM records WHERE id=?",
        [req.params.id],
        () => {

            res.redirect("/dashboard.html");
        }
    );
});

app.post("/save-lcd", (req, res) => {

    const text = req.body.text;

    fs.writeFileSync("./data/lcd.txt", text);

    res.send("LCD TEXT SAVED");
});

app.get("/api/lcd", (req, res) => {

    const text = fs.readFileSync("./data/lcd.txt", "utf8");

    res.send(text);
});

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.listen(PORT, () => {
    console.log("Server Running...");
});