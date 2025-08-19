// server/index.js

const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('✅ Server is running. Use /api/concept for POST requests.');
});

// Simple test route
const confusionSolverRoute = require("./routes/confusion");
app.use("/api/confusion-solver", confusionSolverRoute);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


const confusionRouter = require('./routes/confusion');
app.use('/api/confusion', confusionRouter);


                                                                                        