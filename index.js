const { app } = require("./app");
const { fetcher } = require("./xmlParser.js");
const PORT = process.env.PORT || 3000;
let counter = 0;
let propsQuantity = 0;
app.listen(PORT, () => {
	console.log("live on " + PORT);
});
app.get("/props", async (req, res) => {
    counter++;
    console.log("[AdincoFeed] /props solicitado, contador:", counter);
    try {
        const props = await fetcher;
        if (props) {
            propsQuantity = props?.length;
        }
        console.log("[AdincoFeed] /props respondiendo cantidad:", propsQuantity);
        res.status(200).send(props);
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
