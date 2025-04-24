// Configure ICE servers for WebRTC connections
export const getIceServers = () => {
    return {
      iceServers: [
        {
          urls: 'stun:stun.stunprotocol.org'
        },
        {
          urls: 'stun:stun.l.google.com:19302'
        },
        {
          urls: 'turn:turn.example.com:3478',  // Replace with your TURN server in production
          username: process.env.TURN_USERNAME || 'username',
          credential: process.env.TURN_PASSWORD || 'password'
        }
      ]
    };
  };
  // In production, you would have actual TURN server credentials
  // TURN servers are essential for WebRTC to work when participants are behind firewalls
  // or specific types of NATs that prevent direct peer connections.
  /*
   * For a production application, you would need to:
   * 1. Set up a dedicated TURN server or use a service like Twilio's TURN server
   * 2. Implement a token generation system to secure your TURN server
   * 3. Replace the hardcoded credentials with environment variables
   */