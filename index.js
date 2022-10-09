const {app} = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log("live on " + PORT );
});


app.get("/props", (req, res) => {
	console.log(req.body);
	res.status(200).send({
		algo: "algo",
	});
});
