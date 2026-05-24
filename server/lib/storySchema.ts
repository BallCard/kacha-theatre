// Part 2 LLM 输出 JSON 校验
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });

const nodeSchema = {
  type: 'object',
  required: ['narration', 'imagePrompt'],
  additionalProperties: true,
  properties: {
    narration: { type: 'string', minLength: 20, maxLength: 400 },
    characterLine: { type: 'string', maxLength: 80 },
    imagePrompt: { type: 'string', minLength: 20, maxLength: 1500 },
    choices: {
      anyOf: [
        { type: 'null' },
        {
          type: 'array',
          minItems: 3,
          maxItems: 3,
          items: {
            type: 'object',
            required: ['id', 'text'],
            properties: {
              id: { type: 'string', enum: ['A', 'B', 'C'] },
              text: { type: 'string', minLength: 4, maxLength: 60 },
            },
          },
        },
      ],
    },
    ending: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          required: ['type', 'verdict', 'aWins'],
          properties: {
            type: { type: 'string', minLength: 2, maxLength: 30 },
            verdict: { type: 'string', minLength: 20, maxLength: 400 },
            aWins: { type: 'boolean' },
          },
        },
      ],
    },
  },
} as const;

const validate = ajv.compile(nodeSchema);

export interface StoryNodeOutput {
  narration: string;
  characterLine?: string;
  imagePrompt: string;
  choices: Array<{ id: 'A' | 'B' | 'C'; text: string }> | null;
  ending: { type: string; verdict: string; aWins: boolean } | null;
}

export function validateStoryNode(
  raw: unknown,
  expectFinal: boolean,
): { ok: true; data: StoryNodeOutput } | { ok: false; errors: string[] } {
  if (!validate(raw)) {
    return {
      ok: false,
      errors: (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message}`),
    };
  }
  const v = raw as StoryNodeOutput;
  if (expectFinal) {
    if (!v.ending) return { ok: false, errors: ['终幕节点必须包含 ending 对象'] };
    if (v.choices !== null && v.choices !== undefined) {
      v.choices = null; // 自动剔除
    }
  } else {
    if (!Array.isArray(v.choices) || v.choices.length !== 3) {
      return { ok: false, errors: ['非终幕节点必须包含 3 个 choices'] };
    }
    if (v.ending) v.ending = null;
  }
  return { ok: true, data: v };
}
