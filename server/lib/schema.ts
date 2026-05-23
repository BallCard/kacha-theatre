import Ajv from 'ajv';
import { POSE_TYPES } from './types.js';
import { TIERS } from './tier.js';

const ajv = new Ajv({ allErrors: true });

const schema = {
  type: 'object',
  required: [
    'pose_type', 'desk_objects', 'moyu_score', 'level_tier',
    'title_candidates', 'report', 'face_boxes',
  ],
  additionalProperties: true,
  properties: {
    pose_type: { type: 'string', enum: [...POSE_TYPES] },
    desk_objects: {
      type: 'array', minItems: 0, maxItems: 5,
      items: { type: 'string', minLength: 1, maxLength: 30 },
    },
    moyu_score: { type: 'integer', minimum: 0, maximum: 100 },
    level_tier: { type: 'string', enum: [...TIERS] },
    title_candidates: {
      type: 'array', minItems: 3, maxItems: 3,
      items: { type: 'string', minLength: 2, maxLength: 8 },
    },
    report: {
      type: 'object',
      required: ['paragraph', 'yi', 'ji'],
      properties: {
        paragraph: { type: 'string', minLength: 30, maxLength: 120 },
        yi: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string', minLength: 1, maxLength: 6 } },
        ji: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string', minLength: 1, maxLength: 6 } },
      },
    },
    face_boxes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['x', 'y', 'w', 'h'],
        properties: {
          x: { type: 'number', minimum: 0, maximum: 1 },
          y: { type: 'number', minimum: 0, maximum: 1 },
          w: { type: 'number', minimum: 0, maximum: 1 },
          h: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
} as const;

const validate = ajv.compile(schema);

export interface ValidationResult {
  ok: boolean;
  errors?: string[];
}

export function validateAnalyzeResult(data: unknown): ValidationResult {
  const ok = validate(data);
  if (ok) return { ok: true };
  return {
    ok: false,
    errors: (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`),
  };
}
