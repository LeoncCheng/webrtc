var socket = io.connect(window.location.origin);
var localId = document.getElementById('localId').value;
var remoteId = '0';
var remoteVideo = document.getElementById('remoteVideo');
var localPC;
// 获取播放按钮元素
var playButton = document.getElementById('playButton');

function message(action, text) {
  this.from = localId;
  this.to = remoteId;
  this.action = action;
  this.text = text;
}

// 在播放按钮点击事件中触发视频播放
playButton.addEventListener('click', function () {
  console.log('播放视频');
  // if (remoteVideo.srcObject) {
  // console.log('视频已经在播放中了');
  remoteVideo.play().catch(function (error) {
    // 处理播放失败的情况
    console.error('播放失败：', error);
  });
  // }
});

function handleOffer(data) {
  localPC = new RTCPeerConnection();

  localPC.onicecandidate = function(e) {
    if (e.candidate) {
      console.log("ICE gathering state change: " + e.target.iceGatheringState);
      socket.emit('msg', new message('ice', e.candidate));
    }
  }

  localPC.oniceconnectionstatechange = function(e) {
    console.log("ICE connection state change: " + e.target.iceConnectionState);
  }

  localPC.setRemoteDescription(data.text);
  console.log("setRemoteDescription", data.text)
  // localPC.onaddstream = gotRemoteStream;
  localPC.ontrack = gotRemoteStream;
  sendAnswer();
}

function gotRemoteStream(e) {
  console.log("gotRemoteStream--------", e)
  remoteVideo.srcObject = e.streams[0];
  // remoteVideo.play();
}

function sendAnswer() {
  localPC.createAnswer()
    .then(function(answer) {
      localPC.setLocalDescription(answer);
      socket.emit('msg', new message('answer', answer));
    });
}

function handleIce(data) {
  localPC.addIceCandidate(new RTCIceCandidate(data.text));

  mmIceCandidate = data.text['candidate'].split(' ')
  if (mmIceCandidate[7] === 'host') {
    url = window.location.href;
    url = url.split('/')[2];
    host_ip = url.split(':')[0];
    if (host_ip != mmIceCandidate[4]) {
      mmIceCandidate[4] = host_ip;
      mmIceCandidate = mmIceCandidate.join(' ');
      mmIceCandidateObj = data.text;
      mmIceCandidateObj['candidate'] = mmIceCandidate;
      localPC.addIceCandidate(new RTCIceCandidate(mmIceCandidateObj));
    }
  }
}

socket.on('connect', function() {
  socket.emit('id', localId);
  socket.emit('msg', new message('request', 'Request from receiver'));

  socket.on('msg', function(data) {
    switch (data.action) {
      case 'offer':
        handleOffer(data);
        break;
      case 'ice':
        handleIce(data);
        break;
    }
  });
});
