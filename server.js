const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// KPOP 男爱豆名单
const MEMBERS = [
  "赖冠霖","古贺祐大","车银优","朴志训","韩知城","徐宇瑨","Nichkhun","徐明浩","崔太洋","朴智旻",
  "钱锟","李旻润","赵珍虎","崔然竣","李硕珉","文炯书","金有权","朴乾旭","王奕翔","姜吕尚",
  "崔伞","李灿","金本芳典","金辉映","金泰来","徐彰彬","姜大声","朝仓穣","李敏亨","崔珉起",
  "蔡亨源","金在奂","丁润浩","李炤熙","崔荣宰","尹净汉","金太焕","崔钟浩","姜丹尼尔","金岱永",
  "郑成灿","宋尹亨","金仁诚","刘基贤","禹智皓","黄仁俊","李东赫","东永裴","陆星材","宋亨俊",
  "李达渊","尹材赫","黄旼炫","金道勋","梁精寅","李昌燮","金永斌","朴灿烈","安成民","李成烈",
  "吴是温","宋银硕","崔杋圭","沈载伦","金基范","闵玧其","郑在玹","黄铉辰","权志龙","李贤在",
  "裴珍映","金俊奎","田柾国","金地雄","吕畅九","裴俊英","孙英宰","池昌民","渡边温斗","金明俊",
  "董思成","中耒田悠真","高信源","具晙会","西村力","李珍基","金南俊","章昊","玉泽演","边义州",
  "林在范","李玟赫","金钟仁","文彬","李周宪","韩振","段宜恩","尹智圣","李大辉","崔智雄",
  "朴志焄","安达祐人","李启赫","金泳勋","宋昤琦","张祐荣","吴世勋","孙贤佑","李泰容","表志勋",
  "金东赫","李昇勋","崔胜澈","苏庭焕","刘扬扬","黄冠亨","得能勇志","郭英敏","梁洪硕","村田风雅",
  "崔珉豪","南优铉","邕圣祐","郑粲右","李上渊","郑友荣","文俊辉","都暻秀","崔玹硕","姜敏熙",
  "河成云","高山浬希","李龙馥","金圣圭","张东雨","白朱豪","韩维辰","徐恩光","李俊昊","具廷谟",
  "洪知秀","李泰民","柳太阳","肖俊","朴星化","李灿荣","崔秀彬","李羲承","边伯贤","钟辰乐",
  "金奎彬","广濑辽","方灿","金泰禹","姜炯求","郑禹奭","朴涎禹","徐英浩","咸元进","朴世琳",
  "姜东昊","朴综星","黄寅拓","金泰亨","石友铉","韩志薫","金振焕","姜昇润","金叹俊","滨田朝光",
  "尹产贺","沈泉锐","王嘉尔","李曦赫","李柱延","金珉奎","尹起昊","朴真祐","中本悠太","藤永咲哉",
  "大崎将太郎","休宁凯","全圆佑","金钟燮","黄灿盛","成韩彬","郑泽运","朴元彬","马莳权","李知勋",
  "金俊勉","姜濂熙","李永钦","李旻浩","申东根","金有谦","权顺荣","李在允","李泰吹","金善旴",
  "金明珠","金知元","车学沇","梁祯元","金珉锡","金道荣","金廷祐","重田美琉爱","崔胜铉","李会泽",
  "崔瀚率","金钟铉","罗渽民","李帝努","前田陆","崔溱熙","宋旻浩","朴成训","白翔太","张艺兴",
  "李马克","朴志晟","金弘中","任炫植","朴佑镇","安宰孝","金硕珍","金道英","任昌均","李成钟",
  "朴珍荣","金善禹","金钟大","郑号锡","朴经","申晶曪","BamBam","宏田力","夫胜宽","李在焕",
  "韩相爀","金钟炫","崔英宰","金昇玟","姜太显"
];

const rooms = {};

function genRoomId() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

function generatePool(targetName) {
  const pool = [targetName];
  const others = MEMBERS.filter(m => m !== targetName);
  others.sort(() => Math.random() - 0.5);
  for (let i = 0; i < 29; i++) pool.push(others[i]); // 随机30人池子
  return pool.sort(() => Math.random() - 0.5);
}

io.on("connection", (socket) => {
  socket.on("create-room", () => {
    const roomId = genRoomId();
    rooms[roomId] = { players: [socket.id], secrets: {}, turn: socket.id, over: false };
    socket.join(roomId);
    socket.emit("room-created", roomId);
  });

  socket.on("join-room", (roomId) => {
    const room = rooms[roomId];
    if (!room || room.players.length >= 2) return socket.emit("error-msg", "房间无效或已满");
    room.players.push(socket.id);
    socket.join(roomId);

    const [p1, p2] = room.players;
    room.secrets[p1] = MEMBERS[Math.floor(Math.random() * MEMBERS.length)];
    room.secrets[p2] = MEMBERS[Math.floor(Math.random() * MEMBERS.length)];

    io.to(roomId).emit("room-ready", { roomId, turn: room.turn });
    io.to(p1).emit("your-secret", { secret: room.secrets[p1], pool: generatePool(room.secrets[p2]) });
    io.to(p2).emit("your-secret", { secret: room.secrets[p2], pool: generatePool(room.secrets[p1]) });
  });

  socket.on("ask", ({ roomId, question }) => {
    const room = rooms[roomId];
    if (!room || room.over || room.turn !== socket.id) return;
    io.to(roomId).emit("question-asked", { from: socket.id, question });
    room.turn = room.players.find(p => p !== socket.id);
    io.to(roomId).emit("turn-changed", room.turn);
  });

  socket.on("answer", ({ roomId, answer }) => {
    const room = rooms[roomId];
    if (!room || room.over || room.turn !== socket.id) return;
    io.to(roomId).emit("answer-given", { from: socket.id, answer });
    room.turn = socket.id;
    io.to(roomId).emit("turn-changed", room.turn);
  });

  socket.on("guess", ({ roomId, name }) => {
    const room = rooms[roomId];
    if (!room || room.over || room.turn !== socket.id) return;
    const opponent = room.players.find((p) => p !== socket.id);
    const correct = room.secrets[opponent] === name;
    io.to(roomId).emit("guess-result", { from: socket.id, correct });
    if (correct) {
      room.over = true;
      io.to(roomId).emit("game-over", { winner: socket.id, answer: name });
    } else {
      room.turn = opponent;
      io.to(roomId).emit("turn-changed", room.turn);
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players.includes(socket.id)) {
        io.to(roomId).emit("opponent-left");
        delete rooms[roomId];
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
