import express from "express";
import db from "../db.js";
import { BadRequestError, NotFoundError } from "../expressError.js";

const router = new express.Router();

/** Returns list of companies, like {companies: [{code, name}, ...]} */
router.get("", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
    FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});


/** Return obj of company: {company: {code, name, description}}
 * If the company given cannot be found, this should return a 404 status response.
 */
router.get("/:code", async function (req, res) {
  const code = req.params.code;
  const results = await db.query(
    `SELECT code, name, description
    FROM companies
    WHERE code = $1`, [code]);
  const company = results.rows[0];

  if (!company) throw new NotFoundError("No matching company");
  return res.json({ company });
});

/** Adds a company to db.
 * Accepts JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
 */
router.post("", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
    VALUES ($1, $2, $3) RETURNING code, name, description`,
    [code, name, description],
  );

  const company = result.rows[0];
  return res.status(201).json({ company });
});

/** Edit existing company.
 * Return 404 if company cannot be found.
 * Given JSON like: {name, description},
 * returns update company object: {company: {code, name, description}}
 */
router.put("/:code", async function (req, res) {
  if (req.body === undefined || "code" in req.body) {
    throw new BadRequestError("Not allowed");
  }
  // handles missing required inputs
  if (!req.body.name || !req.body.description) {
    throw new BadRequestError("Missing data. Need name and description.");
  }

  const code = req.params.code;
  const results = await db.query(
    `UPDATE companies
    SET name=$1, description=$2
    WHERE code = $3 RETURNING code, name, description`,
    [req.body.name, req.body.description, code]
  );
  const company = results.rows[0];

  if (!company) throw new NotFoundError(`No matching company: ${code}`);
  return res.json({ company });
});

// DELETE next


export default router;