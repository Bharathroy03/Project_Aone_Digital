const app = require('./api/index.js');
const port = 5000;
app.listen(port, () => {
  console.log(`Backend API Server running locally on http://localhost:${port}`);
});
