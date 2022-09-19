
import { useEffect, useState, useRef } from 'react';
import {createLocalTracks, connect} from 'twilio-video';
import axios from 'axios'
import qs from 'qs'
import './App.css';
const urlGenerateToken = 'https://generate-token-7936.twil.io/video'
const identity = qs.stringify({identity:'yo'})

function App() {

  const [videoTracks, setVideoTracks] = useState({})
  const [cameraMode, setCameraMode] = useState('user')
  const ref = useRef(null)

  useEffect( () => {

    const initClient = async () => {
      const token = await axios.post(urlGenerateToken, identity)

      const tracks = await createLocalTracks({
        audio: true,
        video: {facingMode: 'user'}
      })

      setVideoTracks({tracks})

      const room = await connect(token.data, {
        name: "testRoom",
        tracks
      })

      handleConnectedParticipant(room.localParticipant)
      // room.participants.forEach(handleConnectedParticipant)
      // room.on("participantConnected", handleConnectedParticipant)

      // room.on("participantDisconnected", handleDisconnectedParticipant)
      // window.addEventListener("pagehide", () => {room.disconnect()})
      // window.addEventListener("beforeunload", () => {room.disconnect()})
    }

    initClient() 

  }, [])

  function handleConnectedParticipant(participant) {

    participant.tracks.forEach((trackPublication) => {
      handleTrackPublished(trackPublication, participant)
    })
    // participant.on("trackPublished", (trackPublication) => {
    //   handleTrackPublished(trackPublication, participant)
    // })

  }

  function handleTrackPublished(trackPublication, participant) {

    function handleTrackSubscribed(track) {
      

      const el = ref.current
      el.appendChild(track.attach())

      // setVideoTracks(current => {
      //   return({
      //   ...current, 
      //   [participant.sid]: current[participant.sid] ? [...current[participant.sid], track] : [track]
      // })})


      
    }

    if (trackPublication.track) {handleTrackSubscribed(trackPublication.track)}
    // trackPublication.on("subscribed", handleTrackSubscribed)

  }

  // function handleDisconnectedParticipant(participant){
  //   participant.removeAllListener()


  // }

  // useEffect(()=> {console.log({videoTracks})}, [videoTracks])

  function swicthCamera() {
    const mode = cameraMode === 'user' ? 'environment' : 'user'
    const {tracks} = videoTracks
    const cameraTrack = tracks.find(track => track.kind === 'video');
    cameraTrack.restart({ facingMode: mode });
    setCameraMode(cameraMode === 'user' ? 'environment' : 'user')
  }

  return (
    <div className="App">
     <div ref={ref}></div> 
     <button onClick={swicthCamera}>switch camera button</button>
    </div>
  );
}

export default App;
