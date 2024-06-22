const { OpenAI } = require("openai");
const axios = require("axios");

// Configure OpenAI API
const openai = new OpenAI({
  apiKey: "", // Replace with your actual API key
  dangerouslyAllowBrowser: true,
});

// Function to generate reply based on post data
const generateReply = async (postData) => {
    try {
        // Construct prompt from post data
        const prompt = `
            Title: ${postData.title}
            Author: ${postData.author}
            Date: ${postData.date}
            Category: ${postData.category}
            
            Content:
            ${postData.content}
            
            Comments:
            ${postData.comment.map((c) => `- ${c}`).join("\n")}
            
            Your prompt:
            As a response to the blog post titled "${postData.title}" by ${postData.author}, published on ${postData.date}, under the category of ${postData.category}, which discusses ${postData.content}, and has received comments such as "${postData.comment.join(", ")}", what are your thoughts on this topic?
        `;
        const messages = [
  {
    role: "system",
    content: `You are a helpful assistant. use ${prompt} as an input and analyse and give maximum 4 words reply for this post.`,
  },
];

        // Call OpenAI API to generate completion
        const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo-16k",
      messages: messages,
    });

        // Extract and return reply from response
        const reply = response.choices[0].message.content;
        return reply;
    } catch (error) {
        throw new Error("Error generating reply from OpenAI: " + error.message);
    }
};

// Sample post data


// Usage example
const main = async () => {
    try {
        const reply = await generateReply(postData);
        console.log("Generated Reply:", reply);
    } catch (error) {
        console.error(error.message);
    }
};

module.exports = { generateReply };
