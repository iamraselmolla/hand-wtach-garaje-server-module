const express = require('express')
const jwt = require('jsonwebtoken')
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

async function run() {
    try {
        const usersCollection = client.db("buywatch").collection("users");
        const watchesCollection = client.db("buywatch").collection("watches");
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
            const query = {sold:false};
            const result = await watchesCollection.find(query).limit(3).toArray();
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
        app.delete('/accounts/verify/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id : ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
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
