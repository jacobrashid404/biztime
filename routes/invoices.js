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


export default router;