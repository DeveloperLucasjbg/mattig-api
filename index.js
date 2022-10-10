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
	let props = await fetcher;
	if (props) {
		propsQuantity = props?.length;
	}
	res.status(200).send(props);
});
app.get("/getCount", async (req, res) => {
	res.status(200).send(counter.toString());
});
app.get("/getQuantity", async (req, res) => {
	res.status(200).send(propsQuantity.toString());
});
