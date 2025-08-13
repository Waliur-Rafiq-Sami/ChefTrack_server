const express = require("express");
const cors = require("cors");

require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ytzwbuc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Foods
    const FoodsCollection = client
      .db("chefTrack")
      .collection("FoodsCollection");

    // users
    const userInformationCollection = client
      .db("chefTrack")
      .collection("userInformation");

    //userInformation
    app.get("/profile/:email", async (req, res) => {
      const userEmail = req.params.email;
      // console.log(userEmail);
      const query = { email: userEmail };
      const result = await userInformationCollection.findOne(query);
      res.send(result);
    });
    app.put("/profile", async (req, res) => {
      const addUser = req.body;
      const userEmail = addUser.email;
      // console.log("Received email:", userEmail);
      // console.log("Received:", addUser);
      const filter = { email: userEmail };
      const updateDoc = {
        $set: {
          displayName: addUser.displayName,
          phone: addUser.phone,
          photoURL: addUser.photoURL,
          address: addUser.address,
        },
      };
      const result = await userInformationCollection.updateOne(
        filter,
        updateDoc,
        { upsert: true }
      );
      res.send(result);
    });

    //foods

    // AddFood
    app.post("/addFoods", async (req, res) => {
      const newFoodItem = req.body;
      // console.log(newFoodItem);
      const result = await FoodsCollection.insertOne(newFoodItem);
      res.send(result);
    });

    //allFoods
    app.get("/allFoods");

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("cooking");
});
app.listen(port, () => {
  console.log("ChefTrack Server is running on port " + `${port}`);
});
