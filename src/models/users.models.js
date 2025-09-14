import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true
        },
        password:{
            type:String,
            required:true,
        },
         balance:{
            type:Number,
            required:true,
            default:5000,
            min:0
        },
        gameHistory:[
            {
                betAmount : {type:Number,required:true},
                diceRoll : {type:[Number],required:true},
                outcome: {type:String,enum :["win","loss"],require:true},
                winning : {type:Number,default:0},
                timestamps : {type:Date,default:Date.now}
            }
        ],
       
    },
    { timestamps: true }
);
const User = mongoose.model('User',userSchema);
export default User;