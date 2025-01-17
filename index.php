<?php
header('X-Content-Type-Options: nosniff');
$indexPath = __DIR__ . '/dist/index.html';
if (file_exists($indexPath)) {
    readfile($indexPath);
} else {
    echo "Error: Could not find the application files.";
}
?> 