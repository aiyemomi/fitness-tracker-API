require("dotenv").config();
require("express-async-errors");
const express = require("express");
const connectDB = require("./config/dbConnect");
const userRouter = require("./routes/user");


// middleware
const notFound = require("./middleware/not-found");
const errorMiddleWare = require("./middleware/error-handler");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello world");
});

// routes

app.use("/api/v1/user", userRouter);

app.use(notFound);
app.use(errorMiddleWare);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is listening on port ${process.env.PORT || 8000} `);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

start();
