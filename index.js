import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";
import "dotenv/config";
import jwt from "jsonwebtoken";

const app = express();
const PORT = process.env.PORT || 5000;

const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

app.use(
  cors({
    origin: ["http://localhost:3000", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
  })
);
app.use(express.json());

app.use((req, res, next) => {
  if (req.url.startsWith("/api/")) {
    req.url = req.url.slice(4);
  } else if (req.url === "/api") {
    req.url = "/";
  }
  next();
});

const mongoClient = await connectToMongoDB();
const db = mongoClient.db("studio-assignment-8");
const studioCollection = db.collection("studios");
const bookingCollection = db.collection("bookings");
const userCollection = db.collection("users");
const wishlistCollection = db.collection("wishlists");

const getQueryId = (id) => {
  try {
    return { _id: new ObjectId(id) };
  } catch {
    return { _id: id };
  }
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ success: false, message: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ success: false, message: "Unauthorized!" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).send({ success: false, message: "Unauthorized or invalid token!" });
  }
};

app.get("/", (req, res) => {
  res.send({ message: "StudioSpace Server is running fine!" });
});

app.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, photoURL } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({ success: false, message: "Name, email, and password are required." });
    }

    const existingUser = await userCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ success: false, message: "User already exists with this email address." });
    }

    const newUser = {
      name,
      email,
      password,
      photoURL:
        photoURL ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      role: "creator",
      createdAt: new Date(),
    };

    const result = await userCollection.insertOne(newUser);
    res.status(201).send({ success: true, message: "Registration successful! Please log in.", insertedId: result.insertedId });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ success: false, message: "Email and password are required." });
    }

    const user = await userCollection.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).send({ success: false, message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role || "creator" },
      process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321",
      { expiresIn: "7d" }
    );

    res.send({
      success: true,
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role || "creator",
      },
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.post("/auth/google", async (req, res) => {
  try {
    const { name, email, photoURL } = req.body;
    if (!email) {
      return res.status(400).send({ success: false, message: "Email is required." });
    }

    let user = await userCollection.findOne({ email });
    if (!user) {
      const newUser = {
        name: name || "Creative Member",
        email,
        photoURL:
          photoURL ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        role: "creator",
        createdAt: new Date(),
      };
      const result = await userCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name, role: user.role || "creator" },
      process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321",
      { expiresIn: "7d" }
    );

    res.send({
      success: true,
      message: `Signed in as ${user.name}`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role || "creator",
      },
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get("/auth/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ success: false, message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ success: false, message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
    );
    const user = await userCollection.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    }
    res.send({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        role: user.role || "creator",
      },
    });
  } catch (err) {
    res.status(401).send({ success: false, message: "Invalid token" });
  }
});

app.post("/auth/logout", (req, res) => {
  res.send({ success: true, message: "Logged out successfully" });
});

app.get(["/studios", "/destinations"], async (req, res) => {
  try {
    const { category, search, maxPrice, sort } = req.query;
    const query = {};

    if (category && category !== "All") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { overview: { $regex: search, $options: "i" } },
      ];
    }

    if (maxPrice) {
      query.hourlyRate = { $lte: Number(maxPrice) };
    }

    let cursor = studioCollection.find(query);

    if (sort === "price-asc") {
      cursor = cursor.sort({ hourlyRate: 1 });
    } else if (sort === "price-desc") {
      cursor = cursor.sort({ hourlyRate: -1 });
    } else if (sort === "rating") {
      cursor = cursor.sort({ rating: -1 });
    } else {
      cursor = cursor.sort({ createdAt: -1 });
    }

    const result = await cursor.toArray();
    res.send({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get(["/studios/featured", "/featured-destinations", "/featured-studios"], async (req, res) => {
  try {
    const result = await studioCollection.find().limit(6).toArray();
    res.send({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get(["/studios/user/:email", "/my-studios/:email"], async (req, res) => {
  try {
    const { email } = req.params;
    const result = await studioCollection.find({ ownerEmail: email }).toArray();
    res.send({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get(["/studios/:id", "/destination/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await studioCollection.findOne(getQueryId(id));
    if (!result) {
      return res.status(404).send({ success: false, message: "Studio workspace not found." });
    }
    res.send({ success: true, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.post(["/studios", "/add-destination", "/add-studio"], async (req, res) => {
  try {
    const data = req.body;
    let ownerEmail = data.ownerEmail;
    let ownerName = data.ownerName;
    let ownerPhoto = data.ownerPhoto;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
        );
        ownerEmail = ownerEmail || decoded.email;
        ownerName = ownerName || decoded.name;
      } catch { }
    }

    const newStudio = {
      ...data,
      ownerEmail: ownerEmail || "creator@studiospace.io",
      ownerName: ownerName || "Studio Host",
      ownerPhoto:
        ownerPhoto ||
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      rating: data.rating || 5.0,
      reviewCount: data.reviewCount || 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await studioCollection.insertOne(newStudio);
    res.status(201).send({
      success: true,
      message: "Studio listed successfully!",
      insertedId: result.insertedId,
      data: { ...newStudio, _id: result.insertedId },
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.put(["/studios/:id", "/destination/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();

    const result = await studioCollection.updateOne(getQueryId(id), { $set: updateData });
    res.send({ success: true, message: "Studio workspace updated successfully!", data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.patch(["/studios/:id", "/destination/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    updateData.updatedAt = new Date();

    const result = await studioCollection.updateOne(getQueryId(id), { $set: updateData });
    res.send({ success: true, message: "Studio workspace updated successfully!", data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.delete(["/studios/:id", "/destination/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await studioCollection.deleteOne(getQueryId(id));
    res.send({ success: true, message: "Studio workspace listing deleted.", data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.post(["/bookings", "/booking"], async (req, res) => {
  try {
    const data = req.body;
    let userEmail = data.userEmail;
    let userName = data.userName;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
        );
        userEmail = userEmail || decoded.email;
        userName = userName || decoded.name;
      } catch { }
    }

    const studio = await studioCollection.findOne(getQueryId(data.studioId));

    const newBooking = {
      studioId: data.studioId,
      studio: studio || {},
      studioTitle: studio?.title || "Studio Workspace",
      studioImage: studio?.image || "",
      studioLocation: studio?.location || "",
      userEmail: userEmail || "creator@studiospace.io",
      userName: userName || "Creator Member",
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      totalHours: Number(data.totalHours),
      totalAmount: Number(data.totalAmount),
      securityDeposit: Number(data.securityDeposit || 0),
      specialRequests: data.specialRequests || "",
      status: "Pending",
      createdAt: new Date(),
    };

    const result = await bookingCollection.insertOne(newBooking);
    res.status(201).send({
      success: true,
      message: "Studio booking request submitted successfully!",
      insertedId: result.insertedId,
      data: { ...newBooking, _id: result.insertedId },
    });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get(["/bookings/my", "/my-bookings", "/my-bookings/:email"], async (req, res) => {
  try {
    let email = req.params.email || req.query.email || req.query.userEmail;

    const authHeader = req.headers.authorization;
    if (!email && authHeader) {
      try {
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
        );
        email = decoded.email;
      } catch { }
    }

    const query = email ? { $or: [{ userEmail: email }, { email: email }] } : {};
    const result = await bookingCollection.find(query).sort({ createdAt: -1 }).toArray();
    res.send({ success: true, count: result.length, data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.patch(["/bookings/:id/cancel", "/booking/:id/cancel"], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await bookingCollection.updateOne(getQueryId(id), {
      $set: { status: "Cancelled", cancelledAt: new Date() },
    });
    res.send({ success: true, message: "Booking reservation cancelled.", data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.delete(["/my-bookings/:id", "/bookings/:id"], async (req, res) => {
  try {
    const { id } = req.params;
    const result = await bookingCollection.deleteOne(getQueryId(id));
    res.send({ success: true, message: "Booking removed successfully.", data: result });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get("/wishlist", async (req, res) => {
  try {
    let userEmail = "creator@studiospace.io";
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
        );
        userEmail = decoded.email;
      } catch { }
    }

    const items = await wishlistCollection.find({ userEmail }).toArray();
    const studioIds = items.map((it) => it.studioId);
    if (!studioIds.length) {
      return res.send({ success: true, count: 0, data: [] });
    }
    const studios = await studioCollection
      .find({
        $or: studioIds.map((id) => getQueryId(id)),
      })
      .toArray();

    res.send({ success: true, count: studios.length, data: studios });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.get("/wishlist/ids", async (req, res) => {
  try {
    let userEmail = "creator@studiospace.io";
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
        );
        userEmail = decoded.email;
      } catch { }
    }

    const items = await wishlistCollection.find({ userEmail }).toArray();
    const ids = items.map((it) => String(it.studioId));
    res.send({ success: true, data: ids, ids: ids });
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.post("/wishlist/toggle", async (req, res) => {
  try {
    const { studioId } = req.body;
    let userEmail = "creator@studiospace.io";
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET || "studiospace_secure_jwt_secret_token_987654321"
        );
        userEmail = decoded.email;
      } catch { }
    }

    const existing = await wishlistCollection.findOne({ userEmail, studioId });
    if (existing) {
      await wishlistCollection.deleteOne({ _id: existing._id });
      res.send({ success: true, saved: false, message: "Removed from saved workspaces." });
    } else {
      await wishlistCollection.insertOne({ userEmail, studioId, createdAt: new Date() });
      res.send({ success: true, saved: true, message: "Workspace saved to your wishlist!" });
    }
  } catch (err) {
    res.status(500).send({ success: false, message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});

export default app;
