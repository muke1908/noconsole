import { useState, useCallback } from 'react';
import type { LogMessage, LLMAnalysis } from '../types';

export function useLLM(baseUrl: string = 'http://localhost:11434') {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LLMAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (logs: LogMessage[], model: string = 'llama3') => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const logsText = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const args = log.args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        return `[${time}] [${log.type.toUpperCase()}] ${args}`;
      }).join('\n');

      const prompt = `Analyze the following application logs and provide insights in the following categories:

ERRORS: List any errors found and their potential causes
WARNINGS: List any warnings and what they might indicate
PERFORMANCE: Identify any performance-related issues
RECOMMENDATIONS: Provide actionable recommendations

Logs:
${logsText}

Please format your response with clear section headers (ERRORS:, WARNINGS:, PERFORMANCE:, RECOMMENDATIONS:) followed by bullet points.`;

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      let fullResponse = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              fullResponse += parsed.response;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      // Parse the response into categories
      const parsed = parseAnalysis(fullResponse);
      setAnalysis(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze logs');
    } finally {
      setIsAnalyzing(false);
    }
  }, [baseUrl]);

  return {
    analyze,
    isAnalyzing,
    analysis,
    error,
  };
}

function parseAnalysis(text: string): LLMAnalysis {
  const sections: LLMAnalysis = {
    errors: [],
    warnings: [],
    performance: [],
    recommendations: [],
  };

  const errorSection = extractSection(text, 'ERRORS');
  const warningSection = extractSection(text, 'WARNINGS');
  const perfSection = extractSection(text, 'PERFORMANCE');
  const recSection = extractSection(text, 'RECOMMENDATIONS');

  sections.errors = extractBulletPoints(errorSection);
  sections.warnings = extractBulletPoints(warningSection);
  sections.performance = extractBulletPoints(perfSection);
  sections.recommendations = extractBulletPoints(recSection);

  return sections;
}

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}:?\\s*([\\s\\S]*?)(?=(?:ERRORS:|WARNINGS:|PERFORMANCE:|RECOMMENDATIONS:|$))`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function extractBulletPoints(text: string): string[] {
  if (!text) return ['No issues found'];
  
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/^[-*•]\s*/, ''));
  
  return lines.length > 0 ? lines : ['No issues found'];
}
