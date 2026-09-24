from datetime import datetime


def transform_customer(row, config):

    result = {}

    for target_field, mapping in config.items():

        source_field = mapping["source"]

        # First name / last name
        if target_field in ["first_name", "last_name"]:

            full_name = str(row[source_field])

            parts = full_name.split(" ", 1)

            if target_field == "first_name":
                result[target_field] = parts[0]

            else:
                result[target_field] = (
                    parts[1] if len(parts) > 1 else ""
                )

        # Date transformation
        elif target_field == "created_at":

            source_value = str(row[source_field])

            source_format = mapping.get("format")

            parsed_date = datetime.strptime(
                source_value,
                source_format
            )

            result[target_field] = parsed_date.date()

        # Everything else
        else:

            result[target_field] = row[source_field]

    return result