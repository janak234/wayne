const { PrismaClient } = require('@prisma/client')
const express = require('express');

const router = express.Router();
const prisma = new PrismaClient();

// Login page
router.get('/login', (req, res) => {
    res.render('login');
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Authenticate user
        const user = await prisma.admin.findUnique({
            where: {
                username,
            },
        });

        if (!user || user.password !== password) {
            res.status(401).render('login', { error: "Invalid username or password" });
        }else{
            req.session.authenticated = true;
            req.session.user = { username };
            res.redirect('/');
        }
    } catch (err) {
        console.error(err);
        res.status(401).render('login', { error: "Error on Our side" });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

async function createAdmin() {
    const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env
    if (ADMIN_USERNAME && ADMIN_PASSWORD) {
        try {
            await prisma.admin.deleteMany();
            await prisma.admin.create({
                data: {
                    username: ADMIN_USERNAME,
                    password: ADMIN_PASSWORD
                }
            })
            console.log('Admin user created successfully')
        } catch (err) {
            console.error('Failed to create admin user:', err)
        }
    } else {
        console.warn('Admin username and password not provided')
    }
}

function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

module.exports = { createAdmin, requireAuth, router };