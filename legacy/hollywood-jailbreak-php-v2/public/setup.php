<?php
require_once dirname(__DIR__) . '/src/bootstrap.php';
$count=(int)db()->query('SELECT COUNT(*) FROM hj_users')->fetchColumn();
if ($count>0) { http_response_code(403); exit('Setup is locked because an account already exists. Delete setup.php.'); }
$error='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
 verify_csrf(); $username=trim((string)($_POST['username']??'')); $password=(string)($_POST['password']??'');
 if (!preg_match('/^[A-Za-z0-9_.-]{3,80}$/',$username)) $error='Use 3–80 letters, numbers, dots, underscores or hyphens.';
 elseif (strlen($password)<14) $error='Use a password with at least 14 characters.';
 else { $q=db()->prepare('INSERT INTO hj_users(username,password_hash,role) VALUES(?,?,?)'); $q->execute([$username,password_hash($password,PASSWORD_DEFAULT),'admin']); header('Location: login.php'); exit; }
}
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>First Admin Setup</title><link rel="stylesheet" href="assets/app.css"></head><body class="auth"><form class="authbox" method="post"><h1>Initial <em>Setup</em></h1><p class="muted">Create the first administrator account. Delete setup.php after completion.</p><input type="hidden" name="csrf" value="<?=e(csrf_token())?>"><label>ADMIN USERNAME<input name="username" required minlength="3" maxlength="80"></label><label>STRONG PASSWORD<input type="password" name="password" required minlength="14"></label><?php if($error):?><p class="error"><?=e($error)?></p><?php endif;?><button class="primary">CREATE ADMIN ↗</button></form></body></html>
