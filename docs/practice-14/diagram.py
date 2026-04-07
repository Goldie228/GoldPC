#!/usr/bin/env python3
"""UML Use Case diagram with Cairo. Pixel-perfect control."""
import cairo, math, os

W, H = 2800, 1950

BLACK   = (0.1, 0.1, 0.1)
DKGRAY  = (0.22, 0.22, 0.22)
GRAY    = (0.55, 0.55, 0.55)
UC_FILL = (0.91, 0.95, 0.98)
UC_STR  = (0.18, 0.40, 0.72)
INC_CLR = (0.0, 0.33, 0.72)
EXT_CLR = (0.78, 0.33, 0.0)
BDY_CLR = (0.44, 0.44, 0.44)
WHITE   = (1.0, 1.0, 1.0)

UC_RX = 110
UC_FH = 52  # full height of use case ellipse

def draw_uc(ctx, cx, cy, text_lines):
    """Draw a single use-case ellipse with text. Returns ry."""
    n = len(text_lines)
    ry = max(UC_FH // 2, n * 13)

    # Fill
    ctx.set_source_rgb(*UC_FILL)
    ctx.new_path(); ctx.save(); ctx.translate(cx, cy); ctx.scale(UC_RX / ry, 1)
    ctx.arc(0, 0, ry, 0, 2 * math.pi)
    ctx.restore(); ctx.fill()

    # Stroke
    ctx.set_source_rgb(*UC_STR); ctx.set_line_width(1.6)
    ctx.new_path(); ctx.save(); ctx.translate(cx, cy); ctx.scale(UC_RX / ry, 1)
    ctx.arc(0, 0, ry, 0, 2 * math.pi)
    ctx.restore(); ctx.stroke()

    # Text - centered
    ctx.set_source_rgb(*BLACK)
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(14)
    total_lines = n * 19
    y0 = cy - total_lines / 2 + 15
    for i, ln in enumerate(text_lines):
        ext = ctx.text_extents(ln)
        tw = ext.width
        ctx.move_to(cx - tw / 2, y0 + i * 19)
        ctx.show_text(ln)
    return ry

def ellipse_edge(cx, cy, rx, ry, tx, ty):
    """Find point on ellipse perimeter towards target."""
    a = math.atan2(ty - cy, tx - cx)
    denom = math.sqrt((math.cos(a) / rx) ** 2 + (math.sin(a) / ry) ** 2)
    if denom < 1e-10:
        return cx, cy, a
    r = 1.0 / denom
    return cx + r * math.cos(a), cy + r * math.sin(a), a

def line(ctx, x1, y1, x2, y2, col, w=1.2, dash=False):
    """Draw a line with optional dashes and arrow."""
    ctx.set_source_rgb(*col); ctx.set_line_width(w)
    ctx.set_dash([8, 5] if dash else [])
    ctx.move_to(x1, y1); ctx.line_to(x2, y2); ctx.stroke()

def arrowhead(ctx, tx, ty, angle, col, w=1.3, empty=False):
    """Draw an arrow head at the target point."""
    ctx.set_dash([]); ctx.set_line_width(2.2 if empty else w)
    ctx.set_source_rgb(*col)
    sz = 14; half = 0.42
    x1 = tx - sz * math.cos(angle - half); y1 = ty - sz * math.sin(angle - half)
    x2 = tx - sz * math.cos(angle + half); y2 = ty - sz * math.sin(angle + half)
    ctx.move_to(x1, y1); ctx.line_to(tx, ty); ctx.line_to(x2, y2)
    if empty:
        ctx.line_to(x1 + (x2 - x1) * 0.3, y1 + (y2 - y1) * 0.3)
        ctx.close_path()
    ctx.stroke()

def label(ctx, mx, my, txt, col):
    """Draw italic label with white background."""
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_ITALIC, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(11)
    ext = ctx.text_extents(txt)
    tw, th = ext.width, ext.height

    ctx.set_source_rgb(*WHITE)
    ctx.rectangle(mx - tw / 2 - 6, my - th / 2 - 5, tw + 12, th + 10)
    ctx.fill()

    ctx.set_source_rgb(*col)
    ctx.move_to(mx - tw / 2, my + th * 0.35)
    ctx.show_text(txt)

def draw_stick(ctx, ax, ay):
    """Draw stick figure. Returns (head_y, feet_y, feet_bottom_y)."""
    ctx.set_source_rgb(*BLACK)
    ctx.set_line_width(2.2); ctx.set_dash([])
    r = 10
    head_y = ay + r + 2
    ctx.arc(ax, head_y, r, 0, 2 * math.pi)
    ctx.stroke()
    body_top = head_y + r + 2
    body_bot = body_top + 28
    ctx.move_to(ax, body_top); ctx.line_to(ax, body_bot); ctx.stroke()
    arm_y = body_top + 7; aw = 18
    ctx.move_to(ax - aw, arm_y); ctx.line_to(ax + aw, arm_y); ctx.stroke()
    ll, lw = 20, 12
    ctx.move_to(ax, body_bot); ctx.line_to(ax - lw, body_bot + ll); ctx.stroke()
    ctx.move_to(ax, body_bot); ctx.line_to(ax + lw, body_bot + ll); ctx.stroke()
    feet_y = body_bot + ll + 5
    return head_y, feet_y

def main():
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)

    # Background
    ctx.set_source_rgb(1, 1, 1)
    ctx.paint()

    # ================================
    # SYSTEM BOUNDARY
    # ================================
    bx, by, bw, bh = 500, 50, 1700, 1830
    ctx.set_source_rgb(*DKGRAY)
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(15)
    title = "GoldPC \u2014 \u043a\u043e\u043c\u043f\u044c\u044e\u0442\u0435\u0440\u043d\u044b\u0439 \u043c\u0430\u0433\u0430\u0437\u0438\u043d \u0441 \u0441\u0435\u0440\u0432\u0438\u0441\u043d\u044b\u043c \u0446\u0435\u043d\u0442\u0440\u043e\u043c"
    ext = ctx.text_extents(title)
    ctx.move_to(bx + (bw - ext.width) / 2, by + 24)
    ctx.show_text(title)

    # Dashed border
    ctx.set_source_rgb(*BDY_CLR); ctx.set_line_width(1.8); ctx.set_dash([10, 5])
    ctx.rectangle(bx, by, bw, bh)
    ctx.stroke(); ctx.set_dash([])

    # ================================
    # USE CASES - positions (4 columns)
    # ================================
    left_x  = bx + 240  # col 0 - visitor-facing
    mid_x   = bx + 620  # col 1 - order-related
    svc_x   = bx + 1000 # col 2 - service/auth
    staff_x = bx + 1400 # col 3 - staff functions

    uc_positions = {
        "catalog":      (left_x, 155),
        "builder":      (left_x, 400),
        "order":        (mid_x,  340),
        "cart":         (mid_x,  640),
        "payment":      (mid_x,  920),
        "track":        (mid_x, 1160),
        "service":      (svc_x,  740),
        "auth":         (svc_x, 1060),
        "catalog_mgmt": (staff_x, 200),
        "order_mgmt":   (staff_x, 460),
        "repair":       (staff_x, 710),
        "users":        (staff_x, 970),
        "admin_sys":    (staff_x,1160),
    }
    uc_texts = {
        "catalog":      ["\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u043a\u0430\u0442\u0430\u043b\u043e\u0433\u0430", "\u0442\u043e\u0432\u0430\u0440\u043e\u0432"],
        "builder":      ["\u0418\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0438\u0435", "\u043a\u043e\u043d\u0444\u0438\u0433\u0443\u0440\u0430\u0442\u043e\u0440\u0430 \u041f\u041a"],
        "order":        ["\u041e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435", "\u0437\u0430\u043a\u0430\u0437\u0430"],
        "cart":         ["\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u0435", "\u043a\u043e\u0440\u0437\u0438\u043d\u044b"],
        "payment":      ["\u041e\u043f\u043b\u0430\u0442\u0430", "\u0437\u0430\u043a\u0430\u0437\u0430"],
        "track":        ["\u041e\u0442\u0441\u043b\u0435\u0436\u0438\u0432\u0430\u043d\u0438\u0435", "\u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u0437\u0430\u043a\u0430\u0437\u0430"],
        "service":      ["\u041f\u043e\u0434\u0430\u0447\u0430 \u0437\u0430\u044f\u0432\u043a\u0438", "\u0432 \u0441\u0435\u0440\u0432\u0438\u0441\u043d\u044b\u0439 \u0446\u0435\u043d\u0442\u0440"],
        "auth":         ["\u0410\u0443\u0442\u0435\u043d\u0442\u0438\u0444\u0438\u043a\u0430\u0446\u0438\u044f", "\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f"],
        "catalog_mgmt": ["\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435", "\u043a\u0430\u0442\u0430\u043b\u043e\u0433\u043e\u043c"],
        "order_mgmt":   ["\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435", "\u0437\u0430\u043a\u0430\u0437\u0430\u043c\u0438"],
        "repair":       ["\u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0438\u0435", "\u0440\u0435\u043c\u043e\u043d\u0442\u043d\u044b\u0445 \u0440\u0430\u0431\u043e\u0442"],
        "users":        ["\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435", "\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f\u043c\u0438"],
        "admin_sys":    ["\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435", "\u0441\u0438\u0441\u0442\u0435\u043c\u044b"],
    }

    rh = {}
    for key, (cx, cy) in uc_positions.items():
        rh[key] = draw_uc(ctx, cx, cy, uc_texts[key])

    # ================================
    # ACTORS (LEFT)
    # ================================
    actor_x = 260
    actors = [
        ("visitor", actor_x, 140,  "\u041f\u043e\u0441\u0435\u0442\u0438\u0442\u0435\u043b\u044c"),
        ("client",  actor_x, 560,  "\u041a\u043b\u0438\u0435\u043d\u0442"),
        ("staff",   actor_x, 960,  "\u0421\u043e\u0442\u0440\u0443\u0434\u043d\u0438\u043a"),
        ("manager", actor_x, 1150, "\u041c\u0435\u043d\u0435\u0434\u0436\u0435\u0440"),
        ("master",  actor_x, 1360, "\u041c\u0430\u0441\u0442\u0435\u0440"),
        ("admin",   actor_x, 1560, "\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440"),
    ]
    actor_data = {}
    for name, ax, ay, label_text in actors:
        _, feet_y = draw_stick(ctx, ax, ay)
        ctx.set_source_rgb(*BLACK)
        ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
        ctx.set_font_size(13)
        ext = ctx.text_extents(label_text)
        ctx.move_to(ax - ext.width / 2, feet_y + 6)
        ctx.show_text(label_text)
        # Store actor center as middle of body (~head_y + body_length/2)
        actor_data[name] = {"ax": ax, "feet_y": feet_y, "center_y": ay + 30}

    # ================================
    # PAYMENT SYSTEM (RIGHT)
    # ================================
    pay_x = bx + bw + 170
    pay_y = uc_positions["payment"][1]
    pw, ph = 140, 60
    ctx.set_source_rgb(*BLACK); ctx.set_line_width(1.5); ctx.set_dash([])
    ctx.rectangle(pay_x - pw / 2, pay_y - ph / 2, pw, ph); ctx.stroke()
    ctx.select_font_face("sans-serif", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    ctx.set_font_size(12)
    p1, p2 = "\u041f\u043b\u0430\u0442\u0451\u0436\u043d\u0430\u044f", "\u0441\u0438\u0441\u0442\u0435\u043c\u0430"
    ext1 = ctx.text_extents(p1)
    ext2 = ctx.text_extents(p2)
    ctx.move_to(pay_x - ext1.width / 2, pay_y - 5); ctx.show_text(p1)
    ctx.move_to(pay_x - ext2.width / 2, pay_y + 14); ctx.show_text(p2)

    # ================================
    # ASSOCIATIONS: actors -> UCs
    # ================================
    def actor_to_uc(ak, uk, col=BLACK):
        ax = actor_data[ak]["ax"]
        fy = actor_data[ak]["feet_y"]
        cx, cy = uc_positions[uk]; ry = rh[uk]
        ex, ey, _ = ellipse_edge(cx, cy, UC_RX, ry, ax, fy)
        line(ctx, ax, fy, ex, ey, col, 1.3)

    # Visitor
    actor_to_uc("visitor", "catalog")
    actor_to_uc("visitor", "builder")
    # Client
    actor_to_uc("client", "order")
    actor_to_uc("client", "track")
    actor_to_uc("client", "service")
    # Manager
    actor_to_uc("manager", "catalog_mgmt")
    actor_to_uc("manager", "order_mgmt")
    # Master
    actor_to_uc("master", "repair")
    # Admin
    actor_to_uc("admin", "users")
    actor_to_uc("admin", "admin_sys")

    # Payment system -> payment
    ex, ey, ea = ellipse_edge(uc_positions["payment"][0], uc_positions["payment"][1],
                               UC_RX, rh["payment"], pay_x - pw / 2, pay_y)
    line(ctx, pay_x - pw / 2, pay_y, ex, ey, BLACK, 1.3)
    arrowhead(ctx, ex, ey, ea, BLACK)

    # ================================
    # GENERALIZATION arrows (vertical, left side)
    # ================================
    def gen_arrow(x_offset, child, parent):
        child_fy = actor_data[child]["feet_y"]
        parent_cy = actor_data[parent]["center_y"]
        y1 = child_fy - 48   # start below child's head
        y2 = parent_cy + 24  # end above parent's feet

        # Draw solid line
        line(ctx, x_offset, y1, x_offset, y2, GRAY, 2.0)
        # Draw empty triangle at parent end (pointing up)
        arrowhead(ctx, x_offset, y2, -math.pi / 2, GRAY, 2.0, empty=True)
        # Label
        label(ctx, x_offset + 12, (y1 + y2) / 2, "extends", GRAY)

    gen_arrow(420, "client",  "visitor")
    gen_arrow(490, "manager", "staff")
    gen_arrow(560, "master",  "staff")

    # ================================
    # INCLUDE / EXTEND between UCs
    # ================================
    def uc_to_uc(k1, k2, col, label_text, label_dx=0, label_dy=-10):
        c1x, c1y = uc_positions[k1]; c2x, c2y = uc_positions[k2]
        x1, y1, _ = ellipse_edge(c1x, c1y, UC_RX, rh[k1], c2x, c2y)
        x2, y2, a = ellipse_edge(c2x, c2y, UC_RX, rh[k2], c1x, c1y)
        tx = x2 - 3 * math.cos(a); ty = y2 - 3 * math.sin(a)

        line(ctx, x1, y1, tx, ty, col, 1.3, dash=True)
        arrowhead(ctx, x2, y2, a, col)
        label(ctx, (x1 + tx) / 2 + label_dx, (y1 + ty) / 2 + label_dy, label_text, col)

    uc_to_uc("order",   "payment", INC_CLR, "\u00abinclude\u00bb", label_dx=40)
    uc_to_uc("order",   "auth",    INC_CLR, "\u00abinclude\u00bb", label_dx=45)
    uc_to_uc("track",   "auth",    INC_CLR, "\u00abinclude\u00bb", label_dx=35)
    uc_to_uc("service", "auth",    INC_CLR, "\u00abinclude\u00bb", label_dx=35)

    # Extend: cart -> order (manual vertical routing)
    c1x, c1y = uc_positions["cart"]; c2x, c2y = uc_positions["order"]
    sx1 = c1x; sy1 = c1y - rh["cart"]
    tx2 = c2x; ty2 = c2y + rh["order"]
    line(ctx, sx1, sy1, tx2, ty2 - 3, EXT_CLR, 1.3, dash=True)
    arrowhead(ctx, tx2, ty2, -math.pi / 2, EXT_CLR)
    label(ctx, sx1 + 70, (sy1 + ty2) / 2, "\u00abextend\u00bb", EXT_CLR)

    # ================================
    # SAVE
    # ================================
    out = "docs/practice-14/use-case-diagram.png"
    surf.write_to_png(out)
    print(f"OK: {os.path.getsize(out):,} bytes")

main()
