
import { useEffect, useState, useRef } from 'react';
import {createLocalTracks, connect} from 'twilio-video';
import axios from 'axios'
import qs from 'qs'
import './App.css';
const urlGenerateToken = 'https://generate-token-7936.twil.io/video'
const identity = qs.stringify('yp')

function App() {

  const [state, setState] = useState({
    tracks: {}, 
    cameraMode: 'user', 
    room: null
  })
  const [inputValue, setInputValue] = useState("")

  const ref = useRef(null)

  

  const initClient = async () => {
    console.log(inputValue)
    const identity = qs.stringify({identity: inputValue})
    console.log({identity})
    const token = await axios.post(urlGenerateToken, identity)
    console.log({token})
    const tracks = await createLocalTracks({
      audio: false,
      video: {facingMode: 'user'}
    })


    const room = await connect(token.data, {
      name: "testRoom",
      tracks
    })

    

    setState({...state, room, tracks: {[room.localParticipant.sid]: tracks}})
    console.log({room})

    handleConnectedParticipant(room.localParticipant)
    room.participants.forEach(handleConnectedParticipant)
    room.on("participantConnected", handleConnectedParticipant)
   
    room.on("participantDisconnected", handleDisconnectedParticipant)
    window.addEventListener("pagehide", () => {room.disconnect()})
    window.addEventListener("beforeunload", () => {room.disconnect()})

    room.on('disconnected', room => {
      // Detach the local media elements
      room.localParticipant.tracks.forEach(publication => {
        const attachedElements = publication.track.detach();
        attachedElements.forEach(element => element.remove());
      });
    });
  }

    

  

  function handleConnectedParticipant(participant) {
    console.log('handleConnectedParticipant')
    participant.tracks.forEach((trackPublication) => {
      handleTrackPublished(trackPublication, participant)
    })
    participant.on("trackPublished", (trackPublication) => {
      handleTrackPublished(trackPublication, participant)
    })

  }

  function handleTrackPublished(trackPublication, participant) {

    function handleTrackSubscribed(track) {
      
      const trackElement = document.createElement('div')
      trackElement.id = participant.sid
      trackElement.appendChild(track.attach())
      
      const el = ref.current
      el.appendChild(trackElement)

      setState(current => {
        return({
        ...current, 
        [participant.sid]: current[participant.sid] ? [...current[participant.sid], track] : [track]
      })})


      
    }

    if (trackPublication.track) {handleTrackSubscribed(trackPublication.track)}
    trackPublication.on("subscribed", handleTrackSubscribed)

  }

  function handleDisconnectedParticipant(participant){

    console.log('handleDisconnectedParticipant')

    participant.removeAllListeners()
    const trackParticipant = document.getElementById(participant.sid)
    trackParticipant.remove()


  }


  useEffect(()=> {console.log({state})}, [state])

  function swicthCamera() {
    const mode = state.cameraMode === 'user' ? 'environment' : 'user'
    const localTracks = state.tracks[state.room.localParticipant.sid]
    const cameraTrack = localTracks.find(track => track.kind === 'video');
    cameraTrack.restart({ facingMode: mode });
    setState({...state, cameraMode: mode})
  }

  function handleInput(e) {
    setInputValue(e.target.value)
  }

  function handleDisconnect() {
    state.room.disconnect()
    handleDisconnectedParticipant(state.room.localParticipant)
  }

  return (
    <div className="App">
     <div ref={ref}></div> 
     <label>
      Identity
      <input type="text" value={inputValue} onChange={handleInput}></input>
     </label>
     <button onClick={initClient}>Join meeting</button>
     <button onClick={swicthCamera}>switch camera button</button>
     <button onClick={handleDisconnect}>disconnect</button>
     {state.room ? state.room.sid : "no yet"}
    </div>
  );
}

export default App;
