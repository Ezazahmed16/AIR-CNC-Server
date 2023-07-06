const express = require('express')
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const morgan = require('morgan');
const app = express()
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000

// middlewares
app.use(cors())
app.use(express.json())
app.use(morgan('dev'));

// Database Connection 
const uri = process.env.DB_URI

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
})

async function run() {
  try {
    const homesCollection = client.db('aircncdb').collection('homes')
    const usersCollection = client.db('aircncdb').collection('users')
    const bookingsCollection = client.db('aircncdb').collection('bookings')

    // save user email and generate jwt 
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const filter = { email: email }
      const options = { upsert: true }
      const updateDoc = {
        $set: user,
      }
      const result = await usersCollection.updateOne(filter, updateDoc, options)
      console.log(result)
      //jwt
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      })
      console.log(token)
      res.send({ result })
    })

    //get all users
    app.get('/users', async (req, res) => {
      const users = await usersCollection.find().toArray()
      res.send(users)
    })

    // get a single user by Email
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      res.send(user)
    })

    //Save Booking Data
    app.post('/bookings', async (req, res) => {
      const bookingData = req.body;
      const result = await bookingsCollection.insertOne(bookingData)
      res.send(result)
    })

    //Get Booking Data
    app.get('/bookings', async (req, res) => {
      let query = {};
      const email = req.query.email;
      if (email) {
        query = {
          guestEmail: email,
        }
      }
      const booking = await bookingsCollection.find(query).toArray()
      res.send(booking)
    })

    //Add a Home (HOST)
    app.post('/homes', async (req, res) => {
      const homeData = req.body;
      const result = await homesCollection.insertOne(homeData)
      res.send(result)
    })

    console.log('Database Connected...')
  } finally {
  }
}

run().catch(err => console.error(err))

app.get('/', (req, res) => {
  res.send('Server is running...')
})

app.listen(port, () => {
  console.log(`Server is running...on ${port}`)
})
