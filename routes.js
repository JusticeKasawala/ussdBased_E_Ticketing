const express = require('express');

const router = express.Router()

const User = require ('./models');

//1. get all users
router.get('/users', async(request, response)=>{
   const users = await User.findAll() ;

   response.status(200).json(users)
});

//2. add a new user
router.post('/users',async (request, response)=>{
    const {name ,p_number, market} = request.body;

    const newUser =User.build({
        'name':name,
        'p_number':p_number,
        'market':market
    })
    try{
        await newUser.save();

        response.status(201).json(newUser)

    }
    catch{
        response.json(error)
        
    }
});

//3. return a specific user

router.get('/user/:id', async(request, response)=>{
   const user = await User.findOne({
    where:{
        id:request.params.id
    }
   });
   response.status(200).json(user)

}); 

//4. return all users based on a market

router.get('/users/:market', async (request, response)=>{
    const users = await User.findAll({
        where:{
            market:request.params.market
        }
       });
       response.status(200).json(users)
     
}); 
//4. return all users paid

// router.get('/users/:has_paid', async (request, response)=>{
//     const users = await User.findAll({
//         where:{
//             has_paid:request.params.true
//         }
//        });
//        response.status(200).json(users)
     
// }); 

//5. edit a user patch has paid 
router.patch('/user/:id',async  (request, response)=>{
    const user = await User.findOne({
        where:{
            id:request.params.id
        }
       });
       const {has_paid} = request.body;

       await user.set(
        {
            has_paid : has_paid
        }
       )
       await user.save();
    
       response.status(200).json(user);

});

//6. edit a user  
router.put('/user/:id',async  (request, response)=>{
    const user = await User.findOne({
        where:{
            id:request.params.id
        }
       });
       const {name, p_number,market, has_paid} = request.body;

       await user.set(
        {
            name:name,
            p_number:p_number,
            market:market,
            has_paid : has_paid
        }
       )
       await user.save();
    
       response.status(200).json(user);
});

//7. delete a user
router.delete('/user/:id',async (request, response)=>{

    const user = await User.findOne({
        where:{
            id:request.params.id
        }
       });
       await user.destroy();
       response.status(204).json;

});

//make the router accessible to the other mudules i.e index.js
module.exports = router;
