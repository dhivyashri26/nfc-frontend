// import { useEffect } from 'react';
// import axios from 'axios';

// function keepServerAwake() {
//   useEffect(() => {
//     const interval = setInterval(() => {
//       axios.get('https://nfc-backend-9c1q.onrender.com')
//         .then(() => console.log('Pinged backend to keep it awake'))
//         .catch(err => console.error('Error pinging backend:', err));
//     }, 120000); // 2 minutes

//     return () => clearInterval(interval);
//   }, []);
// }

// export default keepServerAwake;