import express from 'express';
import storage from './memory_storage'
import cors from 'cors'

const app = express() // instanciranje aplikacije
const port = 3000 // port na kojem će web server slušati

app.use(cors()) // omogući CORS na svim rutama
app.use(express.json()) //automatski dekodiraj JSON poruke

app.post('/posts', (req, res) => {
    let data = req.body

    // ovo inače radi baza (autoincrement ili sl.), ali čisto za primjer
    data.id = 1 + storage.posts.reduce((max, el) => Math.max(el.id, max), 0)

    // dodaj u našu bazu (lista u memoriji)
    storage.posts.push(data)

    // vrati ono što je spremljeno
    res.json(data) // vrati podatke za referencu
})

app.get('/posts', (req, res) => {
    let query = req.query

    let posts = storage.posts
    
    if(query.title) {
        posts = posts.filter(e => e.title.indexOf(query.title) >= 0)
    }
    if (query.createdBy) {
        posts = posts.filter(e => e.createdBy.indexOf(query.createdBy) >= 0)
    }
    if(query._any) {         //_any oznavacava sistemski atribut kojim se može pretraživati po bilo čemu
        let pretraga = query._any
        let pojmovi = pretraga.split(" ")   //koristeći split se elementi ispisuju zasebno kao dio polja
        
        posts = posts.filter(post => {             //filter metoda,vraća TRUE ili FALSE ako post zadovoljava ili ne kriterij pretrage
            let podaci = post.title + post.createdBy   //podaci po kojima pretražujemo postove
            let rezultat = pojmovi.every(pojam => {    //prolazimo pojam po pojam da vidimo je li sadržan u pretrazi
                return podaci.indexOf(pojam) >= 0     //vraća true ako je svaka podfunkcija vratila TRUE(zadovoljila uvjet)
            })
            return rezultat                  //izdvaja postove koji imaju svaki pojam sadržan u stringu koji sadrži sve pojmove
        })
    }

    //sortiranje
    posts.sort((a, b) => (b.postedAt - a.postedAt))
    
    res.json(posts)
});

app.listen(port, () => console.log(`Slušam na portu ${port}!`))