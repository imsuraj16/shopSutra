const express = require('express');
const authRoutes = require('./routes/auth.routes');
const cookieParser = require('cookie-parser');
const addressRoutes = require('./routes/address.routes');

const app = express();

app.use(express.json());
app.use(cookieParser());


//auth routes
app.use('/api/auth', authRoutes);

// address routes
app.use('/api/auth/users/me/address', addressRoutes);

module.exports = app;