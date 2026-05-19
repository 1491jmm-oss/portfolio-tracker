import requests


BASE_URL = "https://api.invertironline.com"


def login_iol(username: str, password: str):
    response = requests.post(
        f"{BASE_URL}/token",
        data={
            "username": username,
            "password": password,
            "grant_type": "password",
        },
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )

    response.raise_for_status()

    return response.json()
