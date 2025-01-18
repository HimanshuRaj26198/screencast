const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const video = document.querySelector('video');
const message = document.getElementById('message'); // Assume a <div id="message"></div> for feedback
const sourceList = document.getElementById('sourceList'); // Assume a <ul id="sourceList"></ul> for source options


// Import socket.io-client
const socket = io('http://localhost:5000'); // Connect to backend socket.io server

// Function to populate the screen/window selection list
async function populateSourceList(sources) {
    sourceList.innerHTML = ''; // Clear existing options

    sources.forEach((source, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = source.name;
        listItem.dataset.id = source.id;
        listItem.className = 'source-item'; // Add a class for styling if needed

        // Add click event to select the source
        listItem.addEventListener('click', async () => {
            await selectSource(source);
        });

        sourceList.appendChild(listItem);
    });
}

// Function to select and start screen capture
async function selectSource(selectedSource) {
    try {
        // Get the media stream for the selected source
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: false, // No audio capture
            video: {
                mandatory: {
                    chromeMediaSource: 'desktop',
                    chromeMediaSourceId: selectedSource.id,
                    maxWidth: 1920,
                    maxHeight: 1080,
                    maxFrameRate: 30,
                },
            },
        });

        // Set up MediaRecorder to send video data to the backend
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs="vp8"' // or another supported mime type from the above list
        });

        mediaRecorder.onerror = function (event) {
            console.error('MediaRecorder error:', event);
        };
        console.log(mediaRecorder.mimeType, "MIME TYPE");
        mediaRecorder.ondataavailable = (event) => {
            console.log("media Recorder available");
            // Send video data as binary over socket.io
            socket.emit('screen-stream', event.data);
        };

        mediaRecorder.start(1000); // Start recording with a 1-second interval

        // Set the video source and play
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        message.textContent = `Screen sharing started: ${selectedSource.name}`;
    } catch (error) {
        message.textContent = 'Error capturing display. Please try again.';
        console.error('Error capturing display:', error);
    }
}

// Start screen capture on button click
startButton.addEventListener('click', async () => {
    try {
        // Get sources from the preload script
        const sources = await window.electronAPI.captureScreen();

        if (sources.length === 0) {
            message.textContent = 'No available screens or windows to share.';
            return;
        }

        // Populate the selection list
        await populateSourceList(sources);
        message.textContent = 'Select a screen or window to share.';
    } catch (error) {
        message.textContent = 'Error fetching sources. Please try again.';
        console.error('Error fetching sources:', error);
    }
});

// Stop screen capture on button click
stopButton.addEventListener('click', () => {
    const stream = video.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        video.srcObject = null;
    }
    video.pause();
    message.textContent = 'Screen capture stopped.';
});
