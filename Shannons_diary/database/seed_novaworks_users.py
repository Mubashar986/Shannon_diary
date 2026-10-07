#!/usr/bin/env python3
"""Seed the 10 NovaWorks demo accounts into the database.
Re-running will not duplicate or overwrite existing accounts.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.crm_db import seed_demo_users, DEMO_USERS

def main():
    print("=" * 60)
    print("NovaWorks CRM: Seeding 10 Demo Accounts")
    print("=" * 60)
    
    inserted = seed_demo_users()
    print(f"Status: Seeded {inserted} new accounts (total: {len(DEMO_USERS)} accounts active).")
    print("\nAvailable Demo Credentials (Password: Demo123!):")
    for u in DEMO_USERS:
        print(f"- [{u['role']}] {u['name']} <{u['email']}> ({u['specialization']})")
    print("=" * 60)

if __name__ == "__main__":
    main()
