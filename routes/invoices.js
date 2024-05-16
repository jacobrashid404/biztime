import express from "express";
import db from "../db.js";
import { BadRequestError, NotFoundError } from "../expressError.js";

const router = new express.Router();

/** Get all invoices
 *  Return info like {invoices: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res) {
  const results = await db.query(`
    SELECT id, comp_code
    FROM invoices
    ORDER BY id`);

  const invoices = results.rows;

  return res.json({ invoices });
});

/** Get requested invoice.
 *  If invoice cannot be found, returns 404.
 *  Returns
 * {invoice:
 *    {id, amt, paid, add_date, paid_date, company: {code, name, description}
 * } */
router.get("/:id", async function (req, res) {
  const id = req.params.id;

  // first query invoices db to get the comp_code (FK for companies)
  const invoiceResults = await db.query(`
    SELECT id, comp_code, amt, paid, add_date, paid_date
    FROM invoices
    WHERE id = $1`, [id]);
  const invoice = invoiceResults.rows[0];
});


export default router;