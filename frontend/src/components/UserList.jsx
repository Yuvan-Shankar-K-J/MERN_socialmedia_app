import React from 'react';

const UserList = ({ users, selectedUserIds, toggleUser }) => (
  <ul style={{ listStyle: 'none', padding: 0 }}>
    {users.map(user => (
      <li key={user._id} style={{ padding: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          checked={selectedUserIds.includes(user._id)}
          onChange={() => toggleUser(user._id)}
          style={{ marginRight: 8 }}
        />
        <img
          src={user.avatar}
          alt={user.name}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #b721ff', background: '#fff', objectFit: 'cover' }}
        />
        <span>{user.name}</span>
      </li>
    ))}
  </ul>
);

export default UserList;
