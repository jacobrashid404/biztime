import { describe, test, expect, beforeEach, afterEach, afterAll } from "vitest";
import request from "supertest";
import app from "./app.js";
import db from "./db.js";

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('test', 'Test Company One', 'test company for testing')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});

afterAll(async function () {
  await db.end();
});


describe("GET /companies", function () {
  test("Gets list of companies", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [{code: testCompany.code, name: testCompany.name}],
    });
  });
});
