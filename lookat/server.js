"use strict";

const PORT = 8000;
const SERVER = "http://localhost:" + String(PORT);

/* socket io */
const app = require("./app");
const http_con = require("http");
const server = http_con.Server(app);
const io = require("socket.io").listen(server);
const my_db = require("./db");

/* Events handlig (using socket.io) */
io.on("connection", function(socket) {
  socket.on("disconnect", function() {
  });

  socket.on("fav", function(ids) {
    setFlagVal("fav", 1, ids);
  });
  
  socket.on("del", function(ids) {
    setFlagVal("del", 1, ids);
  });

  socket.on("unfav", function(ids) {
    setFlagVal("fav", 0, ids);
  });

  socket.on("get_mailbody_call", function(ids) {
      dbc.get_mailbody((ret) => {
        io.emit("getMailBody_ret", ret);
      });
  });
});
server.listen(PORT);

