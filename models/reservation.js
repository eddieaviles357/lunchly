/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  };
  /** getters */
  get numGuests() { return this._numGuests };
  get notes() { return this._notes };
  get startAt() { return this._startAt };

  /** setters */
  set notes(val) { (val) ? this._notes = val : this._notes = '' };
  set numGuests(n) { 
    if(n < 1) throw new Error('Must have at least one guest');
    this._numGuests = n;
  };
  set startAt(dateObj) {
    if(!(dateObj instanceof Date)) throw new Error('Must be a date obj');
    this._startAt = dateObj;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  };

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  };


  /** save reservation */
  async save() {
    if(this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, start_at, num_guests, notes)
        VALUES 
        ($1, $2, $3, $4)
        RETURNING id`,
        [ this.customerId, this.startAt, this.numGuests, this.notes ]
      );
      this.id = result.rows[0].id;
    } else {
      db.query(
        `UPDATE reservations
        SET customer_id=$1 start_at=$2 num_guests=$3 notes=$4
        WHERE id=$5`,
        [ this.customerId, this.startAt, this.numGuests, this.notes, this.id ]
      );
    };
  };
};

module.exports = Reservation;
