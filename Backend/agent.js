const OpenAI = require("openai");
const axios = require('axios');
const { getJson } = require("serpapi");

const openai = new OpenAI({
  apiKey:"",
  dangerouslyAllowBrowser: true,
});

async function getLocation() {
  const response = await axios.get("https://ipapi.co/json/");
  console.log(response.data);
  return response.data;
}

async function getCurrentWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=apparent_temperature`;
  const response = await axios.get(url);
  return response.data;
}

const tools = [
  {
    type: "function",
    function: {
      name: "getCurrentWeather",
      description: "Get the current weather in a given location",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "string",
          },
          longitude: {
            type: "string",
          },
        },
        required: ["longitude", "latitude"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "getLocation",
      description: "Get the user's location based on their IP address",
      parameters: {
        type: "object",
        properties: {},
      },
    }
  },
];

const availableTools = {
  getCurrentWeather,
  getLocation,
};

const messages = [
  {
    role: "system",
    content: `You are a helpful assistant. Only use the functions you have been provided with. 
    Please provide only 3 restaurant names under the category 'restaurants',only 3 musical event names under the category 'musical events', and only 3 sports event names under the category 'sports events'. 
    Always structure your response in terms of these categories: restaurants, sports events, and musical events
    Give response as per Example.
    
    Example:

    Restaurants:
1. Name: [Restaurant Name]
   Location: [Exact Location]
   Description: [Description]

2. Name: [Restaurant Name]
   Location: [Exact Location]
   Description: [Description]

3. Name: [Restaurant Name]
   Location: [Exact Location]
   Description: [Description]

   Sports Events:
1. Name: [Event Name]
   Location: [Exact Location]
   Description: [Description]

2. Name: [Event Name]
   Location: [Exact Location]
   Description: [Description]

3. Name: [Event Name]
   Location: [Exact Location]
   Description: [Description]
    
   Musical Events:
1. Name: [Event Name]
   Location: [Exact Location]
   Description: [Description]

2. Name: [Event Name]
   Location: [Exact Location]
   Description: [Description]

3. Name: [Event Name]
   Location: [Exact Location]
   Description: [Description]`,
  },
];

async function agent(userInput) {
  messages.push({
    role: "user",
    content: userInput,
  });

  for (let i = 0; i < 5; i++) {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: messages,
      tools: tools,
    });

    const { finish_reason, message } = response.choices[0];

    if (finish_reason === "tool_calls" && message.tool_calls) {
      const functionName = message.tool_calls[0].function.name;
      const functionToCall = availableTools[functionName];
      const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
      const functionArgsArr = Object.values(functionArgs);
      const functionResponse = await functionToCall.apply(
        null,
        functionArgsArr
      );

      messages.push({
        role: "function",
        name: functionName,
        content: `
                The result of the last function was this: ${JSON.stringify(
                  functionResponse
                )}
                `,
      });
    } else if (finish_reason === "stop") {
      messages.push(message);
      console.log(message.content);
    


      const restaurants = message.content.split("\n").map(line => {
        if (line.includes("Location:")) {
          return line.substring(line.indexOf("Location:") + "Location:".length).trim();
        }
      }).filter(location => location !== undefined);


       const name = message.content.split("\n").map(line => {
        if (line.includes("Name:")) {
          return line.substring(line.indexOf("Name:") + "Name:".length).trim();
        }
      }).filter(location => location !== undefined);
      console.log(name);
      
       const rest = restaurants.slice(0, 3)
      const rest2 = restaurants.slice(3, 6)
      const rest3 =restaurants.slice(6, 9)
      // console.log("Restaurants:", rest);
      
    







      const userLocation = await getLocation();
      const { latitude, longitude } = userLocation;
      const userWeather = await getCurrentWeather(latitude,longitude);
        const city = userLocation.city
        const region = userLocation.region
      const country_name=userLocation.country_name
      //console.log(rest[0])
        
      
      // getJson({
      //     engine: "google_local",
      //     q:rest[0],
      //     location: `${city}, ${region}, ${country_name}`,
      //     api_key: "6a3f328f25eec56ff8dd7845a88eb1f7e46c14dc4e9d1e9e782468725c8dcb32"
      //   }, (json) => {
      //     console.log(json["local_results"]);
      //   });


      const restaurantResults = await Promise.all(rest.map(async (restaurant) => {
        
      const json = await getJson({
        engine: "google_local",
          q:restaurant,
          location: `${city}, ${region}, ${country_name}`,
          api_key: "3b9adf610919e7fac27d7c049d65207885f187f7f442ab71f94eddf1883ce159"
      });
      const localMap = json.local_results[0];
        //console.log(`Local Map for ${restaurant}:`, localMap.local_map);
        
      return localMap.gps_coordinates;
    }));

      const sportResults = await Promise.all(rest2.map(async (restaurant) => {
        
      const json = await getJson({
        engine: "google_local",
          q:restaurant,
          location: `${city}, ${region}, ${country_name}`,
          api_key: "3b9adf610919e7fac27d7c049d65207885f187f7f442ab71f94eddf1883ce159"
      });
      const localMap = json.local_results[0];
      //console.log(`Local Map for ${restaurant}:`, localMap.local_map);
      return localMap.gps_coordinates;
      }));
      const musicResults = await Promise.all(rest3.map(async (restaurant) => {
        
      const json = await getJson({
        engine: "google_local",
          q:restaurant,
          location: `${city}, ${region}, ${country_name}`,
          api_key: "3b9adf610919e7fac27d7c049d65207885f187f7f442ab71f94eddf1883ce159"
      });
      const localMap = json.local_results[0];
      //console.log(`Local Map for ${restaurant}:`, localMap.local_map);
      return localMap.gps_coordinates;
      }));

      const name1 = name.slice(0, 3)
      const name2 = name.slice(3, 6)
      const name3 = name.slice(6, 9)
      console.log("name1",name1)
      console.log("name2",name2)
      console.log("name3", name3)

      const restaurantsAndNames = [];

      // Loop through both arrays simultaneously
      for (let i = 0; i < name1.length; i++) {
        // Construct an object with the name as the key and the corresponding restaurant as the value
        const restaurantObj = {
          [name1[i]]: restaurantResults[i] // Assuming both arrays have corresponding elements at the same index
        };
        // Push the object to the new array
        restaurantsAndNames.push(restaurantObj);
      }
      console.log(restaurantsAndNames);
      const sportAndNames = [];

      // Loop through both arrays simultaneously
      for (let i = 0; i < name2.length; i++) {
        // Construct an object with the name as the key and the corresponding restaurant as the value
        const restaurantObj = {
          [name2[i]]: sportResults[i] // Assuming both arrays have corresponding elements at the same index
        };
        // Push the object to the new array
        sportAndNames.push(restaurantObj);
      }


      console.log(sportAndNames);
      const musicAndNames = [];

      // Loop through both arrays simultaneously
      for (let i = 0; i < name3.length; i++) {
        // Construct an object with the name as the key and the corresponding restaurant as the value
        const restaurantObj = {
          [name3[i]]: musicResults[i] // Assuming both arrays have corresponding elements at the same index
        };
        musicAndNames.push(restaurantObj);
      }

      console.log(musicAndNames);

      

      const locationTime1 = await Promise.all(restaurantsAndNames.map(async (restaurantObj) => {
        const restaurantName = Object.keys(restaurantObj)[0];
        console.log(restaurantName)
        const restaurantResult = restaurantObj[restaurantName]; // Extract the corresponding restaurant result
        const longi = restaurantResult.longitude
        const lat = restaurantResult.latitude
        console.log(longi)
        console.log(lat)
        const json = await getJson({
          engine: "google_maps",
          q:"restaurantName", // Use the restaurant result instead of the object itself
          ll: `@${longi},${lat}, 15.1z`,
          type: "search",
          api_key: "3b9adf610919e7fac27d7c049d65207885f187f7f442ab71f94eddf1883ce159" // Replace "YOUR_API_KEY_HERE" with your actual API key // Replace "YOUR_API_KEY_HERE" with your actual API key
        });
        return {
          restaurantName:restaurantName,
          openHours: json.local_results[0].hours // Assuming you want to return the hours data
        }
      }));
      

      const locationTime2 = await Promise.all(sportAndNames.map(async (restaurantObj) => {
        const restaurantName = Object.keys(restaurantObj)[0];
        console.log(restaurantName)
        const restaurantResult = restaurantObj[restaurantName]; // Extract the corresponding restaurant result
        const longi = restaurantResult.longitude
        const lat = restaurantResult.latitude
        console.log(longi)
        console.log(lat)
        const json = await getJson({
          engine: "google_maps",
          q:"restaurantName", // Use the restaurant result instead of the object itself
          ll: `@${longi},${lat}, 15.1z`,
          type: "search",
          api_key: "3b9adf610919e7fac27d7c049d65207885f187f7f442ab71f94eddf1883ce159" // Replace "YOUR_API_KEY_HERE" with your actual API key
        });
        return {
          restaurantName:restaurantName,
          openHours: json.local_results[0].hours // Assuming you want to return the hours data
        }
      }));


      const locationTime3 = await Promise.all(musicAndNames.map(async (restaurantObj) => {
        const restaurantName = Object.keys(restaurantObj)[0];
        console.log(restaurantName)
        const restaurantResult = restaurantObj[restaurantName]; // Extract the corresponding restaurant result
        const longi = restaurantResult.longitude
        const lat = restaurantResult.latitude
        console.log(longi)
        console.log(lat)
        const json = await getJson({
          engine: "google_maps",
          q:"restaurantName", // Use the restaurant result instead of the object itself
          ll: `@${longi},${lat}, 15.1z`,
          type: "search",
          api_key: "3b9adf610919e7fac27d7c049d65207885f187f7f442ab71f94eddf1883ce159" // Replace "YOUR_API_KEY_HERE" with your actual API key
        });
        return {
          restaurantName:restaurantName,
          openHours: json.local_results[0].hours // Assuming you want to return the hours data
        }
      }));


      console.log(locationTime1);
      console.log(locationTime2);
       console.log(locationTime3);





  // Log the hours for debugging purposes
  

      
     



      console.log("results1", restaurantResults);
      console.log("results1", sportResults);
      console.log("results1", musicResults);
      return { messageContent: message.content ,restaurantResults:restaurantResults,sportResults:sportResults,musicResults:musicResults,locationTime1:locationTime1,locationTime2:locationTime2,locationTime3:locationTime3, userLocation:userLocation ,userWeather: userWeather};
    }
  }
  return "The maximum number of iterations has been met without a suitable answer. Please try again with a more specific input.";
}

module.exports = agent;
