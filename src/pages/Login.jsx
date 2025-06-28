// import React, { useState } from 'react';

// const Login = ({ onLogin }) => {
//   const [formData, setFormData] = useState({
//     email: '',
//     password: ''
//   });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//     setError('');
//   };

  
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     // Simulation d'une authentification
//     setTimeout(() => {
//       if (formData.email === 'admin@gmail.com' && formData.password === 'admin1234') {
//         onLogin();
//       } else {
//         setError('Email ou mot de passe incorrect');
//       }
//       setLoading(false);
//     }, 1000);
//   };

//   return (
//     <div className="login-container">
//       <form className="login-form" onSubmit={handleSubmit}>
//         <h2>Admin Login</h2>
        
//         <div className="form-group">
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             placeholder="admin@carrental.com"
//             required
//           />
//         </div>
        
//         <div className="form-group">
//           <label htmlFor="password">Mot de passe</label>
//           <input
//             type="password"
//             id="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             placeholder="admin123"
//             required
//           />
//         </div>
        
//         <button 
//           type="submit" 
//           className="login-btn"
//           disabled={loading}
//         >
//           {loading ? 'Connexion...' : 'Se connecter'}
//         </button>
        
//         {error && <div className="error-message">{error}</div>}
        
//         <div style={{ marginTop: '20px', textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
//           <p><strong>Identifiants de test :</strong></p>
//           <p>Email: admin@gmail.com</p>
//           <p>Mot de passe: admin1234</p>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default Login;
//----------------------------------------------------
// //EMAIL:adminali@carreservation.com
// //pass:adminali123456

// import React, { useState } from 'react';
// import { signInWithEmailAndPassword } from "firebase/auth";
// import { auth } from '../firebaseConfig';

// const Login = ({ onLogin }) => {
//   const [formData, setFormData] = useState({ email: '', password: '' });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value
//     });
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');

//     try {
//       const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
//       const user = userCredential.user;

//       if (user.email === "adminali@carreservation.com") {
//         onLogin(); 
//       } else {
//         setError("This user is not allowed to log in as an admin");
//       }
//     } catch (err) {
//       setError("Email or password is incorrect");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="login-container">
//       <form className="login-form" onSubmit={handleSubmit}>
//         <h2>Admin Login</h2>

//         <div className="form-group">
//           <label htmlFor="email">Email</label>
//           <input
//             type="email"
//             id="email"
//             name="email"
//             value={formData.email}
//             onChange={handleChange}
//             placeholder="admin@carreservation.com"
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label htmlFor="password">Mot de passe</label>
//           <input
//             type="password"
//             id="password"
//             name="password"
//             value={formData.password}
//             onChange={handleChange}
//             placeholder="******"
//             required
//           />
//         </div>

//         <button 
//           type="submit" 
//           className="login-btn"
//           disabled={loading}
//         >
//           {loading ? 'Connexion...' : 'Se connecter'}
//         </button>

//         {error && <div className="error-message">{error}</div>}
//       </form>
//     </div>
//   );
// };

// export default Login;
//************************************************************************************* */





//code trueeeeee
// //EMAIL:adminali@carreservation.com
// //pass:adminali123456


//EMAIL:alitechsolutions2425@gmail.com
// //pass:adminali#123456

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserSessionPersistence); // لا يتذكر المستخدم دائمًا
      const res = await signInWithEmailAndPassword(auth, formData.email, formData.password);

      if (res.user.email === "alitechsolutions2425@gmail.com") {
        navigate("/dashboard");
      } else {
        setError("You are not allowed to access as an admin.");
      }
    } catch (err) {
      setError("The email or  password or both not correct ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Admin Login</h2>

        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? "Connect..." : "login"}
        </button>

        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  );
};

export default Login;
