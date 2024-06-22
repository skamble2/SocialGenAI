const express = require('express');
const { Client } = require('@elastic/elasticsearch');

const app = express();
const client = new Client({ node: 'http://localhost:9200' });

const titles = [
  'user1',
  'user2',
  'user3',
  'user4',
  'user5',
];

const createIndex = async () => {
  try {
    // Create index mapping
    await client.indices.create({
      index: 'cat',
      body: {
        mappings: {
          properties: {
            title: { type: 'text' },
          },
        },
      },
    });

    // Index each title as a document
    for (let i = 0; i < titles.length; i++) {
      await client.index({
        index: 'categories',
        body: {
          users: titles[i],
          category: [],
        },
      });
    }

    console.log('Index created successfully with titles indexed.');
  } catch (error) {
    console.error('Error creating index:', error);
  }
};

const getCategoryIndex = async () => {
  try {
    // Send a request to retrieve the index information
    const response = await client.indices.get({
      index: 'categories'
    });

    // Return the index information
    return response.body;
  } catch (error) {
    console.error('Error getting category index:', error);
    throw error; // Propagate the error for handling in the caller function
  }
};

// Route to retrieve the category index
app.get('/get-category-index', async (req, res) => {
  try {
    // Call the getCategoryIndex function to retrieve the index information
    const categoryIndex = await getCategoryIndex();

    // Send the retrieved index information as the response
      res.json(categoryIndex);
      
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Create the category index
createIndex();

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
