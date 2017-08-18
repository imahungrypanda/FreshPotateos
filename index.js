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

function dateRange(date) {
  let date1,
      date2,
      splitDate = date.split('-'),
      year = +splitDate[0];

  date1 = (year - 15).toString() + '-' + splitDate.slice(1).join('-');
  date2 = (year + 15).toString() + '-' + splitDate.slice(1).join('-');

  return [date1, date2];
}

function filmAverageRating(reviews) {
  let ratingSum = 0;
  reviews.forEach(review => ratingSum += review.rating);

  return (ratingSum / reviews.length).toFixed(2);
}

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  let filmId = +req.params.id,
      limit = 0,
      offset = 0;

  if (typeof filmId === 'number') {
    sqlite.get('SELECT * FROM films WHERE id = ?', filmId)
     		.then(film => {
          let dates = dateRange(film.release_date);

          sqlite.all('SELECT films.id, films.title, films.release_date, name AS genre FROM films, genres WHERE genre_id = ? AND release_date BETWEEN ? AND ? AND genres.id = films.genre_id', film.genre_id, dates[0], dates[1])
            .then(foundFilms => {
              let filmIds = [],
                films = {};

              foundFilms.forEach(f => {
                filmIds.push(f.id);
                films[f.id] = f;
              });

              request(`http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=${filmIds.join(',')}`, function (error, response, body) {
                let reviews = JSON.parse(body).filter(film =>
                  film.reviews.length > 4 && filmAverageRating(film.reviews) >= 4
                )
                    recommendations = [];

                    reviews.forEach(review => {
                      let recommend = {
                        id: review.film_id,
                        title: films[review.film_id].title,
                        releaseDate: films[review.film_id].release_date,
                        genre: films[review.film_id].genre,
                        averageRating: filmAverageRating(review.reviews),
                        reviews: review.reviews.length
                      };

                      recommendations.push(recommend);
                    });

                    res.setHeader('Content-Type', 'application/json');
                    res.status(200).send(JSON.stringify({
                      recommendations: recommendations,
                      meta: {
                        limit: 0,
                        offset: 0
                      }
                    }));
              })
            })
            .catch(err => res.status(404).send(err));
          })
          .catch(err => res.status(404).send(err));
  }
  else {
    res.status(500).send('Not a film');
  }
}

module.exports = app;
