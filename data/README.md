# Relationship Data

## Canonical Seed

- `greco_relationships_hydrated.csv` is the canonical app-import seed.
- `greco_relationships_hydrated.xlsx` is the human-review workbook.

The data is designed for Greco Continuity OS, not for automated mass outreach.

## Operating Rules

- Treat public channel data as a routing surface, not permission to contact.
- Re-verify Tier 1 routes before outreach.
- Use `warm_path_needed` to prevent cold outreach to high-sensitivity targets.
- Use `best_first_channel`, `first_move`, and `risk_note` before drafting.
- Human approval remains required for all Tier 1 messages.

## Regeneration

From the repo root:

```bash
python3 tools/build_relationship_hydration.py
```

Then export the workbook:

```bash
python tools/export_relationship_workbook.py
```

The workbook exporter uses `openpyxl`; the CSV is the database-ready source of truth.
