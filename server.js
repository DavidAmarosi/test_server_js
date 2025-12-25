import express from "express";
import fs from "fs/promises";

const app = express();
const PORT = process.env.PORT || 8000;
app.use(express.json());

async function readUsers() {
  const data = await fs.readFile("data/users.json", "utf-8");
  return JSON.parse(data);
}
async function writeUsers(users) {
  await fs.writeFile("data/users.json", JSON.stringify(users, null, 2));
}

async function readevents() {
  const data = await fs.readFile("data/events.json", "utf-8");
  return JSON.parse(data);
}

async function writeEvents(events) {
  await fs.writeFile("data/events.json", JSON.stringify(events, null, 2));
}

async function readReceipts() {
  const data = await fs.readFile("data/receipts.json", "utf-8");
  return JSON.parse(data);
}

async function writeReceipts(receipts) {
  await fs.writeFile("data/receipts.json", JSON.stringify(receipts, null, 2));
}
async function validateUser(username, password) {
  const users = await readUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  return user || null;
}

app.post("/user/registe", async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = await readUsers();
    const keys = Object.keys(req.body);

    if (keys.length != 2 || !"username" || !"password") {
      return res.status(400).json({ message: "only username and password" });
    }
    if (users.some((u) => u.username === username)) {
      console.log(password);
      return res.status(400).json({ message: "Username already exists" });
    }
    const maxId = users.length > 0 ? Math.max(...users.map((u) => u.id)) : 0;
    const newuser = { id: maxId + 1, username, password };
    users.push(newuser);
    await writeUsers(users);
    res.status(200).json({ message: "User registered successfully" });
  } catch {
    res.status(500).json({ message: "error" });
  }
});

app.post("/creator/events", async (req, res) => {
  try {
    const { eventName, ticketsForSale, username, password } = req.body;
    const events = await readevents();
    const user = await validateUser(username, password);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid username or password" });
    }

    const newevent = { eventName, ticketsForSale, createdBy: username };
    events.push(newevent);
    await writeEvents(events);
    res.status(200).json({ message: "Event created successfully" });
  } catch {
    res.status(500).json({ message: "error" });
  }
});

app.post("/users/tickets/buy", async (req, res) => {
  try {
    const { eventName, quantity, username, password } = req.body;
    const users = await readUsers();
    const events = await readevents();
    const receipts = await readReceipts();
    let sum = 0;
    const user = await validateUser(username, password);
    if (!user) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid username or password" });
    }
    for (let index = 0; index < events.length; index++) {
      if (eventName == events[index].eventName) {
        sum += 1;
        if (events[index].ticketsForSale > quantity) {
          events[index].ticketsForSale -= quantity;
          const maxId =
            receipts.length > 0 ? Math.max(...receipts.map((u) => u.id)) : 0;
          const newreceipts = {
            id: maxId + 1,
            username,
            eventName,
            quantity,
          };
          receipts.push(newreceipts);
          await writeReceipts(receipts);
          await writeEvents(events);
          res.status(200).json({ message: "Tickets purchased successfully" });
        } else {
          res
            .status(401)
            .json({ message: "There are not enough tickets for sale." });
        }
      }
    }
    if (sum == 0) {
      res
        .status(401)
        .json({ message: "The event you requested was not found." });
    }
  } catch {
    res.status(500).json({ message: "error" });
  }
});

app.get("/users/:username/summary", async (req, res) => {
  try {
    const username = req.params.username?.toString();
    const receipts = await readReceipts();
    let sumofTicket = 0;
    let events = [];
    let num = 0;
    for (let index = 0; index < receipts.length; index++) {
      if (receipts[index].username === username) {
        num += 1;
        sumofTicket += receipts[index].quantity;
        if (!events.includes(receipts[index].eventName)){events.push(receipts[index].eventName);}
      }
    }
    if (num == 0) {
      (sumofTicket = 0), (events = 0), (averageTicketsPerEvent = 0);
    }
    res.status(200).json({
      totalTicketsBought: sumofTicket,
      events: events,
      averageTicketsPerEvent: sumofTicket / num
    });
  } catch {}
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`);
});
