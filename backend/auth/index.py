"""
Аутентификация: регистрация и вход по имени пользователя.
Возвращает токен сессии.
"""
import json
import os
import secrets
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}

COLORS = ["#5865f2", "#3ba55c", "#ed4245", "#faa61a", "#9b59b6", "#1abc9c", "#e67e22", "#e91e8c"]


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")

    conn = get_conn()
    cur = conn.cursor()

    try:
        # POST / — вход или регистрация
        if method == "POST":
            username = (body.get("username") or "").strip().lower()
            if not username or len(username) < 2 or len(username) > 32:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Имя от 2 до 32 символов"})}

            display_name = body.get("display_name") or username
            color = COLORS[hash(username) % len(COLORS)]

            cur.execute(
                "INSERT INTO users (username, display_name, avatar_color) VALUES (%s, %s, %s) "
                "ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name "
                "RETURNING id, username, display_name, avatar_color",
                (username, display_name, color),
            )
            user = cur.fetchone()
            user_id, uname, dname, acolor = user

            token = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (token, user_id))
            conn.commit()

            return {
                "statusCode": 200,
                "headers": HEADERS,
                "body": json.dumps({
                    "token": token,
                    "user": {"id": user_id, "username": uname, "display_name": dname, "avatar_color": acolor},
                }),
            }

        # GET /me — получить текущего пользователя по токену
        if method == "GET" and path.endswith("/me"):
            token = event.get("headers", {}).get("X-Session-Token") or event.get("headers", {}).get("x-session-token")
            if not token:
                return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}

            cur.execute(
                "SELECT u.id, u.username, u.display_name, u.avatar_color FROM sessions s "
                "JOIN users u ON u.id = s.user_id WHERE s.token = %s",
                (token,),
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Сессия не найдена"})}

            uid, uname, dname, acolor = row
            return {
                "statusCode": 200,
                "headers": HEADERS,
                "body": json.dumps({"user": {"id": uid, "username": uname, "display_name": dname, "avatar_color": acolor}}),
            }

        return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()