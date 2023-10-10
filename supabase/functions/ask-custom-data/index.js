import { serve } from 'https://deno.land/std@0.170.0/http/server.ts' 
import 'https://deno.land/x/xhr@0.2.1/mod.ts'
import { createClient } from '@supabase/supabase-js'
import GPT3Tokenizer from 'gpt3-tokenizer';
import { OpenAI } from "openai";
import { stripIndent, oneLine } from 'common-tags';
import 'dotenv/config';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

export const supabaseClient = createClient("https://ryvdxsistudfrddmabbx.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5dmR4c2lzdHVkZnJkZG1hYmJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY4NTk5NjMsImV4cCI6MjAxMjQzNTk2M30.oL-NCL26fXomkNK93MIiry8Q2xn3ImY_FQOf8vEdPEQ");

serve(async (req) => {
  // ask-custom-data logic
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Search query is passed in request payload
  const { query } = await req.json()

  const input = query.replace(/\n/g, ' ')
  console.log(input);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Generate a one-time embedding for the query itself
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input,
  })

  const [{ embedding }] = embeddingResponse.data.data

  const { data: documents, error } = await supabaseClient.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: .73, 
    match_count: 10, 
  })
  
  if (error) throw error

  const tokenizer = new GPT3Tokenizer({ type: 'gpt3' })
  let tokenCount = 0
  let contextText = ''

  for (let i = 0; i < documents.length; i++) {
    const document = documents[i]
    const content = document.content
    const encoded = tokenizer.encode(content)
    tokenCount += encoded.text.length

    if (tokenCount > 1500) {
      break
    }

    contextText += `${content.trim()}---\n`
  }

  const prompt = stripIndent`${oneLine`
    food`}
    Context sections:
    ${contextText}
    Question: """
    ${query}
    """
    Answer as simple text:
  `

  const completionResponse = await openai.completions.create({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 512, 
    temperature: 0, 
  })

  const {
    id,
    choices: [{ text }],
  } = completionResponse.data

  return new Response(JSON.stringify({ id, text }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})