import React, { useState, useEffect } from 'react';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading messages data
    setTimeout(() => {
      setMessages([
        {
          id: 1,
          name: "Ahmed Mohamed",
          email: "ahmed@example.com",
          subject: "Inquiry about available cars",
          message: "Hello, I would like to inquire about the availability of a luxury car for one week next March. Could you provide me with the available prices and specifications?",
          date: "2024-02-15 10:30",
          status: "new"
        },
        {
          id: 2,
          name: "Fatima Ahmed",
          email: "fatima@example.com",
          subject: "Complaint about customer service",
          message: "I encountered a problem with the booking process on the website, and when I contacted customer service, I didn't get an appropriate response. Please improve the service.",
          date: "2024-02-14 15:45",
          status: "replied"
        },
        {
          id: 3,
          name: "Mohammed Ali",
          email: "mohammed@example.com",
          subject: "Request for special price offer",
          message: "I need to rent 5 cars for a special occasion for 3 days. Can you provide a special price offer for the quantity?",
          date: "2024-02-13 09:20",
          status: "new"
        },
        {
          id: 4,
          name: "Sara Khaled",
          email: "sara@example.com",
          subject: "Inquiry about insurance",
          message: "Are the cars insured? What are the insurance terms in case of any damage? Please clarify before completing the reservation.",
          date: "2024-02-12 14:10",
          status: "replied"
        },
        {
          id: 5,
          name: "Abdullah Hassan",
          email: "abdullah@example.com",
          subject: "Payment problem",
          message: "I tried to pay several times but the process failed. Is there a problem with the payment system? Please help.",
          date: "2024-02-11 16:30",
          status: "new"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleMarkAsRead = (messageId) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'read' }
        : msg
    ));
  };

  const handleReply = (messageId) => {
    // Here you would typically open a reply modal or redirect to reply page
    alert(`Reply to message ${messageId}`);
  };

  const handleDelete = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      setMessages(messages.filter(msg => msg.id !== messageId));
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Messages</h1>
        <p>Manage customer messages and inquiries</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Customer Messages ({messages.length})</h2>
        </div>

        {messages.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>No messages currently</p>
          </div>
        ) : (
          <div style={{ padding: '0' }}>
            {messages.map(message => (
              <div key={message.id} className="message-item">
                <div className="message-header">
                  <div className="message-info">
                    <h4>{message.name}</h4>
                    <p>{message.email}</p>
                    <div className="message-subject">{message.subject}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="message-date">{message.date}</div>
                    <span className={`status-badge ${message.status}`}>
                      {message.status === 'new' && 'New'}
                      {message.status === 'read' && 'Read'}
                      {message.status === 'replied' && 'Replied'}
                    </span>
                  </div>
                </div>
                
                <div className="message-content">
                  <p>{message.message}</p>
                </div>

                <div className="action-buttons" style={{ marginTop: '15px', justifyContent: 'flex-end' }}>
                  {message.status === 'new' && (
                    <button 
                      className="edit-btn"
                      onClick={() => handleMarkAsRead(message.id)}
                    >
                      Mark as Read
                    </button>
                  )}
                  <button 
                    className="view-btn"
                    onClick={() => handleReply(message.id)}
                  >
                    Reply
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(message.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;

// import React, { useState, useEffect } from 'react';

// const Messages = () => {
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Simulate loading messages data
//     setTimeout(() => {
//       setMessages([
//         {
//           id: 1,
//           name: "أحمد محمد",
//           email: "ahmed@example.com",
//           subject: "استفسار عن السيارات المتاحة",
//           message: "مرحباً، أود الاستفسار عن توفر سيارة فاخرة لمدة أسبوع في شهر مارس القادم. هل يمكنكم تزويدي بالأسعار والمواصفات المتاحة؟",
//           date: "2024-02-15 10:30",
//           status: "new"
//         },
//         {
//           id: 2,
//           name: "فاطمة أحمد",
//           email: "fatima@example.com",
//           subject: "شكوى حول خدمة العملاء",
//           message: "لقد واجهت مشكلة في عملية الحجز عبر الموقع، وعندما تواصلت مع خدمة العملاء لم أحصل على رد مناسب. أرجو تحسين الخدمة.",
//           date: "2024-02-14 15:45",
//           status: "replied"
//         },
//         {
//           id: 3,
//           name: "محمد علي",
//           email: "mohammed@example.com",
//           subject: "طلب عرض سعر خاص",
//           message: "أحتاج لاستئجار 5 سيارات لمناسبة خاصة لمدة 3 أيام. هل يمكنكم تقديم عرض سعر خاص للكمية؟",
//           date: "2024-02-13 09:20",
//           status: "new"
//         },
//         {
//           id: 4,
//           name: "سارة خالد",
//           email: "sara@example.com",
//           subject: "استفسار عن التأمين",
//           message: "هل السيارات مؤمنة؟ وما هي شروط التأمين في حالة حدوث أي ضرر؟ أرجو التوضيح قبل إتمام الحجز.",
//           date: "2024-02-12 14:10",
//           status: "replied"
//         },
//         {
//           id: 5,
//           name: "عبدالله حسن",
//           email: "abdullah@example.com",
//           subject: "مشكلة في الدفع",
//           message: "حاولت الدفع عدة مرات لكن العملية فشلت. هل هناك مشكلة في نظام الدفع؟ أرجو المساعدة.",
//           date: "2024-02-11 16:30",
//           status: "new"
//         }
//       ]);
//       setLoading(false);
//     }, 1000);
//   }, []);

//   const handleMarkAsRead = (messageId) => {
//     setMessages(messages.map(msg => 
//       msg.id === messageId 
//         ? { ...msg, status: 'read' }
//         : msg
//     ));
//   };

//   const handleReply = (messageId) => {
//     // Here you would typically open a reply modal or redirect to reply page
//     alert(`Reply to message ${messageId}`);
//   };

//   const handleDelete = (messageId) => {
//     if (window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
//       setMessages(messages.filter(msg => msg.id !== messageId));
//     }
//   };

//   if (loading) {
//     return (
//       <div className="loading-container">
//         <div className="loading-spinner"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>الرسائل</h1>
//         <p>إدارة رسائل العملاء والاستفسارات</p>
//       </div>

//       <div className="table-container">
//         <div className="table-header">
//           <h2>رسائل العملاء ({messages.length})</h2>
//         </div>

//         {messages.length === 0 ? (
//           <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
//             <p>لا توجد رسائل حالياً</p>
//           </div>
//         ) : (
//           <div style={{ padding: '0' }}>
//             {messages.map(message => (
//               <div key={message.id} className="message-item">
//                 <div className="message-header">
//                   <div className="message-info">
//                     <h4>{message.name}</h4>
//                     <p>{message.email}</p>
//                     <div className="message-subject">{message.subject}</div>
//                   </div>
//                   <div style={{ textAlign: 'right' }}>
//                     <div className="message-date">{message.date}</div>
//                     <span className={`status-badge ${message.status}`}>
//                       {message.status === 'new' && 'جديد'}
//                       {message.status === 'read' && 'مقروء'}
//                       {message.status === 'replied' && 'تم الرد'}
//                     </span>
//                   </div>
//                 </div>
                
//                 <div className="message-content">
//                   <p>{message.message}</p>
//                 </div>

//                 <div className="action-buttons" style={{ marginTop: '15px', justifyContent: 'flex-end' }}>
//                   {message.status === 'new' && (
//                     <button 
//                       className="edit-btn"
//                       onClick={() => handleMarkAsRead(message.id)}
//                     >
//                       تحديد كمقروء
//                     </button>
//                   )}
//                   <button 
//                     className="view-btn"
//                     onClick={() => handleReply(message.id)}
//                   >
//                     رد
//                   </button>
//                   <button 
//                     className="delete-btn"
//                     onClick={() => handleDelete(message.id)}
//                   >
//                     حذف
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Messages;
