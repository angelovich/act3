const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cors());
app.use(cookieParser());
const db = new sqlite3.Database(':memory:');

// Crea una tabla llamada usuarios en la base de datos
db.serialize(() => {
  db.run('CREATE TABLE usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, correo TEXT, password TEXT)');
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  const username = req.cookies.username;
  if (username) {
    res.sendFile(__dirname + '/index.html');
  } else {
    res.redirect('/login');
  }
});

app.get('/registro', (req, res) => {
  res.sendFile(__dirname + '/registro.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/');
});

app.post('/registro', (req, res) => {
  const { username, correo, password } = req.body;

  db.get('SELECT * FROM usuarios WHERE username = ?', username, (err, row) => {
    if (err) {
      res.status(500).send('Error en el servidor');
    } else if (row) {
      res.status(409).json({ error: 'username' });
    } else {
      db.get('SELECT * FROM usuarios WHERE correo = ?', correo, (err, row) => {
        if (err) {
          res.status(500).send('Error en el servidor');
        } else if (row) {
          res.status(409).json({ error: 'correo' });
        } else {
          db.run('INSERT INTO usuarios (username, correo, password) VALUES (?, ?, ?)', username, correo, password, (err) => {
            if (err) {
              res.status(500).send('Error en el servidor');
            } else {
              res.status(200).send('Registro exitoso');
            }
          });
        }
      });
    }
  });
});

app.post('/login', (req, res) => {
  const { usernameOrCorreo, password } = req.body;

  db.get(
    'SELECT * FROM usuarios WHERE (username = ? OR correo = ?) AND password = ?',
    usernameOrCorreo,
    usernameOrCorreo,
    password,
    (err, row) => {
      if (err) {
        res.status(500).send('Error en el servido');
      } else if (!row) {
        res.status(409).send('Nombre de usuario o correo electrónico o contraseña incorrectos');
      } else {
        // Almacenar el nombre de usuario en una cookie
        res.cookie('username', row.username);
        res.redirect('/');
      }
    }
  );
});

app.get('/usuarios', (req, res) => {
  db.all('SELECT * FROM usuarios', (err, rows) => {
    if (err) {
      res.status(500).send('Error en el servidor');
    } else {
      res.status(200).json(rows);
    }
  });
});

app.use(express.static(__dirname));

app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});
