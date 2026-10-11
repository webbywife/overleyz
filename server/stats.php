<?php
// overleyz counts: anonymous daily totals only. No cookies, no IP addresses, no visitor IDs, never what
// people write or make. Every event and key is from a fixed list, so the table can't grow without bound.
declare(strict_types=1);

const OVZ_DATA = __DIR__ . '/../../overleyz-data';          // outside the repo and the web root
const OVZ_KEEP_DAYS = 400;
const OVZ_MOODS = ['hopeful', 'heartbroken', 'grateful', 'in-love', 'tired', 'brave', 'wanderlust', 'letting-go', 'growing', 'friends',
    'calm', 'anxious', 'lonely', 'proud', 'excited', 'nostalgic'];
const OVZ_EVENTS = [
    'visit'    => ['studio', 'about', 'note'],
    'visitor'  => [''],                                      // first visit of the day on that device (flag kept on the device)
    'from'     => ['direct', 'tiktok', 'instagram', 'facebook', 'messenger', 'google', 'leyzays', 'other'],
    'device'   => ['phone', 'computer'],
    'checkin'  => OVZ_MOODS,
    'vibe'     => ['soft', 'blush', 'loud'],
    'save'     => ['soft', 'loud'],
    'share'    => ['soft', 'loud'],
    'reel'     => ['soft', 'loud'],
    'caption'  => ['copied'],
    'note'     => ['sent', 'opened'],
    'surprise' => [''],
];

function ovz_db(): PDO {
    if (!is_dir(OVZ_DATA)) mkdir(OVZ_DATA, 0700, true);
    $db = new PDO('sqlite:' . OVZ_DATA . '/stats.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout = 3000');
    $db->exec('CREATE TABLE IF NOT EXISTS counts (day TEXT NOT NULL, event TEXT NOT NULL, key TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, event, key))');
    return $db;
}

function ovz_today(): string {
    return (new DateTimeImmutable('now', new DateTimeZone('Asia/Manila')))->format('Y-m-d');
}

function ovz_count(PDO $db, string $event, string $key): void {
    $st = $db->prepare('INSERT INTO counts (day, event, key, n) VALUES (?, ?, ?, 1) ON CONFLICT (day, event, key) DO UPDATE SET n = n + 1');
    $st->execute([ovz_today(), $event, $key]);
}

function ovz_prune(PDO $db): void {
    $cut = (new DateTimeImmutable('now', new DateTimeZone('Asia/Manila')))->modify('-' . OVZ_KEEP_DAYS . ' days')->format('Y-m-d');
    $db->prepare('DELETE FROM counts WHERE day < ?')->execute([$cut]);
}
