from fastapi import FastAPI, UploadFile, File
from data_engine.app.profiler import profile_csv
from data_engine.app.transformer import transform_customer
from data_engine.app.validator import validate_customer

app = FastAPI(
    title="Customer Data Engine"
)

@app.get("/")
def home():
    return "API Running"

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

@app.post("/profile")
async def profile_file(file: UploadFile = File(...)):

    profile = profile_csv(file)

    transformed_data = transform_customer(profile)

    validate_data = validate_customer(transformed_data)

    return {
        "fileName": file.filename,
        "message": "File Received",
        "validated": validate_data,
        "transformed": transformed_data,
    }