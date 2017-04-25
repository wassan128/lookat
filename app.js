"use strict";

const urllib = require("url");
const express = require("express");
const app = module.exports.app = express();

const http_con = require("http");
const server = http_con.Server(app);
const io = require("socket.io").listen(server);

const my_utils = require("./lookat/utils");
const my_auth_helper = require("./lookat/auth_helper");
const my_db = require("./lookat/db");
const my_mail = require("./lookat/mail");
const my_cnf = require("./lookat/config");

/* express settings */
app.use(express.static(__dirname + "/public"));

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

/* routing */
app.get("/", (req, res) => {
	if (!is_auth(res, req)) {
		res.render("index", {title: "るっく＠", auth_url: my_auth_helper.get_auth_url()});
	} else {
		res.redirect("/mail");
	}
});

app.get("/authorize", (req, res) => {
	const url_parts = urllib.parse(req.url, true);
	const code = url_parts.query.code;
	my_auth_helper.get_token_from_code(code, my_auth_helper.set_cookies, res);
});

app.get("/mail", (req, res) => {
	my_db.fetch_mails((data) => {
		res.render("mail", {title: "るっく＠受信箱", message: data});
	});
});

app.get("/update", (req, res) => {
	const authed = is_auth(res, req);
	my_auth_helper.get_access_token(authed, req, res, function(error, token) {
		if (token) {
			const email = my_utils.get_val_from_cookie(res, 'lookat-email', req.headers.cookie);
			const opts = {
				"$select": "Id,Body,Subject,ReceivedDateTime,From",
				"$orderby": "ReceivedDateTime desc",
				"$top": 15
			};
			my_mail.get_mails(email, token, opts, (data) => {
				if (data != null) {
					io.emit("newmail", data);
				}
			});
			res.send("");
		} else {
			res.send("No token error! at get_access_token");
		}
	});
});

app.get("/logout", (req, res) => {
	res.clearCookie("lookat-token");
	res.clearCookie("lookat-refresh-token");
	res.clearCookie("lookat-token-expires");
	res.clearCookie("lookat-email");

	res.redirect("/");
});

const is_auth = (res, req) => {
	const cookie = my_utils.get_val_from_cookie(res, 'lookat-token-expires', req.headers.cookie);
	if (cookie === "error") return false;
	
	const expiration = new Date(parseFloat(cookie));
	return (expiration < new Date()) ? false : true;
}


/* Events handlig (using socket.io) */
io.on("connection", function(socket) {
	socket.on("disconnect", function() {
	});

	socket.on("fav", function(ids) {
		my_db.set_flag_val("fav", 1, ids, (ret) => {
			io.emit("faved", ret);
		});
	});

	socket.on("del", function(ids) {
		my_db.set_flag_val("del", 1, ids, (ret) => {
			io.emit("deled", ret);
		});
	});

	socket.on("unfav", function(ids) {
		my_db.set_flag_val("fav", 0, ids, (ret) => {
			io.emit("unfaved", ret);
		});
	});

	socket.on("get_mailbody_call", function(ids) {
		my_db.get_mailbody(ids, (ret) => {
			io.emit("get_mailbody_ret", ret);
		});
	});
});
server.listen(my_cnf["PORT"]);
