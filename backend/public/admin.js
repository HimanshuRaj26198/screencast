const socket = io();
const video = document.getElementById('remote-video');
const peerConnection = new RTCPeerConnection();

peerConnection.ontrack = (event) => {
    video.srcObject = event.streams[0];
};

socket.on('offer', (offer) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    peerConnection.createAnswer().then((answer) => {
        peerConnection.setLocalDescription(answer);
        socket.emit('answer', answer);
    });
});

socket.on('ice-candidate', (candidate) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
