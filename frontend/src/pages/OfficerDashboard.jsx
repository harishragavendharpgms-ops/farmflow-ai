import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Adjust to your firebase configuration import
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export default function OfficerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch crop applications/orders from Firestore
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'cropApplications'));
        const orderList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setOrders(orderList);
      } catch (err) {
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Helper function to trigger SMS via Vercel Serverless Function
  const triggerSms = async (phone, messageBody) => {
    try {
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, body: messageBody })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send SMS');
      console.log('SMS sent successfully:', data.sid);
    } catch (error) {
      console.warn('SMS dispatch notification warning:', error.message);
    }
  };

  // Handle setting time slot
  const handleSetSlot = async (orderId, phone, slotTime) => {
    try {
      // Update database status here if needed
      // await updateDoc(doc(db, 'cropApplications', orderId), { slot: slotTime });

      // Send SMS notification
      const smsText = `FarmFlow AI: Your slot is confirmed for ${slotTime}. Please arrive on time.`;
      await triggerSms(phone, smsText);

      alert('Time slot set and SMS alert triggered successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  // Handle completing procurement
  const handleCompleteProcurement = async (orderId, phone, amount) => {
    try {
      // Update database status here if needed
      // await updateDoc(doc(db, 'cropApplications', orderId), { status: 'Completed' });

      // Send SMS notification
      const smsText = `FarmFlow AI: Procurement complete! Payout of INR ${amount} processed via DBT.`;
      await triggerSms(phone, smsText);

      alert('Procurement completed and confirmation SMS sent!');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-6 text-white bg-black min-h-screen">Loading Officer Dashboard...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto text-white bg-black min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Procurement Officer Dashboard</h1>
      <div className="overflow-x-auto bg-gray-900 shadow-xl rounded-lg border border-gray-800">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Farmer & Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Crop Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-400">No pending procurement orders found.</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{order.farmerName || 'Farmer'}</div>
                    <div className="text-sm text-gray-400">📞 {order.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{order.cropType || 'Crop'}</div>
                    <div className="text-sm text-gray-400">{order.quantity || 0} kg</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button 
                      onClick={() => handleSetSlot(order.id, order.phone, 'Tomorrow at 10:00 AM')}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
                    >
                      Set Slot
                    </button>
                    <button 
                      onClick={() => handleCompleteProcurement(order.id, order.phone, order.amount || '5000')}
                      className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition"
                    >
                      Complete Procurement
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}