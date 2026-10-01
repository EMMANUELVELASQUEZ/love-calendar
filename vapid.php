<?php
/**
 * Generates VAPID keys on first run and persists them in the DB.
 * Returns ['public' => '...', 'private' => '...'] as URL-safe base64.
 */
function getVapidKeys(PDO $pdo): array {
    $stmt = $pdo->query("SELECT key, value FROM settings WHERE key IN ('vapid_public', 'vapid_private')");
    $rows = [];
    foreach ($stmt->fetchAll() as $row) {
        $rows[$row['key']] = $row['value'];
    }

    if (isset($rows['vapid_public'], $rows['vapid_private'])) {
        return ['public' => $rows['vapid_public'], 'private' => $rows['vapid_private']];
    }

    // Generate a new P-256 EC key pair
    $ecKey = openssl_pkey_new([
        'curve_name'        => 'prime256v1',
        'private_key_type'  => OPENSSL_KEYTYPE_EC,
    ]);

    if (!$ecKey) {
        throw new RuntimeException('No se pudo generar la clave EC: ' . openssl_error_string());
    }

    $details    = openssl_pkey_get_details($ecKey);
    $privateKey = $details['ec']['d'];
    $publicKey  = "\x04" . $details['ec']['x'] . $details['ec']['y']; // uncompressed point

    $pub  = rtrim(strtr(base64_encode($publicKey),  '+/', '-_'), '=');
    $priv = rtrim(strtr(base64_encode($privateKey), '+/', '-_'), '=');

    $ins = $pdo->prepare("INSERT INTO settings (key, value) VALUES (:k, :v)");
    $ins->execute([':k' => 'vapid_public',  ':v' => $pub]);
    $ins->execute([':k' => 'vapid_private', ':v' => $priv]);

    return ['public' => $pub, 'private' => $priv];
}
