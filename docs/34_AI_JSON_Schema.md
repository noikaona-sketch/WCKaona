# 34 AI JSON Schema

## Objective
Define a standard JSON structure for AI outputs.

## Required Fields

- receipt_id
- diameter_class
- grade
- moisture
- license_plate
- confidence
- warnings
- reasoning

## Rules

- JSON only.
- Preserve original values.
- Include confidence scores.
- Flag uncertain results.

## Validation

- Required fields must exist.
- Numeric values validated.
- Missing values reported.

## Security

- Store raw responses.
- Log prompt version.
- Audit manual overrides.

## Future

- Schema versioning
- Multi-model comparison
- Extended attributes
