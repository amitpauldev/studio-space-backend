import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import dotenv from "dotenv";
import { createRemoteJWKSet, jwtVerify } from "jose";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

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
const bookings = db.collection("user_booking");

// verify header token for Post, Update and Delete Requests
const verifyToken = async (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(500).json({ msg: "Unauthorized" });
	}
	const token = authHeader.split(" ")[1];
	if (!token) {
		return res.status(500).json({ msg: "Unauthorized" });
	}

	const JWKS = createRemoteJWKSet(
		new URL(`${process.env.FRONTEND_URL}/api/auth/jwks`),
	);

	try {
		const { payload } = await jwtVerify(token, JWKS);
		next();
	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error" });
	}
};

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
	const authenticated = req.headers.authentication;
	console.log(authenticated);
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

// Single studio by category
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

// Single studio by id
app.get("/studios/id/:id", async (req, res) => {
	try {
		const studio = await studios.findOne({
			_id: new ObjectId(req.params.id),
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

app.get("/bookings", async (req, res) => {
	try {
		const bookingsData = await bookings.find().toArray();
		res.json(bookingsData);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// Post routes
app.post("/studios", verifyToken, async (req, res) => {
	try {
		const newStudio = req.body;
		const result = await studios.insertOne(newStudio);
		res.status(201).json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.post("/bookings", verifyToken, async (req, res) => {
	try {
		const newBooking = req.body;
		const result = await bookings.insertOne(newBooking);
		res.status(201).json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// Update routes
app.patch("/studios/:id", verifyToken, async (req, res) => {
	try {
		const { _id, ...updatedData } = req.body;
		const result = await studios.updateOne(
			{ _id: new ObjectId(req.params.id) },
			{ $set: updatedData },
		);
		res.json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error!" });
	}
});

app.patch("/bookings/:id", verifyToken, async (req, res) => {
	try {
		const { status } = req.body;
		const result = await studios.updateOne(
			{ _id: new ObjectId(req.params.id) },
			{ $set: { status: status } },
		);
		res.json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error!" });
	}
});

// Delete routes
app.delete("/studios/:id", verifyToken, async (req, res) => {
	try {
		const result = await studios.deleteOne({
			_id: new ObjectId(req.params.id),
		});
		res.json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Internal Server Error!" });
	}
});

app.listen(PORT, () => {
	console.log(`Server is running at ${PORT}`);
});

export default app;
