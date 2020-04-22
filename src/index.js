import express from 'express';
import storage from './memory_storage.js'
import cors from 'cors'
import connect from './db.js'
import mongo from 'mongodb'

const app = express()  // instanciranje aplikacije
const port = 3000  // port na kojem će web server slušati

app.use(cors())
app.use(express.json()) // automatski dekodiraj JSON poruke

let checkAttributes= (data)=>{
    if (!data.createdBy || !data.title || !data.source){
        return false
    }
    return true
};

let checkAttributes_mail=(data)=>{
    let mailTest = new RegExp('^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$', 'g');
    if(!mailTest.test(data.createdBy)) {
       
        return false
    }
   return true
};

    
   
app.patch('/posts/:id',async (req,res )=> {
    
    let id= req.params.id;
    let data= req.body;
    
   
    delete data._id;

   let db = await connect();

    let result= await db.collection("posts").updateOne(
        {_id:  mongo.ObjectId(id) }, 
        {
            $set: data  
        });

    if(result && result.modifiedCount == 1){
        let doc= await db.collection("posts").findOne(
            {_id:  mongo.ObjectId(id)});

            res.json(doc);
        } 
    else {
        res.json({
            status: "fail",
        });
    }
});

app.put('/posts/:id',async (req,res )=> {
    
    let id= req.params.id;
    let data= req.body;
    
    data.postedAt= new Date().getTime();
   
    delete data._id;

    
   let check= checkAttributes(data);

   if(!check){
       res.json({
           status: "fail",
           reason:"incomplete post",
       });
       return ;
   }

   let db = await connect();

    let result= await db.collection("posts").replaceOne(
        {_id:  mongo.ObjectId(id) }, data);

    if(result && result.modifiedCount == 1){
       let  returnData= result.ops[0]
       returnData._id=id;
       res.json(returnData)
    }
    else {
        res.json({
            status: "fail",
        });
    }
});


    
//insert
app.post('/posts', async (req, res) => {
    let data= req.body;
    //postavi vrijeme i datum posta
    data.postedAt= new Date().getTime();
    //zelimo validan id pa pustamo da ga mongo postavi
    delete data._id;

    
    let check= checkAttributes(data);
    if(!check){
        res.json({
            status: "fail",
            reason:"incomplete post",
        });
        return 
    }
    
    let check_mail= checkAttributes_mail(data);
    if(!check_mail){
        res.json({
            status: "Erorr ",
            reason:"Neispravan createdBy",
        });
        return 
    }
   


    
//stavimo konekciju prema bazi
    let db= await connect();

    let result= await db.collection("posts").insertOne(data);
    console.log(result);

    if(result && result.insertedCount == 1){
        res.json(result.ops[0]);
    }
    else {
        res.json({
            status: "fail",
        });
    }
});

//dohvacanje posta po id-u
app.get('/posts/:id',async (req,res )=> {
    let id= req.params.id;
    let db = await connect();
    
    let doc= await db.collection("posts").findOne({_id:  mongo.ObjectId(id)});
    console.log(doc);
    res.json(doc);
   
});

//dohvacanje random posta
app.get('/posts_rand', async (req,res )=> {
    let db = await connect();
    let document = await db.collection('posts').aggregate([{$sample: { size: 1 }}]);
    let result= await document.toArray();

    res.json(result[0]);
   
});

app.get('/posts', async (req, res) => {
  let db = await connect();
  let query = req.query;

  let selekcija = {};

  if (query._any) {
    // za upit: /posts?_all=pojam1 pojam2
    let pretraga = query._any;
    let terms = pretraga.split(' ');

    let atributi = ['title', 'createdBy'];

    selekcija = {
      $and: [],
    };

    terms.forEach((term) => {
      let or = {
        $or: [],
      };

      atributi.forEach((atribut) => {
        or.$or.push({ [atribut]: new RegExp(term) });
      });

      selekcija.$and.push(or);
    });
  }

  console.log('Selekcija', selekcija);

  let cursor = await db.collection('posts').find(selekcija);
  let results = await cursor.toArray();

  res.json(results);
});

app.get('/posts_memory', (req, res) => {

    let posts = storage.posts
    let query = req.query
    
    if (query.title) {
        posts = posts.filter(e => e.title.indexOf(query.title) >= 0)
    }
    
    if (query.createdBy) {
        posts = posts.filter(e => e.createdBy.indexOf(query.createdBy) >= 0)
    }
    
    if (query._any) {
        let terms = query._any.split(" ")
        posts = posts.filter(doc => {
            let info = doc.title + " " + doc.createdBy
            return terms.every(term => info.indexOf(term) >= 0)
        })
    }

    // sortiranje
    posts.sort((a, b) => (b.postedAt - a.postedAt))

    res.json(posts)
})

app.listen(port, () => console.log(`Slušam na portu ${port}!`))