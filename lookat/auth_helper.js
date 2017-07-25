"use strict";

const my_utils = require("./utils");
const my_mail = require("./mail");
const my_cnf = require("./config");

const COOKIE_MAX_AGE = 3600 * 12; // sec

const oauth2 = require("simple-oauth2").create(my_cnf["KEYS"]);
const redirect_uri = "http://localhost:8000/authorize";
const scopes = [
	"openid",
	"offline_access",
	"https://outlook.office.com/mail.read"
];

function get_auth_url() {
	const ret = oauth2.authorizationCode.authorizeURL({
		redirect_uri: redirect_uri,
		scope: scopes.join(" ")
	});
	return ret;
}
exports.get_auth_url = get_auth_url;

function get_token_from_code(auth_code, callback, response) {
	let token;
	oauth2.authorizationCode.getToken({
		code: auth_code,
		redirect_uri: redirect_uri,
		scope: scopes.join(" ")
	}, function(error, result) {
		if (error) {
			callback(response, error, null);
		} else {
			token = oauth2.accessToken.create(result);
			callback(response, null, token);
		}
	});
}
exports.get_token_from_code = get_token_from_code;

function get_access_token(authed, request, response, callback){
	if (!authed) {
		console.log("[get_access_token]" + request.headers.cookie);
		const refresh_token = my_utils.get_val_from_cookie(response, 'lookat-refresh-token', request.headers.cookie);
		refresh_access_token(refresh_token, function(error, newToken) {
			if (error) {
				console.log("refresh_access_token: Error");
				callback(error, null);
			} else if (newToken) {
				const cookies = [
					'lookat-token=' + newToken.token.access_token + ';Max-Age=' + COOKIE_MAX_AGE,
					'lookat-refresh-token=' + newToken.token.refresh_token + ';Max-Age=' + COOKIE_MAX_AGE,
					'lookat-token-expires=' + newToken.token.expires_at.getTime() + ';Max-Age=' + COOKIE_MAX_AGE
				];
				console.log(cookies);
				response.setHeader("Set-Cookie", cookies);
				callback(null, newToken.token.access_token);
			}
		});
	} else {
		const access_token = my_utils.get_val_from_cookie(response, 'lookat-token', request.headers.cookie);
		callback(null, access_token);
	}
}
exports.get_access_token = get_access_token;

function refresh_access_token(refreshToken, callback){
	console.log("\n\n\nAIEEE:" + refreshToken);
	const tokenObj = oauth2.accessToken.create({refresh_token: refreshToken});
	tokenObj.refresh(callback);
}
exports.refresh_access_token = refresh_access_token;

function set_cookies(response, error, token){
	if (error) {
		response.send(error);
	} else {
		my_mail.get_user_email(token.token.access_token, function(error, email) {
			if (error) {
				response.write("<p>ERROR: " + error + "</p>");
				response.end();
			} else if (email) {
				const cookies = [
					'lookat-token=' + token.token.access_token + ';Max-Age=' + COOKIE_MAX_AGE,
					'lookat-refresh-token=' + token.token.refresh_token + ';Max-Age=' + COOKIE_MAX_AGE,
					'lookat-token-expires=' + token.token.expires_at.getTime() + ';Max-Age=' + COOKIE_MAX_AGE,
					'lookat-email=' + email + ';Max-Age=' + COOKIE_MAX_AGE
				];
				response.setHeader("Set-Cookie", cookies);
				response.writeHead(302, {"Location": my_cnf["SERVER"] + "/mail"});
				response.end();
			}
		});
	}
}
exports.set_cookies = set_cookies;
