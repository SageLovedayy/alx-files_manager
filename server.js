const express = require('express');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 5000;

// MIDDLEWARE - JSON and URL encoded data parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ---------------------------------------------
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
