const { app, BrowserWindow, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const { mouse, Point, keyboard } = require("@nut-tree-fork/nut-js");
const socket = require('socket.io-client')('http://localhost:5000');
const { v4: uuidv4 } = require('uuid'); // To generate room ID

let mainWindow;
// let roomId = uuidv4(); // Unique room ID for each client


app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    mainWindow.webContents.openDevTools();
    mainWindow.removeMenu();
    mainWindow.loadFile('index.html');

    // Emit room ID on client connection
    // console.log(roomId, "Room Id from frontend App.js");


    socket.on("start-sharing", async function () {
        console.log("Admin connected, starting screen sharing");
        await startScreenShare();
    });

    socket.on("mouse-move", async function (data) {
        console.log(data, "Mouse Moving Data");
        try {
            let { x, y } = JSON.parse(data);
            console.log(x, y, "Mouse Moving Data");
            await mouse.move(new Point(x, y));
        } catch (err) {
            console.error("Error in moving mouse:", err);
        }
    });

    socket.on("mouse-click", async () => {
        try {
            await mouse.leftClick();
        } catch (err) {
            console.error("Error in performing mouse click:", err);
        }
    });

    socket.on("mouse-type", async (data) => {
        try {
            const { key } = JSON.parse(data);
            await keyboard.type(key);
        } catch (err) {
            console.error("Error in typing key:", err);
        }
    });
});

ipcMain.handle('get-sources', async () => {
    return await desktopCapturer.getSources({ types: ['screen', 'window'] });
});
