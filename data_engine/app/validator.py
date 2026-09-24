import re


def validate_customer(row, config):

    errors = []

    for target_field, mapping in config.items():
        source_field = mapping["source"]
        value = row.get(source_field)

        # Required field validation
        if mapping.get("required") and (value is None or str(value).strip() == ""):
            errors.append({
                "field": source_field,
                "error": "Missing required field",
                "value": str(value) if value is not None else ""
            })
            continue

        # Email validation
        if target_field == "email" and value:
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", str(value)):
                errors.append({
                    "field": source_field,
                    "error": "Invalid email",
                    "value": str(value)
                })
                
    return errors