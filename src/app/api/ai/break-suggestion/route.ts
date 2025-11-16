import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { task, completedPomodoros } = await req.json();

    if (!task || typeof task !== 'object') {
      return NextResponse.json(
        { error: 'Task object is required' },
        { status: 400 }
      );
    }

    // Analyze task complexity
    const complexity = analyzeTaskComplexity(task);
    
    // Generate break suggestion
    const suggestion = generateBreakSuggestion(complexity, completedPomodoros || 0);

    return NextResponse.json({
      suggestion,
      complexity,
    });

  } catch (error) {
    console.error('Break suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to generate break suggestion' },
      { status: 500 }
    );
  }
}

function analyzeTaskComplexity(task: any): 'low' | 'medium' | 'high' {
  let complexityScore = 0;

  // Factor 1: Priority (30% weight)
  if (task.priority === 'high') complexityScore += 30;
  else if (task.priority === 'medium') complexityScore += 20;
  else complexityScore += 10;

  // Factor 2: Description length (20% weight)
  const descriptionLength = (task.description || '').length;
  if (descriptionLength > 200) complexityScore += 20;
  else if (descriptionLength > 100) complexityScore += 15;
  else if (descriptionLength > 50) complexityScore += 10;
  else complexityScore += 5;

  // Factor 3: Estimated time (25% weight)
  const estimatedMinutes = task.estimatedMinutes || 0;
  if (estimatedMinutes > 120) complexityScore += 25;
  else if (estimatedMinutes > 60) complexityScore += 20;
  else if (estimatedMinutes > 30) complexityScore += 15;
  else complexityScore += 10;

  // Factor 4: Keywords indicating complexity (25% weight)
  const complexKeywords = [
    'research', 'analyze', 'design', 'architect', 'develop', 'implement',
    'refactor', 'optimize', 'debug', 'complex', 'advanced', 'difficult',
    'challenging', 'technical', 'algorithm', 'integration', 'system'
  ];
  
  const titleAndDesc = `${task.title} ${task.description || ''}`.toLowerCase();
  const keywordMatches = complexKeywords.filter(keyword => 
    titleAndDesc.includes(keyword)
  ).length;

  if (keywordMatches >= 3) complexityScore += 25;
  else if (keywordMatches >= 2) complexityScore += 20;
  else if (keywordMatches >= 1) complexityScore += 15;
  else complexityScore += 10;

  // Determine complexity level
  if (complexityScore >= 75) return 'high';
  if (complexityScore >= 50) return 'medium';
  return 'low';
}

function generateBreakSuggestion(
  complexity: 'low' | 'medium' | 'high',
  completedPomodoros: number
): {
  breakType: 'short' | 'long' | 'extend';
  duration: number;
  message: string;
  tips: string[];
} {
  const isLongBreakTime = (completedPomodoros + 1) % 4 === 0;

  // High complexity tasks
  if (complexity === 'high') {
    if (isLongBreakTime) {
      return {
        breakType: 'long',
        duration: 20,
        message: 'Take a 20-minute break. Complex tasks require more mental recovery.',
        tips: [
          '🧘 Do some stretching or light exercise',
          '🌳 Step outside for fresh air',
          '💧 Hydrate and have a healthy snack',
          '🎵 Listen to relaxing music',
          '🚫 Avoid screens completely'
        ]
      };
    } else {
      return {
        breakType: 'short',
        duration: 7,
        message: 'Take a 7-minute break. Your mind needs extra recovery for this complex task.',
        tips: [
          '👀 Rest your eyes - look at distant objects',
          '🚶 Take a short walk around',
          '💧 Drink water',
          '🧘 Do some deep breathing exercises'
        ]
      };
    }
  }

  // Medium complexity tasks
  if (complexity === 'medium') {
    if (isLongBreakTime) {
      return {
        breakType: 'long',
        duration: 15,
        message: 'Time for a 15-minute break. You\'ve earned it!',
        tips: [
          '🚶 Go for a short walk',
          '☕ Make yourself a coffee or tea',
          '💬 Chat with a colleague or friend',
          '📱 Check messages (but avoid work)',
          '🎮 Play a quick game or puzzle'
        ]
      };
    } else {
      return {
        breakType: 'short',
        duration: 5,
        message: 'Take a 5-minute break to recharge.',
        tips: [
          '🪟 Look out the window',
          '🤸 Do some quick stretches',
          '💧 Grab some water',
          '😊 Take a few deep breaths'
        ]
      };
    }
  }

  // Low complexity tasks
  if (isLongBreakTime) {
    return {
      breakType: 'extend',
      duration: 15,
      message: 'Since this task is straightforward, feel free to take a 15-minute break.',
      tips: [
        '✅ You\'re making great progress!',
        '🎯 Review what you\'ve accomplished',
        '☕ Enjoy a beverage',
        '📝 Plan your next steps',
        '🌟 Celebrate small wins'
      ]
    };
  } else {
    return {
      breakType: 'short',
      duration: 5,
      message: 'Quick 5-minute break. You\'re on a roll!',
      tips: [
        '👍 Great momentum!',
        '💧 Stay hydrated',
        '👀 Rest your eyes briefly',
        '🎵 Listen to an energizing song'
      ]
    };
  }
}
