const express = require('express')
const jwt = require('jsonwebtoken')
const stripe = require("stripe")(process.env.stripeKey);

require('dotenv').config();
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000;

// Database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.q37bxqk.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
console.log(process.env.stripeKey)
async function run() {
    try {
        const usersCollection = client.db("buywatch").collection("users");
        const watchesCollection = client.db("buywatch").collection("watches");
        const categoriesCollection = client.db("buywatch").collection("categories");
        const bookedCollection = client.db("buywatch").collection("booked");
        // Payment method
        app.post('/create-payment-intent', async (req, res) => {
            const booking = req.body;
            const amount = booking.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                "payment_method_types" : [
                    "card"
                ]
              });
            
              res.send({
                clientSecret: paymentIntent.client_secret,
              });
        })
        // Saving user registration data
        app.post('/users', async(req,res) => {
            const user = req.body;
            const email = req.body.email;
            const emailQuery = await usersCollection.findOne({email: email})
            if(emailQuery){
                return
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
        })
        // Find all buyer/seller accounts
        app.get('/accounts', async(req, res) => {
            const accountType = req.query.account
            let query;
            if(req.query.account === 'all'){
                query = {}
            }else{

                query = {accountType: accountType}
            }
            const selectedAccount = await usersCollection.find(query).toArray()
            res.send(selectedAccount)
        });
        // Saving Watch adding from data to database
        app.post('/watches', async (req, res) => {
            const  allData = req.body;
            const result  =  await watchesCollection.insertOne(allData);
            res.send(result)
        })
        // FInd account type quering by email
        app.get('/users', async(req, res) => {
            const email = req.query.email;
            const query={email: email};
            const findUser = await usersCollection.findOne(query);
            res.send(findUser)
        });
        // Find all item
        app.get('/all-items', async(req, res) => {
            let dataLimit;
            if(dataLimit){
                dataLimit = parseInt(req.query.limit)
            }else{
                dataLimit = 0;
            }
            
            const query = {sold:false};
            const result = await watchesCollection.find(query).limit(dataLimit).toArray();
            res.send(result)
        })
        // Find all reported items
        app.get('/reported/all-items', async(req, res) => {
          
            const query = {reported:true};
            const result = await watchesCollection.find(query).toArray();
            res.send(result)
        })
        // Find Categories
        app.get('/categories', async (req, res) => {
            const query = {};
            const result = await categoriesCollection.find(query).toArray()
            res.send(result)

        })
        // verify user
        app.put('/accounts/verify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    verified: true
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        // Mark item as sold
        app.put('/items/sold-out/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    sold: true
                }
            }
            const result = await watchesCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        // Advertise item
        app.put('/items/advertised/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    advertise: true
                }
            }
            const result = await watchesCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        // Reported items
        app.put('/items/reported/:id', async (req, res) => {
            const id = req.params.id;
            const reportedTime= req.body.reportedTime;
            const filter = {_id : ObjectId(id)};
            const options = { upsert: true };
            console.log(req.body)
            const updatedDoc = {
                $set: {
                    reported: true,
                    reportedTime: reportedTime

                }
            }
            const result = await watchesCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        // Reported items solvation
        app.put('/items/reported-solved/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    reported: false
                }
            }
            const result = await watchesCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })
        // Delete User
        app.delete('/accounts/verify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        // Find user basis added item
        app.get('/added-items', async(req, res) => {
            
            let query;
            if(req.query.email === 'admin'){
                query  = {}   
            }else{
                query  = {userEmail: req.query.email} 
            }
            const result = await watchesCollection.find(query).toArray();
            res.send(result)
        })
        // Find product by product category id
        app.get('/categories/:id', async (req, res) => {
            const query = {category_id : req.params.id}
            const result = await watchesCollection.find(query).toArray();
            res.send(result)
        })
        // Delete Item
        app.delete('/delete-items/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id : ObjectId(id)};
            const result = await watchesCollection.deleteOne(query);
            res.send(result)
        })
        // Find advertise products
        app.get('/advertised-items', async(req, res) => {
            const query ={advertise: true};
            let dataLimit;
            if(req.query.limit){
                dataLimit = parseInt(req.query.limit)
            }else{
                dataLimit = 0;
            }
            const result = await watchesCollection.find(query).limit(dataLimit).toArray();
            res.send(result)
        })
        // Booked item
        app.post('/booked', async (req, res) => {
            const data = req.body;
            const result =  await bookedCollection.insertOne(data);
            res.send(result)
        })
        // find booked item
        app.get('/booked', async (req, res) => {
            const email = req.query.email;
            const query = {email: email, paid:false}
            const result =  await bookedCollection.find(query).toArray();
            res.send(result)
        })
        // Find single items
        app.get('/pay/:id', async(req, res) => {
            const id = req.params.id;
            const query =  {_id : ObjectId(id)};
            const result = await watchesCollection.findOne(query);;
            res.send(result);
        })
        // added payment method data to db
        app.put('/payment-done/:id', async (req, res) => {
            const id = req.params.id
            const query = {product_id : id}
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    paid: true,
                    payment_id: req.body.payment_id,
                    payment_type: req.body.payment_type,
                    paymentTime: req.body.paymentTime


                }
            }
            const result = await bookedCollection.updateOne(query, updatedDoc, options);
            res.send(result)
        })
        // Find my shopping
        app.get('/my-shopping', async(req, res)=> {
            const email = req.query.email;
            const query = {email: email, paid:true};
            const result = await bookedCollection.find(query).toArray()
            res.send(result)
        })

        // payment verification
        app.get('/payment-verification', async (req, res) => {
            const query = {payment_id: req.query.paymentID}
            const result = await bookedCollection.findOne(query);
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(e => console.log(e.message))








app.get('/', (req, res) => {
    console.log(process.env.imageBBAPI)
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
