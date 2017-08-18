const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .then(() => sqlite.open('./db/database.db'))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  let filmId = +req.params.id,
      limit = 0,
      offset = 0;

  if (typeof filmId === 'number') {
    sqlite.get('SELECT * FROM films WHERE id = ?', filmId)
     		.then(film => {
          res.status(200).send(film);
        })
        .catch(err => res.status(404).send(err));
  }
  else {
    res.status(500).send('Not a film');
  }
}

module.exports = app;
