/* configures */
const POLLING_RATE = 1000 * 60;
const AUTO_UPDATE = true;
const ISLOAD_AT_START = true;

function check_update() {
	if (AUTO_UPDATE) {
		$.ajax({
			url: "/update",
			type: "get"
		}).done(function() {
			console.log("access succeeded");
		}).fail(function() {
			console.log("access failed");
		});
	}
}

function start_interval() {
	if (ISLOAD_AT_START) {
		check_update();
	}
	setInterval("check_update()", POLLING_RATE);
}

function get_mails_id($elm) {
	return $elm.parent().parent().attr("id").substr(5);
}

$(document).on("ready", function() {
	start_interval();

	var menu = true;
	$(this).on("click", "#menu-button", function() {
		if (menu) {
			$("#head-menu ul").slideDown();
			$("#menu-button img").attr("src", "/image/menu_close.png");
		} else {
			$("#head-menu ul").slideUp();
			$("#menu-button img").attr("src", "/image/menu_open.png");
		}
		menu = !menu;
	});

	var theme = true;
	$(this).on("click", "#menu-theme", function() {
		if (theme) {
			$("#theme").attr("href", "/css/theme_light.css");
		} else {
			$("#theme").attr("href", "/css/theme_dark.css");
		}
		theme = !theme;
	});

	var faved = true;
	$("#menu-faved").on("click", function() {
		$target = $(".mails:not(:has(.fav))");
		if (faved) {
			$target.hide(500);
		} else {
			$target.show(500);
		}
		faved = !faved;
	});

	$("#menu-filter").on("click", function() {
		$("#head-search").slideDown();
	});

	$(".menu-buttons").on("click", function() {
		menu = true;
		$("#head-menu ul").slideUp();
		$("#menu-button img").attr("src", "/image/menu_open.png");
	})

	//search
	$("#menu-search").on("click", function() {
		var keyword = $("#keyword").val();
		$(".mails").hide();
		$(".mails-subject").each(function(){
			var text = $(this).text();
			if (text.indexOf(keyword) != -1) {
				$(this).parent().parent().slideDown();
			}
		});
	});

	$("#menu-no-filter").on("click", function() {
		$(".mails").show();
		$("#head-search").slideUp();
	});

	var socket = io();
	console.log("[socket.io]client connected");
	$(this).on("click", ".mails-delete", function() {
		var ids = get_mails_id($(this));
		console.log("delete for " + ids);
		socket.emit("del", ids);
	});

	$(this).on("click", ".mails-fav", function() {
		if ($(this).hasClass("fav")) {
			socket.emit("unfav", get_mails_id($(this)));
			$(this).removeClass("fav");
		} else {
			socket.emit("fav", get_mails_id($(this)));
			$(this).addClass("fav");
		}
	});

	$(this).on("click", ".mails-body-open", function() {
		$("body#lookat").css("overflow", "hidden");
		if ($("iframe").attr("srcdoc") == "") {
			var ids = get_mails_id($(this));
			console.log("body loading: " + ids);
			socket.emit("get_mailbody_call", ids);
		}
		$("iframe").fadeIn();
		$("#modal-body").slideDown();
		if ($("#mails" + String(ids)).hasClass("newmails")) {
			$("#mails" + String(ids)).removeClass("newmails");
		}
	});
	$(this).on("click", ".mails-body-close", function() {
		$("body#lookat").css("overflow", "");
		$("iframe").fadeOut().attr("srcdoc", "");
		$("#modal-body").slideUp();
	});
	
	socket.on("deled", function(data) {
		if (data["error"]) {
			console.log("[delete]failed");
		} else {
			$("#mails" + String(data["ids"])).slideUp("normal", function() {$(this).remove();});
			console.log("[delete]complete");
		}
	});

	socket.on("get_mailbody_ret", function(data) {
		if (data["error"]) {
			console.log("[getMailBody]failed");
		} else {
			var $tid = $("#modal-body").children("iframe");
			$tid.attr("srcdoc", data["content"]);
		}
	});

	socket.on("newmail", function(data) {
		if (data) {
			var $mails = $("<div>", {class: "mails clearfix newmails", id: "mails" + String(data["id"]), style: "display: none"});
			var $mails_header = $("<div>", {class: "mails-header"})
				.append(
					$("<p>", {class: "mails-sender", text: data["sender"] + " "}).append(
						$("<span>", {class: "mails-email", text: data["email"]})));
			var $mails_body = $("<div>", {class: "mails-body"})
				.append(
					$("<p>", {class: "mails-subject", text: data["subject"]}));
			var $mails_footer = $("<div>", {class: "mails-footer clearfix"})
				.append(
					$("<p>", {class: "mails-date", text: new Date(data["date"]).toLocaleString()}))
				.append(
					$("<p>", {class: "mails-delete"}).append(
						$("<i>", {class: "icon-trash", text: "削除"})))
				.append(
					$("<p>", {class: "mails-fav"}).append(
						$("<i>", {class: "icon-star", text: "お気に入り"})))
				.append(
					$("<p>", {class: "mails-body-open"}).append(
						$("<i>", {class: "icon-mail", text: "本文を開く"})));

			$("div#mailbox").prepend($mails.append($mails_header).append($mails_body).append($mails_footer));
			$(".mails").slideDown();
			console.log("mail from " + data["sender"]);
		} else {
			console.log("no update");
		}
	});
});

