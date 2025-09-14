import User from "../models/users.models.js";
import gamesSchema from "../models/game.models.js";

const gameController = {
    placeBet: async (req, res) => {
        try {
            console.log("=== DEBUG INFO ===");
            console.log("Request body:", req.body);
            console.log("Request user:", req.user);
            console.log("Request headers:", req.headers.authorization);

            const { betAmount } = req.body;
            const userId = req.user?.id || req.body.userId;

            console.log("Bet amount:", betAmount, typeof betAmount);
            console.log("User ID:", userId);

            // Validate authentication
            if (!userId) {
                return res.status(401).json({
                    message: "User not authenticated",
                    debug: {
                        hasUser: !!req.user,
                        hasAuth: !!req.headers.authorization
                    }
                });
            }

            // Validate bet amount
            if (!betAmount || isNaN(betAmount) || betAmount <= 0) {
                return res.status(400).json({ message: "Invalid bet amount. Must be a positive number." });
            }

            // Convert betAmount to number if it's a string
            const numericBetAmount = Number(betAmount);

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            console.log("User found:", user.email || user.username || "Unknown");
            console.log("User balance:", user.balance);

            // Check sufficient balance
            if (user.balance < numericBetAmount) {
                return res.status(400).json({
                    message: "Insufficient Balance",
                    currentBalance: user.balance,
                    requiredAmount: numericBetAmount
                });
            }

            // Roll dice
            const dice1 = Math.floor(Math.random() * 6) + 1;
            const dice2 = Math.floor(Math.random() * 6) + 1;
            const diceOutcome = [dice1, dice2];
            const sum = dice1 + dice2;

            console.log("Dice roll:", diceOutcome, "Sum:", sum);

            let result = "loss";
            let winnings = 0;
            let multiplier = 0;
            let netGain = 0;

            // Game logic: 7 or 11 wins (2x payout), everything else loses
            if (sum === 7 || sum === 11) {
                result = "win";
                multiplier = 2;
                winnings = numericBetAmount * multiplier; // Total return (20 for bet of 10)
                netGain = numericBetAmount; // Net profit (10 for bet of 10)
                user.balance += netGain; // Add only the net gain
            } else {
                result = "loss";
                netGain = -numericBetAmount; // Net loss
                user.balance -= numericBetAmount; // Subtract the bet amount
            }

            console.log("Game result:", result);
            console.log("Winnings (total return):", winnings);
            console.log("Net gain/loss:", netGain);
            console.log("New balance:", user.balance);

            // Create game record
            const gameRecord = new gamesSchema({
                userId,
                currentBet: numericBetAmount,
                diceOutcome,
                result,
                multiplier,
                winnings,
                netGain,
                timestamp: new Date()
            });

            await gameRecord.save();
            console.log("Game record saved with ID:", gameRecord._id);

            // Update user's game history (limit to last 50 games to prevent bloat)
            user.gameHistory = user.gameHistory || [];
            user.gameHistory.push({
                gameId: gameRecord._id,
                betAmount: numericBetAmount,
                diceRoll: diceOutcome,
                outcome: result,
                winnings,
                netGain,
                timestamp: new Date()
            });

            // Keep only last 50 games in user history
            if (user.gameHistory.length > 50) {
                user.gameHistory = user.gameHistory.slice(-50);
            }

            await user.save();
            console.log("User updated successfully");

            const response = {
                success: true,
                message: "Bet placed successfully",
                game: {
                    id: gameRecord._id,
                    diceRoll: diceOutcome,
                    sum: sum,
                    result,
                    betAmount: numericBetAmount,
                    multiplier,
                    winnings,
                    netGain
                },
                user: {
                    newBalance: user.balance,
                    previousBalance: user.balance - netGain
                }
            };

            console.log("Response:", response);
            res.status(200).json(response);

        } catch (err) {
            console.error("Error details:", err);

            // Handle specific database errors
            if (err.name === 'CastError') {
                return res.status(400).json({
                    message: "Invalid user ID format",
                    error: err.message
                });
            }

            if (err.name === 'ValidationError') {
                return res.status(400).json({
                    message: "Data validation error",
                    error: err.message
                });
            }

            res.status(500).json({
                message: "Internal server error",
                error: err.message,
                stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
            });
        }
    },

    // Get user's game history
    getGameHistory: async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: "User not authenticated" });
            }

            const { page = 1, limit = 10 } = req.query;
            const skip = (page - 1) * limit;

            const games = await gamesSchema
                .find({ userId })
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit));

            const totalGames = await gamesSchema.countDocuments({ userId });

            res.status(200).json({
                success: true,
                games,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalGames / limit),
                    totalGames,
                    hasNext: skip + games.length < totalGames
                }
            });

        } catch (err) {
            console.error("Error fetching game history:", err);
            res.status(500).json({
                message: "Error fetching game history",
                error: err.message
            });
        }
    },

    // Get user stats
    getUserStats: async (req, res) => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ message: "User not authenticated" });
            }

            const stats = await gamesSchema.aggregate([
                { $match: { userId: userId } },
                {
                    $group: {
                        _id: "$result",
                        count: { $sum: 1 },
                        totalBet: { $sum: "$currentBet" },
                        totalWinnings: { $sum: "$winnings" }
                    }
                }
            ]);

            const user = await User.findById(userId, 'balance');

            res.status(200).json({
                success: true,
                currentBalance: user?.balance || 0,
                stats
            });

        } catch (err) {
            console.error("Error fetching user stats:", err);
            res.status(500).json({
                message: "Error fetching user stats",
                error: err.message
            });
        }
    }
};

export default gameController;