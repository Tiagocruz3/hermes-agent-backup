#!/usr/bin/env python3
"""
Supabase Cloud → SQL Export via REST API
Use when pg_dump is not available or DB password is unknown.
Requires: service_role key (from Supabase Dashboard → Settings → API)
"""

import requests
import json
import sys

# CONFIGURE THESE
PROJECT_REF = "your-project-ref"  # From Settings → API, NOT dashboard URL
SERVICE_KEY = "your-service-role-key"  # From Settings → API → service_role key
OUTPUT_FILE = "supabase_export.sql"

API_URL = f"https://{PROJECT_REF}.supabase.co/rest/v1"
HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}


def get_tables():
    """Discover tables from API spec."""
    print("Discovering tables...")
    r = requests.get(f"{API_URL}/", headers=HEADERS, timeout=30)
    if r.status_code != 200:
        print(f"Failed to get API spec: {r.status_code}")
        sys.exit(1)
    
    spec = r.json()
    tables = []
    for path, methods in spec.get("paths", {}).items():
        if path.startswith("/") and not path.startswith("/rpc/"):
            table_name = path.strip("/")
            if table_name and table_name not in ['', 'pg_catalog', 'information_schema']:
                if "get" in methods:
                    tables.append(table_name)
    
    return [t for t in tables if t and t.strip()]


def export_table(table_name):
    """Export all rows from a table with pagination."""
    print(f"Exporting {table_name}...")
    
    rows = []
    offset = 0
    limit = 1000
    
    while True:
        try:
            r = requests.get(
                f"{API_URL}/{table_name}?limit={limit}&offset={offset}",
                headers=HEADERS,
                timeout=30
            )
            if r.status_code != 200:
                print(f"  Error {r.status_code}: {r.text[:100]}")
                break
            
            batch = r.json()
            if not batch:
                break
            
            if not isinstance(batch, list):
                print(f"  Unexpected response type: {type(batch)}")
                break
            
            rows.extend(batch)
            offset += limit
            
            if len(batch) < limit:
                break
                
        except Exception as e:
            print(f"  Exception: {e}")
            break
    
    return rows


def generate_inserts(table_name, rows):
    """Generate SQL INSERT statements from rows."""
    if not rows or not isinstance(rows[0], dict):
        return []
    
    columns = list(rows[0].keys())
    col_str = ", ".join([f'"{c}"' for c in columns])
    
    statements = [f"-- Table: {table_name} ({len(rows)} rows)"]
    
    for row in rows:
        values = []
        for col in columns:
            val = row.get(col)
            if val is None:
                values.append("NULL")
            elif isinstance(val, bool):
                values.append(str(val).lower())
            elif isinstance(val, (int, float)):
                values.append(str(val))
            elif isinstance(val, (dict, list)):
                json_str = json.dumps(val).replace("'", "''")
                values.append(f"'{json_str}'::jsonb")
            else:
                safe_val = str(val).replace("'", "''")
                values.append(f"'{safe_val}'")
        
        val_str = ", ".join(values)
        statements.append(f'INSERT INTO "{table_name}" ({col_str}) VALUES ({val_str});')
    
    statements.append("")
    return statements


def main():
    print(f"Supabase Export: {PROJECT_REF}")
    print(f"API: {API_URL}")
    print()
    
    # Test connection
    print("Testing connection...")
    r = requests.get(f"{API_URL}/", headers=HEADERS, timeout=30)
    if r.status_code != 200:
        print(f"Connection failed: {r.status_code}")
        print("Check your project ref and service_role key")
        sys.exit(1)
    print("Connected!")
    print()
    
    # Get tables
    tables = get_tables()
    print(f"Found {len(tables)} tables: {tables}")
    print()
    
    # Export all tables
    output = [
        f"-- Exported from Supabase Cloud via REST API",
        f"-- Project: {PROJECT_REF}",
        f"-- Date: {__import__('datetime').datetime.now().isoformat()}",
        ""
    ]
    
    total_rows = 0
    for table in tables:
        rows = export_table(table)
        if rows:
            statements = generate_inserts(table, rows)
            output.extend(statements)
            total_rows += len(rows)
            print(f"  ✓ {len(rows)} rows")
        else:
            print(f"  ✓ No data")
    
    # Write output
    with open(OUTPUT_FILE, "w") as f:
        f.write("\n".join(output))
    
    print()
    print(f"Export complete: {OUTPUT_FILE}")
    print(f"Total tables: {len(tables)}")
    print(f"Total rows: {total_rows}")
    print()
    print("Next steps:")
    print("1. Inspect column names: grep 'INSERT INTO' export.sql | head -5")
    print("2. Create schema with correct columns")
    print("3. Import: cat export.sql | psql -U postgres -d your_db")


if __name__ == "__main__":
    main()
