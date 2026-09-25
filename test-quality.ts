import fs from "fs";

async function test() {
  const imagePath = "./test-carrot.jpg";

  const imageBase64 = fs.readFileSync(imagePath).toString("base64");

  const response = await fetch("http://localhost:3000/api/ai/grade-produce", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: imageBase64,
    }),
  });

  const result = await response.json();

  console.log(JSON.stringify(result, null, 2));
}

test();