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
        res.sendStatus(500);
    };
});

app.post("/categories", async (req,res) => {

    const { name } = req.body;
   
    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/)
    });
    const { error, value } = userSchema.validate({name: name});
    if(error){
        res.sendStatus(400);
        return;
    }

    try{
    const CategoryName=name[0].toUpperCase()+name.substr(1);
    const validation = await connection.query('SELECT * FROM categories WHERE name = $1',[CategoryName]);
    if(validation.rows.length!==0){
        return res.sendStatus(409);
    }
    else{
        await connection.query('INSERT INTO categories (name) VALUES ($1)',[CategoryName]); 
        res.sendStatus(201);
    }
    }
    catch{
    res.sendStatus(500);
    }
});
//---------------------------------------------------------------------------------------------------------------


//CRUD Jogos ----------------------------------------------------------------------------------------------------

app.get("/games", async (req,res)=>{
    const {name}=req.query;
    let FilteredGames="";
    
    if(name){
        const userSchema = joi.object({
            name: joi.string().min(1).required()
        });
    
        const { error, value } = userSchema.validate({
            name: name
        });
    
        if(error){
            return res.sendStatus(400);
        }
    }

    name?FilteredGames= name[0].toUpperCase()+name.substr(1):"";

    try{
        const querySettings = FilteredGames ? `${FilteredGames}%` : "%"; 
      
        const games = await connection.query(`
        SELECT games.*, categories.name AS "categoryName" 
        FROM games JOIN categories 
        ON games."categoryId" = categories.id
        WHERE games.name 
        LIKE $1`, [querySettings]);                

		if (games.rows.length===0) return res.sendStatus(404);
        else return res.send(games.rows);  
        
    }
    catch{
        res.sendStatus(500);
    };
});


app.post("/games", async (req,res)=>{
    const { name, image, stockTotal, categoryId, pricePerDay} = req.body;

    const userSchema = joi.object({
        name: joi.string().min(1).required(),
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
        return res.sendStatus(400);
    }

    try{
        const GameName=name[0].toUpperCase()+name.substr(1);        
        const Namevalidation = await connection.query('SELECT * FROM games WHERE name = $1',[GameName]);
        if(Namevalidation.rows.length!==0) return res.sendStatus(409);
            
        const CategoryValidation = await connection.query('SELECT * FROM categories WHERE id = $1',[categoryId]);
        if(CategoryValidation.rows.length===0) return res.sendStatus(400);
        
        await connection.query('INSERT INTO games (name, image, "stockTotal", "categoryId", "pricePerDay") VALUES ($1, $2, $3, $4, $5)',[GameName, image, stockTotal, categoryId, pricePerDay]);
        return res.sendStatus(201);

    }
    catch{
        return res.sendStatus(500);
    }
});

//---------------------------------------------------------------------------------------------------------------


//CRUD Clientes -------------------------------------------------------------------------------------------------

app.get("/customers", async(req,res) =>{
    const {cpf}=req.query;
    let FilteredCustomers="";

    if(cpf){
        const userSchema = joi.object({
            cpf:joi.string().min(1).alphanum().required()
        });
    
        const { error, value } = userSchema.validate({
            cpf: cpf
        });
    
        if(error){
            return res.sendStatus(400);
        }
    }
    
   

    try{
        let customers=[];
        console.log(cpf);
        cpf ? FilteredCustomers=`${FilteredCustomers}%` :FilteredCustomers = "%"; 

        if(cpf){
        customers = await connection.query('SELECT * FROM customers WHERE cpf LIKE $1', [cpf+"%"]);
            
        }
        else{
        customers = await connection.query('SELECT * FROM customers');
        }
        
        if (customers.rows.length===0) return res.sendStatus(404);

        customers.rows.map(e => {
            e.birthday = dayjs(e.birthday).format('YYYY-MM-DD');
        });
        return res.send(customers.rows);
    }
    catch{
        return res.sendStatus(500);
    }
});

app.get("/customers/:id", async (req,res)=>{

    const id = req.params.id; 
    const userSchema = joi.object({
        id:joi.string().min(1).alphanum().required()
    });

    const { error, value } = userSchema.validate({
        id: id
    });

    if(error){
        return res.sendStatus(400);
    }
    
    try{
        
    const customer= await connection.query('SELECT * FROM customers WHERE id = $1', [id]);
    if(customer.rows.length===0) res.sendStatus(404);

    customer.rows.map(e => {
        e.birthday = dayjs(e.birthday).format('YYYY-MM-DD');
    });
    return res.send(customer.rows);
    }
    catch{
        return res.sendStatus(500)
    }
});


app.post("/customers", async (req,res)=>{
const {name, phone, cpf, birthday } =req.body;


const userSchema = joi.object({
    name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
    phone: joi.string().min(10).max(11).required().alphanum(),
    cpf:joi.string().length(11).required().alphanum(),
    birthday: joi.date().less('now'),  
});
const { error, value } = userSchema.validate({
    name: name, 
    phone: phone, 
    cpf: cpf,
    birthday: birthday
});

if(error){
  return res.sendStatus(400);
}

try{
    const CpfValidation = await connection.query('SELECT * FROM customers WHERE cpf = $1',[cpf]);
    
    if(CpfValidation.rows.length!==0) return res.sendStatus(409);
    
    const CustomerName=name[0].toUpperCase()+ name.substr(1);

    await connection.query('INSERT INTO customers (name, phone, cpf, birthday) VALUES ($1, $2, $3, $4)',[CustomerName, phone, cpf, birthday]);
   return res.sendStatus(201);
}
catch{
return res.sendStatus(500);
}
});


app.put("/customers/:id", async (req,res) =>{
    const {name, phone, cpf, birthday } =req.body;
    const id = req.params.id; 

    const userSchema = joi.object({
        name: joi.string().min(1).required().pattern(/[a-zA-Z]/),
        phone: joi.string().min(10).max(11).required().alphanum(),
        cpf:joi.string().length(11).required().alphanum(),
        birthday: joi.date().less('now'),  
    });
    const { error, value } = userSchema.validate({
        name: name, 
        phone: phone, 
        cpf: cpf,
        birthday: birthday
    });
    
    if(error){
      return res.sendStatus(400);
    }

    try{
    const CpfValidation = await connection.query('SELECT * FROM customers WHERE cpf = $1 AND id <> $2',[cpf,id]);
    if(CpfValidation.rows.length!==0){
        return res.sendStatus(409);
        
    }
    const CustomerName=name[0].toUpperCase()+name.substr(1);
    await connection.query('UPDATE customers SET name=$1, phone=$2, cpf=$3, birthday=$4 WHERE id=$5',[CustomerName, phone, cpf, birthday, id]);
    return res.sendStatus(200);
    }
    catch{
        return res.sendStatus(500);
    }


});




//---------------------------------------------------------------------------------------------------------------

//CRUD Aluguéis -------------------------------------------------------------------------------------------------

app.get("/rentals", async (req,res) =>{

    const { customerId, gameId } = req.query;
    let queryString = "";
    let queryArguments = [];
    let id = "";

        if(customerId&&gameId){
            console.log(customerId +" " + gameId);
            const userSchema = joi.object({
                customerId: joi.number(),
                gameId: joi.number()
            });
            const { error, value } = userSchema.validate({
             customerId:customerId,
             gameId:gameId
            });
            if(error){
                console.log(error);
                res.sendStatus(400);   
                return;    
        }
            queryString = `WHERE rentals."gameId" = $1 AND rentals."customerId" = $2`;
            queryArguments = [gameId, customerId];    
        }
        
        
        else if(customerId&&!gameId){
            id=customerId;
            console.log(id);
            const userSchema = joi.object({
                id: joi.number()
              
            });
            const { error, value } = userSchema.validate({         
                id:id
            });
            
            if(error){
                console.log(error);
                res.sendStatus(400);   
                return;    
        }
            queryString = `WHERE rentals."customerId" = $1`;
            queryArguments = [customerId];
        }

        else if(gameId&&!customerId){
            id=gameId; 
            console.log(id);  
            const userSchema = joi.object({
                id: joi.number()
              
            });
            const { error, value } = userSchema.validate({         
                id:id
            });
            
            if(error){
                console.log(error);
                res.sendStatus(400);   
                return;    
        }
            queryString = `WHERE rentals."gameId" = $1`;
            queryArguments = [gameId];            
        }

    try{
        const rentals= await connection.query(`
        SELECT rentals.* ,customers.name AS "customerName", 
        games.name AS "gameName", games."categoryId",
        categories.name AS "categoryName"
        FROM rentals 
        JOIN customers ON customers.id = rentals."customerId" 
        JOIN games ON rentals."gameId" = games.id 
        JOIN categories ON games."categoryId" = categories.id 
        ${queryString} 
        `,queryArguments);

        const rentalsInfo = rentals.rows.map((i) => {

            if(i.returnDate!==null) i.returnDate = dayjs(i.returnDate).format('YYYY-MM-DD');

            return {
              id: i.id,
              customerId: i.customerId,
              gameId: i.gameId,
              rentDate: dayjs(i.rentDate).format('YYYY-MM-DD'),
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
    catch {
        res.sendStatus(500);
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
    return res.sendStatus(400);
}

try{
    const CustomerValidation = await connection.query('SELECT * FROM customers WHERE id = $1',[customerId]);
    if(CustomerValidation.rows.length===0){
       return res.sendStatus(400);
    }

    const GameValidation = await connection.query('SELECT * FROM games WHERE id = $1',[gameId]);
    if(GameValidation.rows[0].id===0||GameValidation.rows[0].stockTotal < 1){
      return  res.sendStatus(400);
    }

    await connection.query(
        `UPDATE games SET "stockTotal" = "stockTotal" -1 WHERE id = $1`,
        [gameId]
      );

    let originalPrice = daysRented* GameValidation.rows[0].pricePerDay;
    const rentDate = dayjs().format('YYYY-MM-DD');
    let returnDate= null;
    let delayFee = null;
    await connection.query('INSERT INTO rentals ("customerId", "gameId", "rentDate", "daysRented", "returnDate", "originalPrice", "delayFee") VALUES ($1, $2, $3, $4, $5, $6, $7)',[customerId, gameId, rentDate, daysRented, returnDate, originalPrice, delayFee]);
    return res.sendStatus(201);
}
catch{
    return res.sendStatus(500);
}
});



app.post("/rentals/:id/return", async(req,res)=>{
const {id}=req.params;    

const userSchema = joi.object({
    id: joi.string().required()
});
const { error, value } = userSchema.validate({
   id:id
});

if(error){
  return res.sendStatus(400);
}

try{

    const rentalValidation= await connection.query('SELECT * FROM rentals WHERE id = $1',[id]);
    if(rentalValidation.rows.length===0) return res.sendStatus(404);
    
    if (rentalValidation.rows[0].returnDate !== null) return res.sendStatus(400);
    
    const returnDate=dayjs();
    const rentDate=rentalValidation.rows[0].rentDate;
    const daysRented=rentalValidation.rows[0].daysRented;

    const gamePrice= await connection.query('SELECT "pricePerDay" FROM games WHERE id = $1',[rentalValidation.rows[0].gameId])
    const delay =returnDate.diff(rentDate,'day');

    let delayFee=null;
    if(delay>daysRented) delayFee = (delay -daysRented) * gamePrice.rows[0].pricePerDay;
    console.log(delayFee);


    await connection.query(
        `UPDATE rentals SET "returnDate" = $1, "delayFee" = $2 WHERE id = $3`,
        [returnDate, delayFee, id]
      );
  
      await connection.query(
        `UPDATE games SET "stockTotal" = "stockTotal" + 1 WHERE id = $1`,
        [rentalValidation.rows[0].gameId]
      );
  
      res.sendStatus(200);
}

catch{
res.sendStatus(500);
}
});



app.delete("/rentals/:id", async (req,res) =>{
    const {id}=req.params;    

    const userSchema = joi.object({
        id: joi.string().required().alphanum()
    });
    const { error, value } = userSchema.validate({
       id:id
    });
    
    if(error){
        res.sendStatus(400);
        return;
    }

    try{
        const rentalValidation= await connection.query('SELECT * FROM rentals WHERE id = $1',[id]);
        if(rentalValidation.rows.length===0) return res.sendStatus(404);
        if (rentalValidation.rows[0].returnDate !== null) return res.sendStatus(400);

        await connection.query("DELETE FROM rentals WHERE id=$1", [id]);
        return res.sendStatus(200);
    }
    catch(e){       
        return res.sendStatus(500);
    }
});


//---------------------------------------------------------------------------------------------------------------


app.listen(4000, () =>{
    console.log("Rodando servidor");
});

