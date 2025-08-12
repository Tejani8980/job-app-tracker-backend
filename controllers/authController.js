const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
require('dotenv').config();

const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const registerSchema = loginSchema.keys({
    firstName: Joi.string().min(1).required(),
    lastName: Joi.string().min(1).required(),
    phoneNumber: Joi.string().pattern(/^\+?[0-9]{7,15}$/).required(),
});



const register = async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password, firstName, lastName, phoneNumber } = req.body;
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }
        const user = await userModel.createUser({ email, password, firstName, lastName, phoneNumber });
        res.status(201).json({ message: "User registered", email: user.email });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { email, password } = req.body;
        const user = await userModel.validateUser(email, password);
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login successful", token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = { register, login };
