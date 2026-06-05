# 18 AI Prompt

## Objective
Standardize AI prompts used for wood quality analysis and ensure consistent outputs.

## Inputs

Images:

- Log Size Image
- Moisture Image
- License Plate Image

Metadata:

- Receipt ID
- Supplier ID
- Timestamp
- Operator

## AI Tasks

1. Detect diameter class.
2. Estimate quality grade.
3. Read moisture values.
4. Extract license plate text.
5. Generate reasoning.
6. Produce normalized JSON output.

## Output Structure

Required fields:

- diameter_class
- grade
- moisture
- license_plate
- confidence
- warnings
- reasoning

## Prompt Rules

- Use deterministic wording.
- Request structured JSON only.
- Avoid free-text paragraphs.
- Include confidence scores.
- Flag uncertain results.
- Preserve original values.

## Error Handling

If confidence is low:

- Return warning messages.
- Require human review.
- Do not overwrite manual results.

## Security

- Do not expose API keys.
- Do not store secrets in prompts.
- Log AI requests and responses.
- Keep raw AI output for auditing.

## Future

- Multi-model support
- Prompt versioning
- A/B testing
- Fine-tuning
- AI quality score monitoring
