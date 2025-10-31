
/*

This code is protected using MIT licence

© Copyright 2025 Kamil Kijak

*/


require("dotenv").config();

const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const express = require("express");
const http = require("http");

const db = require("./utils/db");

const userRouter = require("./routes/users");
const socialLinkRouter = require("./routes/socialLinks");
const subscriptionRouter = require("./routes/subscriptions");
// const applicationRouter = require("./routes/applications");
// const appTagRouter = require("./routes/appTags");
// const appScreenRouter = require("./routes/appScreens");
// const opinionRouter = require("./routes/opinions");

db.sync();

const app = express();


app.use(cors({
    origin:process.env.ORIGIN || "http://localhost:3000",
    methods:["GET", "POST", "PUT", "DELETE"],
    credentials:true
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes
app.use("/api/users", userRouter);
app.use("/api/social_links", socialLinkRouter);
app.use("/api/subscriptions", subscriptionRouter);
// app.use("/api/applications", applicationRouter);
// app.use("/api/app_tags", appTagRouter);
// app.use("/api/app_screens", appScreenRouter);
// app.use("/api/opinions", opinionRouter);


if(Number(process.env.PRODUCTION)) {
    app.use(express.static(path.join(__dirname, "vite-app", "dist", "index.html")));
}


app.use((req, res) => {
    if(Number(process.env.PRODUCTION)) {
        res.sendFile(path.join(__dirname, "vite-app", 'dist', 'index.html'));
    } else {
        res.status(404).send("<h1>404 - page not found</h1>")
    }
})

const server = http.createServer(app);

server.listen(process.env.PORT || 3000, process.env.HOSTNAME || "0.0.0.0", () => {
    console.log(`Server is listening on port ${process.env.PORT || 3000}`);
});