import yaml

def load_customer_config(customer_name: str):

    path = f"configs/customers/{customer_name}.yaml"

    with open(path, "r") as file:
        return yaml.safe_load(file)