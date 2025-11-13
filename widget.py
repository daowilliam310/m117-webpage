import requests
import json
def call_workflow(params: dict, api_key: str) -> dict:
    url = "https://rt83j9.buildship.run/executeWorkflow/Xk6K6MnMcYQmxSEI2X7X/e7f9c4f9-f94c-4c29-b56d-862b2f1521f4"
    headers = {
        'Content-Type': 'application/json',
        'BUILDSHIP_API_KEY': api_key
    }

    try:
        response = requests.post(url, headers=headers, json=params)
        response.raise_for_status()
        print("Raw response content:", response.content)  # Debug line
        return response.text

    except requests.exceptions.RequestException as e:
        print(f"Error calling workflow: {e}")
        raise
    except ValueError as ve:
        print("Failed to parse JSON. Raw response was:", response.text)
        raise ve

def main():
    api_key = "608d64a9758b5cae434e0b4416b93bd44b0a089f75cb608cf21c8c85ef660b41"  # Replace with your real API key
    params = {
        "pageUrl": "https://bankhtml.s3.us-east-1.amazonaws.com/bank.html",
        "userQuery": "You are a financial AI summarizer. Given the recent transactions extracted from the account page, summarize the transaction dates, descriptions, amounts, and status. Do NOT include unrelated page headers, footers, or disclaimers. what is the value of the current balance."

    }

    try:
        result = call_workflow(params, api_key)
        print("Workflow result:", result)
        return result

    except Exception as e:
        print(f"Failed to execute workflow: {e}")

if __name__ == "__main__":
    main()
