import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CarsList = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating data loading
    setTimeout(() => {
      setCars([
        {
          id: 1,
          image: 'https://via.placeholder.com/300x200/4CAF50/white?text=Toyota+Camry',
          carName: 'Toyota Camry 2023',
          brand: 'Toyota',
          plateNumber: 'ABC-123',
          dailyPrice: 45,
          transmission: 'automatic',
          passengers: 5,
          fuelType: 'gasoline',
          status: 'available'
        },
        {
          id: 2,
          image: 'https://via.placeholder.com/300x200/2196F3/white?text=Honda+Civic',
          carName: 'Honda Civic 2022',
          brand: 'Honda',
          plateNumber: 'XYZ-456',
          dailyPrice: 40,
          transmission: 'manual',
          passengers: 5,
          fuelType: 'gasoline',
          status: 'available'
        },
        {
          id: 3,
          image: 'https://via.placeholder.com/300x200/FF9800/white?text=BMW+X5',
          carName: 'BMW X5 2023',
          brand: 'BMW',
          plateNumber: 'BMW-789',
          dailyPrice: 85,
          transmission: 'automatic',
          passengers: 7,
          fuelType: 'gasoline',
          status: 'unavailable'
        },
        {
          id: 4,
          image: 'https://via.placeholder.com/300x200/9C27B0/white?text=Mercedes+C-Class',
          carName: 'Mercedes C-Class 2023',
          brand: 'Mercedes',
          plateNumber: 'MER-321',
          dailyPrice: 75,
          transmission: 'automatic',
          passengers: 5,
          fuelType: 'gasoline',
          status: 'available'
        },
        {
          id: 5,
          image: 'https://via.placeholder.com/300x200/607D8B/white?text=Hyundai+Elantra',
          carName: 'Hyundai Elantra 2022',
          brand: 'Hyundai',
          plateNumber: 'HYU-654',
          dailyPrice: 35,
          transmission: 'manual',
          passengers: 5,
          fuelType: 'gasoline',
          status: 'available'
        },
        {
          id: 6,
          image: 'https://via.placeholder.com/300x200/795548/white?text=Audi+A4',
          carName: 'Audi A4 2023',
          brand: 'Audi',
          plateNumber: 'AUD-987',
          dailyPrice: 65,
          transmission: 'automatic',
          passengers: 5,
          fuelType: 'gasoline',
          status: 'available'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      setCars(cars.filter(car => car.id !== id));
      alert('Car deleted successfully!');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Car Management</h1>
        <p>Manage your vehicle fleet</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Car List ({cars.length})</h2>
          <Link to="/add-car" className="add-btn">
            + Add a Car
          </Link>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Brand</th>
              <th>Plate</th>
              <th>Price/day</th>
              <th>Transmission</th>
              <th>Passengers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.map(car => (
              <tr key={car.id}>
                <td>
                  <img 
                    src={car.image} 
                    alt={car.carName}
                    className="car-image"
                  />
                </td>
                <td><strong>{car.carName}</strong></td>
                <td>{car.brand}</td>
                <td>{car.plateNumber}</td>
                <td>{formatCurrency(car.dailyPrice)}</td>
                <td>{car.transmission === 'automatic' ? 'Automatic' : 'Manual'}</td>
                <td>{car.passengers}</td>
                <td>
                  <span className={`status-badge ${car.status}`}>
                    {car.status === 'available' ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <Link to={`/edit-car/${car.id}`} className="edit-btn">
                      Edit
                    </Link>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(car.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {cars.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px', 
            color: '#666' 
          }}>
            <h3>No cars found</h3>
            <p>Start by adding your first car.</p>
            <Link to="/add-car" className="add-btn" style={{ marginTop: '20px', display: 'inline-block' }}>
              + Add a Car
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarsList;

// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// const CarsList = () => {
//   const [cars, setCars] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Simulation de chargement des données
//     setTimeout(() => {
//       setCars([
//         {
//           id: 1,
//           image: 'https://via.placeholder.com/300x200/4CAF50/white?text=Toyota+Camry',
//           carName: 'Toyota Camry 2023',
//           brand: 'Toyota',
//           plateNumber: 'ABC-123',
//           dailyPrice: 45,
//           transmission: 'automatic',
//           passengers: 5,
//           fuelType: 'gasoline',
//           status: 'available'
//         },
//         {
//           id: 2,
//           image: 'https://via.placeholder.com/300x200/2196F3/white?text=Honda+Civic',
//           carName: 'Honda Civic 2022',
//           brand: 'Honda',
//           plateNumber: 'XYZ-456',
//           dailyPrice: 40,
//           transmission: 'manual',
//           passengers: 5,
//           fuelType: 'gasoline',
//           status: 'available'
//         },
//         {
//           id: 3,
//           image: 'https://via.placeholder.com/300x200/FF9800/white?text=BMW+X5',
//           carName: 'BMW X5 2023',
//           brand: 'BMW',
//           plateNumber: 'BMW-789',
//           dailyPrice: 85,
//           transmission: 'automatic',
//           passengers: 7,
//           fuelType: 'gasoline',
//           status: 'unavailable'
//         },
//         {
//           id: 4,
//           image: 'https://via.placeholder.com/300x200/9C27B0/white?text=Mercedes+C-Class',
//           carName: 'Mercedes C-Class 2023',
//           brand: 'Mercedes',
//           plateNumber: 'MER-321',
//           dailyPrice: 75,
//           transmission: 'automatic',
//           passengers: 5,
//           fuelType: 'gasoline',
//           status: 'available'
//         },
//         {
//           id: 5,
//           image: 'https://via.placeholder.com/300x200/607D8B/white?text=Hyundai+Elantra',
//           carName: 'Hyundai Elantra 2022',
//           brand: 'Hyundai',
//           plateNumber: 'HYU-654',
//           dailyPrice: 35,
//           transmission: 'manual',
//           passengers: 5,
//           fuelType: 'gasoline',
//           status: 'available'
//         },
//         {
//           id: 6,
//           image: 'https://via.placeholder.com/300x200/795548/white?text=Audi+A4',
//           carName: 'Audi A4 2023',
//           brand: 'Audi',
//           plateNumber: 'AUD-987',
//           dailyPrice: 65,
//           transmission: 'automatic',
//           passengers: 5,
//           fuelType: 'gasoline',
//           status: 'available'
//         }
//       ]);
//       setLoading(false);
//     }, 1000);
//   }, []);

//   const handleDelete = (id) => {
//     if (window.confirm('Êtes-vous sûr de vouloir supprimer cette voiture ?')) {
//       setCars(cars.filter(car => car.id !== id));
//       alert('Voiture supprimée avec succès!');
//     }
//   };

//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('fr-FR', {
//       style: 'currency',
//       currency: 'EUR'
//     }).format(amount);
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <div className="page-header">
//         <h1>Gestion des Voitures</h1>
//         <p>Gérez votre flotte de véhicules</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>Liste des Voitures ({cars.length})</h2>
//           <Link to="/add-car" className="add-btn">
//             + Ajouter une voiture
//           </Link>
//         </div>

//         <table className="data-table">
//           <thead>
//             <tr>
//               <th>Image</th>
//               <th>Nom</th>
//               <th>Marque</th>
//               <th>Plaque</th>
//               <th>Prix/jour</th>
//               <th>Transmission</th>
//               <th>Passagers</th>
//               <th>Statut</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {cars.map(car => (
//               <tr key={car.id}>
//                 <td>
//                   <img 
//                     src={car.image} 
//                     alt={car.carName}
//                     className="car-image"
//                   />
//                 </td>
//                 <td>
//                   <strong>{car.carName}</strong>
//                 </td>
//                 <td>{car.brand}</td>
//                 <td>{car.plateNumber}</td>
//                 <td>{formatCurrency(car.dailyPrice)}</td>
//                 <td>
//                   {car.transmission === 'automatic' ? 'Automatique' : 'Manuelle'}
//                 </td>
//                 <td>{car.passengers}</td>
//                 <td>
//                   <span className={`status-badge ${car.status}`}>
//                     {car.status === 'available' ? 'Disponible' : 'Non disponible'}
//                   </span>
//                 </td>
//                 <td>
//                   <div className="action-buttons">
//                     <Link 
//                       to={`/edit-car/${car.id}`} 
//                       className="edit-btn"
//                     >
//                       Modifier
//                     </Link>
//                     <button
//                       className="delete-btn"
//                       onClick={() => handleDelete(car.id)}
//                     >
//                       Supprimer
//                     </button>
//                   </div>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {cars.length === 0 && (
//           <div style={{ 
//             textAlign: 'center', 
//             padding: '50px', 
//             color: '#666' 
//           }}>
//             <h3>Aucune voiture trouvée</h3>
//             <p>Commencez par ajouter votre première voiture.</p>
//             <Link to="/add-car" className="add-btn" style={{ marginTop: '20px', display: 'inline-block' }}>
//               + Ajouter une voiture
//             </Link>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CarsList;