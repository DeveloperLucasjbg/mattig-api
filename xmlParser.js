const URI = "https://feeds.adinco.net/10197/ar_adinco.xml";const https = require("https");const xml2js = require("xml2js");const parser = new xml2js.Parser();const concat = require("concat-stream");parser.on("error", function (err) {
});const fetcher = new Promise((resolve, reject) => {
	https.get(URI, (resp) => {
		resp.on("error", (err) => {
			console.log("Error while reading" + new Date, err);
		});
		resp.pipe(
			concat((buffer) => {
				let str = buffer.toString();
				parser.parseString(str, (err, res) => {
					resolve(res["ADS"]["ad"]);
				});
			})
		);
	});
});
exports.fetcher = fetcher;
