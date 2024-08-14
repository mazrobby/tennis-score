const express = require("express");
const app = express();
app.use(express.json())

const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const port = 8080;

var ip = require("ip");
const { JadwalIndex, JadwalSave, JadwalHapus, JadwalView, SimpanHasilPertandingan, JadwalDetail } = require("./controllers/JadwalController");

server.listen(port);
console.log(`Listening on ${ip.address()}:${port}`);

// routing
app.get("/admin", function (req, res) {
  res.sendFile(__dirname + "/control-room-index.html");
});

app.get("/admin/jadwal", function (req, res) {
  res.sendFile(__dirname + "/jadwal.html");
})

app.get("/jadwal", function (req, res) {
  res.sendFile(__dirname + "/jadwal-view.html");
})

app.get("/hasil-pertandingan", function (req, res) {
  res.sendFile(__dirname + "/hasil-pertandingan.html");
})

app.get("/api/jadwal", JadwalIndex)
app.post("/api/jadwal/detail", JadwalDetail)
app.get("/api/jadwal-view", JadwalView)
app.post("/api/jadwal", JadwalSave)
app.post("/api/jadwal/hapus", JadwalHapus)
app.post("/api/simpan-hasil-pertandingan", SimpanHasilPertandingan)

app.get("/control-room", function (req, res) {
  let room_id = req.query.room

  if (room_id == undefined) {
    res.redirect("/admin")
  }

  res.sendFile(__dirname + "/index.html");
});

app.get("/spectate", function (req, res) {
  let room_id = req.query.room
  console.log("query : ", req.query)
  
  if (room_id == undefined) {
    res.redirect('/')
  }

  res.sendFile(__dirname + "/spectate.html");
})

app.get("/spectate-new", function (req, res) {
  let room_id = req.query.room
  console.log("query : ", req.query)
  
  if (room_id == undefined) {
    res.redirect('/')
  }

  res.sendFile(__dirname + "/spectate2.html");
})

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/room_list.html")
})

app.use("/js", express.static("js"));
app.use("/css", express.static("css"));
app.use("/assets", express.static('assets'));

// users which are currently listening
const listeners = {};

// rooms which are currently available in chat
const rooms = {};
let room_count = 1;
var roomList = [];

io.sockets.on("connection", function (socket) {

  socket.on("roomListener", function () {
    socket.emit("roomListener", roomList)
  })
  socket.emit("roomListener", roomList)
  socket.emit("server_update_room_list", roomList)

  socket.on("addhost", function (players) {
    rooms[room_count] = {};
    rooms[room_count].host = socket.handshake.headers.cookie;
    // emit the room id. also, request its current state & config
    socket.emit("basic_info", room_count);
    console.log(`room ${room_count} added`);

    let obj = {
      room_id: room_count,
      players,
      data: rooms[room_count]
    }
    roomList.push(obj)
    socket.emit("roomListener", roomList)
    socket.broadcast.emit("server_update_room_list", roomList)

    // TODO find a smarter way rather than ++
    room_count++;
  });

  function isHost(id, cookie) {
    try {
      if (rooms[id].host === cookie) return true;
      return false;
    } catch (e) {
      return false;
    }
    // return true
  }

  socket.on("client_updates_state", function (id, state) {
    console.log("client_updates_state")
    if (isHost(id, socket.handshake.headers.cookie)) {
      rooms[id].state = state;
      socket.broadcast.to(id).emit("server_updates_state", state);

      let findRoom = roomList.findIndex((item) => item.room_id === id)
      if (findRoom != -1) {
        roomList[findRoom].state = state
      }
      socket.broadcast.emit("server_update_room_list", roomList)
    }
  });

  socket.on("client_updates_config", function (id, config) {
    if (isHost(id, socket.handshake.headers.cookie)) {
      rooms[id].config = config;
      socket.broadcast.to(id).emit("server_updates_config", config);

      let findRoom = roomList.findIndex((item) => item.room_id === id)
      if (findRoom != -1) {
        roomList[findRoom].config = config
      }
      socket.broadcast.emit("server_update_room_list", roomList)
    }
  });

  // when a new client listens to a room
  socket.on("addlistener", function (id) {
    socket.room = id;
    socket.join(id);

    try {
      socket.emit("server_updates_config", rooms[id].config);
      socket.emit("server_updates_state", rooms[id].state);
    } catch (e) {}
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function () {
    // TODO inform listeners if host has left
    socket.leave(socket.room);
  });
});
