import type { Tool } from './interfaces';

// Tool definitions
export const factorialTool: Tool = {
  type: 'function',
  function: {
    name: 'calculate_factorial',
    description: 'Calculate the factorial of a number (n!). Only works for integers from 0 to 10.',
    parameters: {
      type: 'object',
      properties: {
        n: {
          type: 'integer',
          description: 'The number to calculate factorial for (0-10)',
          minimum: 0,
          maximum: 10
        }
      },
      required: ['n']
    }
  }
};

// Tool implementations
export function calculateFactorial(n: number): number {
  if (n < 0 || n > 10) {
    throw new Error('Factorial calculation only supported for numbers 0-10');
  }

  if (n === 0 || n === 1) {
    return 1;
  }

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

// Execute tool calls
export function executeTool(toolCall: any): any {
  const { name, arguments: args } = toolCall.function;

  switch (name) {
    case 'calculate_factorial':
      const { n } = JSON.parse(args);
      return calculateFactorial(n);

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// Available tools list
export const availableTools: Tool[] = [factorialTool];

// Tool descriptions for AI
export function getToolDescriptions(): string {
  return availableTools.map(tool =>
    `- ${tool.function.name}: ${tool.function.description}`
  ).join('\n');
}