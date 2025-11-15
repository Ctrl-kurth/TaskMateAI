import { NextRequest, NextResponse } from 'next/server';

// Gemini models to try in order (from best to fallback)
const GEMINI_MODELS = [
  'gemini-2.5-flash',           // Latest stable (June 2025) - Fast and versatile
  'gemini-2.5-pro',              // Latest stable Pro - Most capable
  'gemini-2.0-flash',            // Stable 2.0 Flash
  'gemini-flash-latest',         // Always points to latest Flash
  'gemini-pro-latest',           // Always points to latest Pro
];

// Try each model until one works
async function tryGeminiModels(systemPrompt: string, userPrompt: string, geminiApiKey: string) {
  const errors: { model: string; error: string }[] = [];
  
  for (const model of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${model}`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: userPrompt }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.8,
              maxOutputTokens: 2000,  // Increased to allow complete responses
              topP: 0.95,
              topK: 40,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE"
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE"
              }
            ]
          }),
        }
      );

      // If quota exceeded (429), try next model
      if (response.status === 429) {
        const errorText = await response.text();
        console.log(`${model} quota exceeded, trying next model...`);
        errors.push({ model, error: 'Quota exceeded' });
        continue;
      }

      // If other error, log and try next
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`${model} error:`, errorText);
        errors.push({ model, error: response.statusText });
        continue;
      }

      // Success! Return the response data
      const data = await response.json();
      console.log(`✅ Successfully used model: ${model}`);
      return { success: true, data, model };
      
    } catch (error) {
      console.error(`Error with ${model}:`, error);
      errors.push({ 
        model, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      continue;
    }
  }
  
  // All models failed
  return { 
    success: false, 
    errors,
    message: 'All Gemini models are currently rate-limited or unavailable' 
  };
}

// Intelligent fallback breakdown generator
function generateBasicBreakdown(mainTask: string): string[] {
  const taskLower = mainTask.toLowerCase();
  
  // Extract key action words to understand task nature
  const isStudy = /study|exam|learn|review|course|homework|assignment|test|quiz/i.test(mainTask);
  const isDev = /build|develop|code|program|implement|create|design|app|website|software|api/i.test(mainTask);
  const isWriting = /write|blog|article|content|essay|paper|report|document/i.test(mainTask);
  const isResearch = /research|analyze|investigate|explore|study|survey/i.test(mainTask);
  const isOrganize = /organize|plan|clean|arrange|sort|manage/i.test(mainTask);
  
  // Return domain-appropriate generic steps
  if (isStudy) {
    return [
      "Identify key topics and learning objectives",
      "Gather study materials and resources",
      "Create organized notes and summaries",
      "Practice with examples and exercises",
      "Review and test your understanding",
      "Focus on weak areas and reinforce learning"
    ];
  }
  
  if (isDev) {
    return [
      "Define requirements and scope",
      "Research existing solutions and best practices",
      "Design architecture and plan implementation",
      "Set up development environment",
      "Implement core functionality step by step",
      "Test thoroughly and fix bugs",
      "Optimize and finalize"
    ];
  }
  
  if (isWriting) {
    return [
      "Research topic and gather information",
      "Create outline and structure",
      "Write first draft without editing",
      "Review and revise content",
      "Edit for clarity and grammar",
      "Finalize and format properly"
    ];
  }
  
  if (isResearch) {
    return [
      "Define research question or objective",
      "Identify reliable sources and references",
      "Collect and organize information",
      "Analyze findings and identify patterns",
      "Synthesize conclusions",
      "Document results and insights"
    ];
  }
  
  if (isOrganize) {
    return [
      "Assess current state and identify goals",
      "Create action plan with priorities",
      "Gather necessary tools and resources",
      "Execute tasks systematically",
      "Review progress and adjust approach",
      "Verify completion and maintain results"
    ];
  }
  
  // Generic intelligent breakdown for any task
  return [
    "Clarify objectives and success criteria",
    "Break down into smaller components",
    "Research and gather necessary information",
    "Create detailed action plan",
    "Execute plan step by step",
    "Monitor progress and adjust as needed",
    "Complete and verify all requirements",
    "Review results and document learnings"
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { mainTask } = await req.json();

    if (!mainTask || typeof mainTask !== 'string' || !mainTask.trim()) {
      return NextResponse.json(
        { error: 'Main task description is required' },
        { status: 400 }
      );
    }

    // TODO: Replace this mock implementation with actual AI API call
    // Options:
    // 1. OpenAI API: https://platform.openai.com/docs/api-reference
    // 2. Anthropic Claude API: https://docs.anthropic.com/claude/reference/
    // 3. Your custom AI endpoint
    
    const systemPrompt = `You are an expert task decomposition AI assistant specializing in breaking down complex tasks into actionable steps. Your role is to analyze any task and create a comprehensive, intelligent breakdown.

CRITICAL: You MUST generate steps that are SPECIFICALLY tailored to the exact task provided. Do NOT use generic templates or placeholder steps.

ANALYSIS FRAMEWORK:
1. Deeply understand the SPECIFIC task, its unique requirements, and domain
2. Consider the actual materials, tools, skills, or knowledge needed for THIS EXACT task
3. Think about the logical sequence of actions for THIS SPECIFIC task
4. Include domain-specific terminology and details
5. Adapt the number of sub-tasks based on actual complexity (4-10 tasks)

BREAKDOWN PRINCIPLES:
- Make each sub-task HIGHLY SPECIFIC to the exact task (e.g., for "cook caldereta": "Purchase beef, potatoes, carrots, bell peppers and tomato sauce" NOT "Gather necessary tools")
- Start each sub-task with a strong action verb relevant to the domain
- Include specific details, quantities, names, or technical terms when relevant
- Ensure logical progression for THIS PARTICULAR task
- Think like an expert in the task's domain

EXAMPLES OF GOOD VS BAD:
❌ BAD (Generic): "Gather necessary materials", "Create action plan", "Execute tasks"
✅ GOOD (Specific): "Download VS Code and Node.js 18+", "Install React dependencies with npm", "Create components folder structure"

OUTPUT FORMAT:
Return ONLY a valid JSON array of strings. No explanations, no markdown, no additional text.
Each string should be 5-20 words, SPECIFIC and actionable for the EXACT task.

Now analyze the following task and create an intelligent, highly specific, context-aware breakdown:`;

    const userPrompt = `Task to break down: "${mainTask}"

Analyze this SPECIFIC task in detail. What EXACTLY needs to be done? What are the SPECIFIC steps, materials, tools, or actions needed for THIS PARTICULAR task (not generic steps)?

Generate a highly specific, actionable breakdown with concrete details relevant to "${mainTask}".`;

    // Google Gemini API integration with model fallback
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.log('No Gemini API key found, using fallback breakdown');
      return NextResponse.json({
        error: 'NO_API_KEY',
        message: 'Gemini API key not configured. Using intelligent fallback.',
        subTasks: generateBasicBreakdown(mainTask),
        usingFallback: true
      }, { status: 200 });
    }
    
    // Try multiple Gemini models
    const result = await tryGeminiModels(systemPrompt, userPrompt, geminiApiKey);
    
    if (!result.success) {
      console.log('All Gemini models failed, using fallback breakdown');
      return NextResponse.json({
        error: 'AI_MODELS_UNAVAILABLE',
        message: 'All AI models are currently rate-limited. Using intelligent fallback.',
        subTasks: generateBasicBreakdown(mainTask),
        usingFallback: true,
        attemptedModels: result.errors?.map(e => e.model)
      }, { status: 200 });
    }
    
    const { data, model } = result;
    
    // Check if response was blocked or empty
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Gemini API returned no candidates:', data);
      throw new Error('AI response was blocked or empty');
    }
    
    const candidate = data.candidates[0];
    
    // Check for content filtering
    if (candidate.finishReason === 'SAFETY' || !candidate.content) {
      console.error('Content was filtered:', candidate);
      throw new Error('AI response was filtered for safety');
    }
    
    const aiResponse = candidate.content.parts[0].text;
    console.log('AI Response:', aiResponse);
    
    // Parse the JSON array from AI response with better error handling
    let subTasks: string[];
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      cleanedResponse = cleanedResponse.trim();
      
      // Try to fix incomplete JSON if needed
      if (cleanedResponse.startsWith('[') && !cleanedResponse.endsWith(']')) {
        // Find last complete item and close the array
        const lastCompleteQuote = cleanedResponse.lastIndexOf('",');
        if (lastCompleteQuote > 0) {
          cleanedResponse = cleanedResponse.substring(0, lastCompleteQuote + 1) + '\n]';
          console.log('Fixed incomplete JSON array');
        }
      }
      
      subTasks = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      
      // Fallback: try to extract JSON array from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          let extracted = jsonMatch[0];
          
          // Try to fix incomplete JSON
          if (!extracted.endsWith(']')) {
            const lastCompleteQuote = extracted.lastIndexOf('",');
            if (lastCompleteQuote > 0) {
              extracted = extracted.substring(0, lastCompleteQuote + 1) + '\n]';
            }
          }
          
          subTasks = JSON.parse(extracted);
        } catch (e) {
          console.error('Failed to parse extracted JSON:', jsonMatch[0]);
          
          // Last resort: Try to extract individual quoted strings and build array
          const stringMatches = aiResponse.match(/"([^"\\]*(\\.[^"\\]*)*)"/g);
          if (stringMatches && stringMatches.length > 0) {
            subTasks = stringMatches.map((s: string) => s.slice(1, -1)); // Remove quotes
            console.log('Extracted strings from malformed JSON:', subTasks.length, 'items');
          } else {
            throw new Error('Could not parse AI response as JSON array');
          }
        }
      } else {
        // Try to extract quoted strings directly
        const stringMatches = aiResponse.match(/"([^"\\]*(\\.[^"\\]*)*)"/g);
        if (stringMatches && stringMatches.length > 0) {
          subTasks = stringMatches.map((s: string) => s.slice(1, -1)); // Remove quotes
          console.log('Extracted strings without JSON structure:', subTasks.length, 'items');
        } else {
          console.error('No JSON array or quoted strings found in response');
          throw new Error('AI response does not contain valid task items');
        }
      }
    }
    
    // Validate the response
    if (!Array.isArray(subTasks)) {
      throw new Error('AI response is not an array');
    }
    
    if (subTasks.length === 0) {
      throw new Error('AI returned empty task list');
    }
    
    // Validate each sub-task is a non-empty string
    subTasks = subTasks.filter(task => typeof task === 'string' && task.trim().length > 0);
    
    if (subTasks.length === 0) {
      throw new Error('AI returned no valid sub-tasks');
    }

    return NextResponse.json({ 
      subTasks,
      source: 'ai',
      model: model // Include which model was used
    });

  } catch (error) {
    console.error('AI Breakdown error:', error);
    
    // Provide fallback for any error
    try {
      const body = await req.json();
      const mainTask = body.mainTask;
      
      return NextResponse.json({
        error: 'AI_SERVICE_ERROR',
        message: 'AI service temporarily unavailable. Here\'s a basic breakdown to get you started.',
        subTasks: generateBasicBreakdown(mainTask),
        usingFallback: true
      }, { status: 200 }); // Return 200 with fallback data
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          error: 'Failed to generate task breakdown',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
}


