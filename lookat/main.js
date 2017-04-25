"use strict";

require("../app");
const electron = require("electron");

const {app} = electron;
const {BrowserWindow} = electron;

let win = null;
app.on("ready", () => {
	win = new BrowserWindow({
		title: "るっく＠",
		width: 800,
		height: 500,
		transparent: true,
		frame: false,
		webPreferences: {nodeIntegration: false}
	});
	win.loadURL("http://localhost:8000/");

	win.on("closed", () => {
		win = null;
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
