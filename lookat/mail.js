"use strict";

const outlook = require("node-outlook");

const my_db = require("./db");

function get_user_email(token, callback) {
	outlook.base.setApiEndpoint("https://outlook.office.com/api/v2.0");
	const queryParams = {
		"$select": "DisplayName, EmailAddress",
	};
	outlook.base.getUser({token: token, odataParams: queryParams}, function(error, user) {
		if (error) {
			callback(error, null);
		} else {
			console.log("[get_user_email]", user.EmailAddress);
			callback(null, user.EmailAddress);
		}
	});
}
exports.get_user_email = get_user_email;

function get_mails(email, token, opts, callback) {
	outlook.base.setApiEndpoint("https://outlook.office.com/api/v2.0");
	outlook.base.setAnchorMailbox(email);
	outlook.mail.getMessages({token: token, useMe: true, odataParams: opts, folderId: "Inbox"}, (error, result) => {
		if (result) {
			const mails = result.value.reverse();
			for (var i = 0; i < mails.length; i++) {
				let msg = my_db.parse_mails(mails[i]);
				console.log(msg["date"]);
				my_db.insert_mails(msg, (data) => {
					callback(data);
				});
			}
			my_db.load_fin();
		}
	});
}
exports.get_mails = get_mails;
