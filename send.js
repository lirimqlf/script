import fetch from "node-fetch";
import FormData from "form-data";
import fs from "fs";

const BOT_TOKEN = "8534808862:AAErgsxI2IjvNUOR-X5CKP1MfC0C1_ZG3Ng";
const CHAT_ID = "-5043830740";

const form = new FormData();
form.append("chat_id", CHAT_ID);
form.append("document", fs.createReadStream("data.json"));

fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
  method: "POST",
  body: form
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error);
