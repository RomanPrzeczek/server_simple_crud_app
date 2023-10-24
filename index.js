const express = require('express');
const cors = require('cors');

const app = express();

// Creating of Express application
app.use(cors());
app.use(express.json());
app.use("/user", require("./controller/users-controller"));

// Creating of get route
/* Now, we will create an endpoint /message that will return a JSON object with the message Hello from server!.
We are using app.get() to create a GET route */
app.get('/message', (req, res) => {
    res.json({ message: "Hello from server!" });
});

//Starting of server
app.listen(8000, () => {
  console.log(`Server is running on port 8000.`);
});