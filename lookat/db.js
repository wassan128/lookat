"use strict";

const MAIL_BOX_DB = "mailbox.db";
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(MAIL_BOX_DB);
const sound = require("simplayer");

const my_utils = require("./utils");
const my_cnf = require("./config");

const SOUND_PATH = my_cnf["SERVER"] + "/sound";

const SCHEMA = `
create table if not exists messages(
    id integer primary key autoincrement,
    msg_id,
    date,
    sender,
    email,
    subject,
    content,
    del_flag,
    fav_flag
);`;

function fetch_mails(callback){
	db.serialize(() => {
		db.run(SCHEMA);
		db.all("select id,msg_id,date,sender,email,subject,fav_flag from messages where del_flag=0 order by id desc", (error, result) => {
			if (error) {
				console.log(error);
			} else {
				callback(result);
			}
		});
	});
}
exports.fetch_mails = fetch_mails;

function get_prev_date(callback) {
	let prev_date = null;
	db.serialize(() => {
		db.get("select date from messages where id=(select max(id) from messages)", (error, row) => {
			if (!error) {
				prev_date = (row) ? my_utils.get_timestamp(row["date"]) : 0;
			}
			callback(prev_date);
		});
	});
}

function parse_mails(message) {
	let msg = {};
	msg["msg_id"] = message.Id.split("==")[0];
	msg["date"] = new Date(message.ReceivedDateTime).toLocaleString();
	msg["sender"] = message.From ? message.From.EmailAddress.Name : "名無し";
	msg["email"] = message.From ? message.From.EmailAddress.Address : "none";
	msg["subject"] = message.Subject;

	if (message.Body.ContentType == "Text") {
		msg["content"] = message.Body.Content.replace(/\r\n/g, "<br/>");
	} else {
		msg["content"] = message.Body.Content;
	}
	return msg;
}
exports.parse_mails = parse_mails;

function get_latest_rowid(stmt, data){
	return new Promise((resolve, reject) => {
		db.serialize(() => {
			stmt.run(data, (error) => {
				if (!error) {
					db.get("select id from messages where msg_id = ?", data[1], (error, row) => {
						console.log(data[1], row);
						if (error) {
							reject(error);
						} else {
							resolve(row["id"]);
						}
					});
				} else {
					reject(error);
				}
			});
		});
	});
}

let load_flag = false;
function insert_mails(msg, callback) {
	db.serialize(() => {
		const stmt = db.prepare("insert into messages values (?,?,?,?,?,?,?,?,?)");
		get_prev_date((prev_date) => {
			let newest_date = my_utils.get_timestamp(msg["date"]);
			console.log("date: " + newest_date, " prev_date: ", prev_date);
			if (prev_date != null && prev_date < newest_date) {
				if (!load_flag) {
					load_flag = true;
					const music = sound(SOUND_PATH + "/gotmail.wav");
				}
				
				const data = [null, msg["msg_id"], msg["date"], msg["sender"], msg["email"], msg["subject"], msg["content"], 0, 0];
				get_latest_rowid(stmt, data).then((val) => {
					callback({
						"id": val,
						"msg_id": msg["id"],
						"date": msg["date"],
						"sender": msg["sender"],
						"email": msg["email"],
						"subject": msg["subject"],
					});
				});
			}
		});
	});
}
exports.insert_mails = insert_mails;

function load_fin() {
    load_flag = false;
}
exports.load_fin = load_fin;

function get_mailbody(ids, callback) {
	db.serialize(() => {
		db.get("select content from messages where id= ?", {
			1: ids
		}, (error, row) => {
			if (error || row === undefined) {
				callback({"error": error, "ids": ids, "content": null});
			} else {
				callback({"error": null, "ids": ids, "content": row["content"]});
			}
		});
	});
}
exports.get_mailbody = get_mailbody;

function set_flag_val(target, val, ids, callback) {
	let stmt;
	if (target === "del") {
		stmt = db.prepare("update messages set subject='', content='', " + target + "_flag=" + val + " where id=?");
	} else {
		stmt = db.prepare("update messages set " + target + "_flag=" + val + " where id=?");
	}
	db.serialize(() => {
		stmt.run(ids, (error) => {
			if (error) {
				callback({"error": error, "ids": null});
			} else {
				callback({"error": null, "ids": ids});
			}
		});
	});
}
exports.set_flag_val = set_flag_val;

function delete_by_id(ids, callback) {
	const stmt = db.prepare("delete from messages where id=?")
	db.serialize(() => {
		stmt.run(ids, (error) => {
			if (error) {
				callback({"error": error, "ids": null});
			} else {
				callback({"error": null, "ids": ids});
			}
		});
	});
}
exports.delete_by_id = delete_by_id;

function close_db() {
	db.close();
}
exports.close_db = close_db;
