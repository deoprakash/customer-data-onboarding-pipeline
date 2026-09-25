"""
LLM-based self-healing for customer schema configurations.

When the pipeline fails due to schema errors (bad date format, missing columns,
transformation errors), this module calls the Groq LLM with:
  - The actual CSV headers & sample rows
  - The current broken YAML config
  - The error messages encountered

The LLM returns a corrected config which is saved to disk, then the pipeline retries.
"""

import os
import re
import json
import yaml
import requests
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API", "").strip()
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL = "openai/gpt-oss-120b"

CANONICAL_SCHEMA = """
- customer_id   (required): unique identifier for the customer
- first_name    (required): customer's first name
- last_name     (required): customer's last name  
- email         (required): customer's email address (must match x@x.x)
- phone         (required): customer's phone number
- created_at    (required): date the customer was created (will be parsed with Python strptime)
"""


def _read_csv_sample(file_path: str, max_rows: int = 3) -> tuple[str, str]:
    """Return (headers_line, sample_rows_text) from the CSV file."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            lines = [l.rstrip("\n\r") for l in f.readlines()]
        headers = lines[0] if lines else ""
        sample_lines = lines[1 : 1 + max_rows] if len(lines) > 1 else []
        return headers, "\n".join(sample_lines)
    except Exception as e:
        return "", ""


def _load_current_config(customer_name: str) -> dict:
    config_path = f"configs/customers/{customer_name.lower()}.yaml"
    try:
        with open(config_path, "r") as f:
            return yaml.safe_load(f) or {}
    except Exception:
        return {}


def _save_healed_config(customer_name: str, config: dict) -> str:
    config_path = f"configs/customers/{customer_name.lower()}.yaml"
    with open(config_path, "w") as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True)
    print(f"  [Healer] Saved corrected config → {config_path}")
    return config_path


def _call_llm(prompt: str) -> str | None:
    if not GROQ_API_KEY:
        print("  [Healer] GROQ_API key not set – cannot self-heal.")
        return None
    try:
        resp = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            },
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  [Healer] LLM call failed: {e}")
        return None


def attempt_schema_healing(
    customer_name: str, file_path: str, error_messages: list[str]
) -> bool:
    """
    Ask the LLM to fix the customer's YAML config based on the actual CSV data
    and the errors encountered during processing.

    Returns True if a healed config was saved (caller should retry the pipeline).
    Returns False if healing could not be performed.
    """
    print()
    print("=" * 50)
    print("LLM SCHEMA SELF-HEALING")
    print("=" * 50)

    headers, sample_rows = _read_csv_sample(file_path)
    current_config = _load_current_config(customer_name)
    current_config_yaml = yaml.dump(current_config, default_flow_style=False)

    error_summary = "\n".join(f"  - {e}" for e in error_messages)

    prompt = f"""
You are an expert data integration assistant helping fix a broken customer schema mapping.

## Customer
{customer_name}

## CSV Headers (actual file)
{headers}

## Sample CSV Rows (actual file, first 3 rows)
{sample_rows}

## Canonical Target Schema
{CANONICAL_SCHEMA}

## Current (Broken) YAML Config
```yaml
{current_config_yaml}
```

## Errors That Occurred During Pipeline Execution
{error_summary}

## Your Task
Fix the YAML config so the pipeline will succeed. Key rules:
1. The keys of the JSON must be the canonical field names (customer_id, first_name, last_name, email, phone, created_at).
2. Each value must have:
   - "source": the exact column name from the CSV headers above
   - "required": true or false (boolean)
   - "transformation": optional — use "extract_first_name" or "extract_last_name" when a single source column contains full name
   - "format": REQUIRED for created_at — detect the EXACT Python strptime format from the sample rows above (e.g. "%d/%m/%Y", "%Y-%m-%d", "%m-%d-%Y"). Do NOT use "ISO" or any placeholder.
3. Fix any source column name mismatches to match the actual CSV headers exactly.
4. Fix any incorrect date format strings based on the sample rows.

Return ONLY a strictly valid JSON object — no markdown, no explanation.
"""

    print(f"  [Healer] Calling LLM to diagnose schema errors...")
    print(f"  [Healer] Errors: {error_messages}")

    raw_response = _call_llm(prompt)
    if not raw_response:
        return False

    # Parse LLM JSON response
    try:
        healed_config = json.loads(raw_response)
    except json.JSONDecodeError as e:
        # Try to extract JSON from the response
        match = re.search(r"\{.*\}", raw_response, re.DOTALL)
        if match:
            try:
                healed_config = json.loads(match.group())
            except Exception:
                print(f"  [Healer] Could not parse LLM response as JSON: {e}")
                return False
        else:
            print(f"  [Healer] Could not parse LLM response as JSON: {e}")
            return False

    # Validate the healed config has the expected structure
    required_fields = {"customer_id", "first_name", "last_name", "email", "phone", "created_at"}
    if not required_fields.issubset(set(healed_config.keys())):
        missing = required_fields - set(healed_config.keys())
        print(f"  [Healer] LLM config is missing fields: {missing}")
        return False

    # Ensure created_at has a format
    created_at_cfg = healed_config.get("created_at", {})
    if not created_at_cfg.get("format"):
        print("  [Healer] LLM did not provide a date format — healing failed.")
        return False

    print(f"  [Healer] Healed config:")
    for field, mapping in healed_config.items():
        print(f"    {field} ← {mapping.get('source')} (format={mapping.get('format', 'N/A')})")

    _save_healed_config(customer_name, healed_config)
    return True
