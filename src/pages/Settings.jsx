import React, { useState } from 'react';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: 'Admin',
    email: 'admin@carreservation.com',
    phone: '+961 70 123 456',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    newOrderNotifications: true,
    messageNotifications: true,
    systemUpdates: false
  });

  const [systemSettings, setSystemSettings] = useState({
    siteName: 'Car Reservation Admin',
    currency: 'USD',
    language: 'ar',
    timezone: 'Asia/Beirut',
    maintenanceMode: false
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    // Here you would typically send the data to your backend
    alert('Profile updated successfully');
    
    // Reset password fields
    setProfileData({
      ...profileData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };

  const handleSystemSettingsSubmit = (e) => {
    e.preventDefault();
    alert('System settings updated successfully');
  };

  const renderProfileTab = () => (
    <div className="form-container">
      <h3 style={{ marginBottom: '20px', color: '#333' }}>Profile</h3>
      <form onSubmit={handleProfileSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
          />
        </div>

        <hr style={{ margin: '30px 0', border: '1px solid #e0e0e0' }} />
        
        <h4 style={{ marginBottom: '20px', color: '#333' }}>Change Password</h4>
        
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            value={profileData.currentPassword}
            onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
            placeholder="Leave empty if you don't want to change it"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={profileData.newPassword}
              onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={profileData.confirmPassword}
              onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
            />
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Save Changes
        </button>
      </form>
    </div>
  );

  const renderNotificationTab = () => (
    <div className="form-container">
      <h3 style={{ marginBottom: '20px', color: '#333' }}>Notification Settings</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {Object.entries(notificationSettings).map(([key, value]) => (
          <div key={key} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '15px',
            background: '#f8f9fa',
            borderRadius: '5px'
          }}>
            <div>
              <strong style={{ color: '#333' }}>
                {key === 'emailNotifications' && 'Email Notifications'}
                {key === 'smsNotifications' && 'SMS Notifications'}
                {key === 'newOrderNotifications' && 'New Order Notifications'}
                {key === 'messageNotifications' && 'Message Notifications'}
                {key === 'systemUpdates' && 'System Updates'}
              </strong>
              <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
                {key === 'emailNotifications' && 'Receive notifications via email'}
                {key === 'smsNotifications' && 'Receive notifications via SMS'}
                {key === 'newOrderNotifications' && 'Get notified when a new order arrives'}
                {key === 'messageNotifications' && 'Get notified when a new message arrives'}
                {key === 'systemUpdates' && 'Get notifications about system updates'}
              </p>
            </div>
            <label style={{ 
              position: 'relative', 
              display: 'inline-block', 
              width: '50px', 
              height: '25px' 
            }}>
              <input
                type="checkbox"
                checked={value}
                onChange={() => handleNotificationChange(key)}
                style={{ display: 'none' }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: value ? '#667eea' : '#ccc',
                borderRadius: '25px',
                transition: '0.3s',
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '19px',
                  width: '19px',
                  left: value ? '28px' : '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  transition: '0.3s',
                }} />
              </span>
            </label>
          </div>
        ))}
      </div>

      <button 
        className="submit-btn" 
        style={{ marginTop: '20px' }}
        onClick={() => alert('Notification settings saved')}
      >
        Save Settings
      </button>
    </div>
  );

  const renderSystemTab = () => (
    <div className="form-container">
      <h3 style={{ marginBottom: '20px', color: '#333' }}>System Settings</h3>
      <form onSubmit={handleSystemSettingsSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Site Name</label>
            <input
              type="text"
              value={systemSettings.siteName}
              onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Currency</label>
            <select
              value={systemSettings.currency}
              onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
            >
              <option value="USD">US Dollar (USD)</option>
              <option value="LBP">Lebanese Pound (LBP)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Language</label>
            <select
              value={systemSettings.language}
              onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div className="form-group">
            <label>Timezone</label>
            <select
              value={systemSettings.timezone}
              onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
            >
              <option value="Asia/Beirut">Beirut</option>
              <option value="Asia/Dubai">Dubai</option>
              <option value="Europe/London">London</option>
              <option value="America/New_York">New York</option>
            </select>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <div>
            <strong style={{ color: '#333' }}>Maintenance Mode</strong>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
              Enabling maintenance mode will temporarily block access to the site
            </p>
          </div>
          <label style={{ 
            position: 'relative', 
            display: 'inline-block', 
            width: '50px', 
            height: '25px' 
          }}>
            <input
              type="checkbox"
              checked={systemSettings.maintenanceMode}
              onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
              style={{ display: 'none' }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: systemSettings.maintenanceMode ? '#dc3545' : '#ccc',
              borderRadius: '25px',
              transition: '0.3s',
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '19px',
                width: '19px',
                left: systemSettings.maintenanceMode ? '28px' : '3px',
                bottom: '3px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '0.3s',
              }} />
            </span>
          </label>
        </div>

        <button type="submit" className="submit-btn">
          Save System Settings
        </button>
      </form>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Manage system and profile settings</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          background: 'white', 
          borderRadius: '10px',
          boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'profile' ? '#667eea' : 'transparent',
              color: activeTab === 'profile' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'notifications' ? '#667eea' : 'transparent',
              color: activeTab === 'notifications' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('system')}
            style={{
              flex: 1,
              padding: '15px 20px',
              border: 'none',
              background: activeTab === 'system' ? '#667eea' : 'transparent',
              color: activeTab === 'system' ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            System
          </button>
        </div>
      </div>

      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'notifications' && renderNotificationTab()}
      {activeTab === 'system' && renderSystemTab()}
    </div>
  );
};

export default Settings;

// import React, { useState } from 'react';

// const Settings = () => {
//   const [activeTab, setActiveTab] = useState('profile');
//   const [profileData, setProfileData] = useState({
//     name: 'Admin',
//     email: 'admin@carreservation.com',
//     phone: '+961 70 123 456',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: ''
//   });

//   const [notificationSettings, setNotificationSettings] = useState({
//     emailNotifications: true,
//     smsNotifications: false,
//     newOrderNotifications: true,
//     messageNotifications: true,
//     systemUpdates: false
//   });

//   const [systemSettings, setSystemSettings] = useState({
//     siteName: 'Car Reservation Admin',
//     currency: 'USD',
//     language: 'ar',
//     timezone: 'Asia/Beirut',
//     maintenanceMode: false
//   });

//   const handleProfileSubmit = (e) => {
//     e.preventDefault();
    
//     if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
//       alert('كلمات المرور الجديدة غير متطابقة');
//       return;
//     }

//     // Here you would typically send the data to your backend
//     alert('تم تحديث الملف الشخصي بنجاح');
    
//     // Reset password fields
//     setProfileData({
//       ...profileData,
//       currentPassword: '',
//       newPassword: '',
//       confirmPassword: ''
//     });
//   };

//   const handleNotificationChange = (setting) => {
//     setNotificationSettings({
//       ...notificationSettings,
//       [setting]: !notificationSettings[setting]
//     });
//   };

//   const handleSystemSettingsSubmit = (e) => {
//     e.preventDefault();
//     alert('تم تحديث إعدادات النظام بنجاح');
//   };

//   const renderProfileTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>الملف الشخصي</h3>
//       <form onSubmit={handleProfileSubmit}>
//         <div className="form-row">
//           <div className="form-group">
//             <label>الاسم</label>
//             <input
//               type="text"
//               value={profileData.name}
//               onChange={(e) => setProfileData({...profileData, name: e.target.value})}
//               required
//             />
//           </div>
//           <div className="form-group">
//             <label>البريد الإلكتروني</label>
//             <input
//               type="email"
//               value={profileData.email}
//               onChange={(e) => setProfileData({...profileData, email: e.target.value})}
//               required
//             />
//           </div>
//         </div>

//         <div className="form-group">
//           <label>رقم الهاتف</label>
//           <input
//             type="tel"
//             value={profileData.phone}
//             onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
//           />
//         </div>

//         <hr style={{ margin: '30px 0', border: '1px solid #e0e0e0' }} />
        
//         <h4 style={{ marginBottom: '20px', color: '#333' }}>تغيير كلمة المرور</h4>
        
//         <div className="form-group">
//           <label>كلمة المرور الحالية</label>
//           <input
//             type="password"
//             value={profileData.currentPassword}
//             onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
//             placeholder="اتركها فارغة إذا لم ترد تغييرها"
//           />
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>كلمة المرور الجديدة</label>
//             <input
//               type="password"
//               value={profileData.newPassword}
//               onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})}
//             />
//           </div>
//           <div className="form-group">
//             <label>تأكيد كلمة المرور الجديدة</label>
//             <input
//               type="password"
//               value={profileData.confirmPassword}
//               onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
//             />
//           </div>
//         </div>

//         <button type="submit" className="submit-btn">
//           حفظ التغييرات
//         </button>
//       </form>
//     </div>
//   );

//   const renderNotificationTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>إعدادات الإشعارات</h3>
      
//       <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
//         {Object.entries(notificationSettings).map(([key, value]) => (
//           <div key={key} style={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             alignItems: 'center',
//             padding: '15px',
//             background: '#f8f9fa',
//             borderRadius: '5px'
//           }}>
//             <div>
//               <strong style={{ color: '#333' }}>
//                 {key === 'emailNotifications' && 'إشعارات البريد الإلكتروني'}
//                 {key === 'smsNotifications' && 'إشعارات الرسائل النصية'}
//                 {key === 'newOrderNotifications' && 'إشعارات الطلبات الجديدة'}
//                 {key === 'messageNotifications' && 'إشعارات الرسائل'}
//                 {key === 'systemUpdates' && 'تحديثات النظام'}
//               </strong>
//               <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//                 {key === 'emailNotifications' && 'استقبال الإشعارات عبر البريد الإلكتروني'}
//                 {key === 'smsNotifications' && 'استقبال الإشعارات عبر الرسائل النصية'}
//                 {key === 'newOrderNotifications' && 'الحصول على إشعار عند وصول طلب جديد'}
//                 {key === 'messageNotifications' && 'الحصول على إشعار عند وصول رسالة جديدة'}
//                 {key === 'systemUpdates' && 'الحصول على إشعارات حول تحديثات النظام'}
//               </p>
//             </div>
//             <label style={{ 
//               position: 'relative', 
//               display: 'inline-block', 
//               width: '50px', 
//               height: '25px' 
//             }}>
//               <input
//                 type="checkbox"
//                 checked={value}
//                 onChange={() => handleNotificationChange(key)}
//                 style={{ display: 'none' }}
//               />
//               <span style={{
//                 position: 'absolute',
//                 cursor: 'pointer',
//                 top: 0,
//                 left: 0,
//                 right: 0,
//                 bottom: 0,
//                 backgroundColor: value ? '#667eea' : '#ccc',
//                 borderRadius: '25px',
//                 transition: '0.3s',
//               }}>
//                 <span style={{
//                   position: 'absolute',
//                   content: '',
//                   height: '19px',
//                   width: '19px',
//                   left: value ? '28px' : '3px',
//                   bottom: '3px',
//                   backgroundColor: 'white',
//                   borderRadius: '50%',
//                   transition: '0.3s',
//                 }} />
//               </span>
//             </label>
//           </div>
//         ))}
//       </div>

//       <button 
//         className="submit-btn" 
//         style={{ marginTop: '20px' }}
//         onClick={() => alert('تم حفظ إعدادات الإشعارات')}
//       >
//         حفظ الإعدادات
//       </button>
//     </div>
//   );

//   const renderSystemTab = () => (
//     <div className="form-container">
//       <h3 style={{ marginBottom: '20px', color: '#333' }}>إعدادات النظام</h3>
//       <form onSubmit={handleSystemSettingsSubmit}>
//         <div className="form-row">
//           <div className="form-group">
//             <label>اسم الموقع</label>
//             <input
//               type="text"
//               value={systemSettings.siteName}
//               onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
//             />
//           </div>
//           <div className="form-group">
//             <label>العملة</label>
//             <select
//               value={systemSettings.currency}
//               onChange={(e) => setSystemSettings({...systemSettings, currency: e.target.value})}
//             >
//               <option value="USD">دولار أمريكي (USD)</option>
//               <option value="LBP">ليرة لبنانية (LBP)</option>
//               <option value="EUR">يورو (EUR)</option>
//             </select>
//           </div>
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>اللغة</label>
//             <select
//               value={systemSettings.language}
//               onChange={(e) => setSystemSettings({...systemSettings, language: e.target.value})}
//             >
//               <option value="ar">العربية</option>
//               <option value="en">English</option>
//               <option value="fr">Français</option>
//             </select>
//           </div>
//           <div className="form-group">
//             <label>المنطقة الزمنية</label>
//             <select
//               value={systemSettings.timezone}
//               onChange={(e) => setSystemSettings({...systemSettings, timezone: e.target.value})}
//             >
//               <option value="Asia/Beirut">بيروت</option>
//               <option value="Asia/Dubai">دبي</option>
//               <option value="Europe/London">لندن</option>
//               <option value="America/New_York">نيويورك</option>
//             </select>
//           </div>
//         </div>

//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center',
//           padding: '15px',
//           background: '#f8f9fa',
//           borderRadius: '5px',
//           marginBottom: '20px'
//         }}>
//           <div>
//             <strong style={{ color: '#333' }}>وضع الصيانة</strong>
//             <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0 0 0' }}>
//               تفعيل وضع الصيانة سيمنع الوصول إلى الموقع مؤقتاً
//             </p>
//           </div>
//           <label style={{ 
//             position: 'relative', 
//             display: 'inline-block', 
//             width: '50px', 
//             height: '25px' 
//           }}>
//             <input
//               type="checkbox"
//               checked={systemSettings.maintenanceMode}
//               onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
//               style={{ display: 'none' }}
//             />
//             <span style={{
//               position: 'absolute',
//               cursor: 'pointer',
//               top: 0,
//               left: 0,
//               right: 0,
//               bottom: 0,
//               backgroundColor: systemSettings.maintenanceMode ? '#dc3545' : '#ccc',
//               borderRadius: '25px',
//               transition: '0.3s',
//             }}>
//               <span style={{
//                 position: 'absolute',
//                 content: '',
//                 height: '19px',
//                 width: '19px',
//                 left: systemSettings.maintenanceMode ? '28px' : '3px',
//                 bottom: '3px',
//                 backgroundColor: 'white',
//                 borderRadius: '50%',
//                 transition: '0.3s',
//               }} />
//             </span>
//           </label>
//         </div>

//         <button type="submit" className="submit-btn">
//           حفظ إعدادات النظام
//         </button>
//       </form>
//     </div>
//   );

//   return (
//     <div className="page-container">
//       <div className="page-header">
//         <h1>الإعدادات</h1>
//         <p>إدارة إعدادات النظام والملف الشخصي</p>
//       </div>

//       <div style={{ marginBottom: '20px' }}>
//         <div style={{ 
//           display: 'flex', 
//           background: 'white', 
//           borderRadius: '10px',
//           boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
//           overflow: 'hidden'
//         }}>
//           <button
//             onClick={() => setActiveTab('profile')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'profile' ? '#667eea' : 'transparent',
//               color: activeTab === 'profile' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             الملف الشخصي
//           </button>
//           <button
//             onClick={() => setActiveTab('notifications')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'notifications' ? '#667eea' : 'transparent',
//               color: activeTab === 'notifications' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             الإشعارات
//           </button>
//           <button
//             onClick={() => setActiveTab('system')}
//             style={{
//               flex: 1,
//               padding: '15px 20px',
//               border: 'none',
//               background: activeTab === 'system' ? '#667eea' : 'transparent',
//               color: activeTab === 'system' ? 'white' : '#333',
//               cursor: 'pointer',
//               fontSize: '1rem',
//               transition: 'all 0.3s ease'
//             }}
//           >
//             النظام
//           </button>
//         </div>
//       </div>

//       {activeTab === 'profile' && renderProfileTab()}
//       {activeTab === 'notifications' && renderNotificationTab()}
//       {activeTab === 'system' && renderSystemTab()}
//     </div>
//   );
// };

// export default Settings;