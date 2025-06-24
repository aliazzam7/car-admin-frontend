// utils/ordersFirebase.js
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

const ORDERS_COLLECTION = 'orders';

// Ajouter une nouvelle commande
export const addOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('Order added with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding order: ', error);
    throw error;
  }
};

// Mettre à jour une commande
export const updateOrder = async (orderId, updatedData) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, {
      ...updatedData,
      updatedAt: Timestamp.now()
    });
    console.log('Order updated successfully');
  } catch (error) {
    console.error('Error updating order: ', error);
    throw error;
  }
};

// Supprimer une commande
export const deleteOrder = async (orderId) => {
  try {
    await deleteDoc(doc(db, ORDERS_COLLECTION, orderId));
    console.log('Order deleted successfully');
  } catch (error) {
    console.error('Error deleting order: ', error);
    throw error;
  }
};

// Obtenir une commande par ID
export const getOrderById = async (orderId) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      return { id: orderSnap.id, ...orderSnap.data() };
    } else {
      throw new Error('Order not found');
    }
  } catch (error) {
    console.error('Error getting order: ', error);
    throw error;
  }
};

// Obtenir toutes les commandes d'un utilisateur
export const getOrdersByUser = async (userEmail) => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userEmail', '==', userEmail),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting user orders: ', error);
    throw error;
  }
};

// Obtenir les commandes par statut
export const getOrdersByStatus = async (status) => {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    return orders;
  } catch (error) {
    console.error('Error getting orders by status: ', error);
    throw error;
  }
};

// Exemple de structure de données pour une commande
export const createOrderData = (orderInfo) => {
  return {
    userName: orderInfo.userName,
    userEmail: orderInfo.userEmail,
    carName: orderInfo.carName,
    carId: orderInfo.carId, // ID de la voiture dans la collection cars
    startDate: Timestamp.fromDate(new Date(orderInfo.startDate)),
    endDate: Timestamp.fromDate(new Date(orderInfo.endDate)),
    totalDays: orderInfo.totalDays,
    totalPrice: orderInfo.totalPrice,
    status: orderInfo.status || 'pending', // pending, confirmed, delivered, cancelled
    notes: orderInfo.notes || '',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };
};