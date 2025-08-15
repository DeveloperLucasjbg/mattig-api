const URI = "https://feeds.adinco.net/10197/ar_adinco.xml";
const https = require("https");
const xml2js = require("xml2js");
const concat = require("concat-stream");

const fetcher = new Promise((resolve) => {
	let settled = false;
	const safeResolve = (value) => {
		if (settled) return;
		settled = true;
		resolve(value);
	};

	try {
		const req = https.get(URI, (resp) => {
			if (resp.statusCode !== 200) {
				resp.resume();
				return safeResolve([]);
			}

			resp.on("error", () => safeResolve([]));

			resp.pipe(
				concat((buffer) => {
					const str = buffer.toString("utf8");
					const parser = new xml2js.Parser({ explicitArray: false, trim: true });

					parser.on("error", () => safeResolve([]));

					parser.parseString(str, (err, result) => {
						if (err || !result || !result.ADS) {
							return safeResolve([]);
						}
						const adsNode = result.ADS.ad || [];
						if (Array.isArray(adsNode)) {
							return safeResolve(adsNode);
						}
						return safeResolve([adsNode]);
					});
				})
			).on("error", () => safeResolve([]));
		});

		req.on("error", () => safeResolve([]));
		req.setTimeout(15000, () => {
			try { req.destroy(); } catch (_) {}
			safeResolve([]);
		});
	} catch (_) {
		return safeResolve([]);
	}
});

exports.fetcher = fetcher;
