// Tell Node that we're in test "mode"
process.env.NODE_ENV == "test";

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testBook_isbn;

beforeEach(async () => {
    const result = await db.query(`INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) 
    VALUES ('8817026271', 'https://www.amazon.com/Lorigine-perduta/dp/8817026271', 'Matilde Asensi','Italian', 502, 'BUR Rizzoli', 'L''origine perduta', 2008) 
    RETURNING isbn`);
    testBook_isbn = result.rows[0].isbn;
})

afterEach(async () => {
    await db.query("DELETE FROM BOOKS");
})


describe("GET /books", () => {
    test("Get a list of 1 book", async () => {

        const res = await request(app).get('/books');
        const books = res.body.books[0];
        expect(books).toHaveProperty("isbn");
        expect(books.isbn).toEqual(testBook_isbn);
        expect(books).toHaveProperty("amazon_url");
        expect(books).toHaveProperty("author");
        expect(books).toHaveProperty("language");
        expect(books.language).toEqual("Italian");
        expect(books).toHaveProperty("pages");
        expect(books).toHaveProperty("publisher");
        expect(books).toHaveProperty("title");
        expect(books).toHaveProperty("year");
    })

})

describe("POST /books/", () => {
    test("Creating a books", async () => {
        const res = await request(app).post('/books').send({
                                                                isbn: '1784880868',
                                                                amazon_url: "https://test.com",
                                                                author: "Guy Test",
                                                                language: "English",
                                                                pages: 144,
                                                                publisher: "Hardie Grant",
                                                                title: "Poke: Sushi Bowls Test",
                                                                year: 2017
                                                            });
        expect(res.statusCode).toBe(201);
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book.isbn).toBe('1784880868');
    })

    test("400 jsonschema validation. isbn required but not pass", async () => {
        const res = await request(app).post(`/books`).send({ pages: 40 });
        expect(res.statusCode).toBe(400);
    })
})

describe("GET /books/:isbn", () => {
    test("Get the book with the isbn given", async () => {
        const res = await request(app).get(`/books/${testBook_isbn}`);
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book.isbn).toBe(testBook_isbn);
    
    })
    test("Responds with 404 for invalid isbn", async () => {
        const res = await request(app).get(`/books/libro`);
        expect(res.statusCode).toBe(404);
    })
})


describe("PUT /books/:isbn", () => {
    test("Updates the book with the isbn given", async () => {
        const res = await request(app).put(`/books/${testBook_isbn}`)
        .send({
                isbn: '1784880868',
                amazon_url: "https://test.com",
                author: "Update Sandy",
                language: "English",
                pages: 144,
                publisher: "Hardie Grant",
                title: "Poke: Sushi Bowls Update",
                year: 2017
            });
        expect(res.body.book).toHaveProperty("isbn");
        expect(res.body.book).toHaveProperty("author");
        expect(res.body.book.author).toBe('Update Sandy');

    })
    test("Responds with 400 for invalid jsonschema", async () => {
        const res = await request(app).put(`/books/${testBook_isbn}`).send({
            isbn: '1784880868',
            amazon_url: "https://update.com",
            author: "Update Sandy",
            language: "English",
            pages: '144',
            publisher: "Hardie Grant",
            title: "Poke: Sushi Bowls Update",
            year: '2017'
        });
        expect(res.statusCode).toBe(400);
    })
})


describe("DELETE /books/:isbn", () => {
    test("Delete the book with isbn given", async () => {
        const res = await request(app).delete(`/books/${testBook_isbn}`);
        expect(res.body).toEqual({ message: "Book deleted" });
    })
    test("Responds with 404 for invalid isbn", async () => {
        const res = await request(app).delete(`/books/libro`);
        expect(res.statusCode).toBe(404);
    })
})


afterAll(async function () {
    await db.end();
});
