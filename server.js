// server.js
const express = require('express');
const axios = require('axios');
const app = express();

// Configuration
const PORT = 9876;
const WINDOW_SIZE = 10;
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/evaluation-service';
const TIMEOUT_MS = 500;

// Store for the numbers
let windowState = [];

// Mapping for number type to API endpoint
const numberTypeToEndpoint = {
  'p': 'primes',
  'f': 'fibo',
  'e': 'even',
  'r': 'rand'
};

// Helper function to calculate average
const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, curr) => acc + curr, 0);
  return sum / numbers.length;
};

// Endpoint to get numbers
app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
  const endpoint = numberTypeToEndpoint[numberid];

  // If the numberid is not valid, return 400
  if (!endpoint) {
    return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
  }

  try {
    // Save the previous state of the window
    const windowPrevState = [...windowState];
    
    // Make request to third-party server with timeout
    const response = await axios.get(`${TEST_SERVER_BASE_URL}/${endpoint}`, {
      timeout: TIMEOUT_MS
    });
    
    // Extract numbers from response
    const receivedNumbers = response.data.numbers || [];
    
    // Add unique numbers to the window
    for (const num of receivedNumbers) {
      if (!windowState.includes(num)) {
        if (windowState.length >= WINDOW_SIZE) {
          // Remove the oldest number if window size is reached
          windowState.shift();
        }
        windowState.push(num);
      }
    }

    // Calculate average
    const avg = calculateAverage(windowState);
    
    // Format response
    const responseData = {
      windowPrevState,
      windowCurrState: [...windowState],
      numbers: receivedNumbers,
      avg: parseFloat(avg.toFixed(2))
    };

    return res.json(responseData);
  } catch (error) {
    console.error('Error fetching numbers:', error.message);
    
    // If timeout or other error, still return current state
    const responseData = {
      windowPrevState: [...windowState],
      windowCurrState: [...windowState],
      numbers: [],
      avg: parseFloat(calculateAverage(windowState).toFixed(2))
    };
    
    return res.json(responseData);
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Average Calculator microservice is running on http://localhost:${PORT}`);
});