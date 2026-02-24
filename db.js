const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) console.error(err.message);
  else console.log("Connected to SQLite database.");
});

// Enable Foreign Key Support
db.run(`PRAGMA foreign_keys = ON`);

// Create Tables & Insert default data
db.serialize(() => {

  // Roles Table
  db.run(`
    CREATE TABLE IF NOT EXISTS roles(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE CHECK(name IN ('MANAGER','SUPPORT','USER'))
    )
  `);

  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

  // Tickets Table
  db.run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')) DEFAULT 'OPEN',
      priority TEXT CHECK(priority IN ('LOW','MEDIUM','HIGH')) DEFAULT 'MEDIUM',
      created_by INTEGER,
      assigned_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )
  `);

  // Ticket Comments
  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_comments(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Ticket Status Logs
  db.run(`
    CREATE TABLE IF NOT EXISTS ticket_status_logs(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      old_status TEXT NOT NULL CHECK(old_status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
      new_status TEXT NOT NULL CHECK(new_status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
      changed_by INTEGER NOT NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    )
  `);

  // Insert default roles
  db.run(`
    INSERT OR IGNORE INTO roles (id, name) VALUES
    (1, 'MANAGER'),
    (2, 'SUPPORT'),
    (3, 'USER')
  `);

  // Insert default manager user with password "1234"
  const defaultPassword = '1234';
  bcrypt.hash(defaultPassword, 10, (err, hash) => {
    if (err) console.error("Error hashing default password:", err);
    else {
      db.run(`
        INSERT OR IGNORE INTO users (id, name, email, password, role_id)
        VALUES (1, 'Manager', 'manager@gmail.com', ?, 1)
      `, [hash], (err) => {
        if (err) console.error("Error inserting default manager:", err);
        else console.log("Default manager created: manager@gmail.com / 1234");
      });
    }
  });

  // Optional: Insert default support and user accounts
  bcrypt.hash('1234', 10, (err, hash) => {
    if (!err) {
      db.run(`
        INSERT OR IGNORE INTO users (id, name, email, password, role_id)
        VALUES (2, 'Support', 'support@gmail.com', ?, 2)
      `, [hash]);
      db.run(`
        INSERT OR IGNORE INTO users (id, name, email, password, role_id)
        VALUES (3, 'User1', 'user1@gmail.com', ?, 3)
      `, [hash]);
    }
  });

});

module.exports = db;