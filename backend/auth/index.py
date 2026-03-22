"""
Аутентификация: регистрация с паролем и вход по логину/паролю.
"""
import json
import os
import secrets
import hashlib
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


def hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode()).hexdigest()


def make_salt() -> str:
    return secrets.token_hex(16)


def user_row(row) -> dict:
    return {"id": row[0], "username": row[1], "display_name": row[2], "avatar_color": row[3]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    body = json.loads(event.get("body") or "{}")
    headers_in = event.get("headers") or {}
    token = headers_in.get("X-Session-Token") or headers_in.get("x-session-token")

    conn = get_conn()
    cur = conn.cursor()

    try:
        action = body.get("action") or ("register" if "register" in path else "login")

        # POST — регистрация
        if method == "POST" and action == "register":
            username = (body.get("username") or "").strip().lower()
            display_name = (body.get("display_name") or "").strip()
            password = body.get("password") or ""

            if not username or len(username) < 2 or len(username) > 32:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Логин: от 2 до 32 символов"})}
            if not display_name or len(display_name) < 2:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Отображаемое имя слишком короткое"})}
            if len(password) < 6:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Пароль минимум 6 символов"})}

            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                return {"statusCode": 409, "headers": HEADERS, "body": json.dumps({"error": "Пользователь уже существует"})}

            salt = make_salt()
            pw_hash = salt + ":" + hash_password(password, salt)
            color = COLORS[hash(username) % len(COLORS)]

            cur.execute(
                "INSERT INTO users (username, display_name, avatar_color, password_hash) VALUES (%s, %s, %s, %s) RETURNING id, username, display_name, avatar_color",
                (username, display_name, color, pw_hash),
            )
            row = cur.fetchone()
            tok = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (tok, row[0]))
            conn.commit()

            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"token": tok, "user": user_row(row)})}

        # POST — вход
        if method == "POST":
            username = (body.get("username") or "").strip().lower()
            password = body.get("password") or ""

            if not username or not password:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Введите логин и пароль"})}

            cur.execute(
                "SELECT id, username, display_name, avatar_color, password_hash FROM users WHERE username = %s",
                (username,),
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверный логин или пароль"})}

            uid, uname, dname, acolor, pw_hash = row

            # Поддержка старых аккаунтов без пароля
            if pw_hash is None:
                cur.execute(
                    "UPDATE users SET password_hash = %s WHERE id = %s",
                    (make_salt() + ":" + hash_password(password, make_salt()), uid),
                )
            else:
                salt, stored = pw_hash.split(":", 1)
                if hash_password(password, salt) != stored:
                    return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Неверный логин или пароль"})}

            tok = secrets.token_hex(32)
            cur.execute("INSERT INTO sessions (token, user_id) VALUES (%s, %s)", (tok, uid))
            conn.commit()

            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"token": tok, "user": {"id": uid, "username": uname, "display_name": dname, "avatar_color": acolor}})}

        # GET /me
        if method == "GET":
            if not token:
                return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Не авторизован"})}
            cur.execute(
                "SELECT u.id, u.username, u.display_name, u.avatar_color FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s",
                (token,),
            )
            row = cur.fetchone()
            if not row:
                return {"statusCode": 401, "headers": HEADERS, "body": json.dumps({"error": "Сессия не найдена"})}
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"user": user_row(row)})}

        return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()