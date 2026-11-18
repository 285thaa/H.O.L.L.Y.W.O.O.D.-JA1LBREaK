<?php
declare(strict_types=1);

return [
    'db' => [
        'host' => '127.0.0.1',
        'name' => 'YOUR_DATABASE',
        'user' => 'YOUR_DB_USER',
        'pass' => 'CHANGE_ME',
        'charset' => 'utf8mb4',
    ],
    'app' => [
        'name' => 'H.OL.L.Y.W.O.O.D. Ja1lbreåk',
        'base_path' => '', // e.g. /tools/hollywood-jailbreak
        'app_key' => 'REPLACE_WITH_AT_LEAST_32_RANDOM_CHARACTERS',
        'session_name' => 'HJ285SESSID',
    ],
    'ai' => [
        'enabled' => false,
        'base_url' => 'https://api.openai.com/v1',
        'model' => 'gpt-4.1-mini',
        'api_key' => '',
        'timeout' => 45,
    ],
];
