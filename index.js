require('dotenv').config()

const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;

const { createServer } = require("http");
const { Server } = require("socket.io");
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rdxg6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
      // await client.connect();
      const database = client.db("taskMateDB");
      const taskCollection = database.collection("tasks");
      const userCollection = database.collection("users");

    app.get('/tasks', async(req, res) => {                     
        const cursor =  taskCollection.find();       
        const result = await cursor.toArray();
        res.send(result);
    });

    app.post('/tasks', async(req, res) => {                     
        const data = req.body;  
        const result = await taskCollection.insertOne(data);
        res.send(result);
    });


     /* get the task current data */          
    app.get('/tasks/:id', async( req, res)=>{
            // task Id
            const id =  req.params.id;
            const query = {_id: new ObjectId(id) }                 

            const result = await taskCollection.findOne(query);
            res.send(result);
    });

    // update task
      app.put('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;

            const filter = { _id: new ObjectId(id) }
            const updateTask = {
                $set: {
                  title: data.title,
                  status: data.status,
                  timestamp: data.timestamp
                }
            }
            const result = await taskCollection.updateOne(filter, updateTask);
            res.send(result);
      });
    
    // delete task
      app.delete('/tasks/:id', async( req, res)=>{

            const taskId =  req.params.id;

            const query = {_id: new ObjectId(taskId) }                           

            const result = await taskCollection.deleteOne(query);          
            res.send(result);
    });

     //  Save User info
    app.post('/users', async (req, res) => {
          const user = req.body;
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }

            const result = await userCollection.insertOne(user);
            res.send(result);
    });
      
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {                     
        res.send('Task Mate Server!')
});

                        
io.on("connection", async(socket) => {

    const database = client.db("taskMateDB");
    const taskCollection = database.collection("tasks");
    const cursor =  taskCollection.find();       
    const data = await cursor.toArray();
    
    console.log(data);
  
    console.log("User connected:", socket.id);


    socket.on("disconnect", () => {
         console.log("User disconnected:", socket.id);
    })

   
  // ...
});

app.listen(port, () => {
                            console.log(`Server Running on port ${port}`)
});
                        