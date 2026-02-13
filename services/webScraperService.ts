import { GoogleGenAI, Schema, Type } from "@google/genai";
import { saveToWordBank, WordItem } from "./storageService";
import { Difficulty } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We use the flash model. It has a massive context window and is 
// cheap/fast enough to generate hundreds of structured items in one go.
const MODEL_ID = "gemini-3-flash-preview";

/**
 * Scrapes a large batch of words for a category in a single API call.
 * Optimizes for API efficiency by fetching ~300 words at once (equivalent to 10+ standard game generations).
 */
export const scrapeCategoryWords = async (
    category: string, 
    onProgress?: (msg: string) => void
): Promise<number> => {
    
    // MAX EFFICIENCY: Fetch enough words to populate ALL difficulty buckets in one shot.
    // 300 words is a safe upper limit for a single JSON response without truncation issues.
    const BATCH_SIZE = 300;

    onProgress?.(`Initializing Deep Web Scan for ${category}...`);

    const prompt = `
        Role: High-Performance Data Scraper / Encyclopedic Aggregator.
        Target: "${category}" (Pop Culture & General Knowledge).
        Objective: Generate a massive dataset of exactly ${BATCH_SIZE} unique crossword answers and clues.
        
        Strategy:
        1. Simulate a scrape of top wikis, fan databases, and authoritative lists for ${category}.
        2. DIVERSITY IS KEY:
           - Include 30% Short words (3-5 letters) for 'Easy' grids.
           - Include 40% Medium words (6-9 letters) for 'Medium' grids.
           - Include 30% Long words (10-15 letters) for 'Hard/Expert' grids.
        3. CONTENT MIX:
           - Famous Names (Actors, Characters, Artists).
           - Titles (Movies, Songs, Shows).
           - Terminology/Slang/Jargon specific to ${category}.
           - Deep Cuts/Trivia for experts.
        
        Constraints:
        - Output strictly valid JSON.
        - Answers must be uppercase, alphanumeric only (remove spaces/punctuation).
        - Clues must be punchy and direct (max 6 words).
        - NO DUPLICATES within the list.
        
        Output Schema:
        Array of Objects: { "answer": string, "clue": string }
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
        onProgress?.(`Aggregating data points (~${BATCH_SIZE} items)...`);
        
        // We use googleSearch to ground the data, ensuring it's not just hallucinations.
        // The model will synthesize search results + internal knowledge to hit the high count.
        const response = await ai.models.generateContent({
            model: MODEL_ID,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }], // Use search for accuracy
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.7 // Higher temp for variety since we want a huge list
            }
        });

        onProgress?.("Processing & Indexing data...");

        let cleanText = response.text || "[]";
        cleanText = cleanText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let data: any[] = [];
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error", e);
            // Fallback: try to recover partial JSON if possible, or just fail
            throw new Error("Failed to parse scraped data.");
        }

        if (!Array.isArray(data)) throw new Error("Invalid format returned.");

        // Validate and Normalize
        const validWords: WordItem[] = data
            .filter(i => i.answer && i.clue)
            .map(i => ({
                answer: i.answer.trim().toUpperCase().replace(/[^A-Z]/g, ''),
                clue: i.clue.trim()
            }))
            .filter(i => i.answer.length >= 3 && i.answer.length <= 15);

        if (validWords.length === 0) {
            throw new Error("Scraper returned 0 valid words.");
        }

        // SMART DISTRIBUTION:
        // Instead of making separate calls for Easy/Hard, we distribute this 
        // massive master list to ALL buckets. The game engine filters by length 
        // at runtime, so 'Hard' mode will just ignore the 3-letter words we save here.
        // This dramatically reduces API usage (1 call = 4 difficulty packs).
        
        onProgress?.(`Caching ${validWords.length} words to all difficulty banks...`);
        
        const difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert'];
        difficulties.forEach(diff => {
            saveToWordBank(category, diff, validWords);
        });

        return validWords.length;

    } catch (e: any) {
        // Handle Quota Limits specifically
        const errStr = JSON.stringify(e);
        if (errStr.includes("429") || e.status === 429 || e.message?.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED")) {
             throw new Error("QUOTA_EXCEEDED");
        }
        
        console.error("Scraping Failed", e);
        throw e;
    }
};