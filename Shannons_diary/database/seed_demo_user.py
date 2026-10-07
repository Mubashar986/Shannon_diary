#!/usr/bin/env python3
"""Create the shared judge demo account in Supabase, so Judge Demo can produce a
real access token now that the API rejects anonymous writes.

The account is reachable by anyone with the frontend env file. Give it no data you
would not show a stranger, and never reuse the generated password elsewhere.

    cd Shannons_diary/backend
    .venv/Scripts/activate
    python ../database/seed_demo_user.py --email judge@hackathon.dev

Pass --password to pin a value, otherwise one is generated and printed once.
"""

from __future__ import annotations

import argparse
import secrets
import string
import sys

import httpx

sys.path.insert(0, "app")  # allows running from the backend folder where config lives
try:
    from app.config import settings
except ImportError:
    sys.path.insert(0, ".")
    from app.config import settings  # type: ignore

ALPHABET = string.ascii_letters + string.digits


def generate_password(length: int = 16) -> str:
    return "".join(secrets.choice(ALPHABET) for _ in range(length))


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed the Supabase demo judge user.")
    parser.add_argument("--email", default="judge.demo@hackathon.dev")
    parser.add_argument("--password", default=None)
    parser.add_argument("--name", default="Hackathon Judge")
    args = parser.parse_args()

    key = settings.supabase_service_role_key
    if not key:
        print("SUPABASE_SERVICE_ROLE_KEY is empty in backend/.env. Nothing was created.", file=sys.stderr)
        return 2

    password = args.password or generate_password()
    url = f"{settings.supabase_url}/auth/admin/users"
    body = {
        "email": args.email,
        "password": password,
        "email_confirm": True,
        "role": "authenticated",
        "user_metadata": {"full_name": args.name},
    }

    resp = httpx.post(url, json=body, headers={"apikey": key, "Authorization": f"Bearer {key}"}, timeout=25.0)

    if resp.status_code in (200, 201):
        payload = resp.json()
        uid = payload.get("id") or payload.get("user", {}).get("id")
        print(f"created user {uid} ({args.email})")
    elif resp.status_code == 422 and "already exists" in resp.text.lower():
        print(f"user {args.email} already exists; password unchanged. Use --email another address to make a fresh one.")
        return 1
    else:
        print(f"failed: HTTP {resp.status_code} {resp.text[:300]}", file=sys.stderr)
        return 1

    print("\nAdd these two lines to Shannons_diary/frontend/.env and restart vite:\n")
    print(f"VITE_DEMO_EMAIL={args.email}")
    print(f"VITE_DEMO_PASSWORD={password if not args.password else args.password}")
    print("\nThis password is shown once. frontend/.env is gitignored; do not commit it.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
