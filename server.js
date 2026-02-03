<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SystemSync - Advanced Controller</title>
    <style>
        /* Dark Theme Setup */
        body { 
            font-family: 'Segoe UI', sans-serif; 
            background: #121212; 
            color: white; 
            text-align: center; 
            margin: 0; padding: 20px; 
        }

        /* Device Status Bar */
        .status-container {
            background: #1e1e1e;
            display: inline-flex;
            align-items: center;
            padding: 10px 20px;
            border-radius: 30px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .status-dot {
            height: 12px; width: 12px;
            background-color: #555;
            border-radius: 50%;
            margin-right: 10px;
            transition: all 0.3s ease;
        }
        .online { background-color: #00ff00; box-shadow: 0 0 10px #00ff00; }
        .offline { background-color: #ff0000; box-shadow: 0 0 5px #ff0000; }
        #status-text { font-weight: bold; color: #aaa; }

        /* Phone Screen Container */
        #screen-wrapper { 
            width: 320px; height: 600px; 
            background: #000; 
            margin: 0 auto 20px; 
            border: 8px solid #333; 
            border-radius: 20px; 
            overflow: hidden; 
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            display: flex; align-items: center; justify-content: center;
        }
        /* We use an IMG tag because it's smoother for MJPEG-style streams */
        #display { 
            width: 100%; height: 100%; 
            object-fit: contain; 
            display: block;
        }

        /* Button Grid */
        .controls { 
            display: flex; 
            flex-wrap: wrap; 
            justify-content: center; 
            gap: 12px; 
            max-width: 400px; 
            margin: 0 auto; 
        }
        button { 
            padding: 12px 18px; 
            font-size: 14px; 
            cursor: pointer; 
            border: none; 
            border-radius: 8px; 
            font-weight: 600; 
            color: white; 
            flex: 1 1 120px;
            transition: transform 0.1s, opacity 0.2s;
        }
        button:active { transform: scale(0.96); }

        /* Button Colors */
        .btn-start { background: #27ae60; }
        .btn-stop { background: #c0392b; }
        .btn-shot { background: #2980b9; }
        .btn-record { background: #f39c12; }
        
        /* Recording Pulse Animation */
        .recording-active { 
            background: #e74c3c !important; 
            animation: pulse 1.5s infinite; 
        }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }

        /* Hidden canvas for recording processing */
        #hidden-canvas { display: none; }
    </style>
</head>
<body>

    <h2>SystemSync Monitor</h2>

    <div class="status-container">
        <span id="status-dot" class="status-dot"></span>
        <span id="status-text">Connecting...</span>
    </div>

    <div id="screen-wrapper">
        <img id="display" src="" alt="Waiting for stream..." />
    </div>

    <canvas id="hidden-canvas"></canvas>

    <div class="controls">
        <button id="toggleBtn" class="btn-start" onclick="toggleScreen()">START SCREEN</button>
        <button class="btn-shot" onclick="takeScreenshot()">SCREENSHOT</button>
        <button id="recordBtn" class="btn-record" onclick="toggleRecording()">START RECORDING</button>
    </div>

    <script>
        // --- CONFIGURATION ---
        const WS_URL = "wss://mirror-view.onrender.com"; // Change to your Render URL
        
        // --- VARIABLES ---
        const imgDisplay = document.getElementById('display');
        const canvas = document.getElementById('hidden-canvas');
        const ctx = canvas.getContext('2d');
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        const toggleBtn = document.getElementById('toggleBtn');
        const recordBtn = document.getElementById('recordBtn');

        let ws;
        let isStreaming = false;
        let isRecording = false;
        let mediaRecorder;
        let recordedChunks = [];
        let drawInterval;

        // --- WEBSOCKET CONNECTION ---
        function connect() {
            ws = new WebSocket(WS_URL);

            ws.onopen = () => {
                console.log("Connected to WebSocket");
                ws.send("I_AM_WEB"); // Identify ourselves
                statusText.innerText = "Waiting for Device...";
            };

            ws.onmessage = (event) => {
                const msg = event.data;

                // A. Handle Status Updates (Online/Offline)
                if (msg.startsWith("STATUS:")) {
                    updateStatus(msg.split(":")[1]);
                }
                
                // B. Handle Video Frames
                else if (msg.startsWith("FRAME:")) {
                    const base64 = msg.split("FRAME:")[1];
                    imgDisplay.src = "data:image/jpeg;base64," + base64;
                    
                    // If recording, draw this frame to the hidden canvas
                    if (isRecording) {
                        drawFrameToCanvas();
                    }
                }
            };

            ws.onclose = () => {
                updateStatus("OFFLINE");
                statusText.innerText = "Disconnected (Retrying...)";
                setTimeout(connect, 3000); // Auto-reconnect
            };
        }

        function updateStatus(status) {
            if (status === "ONLINE") {
                statusDot.className = "status-dot online";
                statusText.innerText = "Device Online";
                statusText.style.color = "#2ecc71";
            } else {
                statusDot.className = "status-dot offline";
                statusText.innerText = "Device Offline";
                statusText.style.color = "#e74c3c";
                // Reset buttons if device dies
                if (isStreaming) toggleScreen(); 
                if (isRecording) toggleRecording();
            }
        }

        // --- BUTTON FUNCTION 1: START/STOP SCREEN ---
        function toggleScreen() {
            if (!ws || ws.readyState !== WebSocket.OPEN) {
                alert("Server not connected.");
                return;
            }

            if (!isStreaming) {
                ws.send("START_SCREEN");
                toggleBtn.innerText = "STOP SCREEN";
                toggleBtn.className = "btn-stop";
                isStreaming = true;
            } else {
                ws.send("STOP_SCREEN");
                toggleBtn.innerText = "START SCREEN";
                toggleBtn.className = "btn-start";
                imgDisplay.src = ""; // Clear screen
                isStreaming = false;
            }
        }

        // --- BUTTON FUNCTION 2: SCREENSHOT ---
        function takeScreenshot() {
            if (!imgDisplay.src || imgDisplay.src.length < 100) {
                alert("No video feed active!");
                return;
            }

            const link = document.createElement('a');
            link.download = `screenshot_${getTimestamp()}.png`;
            link.href = imgDisplay.src;
            link.click();
        }

        // --- BUTTON FUNCTION 3: VIDEO RECORDING ---
        function toggleRecording() {
            if (!isRecording) {
                startRecording();
            } else {
                stopRecording();
            }
        }

        function startRecording() {
            if (!imgDisplay.src || imgDisplay.src.length < 100) {
                alert("Start the screen stream first!");
                return;
            }

            // Prepare canvas dimensions to match the video
            canvas.width = imgDisplay.naturalWidth || 360;
            canvas.height = imgDisplay.naturalHeight || 640;

            const stream = canvas.captureStream(25); // 25 FPS
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
            recordedChunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) recordedChunks.push(e.data);
            };

            mediaRecorder.onstop = saveVideoFile;

            mediaRecorder.start();
            isRecording = true;
            
            // Visual updates
            recordBtn.innerText = "STOP RECORDING";
            recordBtn.classList.add('recording-active');
        }

        function stopRecording() {
            if (!mediaRecorder) return;
            mediaRecorder.stop();
            isRecording = false;
            
            // Visual updates
            recordBtn.innerText = "START RECORDING";
            recordBtn.classList.remove('recording-active');
        }

        // Helper: Copy the IMG tag to CANVAS so MediaRecorder can grab it
        function drawFrameToCanvas() {
            if (isRecording) {
                ctx.drawImage(imgDisplay, 0, 0, canvas.width, canvas.height);
            }
        }

        function saveVideoFile() {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `recording_${getTimestamp()}.webm`;
            a.click();
        }

        // Utility: Timestamp for filenames
        function getTimestamp() {
            const now = new Date();
            return now.toISOString().replace(/[:.]/g, '-');
        }

        // Start connection on load
        connect();

    </script>
</body>
</html>
