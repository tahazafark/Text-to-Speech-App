<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get the request body
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate input
        if (!isset($data['text']) || !isset($data['languageCode']) || !isset($data['voiceName'])) {
            throw new Exception('Missing required parameters');
        }

        // Initialize Google Cloud client
        putenv('GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/google-credentials.json');
        
        // Make request to Google Cloud Text-to-Speech API
        $ch = curl_init('https://texttospeech.googleapis.com/v1/text:synthesize');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Bearer ' . getGoogleAccessToken()
        ]);
        
        $requestBody = [
            'input' => ['text' => $data['text']],
            'voice' => [
                'languageCode' => $data['languageCode'],
                'name' => $data['voiceName']
            ],
            'audioConfig' => ['audioEncoding' => 'MP3']
        ];
        
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestBody));
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if ($httpCode !== 200) {
            throw new Exception('Failed to generate speech: ' . $response);
        }
        
        curl_close($ch);
        
        // Send response
        header('Content-Type: audio/mpeg');
        echo base64_decode(json_decode($response, true)['audioContent']);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

function getGoogleAccessToken() {
    // Implement Google OAuth token retrieval here
    // You'll need to use your service account credentials
    return 'YOUR_ACCESS_TOKEN';
}
?> 