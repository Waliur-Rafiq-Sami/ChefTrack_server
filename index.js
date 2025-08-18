const express = require("express");
const cors = require("cors");

require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cheftrack-ee7fd.web.app",
      "https://cheftrack-ee7fd.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ytzwbuc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = `mongodb+srv://waliurrafiqsami:nxCmgzbI9DmRw58x@cluster0.ytzwbuc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
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
    // PurchaseCollection
    const PurchaseCollection = client
      .db("chefTrack")
      .collection("PurchaseCollection");

    // Home Page Data Load
    app.get("/foodForHomePage", async (req, res) => {
      const q1 = { foodType: "Top food" };
      const r1 = await FoodsCollection.find(q1).limit(6).toArray();
      const q2 = { foodType: "Special" };
      const r2 = await FoodsCollection.find(q2).limit(6).toArray();
      const q3 = { foodType: "Unique" };
      const r3 = await FoodsCollection.find(q3).limit(6).toArray();
      const q4 = { foodType: "Expansive" };
      const r4 = await FoodsCollection.find(q4).limit(6).toArray();
      res.send({ r1, r2, r3, r4 });
    });

    //new user add.
    app.post("/addNewUser", async (req, res) => {
      const data = req.body;
      const filter = { email: req.body.email };
      const isFind = await userInformationCollection.findOne(filter);
      if (isFind) {
        res.send(isFind);
      } else {
        const result = await userInformationCollection.insertOne(data);
        res.send(result);
      }
    });

    // ---------------------------------------------

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
    app.get("/allFood/count", async (req, res) => {
      const count = await FoodsCollection.estimatedDocumentCount();
      res.send(count);
    });

    //Get some food
    app.get("/someFood", async (req, res) => {
      const item = req.query;
      const { foodType, arrayLength } = item;
      // console.log(item);
      // console.log(foodType);
      // console.log(arrayLength);
      const query = { foodType: foodType };
      const result = await FoodsCollection.find(query)
        .limit(parseInt(arrayLength))
        .toArray();
      // console.log(result.length);
      res.send(result);
    });

    // AddFood
    app.post("/addFoods", async (req, res) => {
      const newFoodItem = req.body;
      // console.log(newFoodItem);
      const result = await FoodsCollection.insertOne(newFoodItem);
      res.send(result);
    });

    //allFoods
    // app.get("/allFood", async (req, res) => {
    //   const data = req.query;
    //   console.log(data);
    //   const page = parseInt(data.page) || 0;
    //   const showItem = parseInt(data.showItem) || 6;
    //   console.log(page, showItem);

    //   const cursor = await FoodsCollection.find()
    //     .skip(page * showItem)
    //     .limit(showItem)
    //     .toArray();
    //   res.send(cursor);
    // });

    //allFood
    app.get("/allFood", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 0;
        const showItem = parseInt(req.query.showItem) || 10;

        const search = req.query.search || "";
        const category = req.query.category || "";
        const type = req.query.type || "";
        const minPrice = Number(req.query.minPrice) || 0;
        const maxPrice = Number(req.query.maxPrice) || Infinity;
        const minCal = Number(req.query.minCal) || 0;
        const maxCal = Number(req.query.maxCal) || Infinity;

        const filter = {
          $and: [
            search ? { foodName: { $regex: search, $options: "i" } } : {},
            category ? { foodCategory: category } : {},
            type ? { foodType: type } : {},
            { price: { $gte: minPrice, $lte: maxPrice } },
            { calorie: { $gte: minCal, $lte: maxCal } },
          ],
        };

        const totalCount = await FoodsCollection.countDocuments(filter);

        const items = await FoodsCollection.find(filter)
          .skip(page * showItem)
          .limit(showItem)
          .toArray();

        res.send({ items, totalCount });
      } catch (error) {
        console.error(error);
        res.status(500).send({ items: [], totalCount: 0 });
      }
    });

    //Update a food
    app.put("/updateFood", async (req, res) => {
      const data = req.body;

      const updatedFields = { ...data };
      // console.log(updatedFields);

      delete updatedFields._id;
      const filter = { _id: new ObjectId(data.id) };
      const updateDoc = {
        $set: updatedFields,
      };
      const result = await FoodsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    //single Food delete
    app.delete("/DeleteFood/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await FoodsCollection.deleteOne(filter);
      res.send(result);
    });

    // card data Section
    // post card data
    // app.post("/MyPurchasePage", async (req, res) => {
    //   const { email, foodId, quantity } = req.body;

    //   if (!email || !foodId || !quantity) {
    //     return res.status(400).send({ error: "Missing required fields" });
    //   }
    //   const purchaseDate = new Date().toISOString();
    //   try {
    //     // Step 1: Try updating existing item
    //     // const updateResult = await PurchaseCollection.updateOne(
    //     //   { email, "purchaseItems.foodId": foodId }, // match existing item
    //     //   {
    //     //     $inc: { "purchaseItems.$.quantity": quantity }, // add to quantity
    //     //     $set: { "purchaseItems.$.purchaseDate": purchaseDate }, // update date
    //     //   }
    //     // );

    //     // if (updateResult.matchedCount === 0) {
    //     // Step 2: If no existing item, push new one

    //     const ifFindId = await PurchaseCollection.findOne({
    //       email,
    //       "purchaseItems.foodId": foodId,
    //     });
    //     console.log(ifFindId);

    //     if (!ifFindId) {
    //       const result = await PurchaseCollection.updateOne(
    //         { email },
    //         {
    //           $push: {
    //             purchaseItems: { foodId, quantity, purchaseDate },
    //           },
    //         },
    //         { upsert: true }
    //       );
    //       res.send(result);
    //     }
    //     // }
    //     // res.send({ success: true, message: "Purchase updated/added" });
    //   } catch (error) {
    //     console.error("Error in purchase:", error);
    //     res.status(500).send({ error: "Database error" });
    //   }
    // });
    app.post("/MyPurchasePage", async (req, res) => {
      const { email, foodId, purchaseDate, quantity = 1 } = req.body;
      const userPurchase = await PurchaseCollection.findOne({ email });

      if (!userPurchase) {
        // Create new user
        const newDoc = {
          email,
          purchaseItems: [{ foodId, purchaseDate, quantity }],
        };
        await PurchaseCollection.insertOne(newDoc);
        return res.send({
          success: true,
          message: "Item added to cart",
          data: newDoc,
        });
      }

      // Check duplicate
      if (userPurchase.purchaseItems.some((item) => item.foodId === foodId)) {
        return res.send({ success: false, message: "Item already in cart" });
      }

      // Push new item
      const result = await PurchaseCollection.updateOne(
        { email },
        { $push: { purchaseItems: { foodId, purchaseDate, quantity } } }
      );

      return res.send({ success: true, message: "Item added to cart", result });
    });

    // // get card data
    // app.get("/MyPurchasePage", async (req, res) => {
    //   const email = req.query.email;
    //   if (!email) return res.status(400).send({ error: "Email is required" });
    //   try {
    //     const userPurchases = await PurchaseCollection.findOne({ email });
    //     // res.send(userPurchases || { email, purchaseItems: [] });
    //     const id = [];
    //     console.log(userPurchases);
    //     userPurchases.purchaseItems.map((i) => id.push(i.foodId));
    //     console.log(id); // res
    //     //         [
    //     //   '689f26d1a322c4a5f436c2b3',
    //     //   '689f2760a322c4a5f436c2b9',
    //     //   '689f26d1a322c4a5f436c2b4',
    //     //   '689f2760a322c4a5f436c2b7',
    //     //   '689f2760a322c4a5f436c2b8',
    //     //   '689f2760a322c4a5f436c2ba',
    //     //   '689f2760a322c4a5f436c2bb',
    //     //   '689f2760a322c4a5f436c2bc'
    //     // ]
    //     // i need the full information for those ids
    //   const result = await FoodsCollection.find({new ObjectId=id});

    //   } catch (error) {
    //     console.error("Error fetching purchases:", error);
    //     res.status(500).send({ error: "Database error" });
    //   }
    // });
    // // get card data

    // get card data
    app.get("/MyPurchasePage", async (req, res) => {
      const email = req.query.email;
      if (!email) return res.status(400).send({ error: "Email is required" });

      const userPurchases = await PurchaseCollection.findOne({ email });

      // if user has no purchases, return empty array
      if (!userPurchases || !userPurchases.purchaseItems) {
        return res.send([]);
      }

      // extract food IDs and convert to ObjectId
      const foodIds = userPurchases.purchaseItems.map(
        (item) => new ObjectId(item.foodId)
      );

      // get full food info for those IDs
      const fullFoods = await FoodsCollection.find({
        _id: { $in: foodIds },
      }).toArray();

      // console.log(fullFoods); // this is empty
      // merge quantity & purchaseDate with the food info
      const purchasesWithDetails = fullFoods.map((food) => {
        const purchaseInfo = userPurchases.purchaseItems.find(
          (item) => item.foodId === food._id.toString()
        );
        return {
          ...food,
          quantity: purchaseInfo.quantity,
          purchaseDate: purchaseInfo.purchaseDate,
        };
      });
      res.send(purchasesWithDetails);
    });

    // Delete card data
    app.delete("/MyPurchasePage", async (req, res) => {
      const { email, foodId } = req.body;
      if (!email || !foodId) {
        return res.status(400).send({ error: "Email and foodId are required" });
      }
      try {
        await PurchaseCollection.updateOne(
          { email },
          { $pull: { purchaseItems: { foodId } } }
        );
        res.send({ success: true, message: "Item removed from purchases" });
      } catch (error) {
        console.error("Error deleting purchase:", error);
        res.status(500).send({ error: "Database error" });
      }
    });

    // Update quantity
    app.patch("/MyPurchasePage/updateQuantity", async (req, res) => {
      const { email, foodId, quantity } = req.body;

      if (!email || !foodId || !quantity) {
        return res.send({ error: "Missing required fields" });
      }

      // Update the quantity of the existing item
      const result = await PurchaseCollection.updateOne(
        { email, "purchaseItems.foodId": foodId },
        {
          $set: { "purchaseItems.$.quantity": quantity },
        }
      );

      if (result.matchedCount === 0) {
        return res.send({ error: "Item not found in purchases" });
      }

      res.send({ success: true, message: "Quantity updated", result });
    });

    // get total quantity
    app.get("/MyPurchasePage/totalQuantity", async (req, res) => {
      const { email } = req.query;
      // console.log(email);
      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }
      const userPurchase = await PurchaseCollection.findOne({ email });
      if (!userPurchase || !userPurchase.purchaseItems) {
        return res.send({ totalQuantity: 0 });
      }
      const totalQuantity = userPurchase.purchaseItems.reduce(
        (sum, item) => sum + item.quantity,
        0 //Technically, reduce can work without the 0, but it behaves differently—and in your case, it can cause problems. Let’s break it down.
      );
      res.send({ totalQuantity });
    });

    // Remove all items from a user's purchase
    app.get("/MyPurchasePage/clearCard", async (req, res) => {
      const { email } = req.query;

      if (!email) {
        return res.status(400).send({ error: "Email is required" });
      }

      try {
        // Update the user's purchase document to remove all items
        const result = await PurchaseCollection.updateOne(
          { email },
          { $set: { purchaseItems: [] } }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .send({ message: "No purchases found to clear" });
        }

        res.send({
          message: "All items removed successfully",
          totalQuantity: 0,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Failed to clear purchases" });
      }
    });

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
