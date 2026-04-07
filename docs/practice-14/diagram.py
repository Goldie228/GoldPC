#!/usr/bin/env python3
"""Generate a clean UML Use Case diagram PNG using Cairo."""
import cairo, math, os

W, H = 2800, 1950

BLACK   = (0.1, 0.1, 0.1)
DKGRAY  = (0.22, 0.22, 0.22)
GRAY    = (0.55, 0.55, 0.55)
UC_FILL = (0.91, 0.95, 0.98)
UC_STR  = (0.18, 0.40, 0.72)
INC     = (0.0, 0.33, 0.72)
EXT     = (0.78, 0.33, 0.0)
BDY     = (0.44, 0.44, 0.44)
WHITE   = (1.0, 1.0, 1.0)

UC_RX = 110
UC_RY = 42

def ellipse(ctx, cx, cy, lines):
    n = len(lines); ry = max(UC_RY, n * 13)
    ctx.set_source_rgb(*UC_FILL)
    ctx.save(); ctx.translate(cx, cy); ctx.scale(UC_RX / ry, 1)
    ctx.arc(0, 0, ry, 0, 2 * math.pi); ctx.fill(); ctx.restore()
    ctx.set_source_rgb(*UC_STR); ctx.set_line_width(1.6)
    ctx.save(); ctx.translate(cx, cy); ctx.scale(UC_RX / ry, 1)
    ctx.arc(0, 0, ry, 0, 2 * math.pi); ctx.stroke(); ctx.restore()
    ctx.set_source_rgb(*BLACK)
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(14)
    sy = cy - n * 19 / 2 + 14
    for ln in lines:
        _, _, tw, _, _, _ = ctx.text_extents(ln)
        ctx.move_to(cx - tw / 2, sy); ctx.show_text(ln); sy += 19
    return ry

def ept(cx, cy, rx, ry, tx, ty):
    """Point on ellipse perimeter toward target (tx,ty). Returns (x, y, angle)."""
    a = math.atan2(ty - cy, tx - cx)
    d = math.sqrt((math.cos(a) / rx) ** 2 + (math.sin(a) / ry) ** 2)
    if d < 1e-8: return cx, cy, a
    r = 1 / d
    return cx + r * math.cos(a), cy + r * math.sin(a), a

def sline(ctx, x1, y1, x2, y2, col, w=1.2, dash=False):
    ctx.save(); ctx.set_source_rgb(*col); ctx.set_line_width(w)
    ctx.set_dash([8, 5] if dash else [])
    ctx.move_to(x1, y1); ctx.line_to(x2, y2); ctx.stroke()
    ctx.restore()

def arr_v(ctx, tx, ty, col, w=1.3, empty=False):
    """Vertical arrow (pointing up or down). angle is exactly +/-pi/2."""
    ctx.save(); ctx.set_dash([]); ctx.set_line_width(2.2 if empty else w)
    ctx.set_source_rgb(*col)
    al = 14; aa = 0.42
    # angle = -pi/2 means pointing up (arrowhead at top, line comes from below)
    ax = -math.pi / 2
    ax1 = tx - al * math.cos(ax - aa); ay1 = ty - al * math.sin(ax - aa)
    ax2 = tx - al * math.cos(ax + aa); ay2 = ty - al * math.sin(ax + aa)
    ctx.move_to(ax1, ay1); ctx.line_to(tx, ty); ctx.line_to(ax2, ay2)
    if empty:
        ctx.line_to(ax1 + (ax2 - ax1) * 0.3, ay1 + (ay2 - ay1) * 0.3)
        ctx.close_path()
    ctx.stroke(); ctx.restore()

def arr(ctx, tx, ty, angle, col, w=1.3):
    ctx.save(); ctx.set_dash([]); ctx.set_line_width(w)
    ctx.set_source_rgb(*col)
    al = 14; aa = 0.42
    ax1 = tx - al * math.cos(angle - aa); ay1 = ty - al * math.sin(angle - aa)
    ax2 = tx - al * math.cos(angle + aa); ay2 = ty - al * math.sin(angle + aa)
    ctx.move_to(ax1, ay1); ctx.line_to(tx, ty); ctx.line_to(ax2, ay2)
    ctx.stroke(); ctx.restore()

def lbl(ctx, mx, my, txt, col):
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_ITALIC, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(11)
    _, _, tw, th, _, _ = ctx.text_extents(txt)
    # white background
    ctx.set_source_rgb(*WHITE)
    ctx.rectangle(mx - tw/2 - 6, my - th/2 - 5, tw + 12, th + 10)
    ctx.fill()
    # text
    ctx.set_source_rgb(*col)
    ctx.move_to(mx - tw/2, my + th * 0.35)
    ctx.show_text(txt)

def stick(ctx, ax, ay):
    ctx.set_source_rgb(*BLACK)
    ctx.set_line_width(2.2); ctx.set_dash([])
    r = 10
    hy = ay + r + 2
    ctx.arc(ax, hy, r, 0, 2 * math.pi); ctx.stroke()
    bt = hy + r + 2; bb = bt + 28
    ctx.move_to(ax, bt); ctx.line_to(ax, bb); ctx.stroke()
    arm_y = bt + 7; aw = 18
    ctx.move_to(ax - aw, arm_y); ctx.line_to(ax + aw, arm_y); ctx.stroke()
    ll = 20; lw = 12
    ctx.move_to(ax, bb); ctx.line_to(ax - lw, bb + ll); ctx.stroke()
    ctx.move_to(ax, bb); ctx.line_to(ax + lw, bb + ll); ctx.stroke()
    return bb + ll + 5

def main():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(s)
    ctx.set_source_rgb(1, 1, 1); ctx.rectangle(0, 0, W, H); ctx.fill()

    # ===== System boundary =====
    bx, by, bw, bh = 480, 50, 1720, 1830
    ctx.set_source_rgb(*DKGRAY)
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(15)
    title = "GoldPC \u2014 компьютерный магазин с сервисным центром"
    _, _, tw, _, _, _ = ctx.text_extents(title)
    ctx.move_to(bx + (bw - tw) / 2, by + 22); ctx.show_text(title)
    ctx.set_source_rgb(*BDY); ctx.set_line_width(1.8); ctx.set_dash([10, 5])
    ctx.rectangle(bx, by, bw, bh); ctx.stroke(); ctx.set_dash([])

    # ===== Use case positions =====
    col0 = bx + 230   # visitor-facing
    col1 = bx + 590   # order-related
    col2 = bx + 970   # service/auth
    col3 = bx + 1390  # staff functions

    uc_data = [
        # (key, cx, cy, lines)
        ("catalog",      col0, 155,  ["Просмотр каталога", "товаров"]),
        ("builder",      col0, 400,  ["Использование", "конфигуратора ПК"]),
        ("order",        col1, 360,  ["Оформление", "заказа"]),
        ("cart",         col1, 670,  ["Изменение", "корзины"]),
        ("payment",      col1, 930,  ["Оплата", "заказа"]),
        ("track",        col1, 1160, ["Отслеживание", "статуса заказа"]),
        ("service",      col2, 740,  ["Подача заявки", "в сервисный центр"]),
        ("auth",         col2, 1060, ["Аутентификация", "пользователя"]),
        ("catalog_mgmt", col3, 200,  ["Управление", "каталогом"]),
        ("order_mgmt",   col3, 460,  ["Управление", "заказами"]),
        ("repair",       col3, 710,  ["Выполнение", "ремонтных работ"]),
        ("users",        col3, 970,  ["Управление", "пользователями"]),
        ("admin_sys",    col3, 1160, ["Администрирование", "системы"]),
    ]

    ucs = {}
    rh = {}
    for key, cx, cy, lines in uc_data:
        ucs[key] = (cx, cy)
        rh[key] = ellipse(ctx, cx, cy, lines)

    # ===== Actors (LEFT) =====
    acts = [
        ("visitor", 255, 140),
        ("client",  255, 580),
        ("staff",   255, 960),
        ("manager", 255, 1160),
        ("master",  255, 1380),
        ("admin",   255, 1580),
    ]
    ft = {}
    actor_labels = dict(
        visitor="Посетитель", client="Клиент", staff="Сотрудник",
        manager="Менеджер", master="Мастер", admin="Администратор",
    )
    for nm, ax, ay in acts:
        fy = stick(ctx, ax, ay)
        ft[nm] = (ax, fy + 5)
        _, _, tw, _, _, _ = ctx.text_extents(actor_labels[nm])
        ctx.set_source_rgb(*BLACK)
        ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
        ctx.set_font_size(13)
        ctx.move_to(ax - tw / 2, fy + 6); ctx.show_text(actor_labels[nm])

    # ===== Payment system (RIGHT) =====
    pay_x = bx + bw + 165; pay_y = ucs["payment"][1]
    pw, ph = 135, 58
    ctx.set_source_rgb(*BLACK); ctx.set_line_width(1.5); ctx.set_dash([])
    ctx.rectangle(pay_x - pw / 2, pay_y - ph / 2, pw, ph); ctx.stroke()
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(12)
    p1, p2 = "Платёжная", "система"
    _, _, tw1, _, _, _ = ctx.text_extents(p1)
    _, _, tw2, _, _, _ = ctx.text_extents(p2)
    ctx.move_to(pay_x - tw1 / 2, pay_y - 5); ctx.show_text(p1)
    ctx.move_to(pay_x - tw2 / 2, pay_y + 14); ctx.show_text(p2)

    # ===== Helper: actor-to-UC association =====
    def a2u(ak, uk, col=BLACK):
        fx, fy = ft[ak]
        cx, cy = ucs[uk]; ry = rh[uk]
        ex, ey, _ = ept(cx, cy, UC_RX, ry, fx, fy)
        sline(ctx, fx, fy, ex, ey, col, 1.3)

    # ===== ASSOCIATIONS =====
    a2u("visitor", "catalog")
    a2u("visitor", "builder")
    a2u("client", "order")
    a2u("client", "track")
    a2u("client", "service")
    a2u("manager", "catalog_mgmt")
    a2u("manager", "order_mgmt")
    a2u("master", "repair")
    a2u("admin", "users")
    a2u("admin", "admin_sys")

    # Payment -> payment UC
    ex, ey, ea = ept(ucs["payment"][0], ucs["payment"][1], UC_RX, rh["payment"],
                     pay_x - pw / 2, pay_y)
    sline(ctx, pay_x - pw / 2, pay_y, ex, ey, BLACK, 1.3)
    arr(ctx, ex, ey, ea, BLACK)

    # ===== GENERALIZATIONS =====
    def gen_arrow(off_x, child_key, parent_key):
        _, cy_child = ft[child_key]
        _, cy_parent = ft[parent_key]
        y1 = cy_child - 44
        y2 = cy_parent + 14
        # line + arrowhead
        sline(ctx, off_x, y1, off_x, y2, GRAY, 2.0)
        arr_v(ctx, off_x, y2, GRAY, 2.0, empty=True)
        lbl(ctx, off_x + 10, (y1 + y2) / 2, "extends", GRAY)

    gen_arrow(440, "client",  "visitor")
    gen_arrow(500, "manager", "staff")
    gen_arrow(560, "master",  "staff")

    # ===== INCLUDE / EXTEND =====
    def u2u(k1, k2, col, txt):
        c1x, c1y = ucs[k1]; c2x, c2y = ucs[k2]
        x1, y1, angle1 = ept(c1x, c1y, UC_RX, rh[k1], c2x, c2y)
        x2, y2, angle2 = ept(c2x, c2y, UC_RX, rh[k2], c1x, c1y)
        # Draw dashed line from edge of UC1 to edge of UC2 (stop 3px before edge)
        tx = x2 - 3 * math.cos(angle2)
        ty = y2 - 3 * math.sin(angle2)
        sline(ctx, x1, y1, tx, ty, col, 1.3, dash=True)
        # Filled arrow at UC2 edge
        arr(ctx, x2, y2, angle2, col)
        # Label
        mx = (x1 + tx) / 2
        my = (y1 + ty) / 2
        lbl(ctx, mx, my - 10, txt, col)

    u2u("order", "payment", INC, "\u00abinclude\u00bb")
    u2u("order", "auth", INC, "\u00abinclude\u00bb")
    u2u("track", "auth", INC, "\u00abinclude\u00bb")
    u2u("service", "auth", INC, "\u00abinclude\u00bb")

    # extend: cart -> order (manual routing to avoid text crossing)
    c1x, c1y = ucs["cart"]; c2x, c2y = ucs["order"]
    # Route from top of cart to bottom of order
    sx1 = c1x; sy1 = c1y - rh["cart"]
    tx2 = c2x; ty2 = c2y + rh["order"] + 3
    sline(ctx, sx1, sy1, tx2, ty2, EXT, 1.3, dash=True)
    arr(ctx, tx2, c2y + rh["order"], -math.pi / 2, EXT)
    lbl(ctx, sx1 + 55, (sy1 + ty2) / 2, "\u00abextend\u00bb", EXT)

    out = "docs/practice-14/use-case-diagram.png"
    s.write_to_png(out)
    print(f"OK: {out} ({os.path.getsize(out):,} bytes)")

main()
