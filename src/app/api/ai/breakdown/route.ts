import { NextRequest, NextResponse } from 'next/server';

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
    
    const systemPrompt = `You are an expert task decomposition assistant. Your goal is to help a user break down a large, complex task into a logical, sequential list of smaller, actionable sub-tasks.

Your Instructions:

1. Analyze Domain: First, silently analyze the task to determine its domain. Is this related to:
   * Software Development?
   * Academics / Studying?
   * Content Creation / Marketing?
   * Household Chores?
   * Personal Finance?
   * Another domain?

2. Generate Sub-Tasks: Based on the specific domain you identified, generate a list of 3-8 concrete, actionable sub-tasks.
   * The tasks must be in a logical, sequential order.
   * Each sub-task must start with an action verb (e.g., "Review," "Implement," "Write," "Clean," "Define," "Practice").

3. Format Output: You MUST return the response as a single, valid JSON array of strings.
   * DO NOT include any pre-amble, explanation, conversational text, or markdown formatting.
   * Your entire response must be only the JSON array.

Example output format:
["Review course syllabus and exam topics", "Create summary notes for each chapter", "Practice 10 problems from each section", "Review previous exam papers", "Test yourself with mock exam", "Identify weak areas and review again"]`;

    const userPrompt = `User's Task: ${mainTask}`;

    // Google Gemini 2.0 Flash API integration
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBI0ENCW_T4wvM8CohPvOvt_dLAK5Jgz3E';
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
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
            temperature: 0.7,
            maxOutputTokens: 500,
            topP: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // If quota exceeded (429), use mock fallback
      if (response.status === 429) {
        console.log('Gemini API quota exceeded, using fallback mock implementation');
        const subTasks = await generateMockSubTasks(mainTask);
        return NextResponse.json({ 
          subTasks,
          usingFallback: true,
          message: 'Using fallback due to API quota limit. Please try again in a few minutes for AI-powered results.'
        });
      }
      
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON array from AI response
    let subTasks: string[];
    try {
      subTasks = JSON.parse(aiResponse.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      // Fallback: try to extract JSON array from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        subTasks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid AI response format');
      }
    }
    
    if (!Array.isArray(subTasks) || subTasks.length === 0) {
      throw new Error('Invalid AI response format');
    }

    return NextResponse.json({ subTasks });

  } catch (error) {
    console.error('AI Breakdown error:', error);
    
    // Fallback to mock implementation on any error
    try {
      const { mainTask } = await req.json();
      if (mainTask) {
        const subTasks = await generateMockSubTasks(mainTask);
        return NextResponse.json({ 
          subTasks,
          usingFallback: true,
          message: 'Using fallback implementation. AI service temporarily unavailable.'
        });
      }
    } catch (fallbackError) {
      // If fallback also fails, return error
    }
    
    return NextResponse.json(
      { error: 'Failed to generate task breakdown' },
      { status: 500 }
    );
  }
}

// Mock function - replace with actual AI API call
async function generateMockSubTasks(mainTask: string): Promise<string[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Domain-aware keyword-based mock responses
  const taskLower = mainTask.toLowerCase();

  // ACADEMICS / STUDYING
  if (taskLower.includes('exam') || taskLower.includes('study') || taskLower.includes('review') || 
      taskLower.includes('midterm') || taskLower.includes('final') || taskLower.includes('course') ||
      taskLower.includes('learn') || taskLower.includes('dsa') || taskLower.includes('algorithm')) {
    return [
      "Review course syllabus and identify key topics",
      "Create comprehensive summary notes for each chapter",
      "Practice solving example problems from lectures",
      "Complete practice problems from textbook",
      "Review and understand previous exam questions",
      "Create flashcards for important concepts",
      "Take timed practice tests",
      "Identify weak areas and focus review sessions"
    ];
  }

  // SOFTWARE DEVELOPMENT - Authentication
  if (taskLower.includes('auth') || taskLower.includes('login') || taskLower.includes('user')) {
    return [
      "Define authentication requirements and security standards",
      "Design database schema for user accounts and sessions",
      "Implement user registration with input validation",
      "Create login functionality with JWT token generation",
      "Build password hashing and secure storage system",
      "Develop email verification workflow",
      "Add password reset functionality with secure tokens",
      "Write comprehensive unit and integration tests"
    ];
  }

  // SOFTWARE DEVELOPMENT - API/Backend
  if (taskLower.includes('api') || taskLower.includes('backend') || taskLower.includes('server')) {
    return [
      "Define API endpoints and route structure",
      "Set up database models and schemas",
      "Implement CRUD operations for main entities",
      "Add authentication and authorization middleware",
      "Create input validation and error handling",
      "Write API documentation with examples",
      "Add rate limiting and security measures",
      "Deploy API to production environment"
    ];
  }

  // SOFTWARE DEVELOPMENT - UI/Frontend
  if (taskLower.includes('ui') || taskLower.includes('frontend') || taskLower.includes('design') || taskLower.includes('dashboard')) {
    return [
      "Create wireframes and design mockups",
      "Set up component library and styling system",
      "Build reusable UI components",
      "Implement responsive layouts for mobile and desktop",
      "Add form validation and error states",
      "Integrate with backend API endpoints",
      "Test across different browsers and devices",
      "Optimize performance and accessibility"
    ];
  }

  // CONTENT CREATION / MARKETING
  if (taskLower.includes('content') || taskLower.includes('blog') || taskLower.includes('marketing') ||
      taskLower.includes('social') || taskLower.includes('campaign') || taskLower.includes('write')) {
    return [
      "Research target audience and content goals",
      "Brainstorm topics and create content calendar",
      "Write initial draft with key messages",
      "Create visuals and supporting media",
      "Edit and refine content for clarity",
      "Optimize for SEO and engagement",
      "Schedule posts across platforms",
      "Monitor analytics and adjust strategy"
    ];
  }

  // HOUSEHOLD / CLEANING
  if (taskLower.includes('clean') || taskLower.includes('organize') || taskLower.includes('room') ||
      taskLower.includes('house') || taskLower.includes('kitchen') || taskLower.includes('laundry')) {
    return [
      "Gather all cleaning supplies and materials",
      "Declutter and remove unnecessary items",
      "Dust all surfaces from top to bottom",
      "Vacuum or sweep all floors",
      "Clean windows and mirrors",
      "Organize items into proper storage",
      "Dispose of trash and recyclables",
      "Verify everything is clean and in place"
    ];
  }

  // PERSONAL FINANCE
  if (taskLower.includes('budget') || taskLower.includes('finance') || taskLower.includes('money') ||
      taskLower.includes('savings') || taskLower.includes('investment')) {
    return [
      "Review current income and expenses",
      "Track spending for at least one month",
      "Categorize expenses into fixed and variable",
      "Identify areas for potential savings",
      "Create monthly budget with targets",
      "Set up automatic savings transfers",
      "Research investment options if applicable",
      "Review and adjust budget monthly"
    ];
  }

  // Generic breakdown for any other task
  return [
    "Define clear goals and success criteria",
    "Research and gather necessary information",
    "Create detailed action plan with timeline",
    "Identify required resources and tools",
    "Execute first phase of the plan",
    "Review progress and adjust approach",
    "Complete remaining tasks systematically",
    "Verify completion and document results"
  ];
}
