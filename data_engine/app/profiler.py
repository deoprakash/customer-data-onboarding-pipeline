import pandas as pd

def profile_csv(file_path: str):

    df = pd.read_csv(file_path)

    profile = {
        "row_count": len(df),
        "column_count": len(df.columns),
        "columns": []
    }

    for column in df.columns:
        valid_values = df[column].dropna()
        example_value = valid_values.iloc[0] if not valid_values.empty else ""

        profile["columns"].append({
            "name": column,
            "data_type": str(df[column].dtype),
            "null_count": int(df[column].isna().sum()),
            "unique_count": int(df[column].nunique()),
            "example": str(example_value)
        })

    return profile