
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyD2XzwhQH1baDJE-lc1MT-jUYWPf1sfLTU";
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        console.log("Listing models...");
        // There isn't a direct listModels on genAI instance in the node SDK easily exposed like this in some versions, 
        // but let's try a different model name that is definitely standard first to save time 
        // or try to find the right method if I recall correctly it's on a manager.
        // Actually, for this SDK version, let's just try multiple known model names.

        const models = ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-flash-8b", "gemini-pro", "gemini-1.0-pro"];

        for (const modelName of models) {
            console.log(`Testing ${modelName}...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Test");
                const response = await result.response;
                console.log(`SUCCESS: ${modelName} is working.`);
                return; // Found one!
            } catch (e) {
                console.log(`FAILED: ${modelName} - ${e.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error("Critical failure:", error);
    }
}

run();
