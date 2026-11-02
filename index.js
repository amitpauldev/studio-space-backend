import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

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
const categories = db.collection("all_categories");

// Middleware
app.use(cors());
app.use(express.json());

// Get routes
app.get("/", async (req, res) => {
	res.send("Welcome to the Studio Space API!");
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
app.get("/featured-studios", async (req, res) => {
	try {
		const featuredStudios = await studios
			.find()
			.sort({ createdAt: -1 })
			.limit(6)
			.toArray();
		res.json(featuredStudios);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.get("/studios/:category", async (req, res) => {
	try {
		const category = req.params.category;
		const studio = await studios
			.find({
				category: category,
			})
			.toArray();
		if (!studio) {
			return res.status(404).json({ error: "Studio not found" });
		}
		res.json(studio);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.get("/categories", async (req, res) => {
	try {
		const categoriesData = await categories.find().toArray();
		res.json(categoriesData);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.get("/categories/:category", async (req, res) => {
	try {
		const category = req.params.category;
		const categoryData = await categories
			.find({ categorySlug: category })
			.toArray();
		res.json(categoryData);
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

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
});
