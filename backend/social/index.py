"""
Социальные функции: друзья, личные сообщения, настройки профиля.
Роутинг через query-параметр action.
"""
import json, os, hashlib, secrets
import psycopg2

HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Token",
    "Content-Type": "application/json",
}

AVATAR_COLORS = ["#5865f2","#3ba55c","#ed4245","#faa61a","#9b59b6","#1abc9c","#e67e22","#e91e8c","#00b0f4","#f47fff"]

def get_conn(): return psycopg2.connect(os.environ["DATABASE_URL"])
def ok(data): return {"statusCode": 200, "headers": HEADERS, "body": json.dumps(data)}
def err(msg, code=400): return {"statusCode": code, "headers": HEADERS, "body": json.dumps({"error": msg})}
def hash_pw(pw, salt): return hashlib.sha256((salt+pw).encode()).hexdigest()
def make_salt(): return secrets.token_hex(16)

def get_user(cur, token):
    if not token: return None
    cur.execute("""SELECT u.id, u.username, u.display_name, u.avatar_color, u.bio, u.status_text
                   FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=%s""", (token,))
    r = cur.fetchone()
    return {"id":r[0],"username":r[1],"display_name":r[2],"avatar_color":r[3],"bio":r[4] or "","status_text":r[5] or ""} if r else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": HEADERS, "body": ""}

    method = event.get("httpMethod","GET")
    headers_in = event.get("headers") or {}
    token = headers_in.get("X-Session-Token") or headers_in.get("x-session-token")
    body = json.loads(event.get("body") or "{}")
    params = event.get("queryStringParameters") or {}
    action = params.get("action") or body.get("action") or ""

    conn = get_conn()
    cur = conn.cursor()
    try:
        user = get_user(cur, token)
        if not user: return err("Не авторизован", 401)
        uid = user["id"]

        # ── ПРОФИЛЬ ──────────────────────────────────────────
        if action == "profile_get":
            return ok({"user": user})

        if action == "profile_update":
            display_name = (body.get("display_name") or "").strip()
            bio = body.get("bio","").strip()
            status_text = body.get("status_text","").strip()
            avatar_color = body.get("avatar_color","")
            if display_name and len(display_name) < 2: return err("Имя слишком короткое")
            updates, vals = [], []
            if display_name: updates.append("display_name=%s"); vals.append(display_name)
            updates.append("bio=%s"); vals.append(bio[:300])
            updates.append("status_text=%s"); vals.append(status_text[:128])
            if avatar_color in AVATAR_COLORS: updates.append("avatar_color=%s"); vals.append(avatar_color)
            if updates:
                vals.append(uid)
                cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE id=%s", vals)
                conn.commit()
            cur.execute("SELECT id,username,display_name,avatar_color,bio,status_text FROM users WHERE id=%s",(uid,))
            r = cur.fetchone()
            return ok({"user":{"id":r[0],"username":r[1],"display_name":r[2],"avatar_color":r[3],"bio":r[4] or "","status_text":r[5] or ""}})

        if action == "password_change":
            old_pw = body.get("old_password","")
            new_pw = body.get("new_password","")
            if len(new_pw) < 6: return err("Новый пароль минимум 6 символов")
            cur.execute("SELECT password_hash FROM users WHERE id=%s",(uid,))
            row = cur.fetchone()
            if row and row[0]:
                salt, stored = row[0].split(":",1)
                if hash_pw(old_pw, salt) != stored: return err("Неверный текущий пароль", 401)
            salt = make_salt()
            cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (salt+":"+hash_pw(new_pw,salt), uid))
            conn.commit()
            return ok({"success": True})

        # ── ДРУЗЬЯ ───────────────────────────────────────────
        if action == "friends_list":
            cur.execute("""
                SELECT u.id, u.username, u.display_name, u.avatar_color, f.id
                FROM friendships f
                JOIN users u ON (CASE WHEN f.requester_id=%s THEN f.addressee_id ELSE f.requester_id END = u.id)
                WHERE (f.requester_id=%s OR f.addressee_id=%s) AND f.status='accepted'
                ORDER BY u.display_name
            """, (uid, uid, uid))
            rows = cur.fetchall()
            return ok({"friends":[{"id":r[0],"username":r[1],"display_name":r[2],"avatar_color":r[3],"friendship_id":r[4]} for r in rows]})

        if action == "friends_pending":
            cur.execute("""
                SELECT u.id, u.username, u.display_name, u.avatar_color, f.id
                FROM friendships f JOIN users u ON f.requester_id=u.id
                WHERE f.addressee_id=%s AND f.status='pending' ORDER BY f.created_at DESC
            """, (uid,))
            rows = cur.fetchall()
            return ok({"requests":[{"id":r[0],"username":r[1],"display_name":r[2],"avatar_color":r[3],"friendship_id":r[4]} for r in rows]})

        if action == "friends_search":
            q = (params.get("q") or body.get("q") or "").strip()
            if not q or len(q) < 2: return err("Минимум 2 символа")
            cur.execute("""
                SELECT u.id, u.username, u.display_name, u.avatar_color,
                    (SELECT status FROM friendships WHERE
                        (requester_id=%s AND addressee_id=u.id) OR (addressee_id=%s AND requester_id=u.id)
                    LIMIT 1) as fstatus
                FROM users u WHERE (u.username ILIKE %s OR u.display_name ILIKE %s) AND u.id!=%s LIMIT 20
            """, (uid, uid, f"%{q}%", f"%{q}%", uid))
            rows = cur.fetchall()
            return ok({"users":[{"id":r[0],"username":r[1],"display_name":r[2],"avatar_color":r[3],"friendship_status":r[4]} for r in rows]})

        if action == "friends_send":
            target_id = body.get("user_id")
            if not target_id: return err("user_id обязателен")
            if int(target_id) == uid: return err("Нельзя добавить себя")
            cur.execute("SELECT id FROM users WHERE id=%s",(target_id,))
            if not cur.fetchone(): return err("Пользователь не найден",404)
            cur.execute("INSERT INTO friendships (requester_id,addressee_id,status) VALUES (%s,%s,'pending') ON CONFLICT DO NOTHING",(uid,target_id))
            conn.commit()
            return ok({"success": True})

        if action == "friends_accept":
            fid = body.get("friendship_id")
            if not fid: return err("friendship_id обязателен")
            cur.execute("UPDATE friendships SET status='accepted' WHERE id=%s AND addressee_id=%s",(fid,uid))
            conn.commit()
            return ok({"success": True})

        if action == "friends_decline":
            fid = body.get("friendship_id")
            if not fid: return err("friendship_id обязателен")
            cur.execute("UPDATE friendships SET status='declined' WHERE id=%s AND (addressee_id=%s OR requester_id=%s)",(fid,uid,uid))
            conn.commit()
            return ok({"success": True})

        # ── ЛИЧНЫЕ СООБЩЕНИЯ ─────────────────────────────────
        if action == "dm_dialogs":
            cur.execute("""
                SELECT DISTINCT ON (other_id) other_id,
                    u.display_name, u.username, u.avatar_color, dm.content, dm.created_at
                FROM (
                    SELECT CASE WHEN sender_id=%s THEN receiver_id ELSE sender_id END as other_id,
                           content, created_at
                    FROM direct_messages WHERE sender_id=%s OR receiver_id=%s
                ) dm JOIN users u ON u.id=dm.other_id
                ORDER BY other_id, dm.created_at DESC
            """, (uid, uid, uid))
            rows = cur.fetchall()
            return ok({"dialogs":[{"user_id":r[0],"display_name":r[1],"username":r[2],"avatar_color":r[3],
                                    "last_message":r[4],"last_at":r[5].strftime("%H:%M") if r[5] else ""} for r in rows]})

        if action == "dm_history":
            other_id = int(params.get("with_user") or body.get("with_user") or 0)
            if not other_id: return err("with_user обязателен")
            cur.execute("""
                SELECT dm.id, dm.content, dm.created_at, dm.sender_id, u.display_name, u.avatar_color
                FROM direct_messages dm JOIN users u ON u.id=dm.sender_id
                WHERE (dm.sender_id=%s AND dm.receiver_id=%s) OR (dm.sender_id=%s AND dm.receiver_id=%s)
                ORDER BY dm.created_at DESC LIMIT 50
            """, (uid, other_id, other_id, uid))
            rows = cur.fetchall()
            msgs = [{"id":r[0],"content":r[1],"time":r[2].strftime("%H:%M"),"sender_id":r[3],
                     "display_name":r[4],"avatar_color":r[5],"avatar":r[4][0].upper(),"is_me":r[3]==uid} for r in reversed(rows)]
            return ok({"messages": msgs})

        if action == "dm_send":
            receiver_id = body.get("receiver_id")
            content = (body.get("content") or "").strip()
            if not receiver_id or not content: return err("receiver_id и content обязательны")
            if len(content) > 2000: return err("Слишком длинное")
            cur.execute("SELECT id FROM users WHERE id=%s",(receiver_id,))
            if not cur.fetchone(): return err("Получатель не найден",404)
            cur.execute("INSERT INTO direct_messages (sender_id,receiver_id,content) VALUES (%s,%s,%s) RETURNING id,created_at",(uid,receiver_id,content))
            r = cur.fetchone()
            conn.commit()
            return ok({"message":{"id":r[0],"content":content,"time":r[1].strftime("%H:%M"),
                                   "sender_id":uid,"display_name":user["display_name"],
                                   "avatar_color":user["avatar_color"],"avatar":user["display_name"][0].upper(),"is_me":True}})

        return err("Неизвестное действие", 400)
    finally:
        cur.close(); conn.close()
