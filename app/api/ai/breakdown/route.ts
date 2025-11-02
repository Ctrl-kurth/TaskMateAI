import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskTitle, taskDescription } = body;

    if (!taskTitle) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return mock data if no API key is configured
      return NextResponse.json({
        subtasks: [
          {
            title: 'Research and Planning',
            description: 'Gather requirements and create initial plan',
          },
          {
            title: 'Implementation',
            description: 'Build the core functionality',
          },
          {
            title: 'Testing and Review',
            description: 'Test the implementation and review results',
          },
        ],
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `Break down the following task into 3-5 actionable subtasks:

Task: ${taskTitle}
${taskDescription ? `Description: ${taskDescription}` : ''}

Provide the breakdown as a JSON array of objects with 'title' and 'description' fields. Keep each subtask concise and actionable.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that breaks down tasks into smaller, actionable subtasks. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const subtasks = JSON.parse(content);

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error('Error generating task breakdown:', error);
    
    // Return fallback subtasks on error
    return NextResponse.json({
      subtasks: [
        {
          title: 'Plan and Research',
          description: 'Research requirements and create a plan',
        },
        {
          title: 'Execute Main Tasks',
          description: 'Complete the primary objectives',
        },
        {
          title: 'Review and Finalize',
          description: 'Review work and finalize deliverables',
        },
      ],
    });
  }
}
