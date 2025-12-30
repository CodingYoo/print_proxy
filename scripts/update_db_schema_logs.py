import sqlite3
import os

# Database file path
# DB_FILE = "sql_app.db"
try:
    appdata = os.environ.get('APPDATA')
    if appdata:
        DB_FILE = os.path.join(appdata, 'PrintProxy', 'print_proxy.db')
    else:
        DB_FILE = os.path.expanduser('~/.printproxy/print_proxy.db')
    print(f"Targeting Database: {DB_FILE}")
except Exception:
    DB_FILE = "print_proxy.db"

def migrate():
    if not os.path.exists(DB_FILE):
        print(f"Database file {DB_FILE} not found.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    print("Starting migration...")

    # 1. Rename existing table
    try:
        cursor.execute("ALTER TABLE job_logs RENAME TO job_logs_old")
    except sqlite3.OperationalError:
        print("Table job_logs might not exist or already renamed.")

    # 2. Create new table with updated schema (job_id nullable, new category column)
    # Note: job_id is now INTEGER (nullable), and we removed NOT NULL constraint.
    # We also added `category` column.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS job_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id INTEGER,
        level VARCHAR(20) DEFAULT 'info',
        category VARCHAR(50) DEFAULT 'general',
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY(job_id) REFERENCES print_jobs(id) ON DELETE CASCADE
    )
    """)
    
    # 3. Create indices
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_job_logs_id ON job_logs (id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_job_logs_job_id ON job_logs (job_id)")

    # 4. Copy data from old table
    try:
        # Check columns in old table
        cursor.execute("PRAGMA table_info(job_logs_old)")
        columns = [info[1] for info in cursor.fetchall()]
        
        # Build insert query dynamically based on existing columns
        # Old table has: id, job_id, level, message, created_at
        # New table needs mapping. 'category' will use default.
        
        insert_cols = "id, job_id, level, message, created_at"
        select_cols = "id, job_id, level, message, created_at"
        
        cursor.execute(f"INSERT INTO job_logs ({insert_cols}) SELECT {select_cols} FROM job_logs_old")
        print("Data copied successfully.")
        
        # 5. Drop old table
        cursor.execute("DROP TABLE job_logs_old")
        print("Old table dropped.")
        
    except Exception as e:
        print(f"Error copying data: {e}")
        print("Restoring old table name...")
        cursor.execute("DROP TABLE IF EXISTS job_logs")
        cursor.execute("ALTER TABLE job_logs_old RENAME TO job_logs")
        return

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
