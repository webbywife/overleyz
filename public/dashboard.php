<?php
// Ley's overleyz dashboard: anonymous totals from server/stats.php, behind a password.
declare(strict_types=1);
require __DIR__ . '/../server/stats.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header("Content-Security-Policy: default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
header('Referrer-Policy: no-referrer');
session_set_cookie_params(['lifetime' => 0, 'path' => '/dashboard.php', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
session_name('ovz_admin');
session_start();

$h = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
$hashFile = OVZ_DATA . '/admin.hash';
$failFile = OVZ_DATA . '/login-fails.json';
$error = '';

if (($_POST['action'] ?? '') === 'logout' && hash_equals($_SESSION['csrf'] ?? '', (string) ($_POST['csrf'] ?? ''))) {
    $_SESSION = []; session_destroy();
    header('Location: dashboard.php'); exit;
}
if (empty($_SESSION['admin']) && ($_POST['action'] ?? '') === 'login') {
    $fails = is_file($failFile) ? (json_decode((string) file_get_contents($failFile), true) ?: []) : [];
    if (($fails['until'] ?? 0) > time()) {
        $error = 'Too many tries. Please wait 15 minutes.';
    } elseif (is_file($hashFile) && password_verify(trim((string) ($_POST['password'] ?? '')), trim((string) file_get_contents($hashFile)))) {
        session_regenerate_id(true);
        $_SESSION['admin'] = true;
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
        @unlink($failFile);
        header('Location: dashboard.php'); exit;
    } else {
        $n = ($fails['n'] ?? 0) + 1;
        file_put_contents($failFile, json_encode($n >= 5 ? ['n' => 0, 'until' => time() + 900] : ['n' => $n]), LOCK_EX);
        usleep(600000);
        $error = 'That password didn’t work.';
    }
}

function page_start(string $title): void { ?>
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title><?= htmlspecialchars($title) ?></title>
<link rel="icon" href="assets/icon.png"><link rel="stylesheet" href="dashboard.css"></head><body>
<header class="top"><img src="assets/logo.webp" alt="overleyz" width="459" height="120"><span>dashboard</span></header>
<?php }

if (empty($_SESSION['admin'])) {
    page_start('overleyz dashboard — sign in'); ?>
<main class="login">
  <form method="post" autocomplete="off">
    <h1>Sign in</h1>
    <label>Password <input type="password" name="password" required autofocus autocomplete="current-password" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
    <input type="hidden" name="action" value="login">
    <?php if ($error): ?><p class="error"><?= $h($error) ?></p><?php endif; ?>
    <button type="submit">Open dashboard</button>
  </form>
</main></body></html>
<?php exit; }

// ---------- numbers ----------
$days = (int) ($_GET['days'] ?? 30);
if (!in_array($days, [7, 30, 90, 365], true)) $days = 30;
$tz = new DateTimeZone('Asia/Manila');
$end = new DateTimeImmutable('now', $tz);
$from = $end->modify('-' . ($days - 1) . ' days')->format('Y-m-d');
$db = ovz_db();
$st = $db->prepare('SELECT day, event, key, n FROM counts WHERE day >= ?');
$st->execute([$from]);
$rows = $st->fetchAll(PDO::FETCH_ASSOC);
$tot = []; $byDay = [];
foreach ($rows as $r) {
    $tot[$r['event']][$r['key']] = ($tot[$r['event']][$r['key']] ?? 0) + (int) $r['n'];
    $byDay[$r['day']][$r['event']] = ($byDay[$r['day']][$r['event']] ?? 0) + (int) $r['n'];
}
$sum = fn ($e) => array_sum($tot[$e] ?? []);
$today = ovz_today();
$dayList = [];
for ($i = $days - 1; $i >= 0; $i--) $dayList[] = $end->modify("-$i days")->format('Y-m-d');

function bars(array $dayList, array $byDay, string $event): string {
    $vals = array_map(fn ($d) => $byDay[$d][$event] ?? 0, $dayList);
    $max = max(1, ...$vals); $n = count($vals); $w = 600; $hgt = 120; $bw = $w / $n;
    $out = "<svg viewBox=\"0 0 $w " . ($hgt + 4) . "\" class=\"chart\" role=\"img\" aria-label=\"daily $event\">";
    foreach ($vals as $i => $v) {
        $bh = $v ? max(2, $v / $max * $hgt) : 0;
        $x = round($i * $bw + $bw * 0.15, 1); $y = round($hgt - $bh, 1);
        $out .= "<rect x=\"$x\" y=\"$y\" width=\"" . round($bw * 0.7, 1) . "\" height=\"" . round($bh, 1) . "\" rx=\"2\"><title>{$dayList[$i]}: $v</title></rect>";
    }
    return $out . "<line x1=\"0\" y1=\"$hgt\" x2=\"$w\" y2=\"$hgt\"/></svg>";
}
function list_bars(array $items, array $labels = []): string {
    arsort($items);
    $max = max(1, ...array_values($items ?: [0]));
    $out = '<ul class="hbars">';
    foreach ($items as $k => $v) {
        $pct = round($v / $max * 100);
        $label = htmlspecialchars($labels[$k] ?? ($k === '' ? '—' : $k));
        $out .= "<li><span>$label</span><svg viewBox=\"0 0 100 10\" preserveAspectRatio=\"none\"><rect width=\"$pct\" height=\"10\" rx=\"2\"/></svg><b>$v</b></li>";
    }
    return $out . ($items ? '' : '<li class="empty">Nothing yet</li>') . '</ul>';
}
$moodLabels = ['hopeful' => 'Hopeful', 'heartbroken' => 'Heartbroken', 'grateful' => 'Grateful', 'in-love' => 'In love', 'tired' => 'Tired, need rest', 'brave' => 'Brave', 'wanderlust' => 'Wanderlust', 'letting-go' => 'Letting go', 'growing' => 'Growing', 'friends' => 'Friends & family',
    'calm' => 'Calm', 'anxious' => 'Anxious', 'lonely' => 'Lonely', 'proud' => 'Proud', 'excited' => 'Excited', 'nostalgic' => 'Nostalgic'];
$fromLabels = ['direct' => 'Typed it / bookmark', 'tiktok' => 'TikTok', 'instagram' => 'Instagram', 'facebook' => 'Facebook', 'messenger' => 'Messenger', 'google' => 'Google', 'leyzays' => 'leyzays site', 'other' => 'Other sites'];
$made = ['save' => 'Saved', 'share' => 'Shared', 'reel' => 'Reels made'];
$madeTot = []; foreach ($made as $e => $l) $madeTot[$l] = $sum($e);

page_start('overleyz dashboard'); ?>
<main class="dash">
  <div class="bar">
    <nav class="range"><?php foreach ([7 => '7 days', 30 => '30 days', 90 => '90 days', 365 => 'Year'] as $d => $l): ?><a href="?days=<?= $d ?>"<?= $d === $days ? ' aria-current="page"' : '' ?>><?= $l ?></a><?php endforeach; ?></nav>
    <form method="post"><input type="hidden" name="action" value="logout"><input type="hidden" name="csrf" value="<?= $h($_SESSION['csrf']) ?>"><button class="ghost">Sign out</button></form>
  </div>
  <section class="kpis">
    <article><b><?= $byDay[$today]['visitor'] ?? 0 ?></b><span>visitors today</span></article>
    <article><b><?= $sum('visitor') ?></b><span>daily visitors, <?= $days ?> days</span></article>
    <article><b><?= $sum('visit') ?></b><span>page views</span></article>
    <article><b><?= $sum('checkin') ?></b><span>check-ins</span></article>
    <article><b><?= $sum('share') + $sum('save') ?></b><span>posts saved or shared</span></article>
    <article><b><?= $sum('reel') ?></b><span>reels made</span></article>
    <article><b><?= $tot['note']['sent'] ?? 0 ?> / <?= $tot['note']['opened'] ?? 0 ?></b><span>notes sent / opened</span></article>
    <article><b><?= ($tot['vibe']['loud'] ?? 0) ?> / <?= ($tot['vibe']['blush'] ?? 0) ?></b><span>switched to LOUD / Blush</span></article>
    <article><b><?= ($tot['caption']['copied'] ?? 0) ?></b><span>captions copied</span></article>
  </section>
  <section class="card"><h2>Visitors each day</h2><?= bars($dayList, $byDay, 'visitor') ?><p class="axis"><span><?= $h($dayList[0]) ?></span><span><?= $h($today) ?></span></p></section>
  <section class="card"><h2>Posts shared each day</h2><?= bars($dayList, $byDay, 'share') ?><p class="axis"><span><?= $h($dayList[0]) ?></span><span><?= $h($today) ?></span></p></section>
  <div class="two">
    <section class="card"><h2>Where visitors came from</h2><?= list_bars($tot['from'] ?? [], $fromLabels) ?></section>
    <section class="card"><h2>How people feel</h2><?= list_bars($tot['checkin'] ?? [], $moodLabels) ?></section>
    <section class="card"><h2>What they made</h2><?= list_bars(array_filter($madeTot)) ?></section>
    <section class="card"><h2>Soft or Loud (shared)</h2><?= list_bars($tot['share'] ?? [], ['soft' => 'Soft', 'loud' => 'LOUD']) ?></section>
    <section class="card"><h2>Pages</h2><?= list_bars($tot['visit'] ?? [], ['studio' => 'Studio', 'about' => 'About', 'note' => 'Opened a note link']) ?></section>
    <section class="card"><h2>Devices</h2><?= list_bars($tot['device'] ?? [], ['phone' => 'Phone', 'computer' => 'Computer']) ?></section>
  </div>
  <p class="fine">Anonymous totals only — no cookies, IP addresses or visitor IDs are kept, and nothing people write or make is ever sent. “Daily visitors” counts each device once per day. Times are Philippine time. Counts older than <?= OVZ_KEEP_DAYS ?> days are deleted.</p>
</main></body></html>
