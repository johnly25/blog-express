import { test, expect, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import * as bcrypt from '../services/bcryptService'
import app from '../app-loader'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DEV_DATABASE_URL,
        },
    },
})

const clearDB = async () => {
    await prisma.author.deleteMany()
    await prisma.user.deleteMany()
    await prisma.post.deleteMany()
    await prisma.comment.deleteMany()
}

afterAll(async () => {
    await clearDB()
})

test('POST a /users', async () => {
    const response = await request(app).post('/users').type('form').send({
        firstname: 'john',
        lastname: 'nguyen',
        username: 'kazuha',
        email: 'jayennguyen@gmail.com',
        password: '123',
        author: 'false',
    })
    console.log(response.body)
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('username')
    expect(response.body).toHaveProperty('fullname')
    expect(response.body).not.toHaveProperty('author')
})

test('POST /users with author ', async () => {
    const response = await request(app).post('/users').type('form').send({
        firstname: 'john',
        lastname: 'nguyen',
        username: 'kazuha2',
        email: 'jayennguyen@gmail.com',
        password: '123',
        author: 'true',
    })
    expect(response.body).toHaveProperty('id')
    expect(response.body).toHaveProperty('username')
    expect(response.body).toHaveProperty('fullname')
    expect(response.body).toHaveProperty('author')
})

test('POST duplicate username /users', async () => {
    await request(app)
        .post('/users')
        .type('form')
        .send({
            firstname: 'john',
            lastname: 'nguyen',
            username: 'kazuha3',
            email: 'jayennguyen@gmail.com',
            password: '123',
            author: false,
        })
        .expect(200)

    return request(app)
        .post('/users')
        .type('form')
        .send({
            firstname: 'john',
            lastname: 'nguyen',
            username: 'kazuha3',
            email: 'jayennguyen@gmail.com',
            password: '123',
            author: false,
        })
        .expect(200)
        .then(response => {
            expect(response.body).toHaveProperty('error')
        })
})

test(`GET /users that is an author /users/:userid`, async () => {
    const response = await request(app).post('/users').type('form').send({
        firstname: 'john',
        lastname: 'nguyen',
        username: 'kazuha5',
        email: 'jayennguyen@gmail.com',
        password: '123',
        author: true,
    })
    const user = response.body
    const response2 = await request(app).get('/users/' + user.id)
    expect(response.status).toEqual(200)
    expect(response2.body).toHaveProperty('id')
    expect(response2.body).toHaveProperty('username')
    expect(response2.body).toHaveProperty('fullname')
    expect(response2.body).toHaveProperty('author')
})

test(`GET /users that's not a author /users/:userid`, async () => {
    const response = await request(app).post('/users').type('form').send({
        firstname: 'john',
        lastname: 'nguyen',
        username: 'kazuha6',
        email: 'jayennguyen@gmail.com',
        password: '123',
        author: false,
    })
    const user = response.body
    const response2 = await request(app).get('/users/' + user.id)
    expect(response.status).toEqual(200)
    expect(response2.body).toHaveProperty('id')
    expect(response2.body).toHaveProperty('username')
    expect(response2.body).toHaveProperty('fullname')
    expect(response2.body).toHaveProperty('author', null)
})

test('POST /users should have hashed password', async () => {
    const form = {
        firstname: 'john',
        lastname: 'nguyen',
        username: 'kazuha7',
        email: 'jayennguyen@gmail.com',
        password: '123',
        author: false,
    }
    const response = await request(app).post('/users').type('form').send(form)
    const user = response.body
    expect(response.status).toEqual(200)
    expect(response.status).toEqual(200)
    expect(
        await bcrypt.comparePassword(form.password, user.password),
    ).toBeTruthy()
})

test.skip('update user /users/:userid', async () => {})
test.skip('delete user /users/:userid', async () => {})
