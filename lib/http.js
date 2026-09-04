function sendJson(res, status, body) {
  res.statusCode = status;
  if (typeof res.json === "function") {
    return res.json(body);
  }
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function getJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

module.exports = { sendJson, getJsonBody };
