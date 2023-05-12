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
        var user = await prisma.admin.findUnique({
            where: {
                username,
            },
        });

        var user_role = 'admin';

        if (!user) {
            user = await prisma.appUser.findUnique({
                where: {
                    username
                }
            });
            user_role = 'user';
        }

        if (!user || user.password !== password) {
            // User not found or password incorrect
            res.status(401).render('login', { error: "Invalid username or password" });
        } else {
            // Admin User found and password correct
            req.session.authenticated = true;
            req.session.user = { username };
            req.session.user_role = user_role;
            if (user_role === 'admin')
                res.redirect('/admin');
            else
                res.redirect('/user');
        }

    } catch (err) {
        console.error(err);
        res.status(401).render('login', { error: "Error on Our side" });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/auth/login');
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

function requireAdminAuth(req, res, next) {
    if (req.session.authenticated && req.session.user_role === 'admin') {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

function requireUserAuth(req, res, next) {
    if (req.session.authenticated && req.session.user_role === 'user') {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

function requireAuth(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/auth/login');
    }
}

module.exports = { createAdmin, requireAuth, router, requireAdminAuth, requireUserAuth };