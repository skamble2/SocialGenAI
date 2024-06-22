const express = require("express");
const { getJson } = require("serpapi");
const app = express();
const cors = require("cors"); // Import the cors middleware
const fs = require("fs");
const axios = require("axios");
const OpenAI = require("openai");
const recommendationRoute = require("./recommendationRoute"); 
const { generateReply } = require("./openai");
const esUrl = "http://localhost:9200/";
const jwt = require("jsonwebtoken");
const JWT_SECRET = "abc"

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());


let subscrib = []; 

let notification = [
  {
    user: 'user1',
    title:[],
  },
    {
    user: 'user2',
    title:[],
  },
      {
    user: 'user3',
    title:[],
  },
     {
    user: 'user4',
    title:[],
  },
    {
    user: 'user5',
    title:[],
  }   
];
app.post('/subscribe', async (req, res) => {
  try {
    const { title, user } = req.body;
    console.log(title);
    console.log(user);
  
    // Check if both category and username are provided
    if (!title || !user) {
      return res.status(400).json({ error: 'Category and username are required' });
    }
  
    // Find the user index in the subscrib array
    const userIndex = subscrib.findIndex(item => item.user === user);
  
    
  
    // Update the topic with the user who subscribed to it
    const topicIndex = subscrib.findIndex(item => item.title === title);
    if (topicIndex !== -1) {
      // Add the user to the topic's array of subscribers
      subscrib[topicIndex].users.push(user);
    } else {
      // If topic doesn't exist, create a new topic with the user
      subscrib.push({ title, users: [user] });
    }
  
    console.log(subscrib);
    
  
    res.json({ message: 'User subscribed successfully', subscriptions: subscrib });
  } catch (error) {
    console.error('Error subscribing user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/unsubscribe', async (req, res) => {
  try {
    const { title, user } = req.body;
    console.log(title);
    console.log(user);

    // Check if both title and user are provided
    if (!title || !user) {
      return res.status(400).json({ error: 'Title and username are required' });
    }

    // Find the index of the subscription entry for the specified title
    const topicIndex = subscrib.findIndex(item => item.title === title);

    if (topicIndex !== -1) {
      // Remove the user from the subscription list for the specified title
      const userIndex = subscrib[topicIndex].users.indexOf(user);
      if (userIndex !== -1) {
        subscrib[topicIndex].users.splice(userIndex, 1);
      } else {
        console.warn(`User '${user}' not found in the subscription list for title '${title}'`);
      }
    } else {
      console.warn(`Subscription entry for title '${title}' not found`);
    }

    console.log(subscrib);

    res.json({ message: 'User unsubscribed successfully', subscriptions: subscrib });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const userLocation = async () => {
  try {
    const response = await axios.get("https://ipapi.co/json/");
    console.log("location", response.data);
    return response.data;
  } catch (error) {
    console.error('Error retrieving user location:', error);
    throw error;
  }
}

// app.get('/api/events', async(req, res) => {
//   const { city, region, country_name } = await userLocation();
//   getJson({
//     engine: 'google_events',
//     q: `${city},${region},${country_name}`,
//     hl: 'en',
//     gl: 'us',
//     api_key: 'e478b5aac8b296712fe73df48d1e6a352d509045650dfe5ca59e9f1a6b9d277d',
//   }, (json) => {
//     res.json(json.events_results);
//   });
// });

app.post('/api/events', async (req, res) => {
  const { city, region, country_name } = await userLocation();
  const { searchQuery } = req.body; // Assuming the search query is sent in the request body
  
  getJson({
    engine: 'google_events',
    q: `${searchQuery},${city},${region},${country_name}`, // Append searchQuery to the query string
    hl: 'en',
    gl: 'us',
    api_key: 'e478b5aac8b296712fe73df48d1e6a352d509045650dfe5ca59e9f1a6b9d277d',
  }, (json) => {
    res.json(json.events_results);
  });
});

app.post('/api/suggestions', async (req, res) => {
  const { searchQuery } = req.body;

  try {
    // Fetch autocomplete suggestions using Serpapi
    getJson(
      {
        engine: 'google_autocomplete',
        q: searchQuery,
        cp: '1',
        hl: 'en',
        gl: 'us',
        api_key: 'e478b5aac8b296712fe73df48d1e6a352d509045650dfe5ca59e9f1a6b9d277d',
      },
      (json) => {
        const suggestions = json['suggestions'];
        res.json({ suggestions });
      }
    );
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch autocomplete suggestions' });
  }
});





app.post('/restaurant-info', async (req, res) => {
  try {
    // Get user location
    const { city, region, country_name } = await userLocation();
    
    // Extract query from request body
    const { query } = req.body;
    console.log("Query",query)
    // Set parameters for the Yelp search query
    const params = {
      engine: 'yelp',
      find_loc: `${city},${region},${country_name}`,
      sortby: 'recommended',
      start: '3',
      find_desc: query,
      api_key: 'e478b5aac8b296712fe73df48d1e6a352d509045650dfe5ca59e9f1a6b9d277d', // Replace 'secret_api_key' with your actual SerpApi API key
    };

    // Perform the Yelp search query
    getJson(params, (json) => {
      // Extract relevant information from the search result
      const restaurantInfo = json?.organic_results?.map((result) => ({
        name: result.title,
        address: result.address,
        rating: result.rating,
        reviews: result.reviews,
        website: result.website,
        phone: result.phone,
        thumbnail: result.thumbnail,
      }));
     // console.log(params)
      // Return the restaurant information
      res.json({ restaurantInfo });
    });
  } catch (error) {
    console.error('Error retrieving restaurant information:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/category-index-data', async (req, res) => {
  try {
    // Make a GET request to Elasticsearch to retrieve data from the category index
    const response = await axios.get('http://localhost:9200/categories/_search');

    // Extract the relevant information (documents) from the response
    const categoryData = response.data.hits.hits.map(hit => hit._source);

    res.json(categoryData);
  } catch (error) {
    console.error('Error getting category index data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Use cors middleware to enable CORS


app.use("/api", recommendationRoute);
//create post index
app.post("/create-post-index", async (req, res) => {
  try {
    const checkIndexExist = async () => {
      try {
        await axios.head(`${esUrl}posts`);
        return true;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return false;
        }
        throw error;
      }
    };

    const indexExists = await checkIndexExist();
    if (!indexExists) {
      const esResponse = await axios.put(`${esUrl}posts`, {
        mappings: {
          properties: {
            title: { type: "text" },
            imgUrl: { type: "keyword" },
            author: { type: "keyword" },
            content: { type: "text" },
            category: { type: "keyword" },
            date: { type: "date" },
            comment: { type: "keyword" } // Add comment property to the mapping
          },
        },
      });
      
      // Add the sample post data to Elasticsearch
      await axios.post(`${esUrl}posts/_doc`, {
        "id": 1,
    "title": "How to Start a Successful Blog",
    "img": "https://images.pexels.com/photos/6631855/pexels-photo-6631855.jpeg?auto=compress&cs=tinysrgb&w=600",
    "author": "Alice Johnson",
    "date": "2023-07-20",
    "content": "Cras tristique, nisl sit amet euismod pharetra, magna libero interdum ante, non gravida magna ex eu mauris. Donec suscipit consequat velit, nec euismod elit bibendum eget. Phasellus vel arcu quis urna accumsan viverra. Duis ac dui vel magna suscipit malesuada.",
    "category": "Academic Resources",
    "comment": ["Greate guidance", "One of the best"]
      });

      res.json(esResponse.data);
    } else {
      res.json("Index already exists");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});
//delete post index
app.delete("/delete-post-index", async (req, res) => {
  try {
    const esResponse = await axios.delete(`${esUrl}posts`);
    res.json(esResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

//Add post to elastic
app.post("/add-post", async (req, res) => {
  try {
    const { title, img, author, content } = req.body;
    console.log(title);
    // Fetch posts from Elasticsearch to find the highest id
    const existingPosts = await fetchPosts();
    const highestId = existingPosts.reduce((maxId, post) => Math.max(maxId, post.id), 0);
    
      const newPost = {
        id: highestId + 1, // Automatically generate the id based on the highest id + 1
        title,
        img,
        author,
        content,
        date: new Date().toISOString().split("T")[0],
        comment: [] // Include the comment property from the request body
      };
    
      const response = await axios.post(`${esUrl}posts/_doc/${newPost.id}`, newPost);
    
        subscrib.forEach(post => {
          const { title, users } = post;
          console.log(title)
          console.log(users)
          users.forEach(user => {
            const userIndex = notification.findIndex(item => item.user === user);
           
            if (userIndex !== -1 && title === category) {
              
              // Add the title to the user's notification entry
              notification[userIndex].title.push(title);
            }
          });
        });
    console.log(notification)
    res.json({ post: response.data, notification });
  } catch (error) {
    //console.error(error);
    res.status(500).json(error);
  }
});

app.delete("/delete-post/:postId", async (req, res) => {
  try {
    const { postId } = req.params; // Extract postId from the request parameters

    // Delete the post from Elasticsearch
    const response = await axios.delete(`${esUrl}posts/_doc/${postId}`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

const fetchPosts = async () => {
    try {
        const response = await axios.get(`${esUrl}posts/_search`);
        return response.data.hits.hits.map(hit => hit._source);
    } catch (error) {
        throw error;
    }
};

let posts = []; // Initialize posts array

// Endpoint to update a post
app.post('/update-post', async (req, res) => {
    try {
        const updatedPost = req.body;

        // Fetch posts from Elasticsearch
        posts = await fetchPosts();

        // Find the index of the updated post
        const index = posts.findIndex(post => post.id === updatedPost.id);

        if (index !== -1) {
            // Update the post data in the posts array
            posts[index] = updatedPost;

            // Update the post in Elasticsearch
            await axios.put(`${esUrl}posts/_doc/${updatedPost.id}`, updatedPost);

            res.status(200).json({ message: 'Post updated successfully', post: updatedPost });
        } else {
            res.status(404).json({ error: 'Post not found' });
        }
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get("/get-posts", async (req, res) => {
  try {
    const response = await axios.get(`${esUrl}posts/_search`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.get("/notifications", (req, res) => {
  try {
    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/create-user-index", async (req, res) => {
  try {
    const checkIndexExist = async () => {
      try {
        await axios.head(`${esUrl}users`);
        return true;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return false;
        }
        throw error;
      }
    };

    const indexExists = await checkIndexExist();
    if (!indexExists) {
      const esResponse = await axios.put(`${esUrl}users`, {
        mappings: {
          properties: {
            username: { type: "keyword" },
            password: { type: "keyword" },
            userType: { type: "keyword" },
            enable: { type: "boolean" },
          },
        },
      });
      res.json(esResponse.data);
    } else {
      res.json("Index already exists");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

// app.post('/login', async (req, res) => {
//   try {
//     const { username, password, userType } = req.body;

//     // Search for the user in Elasticsearch
//     const { data } = await axios.get(`${esUrl}users/_search`, {
//       params: {
//         q: `username:${username} AND password:${password} AND userType:${userType}`
//       }
//     });

//     // Check if any user matches the search criteria
//     const hits = data.hits.hits;
//     if (hits.length === 0) {
//       return res.status(401).json({ error: 'Invalid username, password, or userType' });
//     }

//     // Get the first matching user
//     const user = hits[0]._source;

//     if (!user.enable) {
//       return res.status(403).json({ error: 'Your access is blocked. Contact Admin' });
//     }

//     res.json({ message: 'Login successful', userType: user.userType });
//   } catch (error) {
//     console.error('Error logging in:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

app.post('/login', async (req, res) => {
  try {
    const { username, password, userType } = req.body;

    // Search for the user in Elasticsearch
    const { data } = await axios.get(`${esUrl}users/_search`, {
      params: {
        q: `username:${username} AND password:${password} AND userType:${userType}`
      }
    });

    // Check if any user matches the search criteria
    const hits = data.hits.hits;
    if (hits.length === 0) {
      return res.status(401).json({ error: 'Invalid username, password, or userType' });
    }

    // Get the first matching user
    const user = hits[0]._source;

    if (!user.enable) {
      return res.status(403).json({ error: 'Your access is blocked. Contact Admin' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.userId,
        username: user.username,
        userType: user.userType
      },
      JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour, adjust as needed
    );

    // Send response with token
    res.json({ message: 'Login successful',username:user.username, userType: user.userType, token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/add-user", async (req, res) => {
  try {
    const { username, password, userType } = req.body; // Extract username, password, and userType from request body

    const newUser = {
      username: username,
      password: password,
      userType: userType,
      enable: "true",
    };

    const response = await axios.post(`${esUrl}users/_doc`, newUser);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});


app.get("/get-users", async (req, res) => {
  try {
    const response = await axios.get(`${esUrl}users/_search`);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.post("/delete-user", async (req, res) => {
  try {
    const query = {
      query: {
        bool: {
          must: [
            { match: { username: "shivdeep" } },
            { match: { password: "password" } },
            { match: { userType: "admin" } }
          ]
        }
      }
    };

    const response = await axios.post(`${esUrl}users/_delete_by_query`, query);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});

app.delete("/delete-user-index", async (req, res) => {
  try {
    const esResponse = await axios.delete(`${esUrl}users`);
    res.json(esResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json(error);
  }
});


app.get('/search', async (req, res) => {
  const { q } = req.query;
  console.log(q);
 // const { q } = "soham";
  try {
    const response = await axios.get(`http://localhost:9200/posts/_search?q=title:${q}`);
    console.log(response);
    const searchResults = response.data.hits.hits.map((hit) => hit._source);
    res.json(searchResults);
  } catch (error) {
    console.error('Error searching in Elasticsearch:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post("/automatic-reply", async (req, res) => {
  try {
    // Use the OpenAI functionality to generate a reply based on frontend input
    console.log(req.body);
    const reply = await generateReply(req.body);
    
    // Send the generated reply as a response
    res.json({ recommendation: reply });
  } catch (error) {
    console.error("Error getting recommendation:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
