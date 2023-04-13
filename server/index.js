// test server

const express = require("express");
const app = express();
const port = 3003;

app.use(express.static("server-public"));

app.get("/", (req, res) => {
  res.send({
    v: "0.1.0",
    error: 0,
    state: "ok",
    message: "API is running",
  });
  console.log("finish %s %s", req.method, req.path);
});

app.post("/auth/login", (req, res) => {
  res.send({
    v: "0.1.0",
    error: 0,
    state: "ok",
    message: "Successfully logged in.",
    data: {
      id: "3",
      email: "cypress3@api.cc",
      name: "Duck",
      firstname: "Donald",
      groups: [
        {
          id: 1,
          name: "User",
        },
        {
          id: 3,
          name: "Administrator",
        },
      ],
      jwt: "eyJhbGciOiJVCJ9.eyJpZCI6MSwiNjgwMjMwODl9.f95Iqq3TM7npRn8ik5nAyL_o3a9b2FsWdhZJ5bAZ4D4w",
    },
  });
  console.log("finish %s %s", req.method, req.path);
});

app.get("/user", (req, res) => {
  res.send({
    v: "0.1.0",
    error: 0,
    state: "ok",
    message: "Successfully retrieved user list.",
    data: {
      list: [
        {
          id: 1,
          email: "cypress1@api.cc",
          name: "Dump",
          firstname: "Donald",
        },
        {
          id: 2,
          email: "cypress2@api.cc",
          name: "Bahmutov",
          firstname: "Gleb",
        },
        {
          id: 3,
          email: "cypress3@api.cc",
          name: "Bono",
          firstname: "LeJean",
        },
      ],
      count: 3,
      page: 1,
      pages: 1,
      limit: 20,
    },
  });
  console.log("finish %s %s", req.method, req.path);
});

app.get("/user/:id", (req, res) => {
  res.send({
    v: "0.1.0",
    error: 0,
    state: "ok",
    message: "Successfully retrieved user data.",
    data: {
      id: +req.params.id,
      name: "Bahmutov",
      firstname: "Gleb",
      email: "cypress2@api.cc",
    },
  });
  console.log("finish %s %s", req.method, req.path);
});

app.get("/group/:id", (req, res) => {
  res.status(200).send({
    v: "0.1.0",
    error: 1,
    state: "error",
    code: "RESTRICTED",
  });
  console.log("finish %s %s", req.method, req.path);
});

app.get("/foo", (req, res) => {
  res.status(401).send({
    v: "0.1.0",
    error: 1,
    state: "error",
    code: "UNAUTHORIZED",
  });

  console.log("finish %s %s", req.method, req.path);
});

app.get("*", (req, res) => {
  res.status(404).send({
    v: "0.1.0",
    error: 1,
    state: "error",
    code: "SLIM_NOT_FOUND",
  });
  console.log("finish %s %s", req.method, req.path);
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
