"""
Управление каналами: список каналов сервера, создание канала.
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}


def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.id FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s",
        (token,),
    )
    row = cur.fetchone()
    return {"id": row[0]} if row else None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    token = headers.get("X-Session-Token") or headers.get("x-session-token")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user(cur, token)
        if not user:
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}

        user_id = user["id"]

        # GET /?server_id= — каналы сервера
        if method == "GET":
            server_id = params.get("server_id")
            if not server_id:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "server_id обязателен"})}

            # Проверяем членство
            cur.execute("SELECT 1 FROM server_members WHERE server_id = %s AND user_id = %s", (server_id, user_id))
            if not cur.fetchone():
                return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Нет доступа"})}

            cur.execute(
                "SELECT id, name, type, position FROM channels WHERE server_id = %s ORDER BY position, id",
                (server_id,),
            )
            rows = cur.fetchall()
            channels = [{"id": r[0], "name": r[1], "type": r[2], "position": r[3]} for r in rows]
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"channels": channels})}

        # POST /create — создать канал
        if method == "POST" and path.endswith("/create"):
            server_id = body.get("server_id")
            name = (body.get("name") or "").strip().lower().replace(" ", "-")
            ch_type = body.get("type") or "text"

            if not server_id or not name:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "server_id и name обязательны"})}

            # Только владелец может создавать каналы
            cur.execute("SELECT owner_id FROM servers WHERE id = %s", (server_id,))
            srv = cur.fetchone()
            if not srv or srv[0] != user_id:
                return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Только владелец может создавать каналы"})}

            cur.execute(
                "INSERT INTO channels (server_id, name, type, position) "
                "VALUES (%s, %s, %s, (SELECT COALESCE(MAX(position)+1,0) FROM channels WHERE server_id=%s)) RETURNING id, name, type, position",
                (server_id, name, ch_type, server_id),
            )
            ch = cur.fetchone()
            conn.commit()
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"channel": {"id": ch[0], "name": ch[1], "type": ch[2], "position": ch[3]}})}

        return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
