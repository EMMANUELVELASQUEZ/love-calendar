<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$path   = $_GET['action'] ?? '';
$input  = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($path) {

    // ── EVENTS ──────────────────────────────────────────────
    case 'get_events':
        $month = $_GET['month'] ?? date('m');
        $year  = $_GET['year']  ?? date('Y');
        $stmt  = $pdo->prepare(
            "SELECT * FROM events WHERE strftime('%m', date) = :m AND strftime('%Y', date) = :y ORDER BY date, time"
        );
        $stmt->execute([':m' => str_pad($month, 2, '0', STR_PAD_LEFT), ':y' => $year]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'get_day_events':
        $date = $_GET['date'] ?? date('Y-m-d');
        $stmt = $pdo->prepare("SELECT * FROM events WHERE date = :date ORDER BY time");
        $stmt->execute([':date' => $date]);
        echo json_encode($stmt->fetchAll());
        break;

    case 'add_event':
        $stmt = $pdo->prepare(
            "INSERT INTO events (title, date, time, description, category, emoji, color)
             VALUES (:title, :date, :time, :desc, :cat, :emoji, :color)"
        );
        $stmt->execute([
            ':title' => $input['title'] ?? 'Sin título',
            ':date'  => $input['date']  ?? date('Y-m-d'),
            ':time'  => $input['time']  ?? null,
            ':desc'  => $input['description'] ?? null,
            ':cat'   => $input['category']    ?? 'love',
            ':emoji' => $input['emoji']       ?? '❤️',
            ':color' => $input['color']       ?? '#e94d7f',
        ]);
        echo json_encode(['id' => $pdo->lastInsertId(), 'success' => true]);
        break;

    case 'update_event':
        $id = (int)($input['id'] ?? 0);
        $stmt = $pdo->prepare(
            "UPDATE events SET title=:title, date=:date, time=:time, description=:desc,
             category=:cat, emoji=:emoji, color=:color WHERE id=:id"
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
        $pdo->prepare("DELETE FROM events WHERE id = :id")->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        break;

    // ── LOVE NOTES ──────────────────────────────────────────
    case 'get_notes':
        $stmt = $pdo->query("SELECT * FROM love_notes ORDER BY created_at DESC LIMIT 50");
        echo json_encode($stmt->fetchAll());
        break;

    case 'add_note':
        $stmt = $pdo->prepare(
            "INSERT INTO love_notes (title, content, date, mood) VALUES (:title, :content, :date, :mood)"
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
        $pdo->prepare("DELETE FROM love_notes WHERE id = :id")->execute([':id' => $id]);
        echo json_encode(['success' => true]);
        break;

    default:
        http_response_code(404);
        echo json_encode(['error' => 'Acción no encontrada']);
}
