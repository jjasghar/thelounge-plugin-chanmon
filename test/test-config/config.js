module.exports = {
  "public": false,
  "host": "127.0.0.1",
  "port": 9001,
  "reverseProxy": false,
  "maxHistory": 10000,
  "https": {
    "enable": false,
    "key": "",
    "certificate": ""
  },
  "theme": "default",
  "prefetch": false,
  "prefetchStorage": false,
  "prefetchMaxImageSize": 512,
  "prefetchTimeout": 5000,
  "fileUpload": {
    "enable": false,
    "maxFileSize": 10240,
    "baseUrl": null
  },
  "transports": [
    "polling",
    "websocket"
  ],
  "leaveMessage": "The Lounge - https://thelounge.chat",
  "defaults": {
    "name": "Freenode",
    "host": "chat.freenode.net",
    "port": 6697,
    "password": "",
    "tls": true,
    "rejectUnauthorized": true,
    "nick": "lounge-user",
    "username": "lounge-user",
    "realname": "The Lounge User",
    "join": "#thelounge"
  }
};