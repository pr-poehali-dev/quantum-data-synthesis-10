"""
Управление серверами: список, создание, вступление.
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
        "SELECT u.id, u.username, u.display_name, u.avatar_color FROM sessions s "
        "JOIN users u ON u.id = s.user_id WHERE s.token = %s",
        (token,),
    )
    row = cur.fetchone()
    if not row:
        return None
    return {"id": row[0], "username": row[1], "display_name": row[2], "avatar_color": row[3]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    headers = event.get("headers") or {}
    token = headers.get("X-Session-Token") or headers.get("x-session-token")
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user(cur, token)
        if not user:
            return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}

        user_id = user["id"]

        # GET / — список серверов пользователя
        if method == "GET" and (path.endswith("/servers") or path == "/"):
            cur.execute(
                "SELECT s.id, s.name, s.icon, s.color, s.owner_id FROM servers s "
                "JOIN server_members sm ON sm.server_id = s.id WHERE sm.user_id = %s ORDER BY s.id",
                (user_id,),
            )
            rows = cur.fetchall()
            servers = [{"id": r[0], "name": r[1], "icon": r[2], "color": r[3], "owner_id": r[4]} for r in rows]
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"servers": servers})}

        # POST /create — создать сервер
        if method == "POST" and path.endswith("/create"):
            name = (body.get("name") or "").strip()
            icon = (body.get("icon") or "💬").strip()
            color = body.get("color") or "#5865f2"
            if not name or len(name) < 2 or len(name) > 64:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Название от 2 до 64 символов"})}

            cur.execute(
                "INSERT INTO servers (name, icon, color, owner_id) VALUES (%s, %s, %s, %s) RETURNING id",
                (name, icon, color, user_id),
            )
            server_id = cur.fetchone()[0]

            # Добавить создателя как участника
            cur.execute("INSERT INTO server_members (server_id, user_id) VALUES (%s, %s)", (server_id, user_id))

            # Создать канал #основной по умолчанию
            cur.execute(
                "INSERT INTO channels (server_id, name, type, position) VALUES (%s, %s, %s, %s)",
                (server_id, "основной", "text", 0),
            )

            conn.commit()
            return {
                "statusCode": 200,
                "headers": HEADERS,
                "body": json.dumps({"server": {"id": server_id, "name": name, "icon": icon, "color": color, "owner_id": user_id}}),
            }

        # POST /join — вступить на сервер по ID
        if method == "POST" and path.endswith("/join"):
            server_id = body.get("server_id")
            if not server_id:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "server_id обязателен"})}

            cur.execute("SELECT id, name, icon, color, owner_id FROM servers WHERE id = %s", (server_id,))
            srv = cur.fetchone()
            if not srv:
                return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Сервер не найден"})}

            cur.execute(
                "INSERT INTO server_members (server_id, user_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (server_id, user_id),
            )
            conn.commit()
            return {
                "statusCode": 200,
                "headers": HEADERS,
                "body": json.dumps({"server": {"id": srv[0], "name": srv[1], "icon": srv[2], "color": srv[3], "owner_id": srv[4]}}),
            }

        # GET /members?server_id= — участники сервера
        if method == "GET" and path.endswith("/members"):
            server_id = (event.get("queryStringParameters") or {}).get("server_id")
            if not server_id:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "server_id обязателен"})}

            cur.execute(
                "SELECT u.id, u.username, u.display_name, u.avatar_color FROM server_members sm "
                "JOIN users u ON u.id = sm.user_id WHERE sm.server_id = %s ORDER BY u.id",
                (server_id,),
            )
            rows = cur.fetchall()
            members = [{"id": r[0], "username": r[1], "display_name": r[2], "avatar_color": r[3]} for r in rows]
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"members": members})}

        return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
