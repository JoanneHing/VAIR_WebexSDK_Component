const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
const app = express();
const PORT = 3001; 


const HEYGEN_API_KEY = 'YjRkNTViMWZjZWE0NDE1OWEyOTVhMTVmZTM5NzYxMzQtMTc0NzI5MzI5Ng=='; 

app.use(cors()); 
app.use(express.json()); 

app.get('/get-heygen-sessions', async (req, res) => {
  const heygenApiUrl = 'https://api.heygen.com/v1/streaming.list';

  console.log(`Proxying GET request to HeyGen streaming.list: ${heygenApiUrl}`);

  try {
    const response = await axios({
      method: 'GET',
      url: heygenApiUrl,
      headers: {
        'accept': 'application/json',
        'x-api-key': HEYGEN_API_KEY
      }
    });

    res.status(response.status).json(response.data);

  } catch (err) {
    console.error('Error calling HeyGen streaming.list from proxy:', err.response ? err.response.data : err.message);
    res.status(err.response ? err.response.status : 500).json({
      error: 'Failed to reach HeyGen streaming.list API via proxy',
      details: err.response ? err.response.data : err.message
    });
  }
});

app.post('/send-to-heygen', async (req, res) => {
  const { session_id, text } = req.body; 

  if (!session_id || !text) {
    return res.status(400).json({ error: 'Missing session_id or text in request body.' });
  }

  const heygenApiUrl = 'https://api.heygen.com/v1/streaming.task'; 

  console.log(`Proxying POST request to HeyGen streaming.task: ${heygenApiUrl}`);
  console.log(`Payload: { session_id: "${session_id}", text: "${text}" }`);

  try {
    const response = await axios({
      method: 'POST',
      url: heygenApiUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': HEYGEN_API_KEY
      },
      data: { 
        session_id: session_id,
        text: text,
        task_type: 'repeat' 
      }
    });

    res.status(response.status).json(response.data);

  } catch (err) {
    console.error('Error calling HeyGen from proxy:', err.response ? err.response.data : err.message);
    res.status(err.response ? err.response.status : 500).json({ 
      error: 'Failed to reach HeyGen API via proxy',
      details: err.response ? err.response.data : err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`HeyGen Proxy server listening on http://localhost:${PORT}`);
});