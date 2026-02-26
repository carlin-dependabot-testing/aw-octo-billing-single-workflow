const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const handlebars = require('handlebars');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mock database
const users = [];
const bills = [];
const payments = [];

// Routes
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Octo Billing System',
        currentTime: moment().format('YYYY-MM-DD HH:mm:ss'),
        userCount: users.length,
        billCount: bills.length
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: moment().toISOString(),
        version: require('./package.json').version,
        dependencies: Object.keys(require('./package.json').dependencies)
    });
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Using crypto-js for password hashing (vulnerable - no salt, weak algorithm)
        const hashedPassword = CryptoJS.MD5(password).toString();
        const user = {
            id: users.length + 1,
            username,
            email,
            password: hashedPassword,
            createdAt: moment().toISOString()
        };

        users.push(user);
        res.status(201).json(_.omit(user, 'password'));
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users', (req, res) => {
    const safeUsers = users.map(user => _.omit(user, 'password'));
    res.json(safeUsers);
});

app.post('/api/bills', (req, res) => {
    const { userId, amount, description } = req.body;
    
    if (!userId || !amount || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const bill = {
        id: bills.length + 1,
        userId: parseInt(userId),
        amount: parseFloat(amount),
        description,
        status: 'pending',
        createdAt: moment().toISOString(),
        dueDate: moment().add(30, 'days').toISOString()
    };

    bills.push(bill);
    res.status(201).json(bill);
});

app.get('/api/bills', (req, res) => {
    res.json(bills);
});

app.post('/api/payments', (req, res) => {
    const { billId, amount, paymentMethod } = req.body;
    
    if (!billId || !amount || !paymentMethod) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const bill = bills.find(b => b.id === parseInt(billId));
    if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
    }

    const payment = {
        id: payments.length + 1,
        billId: parseInt(billId),
        amount: parseFloat(amount),
        paymentMethod,
        status: 'completed',
        processedAt: moment().toISOString()
    };

    payments.push(payment);
    
    // Update bill status
    if (payment.amount >= bill.amount) {
        bill.status = 'paid';
        bill.paidAt = moment().toISOString();
    }

    res.status(201).json(payment);
});

app.get('/api/payments', (req, res) => {
    res.json(payments);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Octo Billing Server running on port ${PORT}`);
    console.log(`📅 Started at: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
