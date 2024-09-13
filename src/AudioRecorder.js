// src/AudioRecorder.js
import React, { useState, useRef } from 'react';
import AWS from 'aws-sdk'; // Import entire SDK (optional)
import S3 from 'aws-sdk/clients/s3'; 

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const styles = {
    section: {
      position : "absolute",
      fontSize: "16px",
      color: "#292b2c",
      backgroundColor: "#fff",
      top: "265px",
      left: "500px"
    },
    upload: {
      position : "absolute",
      top: "241px",
      left: "791px"
    }
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'video/mp4',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    // Add more supported types as needed
  ];

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      alert('Invalid file type. Only images and PDFs are allowed.');
    }

  }

  const uploadFile = async () => {
    setUploading(true)
    const S3_BUCKET = "rec-audio-upload"; // Replace with your bucket name
    const REGION = "ap-south-1"; // Replace with your region

    AWS.config.update({
      accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
    });

    const s3 = new S3({
      params: { Bucket: S3_BUCKET },
      region: REGION,
    });

    //Customized Start
   /* const response = await fetch(audioURL);
    const blob = await response.blob();
    const blobUrl = audioURL;
    var d = new Date();
    var filetemp = new File([blob],d.valueOf(),{ type:"audio/wav" });  
    let fileName = filetemp.name;
    let fileType = filetemp.type;

    axios.post("http://localhost:3000/",{
      fileName : fileName, //parameter 1
      fileType : fileType  //parameter 2
      })*/

    // Customized end
    const params = {
      Bucket: S3_BUCKET,
      Key: file.name,
      Body: file,
    };

    try {
      const upload = await s3.putObject(params).promise();
      console.log(upload);
      setUploading(false)
      alert("File uploaded successfully.");

    } catch (error) {
      console.error(error);
      setUploading(false)
      alert("Error uploading file: " + error.message); // Inform user about the error
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioURL(URL.createObjectURL(blob));
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing media devices.', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {audioURL && (
        <div>
          <audio controls src={audioURL} />
          <a href={audioURL} download="recording.wav">Download Recording</a>
          <input type="file" style = {styles.section} required onChange={handleFileChange} />
        <button style = {styles.upload} onClick={uploadFile}>{uploading ? 'Uploading...' : 'Upload To S3 Bucket'}</button>
        </div>
      )}
    </div> 
  );
};

export default AudioRecorder;
