<?php
require_once dirname(__DIR__) . '/src/bootstrap.php';
if (current_user()) { header('Location: index.php'); exit; }
$error='';
if ($_SERVER['REQUEST_METHOD']==='POST') {
 verify_csrf(); rate_limit('login',8,300);
 $username=trim((string)($_POST['username']??'')); $password=(string)($_POST['password']??'');
 $q=db()->prepare('SELECT id,username,password_hash,role FROM hj_users WHERE username=? LIMIT 1'); $q->execute([$username]); $u=$q->fetch();
 if ($u && password_verify($password,$u['password_hash'])) {
  session_regenerate_id(true); $_SESSION['hj_user']=['id'=>(int)$u['id'],'username'=>$u['username'],'role'=>$u['role']];
  header('Location: index.php'); exit;
 }
 $error='Invalid username or password.';
}
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sign in | Ja1lbreåk</title><link rel="stylesheet" href="assets/app.css"><link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#ed263e"><link rel="icon" type="image/png" href="assets/icons/icon-192.png"><link rel="apple-touch-icon" href="assets/icons/apple-touch-icon.png"></head><body class="auth"><form class="authbox" method="post"><div class="brand center"><span class="mark">H</span><span><b>H.OL.L.Y.W.O.O.D.</b><small>JA1LBREÅK // 285 GARAGE</small></span></div><h1>Secure <em>Access</em></h1><input type="hidden" name="csrf" value="<?=e(csrf_token())?>"><label>USERNAME<input name="username" required autocomplete="username"></label><label>PASSWORD<input type="password" name="password" required autocomplete="current-password"></label><?php if($error):?><p class="error"><?=e($error)?></p><?php endif;?><button class="primary">SIGN IN ↗</button></form></body></html>
