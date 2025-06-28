// import React, { useState } from 'react';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { doc, setDoc } from 'firebase/firestore';
// import { auth, db } from '../firebaseConfig';
// import { useNavigate } from 'react-router-dom';

// const Signup = () => {
//   const [formData, setFormData] = useState({ email: '', password: '', role: 'admin' }); // or 'user'
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');

//     try {
//       // إنشاء الحساب في Auth
//       const res = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

//       // تخزين بيانات المستخدم في Firestore
//       await setDoc(doc(db, "users", res.user.uid), {
//         email: formData.email,
//         role: formData.role,
//         createdAt: new Date()
//       });

//       alert("Account created successfully!");
//       navigate("/login");
//     } catch (err) {
//       console.error(err);
//       setError("Failed to create account");
//     }
//   };

//   return (
//     <div className="signup-container">
//       <form onSubmit={handleSubmit}>
//         <h2>Create Admin Account</h2>

//         <input
//           type="email"
//           name="email"
//           placeholder="Email"
//           value={formData.email}
//           onChange={handleChange}
//           required
//         />

//         <input
//           type="password"
//           name="password"
//           placeholder="Password"
//           value={formData.password}
//           onChange={handleChange}
//           required
//         />

//         <select name="role" value={formData.role} onChange={handleChange}>
//           <option value="admin">Admin</option>
//           <option value="user">User</option>
//         </select>

//         <button type="submit">Sign Up</button>
//         {error && <p className="error">{error}</p>}
//       </form>
//     </div>
//   );
// };

// export default Signup;
