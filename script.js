let stream = null;
let recorder = null;
let recordedChunks = [];
let isRecording = false;
let btnDisabled = true;

const startRecordingButton  = document.getElementById("startRecording")
const stopRecordingButton  = document.getElementById("stopRecording")
const downloadRecordingButton  = document.getElementById("downloadRecording")

startRecordingButton.addEventListener('click',function(){
  startRecording()
})

stopRecordingButton.addEventListener('click',function(){
  stopRecording()
})

downloadRecordingButton.addEventListener('click',function(){
  downloadRecording()
})


// // to user buffer class/instance in browser
// window.Buffer = Buffer;

// Get access to the user's camera and microphone
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then(function (mediaFeed) {
    stream = mediaFeed;
    let video = document.querySelector("#video");
    video.srcObject = stream;
  })
  .catch(console.error);

function startRecording() {
  let mimeType;
  if (stream) {
    if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9,opus")) {
      mimeType = "video/webm; codecs=vp9,opus";
    } else if (MediaRecorder.isTypeSupported("video/webm; codecs=vp9")) {
      mimeType = "video/webm; codecs=vp9";
    } else if (MediaRecorder.isTypeSupported("video/webm")) {
      mimeType = "video/webm";
    } else {
      mimeType = "video/webm; codecs=vp8 ";
    }
  }

  let options = {
    type: "video",
    video: {
      width: 1280,
      height: 720,
    },
    mimeType: mimeType,
  };

  // Create a new MediaRecorder
  recorder = new MediaRecorder(stream, options);

  recorder.start();
  isRecording = true;
  if (btnDisabled == false) {
    btnDisabled = true;
  }

  try {
    // When data is available, push it to the recordedChunks array
    recorder.ondataavailable = function (e) {
      console.log("e.data", e.data);
      recordedChunks.push(e.data);

      let formData = new FormData();
      formData.append("mediaFeed", e.data);

      fetch("http://localhost:3031/sendMediaFeed", {
        method: "POST",
        body: formData,
        contentType: "multipart/form-data",
      })
        .then((response) => {
          console.log(response);
        })
        .catch((error) => {
          console.error(error);
        });
    };
  } catch (e) {
    console.error("Exception while creating MediaRecorder: " + e);
    return;
  }
}

function stopRecording() {
  console.log("recordedChunks in stopRecording", recordedChunks);
  try {
    recorder.stop();
    isRecording = false;
    btnDisabled = false;
  } catch (e) {
    console.log(e);
  }
}

function downloadRecording (){

  fetch("http://localhost:3031/download", {
    method: "get"
  })
    .then((response) => {
      if(response.ok){
        return response.blob()
      }
      // console.log(response.body);
    }).then(data => {
        console.log("data",data);
        const url = URL.createObjectURL(data);
        console.log("url",url);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "test00.mp4";
        a.click()
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 100);
      
    })
    .catch((error) => {
      console.error(error);
    });
}

