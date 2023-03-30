/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this.fullName = {firstname: this.firstName,lastname: this.lastName};
  };

  /** getters */
  get firstName() { return this._firstName };
  get lastName() { return this._lastName };
  get phone() { return this._phone };
  get notes() { return this._notes };
  get fullName() { return this._fullName };

  /** setters */
  set firstName(txt) { (txt) ? this._firstName = txt : this._firstName = '' };
  set lastName(txt) { (txt) ? this._lastName = txt : this._lastName = '' };
  set phone(txt) { (txt) ? this._phone = txt : this._phone = '' };
  set notes(txt) { (txt) ? this._notes = txt : this._notes = '' };
  set fullName({firstname, lastname}) { 
    this._fullName = `${firstname} ${lastname}`
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  };

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    };

    return new Customer(customer);
  };

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  };

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    };
  };

  /** search a customer */

  static async search(customer) {
    const result = await db.query(
      `SELECT id, 
        first_name AS "firstName",  
        last_name AS "lastName", 
        phone, 
        notes 
      FROM customers 
      WHERE first_name ILIKE $1 
      OR last_name ILIKE $1 
      ORDER BY last_name, first_name`,
      [ `%${customer}%` ]
    );
    return result.rows.map(c => new Customer(c));
  };

  /** get top n customers with the most reservations */
  static async getTopCustomers(limit) {
    const results = await db.query(
      `SELECT c.id, 
        c.first_name AS "firstName", 
        c.last_name AS "lastName", 
        c.phone, 
        c.notes 
      FROM reservations AS r 
      JOIN customers c 
      ON r.customer_id = c.id  
      GROUP BY customer_id, c.id, "firstName", "lastName" 
      ORDER BY COUNT(*) 
      DESC LIMIT $1`,
      [limit]
    );
    return results.rows.map( r => new Customer(r))
  };
};



module.exports = Customer;
