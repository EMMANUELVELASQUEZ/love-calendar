<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/vapid.php';
require_once __DIR__ . '/holidays.php';

$path  = $_GET['action'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($path) {

    // ── EVENTS ──────────────────────────────────────────────
    case 'get_events':
        $month = $_GET['month'] ?? date('m');
        $year  = $_GET['year']  ?? date('Y');
        $stmt  = $pdo->prepare(
            "SELECT * FROM events WHERE strftime('%m', date)=:m AND strftime('%Y', date)=:y ORDER BY date, time"
        );
        $stmt->execute([':m' => str_pad($month, 2, '0', STR_PAD_LEFT), ':y' => $year]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'get_day_events':
        $date = $_GET['date'] ?? date('Y-m-d');
        $stmt = $pdo->prepare("SELECT * FROM events WHERE date=:d ORDER BY time");
        $stmt->execute([':d' => $date]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'add_event':
        $stmt = $pdo->prepare(
            "INSERT INTO events (title,date,time,description,category,emoji,color)
             VALUES (:title,:date,:time,:desc,:cat,:emoji,:color)"
        );
        $stmt->execute([
            ':title' => $input['title']       ?? 'Sin título',
            ':date'  => $input['date']        ?? date('Y-m-d'),
            ':time'  => $input['time']        ?? null,
            ':desc'  => $input['description'] ?? null,
            ':cat'   => $input['category']    ?? 'love',
            ':emoji' => $input['emoji']       ?? '❤️',
            ':color' => $input['color']       ?? '#e94d7f',
        ]);
        $newId = $pdo->lastInsertId();
        // Queue same-day push if today
        if (($input['date'] ?? '') === date('Y-m-d')) {
            sendPushToAll($pdo, [
                'title'   => '📅 Nuevo evento para hoy',
                'body'    => ($input['emoji'] ?? '❤️') . ' ' . ($input['title'] ?? ''),
                'vibrate' => [150, 75, 150],
                'tag'     => 'new-event-' . $newId,
                'type'    => 'event',
            ]);
        }
        echo json_encode(['id' => $newId, 'success' => true]);
        break;

    case 'update_event':
        $id = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare(
            "UPDATE events SET title=:title,date=:date,time=:time,description=:desc,
             category=:cat,emoji=:emoji,color=:color WHERE id=:id"
        );
        $stmt->execute([
            ':title' => $input['title']       ?? '',
            ':date'  => $input['date']        ?? date('Y-m-d'),
            ':time'  => $input['time']        ?? null,
            ':desc'  => $input['description'] ?? null,
            ':cat'   => $input['category']    ?? 'love',
            ':emoji' => $input['emoji']       ?? '❤️',
            ':color' => $input['color']       ?? '#e94d7f',
            ':id'    => $id,
        ]);
        echo json_encode(['success' => true]);
        break;

    case 'delete_event':
        $id = (int)($_GET['id'] ?? $input['id'] ?? 0);
        $pdo->prepare("DELETE FROM events WHERE id=:id")->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        break;

    // ── LOVE NOTES ──────────────────────────────────────────
    case 'get_notes':
        $stmt = $pdo->query("SELECT * FROM love_notes ORDER BY created_at DESC LIMIT 50");
        echo json_encode($stmt->fetchAll());
        break;

    case 'add_note':
        $stmt = $pdo->prepare(
            "INSERT INTO love_notes (title,content,date,mood) VALUES (:title,:content,:date,:mood)"
        );
        $stmt->execute([
            ':title'   => $input['title']   ?? 'Mi nota',
            ':content' => $input['content'] ?? '',
            ':date'    => $input['date']    ?? date('Y-m-d'),
            ':mood'    => $input['mood']    ?? 'happy',
        ]);
        echo json_encode(['id' => $pdo->lastInsertId(), 'success' => true]);
        break;

    case 'delete_note':
        $id = (int)($_GET['id'] ?? $input['id'] ?? 0);
        $pdo->prepare("DELETE FROM love_notes WHERE id=:id")->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        break;

    // ── PUSH — VAPID public key ──────────────────────────────
    case 'get_vapid_key':
        try {
            $keys = getVapidKeys($pdo);
            echo json_encode(['publicKey' => $keys['public']]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    // ── PUSH — Subscribe ────────────────────────────────────
    case 'subscribe':
        $endpoint = $input['endpoint']           ?? '';
        $p256dh   = $input['keys']['p256dh']     ?? '';
        $auth     = $input['keys']['auth']        ?? '';

        if (!$endpoint || !$p256dh || !$auth) {
            http_response_code(400);
            echo json_encode(['error' => 'Datos incompletos']);
            break;
        }

        $stmt = $pdo->prepare(
            "INSERT INTO push_subscriptions (endpoint, p256dh, auth)
             VALUES (:ep, :p256dh, :auth)
             ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth"
        );
        $stmt->execute([':ep' => $endpoint, ':p256dh' => $p256dh, ':auth' => $auth]);

        // Welcome notification
        sendPushToEndpoint($pdo, $endpoint, $p256dh, $auth, [
            'title'   => '💖 ¡Notificaciones activadas!',
            'body'    => 'Recibirás recordatorios de eventos y días festivos ✨',
            'vibrate' => [100, 50, 100, 50, 300],
            'tag'     => 'welcome',
            'type'    => 'system',
        ]);

        echo json_encode(['success' => true]);
        break;

    // ── PUSH — Unsubscribe ───────────────────────────────────
    case 'unsubscribe':
        $endpoint = $input['endpoint'] ?? '';
        if ($endpoint) {
            $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint=:ep")->execute([':ep' => $endpoint]);
        }
        echo json_encode(['success' => true]);
        break;

    // ── PUSH — Check notify (called on app open) ─────────────
    case 'check_notify':
        $today    = date('Y-m-d');
        $mmdd     = date('m-d');
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        $notifications = [];

        // Check if already notified today for holidays
        $alreadyHoliday = $pdo->prepare(
            "SELECT id FROM notify_log WHERE log_date=:d AND type='holiday' LIMIT 1"
        );
        $alreadyHoliday->execute([':d' => $today]);
        if (!$alreadyHoliday->fetch()) {
            $holiday = getTodayHoliday();
            if ($holiday) {
                $notifications[] = array_merge($holiday, ['tag' => 'holiday-' . $mmdd, 'type' => 'holiday']);
                $pdo->prepare("INSERT INTO notify_log (log_date, type, ref_id) VALUES (:d,'holiday',:ref)")
                    ->execute([':d' => $today, ':ref' => $mmdd]);
            }
        }

        // Today's personal events (once per event per day)
        $events = $pdo->prepare(
            "SELECT * FROM events WHERE date=:d ORDER BY time"
        );
        $events->execute([':d' => $today]);
        foreach ($events->fetchAll() as $ev) {
            $logKey = 'event-' . $ev['id'];
            $already = $pdo->prepare(
                "SELECT id FROM notify_log WHERE log_date=:d AND type='event' AND ref_id=:ref LIMIT 1"
            );
            $already->execute([':d' => $today, ':ref' => $ev['id']]);
            if (!$already->fetch()) {
                $catVibrate = [
                    'anniversary' => [200,100,200,100,500],
                    'birthday'    => [150,75,150,75,300],
                    'love'        => [100,50,100,50,300],
                    'date'        => [200,100,300],
                    'special'     => [150,100,150,100,400],
                    'important'   => [300,100,300],
                ];
                $notifications[] = [
                    'title'   => $ev['emoji'] . ' ' . $ev['title'],
                    'body'    => $ev['description'] ?: '¡Hoy es un día especial! 💖',
                    'vibrate' => $catVibrate[$ev['category']] ?? [200,100,200],
                    'tag'     => $logKey,
                    'type'    => $ev['category'],
                ];
                $pdo->prepare("INSERT INTO notify_log (log_date,type,ref_id) VALUES (:d,'event',:ref)")
                    ->execute([':d' => $today, ':ref' => $ev['id']]);
            }
        }

        // Tomorrow's events reminder (if app opened after 8pm)
        if ((int)date('H') >= 20) {
            $tmrHoliday = getTomorrowHoliday();
            if ($tmrHoliday) {
                $alreadyTmr = $pdo->prepare(
                    "SELECT id FROM notify_log WHERE log_date=:d AND type='tomorrow_holiday' LIMIT 1"
                );
                $alreadyTmr->execute([':d' => $today]);
                if (!$alreadyTmr->fetch()) {
                    $notifications[] = [
                        'title'   => '📅 Mañana: ' . $tmrHoliday['title'],
                        'body'    => 'Prepárate para mañana 🌙 ' . $tmrHoliday['body'],
                        'vibrate' => [100, 50, 100],
                        'tag'     => 'tomorrow-holiday',
                        'type'    => 'reminder',
                    ];
                    $pdo->prepare("INSERT INTO notify_log (log_date,type,ref_id) VALUES (:d,'tomorrow_holiday',:ref)")
                        ->execute([':d' => $today, ':ref' => date('m-d', strtotime('+1 day'))]);
                }
            }
        }

        // Send all pending notifications
        $sent = 0;
        foreach ($notifications as $notif) {
            $sent += sendPushToAll($pdo, $notif);
        }

        echo json_encode([
            'sent'          => $sent,
            'notifications' => count($notifications),
            'today'         => $today,
        ]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Acción no encontrada']);
}

// ── Push helpers ─────────────────────────────────────────────
function sendPushToAll(PDO $pdo, array $payload): int {
    $subs = $pdo->query("SELECT * FROM push_subscriptions")->fetchAll();
    $sent = 0;
    foreach ($subs as $sub) {
        $ok = sendPushToEndpoint($pdo, $sub['endpoint'], $sub['p256dh'], $sub['auth'], $payload);
        if ($ok) $sent++;
    }
    return $sent;
}

function sendPushToEndpoint(PDO $pdo, string $endpoint, string $p256dh, string $auth, array $payload): bool {
    if (!class_exists('Minishlink\WebPush\WebPush')) {
        $autoload = __DIR__ . '/vendor/autoload.php';
        if (!file_exists($autoload)) return false;
        require_once $autoload;
    }

    try {
        $keys = getVapidKeys($pdo);

        $webPush = new \Minishlink\WebPush\WebPush([
            'VAPID' => [
                'subject'    => 'mailto:emmanuelvelasquez729@gmail.com',
                'publicKey'  => $keys['public'],
                'privateKey' => $keys['private'],
            ],
        ]);

        $subscription = \Minishlink\WebPush\Subscription::create([
            'endpoint' => $endpoint,
            'keys'     => ['auth' => $auth, 'p256dh' => $p256dh],
        ]);

        $report = $webPush->sendOneNotification($subscription, json_encode($payload));

        // Remove expired/invalid subscriptions
        if (!$report->isSuccess()) {
            $reason = $report->getReason();
            if (in_array($report->getResponse()?->getStatusCode() ?? 0, [404, 410])) {
                $pdo->prepare("DELETE FROM push_subscriptions WHERE endpoint=:ep")
                    ->execute([':ep' => $endpoint]);
            }
        }

        return $report->isSuccess();
    } catch (Throwable $e) {
        error_log('Push error: ' . $e->getMessage());
        return false;
    }
}
