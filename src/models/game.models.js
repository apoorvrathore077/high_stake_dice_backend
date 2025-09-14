import mongoose from "mongoose";

const gameSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        currentBet: {
            type: Number,
            required: true,
            min: 1
        },
        diceOutCome: {
            type: [Number]
        },
        result: {
            type: String,
            enum: ["win", "loss", "pending"],
            default: "pending"
        },
        multiplier: {
            type: Number,
            default: 1
        }
    },

    { timestamps: true }
);
const gamesSchema = mongoose.model('Games', gameSchema);
export default gamesSchema;