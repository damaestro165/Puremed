import express from "express";
import authRoutes from './routes/auth.routes.js';
import passport from 'passport';
import session from 'express-session';
import mongoose from 'mongoose';
import "dotenv/config";
import MongoStore from "connect-mongo";
import  "./strategies/local-strategy.js";
import "./strategies/google-strategy.js";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { categoryRouter, medicationRouter } from "./routes/product.routes.js";
import  cartRouter  from "./routes/cart.routes.js";


const app = express();


mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
.then(() => {
    console.log("Connected to MongoDB Atlas");
})
.catch((error) => {
    console.error("Could not connect to MongoDB:", error);
    process.exit(1);
});

app.use(cookieParser());

app.use(session({
    secret: 'your_secret_key567',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 * 60 * 4 },
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_CONNECTION_STRING,
        client: mongoose.connection.getClient(),
        collectionName: 'sessions', // Optional: specify collection name
        ttl: 60 * 60 * 4 // 4 hours (matches cookie maxAge)
    })
}));
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRouter); 
app.use('/api/medications', medicationRouter); // Serve static files from 'public/products'
app.use('/api/cart', cartRouter);


const PORT = process.env.PORT|| 8080;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});