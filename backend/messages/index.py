"""
Сообщения: получить историю канала, отправить сообщение.
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
        "SELECT u.id, u.display_name, u.avatar_color FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = %s",
        (token,),
    )
    row = cur.fetchone()
    return {"id": row[0], "display_name": row[1], "avatar_color": row[2]} if row else None


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")
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

        # GET /?channel_id= — история сообщений
        if method == "GET":
            channel_id = params.get("channel_id")
            if not channel_id:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "channel_id обязателен"})}

            # Проверяем что пользователь в сервере
            cur.execute(
                "SELECT sm.user_id FROM channels c JOIN server_members sm ON sm.server_id = c.server_id "
                "WHERE c.id = %s AND sm.user_id = %s",
                (channel_id, user_id),
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Нет доступа"})}

            cur.execute(
                "SELECT m.id, m.content, m.created_at, u.id, u.display_name, u.avatar_color "
                "FROM messages m JOIN users u ON u.id = m.user_id "
                "WHERE m.channel_id = %s ORDER BY m.created_at DESC LIMIT 50",
                (channel_id,),
            )
            rows = cur.fetchall()
            msgs = [
                {
                    "id": r[0],
                    "content": r[1],
                    "time": r[2].strftime("%H:%M"),
                    "user_id": r[3],
                    "display_name": r[4],
                    "avatar_color": r[5],
                    "avatar": r[4][0].upper() if r[4] else "?",
                }
                for r in reversed(rows)
            ]
            return {"statusCode": 200, "headers": HEADERS, "body": json.dumps({"messages": msgs})}

        # POST / — отправить сообщение
        if method == "POST":
            channel_id = body.get("channel_id")
            content = (body.get("content") or "").strip()
            if not channel_id or not content:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "channel_id и content обязательны"})}
            if len(content) > 2000:
                return {"statusCode": 400, "headers": HEADERS, "body": json.dumps({"error": "Сообщение слишком длинное"})}

            # Проверяем доступ
            cur.execute(
                "SELECT sm.user_id FROM channels c JOIN server_members sm ON sm.server_id = c.server_id "
                "WHERE c.id = %s AND sm.user_id = %s",
                (channel_id, user_id),
            )
            if not cur.fetchone():
                return {"statusCode": 403, "headers": HEADERS, "body": json.dumps({"error": "Нет доступа"})}

            cur.execute(
                "INSERT INTO messages (channel_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, created_at",
                (channel_id, user_id, content),
            )
            row = cur.fetchone()
            conn.commit()

            return {
                "statusCode": 200,
                "headers": HEADERS,
                "body": json.dumps({
                    "message": {
                        "id": row[0],
                        "content": content,
                        "time": row[1].strftime("%H:%M"),
                        "user_id": user_id,
                        "display_name": user["display_name"],
                        "avatar_color": user["avatar_color"],
                        "avatar": user["display_name"][0].upper() if user["display_name"] else "?",
                    }
                }),
            }

        return {"statusCode": 404, "headers": HEADERS, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
