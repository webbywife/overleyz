<?php
// Receives one anonymous count from the page (navigator.sendBeacon). Accepts only known events and keys.
declare(strict_types=1);
require __DIR__ . '/../server/stats.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
$raw = file_get_contents('php://input', false, null, 0, 512);
$in = json_decode($raw ?: '', true);
if (!is_array($in)) { http_response_code(400); exit; }

$hits = [];
$event = is_string($in['e'] ?? null) ? $in['e'] : '';
$key = is_string($in['k'] ?? null) ? $in['k'] : '';
if (!isset(OVZ_EVENTS[$event]) || !in_array($key, OVZ_EVENTS[$event], true)) { http_response_code(400); exit; }
$hits[] = [$event, $key];
// a page visit may also say "first time today on this device", where the visit came from, and phone or computer
if ($event === 'visit' && ($in['u'] ?? 0) === 1) {
    $hits[] = ['visitor', ''];
    $from = is_string($in['r'] ?? null) ? $in['r'] : 'direct';
    $hits[] = ['from', in_array($from, OVZ_EVENTS['from'], true) ? $from : 'other'];
    $hits[] = ['device', ($in['d'] ?? '') === 'phone' ? 'phone' : 'computer'];
}
try {
    $db = ovz_db();
    $db->beginTransaction();
    foreach ($hits as [$e, $k]) ovz_count($db, $e, $k);
    $db->commit();
    if (random_int(1, 500) === 1) ovz_prune($db);
} catch (Throwable $e) {
    http_response_code(503); exit;    // counting is best-effort; never break the page
}
http_response_code(204);
