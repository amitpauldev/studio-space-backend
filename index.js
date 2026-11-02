import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

// Connect to MongoDB
const client = new MongoClient(process.env.MONGODB_URI);
export async function connectToMongoDB() {
	try {
		await client.connect();
		console.log("Successfully connected to MongoDB!");
		return client;
	} catch (err) {
		console.dir(err);
	}
}
const mongodbClient = await connectToMongoDB();
const db = mongodbClient.db("studio_space");
const studios = db.collection("all_studios");

// Middleware
app.use(cors());
app.use(express.json());

// Get routes
app.get("/", (req, res) => {
	res.send("Server is running!");
});
app.get("/studios", async (req, res) => {
	try {
		const studiosData = await studios.find().toArray();
		res.json(studiosData);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});
app.get("/studios/:id", async (req, res) => {
	try {
		const studioId = req.params.id;
		const studio = await studios.findOne({
			_id: new ObjectId(studioId),
		});
		if (!studio) {
			return res.status(404).json({ error: "Studio not found" });
		}
		res.json(studio);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// Post routes
app.post("/studios", async (req, res) => {
	try {
		const newStudio = req.body;
		const result = await studios.insertOne(newStudio);
		res.status(201).json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.listen(process.env.PORT, () => {
	console.log(`Server is running on port ${process.env.PORT}`);
});
