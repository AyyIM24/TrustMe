import pymysql

host = "localhost"
port = 3306
user = "root"
password = "aYYU@3102"
db_name = "fakeshield"

print(f"Connecting to MySQL server at {host}:{port} as {user}...")
try:
    connection = pymysql.connect(
        host=host,
        port=port,
        user=user,
        password=password
    )
    with connection.cursor() as cursor:
        print(f"Creating database '{db_name}' if it does not exist...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name};")
        connection.commit()
    connection.close()
    print(f"Database '{db_name}' initialized successfully! [OK]")
except Exception as e:
    print("\n[ERROR] FAILED TO INITIALIZE DATABASE:")
    print(str(e))
