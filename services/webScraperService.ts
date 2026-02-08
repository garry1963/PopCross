import { GoogleGenAI, Schema, Type } from "@google/genai";
import { saveToWordBank, WordItem } from "./storageService";
import { Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We use the flash model with search tools for efficient scraping
const MODEL_ID = "gemini-3-flash-preview";

export const scrapeCategoryWords = async (
    category: string, 
    onProgress?: (msg: string) => void
): Promise<number> => {
    
    // We scrape for 'Medium' difficulty as a baseline, as it fits most grids.
    // The game logic can filter these for Easy/Hard based on length later.
    const TARGET_DIFFICULTY: Difficulty = 'Medium'; 
    const BATCH_SIZE = 50;

    onProgress?.(`Initializing web scraper for ${category}...`);

    const prompt = `
        Task: Scrape the web for a crossword puzzle database about "${category}".
        
        1. Search for authoritative websites, wikis, and fan pages related to ${category}.
        2. Extract distinct terminology, names, titles, slang, and trivia answers.
        3. Create exactly ${BATCH_SIZE} unique pairings of (Answer, Clue).
        
        Constraints:
        - Answers must be single words or merged phrases (e.g., "STARWARS", "BRADPITT").
        - Uppercase answers only.
        - No special characters.
        - Length: 3 to 12 letters.
        - Clues must be short (under 6 words).
        - STRICTLY RELEVANT to ${category}.
        
        Output JSON: [{ "answer": "WORD", "clue": "Hint" }, ...]
    `;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                clue: { type: Type.STRING }
            },
            required: ["answer", "clue"]
        }
    };

    try {
        onProgress?.(`Searching authoritative sources for ${category}...`);
        
        // We use googleSearch tool to ground the generation in real web data
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.5 // Low temp for factual/accurate data
            }
        });

        onProgress?.("Parsing and sanitizing data...");

        let cleanText = response.text || "[]";
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let data: any[] = [];
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error", e);
            throw new Error("Failed to parse scraped data.");
        }

        if (!Array.isArray(data)) throw new Error("Invalid format returned.");

        const validWords: WordItem[] = data
            .filter(i => i.answer && i.clue)
            .map(i => ({
                answer: i.answer.trim().toUpperCase().replace(/[^A-Z]/g, ''),
                clue: i.clue.trim()
            }))
            .filter(i => i.answer.length >= 3 && i.answer.length <= 15);

        // Save to Local Storage
        onProgress?.(`Saving ${validWords.length} new words to local database...`);
        saveToWordBank(category, TARGET_DIFFICULTY, validWords);
        
        // Also save to Hard/Easy buckets to distribute the wealth
        // (In a real app, we might split them based on complexity, but copying works for cache)
        saveToWordBank(category, 'Hard', validWords); 
        saveToWordBank(category, 'Easy', validWords);

        return validWords.length;

    } catch (e) {
        console.error("Scraping Failed", e);
        throw e;
    }
};