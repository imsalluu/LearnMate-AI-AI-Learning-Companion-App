import { describe, it, expect } from 'vitest';
import { ToolRegistry } from '../src/modules/tools/tool.registry';

describe('Validated Backend Tool Calling', () => {
  const context = { userId: 'tool_test_user_1' };

  it('should have all 13 required tools registered', () => {
    const tools = ToolRegistry.getAllTools();
    expect(tools.length).toBeGreaterThanOrEqual(13);

    const toolNames = tools.map((t) => t.name);
    expect(toolNames).toContain('search_materials');
    expect(toolNames).toContain('get_document');
    expect(toolNames).toContain('get_topic');
    expect(toolNames).toContain('generate_quiz');
    expect(toolNames).toContain('generate_flashcards');
    expect(toolNames).toContain('get_student_progress');
    expect(toolNames).toContain('get_weak_topics');
    expect(toolNames).toContain('get_study_plan');
    expect(toolNames).toContain('update_study_plan');
    expect(toolNames).toContain('save_learning_session');
    expect(toolNames).toContain('get_flashcards');
    expect(toolNames).toContain('record_quiz_result');
    expect(toolNames).toContain('calculate_learning_score');
  });

  it('should execute search_materials tool safely', async () => {
    const res = await ToolRegistry.executeTool('search_materials', { query: 'relational database' }, context);
    expect(res).toBeDefined();
    expect(res.citations).toBeDefined();
  });

  it('should execute generate_quiz tool and return structured questions', async () => {
    const res = await ToolRegistry.executeTool('generate_quiz', { topic: 'Normalization', numQuestions: 3 }, context);
    expect(res).toBeDefined();
    expect(res.length).toBe(3);
  });

  it('should execute update_study_plan tool safely', async () => {
    const res = await ToolRegistry.executeTool(
      'update_study_plan',
      { dayNumber: 3, newTopic: 'Advanced SQL Query Optimization' },
      context
    );
    expect(res.success).toBe(true);
    expect(res.message).toContain('Day 3');
  });
});
