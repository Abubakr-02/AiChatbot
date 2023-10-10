import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import 'dotenv/config'
require('dotenv').config()

// Initialise Supabase Client
const supabaseClient = createClient('https://ryvdxsistudfrddmabbx.supabase.co' , 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dmR4c2lzdHVkZnJkZG1hYmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY4NTk5NjMsImV4cCI6MjAxMjQzNTk2M30.oL-NCL26fXomkNK93MIiry8Q2xn3ImY_FQOf8vEdPEQ');
//generateEmbeddings
async function generateEmbeddings() {
//Initialise OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//Create some temporary hardcoded custom data
const documents = [
    '5524 - 1957 - Graduation - Single - 58138',
    '2174 - 1954 - Graduation - Single - 46344',
    '4141 - 1965 - Graduation - Together - 71613'
];

for (const document of documents) {
    const input = document.replace(/\n/g, '');

    //Turn string into embedding
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input
    });

    const [{ embedding }] = embeddingResponse.data.data;

    //Store embedding into DB
    await supabaseClient.from('documents').insert({
        content: document,
        embedding
    });
}
}


async function askQuestion() {
    const {data} = await supabaseClient.functions.invoke('ask-custom-data', {
        body: JSON.stringify({ query: 'What is the number of small children in household?' })
    });
    console.log(data);
}

askQuestion();
