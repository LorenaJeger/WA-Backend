import express from 'express';
import storage from './memory_storage'
import cors from 'cors'

const app = express()  // instanciranje aplikacije 
app.use(cors())

const port = 3000  // port na kojem će web server slušati


app.get('/posts', (req, res) => {
    let title= req.query.title
    let createdBy=req.query.createdBy
    let query = req.query

    let postovi= storage.posts
    if(title){

    postovi=postovi.filter(e =>{
        
        let titleOk = e.title.indexOf(title) >=0 
        return titleOk;
    })

    }  
    if (createdBy){
        postovi=postovi.filter(e => {
            let createdByOk= e.createdBy.indexOf(createdBy)>= 0
            return createdByOk;  
        })
        
    }

    if (query._any) {
        let pretraga= query._any
        let pojmovi = pretraga.split(" ")
        console.log(pojmovi)
       
        postovi=postovi.filter(postovi=>{
            let podaci= postovi.title + postovi.createdBy
            let rezlutat= pojmovi.every(pojam =>{                   //every vraca true ako svaka podfunkcija vraca true
                    return podaci.indexOf(pojam) >=0 
            })
            return rezlutat
        })
    }



res.json(postovi)
});

app.listen(port, () => console.log(`Slušam na portu ${port}!`))

    
