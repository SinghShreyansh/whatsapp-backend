// import
import express from 'express';
import mongoose from 'mongoose';
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

//app config
const app = express();
const port = process.env.PORT || 9000 ;



const pusher = new Pusher({
    appId: "1336509",
    key: "cefcd0c9d7837fd9a268",
    secret: "fad92f118c48a1aae5f7",
    cluster: "ap2",
    useTLS: true
  });

  const db= mongoose.connection

  db.once('open',()=>{
      console.log("DB connected");

      const msgCollection = db.collection("messagecontents");
      const changeStream = msgCollection.watch();

      changeStream.on('change',(change)=> {
          console.log("A Change occured",change);

          if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('whatsapp-clone-mern','inserted',
            {
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received
            });
        } else {
            console.log('Error triggering Pusher');
        }
      });

  });

//middleware
app.use(express.json())
// cors library is used for sharing resources from one domain to another
app.use(cors())
// providibg frontend for vercel deploy

//DB config
const connection_url = 'mongodb+srv://Shreyansh:xFLxBp_pEj7W4p6@cluster0.c8rmm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'

mongoose.connect(connection_url,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("connection successfull ...."))
.catch((err) => console.log(err , `\n \n`))

//  ????



// api routes
app.get("/",(req,res)=>{
    res.status(200).send("I listened at localhot not")
})

app.get("/messages/sync", (req,res) =>{
    console.log(req.hostname)
    Messages.find((err,data) => {
        if(err){
            res.status(500).send(err)
            console.lof(err)

        } else {
            res.status(200).send(data)
        }
    })
})    

app.post("/messages/new", (req,res) => {
    const dbMessage = req.body ;
    console.log(dbMessage , req.url);

    Messages.create(dbMessage, (err, data) => {
        if(err){
            //internal server error 
            res.status(500).send(err)
        }else {
            
            res.status(200).send(`new message created: \n ${data}`)

        }
    })
})



//  listen
app.listen(port,() => console.log(`I am port is -${port}`))