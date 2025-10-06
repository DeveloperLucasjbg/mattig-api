const URI = "https://feeds.adinco.net/10197/ar_adinco.xml";
const https = require("https");
const xml2js = require("xml2js");
const concat = require("concat-stream");

// Helper to get a property by key ignoring case
function getCaseInsensitive(object, key) {
    if (!object || typeof object !== "object") return undefined;
    const desired = String(key).toLowerCase();
    for (const currentKey of Object.keys(object)) {
        if (currentKey.toLowerCase() === desired) return object[currentKey];
    }
    return undefined;
}

// Recursively search for an array of "ad" nodes anywhere in the parsed XML
function findAdNodesDeep(node, depth = 0) {
    if (!node || typeof node !== "object" || depth > 10) return null;

    const adNode = getCaseInsensitive(node, "ad");
    if (adNode) {
        return Array.isArray(adNode) ? adNode : [adNode];
    }

    // Some feeds nest under an "ADS" (or similar) container
    const adsContainer = getCaseInsensitive(node, "ads");
    if (adsContainer) {
        const fromContainer = findAdNodesDeep(adsContainer, depth + 1);
        if (fromContainer && fromContainer.length) return fromContainer;
    }

    // Fallback: explore children
    for (const value of Object.values(node)) {
        if (value && typeof value === "object") {
            const found = findAdNodesDeep(value, depth + 1);
            if (found && found.length) return found;
        }
    }
    return null;
}

const fetcher = new Promise((resolve) => {
	let settled = false;
	const safeResolve = (value) => {
		if (settled) return;
		settled = true;
		resolve(value);
	};

    try {
        console.log("[AdincoFeed] Iniciando fetch de:", URI);
        const requestUrl = new URL(URI);
        const requestOptions = {
            hostname: requestUrl.hostname,
            path: requestUrl.pathname + (requestUrl.search || ""),
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
                Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
                "Accept-Encoding": "identity",
                Connection: "close",
            },
            timeout: 15000,
        };

        const req = https.get(requestOptions, (resp) => {
			console.log(
				"[AdincoFeed] Respuesta recibida - status:",
				resp.statusCode,
				"content-type:",
				resp.headers && resp.headers["content-type"],
				"content-length:",
				resp.headers && resp.headers["content-length"]
			);

			if (resp.statusCode !== 200) {
				console.error("[AdincoFeed] Status no OK:", resp.statusCode);
				resp.resume();
				return safeResolve([]);
			}

			resp.on("error", (err) => {
				console.error("[AdincoFeed] Error en respuesta HTTP:", err);
				safeResolve([]);
			});

			resp.pipe(
				concat((buffer) => {
					const str = buffer.toString("utf8");
					console.log("[AdincoFeed] XML recibido (bytes):", buffer.length);
					try {
						const preview = str.slice(0, 400);
						console.log("[AdincoFeed] Vista previa XML:", preview);
					} catch (_) {}
                    const parser = new xml2js.Parser({
                        explicitArray: false,
                        trim: true,
                        // Normalize tag names to be resilient to casing/prefixes
                        tagNameProcessors: [
                            xml2js.processors && xml2js.processors.stripPrefix ? xml2js.processors.stripPrefix : (n) => n,
                            (name) => (typeof name === "string" ? name.toLowerCase() : name),
                        ],
                    });

					parser.on("error", (err) => {
						console.error("[AdincoFeed] Error parseando XML:", err);
						safeResolve([]);
					});

                    parser.parseString(str, (err, result) => {
                        try {
                            if (err) {
                                console.error("[AdincoFeed] Error en parseString:", err);
                                return safeResolve([]);
                            }

                            if (!result || typeof result !== "object") {
                                console.error("[AdincoFeed] Resultado de XML vacío o inválido");
                                return safeResolve([]);
                            }

                            const adsArray = findAdNodesDeep(result) || [];
                            console.log("[AdincoFeed] Avisos parseados:", adsArray.length);

                            try {
                                const sample = adsArray && adsArray[0] ? adsArray[0] : null;
                                if (sample) {
                                    const sampleCompact = JSON.stringify(sample).slice(0, 500);
                                    console.log("[AdincoFeed] Muestra primer aviso:", sampleCompact);
                                }
                            } catch (_) {}

                            return safeResolve(adsArray);
                        } catch (callbackErr) {
                            console.error("[AdincoFeed] Excepción manejando resultado de parseo:", callbackErr);
                            return safeResolve([]);
                        }
                    });
				})
			).on("error", (err) => {
				console.error("[AdincoFeed] Error en pipe/concat:", err);
				safeResolve([]);
			});
		});

		req.on("error", (err) => {
			console.error("[AdincoFeed] Error en solicitud HTTP:", err);
			safeResolve([]);
		});
		req.setTimeout(15000, () => {
			console.error("[AdincoFeed] Timeout alcanzado (15s) destruyendo request");
			try { req.destroy(); } catch (_) {}
			safeResolve([]);
		});
	} catch (err) {
		console.error("[AdincoFeed] Excepción sin capturar antes de iniciar request:", err);
		return safeResolve([]);
	}
});

exports.fetcher = fetcher;
