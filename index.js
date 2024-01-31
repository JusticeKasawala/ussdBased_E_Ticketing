const express = require ('express');
//to access the routes
const apiRoutes = require('./routes');

const {sequelize ,connectToDb} = require('./db');


const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api', apiRoutes);

app.get('/',(request,response)=>{
    response.status(200).json({message:"hello world"})
})

app.listen(PORT ,async()=>{
    console.log(`server running on http://localhost:${PORT}`);
    await connectToDb();
})