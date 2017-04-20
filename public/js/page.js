$.fn.toggler = function(elm, a, b) {
	return this.each(function() {
		var flag = false;
		$(this).on("click", function () {
			flag = !flag;
			if (flag) {
				return a.apply(this, arguments);
			}
			return b.apply(this, arguments);
		});
	});
};
