const URI = "https://feeds.adinco.net/10197/ar_adinco.xml";
const https = require("https");
const xml2js = require("xml2js");
const concat = require("concat-stream");

const fetcher = new Promise((resolve) => {
	try {
		const req = https.get(URI, (resp) => {
			if (resp.statusCode !== 200) {
				// Consumir y resolver vacío para no romper el servicio
				resp.resume();
				return resolve([]);
			}

			resp.on("error", () => {
				return resolve([]);
			});

			resp.pipe(
				concat((buffer) => {
					const str = buffer.toString("utf8");
					const parser = new xml2js.Parser({ explicitArray: false, trim: true });
					parser.parseString(str, (err, result) => {
						if (err || !result || !result.ADS) {
							return resolve([]);
						}
						const adsNode = result.ADS.ad || [];
						if (Array.isArray(adsNode)) {
							return resolve(adsNode);
						}
						return resolve([adsNode]);
					});
				})
			);
		});

		req.on("error", () => {
			return resolve([]);
		});
	} catch (_) {
		return resolve([]);
	}
});

exports.fetcher = fetcher;
