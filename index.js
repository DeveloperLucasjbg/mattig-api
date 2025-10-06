const { app } = require("./app");
const { getProps, startAutoRefresh } = require("./dataCache");
const PORT = process.env.PORT || 3000;
let counter = 0;
let propsQuantity = 0;
app.listen(PORT, () => {
    console.log("live on " + PORT);
    // start background refresh schedule (12h)
    startAutoRefresh();
});
app.get("/props", async (req, res) => {
    counter++;
    console.log("[AdincoFeed] /props solicitado, contador:", counter);
    try {
        const props = await getProps();
        propsQuantity = Array.isArray(props) ? props.length : 0;
        console.log("[AdincoFeed] /props respondiendo cantidad:", propsQuantity);
        res.status(200).send(props || []);
    } catch (err) {
        console.error("[AdincoFeed] Error sirviendo /props:", err);
        res.status(500).send({ error: "Error interno obteniendo propiedades" });
    }
});
app.get("/getCount", async (req, res) => {
	res.status(200).send(counter.toString());
});
app.get("/getQuantity", async (req, res) => {
	res.status(200).send(propsQuantity.toString());
});
