const express = require('express')
const jwt = require('jsonwebtoken')
require('dotenv').config();
const app = express()
const cors = require('cors');
app.use(cors())
app.use(express.json())
const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
    console.log(process.env.imageBBAPI)
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})