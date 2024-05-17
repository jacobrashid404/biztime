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

  // include comp_code in invoice query for later company query
  // comp_code key will be removed before final return
  const invoiceResults = await db.query(`
    SELECT id, comp_code, amt, paid, add_date, paid_date
    FROM invoices
    WHERE id = $1`, [id]
  );
  const invoice = invoiceResults.rows[0];
  if (!invoice) throw new NotFoundError(`No matching invoice id: ${id}`);

  // get company code from invoice query
  const companyCode = invoice.comp_code;

  // delete company code key from invoice
  // company details get added from company query below
  delete invoice.comp_code;

  // select company by code received from invoice query
  const companyResults = await db.query(`
    SELECT code, name, description
    FROM companies
    WHERE code = $1`, [companyCode]
  );
  const company = companyResults.rows[0];

  // add company key to invoice with company details as its value
  invoice.company = company;

  return res.json({ invoice });
});


/** Adds an invoice.
 *  Needs to be passed in JSON body of: {comp_code, amt}
 *  Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.post("/", async function (req, res) {
  if (!req.body) throw new BadRequestError();

  // handle missing requirements
  if (!req.body.comp_code || !req.body.amt) {
    throw new BadRequestError("Invalid JSON body. Missing required data.");
  }

  const { comp_code, amt } = req.body;

  const result = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ($1, $2) RETURNING comp_code, amt`,
    [comp_code, amt],
  );
  const invoice = result.rows[0];

  return res.status(201).json({ invoice });
});


/** Updates an invoice.
 *  If invoice cannot be found, returns a 404.
 *  Needs to be passed in a JSON body of {amt}
 *  Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */
router.put("/:id", async function (req, res) {

  if (!req.body) throw new BadRequestError();

  // handles missing required input
  if (!req.body.amt) {
    throw new BadRequestError("Missing data. Need amt.");
  }

  const id = req.params.id;
  const results = await db.query(`
    UPDATE invoices
    SET amt=$1
    WHERE id = $2 RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [req.body.amt, id]
  );
  const invoice = results.rows[0];

  if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);

  return res.json({ invoice });

});

/** Deletes an invoice.
 *  If invoice cannot be found, returns a 404.
 *  Returns: {status: "deleted"}
 */
router.delete("/:id", async function (req, res) {
  const id = req.params.id;
  console.log("id", id);

  const results = await db.query(`
    DELETE FROM invoices 
    WHERE id = $1 RETURNING id`,
    [id],
  );
  const invoice = results.rows[0];
  console.log("invoice", invoice);

  if (!invoice) throw new NotFoundError(`No matching invoice ${id}`);

  return res.json({ status: "deleted" });  
});


export default router;