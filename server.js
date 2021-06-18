import express from 'express';
import cors from 'cors';
import pg from 'pg';
import joi from 'joi';
import dayjs from 'dayjs';

const app = express();
app.use(cors());
app.use(express.json());

const { Pool } = pg;
const databaseConnection = {
    user: 'bootcamp_role',
    password: 'senha_super_hiper_ultra_secreta_do_role_do_bootcamp',
    host: 'localhost',
    port: 5432,
    database: 'boardcamp'
  };
const connection = new Pool(databaseConnection);

//CRUD Categoirias -------------------------------------------------------------------------------------------------

app.get("/categories", async (req,res) => {
    try{
        const categories = await connection.query('SELECT * FROM categories');
        res.send(categories.rows);
    }catch{
        res.sendStatus(400);
    };
});


app.post("/categories", async (req,res) => {
    const { name } = req.body;
   
    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
    });
    const { error, value } = userSchema.validate({name: name});
    if(error){
        res.sendStatus(400);
        return;
    }

    try{
    const validation = await connection.query('SELECT * FROM categories WHERE name = $1',[name]);

    if(validation.rows.length!==0){
        res.sendStatus(409);
        return;
    }

    else{
        const NewCategorie = await connection.query('INSERT INTO categories (name) VALUES ($1)',[name]); 
        res.sendStatus(201);
    }

    }
    catch{
    res.sendStatus(400);
    }
});
//---------------------------------------------------------------------------------------------------------------


//CRUD Jogos ----------------------------------------------------------------------------------------------------

app.get("/games", async (req,res)=>{
    const {name}=req.query;
    console.log(name);
    let FilteredGames="";

    name?FilteredGames= name[0].toUpperCase()+name.substr(1):"";

    try{
        const querySettings = FilteredGames ? `${FilteredGames}%` : "%"; 
      
        const games = await connection.query(`
        SELECT games.*, categories.name AS "categoryName" 
        FROM games JOIN categories 
        ON games."categoryId" = categories.id
        WHERE games.name 
        LIKE $1`, [querySettings]);                
        //console.log(games.rows);
		if (games.rows.length===0)
        {
            res.sendStatus(204);
            return;
        }
        else
        res.send(games.rows);  
        
    }
    catch{
        res.sendStatus(400);
    };

});


app.post("/games", async (req,res)=>{
    const { name, image, stockTotal, categoryId, pricePerDay} = req.body;

    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
        stockTotal: joi.number().min(1).required(),
        pricePerDay:joi.number().min(1).required(),
        categoryId: joi.number().min(1).required(),

    });
    const { error, value } = userSchema.validate({
        name: name, 
        stockTotal: stockTotal, 
        pricePerDay: pricePerDay,
        categoryId: categoryId
    });

    if(error){
        res.sendStatus(400);
        return;
    }



    try{
        const Namevalidation = await connection.query('SELECT * FROM games WHERE name = $1',[name]);
        if(Namevalidation.rows.length!==0){
            res.sendStatus(409);
            return;
        }
        
        const CategoryValidation = await connection.query('SELECT * FROM categories WHERE id = $1',[categoryId]);
        if(CategoryValidation.rows.length===0){
            res.sendStatus(400);
            return;
        }
        const GameName=name[0].toUpperCase()+name.substr(1);
        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',[GameName, image, stockTotal, categoryId, pricePerDay]);
        res.sendStatus(201);

    }
    catch{
        res.sendStatus(400);
    }
    
});

//---------------------------------------------------------------------------------------------------------------


//CRUD Clientes -------------------------------------------------------------------------------------------------

app.get("/customers", async(req,res) =>{

    try{
        const customers = await connection.query('SELECT * FROM customers');
        customers.rows.map(e => {
            e.birthday = dayjs(e.birthday).format('YYYY-MM-DD');
        });
        res.send(customers.rows);
        }
    catch{
        res.sendStatus(400);
    }
});

app.get("/customers/:id", async (req,res)=>{

    const id = parseInt(req.params.id); 

    
    try{
    const customer= await connection.query('SELECT * FROM customers WHERE id = $1', [id]);
    if(customer.rows.length===0) res.sendStatus(404);

    customer.rows.map(e => {
        e.birthday = dayjs(e.birthday).format('YYYY-MM-DD');
    });
    res.send(customer.rows);
    }
    catch{
        res.sendStatus(400)
    }
})


app.post("/customers", async (req,res)=>{
const {name, phone, cpf, birthday } =req.body;
console.log(birthday);

const userSchema = joi.object({
    name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
    phone: joi.string().min(10).max(11).required().pattern(/[0-9]/),
    cpf:joi.string().length(11).required().pattern(/[0-9]/),
    birthday: joi.date().less('now'),  
});
const { error, value } = userSchema.validate({
    name: name, 
    phone: phone, 
    cpf: cpf,
    birthday: birthday
});

const birthdayValidation = dayjs(birthday, 'YYYY-MM-DD').isValid();

if(error){
    res.sendStatus(400);
    return;
}

try{
    
    const CpfValidation = await connection.query('SELECT * FROM customers WHERE cpf = $1',[cpf]);
    
    if(CpfValidation.rows.length!==0){
        res.sendStatus(409);
        return;
    }
    
    const CustomerName=name[0].toUpperCase()+ name.substr(1);
    console.log(birthday);
    await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)',[CustomerName, phone, cpf, birthday]);
    res.sendStatus(201);
}
catch{
res.sendStatus(400);
}
});


app.put("/customers/:id", async (req,res) =>{
    const {name, phone, cpf, birthday } =req.body;
    const id = parseInt(req.params.id); 

    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
        phone: joi.string().min(10).max(11).required().pattern(/[0-9]/),
        cpf:joi.string().length(11).required().pattern(/[0-9]/),
        birthday: joi.date().less('now'),  
    });
    const { error, value } = userSchema.validate({
        name: name, 
        phone: phone, 
        cpf: cpf,
        birthday: birthday
    });
    
    if(error){
        res.sendStatus(400);
        return;
    }

    try{
    const CpfValidation = await connection.query('SELECT * FROM customers WHERE cpf = $1 AND id <> $2',[cpf,id]);
    if(CpfValidation.rows.length!==0){
        res.sendStatus(409);
        return;
    }
    const CustomerName=name[0].toUpperCase()+name.substr(1);
    await connection.query('UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5',[CustomerName, phone, cpf, birthday, id]);
    res.sendStatus(200);
    }
    catch{
        res.sendStatus(400);
        return;
    }


});




//---------------------------------------------------------------------------------------------------------------

//CRUD Aluguéis -------------------------------------------------------------------------------------------------

app.get("/rentals", async (req,res) =>{

    try{
        const rentals= await connection.query(`
        SELECT rentals.* ,customers.name AS "customerName", 
        games.name AS "gameName", games."categoryId",
        categories.name AS "categoryName"
        FROM rentals 
        JOIN customers ON customers.id = rentals."customerId" 
        JOIN games ON rentals."gameId" = games.id 
        JOIN categories ON games."categoryId" = categories.id 
        
        `);

        const rentalsInfo = rentals.rows.map((i) => {
            return {
              id: i.id,
              customerId: i.customerId,
              gameId: i.gameId,
              rentDate: i.rentDate,
              daysRented: i.daysRented,
              returnDate: i.returnDate,
              originalPrice: i.originalPrice,
              delayFee: i.delayFee,
              customer: {
                id: i.customerId,
                name: i.customerName,
              },
              game: {
                id: i.gameId,
                name: i.gameName,
                categoryId: i.categoryId,
                categoryName: i.categoryName,
              },
            };
          });
        
        res.send(rentalsInfo);


     
    }
    catch (e) {
        console.log(e);
        res.sendStatus(400);
      }
});





app.post("/rentals", async (req,res) =>{
const{customerId, gameId, daysRented} = req.body;

const userSchema = joi.object({
    customerId: joi.number().required(),
    gameId: joi.number().required(),
    daysRented:joi.number().min(1).required()
});
const { error, value } = userSchema.validate({
    customerId: customerId, 
    gameId: gameId, 
    daysRented: daysRented
});

if(error){
    res.sendStatus(400);
    return;
}

try{
    const CustomerValidation = await connection.query('SELECT * FROM customers WHERE id = $1',[customerId]);
    if(CustomerValidation.rows.length===0){
        res.sendStatus(400);
        return;
    }

    const GameValidation = await connection.query('SELECT * FROM games WHERE id = $1',[gameId]);
    if(GameValidation.rows[0].id===0||GameValidation.rows[0].stockTotal < 1){
        res.sendStatus(400);
        return;
    }

    let originalPrice = daysRented* GameValidation.rows[0].pricePerDay;
    const rentDate = dayjs().format('YYYY-MM-DD');
    let returnDate= null;
    let delayFee = null;
    await connection.query('INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)',[customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee]);
    res.sendStatus(201);
}
catch(e){
    console.log(e);
    res.sendStatus(400);
}


});


//---------------------------------------------------------------------------------------------------------------


app.listen(4000, () =>{
    console.log("Rodando servidor");
});

