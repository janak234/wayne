const { PrismaClient } = require('@prisma/client')
const express = require('express');

const router = express.Router();
const prisma = new PrismaClient();

// fetch users
router.get('/users', async (req, res) => {
    // get all users from database
    const users = await prisma.appUser.findMany();
    res.render('admin/users', { users });
});

// insert new user
router.post('/users', async (req, res) => {
    const { username, password } = req.body;
    try {
        await prisma.appUser.create({
            data: {
                username,
                password,
            },
        });
        // get all users from database
        const users = await prisma.appUser.findMany();
        
        res.render('admin/users',{ users });
    } catch (err) {
        // get all users from database
        const users = await prisma.appUser.findMany();
        const error = "Username already exists"
        res.render('admin/users',{ users, error });
    }
});

// delete user
router.post('/deleteUser/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.appUser.delete({
            where: {
                id: parseInt(id),
            },
        });
        res.redirect('/admin/users');
    } catch (err) {
        console.error(err);
        res.status(500).render('Error on our side');
    }
});

// settings route
router.get('/settings', async (req, res) => {
    res.render('admin/settings', {  });
});

module.exports = router;