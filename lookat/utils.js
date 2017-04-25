"use strict";

const get_timestamp = (s) => {
	return new Date(s).getTime();
}
exports.get_timestamp = get_timestamp;

const get_val_from_cookie = (response, key, cookie) => {
	try {
		if (cookie.indexOf(key) !== -1) {
			const start = cookie.indexOf(key) + key.length + 1;
			let end = cookie.indexOf(';', start);
			end = (end === -1) ? cookie.length : end;
			return cookie.substring(start, end);
		}
	} catch (e) {
		return "error";
	}
}
exports.get_val_from_cookie = get_val_from_cookie;

